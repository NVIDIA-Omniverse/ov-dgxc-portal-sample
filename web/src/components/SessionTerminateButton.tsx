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

import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConfig } from "../hooks/useConfig";
import { StreamingSession, terminateSession } from "../state/Sessions";

export interface SessionTerminateButtonProps {
  session: StreamingSession;
}

export default function SessionTerminateButton({
  session,
}: SessionTerminateButtonProps) {
  const config = useConfig();
  const queryClient = useQueryClient();

  const { isPending, mutate: terminate } = useMutation({
    mutationFn: async () => {
      if (
        confirm(
          `Are you sure you want to terminate session ${session.id}? This will disconnect the stream if it's active. All unsaved work will be lost.`,
        )
      ) {
        try {
          await terminateSession({ config, sessionId: session.id });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : error?.toString?.() ?? "";

          notifications.show({
            title: "Failed to terminate session",
            message,
            color: "red",
            autoClose: 20000,
          });
        }
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["app-sessions"] });
    }
  });

  return (
    <Button color={"red"} loading={isPending} onClick={() => terminate()}>
      Terminate
    </Button>
  );
}
