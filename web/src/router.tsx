import { createBrowserRouter } from "react-router-dom";
import Admin from "./pages/Admin.tsx";
import Main from "./pages/Main.tsx";
import Home from "./pages/Home.tsx";
import OpenId from "./pages/OpenId.tsx";
import Stream from "./pages/Stream.tsx";
import NucleusAuthenticate from "./pages/NucleusAuthenticate.tsx";
import NucleusSSO from "./pages/NucleusSSO.tsx";

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
        path: "stream/:id/:version",
        element: <Stream />,
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
        path: "admin",
        element: <Admin />,
      },
    ],
  },
]);
