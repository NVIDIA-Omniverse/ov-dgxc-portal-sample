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
  addSeconds,
  differenceInSeconds,
  Duration,
  formatDuration,
  interval,
  intervalToDuration,
} from "date-fns";
import { useConfig } from "../hooks/useConfig";
import { StreamingSession } from "../state/Sessions";

export interface SessionDurationProps {
  session: StreamingSession;
}

const DURATION_FORMAT: (keyof Duration)[] = ["days", "hours", "minutes"];

function formatSeconds(totalSeconds: number) {
  return formatDuration(intervalToDuration(interval(0, totalSeconds * 1000)), {
    format: DURATION_FORMAT,
  });
}

export default function SessionDuration({ session }: SessionDurationProps) {
  const config = useConfig();
  const now = new Date();

  const elapsedSeconds =
    session.status === "STOPPED"
      ? session.duration
      : differenceInSeconds(session.endDate ?? now, session.startDate);
  const duration = formatSeconds(elapsedSeconds);

  const remaining = interval(
    now,
    addSeconds(session.startDate, config.sessions.maxTtl),
  );
  const timeRemaining = formatDuration(
    intervalToDuration(
      interval(now, addSeconds(session.startDate, config.sessions.maxTtl)),
    ),
    { format: DURATION_FORMAT },
  );
  const diff = differenceInSeconds(remaining.end, remaining.start);
  return (
    <>
      {duration}
      {session.status !== "STOPPED" && diff > 0 && ` (${timeRemaining} left)`}
    </>
  );
}
