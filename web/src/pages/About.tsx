/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
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
  Badge,
  Card,
  Divider,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconFileText,
  IconInfoCircle,
  IconSettings,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/Header";
import LoaderError from "../components/LoaderError";
import { useConfig } from "../hooks/useConfig";

export default function About() {
  const config = useConfig();

  const {
    isLoading,
    data: deployment,
    error,
  } = useQuery<DeploymentSettings>({
    queryKey: ["deployment-settings"],
    queryFn: async () => {
      const response = await fetch(
        `${config.endpoints.backend}/deployment/settings`,
      );
      if (!response.ok) {
        throw new Error(
          `Failed to load deployment settings: HTTP ${response.status}`,
        );
      }
      return response.json();
    },
  });

  return (
    <Stack>
      <Header />
      <Stack px={"xl"} py={"md"}>
        <Title c={"gray"}>About</Title>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Card withBorder>
            <Stack flex={"1"}>
              <Group gap={"xs"}>
                <IconInfoCircle size={20} />
                <Title order={4}>Information</Title>
              </Group>

              <Divider />

              <Stack gap={"sm"} flex={"1"}>
                {config.userInterface.version && (
                  <Group justify={"space-between"}>
                    <Text size={"sm"}>Deployment Version</Text>
                    <Text size={"sm"}>v{config.userInterface.version}</Text>
                  </Group>
                )}
                <Group justify={"space-between"}>
                  <Text size={"sm"}>@nvidia/ov-web-rtc</Text>
                  <Text size={"sm"}>v{__OV_WEB_RTC_VERSION__}</Text>
                </Group>

                <Divider />

                <Anchor
                  href={"/ATTRIBUTIONS.md"}
                  target={"_blank"}
                  size={"sm"}
                  mt={"auto"}
                >
                  <Group gap={6}>
                    <IconFileText size={16} />
                    Third-Party Attributions
                  </Group>
                </Anchor>
              </Stack>
            </Stack>
          </Card>

          <Card withBorder>
            <Stack>
              <Group gap={"xs"}>
                <IconSettings size={20} />
                <Title order={4}>Deployment Settings</Title>
              </Group>

              <Divider />

              {isLoading ? (
                <Loader size={"sm"} />
              ) : error ? (
                <LoaderError title={"Failed to load deployment settings"}>
                  {error.toString()}
                </LoaderError>
              ) : deployment ? (
                <Stack gap={"md"}>
                  <SettingRow
                    label={"Max App Instances"}
                    description={
                      "Maximum number of simultaneously running sessions per user per application."
                    }
                    value={deployment.max_app_instances_count}
                  />
                  <SettingRow
                    label={"Session TTL"}
                    description={
                      "Maximum session duration before automatic disconnect."
                    }
                    value={formatDuration(deployment.session_ttl)}
                  />
                  <SettingRow
                    label={"Idle Timeout"}
                    description={
                      "Time of inactivity before an idle session is stopped."
                    }
                    value={formatDuration(deployment.session_idle_timeout)}
                  />
                  <SettingRow
                    label={"Session Retention"}
                    description={
                      "How long stopped session data is kept before purging."
                    }
                    value={
                      deployment.session_retention_days === 0
                        ? "Disabled"
                        : `${deployment.session_retention_days} days`
                    }
                  />
                </Stack>
              ) : null}
            </Stack>
          </Card>
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}

interface SettingRowProps {
  label: string;
  value: string | number;
  description: string;
}

function SettingRow({ label, value, description }: SettingRowProps) {
  return (
    <Group justify={"space-between"} wrap={"nowrap"} align={"start"}>
      <Stack gap={2} flex={1}>
        <Text size={"sm"}>{label}</Text>
        <Text size={"xs"} c={"dimmed"}>
          {description}
        </Text>
      </Stack>
      <Badge variant={"light"} color={"gray"} size={"lg"} radius={"sm"}>
        {value}
      </Badge>
    </Group>
  );
}

interface DeploymentSettings {
  max_app_instances_count: number;
  session_ttl: number;
  session_idle_timeout: number;
  session_retention_days: number;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}
