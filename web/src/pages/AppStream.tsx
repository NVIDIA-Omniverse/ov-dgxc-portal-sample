import { ActionIcon, Box, Flex, Loader, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import useNucleusSession from "@omniverse/auth/react/hooks/NucleusSession";
import { IconAlertTriangle, IconMaximize, IconMinimize, IconX } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import LoaderError from "../components/LoaderError";
import SessionReportDialog from "../components/SessionReportDialog";
import { useConfig } from "../hooks/useConfig";
import useStream from "../hooks/useStream";
import useStreamEndNotification from "../hooks/useStreamEndNotification";
import useStreamStart from "../hooks/useStreamStart";
import { AuthenticationType, getStreamingApp, StreamingApp } from "../state/Apps";
import { StreamLoader } from "../components/StreamLoader";
import { StreamError } from "../components/StreamError";

/**
 * Loads the information about the application with the specified ID
 * and specified session and starts the stream.
 *
 * If application requires Nucleus authentication, verifies that Nucleus session is established,
 * otherwise redirects the user to the Nucleus login form.
 */
export default function AppStream() {
  const { appId = "", sessionId = "" } = useParams<{
    appId: string;
    sessionId: string;
  }>();
  const config = useConfig();
  const nucleus = useNucleusSession();

  const { isLoading, data, isError, error } = useQuery({
    queryKey: ["streaming-app", appId],
    queryFn: async () =>
      await getStreamingApp({
        appId,
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
        <Stack gap={0} style={{ position: "relative" }}>
          <StreamLoader />
        </Stack>
      </Stack>
    );
  }

  if (isError) {
    return (
      <Stack gap={0} style={{ height: "100vh" }}>
        <Header />
        <LoaderError title={"Failed to load the stream"}>
          {error.toString()}
        </LoaderError>
      </Stack>
    );
  }

  if (data) {
    if (data.authType === AuthenticationType.nucleus) {
      if (!nucleus.established) {
        return (
          <Navigate
            to={`/nucleus/authenticate?redirectAfter=/app/${appId}/sessions/${sessionId}`}
          />
        );
      } else if (!nucleus.accessToken) {
        return (
          <Stack gap={0} style={{ height: "100vh" }}>
            <Header />
            <Stack gap={0} style={{ position: "relative" }}>
              <Loader m={"sm"} />
            </Stack>
          </Stack>
        );
      }
    }
    return <AppStreamSession app={data} sessionId={sessionId} />;
  }

  return (
    <Stack gap={0} style={{ height: "100vh" }}>
      <Header />
      <LoaderError title={"Failed to load the stream"}>
        Application not found.
      </LoaderError>
    </Stack>
  );
}

interface StreamSessionProps {
  app: StreamingApp;
  sessionId: string;
}

function AppStreamSession({ app, sessionId }: StreamSessionProps) {
  const navigate = useNavigate();
  const stream = useStream({ app, sessionId });
  const streamStart = useStreamStart(app.id);
  useStreamEndNotification(sessionId);

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
    await streamStart.mutateAsync();
    window.location.reload();
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

          {stream.loading && <StreamLoader />}
          {stream.error || streamStart.error ? (
            <StreamError
              disabled={streamStart.isPending}
              loading={streamStart.isPending}
              error={stream.error || streamStart.error}
              onReload={reload}
              onStartNewSession={() => void startNewSession()}
            />
          ) : null}
        </Box>
      </Stack>

      <SessionReportDialog
        sessionId={sessionId}
        opened={reportOpened}
        onClose={closeReport}
      />
    </Stack>
  );
}
