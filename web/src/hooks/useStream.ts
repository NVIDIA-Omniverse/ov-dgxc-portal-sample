import {
  AppStreamer,
  DirectConfig,
  eAction,
  eStatus,
  StreamEvent,
} from "@nvidia/omniverse-webrtc-streaming-library";
import Cookies from "js-cookie";
import { useCallback, useEffect, useRef, useState } from "react";
import { Config } from "../providers/ConfigProvider.tsx";
import { useConfig } from "./useConfig.ts";
import useError from "./useError.ts";

export interface UseStreamOptions {
  functionId: string;
  functionVersionId: string;
  videoElementId?: string;
  audioElementId?: string;
}

export interface UseStreamResult {
  loading: boolean;
  error: Error | string;
  terminate: () => Promise<void>;
}

export default function useStream({
  functionId,
  functionVersionId,
  videoElementId = "stream-video",
  audioElementId = "stream-audio",
}: UseStreamOptions): UseStreamResult {
  const config = useConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useError();

  const initialized = useRef(false);

  useEffect(() => {
    if (!functionId || !functionVersionId) {
      return;
    }

    if (initialized.current) {
      return;
    }

    initialized.current = true;

    setLoading(true);
    setError("");

    function onStart(message: StreamEvent) {
      console.log("onStart", message);

      if (message.action === eAction.start) {
        setLoading(false);

        if (message.status === eStatus.success) {
          const video = document.getElementById(
            videoElementId,
          ) as HTMLVideoElement;

          video.play().catch((error) => {
            setError(error as Error);
          });
        } else if (message.status === eStatus.error) {
          setError(message.info || "Unknown error.");
        }
      }
    }

    function onStop(message: StreamEvent) {
      console.log("onStop", message);
    }

    function onTerminate(message: StreamEvent) {
      console.log("onTerminate", message);
    }

    function onUpdate(message: StreamEvent) {
      console.log("onUpdate", message);
    }

    function onCustomEvent(message: StreamEvent) {
      console.log("onCustomEvent", message);
    }

    const params = createStreamConfig(functionId, functionVersionId, config);

    async function connect() {
      try {
        await AppStreamer.connect({
          streamSource: "direct",
          streamConfig: {
            videoElementId,
            audioElementId,
            authenticate: false,
            maxReconnects: 0,
            nativeTouchEvents: true,
            ...params,
            onStart,
            onStop,
            onTerminate,
            onUpdate,
            onCustomEvent,
          },
        });
      } catch (error) {
        setError(
          "info" in (error as StreamEvent)
            ? (error as StreamEvent).info
            : (error as Error),
        );
        setLoading(false);
      }
    }

    async function start() {
      console.log("Start streaming...");
      const sessionId = Cookies.get("nvcf-request-id");
      if (!sessionId) {
        const response = await fetch(constructSessionControlURL(params), {
          method: "POST",
        });
        if (!response.ok) {
          const message = await response.text();
          setError(message);
          setLoading(false);
          return;
        }
      }
      await connect();
    }

    void start();
    return () => {
      if (import.meta.env.PROD) {
        void AppStreamer.terminate();
      }
    };
  }, [
    functionId,
    functionVersionId,
    videoElementId,
    audioElementId,
    config,
    setError,
  ]);

  const terminate = useCallback(async () => {
    const params = createStreamConfig(functionId, functionVersionId, config);
    const response = await fetch(constructSessionControlURL(params), {
      method: "DELETE",
    });
    if (!response.ok) {
      const message = await response.text();
      setError(message);
      setLoading(false);
      return;
    }

    await AppStreamer.terminate();
  }, [functionId, functionVersionId, config, setError]);

  return {
    loading,
    error,
    terminate,
  };
}

/**
 * Creates URL parameters for streaming the application from NVCF.
 * Returns URLSearchParams instance with values that must be passed to streamConfig object in
 * the `urlLocation.search` field.
 *
 * @param functionId
 * @param functionVersionId
 * @param config
 * @returns {URLSearchParams}
 */
function createStreamConfig(
  functionId: string,
  functionVersionId: string,
  config: Config,
): Partial<DirectConfig> {
  const params: DirectConfig = {
    width: 1920,
    height: 1080,
    fps: 60,
    mic: false,
    cursor: "free",
    autoLaunch: true,

    // Specifies that the default streaming endpoint must not be used.
    // Enables signaling parameters for the component.
    server: "",
  };

  let backend = config.endpoints.backend;
  if (!backend.endsWith("/")) {
    backend += "/";
  }

  const signalingURL = new URL(
    `./sessions/${functionId}/${functionVersionId}`,
    backend,
  );
  params.signalingServer = signalingURL.hostname;
  params.signalingPort = signalingURL.port
    ? Number(signalingURL.port)
    : signalingURL.protocol === "https:"
      ? 443
      : 80;
  params.signalingPath = signalingURL.pathname;
  params.signalingQuery = signalingURL.searchParams;
  return params;
}

function constructSessionControlURL(params: Partial<DirectConfig>): string {
  return `https://${params.signalingServer}:${params.signalingPort}${params.signalingPath}/sign_in?${params.signalingQuery?.toString() ?? ""}`;
}
