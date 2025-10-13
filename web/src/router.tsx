import { createBrowserRouter } from "react-router-dom";
import AppInfo from "./pages/AppInfo";
import Login from "./pages/Login";
import UserSessionList from "./pages/UserSessionList";
import Main from "./pages/Main";
import Home from "./pages/Home";
import OpenId from "./pages/OpenId";
import AppStream from "./pages/AppStream";
import NucleusAuthenticate from "./pages/NucleusAuthenticate";
import NucleusSSO from "./pages/NucleusSSO";
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
      {
        path: "login",
        element: <Login />
      }
    ],
  },
]);
