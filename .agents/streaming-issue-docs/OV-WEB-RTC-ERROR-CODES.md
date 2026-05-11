# `@nvidia/ov-web-rtc` error reference

Client-side streaming errors for Omniverse portal and custom apps. Extracted from the bundled library in this repo (`web/package.json`: `@nvidia/ov-web-rtc` **6.4.5**). Upstream: [web-streaming-library](https://www.npmjs.com/package/@nvidia/ov-web-rtc) (npm scope `@nvidia/ov-web-rtc`).

Regenerate after package bumps:

```bash
node web/scripts/extract-rerror-messages.mjs
```

## How errors reach the user

| Layer | Mechanism | Typical text |
|-------|-----------|--------------|
| **ov-web-rtc** | `StreamEvent.info` when `EventStatus.ERROR` on `onStart` / `connect` | Mapped `RErrorCode` string, or fallback below |
| **ov-web-rtc fallback** | `defaultMessage(code)` when enum has no `case` in `map` | `No displayable error message found for error code <decimal> <hex>` |
| **Portal UI** | `useStream` sets `error` from `message.info`; `StreamError` title | **Failed to load the stream** + detail line |
| **Portal backend** | `POST /sessions/` or WebSocket `/sign_in` | **Not** `RErrorCode` — HTTP status + plain text (see below) |
| **Session record** | `PATCH /sessions/{id}/` via `reportSessionError` | Stores client `message.info` for admin session list |

### `EventStatus` (library)

| Value | Meaning |
|-------|---------|
| `success` | Step completed |
| `error` | Fatal for current action |
| `warning` | Non-fatal (e.g. reconnect attempt, 4K codec warning) |
| `inProgress` / `waiting` | In flight |

### Portal backend messages (not `RErrorCode`)

| When | HTTP / close | User-facing text (source) |
|------|----------------|---------------------------|
| NVCF `POST /sign_in` times out | **408** on `POST /sessions/` | `This could be caused by network congestion or no GPUs available. Please try again.` — see [nvcf-deployment/http-408-creating-session.md](nvcf-deployment/http-408-creating-session.md) |
| Session create fails | **501** etc. | `Failed to start a streaming session -- HTTP<status>` — see [portal-ui/http-501-streaming-session.md](portal-ui/http-501-streaming-session.md) |
| WebSocket proxy timeout | close **3008** | `Failed to connect a streaming session with a timeout -- try again later.` — see [portal-ui/stream-timeout-try-again-later.md](portal-ui/stream-timeout-try-again-later.md) |

### Library reconnect warning (before hard failure)

During `onStart`, if `maxReconnects` not exhausted:

`N of M connection attempts have failed. Retrying...`

(`maxReconnects` default **5**, `reconnectDelay` default **2000** ms — `DirectConfig` in `ov-web-rtc.d.ts`.)

HTTP sign-in retries (separate from WebRTC): log text `Failing with <status>, retries left <n>` inside the library HTTP client.

---

## Symptom router (portal banner → code → doc)

| User-visible detail (substring) | `RErrorCode` | Hex | Issue doc |
|----------------------------------|--------------|-----|-----------|
| **No peer info found** | `StreamerNoPeerInfo` | `0xC0F22218` | [portal-ui/no-peer-info-found.md](portal-ui/no-peer-info-found.md) |
| **sign-in request to signaling server** | `StreamerSignInFailure` | `0xC0F22202` | [portal-ui/streamer-sign-in-failure.md](portal-ui/streamer-sign-in-failure.md) |
| **Sign in request timed out** | `StreamerSignInTimeout` | `0xC0F22213` | [portal-ui/streamer-sign-in-failure.md](portal-ui/streamer-sign-in-failure.md) |
| **0xC0F22226** / **3237093926** | `StreamerNoStunResponsesReceived` | `0xC0F22226` | [portal-ui/streamer-no-stun-responses-received.md](portal-ui/streamer-no-stun-responses-received.md) |
| **Could not find valid ice candidate pair** | `StreamerIceConnectionFailed` | `0xC0F22206` | Often NAT/firewall/cluster; also see STUN doc above |
| **no remote peer** | `StreamerGetRemotePeerTimedOut` | `0xC0F22207` | Related to [no-peer-info-found.md](portal-ui/no-peer-info-found.md) |
| **video pipeline** / **VideoSetupTimeOut** | `StreamerVideoSetupTimeOut` | `0xC0F22225` | [nvcf-deployment/deploying-over-15-minutes.md](nvcf-deployment/deploying-over-15-minutes.md) |
| **input channel error** | `StreamInputChannelError` | `0xC0F22208` | [portal-ui/stream-not-interactive.md](portal-ui/stream-not-interactive.md) |
| **Session Limit Exceeded** | `SessionLimitExceeded` | `0xC0F2210B` | [portal-ui/stream-timeout-try-again-later.md](portal-ui/stream-timeout-try-again-later.md) |
| **ConcurrentSessionLimitExceeded** (server disconnect) | `ServerDisconnectedConcurrentSessionLimitExceeded` | `0xF22344` | [portal-ui/stream-timeout-try-again-later.md](portal-ui/stream-timeout-try-again-later.md) |
| **user inactivity** / **UserIdle** | `ClientDisconnectedUserIdle` / `ServerDisconnectedUserIdle` | `0xF22009` / `0xF22324` | [portal-ui/failed-stream-after-idle-reconnect.md](portal-ui/failed-stream-after-idle-reconnect.md) |
| **Failed to start a streaming session -- HTTP501** | *(portal API)* | — | [portal-ui/http-501-streaming-session.md](portal-ui/http-501-streaming-session.md) |
| **timeout -- try again later** (408 or WS 3008) | *(portal backend)* | — | [nvcf-deployment/http-408-creating-session.md](nvcf-deployment/http-408-creating-session.md), [stream-timeout](portal-ui/stream-timeout-try-again-later.md) |
| **No displayable error message** | Unmapped or missing `map` case | varies | Decode hex → table below or [OV-WEB-RTC-ERROR-CODES-FULL.md](OV-WEB-RTC-ERROR-CODES-FULL.md) |

Kit log **STUN unknown method 0x111** is a **server-side** log string, not an `RErrorCode`; see [portal-ui/stun-unknown-method-kit108.md](portal-ui/stun-unknown-method-kit108.md).

---

## Streamer category (`0xC0F222xx`) — common codes

| Enum | Decimal | Hex | User message |
|------|---------|-----|--------------|
| `StreamErrorGeneric` | 3237093889 | 0xC0F22201 | Some generic error happened in streamer. |
| `StreamerSignInFailure` | 3237093890 | 0xC0F22202 | Error occurred during sign-in request to signaling server. |
| `StreamerHangingGetFailure` | 3237093891 | 0xC0F22203 | Error occurred in hanging get request of peer connection. |
| `StreamerNetworkError` | 3237093892 | 0xC0F22204 | *(see full table)* |
| `StreamerVideoPlayError` | 3237093893 | 0xC0F22205 | Video play failure. |
| `StreamerIceConnectionFailed` | 3237093894 | 0xC0F22206 | Could not find valid ice candidate pair. |
| `StreamerGetRemotePeerTimedOut` | 3237093895 | 0xC0F22207 | Streaming stopped due to no remote peer. |
| `StreamInputChannelError` | 3237093896 | 0xC0F22208 | Streaming stopped due to input channel error. |
| `StreamCursorChannelError` | 3237093897 | 0xC0F22209 | Streaming stopped due to cursor channel error. |
| `StreamControlChannelError` | 3237093898 | 0xC0F2220A | Streaming stopped due to control channel error. |
| `StreamerSignInTimeout` | 3237093907 | 0xC0F22213 | Sign in request timed out. |
| `StreamerNoPeerInfo` | 3237093912 | 0xC0F22218 | **No peer info found.** |
| `StreamerNoVideoTrack` | 3237093905 | 0xC0F22211 | *(see full table)* |
| `StreamerVideoSetupTimeOut` | 3237093925 | 0xC0F22225 | Client timed-out while waiting for server to setup video pipeline. |
| `StreamerNoStunResponsesReceived` | 3237093926 | 0xC0F22226 | **Client sent STUN requests but did not receive any responses from the server.** |
| `StreamerNoNominatedCandidatePairs` | 3237093927 | 0xC0F22227 | *(see full table)* |

---

## Agent workflow

1. Capture the **exact** banner line and any `0x…` / decimal code from the user or session `error` field (`check-streaming-app`).
2. If text matches the symptom router, open the linked issue doc.
3. If **No displayable error message**, convert decimal to hex and look up enum in [OV-WEB-RTC-ERROR-CODES-FULL.md](OV-WEB-RTC-ERROR-CODES-FULL.md) or the streamer table above.
4. Distinguish **portal HTTP/WS** errors from **RErrorCode** (408/501/3008 are backend proxy, not WebRTC enum).
5. Confirm NVCF/signaling with `check-nvcf-function` when the code is `Streamer*` or `Stream*`.

---

## Related types in portal code

- `web/src/hooks/useStream.ts` — `AppStreamer.connect`, `onStart` → `setError(message.info)`
- `web/src/components/StreamError.tsx` — default title **Failed to load the stream**
- `DirectConfig.signalingPort` default **49100** in types; portal sets port from session URL

See also [README.md](README.md) issue index.
