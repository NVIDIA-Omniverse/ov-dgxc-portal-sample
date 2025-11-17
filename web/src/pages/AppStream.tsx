/*
 * SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

import { ActionIcon, Box, Flex, Loader, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import useNucleusSession from "@omniverse/auth/react/hooks/NucleusSession";
import {
  IconAlertTriangle,
  IconMaximize,
  IconMinimize,
  IconX,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import Header from "../components/Header";
import LoaderError from "../components/LoaderError";
import SessionReportDialog from "../components/SessionReportDialog";
import { useConfig } from "../hooks/useConfig";
import useStream from "../hooks/useStream";
import useStreamEndNotification from "../hooks/useStreamEndNotification";
import useStreamStart from "../hooks/useStreamStart";
import {
  AuthenticationType,
  getStreamingApp,
  StreamingApp,
} from "../state/Apps";
import { StreamLoader } from "../components/StreamLoader";
import { StreamError } from "../components/StreamError";
import { useLatencyIndicator } from "../hooks/useLatencyIndicator";
import { StreamLatencyIndicator } from "../components/StreamLatencyIndicator";

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

  const location = useLocation();

  const [searchParams] = useSearchParams();
  // Extract extra payload that could have been passed from a deep-link
  const payload = searchParams.get("payload") ?? "";

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
        const to = `${location.pathname}${location.search}`;
        return <Navigate to={`/nucleus/authenticate?redirectAfter=${to}`} />;
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
    return (
      <AppStreamSession app={data} payload={payload} sessionId={sessionId} />
    );
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
  payload?: string;
  sessionId: string;
}

function AppStreamSession({ app, payload, sessionId }: StreamSessionProps) {
  const navigate = useNavigate();

  const [rtd, recordRtd] = useLatencyIndicator();
  const stream = useStream({
    app,
    payload,
    sessionId,
    onStreamStats: recordRtd,
  });
  const streamStart = useStreamStart(app.id, payload);
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
          <StreamLatencyIndicator rtd={rtd} style={{ marginRight: "auto" }} />

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
