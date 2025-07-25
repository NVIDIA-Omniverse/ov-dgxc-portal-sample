import { List, Loader, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";
import { z, ZodError } from "zod";
import LoaderError from "../components/LoaderError.tsx";
import { ConfigContext } from "../context/ConfigContext.tsx";

export interface ConfigProviderProps {
  children?: ReactNode;
}

/**
 * Defines the validation schema for the application configuration stored in /config.json file.
 */
const Config = z.object({
  auth: z.object({
    // OpenID Client ID registered in the identity provider for this application.
    clientId: z.string().min(1, "Required"),

    // The URI of this application where the user will be redirected back after authentication.
    redirectUri: z.string().url(),

    // The URI used for redirecting the user to the identity provider.
    authority: z.string().min(1, "Required"),

    // Scopes required from the identity provider.
    // Define what fields (claims) become available in the ID token.
    scope: z.string().default("openid profile email nca"),
  }),

  endpoints: z.object({
    // The URI of the portal backend.
    backend: z.string().min(1, "Required"),

    // The URI of the Nucleus server used for the portal.
    nucleus: z.string().min(1, "Required"),
  }),

  sessions: z.object({
    // Maximum session duration in seconds before users get disconnected.
    maxTtl: z.number().default(28800),

    // Defines when the user should see the notification about the ending session (in seconds).
    sessionEndNotificationTime: z.number().default(600),

    // Defines for how long the session end notification should be displayed (in seconds).
    sessionEndNotificationDuration: z.number().default(30),
  })
});

export type Config = z.infer<typeof Config>;

/**
 * Loads the application configuration and passes it as context.
 * While the configuration is loading, displays the spinner instead of the current page.
 */
export default function ConfigProvider({ children }: ConfigProviderProps) {
  const { isSuccess, isError, error, data } = useQuery<Config>({
    queryKey: ["config"],
    queryFn: async () => {
      const response = await fetch("/config/main.json");
      if (response.ok) {
        const config: unknown = await response.json();
        return Config.parse(config);
      }

      if (import.meta.env.DEV && response.status === 404) {
        throw new Error(
          "Add ./config/main.json file to the public folder in the repo and provide the application configuration.",
        );
      }
      throw new Error(
        `Failed to initialize the application: HTTP${response.status}.`,
      );
    },
  });

  if (isError) {
    return (
      <LoaderError title={"Failed to load configuration"}>
        {error instanceof ZodError ? (
          <>
            <Text fw={700} size={"sm"}>
              Invalid config.json:
            </Text>
            <List>
              {error.issues.map((issue) => {
                const path = issue.path.join(".");
                return (
                  <List.Item key={[issue.code, path].join()}>
                    <Text fw={700} size={"xs"}>
                      {path}:
                    </Text>
                    <Text size={"xs"}>{issue.message}</Text>
                  </List.Item>
                );
              })}
            </List>
          </>
        ) : (
          error.toString()
        )}
      </LoaderError>
    );
  }

  if (isSuccess) {
    return (
      <ConfigContext.Provider value={data}>{children}</ConfigContext.Provider>
    );
  } else {
    return <Loader m={"md"} />;
  }
}
