import {
  addSeconds,
  differenceInSeconds,
  formatDuration,
  interval,
  intervalToDuration,
} from "date-fns";
import { useConfig } from "../hooks/useConfig";
import { StreamingSession } from "../state/Sessions";

export interface SessionDurationProps {
  session: StreamingSession;
}

export default function SessionDuration({ session }: SessionDurationProps) {
  const config = useConfig();
  const now = new Date();
  const duration = formatDuration(
    intervalToDuration(interval(session.startDate, session.endDate ?? now)),
    { format: ["hours", "minutes"] },
  );

  const remaining = interval(
    now,
    addSeconds(session.startDate, config.sessions.maxTtl),
  );
  const timeRemaining = formatDuration(
    intervalToDuration(
      interval(now, addSeconds(session.startDate, config.sessions.maxTtl)),
    ),
    { format: ["hours", "minutes"] },
  );
  const diff = differenceInSeconds(remaining.end, remaining.start);
  return (
    <>
      {duration}
      {session.status !== "STOPPED" && diff > 0 && ` (${timeRemaining} left)`}
    </>
  );
}
