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

import { Config } from "../providers/ConfigProvider";
import { HttpError } from "../util/Errors";

export interface GetPagesParams {
  config: Config;
}

export interface PublishingPage {
  name: string;
  order?: number;
}

export async function getPages({
  config,
}: GetPagesParams): Promise<Map<PublishingPage["name"], PublishingPage>> {
  const response = await fetch(`${config.endpoints.backend}/pages/`);
  if (response.ok) {
    const body = (await response.json()) as PublishingPage[];
    const result = new Map<PublishingPage["name"], PublishingPage>();
    for (const page of body) {
      result.set(page.name, page);
    }
    return result;
  }

  throw new HttpError(
    `Failed to load published pages -- HTTP${response.status}.\n${response.statusText}`,
    response.status,
  );
}

export function comparePageOrder(pageA?: PublishingPage, pageB?: PublishingPage): number {
  return (pageA?.order ?? Number.MAX_VALUE) - (pageB?.order ?? Number.MAX_VALUE);
}