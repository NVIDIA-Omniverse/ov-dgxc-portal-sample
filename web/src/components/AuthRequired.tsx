import { Loader } from "@mantine/core";
import Cookies from "js-cookie";
import { ReactNode, useEffect, useState } from "react";
import { hasAuthParams, useAuth } from "react-oidc-context";

export interface AuthRequiredProps {
  children?: ReactNode;
}

/**
 * Redirects the user to the identity provider if they are not authenticated.
 * All web pages in this example require authentication.
 */
export default function AuthRequired({ children }: AuthRequiredProps) {
  const auth = useAuth();
  const [hasTriedSignIn, setHasTriedSignIn] = useState(false);

  useEffect(() => {
    if (
      !hasAuthParams() &&
      !auth.isAuthenticated &&
      !auth.activeNavigator &&
      !auth.isLoading &&
      !hasTriedSignIn
    ) {
      const handleError = (error: Error) => {
        console.error(error);
      };

      auth.events.addSilentRenewError(handleError);

      setHasTriedSignIn(true);
      void auth
        .signinSilent()
        .then((user) => {
          if (user) {
            if (user.id_token) {
              Cookies.set("id_token", user.id_token, { expires: 1, path: "/" });
            }
            if (user.access_token) {
              Cookies.set("access_token", user.access_token, {
                expires: 1,
                path: "/",
              });
            }
            setHasTriedSignIn(false);
          } else {
            Cookies.remove("id_token");
            Cookies.remove("access_token");
            return auth.signinRedirect();
          }
        })
        .catch((error) => {
          console.warn(error);
          return auth.signinRedirect();
        });

      return () => {
        auth.events.removeSilentRenewError(handleError);
      };
    }
  }, [auth, hasTriedSignIn]);

  if ((auth.isLoading && !auth.isAuthenticated) || hasTriedSignIn) {
    return <Loader m={"md"} />;
  }

  if (!auth.isAuthenticated) {
    return null;
  }

  return children;
}