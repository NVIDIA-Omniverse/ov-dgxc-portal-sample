import { notifications } from "@mantine/notifications";
import {
  AppStreamer,
  DirectConfig,
  eAction,
  eStatus,
  LogFormat,
  LogLevel,
  StreamEvent,
  StreamType,
} from "@nvidia/omniverse-webrtc-streaming-library";
import { useCallback, useEffect, useRef, useState } from "react";
import { Config } from "../providers/ConfigProvider";
import { StreamingApp } from "../state/Apps";
import { useConfig } from "./useConfig";
import useError from "./useError";
import useStreamStart, { streamStartNotification } from "./useStreamStart";

export interface UseStreamOptions {
  app: StreamingApp;
  sessionId: string;
  videoElementId?: string;
  audioElementId?: string;
}

export interface UseStreamResult {
  loading: boolean;
  error: Error | string;
  terminate: () => Promise<void>;
}

export default function useStream({
  app,
  sessionId,
  videoElementId = "stream-video",
  audioElementId = "stream-audio",
}: UseStreamOptions): UseStreamResult {
  const config = useConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useError();

  const initialized = useRef(false);

  const { mutate: startNewSession } = useStreamStart(app.id);
  const startNewSessionRef = useRef(startNewSession);
  startNewSessionRef.current = startNewSession;

  useEffect(() => {
    if (!sessionId) {
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

    const params = createStreamConfig(app, sessionId, config);

    async function connect() {
      try {
        const sessionExists = await checkSession(sessionId, config);
        if (!sessionExists) {
          notifications.show({
            id: streamStartNotification,
            message:
              "This session is no longer available, starting a new streaming session...",
            loading: true,
            autoClose: 20000,
          });

          return startNewSessionRef.current();
        }

        await AppStreamer.connect({
          streamSource: StreamType.NVCF,
          logLevel: LogLevel.DEBUG,
          logFormat: LogFormat.TEXT,
          streamConfig: {
            videoElementId,
            audioElementId,
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
      await connect();
    }

    void start();
    return () => {
      if (import.meta.env.PROD) {
        void AppStreamer.terminate();
      }
    };
  }, [app, sessionId, videoElementId, audioElementId, config, setError]);

  const terminate = useCallback(async () => {
    try {
      await AppStreamer.terminate(true);
    } catch (error) {
      setError(
        "info" in (error as StreamEvent)
          ? (error as StreamEvent).info
          : (error as Error),
      );
      console.error("Error terminating stream:", error);
    }
  }, [setError]);

  return {
    loading,
    error,
    terminate,
  };
}

async function checkSession(
  sessionId: string,
  config: Config,
): Promise<boolean> {
  const url = createStreamURL(sessionId, config);
  url.pathname += "/sign_in";

  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    console.error(`Failed to check the current streaming session:`, error);
    return false;
  }
}

/**
 * Creates URL parameters for streaming the application from NVCF.
 * Returns URLSearchParams instance with values that must be passed to streamConfig object in
 * the `urlLocation.search` field.
 *
 * @param app
 * @param sessionId
 * @param config
 * @returns {URLSearchParams}
 */
function createStreamConfig(
  app: StreamingApp,
  sessionId: string,
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

  // If specified, enables the private endpoint created in Azure
  if (app.mediaServer) {
    params.mediaServer = app.mediaServer;
    if (app.mediaPort) {
      params.mediaPort = app.mediaPort;
    }
  }

  const signalingURL = createStreamURL(sessionId, config);
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

/**
 * Constructs a URL object for streaming the specified NVCF function.
 *
 * @param sessionId
 * @param config
 * @returns {URL}
 */
function createStreamURL(sessionId: string, config: Config): URL {
  let backend = config.endpoints.backend;
  if (!backend.endsWith("/")) {
    backend += "/";
  }

  return new URL(`./sessions/${sessionId}`, backend);
}
