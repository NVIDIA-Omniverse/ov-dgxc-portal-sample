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

export interface StreamResolution {
  label: string;
  width: number;
  height: number;
}

export const streamResolutions: Record<string, StreamResolution> = {
  "720p": { label: "720p Stream", width: 1280, height: 720 },
  "1080p": { label: "1080p Stream", width: 1920, height: 1080 },
  "2k": { label: "2K Stream", width: 2560, height: 1440 },
  "4k": { label: "4K Stream", width: 3840, height: 2160 },
};

export const resolutionOptions = Object.entries(streamResolutions).map(
  ([value, { label }]) => ({ value, label }),
);

export const defaultResolutionKey = "1080p";

export function getResolution(key: string | null): StreamResolution {
  return streamResolutions[key ?? ""] ?? streamResolutions[defaultResolutionKey];
}
