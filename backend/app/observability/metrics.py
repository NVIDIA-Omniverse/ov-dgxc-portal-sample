from opentelemetry import metrics
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import (
    OTLPMetricExporter,
)

metric_exporter = OTLPMetricExporter()
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