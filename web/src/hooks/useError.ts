import { useCallback, useState } from "react";

export default function useError() {
  const [error, setError] = useState("");

  const setErrorMessage = useCallback((error: Error | string) => {
    setError(
      error instanceof Error
        ? error.message
        : error?.toString?.() ?? "Unknown error.",
    );
  }, []);

  return [error, setErrorMessage] as const;
}
