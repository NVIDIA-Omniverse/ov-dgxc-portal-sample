import {
  Badge,
  BadgeProps,
  Loader,
  Pagination,
  Stack,
  Table,
  Title,
  Text,
  Flex,
  Select,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import Header from "../components/Header.tsx";
import LoaderError from "../components/LoaderError.tsx";
import SessionTerminateButton from "../components/SessionTerminateButton.tsx";
import { useConfig } from "../hooks/useConfig.ts";
import { getSessions, StreamingSession } from "../state/Sessions.ts";

/**
 * The web page for system administrators to see a list of streaming sessions.
 * Can filter sessions based on the current status (active, idle, stopped, connecting).
 *
 * For each active session displays a terminate button that allows a system administrator to
 * forcefully close the user connection.
 */
export default function Admin() {
  const config = useConfig();

  const [params, setParams] = useSearchParams();
  const page = params.has("page") ? Number(params.get("page")) : 1;

  function updatePage(page: number) {
    params.set("page", page.toString());
    setParams(params);
  }

  const status = params.get("status") ?? "";

  function updateStatus(status: string | null) {
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    setParams(params);
  }

  const { isLoading, error, data } = useQuery({
    queryKey: ["sessions", page, status],
    queryFn: async () => getSessions({ config, page, status }),
  });

  return (
    <Stack>
      <Header />
      <Stack px={"xl"} py={"md"}>
        <Title c={"gray"}>Admin panel</Title>

        {isLoading ? (
          <Loader />
        ) : error ? (
          <LoaderError title={"Failed to load streaming applications"}>
            {error.toString()}
          </LoaderError>
        ) : (
          data && (
            <>
              <Flex py={"md"}>
                <Select
                  label={"Status"}
                  placeholder={"---"}
                  clearable
                  checkIconPosition={"right"}
                  data={["active", "stopped", "connecting", "idle"]}
                  value={status}
                  onChange={updateStatus}
                />
              </Flex>

              <Table withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={30}>#</Table.Th>
                    <Table.Th>App</Table.Th>
                    <Table.Th>Function ID</Table.Th>
                    <Table.Th>Function Version</Table.Th>
                    <Table.Th>User</Table.Th>
                    <Table.Th w={125}>Status</Table.Th>
                    <Table.Th>Start date</Table.Th>
                    <Table.Th>End date</Table.Th>
                    <Table.Th></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data?.items.map((session) => (
                    <Table.Tr key={session.id} h={50}>
                      <Table.Td w={50} fz={"xs"}>
                        <Text
                          truncate={"end"}
                          w={50}
                          fz={"xs"}
                          title={session.id}
                        >
                          {session.id}
                        </Text>
                      </Table.Td>
                      <Table.Td fz={"xs"}>
                        {session.app
                          ? `${session.app.productArea} ${session.app.title} ${session.app.version}`
                          : "(unknown)"}{" "}
                      </Table.Td>
                      <Table.Td fz={"xs"}>{session.functionId}</Table.Td>
                      <Table.Td fz={"xs"}>{session.functionVersionId}</Table.Td>
                      <Table.Td fz={"xs"}>{session.userName}</Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td fz={"xs"}>
                        {session.startDate.toLocaleString()}
                      </Table.Td>
                      <Table.Td fz={"xs"}>
                        {session.endDate
                          ? session.endDate.toLocaleString()
                          : ""}
                      </Table.Td>
                      <Table.Td>
                        {session.status !== "STOPPED" && (
                          <SessionTerminateButton session={session} />
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              <Pagination
                total={data.totalPages}
                value={data.page}
                withEdges
                onChange={updatePage}
              />
            </>
          )
        )}
      </Stack>
    </Stack>
  );
}

function getStatusColor(
  status: StreamingSession["status"],
): BadgeProps["color"] {
  switch (status) {
    case "ACTIVE":
      return "green";
    case "CONNECTING":
      return "blue";
    case "IDLE":
      return "orange";
    case "STOPPED":
      return "gray";
    default:
      return "red";
  }
}
