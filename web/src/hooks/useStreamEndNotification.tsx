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
import { IconExclamationCircleFilled } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import {
  addSeconds,
  differenceInSeconds,
  formatDuration,
  interval,
  intervalToDuration,
} from "date-fns";
import { useEffect, useState } from "react";
import { getSession } from "../state/Sessions";
import { useConfig } from "./useConfig";

export default function useStreamEndNotification(sessionId: string) {
  const config = useConfig();

  const [notificationSent, setNotificationSent] = useState<boolean>(false);

  const { data: session } = useQuery({
    queryKey: ["sessions", sessionId],
    queryFn: async () => {
      return await getSession({ config, sessionId });
    },
  });

  useEffect(() => {
    if (!session || notificationSent) {
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = interval(
        now,
        addSeconds(session.startDate, config.sessions.maxTtl),
      );
      const diff = differenceInSeconds(remaining.end, remaining.start);
      if (diff - config.sessions.sessionEndNotificationTime <= 0) {
        const remainingDuration = formatDuration(
          intervalToDuration(remaining),
          {
            format: ["minutes", "seconds"],
            zero: false,
          },
        );
        const remainingText = diff <= 0 ? "soon" : `in ${remainingDuration}`;

        notifications.show({
          color: "yellow",
          icon: <IconExclamationCircleFilled />,
          title: "This session is going to end soon.",
          message: `The session will be closed ${remainingText}. Save your work to prevent lost changes.`,
          autoClose: config.sessions.sessionEndNotificationDuration * 1000,
        });

        setNotificationSent(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [config, session, notificationSent]);
}
