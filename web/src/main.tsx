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
