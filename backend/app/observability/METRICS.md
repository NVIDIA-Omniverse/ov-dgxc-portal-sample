# Omniverse on DGX Cloud - Portal Sample Observability Metrics

|Metric| Description|
|--|--|
|sessions.active.count| Current number of active streaming sessions|
|sessions.start.count| Total number of started streaming sessions|
|sessions.end.count| Total number of ended streaming sessions|
|sessions.duration| Session duration (expressed in seconds)|
|gpu.total.count| Total number of GPUs available for the NGC organization|
|gpu.active.count| GPUs currently assigned to active NVCF functions.|

## Session metric attributes

The `sessions.end.count` and `sessions.duration` metrics are emitted with the
following attributes that allow filtering and grouping in the observability
backend:

|Attribute| Description|
|--|--|
|session.app| Identifier of the application the session was started for|
|session.user| Subject (`sub`) of the user the session belongs to|
|session.username| Display name of the user the session belongs to|
|nvcf.function_id| NVCF function ID powering the session|
|nvcf.function_version_id| NVCF function version ID powering the session|
|session.status| Terminal status of the session: `STOPPED` when explicitly terminated by a user (end-user or administrator), `EXPIRED` when the session ended without explicit user action (timeout, idle expiration, browser tab closed) and `FAILED` when the session ended due to an upstream error (NVCF rejection, abnormal stream close, connection timeout).|