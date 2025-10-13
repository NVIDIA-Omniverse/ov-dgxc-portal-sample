import {
  ActionIcon,
  Card,
  Group,
  Image,
  Menu,
  Stack,
  Text,
} from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";
import { StreamingApp } from "../state/Apps";
import classes from "./ApplicationCard.module.css";

export interface ApplicationCardProps {
  app: StreamingApp;
}

export default function ApplicationCard({ app }: ApplicationCardProps) {
  const [version, setVersion] = useState(app.latestVersion);

  return (
    <Card
      component={"a"}
      href={`/app/${version.id}/sessions`}
      target={"_blank"}
      radius={"sm"}
      classNames={{
        root: classes.applicationCard,
      }}
      withBorder
    >
      <Group gap={0} justify={"space-between"} align={"justify"}>
        <Group
          gap={"sm"}
          justify={"space-between"}
          align={"end"}
          p={"sm"}
          flex={"1"}
          style={{ overflow: "hidden" }}
        >
          <Image src={app.icon} width={64} height={64} title={app.title} />
          <Stack gap={"3px"} flex={"1"} style={{ overflow: "hidden" }}>
            <Text size={"sm"}>{app.productArea}</Text>
            <Text
              size={"20px"}
              style={{
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "100%",
                overflow: "hidden",
                lineHeight: "30px"
              }}
              title={app.title}
            >
              {app.title}
            </Text>

            <Text
              size={"8pt"}
              c={"dark.2"}
              fw={"500"}
              style={{ alignSelf: "end" }}
            >
              {version.name}
            </Text>
          </Stack>
        </Group>

        <Menu>
          <Menu.Target>
            <ActionIcon
              bg={"green"}
              h={"auto"}
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
              }}
            >
              <IconChevronDown size={"15px"} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            {app.versions.map((version) => (
              <Menu.Item key={version.id} onClick={() => setVersion(version)}>
                {version.name}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Card>
  );
}
