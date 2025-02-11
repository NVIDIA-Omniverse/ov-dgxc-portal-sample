import { Stack, Text } from "@mantine/core";
import { ReactNode } from "react";

export interface PlaceholderProps {
  children?: ReactNode;
  icon?: ReactNode;
}

export default function Placeholder({ children, icon }: PlaceholderProps) {
  return (
    <Stack c={"gray"} align={"center"} gap={0} display={"inline-flex"}>
      {icon}
      <Text>{children}</Text>
    </Stack>
  );
}
