/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

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
import { StorageApiAuthenticate } from "./pages/StorageApiAuthenticate";
import { DeepLink } from "./pages/DeepLink";
import About from "./pages/About";

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
        path: "storage-api/openid",
        element: <StorageApiAuthenticate />
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
        path: "deeplink",
        element: <DeepLink />,
      },
      {
        path: "sessions",
        element: <UserSessionList />,
      },
      {
        path: "about",
        element: <About />,
      },
      {
        path: "login",
        element: <Login />
      }
    ],
  },
]);
