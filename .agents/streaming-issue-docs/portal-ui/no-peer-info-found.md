---
id: no-peer-info-found
category: portal-ui
symptom: "Failed to load the stream — No peer info found"
rerror_codes:
 - StreamerNoPeerInfo
status: complete
skills:
 - check-nvcf-function
 - check-streaming-app
docs:
  - "https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html"
---

# No peer info found

## Symptom

The portal shows a red banner when the user tries to start or load a stream:

> **Failed to load the stream**
> No peer info found. 0 retries left.
> Reload, Start a new session

The portal could not obtain WebRTC peer information from the Kit instance. Signaling or peer registration failed before the browser could establish a media connection. The error may appear immediately on launch or a few seconds after the session starts.

## When you see this

This symptom appears at **stream start** (Phase C in the diagnostic foundation), after the portal has allocated an NVCF instance and the client is trying to connect.

| Pattern | What it suggests |
|---------|------------------|
| **Every launch fails** | Misbuilt container, missing streaming layers/extensions, or wrong NVCF health/inference configuration |
| **Intermittent (e.g. 10–20% of sessions)** | Faulty NVCF instances, stale peers, or infrastructure/LLS issues — reload often does not help |
| **After idle or Reconnect** | Stale portal session — use a fresh session instead of Reconnect (see [failed-stream-after-idle-reconnect.md](failed-stream-after-idle-reconnect.md)) |
| **Only on one portal/environment** | Portal or cluster-specific issue, not necessarily Kit version |

Collect before diagnosing: portal URL (or `app_id` from `/app/:appId/sessions/:sessionId`), exact banner text, Kit version, whether failure is 100% or intermittent, and `function_id` / `function_version_id` if known.

## Client library (`@nvidia/ov-web-rtc`)

| Field | Value |
|-------|--------|
| Enum | `StreamerNoPeerInfo` |
| Hex | `0xC0F22218` (decimal `3237093912`) |
| Mapped message | **No peer info found.** |

Portal title remains **Failed to load the stream**; detail line comes from `StreamEvent.info` in `useStream.ts`. Related: `StreamerGetRemotePeerTimedOut` (`0xC0F22207`). See [OV-WEB-RTC-ERROR-CODES.md](../OV-WEB-RTC-ERROR-CODES.md).

## Diagnosis

Work through backend health first, then portal wiring, then instance-level logs. Use the skills listed in frontmatter.

### 1. Portal app linkage — `check-streaming-app`

Provide `portal_url` and either `app_id` or both NVCF IDs.

Confirm:

- Portal **runtime status** is `ACTIVE` or `DEGRADING` (not `UNKNOWN` / `ERROR` / stuck `DEPLOYING`)
- `function_id` and `function_version_id` match the NVCF function you will inspect
- Portal and NVCF deployment use the **same NGC org**
- `authentication_type` matches the app (`NONE`, `OPENID`, `NUCLEUS`)

If status is `UNKNOWN`, fix ID/org mismatch before chasing stream errors.

### 2. NVCF function configuration — `check-nvcf-function`

Provide `function_id` and `function_version_id`. Report must show:

| Check | Expected for Kit streaming |
|-------|---------------------------|
| Control-plane status | `ACTIVE` (not `DEPLOYING` >15 min, `ERROR`, `DEGRADED`) |
| Function type | `STREAMING` with Low Latency Streaming |
| Inference | Port **49100**, path **`/sign_in`** |
| Health | Port **8011** (Kit ≥107.3.3) or template-specific 8111/8311 for older builds; URI **`/v1/streaming/ready`**; HTTP 200 |
| Deployment | Healthy cluster; no instance permanently marked error in NVCF UI |

Call out mismatches (e.g. wrong inference port, non-STREAMING type, health on wrong port).

### 3. NVCF logs (History and Live Tail)

Open [NVCF functions](https://nvcf.ngc.nvidia.com/functions) → your function → **Logs**.

For the **failing session**, use Live Tail with the session’s cluster and instance ID when available.

| Log signal | Interpretation |
|------------|----------------|
| No **RTX Ready** | Kit/GPU failed to start — scroll up for crash or shader errors |
| **RTX Ready** but no peer | Health/signaling path wrong, or livestream service not registering peers |
| Search **`livestream`** | Verify minimum plugin versions for your Kit (see STREAMING-REFERENCE) |
| One instance **red/error** in NVCF UI | Terminate or recycle that instance; may clear intermittent failures |

Map session → instance: portal URL `/app/:appId/sessions/:sessionId` gives `sessionId`; correlate via Live Tail instance ID or NVCF active instances.

### 4. Build and runtime settings (Kit app)

If logs show missing extensions or the container was built without streaming layers:

| Kit | Streaming setup |
|-----|-----------------|
| 108+ | `[nvcf_streaming]` layer; `*_nvcf.kit` |
| 107.x | `[ovc_streaming]` layer; `_ovc.kit` |
| 106.x | `omni.services.livestream.nvcf` (not webrtc alone) |

For customer Kit apps, confirm **render-instance** and **FSD** settings match Omniverse Cloud guidance. Non-default settings (e.g. rendering stancing OFF) were suspected in and should be ruled out with a rebuild using advised MO settings.

## Fix

Apply the smallest change that matches your diagnosis. Change one variable at a time.

1. **Configuration fix (100% failure)** — Recreate or update the NVCF function: enable Low Latency Streaming, inference **49100** + **`/sign_in`**, health **`/v1/streaming/ready`** on the correct control port. Fill Health before Inference in the NGC UI (known form-order quirk).

2. **Build fix** — Rebuild the container with the correct streaming layer and livestream extensions; redeploy a new function version and update the portal app.

3. **Bad instance (intermittent)** — In NVCF UI, identify and terminate error-state instances; optionally bounce min instances or redeploy to refresh the pool.

4. **Stale session** — Do not use Reload/Reconnect after idle failure; start a **new session** from the portal home tile.

5. **Portal/env-specific** — If the same Kit works on another portal deployment but fails on yours, escalate as infrastructure/LLS — see related patterns below.

6. **Kit args (portal compatibility)** — Kit 106–107: `--/app/livestream/nvcf/sessionResumeTimeoutSeconds=300`; Kit 108+: `--/exts/omni.services.livestream.session/resumeTimeoutSeconds=300`.

## Verification

1. Run `check-nvcf-function` again — status `ACTIVE`, endpoints match the table above.
2. Run `check-streaming-app` — portal status healthy, IDs unchanged.
3. Start a **new** streaming session (not reconnect); confirm the banner does not appear and video loads.
4. For intermittent cases, run multiple launches (≥10) and track failure rate; capture failing `sessionId` and NVCF Live Tail for any remaining failures.
5. In logs, confirm **RTX Ready** and livestream plugin versions before the client connects.

## Related patterns

| Resource | Relevance |
|----------|-----------|
| [NVCF debuggability](https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html) | History vs Live Tail, instance correlation |
| [STREAMING-REFERENCE.md](../STREAMING-REFERENCE.md) | Architecture, plugin matrix, Phase A–C checklist |
| [failed-stream-after-idle-reconnect.md](failed-stream-after-idle-reconnect.md) | Overlapping “Failed to load the stream” after idle |
| [http-501-streaming-session.md](http-501-streaming-session.md) | Non-STREAMING / wrong LLS config (different banner) |
| [missing-livestream-extensions.md](../build-package/missing-livestream-extensions.md) | Build-time extension mismatch |

## Agent notes

- Always run **`check-streaming-app`** before **`check-nvcf-function`** when the user has a portal URL — resolve `function_id` from the app record rather than guessing.
- Treat **intermittent** “No peer info found” differently from **100%** failure: the latter is almost always config/build; the former often involves bad NVCF instances or platform issues .
- **Reload does not fix** intermittent cases — instruct the user to start a new session and to check NVCF for red/error instances.
- If reproduction is portal-specific (same Kit works elsewhere), note environment in the report and search for `No peer info found OVC portal`.
- Do not echo API keys or portal tokens in chat or command output when running the check skills.
- Escalate to your NVCF / Omniverse platform owner when config and build are verified but intermittent failures persist.
