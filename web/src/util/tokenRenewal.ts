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

import type { User } from "oidc-client-ts";

export type RenewTokenWithLockParams = {
  /** Name for the navigator lock to prevent duplicate renewals */
  lockName: string;
  /** Function to perform silent signin */
  signinSilent: () => Promise<User | null | undefined>;
  /** Callback when renewal succeeds with a user */
  onSuccess: (user: User) => void | Promise<void>;
  /** Optional callback when signinSilent returns no user or otherwise fails*/
  onFailure?: (error?: unknown) => void | Promise<void>;
  /** How long to hold the lock after successful renewal (default: 30 seconds) */
  cooldownMs?: number;
};

/**
 * Renews an access token using a lock to prevent duplicate renewals across tabs.
 * This is a common utility used by both portal auth and storage API auth.
 */
export async function renewTokenWithLock({
  lockName,
  signinSilent,
  onSuccess,
  onFailure,
  cooldownMs = 30 * 1000,
}: RenewTokenWithLockParams): Promise<void> {
  const uuid = crypto.randomUUID();
  const timestamp = () => new Date().toISOString();

  console.info(
    `[${timestamp()}] [${uuid}] [${lockName}] Token expiring, requesting renewal lock...`,
  );

  await navigator.locks.request(
    lockName,
    { mode: "exclusive", ifAvailable: true },
    async (lock) => {
      if (!lock) {
        console.info(
          `[${timestamp()}] [${uuid}] [${lockName}] Lock not available - another tab is renewing session`,
        );
        return;
      }

      console.info(
        `[${timestamp()}] [${uuid}] [${lockName}] Lock acquired - starting renewal...`,
      );

      try {
        const user = await signinSilent();
        if (user) {
          console.info(
            `[${timestamp()}] [${uuid}] [${lockName}] Session renewed successfully`,
          );

          await onSuccess(user);

          console.info(
            `[${timestamp()}] [${uuid}] [${lockName}] Hold the lock for ${cooldownMs / 1000} seconds to prevent duplicate renewals.`,
          );
          await new Promise((resolve) => setTimeout(resolve, cooldownMs));
        } else {
          console.warn(
            `[${timestamp()}] [${uuid}] [${lockName}] Silent renewal returned no user`,
          );
          await onFailure?.();
        }
      } catch (error) {
        console.error(
          `[${timestamp()}] [${uuid}] [${lockName}] Token renewal failed:`,
          error,
        );
        await onFailure?.(error);
      } finally {
        console.info(
          `[${timestamp()}] [${uuid}] [${lockName}] Renewal complete - releasing lock`,
        );
      }
    },
  );
}
