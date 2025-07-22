import {
  Anchor,
  Breadcrumbs,
  Group,
  Image,
  Loader,
  Stack,
  Table,
  Title,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Navigate, NavLink, useParams } from "react-router-dom";
import Header from "../components/Header";
import LoaderError from "../components/LoaderError";
import { useConfig } from "../hooks/useConfig";
import { getStreamingApp } from "../state/Apps";

export default function AppInfo() {
  const config = useConfig();
  const { appId = "" } = useParams<{ appId: string }>();

  const { isLoading, data, error } = useQuery({
    queryKey: ["streaming-app", appId],
    queryFn: async () =>
      await getStreamingApp({
        appId,
        config,
      }),
  });

  if (isLoading) {
    return (
      <Stack>
        <Header />
        <Loader />
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack>
        <Header />
        <LoaderError title={"Failed to load application info"}>
          {error.message}
        </LoaderError>
      </Stack>
    );
  }

  if (!data) {
    return <Navigate to={"/"} />;
  }

  return (
    <Stack>
      <Header />
      <Stack px={"xl"} py={"md"}>
        <Title c={"gray"}>
          <Group>
            <Image src={data.icon} w={64} h={64} title={data.title} />
            {data.title}
          </Group>
        </Title>

        <Breadcrumbs>
          <Anchor component={NavLink} to="/">
            Main page
          </Anchor>
          <Anchor component={NavLink} to="/sessions">
            Sessions
          </Anchor>
          <Anchor component={NavLink} to={`/app/${appId}`}>
            {data.title}
          </Anchor>
        </Breadcrumbs>

        <Table variant={"vertical"} withTableBorder>
          <Table.Tbody>
            <Table.Tr>
              <Table.Th w={150}>Version</Table.Th>
              <Table.Td>{data.latestVersion.name}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th>Category</Table.Th>
              <Table.Td>{data.category}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th>Product area</Table.Th>
              <Table.Td>{data.productArea}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th>Function ID</Table.Th>
              <Table.Td>{data.latestVersion.functionId}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th>Function version</Table.Th>
              <Table.Td>{data.latestVersion.functionVersionId}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th>Authentication type</Table.Th>
              <Table.Td>{data.authType ?? "NONE"}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Stack>
    </Stack>
  );
}
