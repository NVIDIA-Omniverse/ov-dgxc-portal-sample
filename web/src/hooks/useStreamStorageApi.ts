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

import { useCallback, useRef } from "react";
import { z } from "zod";
import { fromSnakeCaseSchema } from "../util/Schemas";
import useStorageApiAuth from "./useStorageApiAuth";
import { User } from "oidc-client-ts";
import { AppStreamer } from "@nvidia/ov-web-rtc";

const StorageExtensionMessageSchema = fromSnakeCaseSchema(z.object({
  eventType: z.enum(["addNewStorageUrl", "requestTokenRefresh"]),
  payload: fromSnakeCaseSchema(z.object({
    discoveryUrl: z.string(),
  })),
}));

export interface UseStreamStorageApiResult {
  handleCustomEvent: (message: unknown) => Promise<void>;
}

/**
 * Bridges Storage API authentication with the streaming session.
 * - Tracks discovery URLs received during the session
 * - Handles `addNewStorageUrl` and `requestTokenRefresh` custom events from Kit
 * - Sends refreshed Storage API tokens to AppStreamer when they change
 * - Sends `authenticationError` back to the session on failure or timeout
 */
export default function useStreamStorageApi(): UseStreamStorageApiResult {
  const sendRefreshAccessTokenMessage = useCallback(async (discoveryUrl: string, accessToken: string) => {
    console.log(`Sending refreshed Storage API token to session for ${discoveryUrl}`);

    await AppStreamer.sendMessage({
      event_type: "refreshAccessToken",
      payload: {
        discovery_url: discoveryUrl,
        access_token: accessToken,
      },
    });
  }, []);

  const sendAuthenticationErrorMessage = useCallback(async (discoveryUrl: string, errorCode: string, errorMessage: string) => {
    console.error(`Sending authentication error to session for ${discoveryUrl}: [${errorCode}] ${errorMessage}`);

    await AppStreamer.sendMessage({
      event_type: "authenticationError",
      payload: {
        discovery_url: discoveryUrl,
        error_code: errorCode,
        error_message: errorMessage,
      },
    });
  }, []);

  const storageApiAuth = useStorageApiAuth({ onTokenRefreshed: sendRefreshAccessTokenMessage });
  const storageApiAuthRef = useRef(storageApiAuth);
  storageApiAuthRef.current = storageApiAuth;

  const handleCustomEvent = useCallback(async (message: unknown) => {
    const parseResult = StorageExtensionMessageSchema.safeParse(message);
    if (!parseResult.success) {
      return;
    }

    const { eventType, payload } = parseResult.data;
    const { discoveryUrl } = payload;

    console.log(`Received ${eventType} for ${discoveryUrl}`);

    async function handleStorageSignIn(discoveryUrl: string): Promise<User | null> {
      const user = await storageApiAuthRef.current.signIn(discoveryUrl);
      console.log(`Signed in to Storage API for ${discoveryUrl}`);
      return user;
    }

    try {
      if (eventType === "requestTokenRefresh") {
        const session = storageApiAuthRef.current.getSession(discoveryUrl);
        if (session?.isAuthenticated) {
          await session.renewToken();
        } else {
          console.log(`No session, falling back to interactive sign-in for ${discoveryUrl}`);
          await handleStorageSignIn(discoveryUrl);
        }
      } else if (eventType === "addNewStorageUrl") {
        await handleStorageSignIn(discoveryUrl);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await sendAuthenticationErrorMessage(discoveryUrl, "auth_error", errorMessage);
    }
  }, [sendAuthenticationErrorMessage]);

  return {
    handleCustomEvent,
  };
}
