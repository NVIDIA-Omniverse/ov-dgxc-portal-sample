import {
  CloseButton,
  Combobox,
  Input,
  InputBase,
  Stack,
  Text,
  useCombobox,
} from "@mantine/core";
import { StreamingSession } from "../state/Sessions";
import SessionStatus from "./SessionStatus";

export interface SessionStatusFilterProps {
  value: StreamingSession["status"] | "";
  onChange: (status: StreamingSession["status"] | "") => void;
}

export default function SessionStatusFilter({
  value,
  onChange,
}: SessionStatusFilterProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const options = statuses.map((status) => (
    <Combobox.Option key={status} value={status}>
      <Stack gap={5} my={5}>
        <SessionStatus status={status} />
        <Text fz={10} c={"dimmed"}>
          {statusDescription[status]}
        </Text>
      </Stack>
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(value) => {
        onChange(value as StreamingSession["status"]);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          w={280}
          type="button"
          pointer
          rightSection={
            value ? (
              <CloseButton
                aria-label={"Remove status filter"}
                size={"sm"}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onChange("")}
              />
            ) : (
              <Combobox.Chevron />
            )
          }
          rightSectionPointerEvents={value === "" ? 'none' : 'all'}
          onClick={() => combobox.toggleDropdown()}
        >
          {value ? (
            <SessionStatus status={value} />
          ) : (
            <Input.Placeholder>Filter by status</Input.Placeholder>
          )}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>{options}</Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

const statuses = ["ACTIVE", "CONNECTING", "IDLE", "STOPPED"] as const;
const statusDescription = {
  ACTIVE: "A user is currently connected and using the session.",
  CONNECTING: "A user is connecting to the session.",
  IDLE: "A user has disconnected temporarily.",
  STOPPED: "The session has been terminated.",
} as const;
