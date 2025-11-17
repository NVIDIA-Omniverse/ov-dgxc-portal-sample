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

import Cookies from "js-cookie";
import { Log, UserManager, WebStorageStateStore } from "oidc-client-ts";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  AuthProvider as OIDCProvider,
  AuthProviderProps as OIDCProviderProps,
  useAuth,
} from "react-oidc-context";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useConfig } from "../hooks/useConfig";

export interface AuthProviderProps {
  children?: ReactNode;
}

Log.setLogger(console);
Log.setLevel(Log.DEBUG);

type AuthMessage = { type: "logout" } | { type: "renewal" };

/**
 * Integrates OpenID Connect to the portal and provides corresponding authentication information as context.
 * Stores authentication tokens in cookies.
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [channel] = useState(() => new BroadcastChannel("session"));

  const onSignIn = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const onRemoveUser = useCallback(() => {
    Cookies.remove("id_token");
    Cookies.remove("access_token");

    channel.postMessage({ type: "logout" });
    navigate("/");
  }, [channel, navigate]);

  const config = useConfig();
  const auth: OIDCProviderProps = useMemo(
    () => ({
      userManager: new UserManager({
        authority: config.auth.authority,
        automaticSilentRenew: false,
        client_id: config.auth.clientId,
        metadataUrl: config.auth.metadataUri,
        redirect_uri: config.auth.redirectUri,
        scope: config.auth.scope ?? "openid profile email",

        userStore: new WebStorageStateStore({
          store: window.localStorage,
        }),
      }),
    }),
    [config],
  );

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const message = event.data as AuthMessage;
      if (message.type === "logout") {
        void auth.userManager?.removeUser();
      } else {
        void auth.userManager?.getUser();
      }
    };

    channel.addEventListener("message", listener);
    return () => channel.removeEventListener("message", listener);
  }, [channel, auth]);

  useEffect(() => {
    const onRenew = () => {
      const uuid = crypto.randomUUID();
      const timestamp = () => new Date().toISOString();
      console.info(
        `[${timestamp()}] [${uuid}] Token expiring, requesting renewal lock...`,
      );

      void navigator.locks.request(
        "auth-renewal",
        { mode: "exclusive", ifAvailable: true },
        async (lock) => {
          if (!lock) {
            console.info(
              `[${timestamp()}] [${uuid}] Lock not available - another tab is renewing session`,
            );
            return;
          }

          console.info(
            `[${timestamp()}] [${uuid}] Lock acquired - starting renewal...`,
          );
          try {
            const user = await auth.userManager?.signinSilent();
            if (user) {
              console.info(
                `[${timestamp()}] [${uuid}] Session renewed successfully`,
              );
              channel.postMessage({ type: "renewal" } as AuthMessage);

              const cooldown = 30 * 1000; // 30 seconds
              console.info(
                `[${timestamp()}] [${uuid}] Hold the lock for ${cooldown / 1000} seconds to prevent duplicate renewals.`,
              );
              await new Promise((resolve) => setTimeout(resolve, cooldown));
            } else {
              console.warn(
                `[${timestamp()}] [${uuid}] Silent renewal returned no user - redirecting to login`,
              );
              await auth.userManager?.signinRedirect();
            }
          } catch (error) {
            console.error(
              `[${timestamp()}] [${uuid}] Token renewal failed:`,
              error,
            );
          } finally {
            console.info(
              `[${timestamp()}] [${uuid}] Renewal complete - releasing lock`,
            );
          }
        },
      );
    };

    auth.userManager?.events.addAccessTokenExpiring(onRenew);
    return () => {
      auth.userManager?.events.removeAccessTokenExpiring(onRenew);
    };
  }, [auth, channel]);

  return (
    <OIDCProvider
      {...auth}
      skipSigninCallback={window.location.pathname.startsWith("/nucleus")}
      onSigninCallback={onSignIn}
      onRemoveUser={onRemoveUser}
    >
      <CookieSync />
      {children}
    </OIDCProvider>
  );
}

function CookieSync() {
  const auth = useAuth();

  useEffect(() => {
    if (auth.user?.id_token) {
      Cookies.set("id_token", auth.user.id_token, { expires: 1, path: "/" });
    } else {
      Cookies.remove("id_token");
    }

    if (auth.user?.access_token) {
      Cookies.set("access_token", auth.user.access_token, {
        expires: 1,
        path: "/",
      });
    } else {
      Cookies.remove("access_token");
    }
  }, [auth]);

  return null;
}
