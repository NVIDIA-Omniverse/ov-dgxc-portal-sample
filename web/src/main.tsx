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

import { createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./nucleus";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import ConfigProvider from "./providers/ConfigProvider";
import { router } from "./router";
import { HttpError } from "./util/Errors";

const theme = createTheme({
  fontFamily: "Open Sans, sans-serif",

  colors: {
    green: [
      "#76b900",
      "#76b900",
      "#76b900",
      "#76b900",
      "#76b900",
      "#76b900",
      "#76b900",
      "#76b900",
      "#76b900",
      "#76b900",
    ],
  },

  white: "#fff",

  headings: {
    sizes: {
      h1: {
        fontSize: "48px",
      },
      h2: {
        fontSize: "20px",
      },
    },
    fontWeight: "200",
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: Error) => {
        if (failureCount >= 5 && error instanceof HttpError) {
          if (error.status === 401) {
            window.location.href = "/login";
            return false;
          }
        }

        return failureCount < 5;
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <MantineProvider theme={theme} forceColorScheme={"dark"}>
      <ConfigProvider>
        <RouterProvider router={router} />
      </ConfigProvider>
      <Notifications />
    </MantineProvider>
  </QueryClientProvider>,
);