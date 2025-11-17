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

import { notifications } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";
import { startSession } from "../state/Sessions";
import { useConfig } from "./useConfig";

/**
 * Starts the streaming session.
 * @param appId The unique identifier of the application that needs to be started.
 * @param payload The payload from a deep-link that will be passed to the stream.
 */
export default function useStreamStart(appId: string, payload?: string) {
  const config = useConfig();
  return useMutation({
    mutationFn: async () => {
      return await startSession({ config, appId });
    },
    retry: (failureCount) => {
      showStreamWarning();
      return failureCount < 3;
    },
    onSuccess: (session) => {
      let href =  `/app/${appId}/sessions/${session.id}`;
      if (payload) {
        href += `?payload=${payload}`;
      }
      window.location.href = href;
    },
    onError: (error) => {
      console.error("Failed to start a stream:", error);
      notifications.hide(streamStartNotification);
    },
  });
}

export function showStreamWarning() {
  notifications.hide(streamStartNotification);
  notifications.show({
    id: streamStartNotification,
    loading: true,
    title: "",
    message:
      "Connecting to a streaming session is taking longer than expected, please wait...",
    autoClose: 30000,
  });
}

export const streamStartNotification = "stream-start";
