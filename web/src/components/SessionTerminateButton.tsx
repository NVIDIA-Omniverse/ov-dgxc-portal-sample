import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConfig } from "../hooks/useConfig.ts";
import { StreamingSession, terminateSession } from "../state/Sessions.ts";

export interface SessionTerminateButtonProps {
  session: StreamingSession;
}

export default function SessionTerminateButton({
  session,
}: SessionTerminateButtonProps) {
  const config = useConfig();
  const queryClient = useQueryClient();

  const { isPending, mutate: terminate } = useMutation({
    mutationFn: async () => {
      if (
        confirm(
          `Are you sure you want to terminate session ${session.id}? This will disconnect the stream if it's active. All unsaved work will be lost.`,
        )
      ) {
        try {
          await terminateSession({ config, sessionId: session.id });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : error?.toString?.() ?? "";

          notifications.show({
            title: "Failed to terminate session",
            message,
            color: "red",
            autoClose: 20000,
          });
        }
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["app-sessions"] });
    }
  });

  return (
    <Button color={"red"} loading={isPending} onClick={() => terminate()}>
      Terminate
    </Button>
  );
}
