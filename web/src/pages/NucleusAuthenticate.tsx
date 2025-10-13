import AuthForm, { AuthenticationResult } from "@omniverse/auth/react/AuthForm";
import useNucleusSession from "@omniverse/auth/react/hooks/NucleusSession";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box } from "@mantine/core";
import { useConfig } from "../hooks/useConfig";

/**
 * Displays a login form for the configured Nucleus server
 * using components from @omniverse/auth library.
 */
export default function NucleusAuthenticate() {
  const config = useConfig();

  const [searchParams] = useSearchParams();
  const redirectAfter = searchParams.get("redirectAfter") ?? "/";

  const navigate = useNavigate();
  const session = useNucleusSession();

  function handleSuccess(result: AuthenticationResult) {
    if (result.server && result.accessToken && result.refreshToken) {
      session.setSession({
        server: result.server,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      navigate(redirectAfter);
    }
  }

  return (
    <Box m={"md"}>
      <AuthForm
        extras={{ redirectAfter }}
        initial={{ server: config.endpoints.nucleus }}
        readonly={{ server: true }}
        ssoRedirectBackTo={`${window.location.origin}/nucleus/sso`}
        onSuccess={handleSuccess}
      />
    </Box>
  );
}
