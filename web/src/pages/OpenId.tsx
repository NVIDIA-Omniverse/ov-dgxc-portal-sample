import { Alert, Box, Button, Loader, Stack, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useAuth } from "react-oidc-context";
import { Navigate, NavLink } from "react-router-dom";

export default function OpenId() {
  const auth = useAuth();

  if (auth.error && !auth.isLoading) {
    return (
      <Box p={"xl"}>
        <Alert
          variant="filled"
          color="red"
          title="Failed to authenticate"
          icon={<IconInfoCircle />}
        >
          <Stack align={"start"}>
            <Text size={"sm"}>{auth.error.message}</Text>
            <Button component={NavLink} to="/">
              Go back
            </Button>
          </Stack>
        </Alert>
      </Box>
    );
  }

  if (!auth.isAuthenticated) {
    return <Loader />;
  } else {
    return <Navigate to={"/"} />;
  }
}
