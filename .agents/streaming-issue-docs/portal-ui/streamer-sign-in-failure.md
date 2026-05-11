---
id: streamer-sign-in-failure
category: portal-ui
symptom: "Error occurred during sign-in request to signaling server. 0 retries left"
aliases:
 - sign-in-signaling-cookie-error
rerror_codes:
 - StreamerSignInFailure
 - StreamerSignInTimeout
status: complete
skills:
  - check-nvcf-function
docs:
  - "https://docs.omniverse.nvidia.com/omniverse-dgxc/latest/index.html"
  - "https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html"
---

# StreamerSignInFailure (sign-in to signaling server)

## Symptom

The portal shows a red banner when the user tries to start or load a stream:

> **Failed to load the stream**
> Error occurred during sign-in request to signaling server. 0 retries left.
> Reload, Start a new session

Some builds show a slightly different prefix (`Error during sign-in request…`); the **`0 retries left`** suffix and **signaling server** wording are the distinguishing markers.

The browser or portal backend could not complete the WebRTC **sign-in** handshake to the NVCF signaling path (`/sign_in` on port 49100). This is a **stream-start** failure (Phase C), not a deployment or registration problem.

## Client library (`@nvidia/ov-web-rtc`)

| Field | Value |
|-------|--------|
| Enum | `StreamerSignInFailure` (also `StreamerSignInTimeout` → **Sign in request timed out.**) |
| Hex | `0xC0F22202` / `0xC0F22213` |
| Mapped message | **Error occurred during sign-in request to signaling server.** |

The portal may append **`0 retries left`** from the library HTTP client (`retries left N` in logs). That is separate from `maxReconnects` WebRTC retries. See [OV-WEB-RTC-ERROR-CODES.md](../OV-WEB-RTC-ERROR-CODES.md).

## When you see this

| Pattern | What it suggests |
|---------|------------------|
| **After many portal sessions or long daily use** | Accumulated cookies for the portal origin exceeded browser or proxy header limits — the most common cause per the Kit guide |
| **Works in a private/incognito window** | Strong signal for cookie overload on the normal profile |
| **Fails on first launch on a clean browser** | Unlikely to be cookies alone — check NVCF streaming config (LLS, `/sign_in`, port 49100) |
| **Only one browser (e.g. Firefox)** | Rule out browser-specific client issues after clearing cookies; see [firefox-second-client-fails.md](../nvcf-deployment/firefox-second-client-fails.md) for multi-client cases |

Collect before diagnosing: portal URL (dev vs RC), exact banner text, browser and version, whether a private window works, and how many prior sessions the user ran today.

## Diagnosis

Treat this as a **browser-side cookie problem first**. Only inspect NVCF when cookie cleanup does not help.

### 1. Confirm cookie overload (Kit guide)

Per **OV on DGXC documentation — Troubleshooting**:

- The banner above appears when the stream starts.
- **This usually happens when your browser has too many cookies.**

Quick isolation:

1. Open the same app in a **private/incognito** window (fresh cookie jar).
2. If the stream starts, the normal profile has excess portal cookies — proceed to Fix step 1.
3. If it still fails, continue to step 2.

### 2. Inspect browser cookies for the portal origin

The portal sets multiple cookies over repeated sessions, including auth tokens (`id_token`, `access_token`), session routing (`nvcf-request-id`), and optional Nucleus tokens. Each launch can add or refresh cookies; stale rows are not always pruned immediately.

In DevTools → **Application** → **Cookies** → portal origin, a heavy profile may show dozens of entries. Very large `Cookie` headers can exceed default WebSocket or ingress limits (the portal Helm chart raises header buffers for this reason).

### 3. Rule out backend misconfiguration — `check-nvcf-function`

If clearing cookies does **not** fix the issue (including in a private window), the signaling endpoint may be wrong.

Provide `function_id` and `function_version_id`. Confirm:

| Check | Expected |
|-------|----------|
| Function type | `STREAMING` with **Low Latency Streaming** enabled |
| Inference | Port **49100**, path **`/sign_in`** |
| Control-plane status | `ACTIVE` (not stuck `DEPLOYING` or `ERROR`) |

Misconfigured functions often produce [http-501-streaming-session.md](http-501-streaming-session.md) instead, but wrong inference settings can also break sign-in. See [STREAMING-REFERENCE.md](../STREAMING-REFERENCE.md) Phase A.

### 4. Distinguish from similar portal errors

| Banner | Likely layer |
|--------|----------------|
| **No peer info found** | Kit peer registration, plugins, or bad NVCF instance — [no-peer-info-found.md](no-peer-info-found.md) |
| **HTTP501** | Function not created as STREAMING / LLS off — [http-501-streaming-session.md](http-501-streaming-session.md) |
| **Sign-in / signaling … 0 retries left** | Browser cookies (this doc) |

## Fix

Apply fixes in order. Change one variable at a time.

### 1. Clear portal site cookies (Kit guide — primary fix)

From **OV on DGXC documentation — Troubleshooting**:

1. Click the **info icon** in the address bar.
2. Open **Cookies and site data** → **Manage on-device site data**.
3. In the modal, **remove all cookies** for the portal site (click every trash-can icon shown).
4. Reload the portal, sign in again if prompted, and start a **new session** (not Reconnect).

Repeat for each portal origin you use (e.g. dev and RC are separate sites).

### 2. Private window or alternate browser (short-term)

Use a private/incognito window or a browser profile with no prior portal history to confirm the stream works while the main profile is cleaned up.

### 3. Backend fix (only if step 1 did not help)

Recreate or update the NVCF function: enable Low Latency Streaming, set inference to port **49100** and path **`/sign_in`**, and verify health **`/v1/streaming/ready`** on the correct control port. Fill **Health** before **Inference** in the NGC UI (known form-order quirk).

## Verification

1. After clearing cookies, start a **new session** from the app tile — the sign-in banner should not appear and video should load.
2. Run several back-to-back launches; confirm cookies do not grow without bound (check DevTools cookie count if failures return).
3. If cookies were not the cause, run `check-nvcf-function` — status `ACTIVE`, inference **49100** + **`/sign_in`**, LLS on.
4. Confirm a private-window test passes before and after cookie cleanup on the main profile.

## Related documentation

| Resource | Relevance |
|----------|-----------|
| [OV on DGXC documentation — Troubleshooting](https://docs.omniverse.nvidia.com/omniverse-dgxc/latest/index.html) | Official cookie-overload symptom and step-by-step browser cleanup |
| [STREAMING-REFERENCE.md](../STREAMING-REFERENCE.md) | Phase C checklist; sign-in/signaling triage card |
| [http-501-streaming-session.md](http-501-streaming-session.md) | When LLS or `/sign_in` is misconfigured |
| [no-peer-info-found.md](no-peer-info-found.md) | When sign-in succeeds but peer info is missing |
| [failed-stream-after-idle-reconnect.md](failed-stream-after-idle-reconnect.md) | Stale session after idle — different recovery path |

## Agent notes

- **Default to cookie cleanup first** — the Kit guide documents this as the usual cause; do not open an NVCF log deep-dive until the user has cleared site data or confirmed a private window works.
- Quote the Kit guide cleanup path verbatim when instructing users: address bar info icon → Cookies and site data → Manage on-device site data → remove all cookies in the dialog.
- A passing **private/incognito** test is sufficient evidence for cookie overload.
- If cleanup fails, run **`check-nvcf-function`** once to rule out STREAMING/LLS/inference misconfiguration before escalating.
- Instruct users to start a **new session** after cookie cleanup, not Reconnect on a stale row.
- Do not echo portal auth tokens or cookie values in chat or command output.
