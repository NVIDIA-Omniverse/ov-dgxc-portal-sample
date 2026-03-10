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
  ActionIcon,
  Card,
  Group,
  Image,
  Menu,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconAlertTriangle, IconChevronDown } from "@tabler/icons-react";
import type { SyntheticEvent } from "react";
import { ReactNode, useState } from "react";
import { AppStatus, StreamingApp, StreamingAppVersion } from "../state/Apps";
import { defaultResolutionKey } from "../state/StreamResolution";
import classes from "./ApplicationCard.module.css";
import StreamResolutionSelect from "./StreamResolutionSelect";

export interface ApplicationCardProps {
  app: StreamingApp;
}

export default function ApplicationCard({ app }: ApplicationCardProps) {
  const [selectedVersionId, setSelectedVersionId] = useState(app.latestVersion.id);
  const version = app.versions.find(v => v.id === selectedVersionId) ?? app.latestVersion;
  const setVersion = (v: StreamingAppVersion) => setSelectedVersionId(v.id);
  const isDegraded = version.status === AppStatus.Degraded;

  if (isDegraded) {
    return (
      <DegradedApplicationCard
        app={app}
        version={version}
        setVersion={setVersion}
      />
    );
  }

  return (
    <ActiveApplicationCard
      app={app}
      version={version}
      setVersion={setVersion}
    />
  );
}

interface ApplicationCardContentProps {
  app: StreamingApp;
  version: StreamingAppVersion;
  nameContent?: ReactNode;
  resolutionSelect?: ReactNode;
  setVersion: (version: StreamingAppVersion) => void;
}

function DegradedApplicationCard({
  app,
  version,
  setVersion,
}: ApplicationCardContentProps) {
  return (
    <Card
      component="div"
      radius={"sm"}
      classNames={{
        root: `${classes.applicationCard} ${classes.degraded}`,
      }}
      withBorder
      onClick={preventDefault}
    >
      <Group gap={0} justify={"space-between"} align={"justify"}>
        <ApplicationCardContent
          app={app}
          version={version}
          setVersion={setVersion}
          nameContent={
            <Group
              gap={"xs"}
              align="flex-start"
              wrap="nowrap"
              style={{ width: "100%" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <ApplicationName title={app.title} />
              </div>
              <Tooltip
                label="No instances of the application are currently available"
                withArrow
              >
                <div className={classes.degradedWarning}>
                  <IconAlertTriangle size={16} color="orange" />
                </div>
              </Tooltip>
            </Group>
          }
        />
      </Group>
    </Card>
  );
}

function ActiveApplicationCard({
  app,
  version,
  setVersion,
}: ApplicationCardContentProps) {
  const [resolution, setResolution] = useState(defaultResolutionKey);

  return (
    <Card
      component="a"
      href={`/app/${version.id}/sessions?resolution=${resolution}`}
      target={"_blank"}
      radius={"sm"}
      classNames={{
        root: classes.applicationCard,
      }}
      withBorder
    >
      <Group gap={0} justify={"space-between"} align={"justify"}>
        <ApplicationCardContent
          app={app}
          version={version}
          setVersion={setVersion}
          resolutionSelect={
            <StreamResolutionSelect
              value={resolution}
              onChange={setResolution}
            />
          }
        />
      </Group>
    </Card>
  );
}

function ApplicationCardContent({
  app,
  version,
  nameContent,
  resolutionSelect,
  setVersion,
}: ApplicationCardContentProps) {
  return (
    <>
      <Group
        gap={"sm"}
        justify={"space-between"}
        align={"flex-start"}
        p={"sm"}
        flex={"1"}
        style={{ overflow: "hidden" }}
      >
        <Image
          src={app.icon}
          width={64}
          height={64}
          title={app.title}
          className={classes.cardIcon}
        />
        <Stack gap={"3px"} flex={"1"} style={{ overflow: "hidden" }}>
          <Text
            size={"sm"}
            className={classes.cardProductArea}
            style={{ whiteSpace: "nowrap" }}
          >
            {app.productArea}
          </Text>
          {nameContent ?? <ApplicationName title={app.title} />}
          <Group gap={"xs"} justify="space-between" wrap="nowrap">
            {resolutionSelect ?? <span />}
            <Text
              size={"8pt"}
              c={"dark.2"}
              fw={"500"}
              className={classes.cardVersion}
              style={{ whiteSpace: "nowrap" }}
            >
              {version.name}
            </Text>
          </Group>
        </Stack>
      </Group>

      <Menu>
        <Menu.Target>
          <ActionIcon
            bg={"green"}
            h={"100px"}
            className={classes.cardMenu}
            style={{ pointerEvents: "auto" }}
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
            }}
          >
            <IconChevronDown size={"15px"} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          {app.versions.map((version) => (
            <Menu.Item key={version.id} onClick={() => setVersion(version)}>
              {version.name}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </>
  );
}

function ApplicationName({ title }: { title: string }) {
  return (
    <Text
      size={"20px"}
      className={classes.cardName}
      style={{
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        width: "100%",
        overflow: "hidden",
        lineHeight: "30px",
      }}
      title={title}
    >
      {title}
    </Text>
  );
}

function preventDefault(e: SyntheticEvent): void {
  e.preventDefault();
}
