import { notifications } from "@mantine/notifications";
import { IconExclamationCircleFilled } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import {
  addSeconds,
  differenceInSeconds,
  formatDuration,
  interval,
  intervalToDuration,
} from "date-fns";
import { useEffect, useState } from "react";
import { getSession } from "../state/Sessions";
import { useConfig } from "./useConfig";

export default function useStreamEndNotification(sessionId: string) {
  const config = useConfig();

  const [notificationSent, setNotificationSent] = useState<boolean>(false);

  const { data: session } = useQuery({
    queryKey: ["sessions", sessionId],
    queryFn: async () => {
      return await getSession({ config, sessionId });
    },
  });

  useEffect(() => {
    if (!session || notificationSent) {
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = interval(
        now,
        addSeconds(session.startDate, config.sessions.maxTtl),
      );
      const diff = differenceInSeconds(remaining.end, remaining.start);
      if (diff - config.sessions.sessionEndNotificationTime <= 0) {
        const remainingDuration = formatDuration(
          intervalToDuration(remaining),
          {
            format: ["minutes", "seconds"],
            zero: false,
          },
        );
        const remainingText = diff <= 0 ? "soon" : `in ${remainingDuration}`;

        notifications.show({
          color: "yellow",
          icon: <IconExclamationCircleFilled />,
          title: "This session is going to end soon.",
          message: `The session will be closed ${remainingText}. Save your work to prevent lost changes.`,
          autoClose: config.sessions.sessionEndNotificationDuration * 1000,
        });

        setNotificationSent(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [config, session, notificationSent]);
}
