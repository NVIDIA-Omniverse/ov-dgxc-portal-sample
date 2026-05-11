---
id: streamer-no-stun-responses-received
category: portal-ui
symptom: "No displayable error message found for error code 0xC0F22226"
aliases:
 - error-0xc0f22226
rerror_codes:
 - StreamerNoStunResponsesReceived
status: complete
skills:
 - check-nvcf-function
docs:
  - "https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html"
---

# StreamerNoStunResponsesReceived (0xC0F22226)

## Symptom

The portal often shows the **fallback** string when the library maps the code internally but the UI prints both decimal and hex:

> **No displayable error message found for error code 3237093926 0xC0F22226**

(`3237093926` is decimal for `0xC0F22226`.)

The underlying `@nvidia/ov-web-rtc` enum is **`StreamerNoStunResponsesReceived`** with mapped text:

> **Client sent STUN requests but did not receive any responses from the server.**

Failures occur during WebRTC ICE/STUN while the browser tries to reach the streaming server—often private clusters, firewall/NAT, or media/signaling path misconfiguration—not a generic opaque “StreamSDK timeout.”

## Client library (`@nvidia/ov-web-rtc`)

| Field | Value |
|-------|--------|
| Enum | `StreamerNoStunResponsesReceived` |
| Hex | `0xC0F22226` |
| Mapped message | Client sent STUN requests but did not receive any responses from the server. |
| Related codes | `StreamerNoNominatedCandidatePairs` (`0xC0F22227`), `StreamerIceConnectionFailed` (`0xC0F22206`) |

See [OV-WEB-RTC-ERROR-CODES.md](../OV-WEB-RTC-ERROR-CODES.md). discussed broader LLS timeouts; prefer STUN/NAT/cluster checks when this hex appears.

## When you see this

This appears at **stream start** (Phase C), after portal session creation and while the browser is connecting to Kit through NVCF LLS.

| Pattern | What it suggests |
|---------|------------------|
| **Intermittent timeouts** (same function, some launches OK) | Network path to STUN/media, bad instances, or overloaded Kit before ICE completes |
| **Consistent failure on one cluster** | **Private-streaming** or non-standard cluster blocking STUN (e.g. `prd2`, dedicated media servers) |
| **After container or extension change** | Mismatched `omni.kit.livestream.*` / `omni.services.livestream.*` versions vs Kit major |
| **Geographic / latency sensitivity** | Reported for remote users (e.g. Europe) on otherwise healthy functions — treat as signal to check RTX Ready timing and cold start, not as a separate root cause by itself |
| **Every launch fails with wrong NVCF config** | Rule out [http-501-streaming-session.md](http-501-streaming-session.md) and [no-peer-info-found.md](no-peer-info-found.md) first — different banner text |

Collect: exact error string (decimal and hex), portal URL or `app_id`, Kit version, `function_id` / `function_version_id`, NVCF **cluster** name(s), container image tag, failure rate (%), and user region if relevant.

## Diagnosis

Work Phase A (NVCF backend) before blaming the browser. Primary skill: **`check-nvcf-function`**.

### 1. NVCF function configuration — `check-nvcf-function`

Provide `function_id` and `function_version_id`. From the skill report, record:

| Check | Expected for Kit streaming |
|-------|---------------------------|
| Control-plane status | `ACTIVE` (not stuck `DEPLOYING` >15 min, `ERROR`, `DEGRADED`) |
| Function type | `STREAMING` with Low Latency Streaming |
| Inference | Port **49100**, path **`/sign_in`** |
| Health | Port **8011** (Kit ≥107.3.3) or template-specific 8111/8311; URI **`/v1/streaming/ready`**; HTTP 200 |
| **Container image** | Tag matches the Kit build you intend to run; note `latest` cache confusion |
| **Cluster(s)** | List every entry in `deployment.deploymentSpecifications[].clusters[]` |

**Cluster interpretation:** documents this error with **private-streaming** deployments (example cluster naming: `az25-prd2`). If the function targets a dedicated/private cluster, compare behavior against a known-good **public** OVC cluster before deep-diving on Kit code.

Also capture `containerEnvironment` for `NVDA_KIT_ARGS` (resume timeout should be **300** for portal compatibility — see Fix).

### 2. NVCF logs (History and Live Tail)

Open [NVCF functions](https://nvcf.ngc.nvidia.com/functions) → function → **Logs**.

For a **failed** session, use Live Tail with that session’s instance ID.

| Log signal | Interpretation |
|------------|----------------|
| No **RTX Ready** before client timeout | Kit/GPU still starting — client may hit StreamSDK timeout first |
| **RTX Ready** present but stream still times out with 0xC0F22226 | Signaling/WebRTC path, plugin versions, or cluster/network — not raw GPU init |
| Search **`livestream`** | Confirm minimum extension versions for your Kit major (table below) |
| StreamSDK / signaling errors near timeout | Kit-side StreamSDK server not ready in time — aligns with triage (“increasing timeout to StreamSDK server on Kit-side”) |

**Minimum livestream plugins** (from STREAMING-REFERENCE — versions in logs must meet or exceed):

| Kit | Minimum extensions |
|-----|-------------------|
| 106.x / 107.x | `omni.services.livestream.nvcf` ≥7.2.0; `omni.kit.livestream.webrtc` ≥7.0.0; `omni.kit.livestream.core` ≥7.5.1 |
| 108.x | `omni.services.livestream.session` ≥8.0.2; `omni.kit.livestream.webrtc` ≥8.0.7; `omni.kit.livestream.core` ≥8.0.2; `omni.kit.livestream.app` ≥8.0.4 |

Wrong or mixed Kit-major plugins (e.g. 107 StreamSDK on 108 Kit — see ) can produce opaque client timeouts.

### 3. Build and streaming layer (if logs show gaps)

| Kit | Streaming setup |
|-----|-----------------|
| 108+ | `[nvcf_streaming]` layer; `*_nvcf.kit` |
| 107.x | `[ovc_streaming]` layer; `_ovc.kit` |
| 106.x | `omni.services.livestream.nvcf` in kit file (not webrtc alone) |

See [missing-livestream-extensions.md](../build-package/missing-livestream-extensions.md) and [forgot-nvcf-streaming-layer.md](../build-package/forgot-nvcf-streaming-layer.md).

### 4. Differentiate similar portal errors

| Banner / code | Doc |
|---------------|-----|
| **No peer info found** | [no-peer-info-found.md](no-peer-info-found.md) |
| **Failed to connect … timeout — try again later** (portal wording) | [stream-timeout-try-again-later.md](stream-timeout-try-again-later.md) — often capacity / max instances |
| **HTTP 408** on session create | [http-408-creating-session.md](../nvcf-deployment/http-408-creating-session.md) |
| **HTTP 501** | [http-501-streaming-session.md](http-501-streaming-session.md) |

## Fix

Change one variable at a time. Match the fix to what `check-nvcf-function` and logs show.

1. **Cluster** — If deployed only on a private-streaming cluster, redeploy or add a deployment spec on a supported public OVC cluster known to work for LLS Kit apps. Re-test failure rate.

2. **Livestream plugins / image** — Rebuild the container with the correct streaming layer and extension set for your Kit major; push a new image tag; deploy a new function version. Update the portal app to the new `function_version_id`.

3. **NVCF streaming endpoints** — Ensure LLS is on, inference **49100** + **`/sign_in`**, health **`/v1/streaming/ready`** on the correct control port. In the NGC UI, fill **Health** before **Inference** (form-order quirk).

4. **Cold start / capacity** — If timeouts correlate with empty pools, raise **min instances** and review [stream-timeout-try-again-later.md](stream-timeout-try-again-later.md) and [http-408-creating-session.md](../nvcf-deployment/http-408-creating-session.md).

5. **Portal resume alignment** — Set `NVDA_KIT_ARGS` on the function:
 - Kit 106–107: `--/app/livestream/nvcf/sessionResumeTimeoutSeconds=300`
 - Kit 108+: `--/exts/omni.services.livestream.session/resumeTimeoutSeconds=300`

6. **Kit-side StreamSDK timeout** — If RTX Ready appears late in logs but the client always times out first, work with Kit/livestream owners to increase StreamSDK server timeout settings for your app (initial direction in ). This is not exposed in the portal sample repo.

7. **Fresh session** — After any config change, start a **new** session (not Reload/Reconnect from a failed attempt).

## Verification

1. Run **`check-nvcf-function`** — `ACTIVE`, clusters documented, inference/health/endpoints match the table in Diagnosis.
2. NVCF History on a test launch — **RTX Ready** and `livestream` lines show expected extension versions before the user connects.
3. Start a **new** portal session — banner with `0xC0F22226` must not appear; video and input work.
4. For intermittent cases, run ≥10 launches; record `sessionId`, cluster, and instance ID for any failure; compare failing vs successful Live Tail.
5. If users are geographically distant, repeat verification from the affected region or note latency after min-instances > 0.

## Related patterns

| Resource | Relevance |
|----------|-----------|
| **Non-deterministic** LLS timeout with `0xC0F22226` | Custom Kit on NVCF, geographic latency, or private-streaming clusters; may need Kit-side StreamSDK timeout tuning — treat as live investigation when plugins and endpoints are already correct |
| [NVCF debuggability](https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html) | History vs Live Tail, instance correlation |
| [STREAMING-REFERENCE.md](../STREAMING-REFERENCE.md) | Symptom row for 0xC0F22226, plugin matrix, Phase A–C checklist |
| [no-peer-info-found.md](no-peer-info-found.md) | Peer registration failure (different message) |
| [stream-timeout-try-again-later.md](stream-timeout-try-again-later.md) | Portal capacity timeout wording |
| [missing-livestream-extensions.md](../build-package/missing-livestream-extensions.md) | Build-time extension gap |

## Agent notes

- Use **`check-nvcf-function`** as the primary skill; resolve `function_id` / `function_version_id` from the user or from `check-streaming-app` when a portal URL is available (not required in frontmatter for this issue).
- Always report **cluster names** and **container image** from the deployment spec — private-streaming clusters are a first-class hypothesis for this error code.
- **`0xC0F22226` is not self-describing** — do not assume a single root cause; correlate RTX Ready timing, livestream versions, and cluster type.
- Historical reports closed without a verified fix; treat open customer reports as live investigations, not “already fixed in a past release.”
- Do not echo API keys in commands or chat when running NVCF API checks.