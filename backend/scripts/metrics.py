import os
import asyncio
from app.observability.metrics import (
    active_sessions,
    session_start,
    session_end,
)


async def test_metrics():
    print("Testing OpenTelemetry metrics...")

    print("Recording session start...")
    session_start.add(1, {"user_id": "test-user", "app_id": "test-app"})

    print("Incrementing active sessions...")
    active_sessions.add(1, {"user_id": "test-user", "app_id": "test-app"})

    await asyncio.sleep(2)

    print("Recording session end...")
    session_end.add(1, {"user_id": "test-user", "app_id": "test-app"})

    print("Decrementing active sessions...")
    active_sessions.add(-1, {"user_id": "test-user", "app_id": "test-app"})

    print("Metrics recorded. Check your collector/backend for the data.")
    print("Waiting 10 seconds to ensure export...")
    await asyncio.sleep(10)


def test():
    os.environ.setdefault("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")
    os.environ.setdefault("OTEL_SERVICE_NAME", "web-streaming-backend")

    asyncio.run(test_metrics())


if __name__ == "__main__":
   test()
