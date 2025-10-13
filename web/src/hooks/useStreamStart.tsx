import { notifications } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";
import { startSession } from "../state/Sessions";
import { useConfig } from "./useConfig";

export default function useStreamStart(appId: string) {
  const config = useConfig();
  return useMutation({
    mutationFn: async () => {
      return await startSession({ config, appId });
    },
    retry: (failureCount) => {
      showStreamWarning();
      return failureCount < 3;
    },
    onSuccess: (session) => {
      window.location.href = `/app/${appId}/sessions/${session.id}`;
    },
    onError: (error) => {
      console.error("Failed to start a stream:", error);
      notifications.hide(streamStartNotification);
    },
  });
}

export function showStreamWarning() {
  notifications.hide(streamStartNotification);
  notifications.show({
    id: streamStartNotification,
    loading: true,
    title: "",
    message:
      "Connecting to a streaming session is taking longer than expected, please wait...",
    autoClose: 30000,
  });
}

export const streamStartNotification = "stream-start";
