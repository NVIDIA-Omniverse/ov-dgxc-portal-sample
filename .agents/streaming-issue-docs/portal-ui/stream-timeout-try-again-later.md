---
id: stream-timeout-try-again-later
category: portal-ui
symptom: "Failed to connect a streaming session with a timeout — try again later"
status: complete
skills:
 - check-nvcf-function
 - check-streaming-app
docs:
  - "https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html"
---

# Stream timeout — try again later

## Symptom

The portal shows a red banner or closes the WebSocket during stream setup:

> **Failed to connect a streaming session with a timeout — try again later.**

The portal backend timed out waiting for NVCF to allocate an instance or complete the streaming handshake. The session is marked failed; retries on the same session ID may return **404** or WebSocket close **1006** because the session was never fully established or has expired.

A related but distinct error appears earlier in the flow when **session creation** (`POST /sessions/`) times out — HTTP **408** with *"This could be caused by network congestion or no GPUs available. Please try again."* See [http-408-creating-session.md](../nvcf-deployment/http-408-creating-session.md).

## When you see this

This symptom appears at **stream start** (Phase C), when concurrent load exceeds pre-warmed capacity or NVCF is still scaling.

| Pattern | What it suggests |
|---------|------------------|
| **Fails only when many users connect at once** | `maxInstances` reached or scaling lag — all warm instances busy |
| **First N sessions succeed, then timeouts** | `minInstances` too low for expected concurrency; cold-start delay exceeds portal/NVCF timeout |
| **Intermittent under moderate load** | NVCF autoscaler slow to provision; may eventually succeed on retry ( comment, Sept 2025) |
| **Every launch fails, even alone** | Cluster capacity error, function stuck `DEPLOYING`, or pods terminating — not pure saturation |
| **After a prior 408/timeout** | Stale session — start a **new** session; do not reconnect to the failed session ID |

Collect before diagnosing: portal URL (or `app_id` from `/app/:appId/sessions/:sessionId`), exact error text, approximate concurrent session count, `function_id` / `function_version_id`, and whether the function was recently redeployed or scaled.

## Client library and portal backend

| Source | Text / code | Notes |
|--------|-------------|--------|
| Portal WebSocket proxy | Close **3008**: `Failed to connect a streaming session with a timeout -- try again later.` | `sessions.py` — not an `RErrorCode` |
| Portal `POST /sessions/` | **HTTP 408** + congestion/GPU message | Before `AppStreamer.connect` — see [http-408-creating-session.md](../nvcf-deployment/http-408-creating-session.md) |
| ov-web-rtc | `SessionLimitExceeded` (`0xC0F2210B`), `ServerDisconnectedConcurrentSessionLimitExceeded` (`0xF22344`) | Capacity at streamer layer |

See [OV-WEB-RTC-ERROR-CODES.md](../OV-WEB-RTC-ERROR-CODES.md).

## Diagnosis

Work through capacity and scaling first, then portal wiring, then instance-level logs. Use the skills listed in frontmatter.

### 1. Portal app linkage — `check-streaming-app`

Provide `portal_url` and either `app_id` or both NVCF IDs.

Confirm:

- Portal **runtime status** is `ACTIVE` or `DEGRADING` (not `UNKNOWN` / `ERROR` / stuck `DEPLOYING`)
- `function_id` and `function_version_id` match the NVCF function you will inspect
- **`deployment.minInstances` / `maxInstances`** — note values for comparison with active load
- Portal and NVCF use the **same NGC org**

If `deployment` is null, run `check-nvcf-function` directly for scaling fields.

### 2. NVCF function and capacity — `check-nvcf-function`

Provide `function_id` and `function_version_id`. Report must show:

| Check | What to look for |
|-------|------------------|
| Control-plane status | `ACTIVE` — not stuck `DEPLOYING` >15 min or `ERROR` |
| **Min / max instances** | Compare to current concurrent sessions; timeouts often start when load exceeds `minInstances` |
| **`activeInstances`** | At or near `maxInstances` → saturation |
| Cluster | Healthy cluster with available quota (not full or `instance-terminated-no-capacity`) |
| Function type | `STREAMING` with Low Latency Streaming enabled |

Example from : min **8**, max **16** — first ~7 sessions reliable, additional sessions often 408 until scale-up completes.

### 3. NVCF logs (History and Live Tail)

Open [NVCF functions](https://nvcf.ngc.nvidia.com/functions) → your function → **Logs**.

| Log signal | Interpretation |
|------------|----------------|
| New pod starting, no **RTX Ready** yet | Cold start in progress — client may timeout before instance is invocable |
| **RTX Ready** on new instance but session already failed | Scale-up slower than portal backend timeout ( gap) |
| **`instance-terminated-no-capacity`** | Cluster full — redeploy to another cluster or lower max instances |
| Scaling / autoscaler events | Invocation-based scale may lag for LLS paths (, fixed) |

Correlate failing `sessionId` from the portal URL with NVCF Live Tail instance IDs when available.

### 4. Load and session hygiene

- Count active portal sessions for the app (or ask the user how many streams are open).
- After any timeout failure, verify the user starts a **new** session — stale IDs produce 404 or abnormal WebSocket closure.
- For stress tests, note browser: Firefox multi-client issues are a separate symptom .

## Fix

Apply the smallest change that matches your diagnosis. Change one variable at a time.

1. **Capacity saturation** — Wait for other sessions to disconnect, or increase **Max Instances** and redeploy. Confirm cluster quota allows the new max ([max-instances-over-available.md](../nvcf-deployment/max-instances-over-available.md)).

2. **Cold start / min pool too small** — Increase **Min Instances** so enough pods are pre-warmed for expected concurrency. Align with portal timeout expectations .

3. **Cluster capacity** — If logs show `instance-terminated-no-capacity` or quota errors, lower max instances, pick another cluster (another cluster your org can use), or contact your NVCF platform owner for capacity.

4. **Stale session after failure** — Start a **new** session from the portal home tile; do not reload or reconnect the failed session.

5. **Function not ready** — If status is `DEPLOYING` or pods crash before RTX Ready, fix health/build issues first (see [deploying-over-15-minutes.md](../nvcf-deployment/deploying-over-15-minutes.md)) — timeouts will persist until the function is `ACTIVE`.

6. **Intermittent under load** — Some environments retry until a viable connection is made; if failures persist after scaling fixes, capture `sessionId`, concurrent count, and NVCF Live Tail for escalation.

## Verification

1. Run `check-nvcf-function` — status `ACTIVE`, `minInstances` / `maxInstances` reflect your change, `activeInstances` below max under test load.
2. Run `check-streaming-app` — portal status healthy, deployment fields updated after redeploy.
3. Start a **new** session with no other clients connected — confirm the banner does not appear.
4. Repeat with concurrent sessions up to your expected peak; verify failure rate drops after min/max adjustment.
5. After a forced timeout, confirm a fresh session succeeds (not reconnect to the failed ID).

## Related patterns

| Resource | Relevance |
|----------|-----------|
| Root autoscaler / LLS invocation scaling issue | Addressed in a prior NVCF platform release; increase min instances if still on older builds |
| [STREAMING-REFERENCE.md](../STREAMING-REFERENCE.md) | Symptom table; Phase A–C checklist |
| [http-408-creating-session.md](../nvcf-deployment/http-408-creating-session.md) | HTTP 408 at session creation (earlier in flow) |
| [max-instances-over-available.md](../nvcf-deployment/max-instances-over-available.md) | NGC UI blocks deploy when max exceeds cluster quota |
| [instance-terminated-no-capacity.md](../nvcf-deployment/instance-terminated-no-capacity.md) | Pod terminated for capacity |
| [NVCF debuggability](https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html) | History vs Live Tail, instance correlation |

## Agent notes

- Always run **`check-streaming-app`** before **`check-nvcf-function`** when the user has a portal URL — resolve `function_id` and deployment min/max from the app record.
- Distinguish **WebSocket timeout** (this doc’s banner, close code 3008) from **HTTP 408 on POST /sessions/** (different user-facing text) — both point to NVCF capacity/scale-up but occur at different pipeline stages.
- The portal backend does **not retry** session creation on NVCF timeout ; instruct users to start a new session rather than hammering the same ID.
- When `activeInstances` ≈ `maxInstances`, saturation is the leading hypothesis — fix scaling before chasing Kit build issues.
- Do not echo API keys or portal tokens when running check skills.