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
import { useCallback } from "react";
import { NavLink, useParams } from "react-router-dom";
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

export default function AppStreamList() {
  const config = useConfig();

  const { appId = "" } = useParams<{ appId: string }>();

  const query = useQuery({
    queryKey: ["app-sessions", appId],
    queryFn: async () => {
      const sessions = await getSessions({ config, appId, status: "alive" });
      if (!sessions.items.length) {
        startNewSession();
      }

      return sessions;
    },
    enabled: !!appId,
  });

  const streamStart = useStreamStart(appId);
  const startNewSession = useCallback(() => {
    notifications.show({
      id: streamStartNotification,
      message: "Starting a new streaming session...",
      loading: true,
      autoClose: 20000,
    });

    streamStart.mutate();
  }, [streamStart]);

  function cancelStream() {
    window.close();
  }

  if (!appId) {
    cancelStream();
  }

  return (
    <Stack>
      <Header />
      {query.isLoading || !query.data?.items?.length ? (
        <Loader mx={"md"} />
      ) : (
        <AppStreamListModal
          appId={appId}
          loading={streamStart.isPending}
          query={query}
          onSessionStart={startNewSession}
          onSessionCancel={cancelStream}
        />
      )}
    </Stack>
  );
}

function AppStreamListModal({
  appId,
  loading = false,
  query,
  onSessionStart,
  onSessionCancel,
}: {
  appId: string;
  loading?: boolean;
  query: UseQueryResult<StreamingSessionPage>;
  onSessionStart: () => void;
  onSessionCancel: () => void;
}) {
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
                        {session.status === "IDLE" && (
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
        <Button
          color={"green"}
          data-autofocus
          disabled={loading}
          loading={loading}
          onClick={onSessionStart}
        >
          New session
        </Button>
      </Group>
    </Modal>
  );
}
