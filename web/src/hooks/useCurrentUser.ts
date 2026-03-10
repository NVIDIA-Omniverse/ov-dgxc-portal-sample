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

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useConfig } from "./useConfig";
import { HttpError } from "../util/Errors";
import { fromSnakeCaseSchema } from "../util/Schemas";
import { Config } from "../providers/ConfigProvider";

export function useCurrentUser() {
  const config = useConfig();
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => fetchCurrentUser(config),
    staleTime: 5 * 60 * 1000,
  });
}

const CurrentUser = fromSnakeCaseSchema(
  z.object({
    isAdmin: z.boolean(),
  }),
);

export type CurrentUser = z.infer<typeof CurrentUser>;

async function fetchCurrentUser(config: Config): Promise<CurrentUser> {
  const response = await fetch(`${config.endpoints.backend}/users/me`);
  if (response.ok) {
    const body: unknown = await response.json();
    return await CurrentUser.parseAsync(body);
  }
  const text = await response.text();
  throw new HttpError(
    `Failed to load current user -- HTTP${response.status}.\n${text}`,
    response.status,
  );
}

