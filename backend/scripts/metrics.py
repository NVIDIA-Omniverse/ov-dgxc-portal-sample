# SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: MIT
#
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the "Software"),
# to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies of the Software, and to permit persons to whom the
# Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
# THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
# DEALINGS IN THE SOFTWARE.

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
