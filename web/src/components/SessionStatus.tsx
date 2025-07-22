import { Badge, BadgeProps } from "@mantine/core";
import { StreamingSession } from "../state/Sessions";

export interface SessionStatusProps {
  status: StreamingSession["status"];
}

export default function SessionStatus({ status }: SessionStatusProps) {
  return <Badge color={getStatusColor(status)}>{status}</Badge>;
}

function getStatusColor(
  status: StreamingSession["status"],
): BadgeProps["color"] {
  switch (status) {
    case "ACTIVE":
      return "green";
    case "CONNECTING":
      return "blue";
    case "IDLE":
      return "orange";
    case "STOPPED":
      return "gray";
    default:
      return "red";
  }
}
