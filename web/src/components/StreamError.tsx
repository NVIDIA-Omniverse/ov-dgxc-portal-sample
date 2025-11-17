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

import { Button, Group } from "@mantine/core";
import LoaderError from "./LoaderError";

export interface StreamErrorProps {
  disabled?: boolean;
  loading?: boolean;
  error?: Error | string | null;
  title?: string;
  onReload?: () => void;
  onStartNewSession?: () => void;
}

export function StreamError({
  disabled,
  loading,
  error,
  title = "Failed to load the stream",
  onReload,
  onStartNewSession,
}: StreamErrorProps) {
  return (
    <LoaderError title={title}>
      {error?.toString()}

      <Group mt={"md"}>
        <Button
          variant={"white"}
          disabled={disabled}
          loading={loading}
          onClick={onReload}
        >
          Reload
        </Button>
        <Button
          variant={"white"}
          disabled={disabled}
          loading={loading}
          onClick={onStartNewSession}
        >
          Start a new session
        </Button>
      </Group>
    </LoaderError>
  );
}
