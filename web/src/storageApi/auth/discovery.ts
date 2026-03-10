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
import { z } from "zod";
import { fromSnakeCaseSchema } from "../../util/Schemas";

export const DISCOVERY_CLIENT_NAME = "web-streaming-portal";

const DiscoveryAuthClientInfoSchema = fromSnakeCaseSchema(
  z.object({
    clientId: z.string(),
    scope: z.string(),
  }),
);

const DiscoveryAuthConfigSchema = fromSnakeCaseSchema(
  z.object({
    openidConfiguration: z.string(),
    clients: z.record(z.string(), DiscoveryAuthClientInfoSchema),
  }),
);

export type DiscoveryAuthConfig = z.infer<typeof DiscoveryAuthConfigSchema>;

/**
 * Calls USD Storage Discovery API and returns the authentication configuration
 * to connect to the identity provider.
 *
 * @param discovery USD Storage Discovery URL (host name).
 */
export async function getAuthConfig(
  discovery: string,
): Promise<DiscoveryAuthConfig> {
  const response = await fetch(`${discovery}/api/v1/auth-config`);
  const json: unknown = await response.json();
  return DiscoveryAuthConfigSchema.parse(json);
}

