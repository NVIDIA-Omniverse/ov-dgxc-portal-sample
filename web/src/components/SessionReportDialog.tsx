import {
  ActionIcon,
  CopyButton,
  Dialog,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";

export interface SessionReportDialogProps {
  sessionId: string;
  opened: boolean;
  onClose: () => void;
}

export default function SessionReportDialog({
  sessionId,
  opened,
  onClose,
}: SessionReportDialogProps) {
  return (
    <Dialog
      opened={opened}
      withBorder
      withCloseButton
      size={"lg"}
      radius={"md"}
      onClose={onClose}
    >
      <Stack gap={"sm"}>
        <Text size={"sm"} fw={800} mr={"xl"}>
          You can report a problem with the current session to a system
          administrator with this info:
        </Text>

        <Stack gap={0}>
          <Group>
            <Text size={"sm"} fw={500} component={"span"}>
              Session ID:
            </Text>

            <CopyButton value={sessionId ?? ""} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip
                  label={copied ? "Copied" : "Copy session ID"}
                  withArrow
                  position="right"
                >
                  <ActionIcon
                    color={copied ? "teal" : "gray"}
                    size={"xs"}
                    variant="subtle"
                    onClick={copy}
                  >
                    {copied ? <IconCheck /> : <IconCopy size={14} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>

          <Text size={"sm"} component={"span"}>
            {sessionId || "<unknown>"}
          </Text>
        </Stack>
      </Stack>
    </Dialog>
  );
}
