import {
  ActionIcon,
  Avatar,
  Button,
  Flex,
  Group,
  Image,
  Menu,
  Text,
} from "@mantine/core";
import useNucleusSession from "@omniverse/auth/react/hooks/NucleusSession.ts";
import {
  IconChevronDown,
  IconDeviceDesktop,
  IconLogout,
} from "@tabler/icons-react";
import { useAuth } from "react-oidc-context";
import { NavLink } from "react-router-dom";
import Logo from "../static/logo.png";

export default function Header() {
  const auth = useAuth();
  const nucleus = useNucleusSession();

  const givenName =
    auth.user?.profile.given_name ??
    auth.user?.profile.name?.split(" ")[0] ??
    "";
  const familyName =
    auth.user?.profile.family_name ??
    auth.user?.profile.name?.split(" ")[1] ??
    "";
  const fullName = `${givenName} ${familyName}`;
  const initials = `${givenName.substring(0, 1)}${familyName.substring(0, 1)}`;

  function logOut() {
    void auth.removeUser();
    nucleus.setSession(null);
  }

  return (
    <Flex bg={"black.0"} p={"md"} align={"center"} gap={"xs"}>
      <NavLink to={"/"} style={{ textDecoration: "none" }}>
        <Group>
          <Image src={Logo} w={40} h={40} />
          <Text fw={700} c={"white"} tt={"uppercase"} size={"xl"}>
            Omniverse
          </Text>
        </Group>
      </NavLink>
      <Flex justify={"end"} flex={1}>
        <Menu>
          <Menu.Target>
            <Group gap={"xs"}>
              <Button p={0} h={"40"} title={fullName} variant={"transparent"}>
                <Avatar bg={"cyan"}>{initials}</Avatar>
              </Button>
              <ActionIcon variant={"subtle"} color={"gray"} title={"Settings"}>
                <IconChevronDown />
              </ActionIcon>
            </Group>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>{auth.user?.profile.email}</Menu.Label>
            <Menu.Item
              component={NavLink}
              leftSection={<IconDeviceDesktop />}
              to={"/sessions"}
              target={"_blank"}
            >
              Sessions
            </Menu.Item>
            <Menu.Item leftSection={<IconLogout />} onClick={logOut}>
              Log out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Flex>
    </Flex>
  );
}
