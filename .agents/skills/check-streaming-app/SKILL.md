---
name: check-streaming-app
description: Retrieves full details for a published streaming application on the Omniverse portal by locating it via app_id or NVCF function_id and function_version_id, authenticating like publish-streaming-app, and calling GET /api/apps/{app_id}. Returns portal metadata, NVCF runtime status, and deployment details when available. Use when the user asks to inspect, verify, or look up a portal streaming app or its NVCF linkage.
---

# Check Streaming App

Use this skill to look up a published streaming application on the Omniverse portal and report its metadata, NVCF status, and deployment details.

**Prefer the portal MCP when it is installed.** If a portal MCP server for the target portal is connected — one exposing the tools `list_apps`, `get_app`, `publish_app`, and `remove_app` (such as the OVonDGXC portal MCP) — use its `get_app` tool and skip the manual HTTP, IdP discovery, and authentication steps. The MCP brokers portal authentication itself through a one-time browser login. If no portal MCP for the target portal is connected — including when the only connected portal MCP points at a **different** portal — recommend installing the MCP for the target portal first (offer to help) before trying device flow, an API key, or any direct HTTP. Fall back to the direct HTTP approach only after the user declines the MCP, or the MCP call fails. See **MCP-first path (preferred)** below.

When falling back to direct HTTP, follow the same authentication approach as `publish-streaming-app` and `remove-streaming-app`: prefer OAuth 2.0 device flow when the configured identity provider advertises it, and fall back to a portal API key when it does not.

When invoked from `diagnose-streaming-issues`, if authentication is not complete, return **only** the device-flow approval message or the out-of-band portal API key setup instructions (Step 3b). Do not return a partial app report or streaming triage summary.

The list endpoint `GET /api/apps/` returns status but not `deployment`; always finish with a single-app GET when you need full details.

## Workflow

```text
- [ ] MCP check: Prefer the target portal's MCP — if connected, use its tools and skip Steps 0–5; if none for the target portal, recommend installing it first before any HTTP
- [ ] Step 0: Choose the network approach (HTTP fallback)
- [ ] Step 1: Collect the target inputs
- [ ] Step 2: Discover IdP configuration
- [ ] Step 3: Authenticate
- [ ] Step 4: Find the application
- [ ] Step 5: Fetch full app details (if needed)
- [ ] Step 6: Present the report
```

### MCP-first path (preferred)

Before any HTTP or authentication work, check whether a portal MCP server is connected — one that exposes the tools `list_apps`, `get_app`, `publish_app`, and `remove_app` (for example the OVonDGXC portal MCP). The MCP brokers portal authentication through a one-time browser login, so it removes the device-flow, API-key, and sandbox-network handling that the HTTP fallback needs.

The MCP must target the **same portal** as `portal_url`. A portal MCP is configured with the URL `{portal_url}/mcp`, so match the connected server's URL against the target portal. A portal MCP connected to a **different** portal does not serve the target portal — do not call it for this request, and do not let its presence push you to the HTTP fallback.

**Case 1 — a portal MCP for the target portal is connected.** Use it:

1. Call `get_app` with either `app_id`, or both `function_id` and `function_version_id`. It returns the full `PublishedAppResponse`, including NVCF `status` and `deployment`.
2. Use `list_apps` instead when you only need to enumerate or filter apps (it omits `deployment`).
3. Go straight to **Step 6: Present the report** with the tool result. Skip Steps 0–5.

If the MCP reports an authentication error, prefer completing its browser login over switching to the HTTP fallback, since the MCP path is simpler.

**Case 2 — no portal MCP for the target portal is connected** (none connected at all, or only MCPs pointing at other portals). Before any device-flow, API-key, IdP-discovery, or HTTP work, **recommend installing the portal MCP for the target portal** and offer to help. The MCP is the preferred path even when the portal supports device flow, because it avoids per-request auth and sandbox-network handling. Share the setup, substituting the real `portal_url`:

> Give the server a name derived from the portal so multiple portal MCPs stay distinct — use the portal hostname's first label (for example `portal-apollo-swe` for `https://portal-apollo-swe.ovc2-rc.omniverse.nvidia.com/`). The examples below use `{mcp_name}` for that derived name.
>
> Cursor (`mcp.json`):
>
> ```json
> { "mcpServers": { "{mcp_name}": { "url": "{portal_url}/mcp" } } }
> ```
>
> Claude Code:
>
> ```bash
> claude mcp add --transport http {mcp_name} {portal_url}/mcp
> ```
>
> On Claude Code, restart it after `claude mcp add` so the new server appears in the `/mcp` command.
>
> After connecting, complete the browser login once. No client ID or API key is required.

Then ask the user to choose one of:

- **(a) Install the portal MCP for the target portal** (preferred) — offer to help with the setup above. Once connected, restart at Case 1 and use `get_app`.
- **(b) Proceed with the direct HTTP fallback** — only continue to the HTTP steps below after the user explicitly chooses this path.

**Stop and wait for the user's choice.** Do not start IdP discovery, device flow, or API-key resolution until the user opts into the HTTP fallback.

Fall back to the HTTP steps below only when:

- the user explicitly chose the direct HTTP fallback in Case 2, or
- a connected target-portal MCP tool call fails for a non-auth reason (for example the server is unavailable) and reconnecting is not possible.

### Step 0: Choose the network approach

This skill performs outbound HTTP calls to the portal and the configured IdP. In Codex, terminal network access may be sandboxed even when local file access works, so choose tools deliberately.

#### Step 0a: Choose the tool per request

| Request | Method | Auth header | Preferred tool |
|---|---|---|---|
| `GET {portal_url}/config/main.json` | GET | none | Codex `web` tool |
| `GET {metadataUri}` | GET | none | Codex `web` tool |
| `POST {device_authorization_endpoint}` | POST | none | `shell_command` |
| `POST {token_endpoint}` | POST | none | `shell_command` |
| `GET {portal_url}/api/apps/{app_id}` | GET | yes | `shell_command` |
| `GET {portal_url}/api/apps/?function_id=...&function_version_id=...` | GET | yes | `shell_command` |

Notes:

- Prefer the `web` tool for unauthenticated GETs because it avoids shell-network sandbox issues and makes JSON easier to inspect.
- If the `web` tool cannot reach a private host, fall back to `shell_command`.
- Use `shell_command` for authenticated GETs, since the `web` tool is not suitable for authenticated reads in this workflow.

#### Step 0b: Platform (Windows and Linux)

Detect the shell OS before running authenticated commands (`uname -s` on Linux, or `$IsWindows` / `OS` in PowerShell).

| Task | Windows (PowerShell) | Linux / macOS (bash) |
|---|---|---|
| HTTP client | `Invoke-RestMethod` or `curl.exe` (not the `curl` alias) | `curl` |
| OAuth / API POSTs | `Invoke-RestMethod` | `curl` |
| Cookie auth header | `Cookie: id_token=...; access_token=...` | same |
| Bearer API key | `Authorization: Bearer ...` | same |

#### Step 0c: Escalate terminal network calls when needed

If a shell network call fails because of sandboxing, DNS resolution, certificate access, or another likely environment restriction, rerun that command with:

- `sandbox_permissions: "require_escalated"`
- a short `justification` explaining the exact portal or IdP request

Do not ask the user in chat before requesting escalation; use the tool's approval flow directly. Reuse the same request pattern for later GET and POST calls if the environment remains restricted.

Never echo secrets in commands or shell output. Prefer request bodies and headers that do not get reprinted by verbose flags.

### Step 1: Collect the target inputs

Ask only for fields the user has not already provided. Group missing fields into one concise message where possible.

| Field | Required | Notes |
|---|---|---|
| `portal_url` | yes | Base URL of the portal, for example `https://portal.example.com` |
| `app_id` | conditionally | The portal application ID (`slug:version`). The user may provide this instead of the NVCF identifiers. |
| `function_id` | conditionally | UUID of the NVCF function. Required when `app_id` is not provided. |
| `function_version_id` | conditionally | UUID of the function version. Required when `app_id` is not provided. |

The user must provide either:

- `app_id`, or
- both `function_id` and `function_version_id`

Rules:

- Never guess `portal_url`, `app_id`, `function_id`, or `function_version_id`.
- If `portal_url` is missing, ask the user to enter it.
- If the user provides only one of `function_id` or `function_version_id`, stop and ask for the missing value.
- If the user provides both `app_id` and the function identifiers, use both and verify they refer to the same portal app in Step 4.

### Step 2: Discover IdP configuration

Only reach this step after the **MCP-first path (preferred)** has run and the user either has no portal MCP for the target portal and explicitly chose the direct HTTP fallback (Case 2, option b), or a connected target-portal MCP call failed for a non-auth reason. Do not start IdP discovery while a usable target-portal MCP is available or before the user has been offered the MCP.

Fetch the portal frontend config:

```text
GET {portal_url}/config/main.json
```

Extract:

- `auth.clientId`
- `auth.authority`
- `auth.metadataUri`, falling back to `{authority}/.well-known/openid-configuration` if absent
- `auth.scope`, falling back to `openid profile email nca` if absent

Then fetch:

```text
GET {metadataUri}
```

Read:

- `device_authorization_endpoint`
- `token_endpoint`

If `device_authorization_endpoint` is present, continue to Step 3a.

If it is missing, the IdP does not support OAuth device flow. **Before resorting to a portal API key, suggest installing the portal MCP** — it avoids API keys entirely by brokering authentication through a one-time browser login, and lets agents call `get_app` / `list_apps` directly without per-request auth or sandbox-network handling. Share the setup, substituting the real `portal_url`:

> Give the server a name derived from the portal so multiple portal MCPs stay distinct — use the portal hostname's first label (for example `portal-apollo-swe` for `https://portal-apollo-swe.ovc2-rc.omniverse.nvidia.com/`). The examples below use `{mcp_name}` for that derived name.
>
> Cursor (`mcp.json`):
>
> ```json
> { "mcpServers": { "{mcp_name}": { "url": "{portal_url}/mcp" } } }
> ```
>
> Claude Code:
>
> ```bash
> claude mcp add --transport http {mcp_name} {portal_url}/mcp
> ```
>
> On Claude Code, restart it after `claude mcp add` so the new server appears in the `/mcp` command.
>
> After connecting, complete the browser login once. No client ID or API key is required.

**Stop here and wait for the user.** Do not resolve or use a portal API key yet — do not read `PORTAL_API_KEY`, `backend/api-keys.toml`, or any other key source. Offer to help install the portal MCP, then ask the user to choose one of:

- **(a) Install the portal MCP** (preferred) — offer to help with the setup above. Once connected, switch to the **MCP-first path (preferred)** and skip the API-key steps entirely.
- **(b) Use a portal API key instead** — only proceed to Step 3b if the user explicitly approves this path.

Proceed to Step 3b **only after the user explicitly agrees** to the API-key path. After Step 3b, **stop** until a portal API key is available (env or `api-keys.toml`) or the user obtains one from their administrator — do not call authenticated portal APIs or return an app report without credentials.

### Step 3: Authenticate

Use exactly one of the following paths.

### Portal API key (do not paste in chat)

When Step 3b applies, resolve the key in this order. Stop at the first source that yields a non-empty value.

| Priority | Source | How the agent uses it |
|---|---|---|
| 1 | Shell environment | `PORTAL_API_KEY` |
| 2 | Local api-keys file | `backend/api-keys.toml` (gitignored; path overridable with `API_KEYS_PATH`) — prefer the `[[keys]]` entry whose `name` matches the portal hostname's first label (for example `portal-apollo-swe` for `https://portal-apollo-swe.ovc2-rc.omniverse.nvidia.com/`), else the first entry whose `name` starts with `portal-` |
| 3 | User message | Only if the user explicitly pasted a key anyway — treat as last resort and warn that chat history may retain it |

**Before asking the user for anything**, run a check that only reports whether a key is available, never the value.

**Windows (PowerShell):**

```powershell
if ($env:PORTAL_API_KEY) { 'PORTAL_API_KEY set' } else { 'no env key' }
```

**Linux / macOS (bash):**

```bash
if [ -n "$PORTAL_API_KEY" ]; then echo 'PORTAL_API_KEY set'; else echo 'no env key'; fi
```

To load from `backend/api-keys.toml` without printing the key (substitute the real `portal_url` when deriving the hostname label):

**Windows (PowerShell):**

```powershell
$apiKeysPath = if ($env:API_KEYS_PATH) { $env:API_KEYS_PATH } else { 'backend/api-keys.toml' }
if ((Test-Path $apiKeysPath) -and -not $env:PORTAL_API_KEY) {
  $env:PORTAL_API_KEY = python -c @"
import tomllib
from urllib.parse import urlparse
portal_url = '$portal_url'
host_label = urlparse(portal_url).hostname.split('.')[0]
with open(r'$apiKeysPath', 'rb') as f:
    keys = tomllib.load(f).get('keys', [])
match = next((k['value'] for k in keys if k.get('name') == host_label), None)
if not match:
    match = next((k['value'] for k in keys if str(k.get('name','')).startswith('portal-')), None)
if match:
    print(match)
"@
}
```

**Linux / macOS (bash):**

```bash
API_KEYS_PATH="${API_KEYS_PATH:-backend/api-keys.toml}"
if [ -f "$API_KEYS_PATH" ] && [ -z "$PORTAL_API_KEY" ]; then
  PY=python3; command -v python3 >/dev/null 2>&1 || PY=python
  export PORTAL_API_KEY="$("$PY" -c "
import tomllib
from urllib.parse import urlparse
portal_url = '$portal_url'
host_label = urlparse(portal_url).hostname.split('.')[0]
with open('$API_KEYS_PATH', 'rb') as f:
    keys = tomllib.load(f).get('keys', [])
match = next((k['value'] for k in keys if k.get('name') == host_label), None)
if not match:
    match = next((k['value'] for k in keys if str(k.get('name','')).startswith('portal-')), None)
if match:
    print(match)
")"
fi
```

Use the resolved value only inside the shell session. **Never** assign a literal key in a command the user or logs can see:

```powershell
# Forbidden on Windows — exposes the key in terminal history and tool output
$env:PORTAL_API_KEY = 'api-key-...'
```

```bash
# Forbidden on Linux — same problem
export PORTAL_API_KEY='api-key-...'
```

Authenticated requests must reference the environment variable only:

```powershell
$headers = @{ Authorization = "Bearer $env:PORTAL_API_KEY"; Accept = 'application/json' }
Invoke-RestMethod -Uri "..." -Headers $headers
```

If no key is available after steps 1–2, tell the user how to set one **outside chat**, then re-run the skill:

> Set your portal API key outside this chat before continuing:
>
> **Windows (PowerShell, current session):** `$env:PORTAL_API_KEY = '<your-key>'`
>
> **Linux / macOS (bash, current session):** `export PORTAL_API_KEY='<your-key>'`
>
> **Or** add it to `backend/api-keys.toml` (gitignored):
>
> ```toml
> [[keys]]
> name = "portal-apollo-swe"
> value = "your-key-here"
> ```
>
> Use a `name` that matches the portal hostname's first label when possible (for example `portal-apollo-swe` for the Apollo SWE portal).
>
> Re-run this skill once the key is configured. Do not paste the key into chat.

If the user does not have an API key, provide this guidance and stop:

> To obtain a portal API key, contact your portal system administrator and explain that:
>
> - You need it to read streaming application details from the portal at `{portal_url}` via `GET /api/apps/{app_id}`.
> - The key will be used locally as `Authorization: Bearer <api-key>` because the portal's identity provider does not support the OAuth device flow.
> - The key will be stored in your local `PORTAL_API_KEY` environment variable or `backend/api-keys.toml`, not in chat.
>
> The administrator can provision the key by adding an entry to `api-keys.toml`. See the Helm chart `apiKeys` values in [helm/web-streaming-example/values.yaml](helm/web-streaming-example/values.yaml). Once you have the key, add it locally and re-run this skill.

Substitute the real `portal_url` when presenting that message.

Do not ask the user to paste the key into chat unless they insist after trying env or `api-keys.toml`.

#### Step 3a: OAuth 2.0 Device Authorization Grant

Use `shell_command` for these POSTs. On PowerShell, prefer `Invoke-RestMethod` or `curl.exe` rather than the `curl` alias.

1. Start the flow:

   ```text
   POST {device_authorization_endpoint}
   Content-Type: application/x-www-form-urlencoded

   client_id={clientId}&scope={scope}
   ```

   Capture:

   - `device_code`
   - `user_code`
   - `verification_uri`
   - optional `verification_uri_complete`
   - `expires_in`
   - `interval` (optional per RFC 8628; default to 5 seconds when the response omits it)

2. Show the approval instructions to the user, preferring `verification_uri_complete` when present:

   ```text
   Open this URL to approve the request: {verification_uri_complete}
   (or visit {verification_uri} and enter code: {user_code})
   ```

3. Poll the token endpoint every `interval` seconds (use the 5 second default when `interval` is absent):

   ```text
   POST {token_endpoint}
   Content-Type: application/x-www-form-urlencoded

   grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code={device_code}&client_id={clientId}
   ```

4. Handle responses:

- HTTP 400 with `error=authorization_pending`: wait `interval` seconds and retry
- HTTP 400 with `error=slow_down`: increase `interval` by 5 seconds and retry
- HTTP 400 with `error=expired_token` or `error=access_denied`: abort and report the error
- HTTP 200: capture `id_token` and `access_token`

Stop polling once `expires_in` has elapsed.

When this path succeeds, Steps 4–5 must authenticate with:

```text
Cookie: id_token=...; access_token=...
```

Never echo token values back to the user.

#### Step 3b: API key fallback

Use this path only when the IdP does not advertise `device_authorization_endpoint` **and** the user has explicitly approved the API-key path after being offered the portal MCP (see Step 2). Never resolve or use a key without that explicit approval. The backend accepts a static API key as a Bearer token and treats API-key callers as administrators, as shown in [backend/app/auth.py](backend/app/auth.py).

Resolve the portal API key per **Portal API key (do not paste in chat)** above. If resolution fails, send the out-of-band setup instructions (and admin contact text if they lack a key) and **stop**. Do not log or repeat the value.

When this path succeeds, Steps 4–5 must authenticate with:

```text
Authorization: Bearer {api_key}
```

### Step 4: Find the application

After authenticating, resolve the target `app_id`.

Use one of these lookup paths:

- If the user provided `app_id`:

  ```text
  GET {portal_url}/api/apps/{app_id}
  ```

  On `200 OK`, the response is a full `PublishedAppResponse` — skip Step 5 and go to Step 6.

- If the user provided `function_id` and `function_version_id`:

  ```text
  GET {portal_url}/api/apps/?function_id={function_id}&function_version_id={function_version_id}
  ```

The `/api` prefix comes from the backend `root_path` in [helm/web-streaming-example/templates/configmap.yaml](helm/web-streaming-example/templates/configmap.yaml).

Handle responses this way:

- `GET /api/apps/{app_id}` → `200 OK`: continue to Step 6 with this body
- `GET /api/apps/{app_id}` → `404`: stop — app not found
- `GET /api/apps/` with filters → `200 OK` empty list: stop — no portal app matched
- `GET /api/apps/` with filters → `200 OK` multiple apps: stop, list `id` values, ask for exact `app_id`
- `GET /api/apps/` with filters → `200 OK` one app: note its `id` and continue to Step 5
- `401`: credential rejected or expired; restart at Step 3
- `403`: authenticated but cannot read apps; surface the response and stop
- other `4xx` or `5xx`: surface the response body

If the user provided both `app_id` and function identifiers, verify the record matches. If not, stop and explain the mismatch.

### Step 5: Fetch full app details (if needed)

Run this step only when Step 4 used the filtered list and returned exactly one app, or when the first GET omitted `deployment`.

```text
GET {portal_url}/api/apps/{app_id}
```

Use the same auth header as Step 4. Expect `200 OK` with a full app record including NVCF status and deployment when available.

### Step 6: Present the report

Format the app JSON into a readable report. Include two frontend links at the top using the app's `page` and `id` values. URL-encode `page` and `app_id` as needed. The backend API uses `/api/apps/{app_id}`; the links below are frontend routes only.

Use this structure:

```markdown
# Portal app {id}

**Home page:** {portal_url}/?page={page}

**Start a stream:** {portal_url}/app/{app_id}

The `page` query parameter selects the sidebar page on the home page where the app card appears.

## Identity
- **ID:** …
- **Slug:** …
- **Title:** …
- **Description:** …
- **Version:** …
- **Published at:** …

## Portal placement
- **Page:** …
- **Category:** …
- **Product area:** …
- **Icon:** …

## NVCF linkage
- **Function ID:** …
- **Function version ID:** …
- **Runtime status:** … (`ACTIVE`, `UNKNOWN`, `DEPLOYING`, etc.)

## Authentication and media
- **Authentication type:** … (`NONE`, `OPENID`, `NUCLEUS`)
- **Media server:** …
- **Media port:** …

## Deployment (from portal backend / NVCF)
If `deployment` is null, state that deployment details could not be retrieved from NVCF.

Otherwise include:
- **Instance type:** …
- **GPU:** …
- **Cluster:** …
- **Min / max instances:** …
- **Max request concurrency:** …

## Notes
- If `status` is `UNKNOWN`, suggest verifying `function_id` / `function_version_id` against NVCF or running `$check-nvcf-function`.
- If `status` is `ERROR` or `DEPLOYING`, point to NVCF UI logs: https://nvcf.ngc.nvidia.com/functions
- For portal access, API keys, or admin-only operations, direct the user to their **portal administrator** — not internal Slack channels.
```

Redact or summarize long `description` or `icon` URLs only if needed for readability; do not omit `function_id`, `function_version_id`, or `status`.

## Rules

- Prefer the portal MCP (`get_app` / `list_apps`) when one for the target portal is connected; only that portal's MCP counts — an MCP connected to a different portal does not, and is not a reason to fall back to HTTP.
- When no portal MCP for the target portal is connected (including when only other portals' MCPs are present), recommend installing the target portal's MCP first (offer to help) before any device flow, API key, or HTTP — even if the portal supports device flow. Use the HTTP fallback only after the user declines the MCP or a target-portal MCP call fails.
- When the IdP lacks device flow, stop and recommend installing the portal MCP (offer to help). Only resolve or use a portal API key after the user explicitly approves the API-key path.
- Never guess `portal_url`, `app_id`, `function_id`, or `function_version_id`.
- Never echo `id_token`, `access_token`, or the API key back to the user.
- Prefer env / `api-keys.toml` over asking the user to paste a portal key in chat.
- Prefer `GET /api/apps/{app_id}` for the final report so `deployment` is included.
- In restricted environments, retry blocked shell network requests with escalation through `shell_command`.
- Prefer the `web` tool for readable unauthenticated GETs, and `shell_command` for authenticated GETs and OAuth POSTs.
- Use the Windows or Linux HTTP client from **Step 0b**; do not assume PowerShell on Linux or bash on Windows.
- This skill is read-only — do not call `PUT` or `DELETE` on `/api/apps/`.
