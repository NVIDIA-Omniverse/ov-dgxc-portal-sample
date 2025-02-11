import { Card, Group, Loader, SimpleGrid, Stack, Title } from "@mantine/core";
import { IconAppWindow, IconTableFilled } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import ApplicationCard from "../components/ApplicationCard.tsx";
import Header from "../components/Header";
import LoaderError from "../components/LoaderError.tsx";
import Placeholder from "../components/Placeholder.tsx";
import { useConfig } from "../hooks/useConfig.ts";
import { getStreamingApps, StreamingApp } from "../state/Apps.ts";

/**
 * Displays applications available for streaming.
 * Hides applications that are currently inactive in NVCF.
 */
export default function Home() {
  const config = useConfig();

  const {
    isLoading,
    data: categories,
    error,
  } = useQuery<
    Map<StreamingApp["category"], Map<StreamingApp["title"], StreamingApp>>
  >({
    queryKey: ["get-apps"],
    queryFn: async () => getStreamingApps({ config }),
  });

  return (
    <Stack>
      <Header />
      <Stack px={"xl"} py={"md"}>
        <Title c={"gray"}>Welcome to Omniverse!</Title>
        {isLoading ? (
          <Loader />
        ) : error ? (
          <LoaderError title={"Failed to load streaming applications"}>
            {error.toString()}
          </LoaderError>
        ) : categories?.size ? (
          <Stack>
            {Array.from(categories.entries()).map(([category, apps]) => (
              <Card key={category} radius={0} withBorder>
                <Stack gap={"lg"}>
                  <Group
                    gap={"xs"}
                    pb={"3px"}
                    style={{ borderBottom: "2px solid gray" }}
                  >
                    <IconTableFilled />
                    <Title order={2}>{category}</Title>
                  </Group>

                  <SimpleGrid cols={{ xs: 1, sm: 2, lg: 3 }}>
                    {Array.from(apps.values()).map((app) => (
                      <ApplicationCard key={app.title} app={app} />
                    ))}
                  </SimpleGrid>
                </Stack>
              </Card>
            ))}
          </Stack>
        ) : (
          <Placeholder
            icon={<IconAppWindow size={"100"} color={"currentColor"} />}
          >
            No streaming applications are currently available.
          </Placeholder>
        )}
      </Stack>
    </Stack>
  );
}
