# Streaming issue documentation fleet

Per-issue guides for diagnosing and fixing Omniverse Kit / NVCF / portal streaming problems. Written for **external operators** using public NVIDIA documentation, GitHub samples, and their own portal/NVCF deployments — not internal-only URLs, org IDs, or chat channels.

Each file has YAML frontmatter (`id`, `category`, `symptom`, `status: complete`, plus optional `rerror_codes` / `aliases` / `skills` / `docs`). Section layout varies by issue, but most docs cover the same ground under whatever headings fit: what the user sees (`Symptom` / `Symptoms` / `Summary`), why it happens (`Diagnosis` / `Root cause` / `Diagnostic workflow`), how to fix it (`Fix` / `Fixes` / `Permanent fixes`), how to confirm (`Verification` / `Quick checks`), a related-links section (`Related patterns` or `Related documentation`), and `Agent notes` referencing `check-nvcf-function` and `check-streaming-app` where applicable.

### File naming

| Pattern | When to use | Examples |
|---------|-------------|----------|
| **User-visible substring** | Matches portal banner or exact library `map` text | `no-peer-info-found.md` → `StreamerNoPeerInfo` |
| **`streamer-<enum-kebab>.md`** | Primary cause is one `RErrorCode` but UI shows hex/fallback | `streamer-no-stun-responses-received.md` (`0xC0F22226`) |
| **Symptom / layer slug** | Portal backend HTTP/WS, Kit logs, or multi-code | `http-501-streaming-session.md`, `stun-unknown-method-kit108.md` |

Look up codes in [OV-WEB-RTC-ERROR-CODES.md](OV-WEB-RTC-ERROR-CODES.md). Frontmatter `aliases` lists retired filenames after renames.

## Layout

| Folder | Scope |
|--------|--------|
| [portal-ui/](portal-ui/) | Errors when starting or viewing a stream in the browser |
| [portal-registration/](portal-registration/) | App missing, wrong status, portal API auth |
| [nvcf-deployment/](nvcf-deployment/) | Function deploy, capacity, cluster, HTTP 408 |
| [build-package/](build-package/) | Kit App Template build and container packaging |
| [nucleus-auth/](nucleus-auth/) | Nucleus and headless authentication |

## Reference docs

- [STREAMING-REFERENCE.md](STREAMING-REFERENCE.md) — Kit/NVCF endpoints, plugin minimums, diagnostic phases
- [OV-WEB-RTC-ERROR-CODES.md](OV-WEB-RTC-ERROR-CODES.md) — symptom router for `@nvidia/ov-web-rtc` `RErrorCode` values and portal HTTP/WebSocket messages
- [OV-WEB-RTC-ERROR-CODES-FULL.md](OV-WEB-RTC-ERROR-CODES-FULL.md) — complete enum → message table (regenerate via `web/scripts/extract-rerror-messages.mjs`)

## Related skills

| Skill | Use when |
|-------|----------|
| `check-nvcf-function` | Verifying NVCF function status, health/inference ports, deployment, logs context |
| `check-streaming-app` | Verifying portal app metadata, `function_id` linkage, portal status |
| `diagnose-streaming-issues` | **Start here** — triage workflow, routes to fleet docs, invokes check skills ([SKILL.md](../skills/diagnose-streaming-issues/SKILL.md)) |

## Index

### portal-ui

| File | Symptom |
|------|---------|
| [no-peer-info-found.md](portal-ui/no-peer-info-found.md) | Failed to load the stream — No peer info found |
| [stream-timeout-try-again-later.md](portal-ui/stream-timeout-try-again-later.md) | Failed to connect … timeout — try again later |
| [streamer-sign-in-failure.md](portal-ui/streamer-sign-in-failure.md) | Error during sign-in request to signaling server (`StreamerSignInFailure`) |
| [streamer-no-stun-responses-received.md](portal-ui/streamer-no-stun-responses-received.md) | No displayable error … `0xC0F22226` / STUN no response |
| [http-501-streaming-session.md](portal-ui/http-501-streaming-session.md) | Failed to start streaming session — HTTP501 |
| [failed-stream-after-idle-reconnect.md](portal-ui/failed-stream-after-idle-reconnect.md) | Failed to load the stream after idle / Reconnect |
| [stream-not-interactive.md](portal-ui/stream-not-interactive.md) | Stream visible but not interactive |
| [second-stream-gray.md](portal-ui/second-stream-gray.md) | Second stream gray (Kit 108+) |
| [stun-unknown-method-kit108.md](portal-ui/stun-unknown-method-kit108.md) | STUN unknown method (Kit 108) |

### portal-registration

| File | Symptom |
|------|---------|
| [app-not-on-home-page.md](portal-registration/app-not-on-home-page.md) | App not on portal home page |
| [portal-status-unknown.md](portal-registration/portal-status-unknown.md) | Portal app status UNKNOWN |
| [portal-status-error.md](portal-registration/portal-status-error.md) | Portal app status ERROR |
| [put-401-portal-auth.md](portal-registration/put-401-portal-auth.md) | PUT /apps returns 401 |
| [put-403-admin-dl.md](portal-registration/put-403-admin-dl.md) | PUT /apps returns 403 |
| [app-invisible-after-register.md](portal-registration/app-invisible-after-register.md) | 201/200 but app not visible |
| [azure-ad-tenant-nucleus-login.md](portal-registration/azure-ad-tenant-nucleus-login.md) | Azure AD tenant error on Nucleus login |

### nvcf-deployment

| File | Symptom |
|------|---------|
| [deploying-over-15-minutes.md](nvcf-deployment/deploying-over-15-minutes.md) | DEPLOYING longer than 15 minutes |
| [instance-terminated-no-capacity.md](nvcf-deployment/instance-terminated-no-capacity.md) | pod terminated — instance-terminated-no-capacity |
| [max-instances-over-available.md](nvcf-deployment/max-instances-over-available.md) | Max instances over available |
| [inference-wrong-after-ui-form.md](nvcf-deployment/inference-wrong-after-ui-form.md) | Inference port/endpoint wrong after NGC UI |
| [http-408-creating-session.md](nvcf-deployment/http-408-creating-session.md) | HTTP 408 creating session |
| [firefox-second-client-fails.md](nvcf-deployment/firefox-second-client-fails.md) | Firefox 2nd client fails; Chrome OK |
| [kit-109-http-no-response.md](nvcf-deployment/kit-109-http-no-response.md) | Kit 109 HTTP no response on OVC |

### build-package

| File | Symptom |
|------|---------|
| [missing-make.md](build-package/missing-make.md) | Missing make / build-essential |
| [docker-access-denied-ov-base.md](build-package/docker-access-denied-ov-base.md) | Docker Access Denied on ov-base |
| [package-container-dns-pip.md](build-package/package-container-dns-pip.md) | package_container DNS / pip errors |
| [nvcf-kit-crashes-locally.md](build-package/nvcf-kit-crashes-locally.md) | _nvcf kit crashes locally |
| [missing-livestream-extensions.md](build-package/missing-livestream-extensions.md) | Missing livestream extensions vs NGC PB |
| [platform-incompatible-extensions.md](build-package/platform-incompatible-extensions.md) | Extension resolve platform incompatible |
| [forgot-nvcf-streaming-layer.md](build-package/forgot-nvcf-streaming-layer.md) | Forgot nvcf_streaming layer |

### nucleus-auth

| File | Symptom |
|------|---------|
| [cannot-connect-nucleus-in-stream.md](nucleus-auth/cannot-connect-nucleus-in-stream.md) | Cannot connect to Nucleus in stream |
| [env-needs-nucleus.md](nucleus-auth/env-needs-nucleus.md) | Missing Nucleus environment variables |
