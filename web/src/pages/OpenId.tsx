import { useAuth } from "react-oidc-context";
import { Loader } from "@mantine/core";
import { Navigate } from "react-router-dom";

export default function OpenId() {
  const auth = useAuth();
  if (!auth.isAuthenticated) {
    return <Loader />;
  } else {
    return <Navigate to={"/"} />;
  }
}
