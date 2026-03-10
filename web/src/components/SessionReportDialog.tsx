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
  CopyButton,
  Dialog,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";

export interface SessionReportDialogProps {
  sessionId: string;
  opened: boolean;
  onClose: () => void;
}

export default function SessionReportDialog({
  sessionId,
  opened,
  onClose,
}: SessionReportDialogProps) {
  return (
    <Dialog
      opened={opened}
      withBorder
      withCloseButton
      size={"lg"}
      radius={"md"}
      onClose={onClose}
    >
      <Stack gap={"sm"}>
        <Text size={"sm"} fw={800} mr={"xl"}>
          You can report a problem with the current session to a system
          administrator with this info:
        </Text>

        <Stack gap={0}>
          <Group>
            <Text size={"sm"} fw={500} component={"span"}>
              Session ID:
            </Text>

            <CopyButton value={sessionId ?? ""} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip
                  label={copied ? "Copied" : "Copy session ID"}
                  withArrow
                  position="right"
                >
                  <ActionIcon
                    color={copied ? "teal" : "gray"}
                    size={"xs"}
                    variant="subtle"
                    onClick={copy}
                  >
                    {copied ? <IconCheck /> : <IconCopy size={14} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>

          <Text size={"sm"} component={"span"}>
            {sessionId || "<unknown>"}
          </Text>
        </Stack>
      </Stack>
    </Dialog>
  );
}
