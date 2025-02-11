import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Group,
  Loader,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import useNucleusSession from "@omniverse/auth/react/hooks/NucleusSession.ts";
import {
  IconAlertTriangle,
  IconMaximize,
  IconMinimize,
  IconX,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header.tsx";
import LoaderError from "../components/LoaderError.tsx";
import SessionReportDialog from "../components/SessionReportDialog.tsx";
import { useConfig } from "../hooks/useConfig.ts";
import useStream from "../hooks/useStream.ts";
import { AuthenticationType, getStreamingApp } from "../state/Apps.ts";
import { notifications } from "@mantine/notifications";

/**
 * Loads the information about the application with the specified function ID
 * and specified function version ID and starts the stream.
 *
 * If application requires Nucleus authentication, verifies that Nucleus session is established,
 * otherwise redirects the user to the Nucleus login form.
 */
export default function Stream() {
  const { id = "", version = "" } = useParams<{
    id: string;
    version: string;
  }>();
  const config = useConfig();
  const nucleus = useNucleusSession();

  const { isLoading, data, error } = useQuery({
    queryKey: ["streaming-app", id, version],
    queryFn: async () =>
      await getStreamingApp({
        functionId: id,
        functionVersionId: version,
        config,
      }),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  if (isLoading) {
    return (
      <Stack gap={0} style={{ height: "100vh" }}>
        <Header />
        <Loader m={"sm"} />
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack gap={0} style={{ height: "100vh" }}>
        <Header />
        <LoaderError title={"Failed to load the stream"}>
          {error.toString()}
        </LoaderError>
      </Stack>
    );
  }

  if (data?.authType === AuthenticationType.nucleus) {
    if (!nucleus.established) {
      return (
        <Navigate
          to={`/nucleus/authenticate?redirectAfter=/stream/${id}/${version}`}
        />
      );
    } else if (!nucleus.accessToken) {
      return (
        <Stack gap={0} style={{ height: "100vh" }}>
          <Header />
          <Loader m={"sm"} />
        </Stack>
      );
    }
  }

  return <StreamSession id={id} version={version} />;
}

interface StreamSessionProps {
  id: string;
  version: string;
}

function StreamSession({ id, version }: StreamSessionProps) {
  const navigate = useNavigate();
  const stream = useStream({ functionId: id, functionVersionId: version });

  const [fullScreen, setFullScreen] = useState(false);
  const videoElement = useRef<HTMLVideoElement>(null);

  const [reportOpened, { toggle: toggleReport, close: closeReport }] =
    useDisclosure();

  const auth = useAuth();
  useEffect(() => {
    if (!auth.isAuthenticated) {
      void stream.terminate();
    }
  }, [auth, stream]);

  async function toggleFullScreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }

    if (videoElement.current) {
      videoElement.current.click();
    }
  }

  useEffect(() => {
    const sync = () => {
      setFullScreen(document.fullscreenElement != null);
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  async function terminate() {
    if (confirm("Are you sure you want to terminate the streaming session?")) {
      notifications.show({
        message: "Stopping the streaming session...",
        loading: true,
      });

      try {
        await stream.terminate();
      } finally {
        window.close();
        navigate("/");
      }
    }
  }

  function reload() {
    window.location.reload();
  }

  async function startNewSession() {
    await stream.terminate();
    reload();
  }

  return (
    <Stack gap={0} style={{ height: "100vh" }}>
      {!fullScreen && <Header />}
      <Stack gap={0} flex={"1 0 auto"}>
        <Flex
          bg={"black.0"}
          p={"xs"}
          justify={"end"}
          gap={"xl"}
          style={{ borderTop: "1px solid #222" }}
        >
          <ActionIcon
            variant={"transparent"}
            color={"gray"}
            size={"16"}
            title={"Report issue"}
            onClick={() => void toggleReport()}
          >
            <IconAlertTriangle />
          </ActionIcon>

          <ActionIcon
            variant={"outline"}
            color={"gray"}
            size={"16"}
            title={"Toggle fullscreen"}
            onClick={() => void toggleFullScreen()}
          >
            {fullScreen ? <IconMinimize /> : <IconMaximize />}
          </ActionIcon>

          <ActionIcon
            variant={"outline"}
            color={"gray"}
            size={"16"}
            title={"Terminate"}
            onClick={() => void terminate()}
          >
            <IconX />
          </ActionIcon>
        </Flex>

        <Box
          style={{
            flex: "1 0 auto",
            position: "relative",
            boxSizing: "border-box",
          }}
        >
          {stream.loading && <Loader m={"sm"} />}
          {stream.error && (
            <LoaderError title={"Failed to load the stream"}>
              {stream.error.toString()}

              <Group mt={"md"}>
                <Button variant={"white"} onClick={reload}>
                  Reload
                </Button>
                <Button
                  variant={"white"}
                  onClick={() => void startNewSession()}
                >
                  Start a new session
                </Button>
              </Group>
            </LoaderError>
          )}
          <video
            id={"stream-video"}
            ref={videoElement}
            playsInline
            muted
            autoPlay
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
            }}
          />
          <audio id={"stream-audio"} muted />
        </Box>
      </Stack>

      <SessionReportDialog opened={reportOpened} onClose={closeReport} />
    </Stack>
  );
}
