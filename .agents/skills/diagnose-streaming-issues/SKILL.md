---
name: diagnose-streaming-issues
description: Triages Omniverse Kit streaming failures on NVCF and the Web Streaming Portal by matching symptoms to issue guides, verifying portal and NVCF state via check-streaming-app and check-nvcf-function, and summarizing fixes. When the root cause stays unclear, collects every piece of evidence (portal registration, NVCF deployment details, function logs, client error text) into a single diagnostic bundle folder for handoff or escalation. Use when a stream fails to start, the portal shows connection errors, NVCF deployment stalls, or the user asks about livestream, WebRTC, NVCF, Kit streaming, or OVC/DGXC.
---

# Diagnose Streaming Issues

Use this skill to triage Kit / NVCF / portal streaming problems end to end: classify the failure, satisfy every prerequisite for live checks, run those checks, read the matched fleet guides, then give one concise action plan.

## No summary until checks can run

Do **not** output a triage summary, likely-cause narrative, or numbered fix list until either:

1. Every **planned** live check for this case has completed successfully, or  
2. The user explicitly opts out of live checks (for example build-only Phase A with no deployed function yet).

If a required check cannot run yet, respond with **only** what is missing and how to unblock it. Do not pad that message with hypotheses, guide links, or “meanwhile try …” advice.

| Blocker | Allowed response | Not allowed yet |
|---------|------------------|-----------------|
| Missing `portal_url`, `app_id`, or NVCF UUIDs | One short question listing missing fields | Triage summary |
| No portal MCP for the target portal (none connected, or only other portals' MCPs) | **Stop** and recommend installing the target portal's MCP first (offer to help), even when the portal supports device flow. Continue to device flow or an API key only after the user declines the MCP | Triage summary; starting device flow or resolving an API key before offering the target portal's MCP |
| Portal IdP has no device flow | **Stop** and recommend installing the portal MCP first (offer to help; it avoids API keys). Only after the user explicitly approves the API-key path, the out-of-band portal key setup per `check-streaming-app` (env or `api-keys.toml`). Or a device-flow approval URL if using OAuth | Triage summary; resolving or using an API key without explicit user approval |
| Portal MCP connected but user not logged in | The MCP browser login prompt only | Triage summary |
| NVCF API key not in env / `settings.toml` | Out-of-band setup instructions per `check-nvcf-function` | Triage summary |
| Portal or NVCF API returned 401 / auth error | Auth fix only; retry check after credentials work | Triage summary |
| User has not finished OAuth device approval | Approval instructions only; poll until tokens or timeout | Triage summary |

You may read fleet docs and issue guides **internally** while waiting for credentials, but do not present conclusions from those docs as a final answer until live checks that apply to the case have finished.

## Documentation fleet

All issue guides live under [streaming-issue-docs](../../streaming-issue-docs/):

| Resource | Path |
|----------|------|
| Index | [streaming-issue-docs/README.md](../../streaming-issue-docs/README.md) |
| Client error router | [streaming-issue-docs/OV-WEB-RTC-ERROR-CODES.md](../../streaming-issue-docs/OV-WEB-RTC-ERROR-CODES.md) |
| Full `RErrorCode` table | [streaming-issue-docs/OV-WEB-RTC-ERROR-CODES-FULL.md](../../streaming-issue-docs/OV-WEB-RTC-ERROR-CODES-FULL.md) |
| Kit / NVCF shared facts | [streaming-issue-docs/STREAMING-REFERENCE.md](../../streaming-issue-docs/STREAMING-REFERENCE.md) |

Each issue file has YAML frontmatter: `id`, `symptom`, optional `rerror_codes`, `skills`, and `status`.

## Companion skills

| Skill | Use when |
|-------|----------|
| `check-streaming-app` | Portal app metadata, status (ACTIVE/UNKNOWN/ERROR), `function_id` linkage |
| `check-nvcf-function` | NVCF status, health/inference ports, deployment, container image |
| `publish-streaming-app` | User needs to register or update portal app after fixing NVCF |
| `remove-streaming-app` | User needs to unpublish (only with explicit approval) |

Follow those skills fully when invoked; do not duplicate their auth or API steps here.

**Portal MCP first.** If a portal MCP server for the target portal is connected — one exposing the tools `list_apps`, `get_app`, `publish_app`, and `remove_app` (such as the OVonDGXC portal MCP) — the portal companion skills use it directly and skip portal IdP discovery, device flow, and API keys. The MCP must target the **same portal** as `portal_url` (it is configured with the URL `{portal_url}/mcp`); an MCP connected to a **different** portal does not serve the target portal and is not a reason to fall back to HTTP. When a target-portal MCP is connected the portal-auth prerequisites in Step 3 do not apply: call the MCP tool (`get_app` for `check-streaming-app`) and proceed. When no portal MCP for the target portal is connected — including when only other portals' MCPs are present — recommend installing the target portal's MCP first (offer to help) before any device flow, API key, or HTTP, even if the portal supports device flow; use the portal HTTP/auth prerequisites below only after the user declines the MCP or a target-portal MCP call fails. `check-nvcf-function` is unaffected — it always uses the NVCF/NGC APIs and its own `NVCF_API_KEY`.

## Workflow

```text
- [ ] Step 1: Intake — symptom, phase, identifiers (minimal)
- [ ] Step 2: Plan checks — decide if portal and/or NVCF live checks are required
- [ ] Step 3: Prerequisites — resolve auth and inputs; STOP if blocked (no summary)
- [ ] Step 4: Run checks — check-streaming-app and/or check-nvcf-function to completion
- [ ] Step 5: Route and read — pick issue doc(s); read Diagnosis / Fix / Verification
- [ ] Step 6: Report — triage summary (only after Step 4 succeeds or user waived checks)
- [ ] Step 7: Bundle — if root cause stays unclear, collect all evidence into one folder
```

Change one variable at a time when recommending fixes (in the final report only).

---

## Step 1: Intake

Ask only for missing fields. Group into one message when possible.

| Field | When needed |
|-------|-------------|
| **Exact error text** | Always — banner line, HTTP message, or hex code |
| **Failure phase** | If unclear — see phase table below |
| `portal_url` | Portal/stream issues |
| `app_id` | From URL `/app/:appId/sessions/...` or user |
| `function_id` / `function_version_id` | NVCF or portal checks |
| Kit version | Build/deploy mismatches |
| Nucleus required? | Auth / content errors in stream |

### Failure phase

| Phase | User situation | Typical folders |
|-------|----------------|-----------------|
| **A — Build / package** | `./repo.sh build`, `package_container`, Docker push | [build-package/](../../streaming-issue-docs/build-package/) |
| **B — NVCF deploy** | Function stuck DEPLOYING, capacity, wrong ports in NGC UI | [nvcf-deployment/](../../streaming-issue-docs/nvcf-deployment/) |
| **C — Portal registration** | App missing, UNKNOWN/ERROR status, PUT 401/403 | [portal-registration/](../../streaming-issue-docs/portal-registration/) |
| **D — Stream start** | Clicked app; red banner or gray video | [portal-ui/](../../streaming-issue-docs/portal-ui/) |

If the user only says "streaming broken," ask whether the problem is **deploy**, **portal visibility**, or **clicking to stream**.

Stop after Step 1 if required identifiers are still missing. Do not continue to routing or a summary.

---

## Step 2: Plan live checks

From phase and symptom, decide what must be verified before any user-facing triage:

| Situation | Portal (`check-streaming-app`) | NVCF (`check-nvcf-function`) |
|-----------|-------------------------------|------------------------------|
| Phase A — build / package only | Skip unless user already has a published app | Skip until an image is deployed |
| Phase B — deploy / DEPLOYING / capacity | Optional | **Required** when `function_id` + `function_version_id` known |
| Phase C — registration, UNKNOWN/ERROR, PUT 401/403 | **Required** when `portal_url` + app or NVCF IDs known | **Required** when NVCF IDs known |
| Phase D — stream start / WebRTC | **Required** when `portal_url` + (`app_id` or both NVCF UUIDs) | **Required** when both NVCF UUIDs known |

If a row marks a skill **Required** but inputs are missing, ask for those inputs in Step 1 and **stop** — no summary.

Suggested order when both apply: portal first (resolves `app_id` and confirms linkage), then NVCF.

---

## Step 3: Prerequisites (portal auth and NVCF key)

Complete this step before Step 4. Follow companion skills for full command detail; this section defines **when to stop**.

### Portal — before `check-streaming-app`

0. **If a portal MCP for the target portal is connected** (tools `list_apps`, `get_app`, `publish_app`, `remove_app`, with the server URL `{portal_url}/mcp`), skip the IdP and API-key prerequisites entirely: call `get_app` with `app_id` or both function IDs and continue to Step 4. If the MCP call fails because the user is not logged in, send **only** the MCP browser-login prompt and stop. An MCP connected to a **different** portal does not count — treat it as if no portal MCP is connected.
0b. **If no portal MCP for the target portal is connected** (none connected, or only other portals' MCPs), before any IdP discovery, device flow, or API-key work, **stop** and recommend installing the target portal's MCP first (offer to help) per **Case 2** of `check-streaming-app`'s MCP-first path — even when the portal supports device flow. Continue to the steps below only after the user declines the MCP and chooses the direct HTTP fallback.
1. Confirm `portal_url` and (`app_id` or both `function_id` and `function_version_id`).
2. Fetch `GET {portal_url}/config/main.json`, then the OIDC metadata document (same as `check-streaming-app` Step 2).
3. **If `device_authorization_endpoint` exists:** run device flow (Step 3a of `check-streaming-app`). While waiting for user approval, send **only** the verification URL/code — no triage summary. After tokens are available, continue to Step 4.
4. **If `device_authorization_endpoint` is missing:** **stop** and recommend installing the portal MCP per **Step 2** of `check-streaming-app` — it avoids API keys entirely. Offer to help with the setup, then ask the user to either (a) install the MCP — then use the MCP-first path (item 0) and skip the key — or (b) explicitly approve the API-key path. Do **not** resolve or read any API key (`PORTAL_API_KEY`, `backend/api-keys.toml`, or otherwise) before the user explicitly approves the API-key path. Only after explicit approval, resolve the portal API key per **Portal API key (do not paste in chat)** in `check-streaming-app`. If resolution fails, send **only** the out-of-band setup instructions from that section (and admin contact text if they lack a key). **Stop.** Do not run partial portal GETs without auth. Do not summarize the streaming issue.
5. When a portal API key is available, use `Authorization: Bearer …` for Step 4. Do not echo the key in chat or logs.

If portal GET returns **401**, treat as failed prerequisite: auth instructions only, then retry from Step 3 after the user fixes credentials.

### NVCF — before `check-nvcf-function`

1. Confirm `function_id` and `function_version_id`.
2. Resolve `NVCF_API_KEY` per `check-nvcf-function` (env, then `backend/settings.toml`) **without** asking the user to paste the key in chat.
3. If no key is available, send **only** the out-of-band setup block from that skill and **stop** — no triage summary.
4. If API calls fail with auth errors, send **only** key/scope troubleshooting and **stop**.

### When prerequisites pass

Proceed to Step 4 for each planned skill. If a planned check was **skipped** by phase (not blocked), note “not applicable” in the final report — do not treat skip as a failed check.

---

## Step 4: Run live checks

Run `check-streaming-app` and/or `check-nvcf-function` per Step 2. Use their full workflows through successful reports.

Rules:

- Do not substitute “I cannot access the portal” with a full triage summary. Either complete auth (Step 3) or stop with the missing prerequisite.
- If sandbox blocks network calls, escalate per the companion skill and retry; still no summary until the check completes or the user waives live checks.
- Capture results for Step 6: portal status, `function_id` / `function_version_id`, deployment fields, NVCF runtime status, ports, clusters, image tag.

---

## Step 5: Route to an issue doc

### 2a. Match user text (stream start / portal UI)

Use [OV-WEB-RTC-ERROR-CODES.md](../../streaming-issue-docs/OV-WEB-RTC-ERROR-CODES.md) symptom router first. Quick map:

| Substring in user message | Issue doc |
|---------------------------|-----------|
| `No peer info found` | [portal-ui/no-peer-info-found.md](../../streaming-issue-docs/portal-ui/no-peer-info-found.md) |
| `sign-in request to signaling server` / `0 retries left` | [portal-ui/streamer-sign-in-failure.md](../../streaming-issue-docs/portal-ui/streamer-sign-in-failure.md) |
| `0xC0F22226` / `3237093926` / `No displayable error message` | [portal-ui/streamer-no-stun-responses-received.md](../../streaming-issue-docs/portal-ui/streamer-no-stun-responses-received.md) |
| `HTTP501` / `Failed to start a streaming session` | [portal-ui/http-501-streaming-session.md](../../streaming-issue-docs/portal-ui/http-501-streaming-session.md) |
| `timeout -- try again later` | [portal-ui/stream-timeout-try-again-later.md](../../streaming-issue-docs/portal-ui/stream-timeout-try-again-later.md) and/or [nvcf-deployment/http-408-creating-session.md](../../streaming-issue-docs/nvcf-deployment/http-408-creating-session.md) |
| `408` / `no GPUs available` on session create | [nvcf-deployment/http-408-creating-session.md](../../streaming-issue-docs/nvcf-deployment/http-408-creating-session.md) |
| after idle / Reconnect | [portal-ui/failed-stream-after-idle-reconnect.md](../../streaming-issue-docs/portal-ui/failed-stream-after-idle-reconnect.md) |
| visible but not interactive / mouse dead | [portal-ui/stream-not-interactive.md](../../streaming-issue-docs/portal-ui/stream-not-interactive.md) |
| second stream gray | [portal-ui/second-stream-gray.md](../../streaming-issue-docs/portal-ui/second-stream-gray.md) |
| `STUN unknown method` (Kit log) | [portal-ui/stun-unknown-method-kit108.md](../../streaming-issue-docs/portal-ui/stun-unknown-method-kit108.md) |
| Azure tenant error on Nucleus login | [portal-registration/azure-ad-tenant-nucleus-login.md](../../streaming-issue-docs/portal-registration/azure-ad-tenant-nucleus-login.md) |

For hex codes without a clear doc, look up enum in [OV-WEB-RTC-ERROR-CODES-FULL.md](../../streaming-issue-docs/OV-WEB-RTC-ERROR-CODES-FULL.md), then search fleet by `rerror_codes` in frontmatter or README index.

### 2b. Other phases

Scan [README.md](../../streaming-issue-docs/README.md) index for portal-registration, nvcf-deployment, build-package, nucleus-auth.

If multiple guides apply (e.g. UNKNOWN status + No peer info), read **both**; fix portal linkage before runtime WebRTC.

Use live check results from Step 4 to narrow which doc(s) apply (for example UNKNOWN status → registration docs).

### Read the matched guide

For each selected file:

1. Read the full issue doc (not only the stub sections).
2. Map **Diagnosis** steps to what Step 4 already proved; do not re-ask for data you have.
3. Use **Verification** items in the final report.
4. Follow **Agent notes** for escalation when fixes require platform owners.

Do not invent fixes that contradict the issue doc. Prefer the doc’s fix order.

---

## Step 6: Report to the user

Output **only** after Step 4 completed for every planned check (or the user waived live checks).

Use this template:

```markdown
## Triage summary

**Symptom:** <exact user text>
**Phase:** <A|B|C|D>
**Likely cause:** <one sentence from issue doc>
**Guide(s):** <relative links to issue md files>

### What we checked
- <check-streaming-app results, "not applicable — Phase A", or "blocked — <resolved in Step 3>">
- <check-nvcf-function results, "not applicable", or "blocked — <resolved in Step 3>">

### Recommended actions
1. <highest-impact fix from issue doc>
2. <next step>
3. <verification step>

### If still failing
- <escalation or data to collect from issue doc>
```

Rules:

- Separate **portal HTTP/WS errors** (408, 501, 3008) from **`RErrorCode`** / ov-web-rtc messages.
- If status is UNKNOWN, fix IDs/org before debugging WebRTC.
- Recommend **new session** instead of Reload when the issue doc says so.
- Do not publish or remove portal apps unless the user explicitly asks (use sibling skills).
- If the symptom does not map cleanly to one issue doc, the live checks are inconclusive, or fixes do not resolve it, go to **Step 7** and assemble a diagnostic bundle before escalating.

---

## Step 7: Diagnostic bundle (when root cause is unclear)

Trigger this step when **any** of the following holds after Step 6:

- No issue doc matches confidently, or several apply and the evidence cannot pick one.
- Live checks ran but the result is ambiguous (for example portal `ACTIVE` yet stream still fails).
- The recommended fixes did not resolve the failure.
- The user asks to escalate, hand off, or "collect everything."

Collect every artifact gathered during Steps 1–6 into **one folder** so the user can attach it to an escalation or share it for a second opinion. Do not skip the bundle just because one source is missing — capture what exists and record the gaps.

### Folder location and name

Create a timestamped folder under `diagnostics/` at the repo root:

```text
diagnostics/streaming-{app_id-or-function_id-short}-{UTC-YYYYMMDD-HHMMSS}/
```

Use the `app_id` when known, else a short prefix of `function_id`. Create the directory before writing files.

**Windows (PowerShell):**

```powershell
$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss')
$dir = "diagnostics/streaming-$slug-$stamp"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
```

**Linux / macOS (bash):**

```bash
stamp=$(date -u +%Y%m%d-%H%M%S)
dir="diagnostics/streaming-${slug}-${stamp}"
mkdir -p "$dir"
```

### Contents

Write each artifact you have. Use `null` / a short "not collected — <reason>" note when a source was skipped or blocked, rather than omitting the file silently.

| File | Source | Contents |
|------|--------|----------|
| `summary.md` | This skill | Symptom (exact text), phase, identifiers, timeline, what was checked, candidate causes ruled in/out, what remains unclear, next data to collect, escalation target |
| `portal-app.json` | `check-streaming-app` / `get_app` | Raw `PublishedAppResponse` — how the function is **registered on the portal** (auth type, media server, page/category, `function_id` linkage, status) |
| `portal-app.md` | `check-streaming-app` | Formatted portal report (Step 6 of that skill) |
| `nvcf-function.json` | `check-nvcf-function` Step 2 | Function version config: container image, args, ports, inference/health endpoints, function type |
| `nvcf-runtime-status.json` | `check-nvcf-function` Step 3 | Control-plane runtime status entry for this function/version |
| `nvcf-deployment.json` | `check-nvcf-function` Step 4 | **Deployment specifications**: GPU/instance type, clusters, min/max instances, concurrency |
| `nvcf-function.md` | `check-nvcf-function` | Formatted NVCF report (Step 5 of that skill) |
| `nvcf-logs.txt` | NVCF UI / user | **Function logs** — History and/or Live Tail excerpts around the failure time (see below), with the time range noted at the top |
| `client-error.txt` | User / browser | Exact banner text, `RErrorCode` / hex code, browser console output, and references to any screenshots |
| `matched-guides.md` | Step 5 | Issue docs considered, why each did or did not fit, and the relative links |
| `environment.txt` | Intake | `portal_url`, `app_id`, `function_id`, `function_version_id`, Kit version, container tag, OS, collection timestamp |

### Function logs

This repo has no API to pull NVCF function logs; they come from the NVCF UI. To populate `nvcf-logs.txt`, ask the user to open [NVCF functions](https://nvcf.ngc.nvidia.com/functions) → function → version → **Logs** → **History** (and **Live Tail** for a live repro) and paste the excerpt around the failure window. Save it verbatim and note the time range. Key signals to keep: `RTX Ready`, `livestream` versions, `post_uncancellable_quit`, `503`/`502` recycle messages, and any crash traceback.

### Secret hygiene

- Never write `id_token`, `access_token`, `PORTAL_API_KEY`, or `NVCF_API_KEY` into any bundle file.
- Redact secret-looking values in `containerEnvironment` (keys, tokens, passwords) before saving `nvcf-function.json`; keep the key names so the config shape stays readable.
- Keep the bundle local — do not upload it anywhere on the user's behalf.

### After assembling

Tell the user the folder path, list what it contains, and call out which artifacts are missing and why. Point them to the matching **Escalation** row and tell them to attach the folder when they reach out.

### Escalation

When fixes require org access, GPU quota, or platform changes outside this repo, recommend generic contacts — do not cite internal Slack channels:

| Need | Direct the user to |
|------|-------------------|
| NVCF clusters, capacity, allocation | NVCF / Omniverse Cloud platform owner or NGC org administrator |
| Portal API keys, admin access, app visibility | Portal deployment administrator |
| Kit SDK, template, or build VM access | Omniverse program contact or build-environment owner |

Collect function/version IDs, cluster names, and log excerpts (RTX Ready, `livestream` versions) before escalation. When the root cause is unclear, assemble the **Step 7** diagnostic bundle and tell the user to attach the folder when they contact the owner above.

---

## Quick phase hints

| User says | Open first |
|-----------|------------|
| Stuck DEPLOYING | [deploying-over-15-minutes.md](../../streaming-issue-docs/nvcf-deployment/deploying-over-15-minutes.md) |
| App not on home page | [app-not-on-home-page.md](../../streaming-issue-docs/portal-registration/app-not-on-home-page.md) |
| No peer info | [no-peer-info-found.md](../../streaming-issue-docs/portal-ui/no-peer-info-found.md) |
| HTTP 501 | [http-501-streaming-session.md](../../streaming-issue-docs/portal-ui/http-501-streaming-session.md) |
| Forgot streaming layer | [forgot-nvcf-streaming-layer.md](../../streaming-issue-docs/build-package/forgot-nvcf-streaming-layer.md) |

---

## Architecture (minimal)

```text
Browser → Portal API → NVCF → Kit container (WebRTC)
```

| Layer | Verify with |
|-------|-------------|
| Portal registration | `check-streaming-app` |
| NVCF function | `check-nvcf-function` |
| WebRTC / sign-in | Issue doc + client error router |
| Container build | build-package docs + NVCF logs after deploy |

Expected NVCF streaming endpoints: health `/v1/streaming/ready` (port 8011 for Kit ≥107.3.3), inference `/sign_in` on **49100**, function type **STREAMING**, Low Latency Streaming enabled.

---

## Additional resources

- [STREAMING-REFERENCE.md](../../streaming-issue-docs/STREAMING-REFERENCE.md) — Kit versions, NVCF endpoints, plugin minimums  
- [NVCF debuggability](https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html)  
- [OV on DGXC docs](https://docs.omniverse.nvidia.com/omniverse-dgxc/latest/index.html)
