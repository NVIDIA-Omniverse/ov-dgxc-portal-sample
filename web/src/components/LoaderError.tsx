import { Alert, Box } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { ReactNode } from "react";

export interface LoaderErrorProps {
  children?: ReactNode;
  title?: string;
}

export default function LoaderError({
  title = "Error",
  children,
}: LoaderErrorProps) {
  return (
    <Box p={"xl"} pos={"relative"} style={{ zIndex: 1 }}>
      <Alert
        variant="filled"
        color="red"
        title={title}
        icon={<IconInfoCircle />}
      >
        {children}
      </Alert>
    </Box>
  );
}
