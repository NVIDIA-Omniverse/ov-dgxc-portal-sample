import { Loader } from "@mantine/core";
import { useAuth } from "react-oidc-context";


export default function Login() {
  const auth = useAuth();
  void auth.signinRedirect();

  return <Loader />;
}