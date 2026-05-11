---
name: remove-streaming-app
description: Remove a published streaming application from the Omniverse portal by locating the app via `app_id` or via `function_id` plus `function_version_id`, authenticating against the portal's identity setup, previewing the matched app, and calling `DELETE /api/apps/{app_id}` only after explicit user approval. Use when Codex needs to unpublish, delete, or remove a streaming application from the portal.
---

# Remove Streaming App

Use this skill to remove a published streaming application from the Omniverse portal.

**Prefer the portal MCP when it is installed.** If a portal MCP server for the target portal is connected — one exposing the tools `list_apps`, `get_app`, `publish_app`, and `remove_app` (such as the OVonDGXC portal MCP) — use its `remove_app` tool and skip the manual HTTP, IdP discovery, and authentication steps. The MCP brokers admin authentication itself through a one-time browser login. If no portal MCP for the target portal is connected — including when the only connected portal MCP points at a **different** portal — recommend installing the MCP for the target portal first (offer to help) before trying device flow, an API key, or any direct HTTP. Fall back to the direct HTTP approach only after the user declines the MCP, or the MCP call fails. See **MCP-first path (preferred)** below.

When falling back to direct HTTP, follow the same authentication approach as `publish-streaming-app`: prefer OAuth 2.0 device flow when the configured identity provider advertises it, and fall back to a portal API key when it does not.

## Workflow

Track progress with this checklist:

```text
- [ ] MCP check: Prefer the target portal's MCP — if connected, use remove_app and skip Steps 0–4 and 6; if none for the target portal, recommend installing it first before any HTTP
- [ ] Step 0: Choose the network approach (HTTP fallback)
- [ ] Step 1: Collect the target inputs
- [ ] Step 2: Discover IdP configuration
- [ ] Step 3: Authenticate
- [ ] Step 4: Find the application
- [ ] Step 5: Show the match and ask for permission
- [ ] Step 6: DELETE /api/apps/{app_id}
- [ ] Step 7: Report result
```

### MCP-first path (preferred)

Before any HTTP or authentication work, check whether a portal MCP server is connected — one that exposes the tools `list_apps`, `get_app`, `publish_app`, and `remove_app` (for example the OVonDGXC portal MCP). The MCP brokers admin authentication through a one-time browser login, so it removes the device-flow, API-key, and sandbox-network handling that the HTTP fallback needs.

The MCP must target the **same portal** as `portal_url`. A portal MCP is configured with the URL `{portal_url}/mcp`, so match the connected server's URL against the target portal. A portal MCP connected to a **different** portal does not serve the target portal — do not call it for this request, and do not let its presence push you to the HTTP fallback.

**Case 1 — a portal MCP for the target portal is connected.** Use it:

1. Collect the target inputs as in **Step 1** (`app_id`, or both `function_id` and `function_version_id`).
2. Call `remove_app` with `confirm=false` first. The tool resolves and returns the matched app without deleting it. Present that match and ask for explicit approval exactly as in **Step 5** — never skip confirmation.
3. Only after the user explicitly approves, call `remove_app` again with `confirm=true` to delete.
4. Go to **Step 7: Report result** with the tool response. Skip Steps 0–4 and 6.

If `remove_app` returns an authorization error, the signed-in user is not in the portal admin group — tell the user to contact their **portal administrator** rather than switching to the HTTP fallback.

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
> After connecting, complete the browser login once as a portal admin. No client ID or API key is required.

Then ask the user to choose one of:

- **(a) Install the portal MCP for the target portal** (preferred) — offer to help with the setup above. Once connected, restart at Case 1 and use `remove_app`.
- **(b) Proceed with the direct HTTP fallback** — only continue to the HTTP steps below after the user explicitly chooses this path.

**Stop and wait for the user's choice.** Do not start IdP discovery, device flow, or API-key resolution until the user opts into the HTTP fallback.

Fall back to the HTTP steps below only when:

- the user explicitly chose the direct HTTP fallback in Case 2, or
- a connected target-portal MCP tool call fails for a non-auth reason (for example the server is unavailable) and reconnecting is not possible.

### Step 0: Choose the network approach

This skill performs outbound HTTP calls to the portal and the configured IdP. In Codex, terminal network access may be sandboxed even when local file access works, so choose tools deliberately.

#### Step 0a: Choose the tool per request

Prefer these mappings:

| Request | Method | Auth header | Preferred tool |
|---|---|---|---|
| `GET {portal_url}/config/main.json` | GET | none | Codex `web` tool |
| `GET {metadataUri}` | GET | none | Codex `web` tool |
| `POST {device_authorization_endpoint}` | POST | none | `shell_command` |
| `POST {token_endpoint}` | POST | none | `shell_command` |
| `GET {portal_url}/api/apps/{app_id}` | GET | yes | `shell_command` |
| `GET {portal_url}/api/apps/?function_id=...&function_version_id=...` | GET | yes | `shell_command` |
| `DELETE {portal_url}/api/apps/{app_id}` | DELETE | yes | `shell_command` |

Notes:

- Prefer the `web` tool for unauthenticated GETs because it avoids shell-network sandbox issues and makes JSON easier to inspect.
- If the `web` tool cannot reach a private host, fall back to `shell_command`.
- Use `shell_command` for authenticated GETs and DELETE requests, since the `web` tool is not suitable for authenticated reads and writes in this workflow.

#### Step 0b: Escalate terminal network calls when needed

If a shell network call fails because of sandboxing, DNS resolution, certificate access, or another likely environment restriction, rerun that command with:

- `sandbox_permissions: "require_escalated"`
- a short `justification` explaining the exact portal or IdP request

Do not ask the user in chat before requesting escalation; use the tool's approval flow directly. Reuse the same request pattern for later POST, GET, and DELETE calls if the environment remains restricted.

Never echo secrets in commands or shell output. Prefer request bodies and headers that do not get reprinted by verbose flags.

### Step 1: Collect the target inputs

Ask only for fields the user has not already provided. Group missing fields into one concise message where possible.

| Field | Required | Notes |
|---|---|---|
| `portal_url` | yes | Base URL of the portal, for example `https://portal.example.com`. If it is missing, ask the user to enter it. |
| `app_id` | conditionally | The portal application ID. The user may provide this instead of the NVCF identifiers. |
| `function_id` | conditionally | UUID of the NVCF function. Required when `app_id` is not provided. |
| `function_version_id` | conditionally | UUID of the function version. Required when `app_id` is not provided. |

The user must provide either:

- `app_id`, or
- both `function_id` and `function_version_id`

Rules:

- Never guess `app_id`, `function_id`, or `function_version_id`.
- If the user provides only one of `function_id` or `function_version_id`, stop and ask for the missing value.
- If the user provides both `app_id` and the function identifiers, use both and verify that they refer to the same portal app before deleting anything.

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

If it is missing, the IdP does not support OAuth device flow. **Before resorting to a portal API key, suggest installing the portal MCP** — it avoids API keys entirely by brokering admin authentication through a one-time browser login, and lets agents call `remove_app` directly without per-request auth or sandbox-network handling. Share the setup, substituting the real `portal_url`:

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
> After connecting, complete the browser login once as a portal admin. No client ID or API key is required.

**Stop here and wait for the user.** Do not resolve or use a portal API key yet — do not read `PORTAL_API_KEY`, `backend/api-keys.toml`, or any other key source. Offer to help install the portal MCP, then ask the user to choose one of:

- **(a) Install the portal MCP** (preferred) — offer to help with the setup above. Once connected, switch to the **MCP-first path (preferred)** and skip the API-key steps entirely.
- **(b) Use a portal API key instead** — only proceed to Step 3b if the user explicitly approves this path.

Proceed to Step 3b **only after the user explicitly agrees** to the API-key path.

### Step 3: Authenticate

Use exactly one of the following paths.

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
- HTTP 200: capture `id_token`, and `access_token` if present

Stop polling once `expires_in` has elapsed.

When this path succeeds, Steps 4 and 6 must authenticate with the `id_token` cookie. The `access_token` cookie is optional; include it only when it was returned:

```text
Cookie: id_token=...
```

If `access_token` was returned, send it as well:

```text
Cookie: id_token=...; access_token=...
```

Never echo token values back to the user.

#### Step 3b: API key fallback

Use this path only when the IdP does not advertise `device_authorization_endpoint` **and** the user has explicitly approved the API-key path after being offered the portal MCP (see Step 2). Never resolve or use a key without that explicit approval. The backend accepts a static API key as a Bearer token and treats API-key callers as administrators, as shown in [/backend/app/auth.py](/backend/app/auth.py).

Resolve the portal API key per **Portal API key (do not paste in chat)** in `check-streaming-app`. If resolution fails, send the out-of-band setup instructions from that section (and admin contact text if they lack a key) and **stop**. Do not log or repeat the value.

When this path succeeds, Steps 4 and 6 must authenticate with:

```text
Authorization: Bearer {api_key}
```

### Step 4: Find the application

After authenticating, use the portal API to find the exact app before asking to delete it.

Use one of these lookup paths:

- If the user provided `app_id`:

  ```text
  GET {portal_url}/api/apps/{app_id}
  ```

- If the user provided `function_id` and `function_version_id`:

  ```text
  GET {portal_url}/api/apps/?function_id={function_id}&function_version_id={function_version_id}
  ```

Expected behavior:

- `GET /api/apps/{app_id}` returns one `PublishedAppResponse` object or `404`.
- `GET /api/apps/` with both filters should return either an empty list or a single matching app. The backend supports both query parameters in [/backend/app/routers/apps.py](/backend/app/routers/apps.py).

If the user provided both `app_id` and the function identifiers, verify that the returned record has the same `id`, `function_id`, and `function_version_id`. If not, stop and explain the mismatch.

Handle responses this way:

- `200 OK` with a single app: continue
- `200 OK` with an empty list: stop and tell the user no portal app matched the provided function identifiers
- `200 OK` with multiple apps: stop, show the app IDs, and ask the user to provide the exact `app_id`
- `401`: credential rejected or expired; restart at Step 3
- `403`: the caller is authenticated but cannot read apps; surface the response and stop
- `404`: the provided `app_id` does not exist; stop
- other `4xx` or `5xx`: surface the response body

### Step 5: Show the match and ask for permission

Before deleting anything, display the matched app to the user in a compact summary that includes:

- `id`
- `slug`
- `title`
- `version`
- `page`
- `category`
- `product_area`
- `function_id`
- `function_version_id`
- `status` if the API returned it

Also include two frontend links for the matched app:

1. **Home page** — `{portal_url}/?page={page}`. Use the matched app's `page` value. The `page` query parameter selects the sidebar page on the home page where the app card appears. URL-encode the page name when constructing the link.
2. **Start a stream** — `{portal_url}/app/{app_id}`. URL-encode `app_id` if needed when constructing the link.

The backend API uses `/api/apps/{app_id}`; the links above are frontend routes only.

Then ask for explicit permission to remove the app. Prefer a confirmation that repeats the target ID, for example:

```text
Reply with: DELETE {app_id}
```

Do not treat ambiguous wording such as "sure" or "go ahead" as sufficient confirmation if a stronger, app-specific confirmation was requested.

### Step 6: Call the portal API

Only after the user gives explicit approval, use `shell_command` for the write request:

```text
DELETE {portal_url}/api/apps/{app_id}
```

Add exactly one auth header:

- After Step 3a: `Cookie: id_token={id_token}` and, only when `access_token` was returned, append `; access_token={access_token}`
- After Step 3b: `Authorization: Bearer {api_key}`

The `/api` prefix comes from the backend `root_path` in [/helm/web-streaming-example/templates/configmap.yaml](/helm/web-streaming-example/templates/configmap.yaml).

Expected responses:

- `204 No Content`: application removed successfully
- `401`: credential rejected; restart at Step 3
- `403`: authenticated user is not in the portal admin group; abort and tell the user to contact their **portal administrator** (do not reference internal Slack channels)
- `404`: app already missing or never existed; tell the user
- other `4xx`: surface the response body

Treat a `403` from the API-key path as effectively invalid credentials, because API-key callers should be treated as admins when the key is recognized.

### Step 7: Report result

Tell the user:

- which `app_id` was removed
- the app `title` and `version` if they were known from Step 5
- the associated `function_id` and `function_version_id` if they were used for lookup
- that the portal should now return `404` for `{portal_url}/api/apps/{app_id}`

If the delete call returned `204`, do not expect a response body.

## Rules

- Prefer the portal MCP (`remove_app`) when one for the target portal is connected; only that portal's MCP counts — an MCP connected to a different portal does not, and is not a reason to fall back to HTTP.
- When no portal MCP for the target portal is connected (including when only other portals' MCPs are present), recommend installing the target portal's MCP first (offer to help) before any device flow, API key, or HTTP — even if the portal supports device flow. Use the HTTP fallback only after the user declines the MCP or a target-portal MCP call fails.
- When the IdP lacks device flow, stop and recommend installing the portal MCP (offer to help). Only resolve or use a portal API key after the user explicitly approves the API-key path.
- Never guess `portal_url`, `app_id`, `function_id`, or `function_version_id`.
- If `portal_url` is missing, ask the user to enter it.
- Never delete an app before showing the matched record and receiving explicit confirmation — on the MCP path, preview with `confirm=false` before calling `confirm=true`.
- Never echo `id_token`, `access_token`, or the API key back to the user.
- Prefer env / `api-keys.toml` over asking the user to paste a portal key in chat.
- In restricted environments, retry blocked shell network requests with escalation through `shell_command`.
- Prefer the `web` tool for readable unauthenticated GETs, and `shell_command` for authenticated GETs plus POST and DELETE requests.
