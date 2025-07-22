import { createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./nucleus";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import ConfigProvider from "./providers/ConfigProvider.tsx";
import { router } from "./router";
import { Notifications } from "@mantine/notifications";

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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <MantineProvider theme={theme} forceColorScheme={"dark"}>
        <ConfigProvider>
          <RouterProvider router={router} />
        </ConfigProvider>
        <Notifications />
      </MantineProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
