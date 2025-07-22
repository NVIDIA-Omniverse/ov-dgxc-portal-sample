import { notifications } from "@mantine/notifications";
import { IconExclamationMark } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { startSession } from "../state/Sessions";
import { useConfig } from "./useConfig";

export default function useStreamStart(appId: string) {
  const config = useConfig();
  return useMutation({
    mutationFn: async () => {
      return await startSession({ config, appId });
    },
    onSuccess: (session) => {
      window.location.href = `/app/${appId}/sessions/${session.id}`;
    },
    onError: (error) => {
      notifications.update({
        id: streamStartNotification,
        color: "red",
        title: "Failed to start a new session",
        icon: <IconExclamationMark />,
        loading: false,
        message: error.message,
      });
    },
  });
}

export const streamStartNotification = "stream-start";