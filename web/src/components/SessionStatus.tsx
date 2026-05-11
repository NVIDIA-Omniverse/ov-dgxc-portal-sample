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
  Badge,
  BadgeProps,
  CopyButton,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { StreamingSession } from "../state/Sessions";

export interface SessionStatusProps {
  status: StreamingSession["status"];
  /**
   * Optional error message recorded against the session. When present and
   * the status is `FAILED`, an inline copy button is rendered next to the
   * status badge so users / administrators can grab the message quickly.
   */
  error?: StreamingSession["error"];
}

export default function SessionStatus({ status, error }: SessionStatusProps) {
  const showCopyError = status === "FAILED" && !!error;

  return (
    <Badge
      color={getStatusColor(status)}
      pr={showCopyError ? 4 : undefined}
      rightSection={
        showCopyError ? <CopyErrorButton error={error ?? ""} /> : undefined
      }
    >
      {status}
    </Badge>
  );
}

function CopyErrorButton({ error }: { error: string }) {
  return (
    <CopyButton value={error} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip
          label={copied ? "Copied" : "Copy error"}
          withArrow
          position={"right"}
        >
          <ActionIcon
            color={"white"}
            size={"xs"}
            variant={"transparent"}
            aria-label={"Copy error"}
            onClick={(event) => {
              event.stopPropagation();
              copy();
            }}
          >
            {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
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
    case "EXPIRED":
      return "gray";
    case "FAILED":
      return "red";
    default:
      return "gray";
  }
}
