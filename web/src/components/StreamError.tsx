import { Button, Group } from "@mantine/core";
import LoaderError from "./LoaderError";

export interface StreamErrorProps {
  disabled?: boolean;
  loading?: boolean;
  error?: Error | string | null;
  title?: string;
  onReload?: () => void;
  onStartNewSession?: () => void;
}

export function StreamError({
  disabled,
  loading,
  error,
  title = "Failed to load the stream",
  onReload,
  onStartNewSession,
}: StreamErrorProps) {
  return (
    <LoaderError title={title}>
      {error?.toString()}

      <Group mt={"md"}>
        <Button
          variant={"white"}
          disabled={disabled}
          loading={loading}
          onClick={onReload}
        >
          Reload
        </Button>
        <Button
          variant={"white"}
          disabled={disabled}
          loading={loading}
          onClick={onStartNewSession}
        >
          Start a new session
        </Button>
      </Group>
    </LoaderError>
  );
}
