import { createBrowserRouter } from "react-router-dom";
import AppInfo from "./pages/AppInfo";
import UserSessionList from "./pages/UserSessionList.tsx";
import Main from "./pages/Main.tsx";
import Home from "./pages/Home.tsx";
import OpenId from "./pages/OpenId.tsx";
import AppStream from "./pages/AppStream.tsx";
import NucleusAuthenticate from "./pages/NucleusAuthenticate.tsx";
import NucleusSSO from "./pages/NucleusSSO.tsx";
import AppStreamList from "./pages/AppStreamList";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "openid",
        element: <OpenId />,
      },
      {
        path: "nucleus/authenticate",
        element: <NucleusAuthenticate />,
      },
      {
        path: "nucleus/sso/:state",
        element: <NucleusSSO />,
      },
      {
        path: "app/:appId/sessions/:sessionId",
        element: <AppStream />,
      },
      {
        path: "app/:appId/sessions",
        element: <AppStreamList />,
      },
      {
        path: "app/:appId",
        element: <AppInfo />,
      },
      {
        path: "sessions",
        element: <UserSessionList />,
      },
    ],
  },
]);
