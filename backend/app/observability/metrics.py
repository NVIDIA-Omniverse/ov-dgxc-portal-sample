# SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
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

from opentelemetry import metrics
from opentelemetry.sdk.metrics import (
    MeterProvider, Counter, UpDownCounter, Histogram
)
from opentelemetry.sdk.metrics.export import (
    PeriodicExportingMetricReader, AggregationTemporality
)
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import (
    OTLPMetricExporter,
)

metric_exporter = OTLPMetricExporter(
    preferred_temporality={
        Counter: AggregationTemporality.CUMULATIVE,
        UpDownCounter: AggregationTemporality.CUMULATIVE,
        Histogram: AggregationTemporality.DELTA,
    }
)
metric_reader = PeriodicExportingMetricReader(
    exporter=metric_exporter,
)

metrics_provider = MeterProvider(
    metric_readers=[metric_reader],
)

metrics.set_meter_provider(metrics_provider)

meter = metrics.get_meter("backend.metrics")

active_sessions = meter.create_up_down_counter(
    "sessions.active.count",
    unit="sessions",
    description="Current amount of active streaming sessions.",
)
session_start = meter.create_counter(
    "sessions.start.count",
    unit="sessions",
    description="Total amount of started streaming sessions.",
)
session_end = meter.create_counter(
    "sessions.end.count",
    unit="sessions",
    description="Total amount of ended streaming sessions.",
)
session_duration = meter.create_histogram(
    "sessions.duration",
    unit="seconds",
    description="Session duration in seconds.",
)