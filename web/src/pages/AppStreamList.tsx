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

import {
  Button,
  Center,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Table,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconDeviceDesktop } from "@tabler/icons-react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { Navigate, NavLink, useLocation, useParams, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import LoaderError from "../components/LoaderError";
import Placeholder from "../components/Placeholder";
import SessionDuration from "../components/SessionDuration";
import SessionStatus from "../components/SessionStatus";
import SessionTerminateButton from "../components/SessionTerminateButton";
import { useConfig } from "../hooks/useConfig";
import useStreamStart, {
  streamStartNotification,
} from "../hooks/useStreamStart";
import { getSessions, StreamingSessionPage } from "../state/Sessions";
import useNucleusSession from "@omniverse/auth/react/hooks/NucleusSession";
import { AuthenticationType, getStreamingApp } from "../state/Apps";
import { useCallbackRef } from "@mantine/hooks";
import { StreamLoader } from "../components/StreamLoader";
import { StreamError } from "../components/StreamError";

export default function AppStreamList() {
  const config = useConfig();
  const nucleus = useNucleusSession();
  const location = useLocation();
  const { appId = "" } = useParams<{ appId: string }>();

  const [searchParams] = useSearchParams();
  // Extract extra payload that could have been passed from a deep-link
  const payload = searchParams.get("payload") ?? "";

  const { data, isLoading, isError, error } = useQuery({
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

  const query = useQuery({
    queryKey: ["app-sessions", appId],
    queryFn: async () => {
      return await getSessions({ config, appId, status: "alive" });
    },
    enabled: !!appId,
  });

  function cancelStream() {
    window.close();
  }

  if (!appId) {
    cancelStream();
  }

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

  if (data?.authType === AuthenticationType.nucleus && !nucleus.established) {
    const href = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/nucleus/authenticate?redirectAfter=${href}`}
      />
    );
  }

  return (
    <Stack gap={0} style={{ height: "100vh" }}>
      <Header />
      <Stack gap={0} style={{ position: "relative" }}>
        {query.isLoading ? (
          <StreamLoader />
        ) : query.isError ? (
          <LoaderError>{query.error.toString()}</LoaderError>
        ) : (
          <AppStreamListModal
            appId={appId}
            payload={payload}
            query={query}
            onSessionCancel={cancelStream}
          />
        )}
      </Stack>
    </Stack>
  );
}

function AppStreamListModal({
  appId,
  payload,
  query,
  onSessionCancel,
}: {
  appId: string;
  payload?: string;
  query: UseQueryResult<StreamingSessionPage>;
  onSessionCancel: () => void;
}) {
  const auth = useAuth();
  const streamStart = useStreamStart(appId, payload);
  const startNewSession = useCallbackRef(() => {
    notifications.show({
      id: streamStartNotification,
      message: "Starting a new streaming session...",
      loading: true,
      autoClose: 30000,
    });

    streamStart.mutate();
  });

  const reload = () => {
    window.location.reload();
  };

  const autoStart =
    query.isSuccess && !query.data.items.length && !streamStart.isError;

  useEffect(() => {
    if (autoStart) {
      startNewSession();
    }
  }, [autoStart, startNewSession]);

  if (autoStart || streamStart.isPending) {
    return <StreamLoader />;
  }

  if (streamStart.isError) {
    return (
      <StreamError
        disabled={streamStart.isPending}
        loading={streamStart.isPending}
        error={streamStart.error}
        onReload={reload}
        onStartNewSession={startNewSession}
      />
    );
  }

  return (
    <Modal
      centered
      closeOnEscape={false}
      closeOnClickOutside={false}
      opened
      size={"100vw"}
      title={"Sessions"}
      onClose={onSessionCancel}
    >
      <ScrollArea>
        <Center>
          {query.isLoading ? (
            <Loader />
          ) : query.isError ? (
            <LoaderError>{query.error.toString()}</LoaderError>
          ) : query.data && query.data.items.length > 0 ? (
            <Table withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>User</Table.Th>
                  <Table.Th w={125}>Status</Table.Th>
                  <Table.Th>Start date</Table.Th>
                  <Table.Th>End date</Table.Th>
                  <Table.Th>Duration</Table.Th>
                  <Table.Th w={280} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {query.data?.items.map((session) => (
                  <Table.Tr key={session.id} h={50}>
                    <Table.Td fz={"xs"}>{session.id}</Table.Td>
                    <Table.Td fz={"xs"}>{session.userName}</Table.Td>
                    <Table.Td>
                      <SessionStatus status={session.status} />
                    </Table.Td>
                    <Table.Td fz={"xs"}>
                      {session.startDate.toLocaleString()}
                    </Table.Td>
                    <Table.Td fz={"xs"}>
                      {session.endDate ? session.endDate.toLocaleString() : ""}
                    </Table.Td>
                    <Table.Td fz={"xs"}>
                      <SessionDuration session={session} />
                    </Table.Td>
                    <Table.Td>
                      <Group justify={"end"}>
                        {session.status === "IDLE" &&
                          session.userId === auth.user?.profile?.sub && (
                            <Button
                              component={NavLink}
                              to={`/app/${appId}/sessions/${session.id}`}
                            >
                              Reconnect
                            </Button>
                          )}
                        {session.status !== "STOPPED" && (
                          <SessionTerminateButton session={session} />
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Placeholder icon={<IconDeviceDesktop size={"100"} />}>
              You don&apos;t have any sessions at the moment.
            </Placeholder>
          )}
        </Center>
      </ScrollArea>

      <Group justify={"center"} mt={"md"}>
        <Button color={"green"} data-autofocus onClick={startNewSession}>
          New session
        </Button>
      </Group>
    </Modal>
  );
}
