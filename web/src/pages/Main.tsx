import { ReactNode } from "react";
import AuthProvider from "../providers/AuthProvider";
import AuthRequired from "../components/AuthRequired";
import { Outlet } from "react-router-dom";

export interface MainProps {
  children?: ReactNode;
}

export default function Main({ children }: MainProps) {
  return (
    <AuthProvider>
      <AuthRequired>
        <Outlet />
        {children}
      </AuthRequired>
    </AuthProvider>
  );
}
