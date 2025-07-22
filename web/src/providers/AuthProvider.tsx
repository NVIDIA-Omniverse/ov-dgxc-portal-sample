import Cookies from "js-cookie";
import { Log, UserManager, WebStorageStateStore } from "oidc-client-ts";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  AuthProvider as OIDCProvider,
  AuthProviderProps as OIDCProviderProps,
  useAuth,
} from "react-oidc-context";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useConfig } from "../hooks/useConfig.ts";

export interface AuthProviderProps {
  children?: ReactNode;
}

Log.setLogger(console);
Log.setLevel(Log.DEBUG);

interface AuthMessage {
  type: "logout";
}

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
      }
    };

    channel.addEventListener("message", listener);
    return () => channel.removeEventListener("message", listener);
  }, [channel, auth]);

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
