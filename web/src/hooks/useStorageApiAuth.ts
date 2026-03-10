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

import { useCallback, useEffect, useRef } from "react";
import { User, UserManager, WebStorageStateStore } from "oidc-client-ts";
import { z } from "zod";
import { useConfig } from "./useConfig";
import type { Config } from "../providers/ConfigProvider";
import { DISCOVERY_CLIENT_NAME, getAuthConfig } from "../storageApi/auth/discovery";
import { StorageApiSession, type TokenRefreshedCallback, type TokenRefreshSource } from "../storageApi/auth/StorageApiSession";

export interface UseStorageApiAuthOptions {
  onTokenRefreshed?: TokenRefreshedCallback;
}

/**
 * Manages Storage API authentication state across multiple discovery URLs.
 *
 * This hook provides:
 * - Authentication state tracking for multiple Storage API servers
 * - Interactive sign-in via popup for new servers
 * - Automatic token renewal with silent refresh
 * - Cross-tab synchronization of authentication state
 * - Persistence of known discovery URLs across sessions
 *
 * @returns An object containing:
 *   - `getSession`: Function to get the session for a discovery URL
 *   - `signIn`: Function to initiate authentication for a discovery URL
 *   - `signInCallback`: Function to handle the OAuth callback
 */
export default function useStorageApiAuth(options: UseStorageApiAuthOptions = {}) {
  const config = useConfig();
  const configRef = useRef(config);
  configRef.current = config;

  const onTokenRefreshRef = useRef<TokenRefreshedCallback | undefined>(options.onTokenRefreshed);
  onTokenRefreshRef.current = options.onTokenRefreshed;

  const sessionsRef = useRef<Map<string, StorageApiSession>>(new Map());
  const channelRef = useRef<BroadcastChannel | null>(null);

  const handleTokenRefresh: TokenRefreshedCallback = useCallback(async (discovery, accessToken, source) => {
    console.log(`Handling token refresh for ${discovery}:`);
    await onTokenRefreshRef.current?.(discovery, accessToken, source);

    if (source !== "activated") {
      const message: BroadcastMessage = { type: "renewal", discovery };
      channelRef.current?.postMessage(message);
    }
  }, []);

  const activateSession = useCallback(
    (discovery: string, user: User, userManager: UserManager) => {
      console.log(`Activating session for ${discovery}`);
      let session = sessionsRef.current.get(discovery);

      if (!session) {
        session = new StorageApiSession(
          discovery,
          userManager,
          handleTokenRefresh,
        );
        sessionsRef.current.set(discovery, session);
      }

      session.activate(user);
    },
    [handleTokenRefresh],
  );

  const signIn = useCallback(
    async (discovery: string): Promise<User> => {
      const userManager = await createUserManager(discovery, configRef.current);
      const state: AuthState = { discovery };
      const user = await userManager.signinPopup({ state: btoa(JSON.stringify(state)) });

      activateSession(discovery, user, userManager);
      storeDiscoveryUrl(discovery);

      const message: BroadcastMessage = {
        type: "authenticated",
        discovery,
      };
      channelRef.current?.postMessage(message);

      return user;
    },
    [activateSession],
  );

  const loadSession = useCallback(
    async (discovery: string) => {
      console.log(`Loading session for ${discovery}`);
      try {
        const userManager = await createUserManager(discovery, configRef.current);
        const user = await userManager.getUser();

        if (user && !user.expired) {
          activateSession(discovery, user, userManager);
        } else {
          console.log(`User not found for ${discovery}`);
        }
      } catch (error) {
        console.error(`Failed to load session for ${discovery}:`, error);
      }
    },
    [activateSession],
  );

  useEffect(() => {
    const channel = new BroadcastChannel(STORAGE_API_AUTH_CHANNEL_NAME);
    channelRef.current = channel;

    const handleMessage = (event: MessageEvent) => {
      const message = event.data as BroadcastMessage;
      if (message?.type === "authenticated" || message?.type === "renewal") {
        void loadSession(message.discovery);
      }
    };
    channel.addEventListener("message", handleMessage);

    const urls = getStoredDiscoveryUrls();
    if (urls.length > 0) {
      void Promise.all(urls.map((url) => loadSession(url)));
    }

    const sessions = sessionsRef.current;

    return () => {
      for (const session of sessions.values()) {
        session.dispose();
      }
      sessions.clear();

      channel.removeEventListener("message", handleMessage);
      channel.close();
      channelRef.current = null;
    };
  }, [loadSession]);

  const getSession = useCallback((discovery: string): StorageApiSession | undefined => {
    return sessionsRef.current.get(discovery);
  }, []);

  const signInCallback = useCallback(async (encodedState: string): Promise<User | undefined> => {
    const { discovery } = AuthStateSchema.parse(JSON.parse(atob(encodedState)));
    const userManager = await createUserManager(discovery, configRef.current);
    return await userManager.signinCallback();
  }, []);

  return {
    getSession,
    signIn,
    signInCallback,
  };
}

export type { TokenRefreshedCallback as TokenRefreshCallback, TokenRefreshSource };

const STORAGE_API_AUTH_CHANNEL_NAME = "storageapi-auth";

const AuthStateSchema = z.object({
  discovery: z.string(),
});

export type AuthState = z.infer<typeof AuthStateSchema>;

type BroadcastMessage = (
  | { type: "authenticated"; discovery: string }
  | { type: "renewal"; discovery: string }
);

async function createUserManager(discovery: string, config: Config): Promise<UserManager> {
  if (!config.storageApi) {
    throw new Error("The streaming portal is not configured to use USD Storage API.");
  }

  const auth = await getAuthConfig(discovery);
  const client =
    auth.clients[DISCOVERY_CLIENT_NAME] ?? auth.clients["default"];
  if (!client) {
    throw new Error(
      `This USD Storage API deployment does not support streaming: missing ${DISCOVERY_CLIENT_NAME} or default client in discovery auth-config.`,
    );
  }

  const idp = new URL(auth.openidConfiguration);
  return new UserManager({
    authority: idp.origin,
    accessTokenExpiringNotificationTimeInSeconds: 60,
    client_id: client.clientId,
    scope: client.scope,
    refreshTokenAllowedScope: client.scope,
    redirect_uri: config.storageApi.redirectUri,
    metadataUrl: auth.openidConfiguration,
    userStore: new WebStorageStateStore({
      store: window.localStorage,
    }),
  });
}

const STORAGE_API_DISCOVERY_KEY = "storageapi";

export function getStoredDiscoveryUrls(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_API_DISCOVERY_KEY);
    if (!stored) {
      return [];
    }
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function storeDiscoveryUrl(discovery: string): void {
  try {
    const urls = getStoredDiscoveryUrls();
    if (!urls.includes(discovery)) {
      urls.push(discovery);
      localStorage.setItem(STORAGE_API_DISCOVERY_KEY, JSON.stringify(urls));
    }
  } catch (error) {
    console.error("Failed to store discovery URL:", error);
  }
}