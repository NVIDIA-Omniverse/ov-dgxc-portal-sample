---
id: stun-unknown-method-kit108
category: portal-ui
symptom: "STUN unknown method 0x111 (Kit 108)"
status: complete
skills:
 - check-nvcf-function
docs:
  - "https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html"
  - "https://www.npmjs.com/package/@nvidia/ov-web-rtc"
  - "https://github.com/NVIDIA-Omniverse/web-viewer-sample"
---

# STUN unknown method (Kit 108)

## Summary

When connecting an **outdated [web-viewer-sample](https://github.com/NVIDIA-Omniverse/web-viewer-sample)** (or a custom frontend that copies its config) to **Kit 108+**, the browser client fails to establish WebRTC and Kit logs repeat:

```text
[Warning] [omni.kit.livestream.streamsdk] [NattHolePunch] STUN unknown method 0x111
```

This is **not** a broken STUN server on Kit. Engineering traced it to a **client ↔ Kit 108 media-port mismatch**: older sample clients hard-code `mediaPort` (legacy **47998** behavior), while Kit 108 **`omni.kit.livestream.app` ≥ 8.0.4** restored the default primary stream port to **47998** but clients must **not** override it—the [web-streaming-library](https://www.npmjs.com/package/@nvidia/ov-web-rtc) lets Kit negotiate ports and works on the same Kit build.


**Applies to:** Local Kit 108 dev with web-viewer-sample; custom React/Vite apps embedding an old `@nvidia/web-streaming-library` / `@nvidia/ov-web-rtc` fork; NVCF when the **container** is Kit 108 but the **browser client** still passes explicit `mediaPort`. The Omniverse portal ships its own client—this doc matters when you test with web-viewer-sample or maintain a custom UI.

## Client library (`@nvidia/ov-web-rtc`)

Kit log **`STUN unknown method 0x111`** is server-side. In the browser, a misconfigured client may later surface **`StreamerNoStunResponsesReceived`** (`0xC0F22226`) or **`StreamerIceConnectionFailed`** (`0xC0F22206`). Do **not** set `mediaPort` to legacy **47998** on Kit 108+; let the library negotiate (portal omits `mediaPort` unless `app.mediaPort` is set). See [OV-WEB-RTC-ERROR-CODES.md](../OV-WEB-RTC-ERROR-CODES.md).

---

## When you see this

| Observation | Notes |
|---------------|--------|
| Kit console floods `STUN unknown method 0x111` from `[NattHolePunch]` | Signature path: `omni.kit.livestream.streamsdk` |
| Browser never shows video; connect spinner or generic failure | Differs from **No peer info found** (portal/NVCF path) |
| Same Kit build works with **web-streaming-library** dev client | Strong signal for client config, not GPU/OS |
| Regression from **Kit 107.3.x** with same web-viewer-sample branch | Kit 108 changed livestream app extension defaults |
| Repro on multiple GPUs/OS (Windows 11, Ubuntu 22.04) | Rules out single-machine NAT quirk |
| `omni.kit.livestream.app` enabled | Required for Kit 108 app streaming; absence causes other failures |

Collect: Kit build, `omni.kit.livestream.app` version, client branch, presence of `mediaPort` in config/code, local vs NVCF/portal path.

---

## Root cause

Kit 108 reshaped application streaming around **`omni.kit.livestream.app`** (replacing older StreamSDK-only paths). Extension changelog:

| Version | Port behavior |
|---------|----------------|
| **8.0.3** | Default primary stream port briefly reverted to **1024** (legacy) |
| **8.0.4** | Default primary stream port restored to **47998** |

The public **web-viewer-sample** still passed an explicit **`mediaPort`** in `stream.config.json` and from `Window.tsx`. That forced the browser to open the wrong media path while Kit 108 NAT hole-punch (`NattHolePunch`) expected negotiated defaults—packets hit the wrong endpoint and surface as **`STUN unknown method 0x111`**, not a literal unsupported STUN RFC opcode in isolation.

```mermaid
sequenceDiagram
 participant Client as web-viewer-sample (old)
 participant Kit as Kit 108 + livestream.app
 participant NAT as NattHolePunch

 Kit->>Kit: Primary stream on default port (47998)
 Client->>Client: mediaPort hard-coded in config
 Client->>NAT: STUN/NAT on mismatched port
 NAT-->>Kit: STUN unknown method 0x111
 Note over Client: No video; library client omits mediaPort and works
```

| Fact | Detail |
|------|--------|
| Server-side Kit | Healthy when web-streaming-library connects on same build |
| Client-side fix | Remove `mediaPort` from config and connect params |
| Related port bug | — same port-default theme |
| Signaling vs media | WebRTC **signaling** stays **49100**; this issue is **media/stream port** negotiation, not inference `/sign_in` |

---

## Diagnostic workflow

Follow [STREAMING-REFERENCE.md](../STREAMING-REFERENCE.md) Phases A–C. For this symptom, prove client mismatch before rebuilding containers.

### Phase A — Kit backend (local or NVCF)

- [ ] Kit **108+** with **`omni.kit.livestream.app`** enabled (manual extension toggle locally, or `[nvcf_streaming]` layer in packaged app)
- [ ] Log search **`livestream`**: minimum 108.x versions ([STREAMING-REFERENCE.md](../STREAMING-REFERENCE.md)):

| Extension | Minimum (108.x) |
|-----------|-----------------|
| `omni.services.livestream.session` | ≥ 8.0.2 |
| `omni.kit.livestream.webrtc` | ≥ 8.0.7 |
| `omni.kit.livestream.core` | ≥ 8.0.2 |
| `omni.kit.livestream.app` | ≥ 8.0.4 |

- [ ] Note **`omni.kit.livestream.app`** version in console at startup (8.0.3 vs 8.0.4 changes default port behavior)
- [ ] NVCF deploy: **`check-nvcf-function`** — ACTIVE, STREAMING, health **8011** `/v1/streaming/ready`, inference **49100** `/sign_in` (rules out unrelated deploy failures)

### Phase B — Isolate client vs Kit

1. Reproduce with **[web-streaming-library](https://www.npmjs.com/package/@nvidia/ov-web-rtc)** on the same Kit instance ( isolation step).
2. If library works and web-viewer-sample fails → **client config** (this doc).
3. If both fail → check [no-peer-info-found.md](no-peer-info-found.md), plugin versions, and Kit file (`*_nvcf.kit`).

### Phase C — Inspect client configuration

| Check | Bad (triggers bug) | Good |
|-------|-------------------|------|
| `stream.config.json` | `"mediaPort": …` present | Field **absent** |
| Connect / `AppStreamer` params | `mediaPort` passed in code | Omit; let library negotiate |
| Package | Old `@nvidia/web-streaming-library` / `@nvidia/ov-web-rtc` pin | Match Kit 108–compatible release (portal example uses `@nvidia/ov-web-rtc` ≥ 6.4.x) |
| web-viewer-sample branch | Pre-fix `main` (~Aug 2025) | **`main`** after fix (verified stage.13+) |

**Browser devtools:** correlate failed connect attempt timestamp with Kit `NattHolePunch` warnings.

---

## Fix

### Option A — Update web-viewer-sample (recommended for sample users)

1. Pull latest **`main`** from [web-viewer-sample](https://github.com/NVIDIA-Omniverse/web-viewer-sample) (STUN fix merged on `main`).
2. Confirm **`mediaPort` removed** from:
 - `stream.config.json`
 - `Window.tsx` (or equivalent connect call — engineering cited ~line 477 in Aug 2025 `main`)
3. `npm install && npm run dev`; connect with **`omni.kit.livestream.app`** running on Kit 108.

QA verified: **Kit 108.0.0-stage.13** + updated sample **main** → pass.

### Option B — Patch custom / portal frontend

1. Remove `mediaPort` from JSON config and every `AppStreamer.connect` call (do **not** set it to 47998—omit the field entirely; ).
2. Bump **`@nvidia/ov-web-rtc`** to a Kit-108-compatible release (this repo uses ≥ 6.4.x in `web/package.json`).
3. For multi-stream, set **`signalingPort`** only when needed ([second-stream-gray.md](second-stream-gray.md)); NVCF images need 108 livestream extensions and `NVDA_KIT_ARGS`: `--/exts/omni.services.livestream.session/resumeTimeoutSeconds=300`.

### Option C — Rebuild Kit from template (client already fixed)

If STUN errors persist with an updated client, rebuild from Kit App Template **`[nvcf_streaming]`** / **`feature/108.0`** ( — kit-sdk-public packages failed while template builds worked). Use `omni.kit.livestream.app`, not legacy 107 StreamSDK-only stack .

---

## Quick checks (TL;DR)

1. Kit logs: search **`STUN unknown method 0x111`** and **`NattHolePunch`** — confirms this symptom vs other stream failures.
2. Same Kit: **web-streaming-library** connects → update/remove **`mediaPort`** in your client.
3. **`omni.kit.livestream.app` ≥ 8.0.4** enabled; verify extension list in Kit console.
4. web-viewer-sample on **`main`** post-Aug 2025 fix, or manually strip `mediaPort` from config + connect code.
5. NVCF: **`check-nvcf-function`** ACTIVE + 108 plugin versions before blaming browser-only config.

---

## Related patterns

| Title / theme | Outcome |
|------|------|
| Web Viewer Sample + Kit 108 → STUN 0x111 | Remove `mediaPort` from client config; verified with Kit 108 stage builds and sample `main` |
| Port-default streaming failure | Do not hard-code media port |
| StreamSDK plugins on Kit 108 | Expected configuration — migrate to `omni.kit.livestream.app` |

---

## When this is not the issue

- **No peer info found** / deploy failures → [no-peer-info-found.md](no-peer-info-found.md)
- **Second stream gray** (signaling port) → [second-stream-gray.md](second-stream-gray.md)
- **0xC0F22226** opaque timeout → [streamer-no-stun-responses-received.md](streamer-no-stun-responses-received.md)

---

## Further reading

- [STREAMING-REFERENCE.md](../STREAMING-REFERENCE.md), Kit 108 extensions
- — [web-viewer-sample](https://github.com/NVIDIA-Omniverse/web-viewer-sample) — [web-streaming-library](https://www.npmjs.com/package/@nvidia/ov-web-rtc)
