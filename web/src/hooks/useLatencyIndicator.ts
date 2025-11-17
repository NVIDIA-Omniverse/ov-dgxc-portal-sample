import { useCallback, useState } from "react";
import { StreamEvent } from "@nvidia/omniverse-webrtc-streaming-library";

export function useLatencyIndicator() {
  const [rtd, setRtd] = useState(0);

  const recordRtd = useCallback((event: StreamEvent) => {
    if (event.stats) {
      setRtd(event.stats.rtd);
    }
  }, []);

  return [rtd, recordRtd] as const;
}