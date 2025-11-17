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
  Group,
  Image,
  Loader,
  Stack,
  Table,
  Title,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Navigate, NavLink, useParams } from "react-router-dom";
import Header from "../components/Header";
import LoaderError from "../components/LoaderError";
import { useConfig } from "../hooks/useConfig";
import { getStreamingApp } from "../state/Apps";

export default function AppInfo() {
  const config = useConfig();
  const { appId = "" } = useParams<{ appId: string }>();

  const { isLoading, data, error } = useQuery({
    queryKey: ["streaming-app", appId],
    queryFn: async () =>
      await getStreamingApp({
        appId,
        config,
      }),
  });

  if (isLoading) {
    return (
      <Stack>
        <Header />
        <Loader />
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack>
        <Header />
        <LoaderError title={"Failed to load application info"}>
          {error.message}
        </LoaderError>
      </Stack>
    );
  }

  if (!data) {
    return <Navigate to={"/"} />;
  }

  return (
    <Stack>
      <Header />
      <Stack px={"xl"} py={"md"}>
        <Title c={"gray"}>
          <Group>
            <Image src={data.icon} w={64} h={64} title={data.title} />
            {data.title}
          </Group>
        </Title>

        <Breadcrumbs>
          <Anchor component={NavLink} to="/">
            Main page
          </Anchor>
          <Anchor component={NavLink} to="/sessions">
            Sessions
          </Anchor>
          <Anchor component={NavLink} to={`/app/${appId}`}>
            {data.title}
          </Anchor>
        </Breadcrumbs>

        <Table variant={"vertical"} withTableBorder>
          <Table.Tbody>
            <Table.Tr>
              <Table.Th w={150}>Version</Table.Th>
              <Table.Td>{data.latestVersion.name}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th>Category</Table.Th>
              <Table.Td>{data.category}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th>Product area</Table.Th>
              <Table.Td>{data.productArea}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th>Function ID</Table.Th>
              <Table.Td>{data.latestVersion.functionId}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th>Function version</Table.Th>
              <Table.Td>{data.latestVersion.functionVersionId}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th>Authentication type</Table.Th>
              <Table.Td>{data.authType ?? "NONE"}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Stack>
    </Stack>
  );
}
