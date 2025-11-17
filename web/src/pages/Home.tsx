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

import { Card, Group, Loader, SimpleGrid, Stack, Title } from "@mantine/core";
import { IconAppWindow, IconTableFilled } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/Header";
import LoaderError from "../components/LoaderError";
import Placeholder from "../components/Placeholder";
import { useConfig } from "../hooks/useConfig";
import { getStreamingApps, StreamingApp } from "../state/Apps";
import { useSearchParams } from "react-router-dom";
import ApplicationCard from "../components/ApplicationCard";
import ApplicationPages from "../components/ApplicationPages";
import { comparePageOrder, getPages } from "../state/Pages";

/**
 * Displays applications available for streaming.
 * Hides applications that are currently inactive in NVCF.
 */
export default function Home() {
  const config = useConfig();

  const [searchParams] = useSearchParams();
  const {
    isLoading: isLoadingApps,
    data: appsByPages,
    error: appError,
  } = useQuery<Map<StreamingApp["page"], Set<StreamingApp>>>({
    queryKey: ["get-apps"],
    queryFn: async () => getStreamingApps({ config }),
  });

  const {
    isLoading: isLoadingPages,
    data: pages,
    error: pageError,
  } = useQuery({
    queryKey: ["get-pages"],
    queryFn: async () => getPages({ config }),
  });

  const pageNames = Array.from(appsByPages?.keys() ?? []).sort((a, b) => {
    const pageA = pages?.get(a);
    const pageB = pages?.get(b);
    return comparePageOrder(pageA, pageB);
  });

  const selectedPage = searchParams.get("page") ?? pageNames?.[0];

  const apps = selectedPage ? appsByPages?.get(selectedPage) : [];
  const categories = Array.from(apps?.values() ?? []).reduce(
    (categories, app) => {
      const categoryName = app.category ?? "";
      const category = categories[categoryName] ?? [];
      category.push(app);
      categories[categoryName] = category;
      return categories;
    },
    {} as Record<string, StreamingApp[]>,
  );

  const error = appError || pageError;
  return (
    <Stack>
      <Header />
      <Stack px={"xl"} py={"md"}>
        <Title c={"gray"}>{config.userInterface.title}</Title>
        {isLoadingApps || isLoadingPages ? (
          <Loader />
        ) : error ? (
          <LoaderError title={"Failed to load streaming applications"}>
            {error.toString()}
          </LoaderError>
        ) : appsByPages?.size ? (
          <Group align={"start"} justify={"stretch"} wrap={"nowrap"}>
            <ApplicationPages pages={pageNames} selectedPage={selectedPage} />
            <Stack flex={1}>
              {Object.entries(categories).map(([category, apps]) => (
                <Card key={category} flex={1} radius={0} withBorder>
                  <Stack gap={"lg"}>
                    {category && (
                      <Group
                        gap={"xs"}
                        pb={"3px"}
                        style={{ borderBottom: "2px solid gray" }}
                      >
                        <IconTableFilled />
                        <Title order={2}>{category}</Title>
                      </Group>
                    )}

                    <SimpleGrid cols={{ xs: 1, sm: 2, lg: 3 }}>
                      {apps.map((app) => (
                        <ApplicationCard key={app.id} app={app} />
                      ))}
                    </SimpleGrid>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Group>
        ) : (
          <Placeholder
            icon={<IconAppWindow size={"100"} color={"currentColor"} />}
          >
            No streaming applications are currently available.
          </Placeholder>
        )}
      </Stack>
    </Stack>
  );
}
