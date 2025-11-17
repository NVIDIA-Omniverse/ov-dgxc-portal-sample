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
  Anchor,
  Breadcrumbs,
  Flex,
  Loader,
  Pagination,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { NavLink, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import LoaderError from "../components/LoaderError";
import SessionDuration from "../components/SessionDuration";
import SessionStatus from "../components/SessionStatus";
import SessionStatusFilter from "../components/SessionStatusFilter";
import SessionTerminateButton from "../components/SessionTerminateButton";
import { useConfig } from "../hooks/useConfig";
import { getSessions, StreamingSession } from "../state/Sessions";

/**
 * The web page to see a list of streaming sessions.
 * Can filter sessions based on the current status (active, idle, stopped, connecting).
 * System administrators can see all sessions started by other users.
 *
 * For each active session displays a terminate button that allows users to
 * forcefully close the user connection.
 */
export default function UserSessionList() {
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
        <Title c={"gray"}>Sessions</Title>

        <Breadcrumbs>
          <Anchor component={NavLink} to="/">
            Main page
          </Anchor>
          <Anchor component={NavLink} to="/sessions">
            Sessions
          </Anchor>
        </Breadcrumbs>

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
                <SessionStatusFilter
                  value={status as StreamingSession["status"]}
                  onChange={updateStatus}
                />
              </Flex>

              <Table withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th maw={300}>#</Table.Th>
                    <Table.Th>App</Table.Th>
                    <Table.Th>User</Table.Th>
                    <Table.Th w={125}>Status</Table.Th>
                    <Table.Th>Start date</Table.Th>
                    <Table.Th>End date</Table.Th>
                    <Table.Th>Duration</Table.Th>
                    <Table.Th></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data?.items.map((session) => (
                    <Table.Tr key={session.id} h={50}>
                      <Table.Td fz={"xs"} maw={300}>
                        <Text
                          fz={"xs"}
                          maw={300}
                          truncate={"end"}
                          title={session.id}
                        >
                          {session.id}
                        </Text>
                      </Table.Td>
                      <Table.Td fz={"xs"}>
                        {session.app ? (
                          <Anchor component={NavLink} fz={"xs"} to={`/app/${session.app.id}`}>
                            {session.app.productArea} {session.app.title}{" "}
                            {session.app.version}
                          </Anchor>
                        ) : (
                          "(unknown)"
                        )}{" "}
                      </Table.Td>
                      <Table.Td fz={"xs"}>{session.userName}</Table.Td>
                      <Table.Td>
                        <SessionStatus status={session.status} />
                      </Table.Td>
                      <Table.Td fz={"xs"}>
                        {session.startDate.toLocaleString()}
                      </Table.Td>
                      <Table.Td fz={"xs"}>
                        {session.endDate
                          ? session.endDate.toLocaleString()
                          : ""}
                      </Table.Td>
                      <Table.Td fz={"xs"}>
                        <SessionDuration session={session} />
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
