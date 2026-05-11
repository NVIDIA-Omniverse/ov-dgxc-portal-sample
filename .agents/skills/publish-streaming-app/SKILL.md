---
name: publish-streaming-app
description: Publish or update a streaming application on the Omniverse portal by collecting app metadata, authenticating against the portal's identity setup, and calling `PUT /api/apps/{app_id}`. Use when Codex needs to add, publish, register, or update a streaming function or application on the portal and the user can provide an NVCF `function_id` and `function_version_id`.
---

# Publish Streaming Application

Use this skill to publish or update a streaming application on the Omniverse portal. The portal's `PUT /api/apps/{app_id}` endpoint upserts a `PublishedApp` record and requires admin authentication.

**Prefer the portal MCP when it is installed.** If a portal MCP server for the target portal is connected — one exposing the tools `list_apps`, `get_app`, `publish_app`, and `remove_app` (such as the OVonDGXC portal MCP) — use its `publish_app` tool and skip the manual HTTP, IdP discovery, slug, and authentication steps. The MCP brokers admin authentication itself through a one-time browser login. If no portal MCP for the target portal is connected — including when the only connected portal MCP points at a **different** portal — recommend installing the MCP for the target portal first (offer to help) before trying device flow, an API key, or any direct HTTP. Fall back to the direct HTTP approach only after the user declines the MCP, or the MCP call fails. See **MCP-first path (preferred)** below.

When falling back to direct HTTP, prefer OAuth 2.0 device flow when the configured identity provider advertises it, and fall back to a portal API key when it does not.

## Required inputs

The user must provide both of these values. If either is missing, stop and ask.

- `function_id`: UUID of the NVCF function
- `function_version_id`: UUID of the function version

Never guess either value.

## Workflow

Track progress with this checklist:

```text
- [ ] MCP check: Prefer the target portal's MCP — if connected, use publish_app and skip Steps 0–5; if none for the target portal, recommend installing it first before any HTTP
- [ ] Step 0: Choose the network approach (HTTP fallback)
- [ ] Step 1: Collect missing metadata
- [ ] Step 2: Discover IdP configuration
- [ ] Step 3: Authenticate
- [ ] Step 4: Generate slug and app_id
- [ ] Step 5: PUT /api/apps/{app_id}
- [ ] Step 6: Report result
```

### MCP-first path (preferred)

Before any HTTP or authentication work, check whether a portal MCP server is connected — one that exposes the tools `list_apps`, `get_app`, `publish_app`, and `remove_app` (for example the OVonDGXC portal MCP). The MCP brokers admin authentication through a one-time browser login, so it removes the device-flow, API-key, and sandbox-network handling that the HTTP fallback needs.

The MCP must target the **same portal** as `portal_url`. A portal MCP is configured with the URL `{portal_url}/mcp`, so match the connected server's URL against the target portal. A portal MCP connected to a **different** portal does not serve the target portal — do not call it for this request, and do not let its presence push you to the HTTP fallback.

**Case 1 — a portal MCP for the target portal is connected.** Use it:

1. Collect the same metadata as **Step 1** (the MCP still needs `function_id`, `function_version_id`, `title`, `version`, `category`, `page`, `product_area`, and optionally `authentication_type`, `media_server`, `media_port`, `icon`).
2. Call `publish_app` with those fields. The tool generates the `slug` and `app_id`, upserts the record, and returns the result — so skip the manual slug build in Step 4.
3. Go straight to **Step 6: Report result** with the tool response. Skip Steps 0–5.

If `publish_app` returns an authorization error, the signed-in user is not in the portal admin group — tell the user to contact their **portal administrator** for admin group membership rather than switching to the HTTP fallback.

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

- **(a) Install the portal MCP for the target portal** (preferred) — offer to help with the setup above. Once connected, restart at Case 1 and use `publish_app`.
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
| `PUT {portal_url}/api/apps/{app_id}` | PUT | yes | `shell_command` |

Notes:

- Prefer the `web` tool for unauthenticated GETs because it avoids shell-network sandbox issues and makes JSON easier to inspect.
- If the `web` tool cannot reach a private host, fall back to `shell_command`.
- Use `shell_command` for POST and PUT requests, since the `web` tool is not suitable for authenticated writes in this workflow.

#### Step 0b: Escalate terminal network calls when needed

If a shell network call fails because of sandboxing, DNS resolution, certificate access, or another likely environment restriction, rerun that command with:

- `sandbox_permissions: "require_escalated"`
- a short `justification` explaining the exact portal or IdP request

Do not ask the user in chat before requesting escalation; use the tool's approval flow directly. Reuse the same request pattern for later POST and PUT calls if the environment remains restricted.

Never echo secrets in commands or shell output. Prefer request bodies and headers that do not get reprinted by verbose flags.

### Step 1: Collect missing metadata

Ask only for fields the user has not already provided. Group missing fields into one concise message where possible. When you ask, explain what each field is for and where it shows up so the user can choose good values, not just valid ones.

#### How the portal organizes apps

Understanding the layout makes the field purposes clear. On the portal home, apps are organized as **page → category → app card**:

- The left sidebar lists **pages**. The user picks one page at a time.
- Within the selected page, apps are grouped under **category** headings (a category with an empty value renders with no heading).
- Each app is a **card** showing the icon, the product area as a small line above the title, the title, and the selected version.
- Records that share the same `title` are merged into one card, and their `version` values become entries in the card's version dropdown. The highest semver version is shown by default.
- Only apps whose NVCF function status is active (or degrading/degraded) appear on the home page; otherwise the card is hidden.

The app detail page (`/app/{app_id}`) shows the icon and title in the header, then a table with version, page, category, product area, function ID, function version, and authentication type.

#### Field reference

| Field | Required | Purpose and portal representation |
|---|---|---|
| `portal_url` | yes | Base URL of the portal, for example `https://portal.example.com`. Not stored on the app; it is the target host for the API call. |
| `title` | yes | The application name. Shown as the large heading on the app card, the detail page header, and the breadcrumb. Records with the same title are grouped into one card with a version dropdown, so reuse the exact title to add a version to an existing app. Max 100 characters. |
| `version` | yes | The application version, for example `2024.1.0`. Shown small on the card and as the "Version" row on the detail page, and listed in the card's version dropdown. Use valid semver so the portal can sort versions and select the latest one by default. Max 50 characters. |
| `page` | yes | The sidebar page that the app is filed under. Becomes a navigation entry in the left sidebar; the user must open this page to see the app. Max 150 characters. |
| `category` | yes | The grouping heading within a page. Apps under the same page and category render together beneath one heading. Max 150 characters. |
| `product_area` | yes | A short subtitle, for example `Omniverse`. Shown as the small line above the title on the card and as the "Product area" row on the detail page. Max 150 characters. |
| `authentication_type` | yes | Controls whether the portal forwards user authentication to the streaming app. Shown as the "Authentication type" row on the detail page. See Step 1a. |
| `media_server` | optional | Hostname of a private streaming endpoint, used when the stream is served from a private host rather than the default. Not surfaced in the standard portal UI; default empty. |
| `media_port` | optional | Port of the private streaming endpoint, paired with `media_server`. Not surfaced in the standard portal UI; default empty. |
| `icon` | optional | URL of the icon image. Rendered at 64x64 on the app card and in the detail page header. |

Set `description = title` automatically. Do not ask for `description`. The backend stores it (and supports Markdown) but the current portal UI does not display it prominently.

If `icon` is missing, substitute `https://placehold.co/256x256?text=App` and tell the user that a placeholder icon was used.

#### Step 1a: Authentication type

Explain the choices before asking:

- `NONE`: Do not forward user authentication to the streaming application. This is the default and the right choice for most self-contained or public-style apps.
- `OPENID`: Forward the user's IdP access token to the streaming application. Use this when the app needs the same user identity as the portal.
- `NUCLEUS`: Forward a Nucleus access token to the streaming application. Use this when the app must access an Omniverse Nucleus server as the signed-in user.

Also tell the user:

> If unsure, choose `NONE`. You can change this later by re-running this skill because the PUT endpoint upserts.

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

If it is missing, the IdP does not support OAuth device flow. **Before resorting to a portal API key, suggest installing the portal MCP** — it avoids API keys entirely by brokering admin authentication through a one-time browser login, and lets agents call `publish_app` directly without per-request auth or sandbox-network handling. Share the setup, substituting the real `portal_url`:

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
- HTTP 200: capture `id_token` and `access_token`

Stop polling once `expires_in` has elapsed.

When this path succeeds, Step 5 must authenticate with:

```text
Cookie: id_token=...; access_token=...
```

Never echo token values back to the user.

#### Step 3b: API key fallback

Use this path only when the IdP does not advertise `device_authorization_endpoint` **and** the user has explicitly approved the API-key path after being offered the portal MCP (see Step 2). Never resolve or use a key without that explicit approval. The backend accepts a static API key as a Bearer token and treats API-key callers as administrators, as shown in [backend/app/auth.py](/backend/app/auth.py).

Resolve the portal API key per **Portal API key (do not paste in chat)** in `check-streaming-app`. If resolution fails, send the out-of-band setup instructions from that section (and admin contact text if they lack a key) and **stop**. Do not log or repeat the value.

When this path succeeds, Step 5 must authenticate with:

```text
Authorization: Bearer {api_key}
```

### Step 4: Generate slug and app_id

Build values exactly this way:

- `slug`: lowercase `title`, replace any character not in `[A-Za-z0-9_-]` with `-`, collapse repeated `-`, trim leading and trailing `-`, then truncate to 100 characters
- `app_id`: `{slug}:{version}`

This matches the backend constraints and the existing ID convention in [backend/app/tests/routers/test_apps.py](/backend/app/tests/routers/test_apps.py).

### Step 5: Call the portal API

Use `shell_command` for the write request:

```text
PUT {portal_url}/api/apps/{app_id}
Content-Type: application/json
```

Add exactly one auth header:

- After Step 3a: `Cookie: id_token={id_token}; access_token={access_token}`
- After Step 3b: `Authorization: Bearer {api_key}`

The `/api` prefix comes from the backend `root_path` in [helm/web-streaming-example/templates/configmap.yaml](/helm/web-streaming-example/templates/configmap.yaml).

Send a JSON body matching `PublishedApp` in [backend/app/models.py](/backend/app/models.py):

```json
{
  "slug": "...",
  "function_id": "...",
  "function_version_id": "...",
  "title": "...",
  "description": "<same value as title>",
  "version": "...",
  "icon": "...",
  "page": "...",
  "category": "...",
  "product_area": "...",
  "authentication_type": "NONE",
  "media_server": null,
  "media_port": null
}
```

Expected responses:

- `201 Created`: new application registered
- `200 OK`: existing application updated
- `401`: credential rejected; restart at Step 3
- `403`: authenticated user is not in the portal admin group; abort and tell the user to contact their **portal administrator** for admin group membership (do not reference internal Slack channels)
- other `4xx`: surface the response body

Treat a `403` from the API-key path as effectively invalid credentials, because API-key callers should be treated as admins when the key is recognized.

### Step 6: Report result

Tell the user:

- the returned `id`
- the returned `slug`
- whether the call created or updated the application
- two links:
  1. **Home page** — `{portal_url}/?page={page}`. Use the `page` value from the published metadata (MCP response or PUT body). The `page` query parameter selects the sidebar page on the home page where the app card appears. URL-encode the page name when constructing the link.
  2. **Start a stream** — `{portal_url}/app/{app_id}`. URL-encode `app_id` if needed when constructing the link.

The backend API uses `/api/apps/{app_id}`; the links above are frontend routes only.

## Rules

- Prefer the portal MCP (`publish_app`) when one for the target portal is connected; only that portal's MCP counts — an MCP connected to a different portal does not, and is not a reason to fall back to HTTP.
- When no portal MCP for the target portal is connected (including when only other portals' MCPs are present), recommend installing the target portal's MCP first (offer to help) before any device flow, API key, or HTTP — even if the portal supports device flow. Use the HTTP fallback only after the user declines the MCP or a target-portal MCP call fails.
- When the IdP lacks device flow, stop and recommend installing the portal MCP (offer to help). Only resolve or use a portal API key after the user explicitly approves the API-key path.
- Never guess `function_id` or `function_version_id`.
- Never invent a portal URL.
- Never echo `id_token`, `access_token`, or the API key back to the user.
- Prefer env / `api-keys.toml` over asking the user to paste a portal key in chat.
- Tell the user when a placeholder icon is substituted.
- In restricted environments, retry blocked shell network requests with escalation through `shell_command`.
- Prefer the `web` tool for readable unauthenticated GETs, and `shell_command` for POST or PUT requests.
