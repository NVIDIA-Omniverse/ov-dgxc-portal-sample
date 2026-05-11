---
id: put-401-portal-auth
category: portal-registration
symptom: "PUT /apps/{app_id} returns 401"
status: complete
skills:
  - publish-streaming-app
  - remove-streaming-app
  - check-streaming-app
docs:
  - "https://docs.omniverse.nvidia.com/omniverse-dgxc/latest/index.html"
---

# Portal PUT returns 401

## Symptom

An attempt to register or update a streaming application on the portal API fails with HTTP **401 Unauthorized**:

```text
PUT {portal_url}/api/apps/{app_id}
→ 401 Unauthorized
```

Typical contexts:

- Running the **`publish-streaming-app`** skill (Step 5)
- Calling **`PUT /api/apps/{app_id}`** from Swagger at `{portal_url}/api/`
- A curl or script that registers apps without a valid portal credential

A **401** means the portal backend did not accept the caller as authenticated. It is **not** an admin-permission failure — that is **403** (see [put-403-admin-dl.md](put-403-admin-dl.md)).

## When you see this

This symptom appears during **portal registration** (Phase B in the diagnostic foundation), before any stream is started.

| Pattern | What it suggests |
|---------|------------------|
| **Swagger after long idle tab** | Browser `id_token` cookie expired — sign in again |
| **Automation / Codex skill** | Missing auth header, wrong auth mode, or stale OAuth tokens |
| **API key path** | Key missing, typo, not provisioned on the deployment, or `apiKeys.enabled: false` |
| **OAuth device-flow path** | Polling ended before approval, tokens expired, or cookies not sent on PUT |
| **Bearer header with an NGC/NVCF token** | Wrong credential type — portal expects portal API key or portal IdP cookies |
| **401 on GET as well as PUT** | Global auth failure, not app-specific payload |

Collect before diagnosing: `portal_url`, exact HTTP method and path, which auth mode was used (OAuth cookies vs API key Bearer), whether Swagger or automation, and the response body if present.

## How portal auth works

`PUT /api/apps/{app_id}` is protected by `admin_only`, which first runs `authenticated_only` in [backend/app/auth.py](../../../backend/app/auth.py). The backend accepts **exactly one** of two credential shapes:

| Auth path | Request header | When to use |
|-----------|----------------|-------------|
| **OAuth (browser / device flow)** | `Cookie: id_token=...; access_token=...` | IdP advertises `device_authorization_endpoint` (preferred for interactive and agent workflows) |
| **Portal API key** | `Authorization: Bearer {api_key}` | IdP does not support device flow, or automation with a provisioned static key |

Evaluation order in `authenticated_only`:

1. If `Authorization: Bearer ...` is present and matches a key in `api-keys.toml`, authentication succeeds (API-key users are treated as admins).
2. Otherwise the backend requires an **`id_token` cookie**, validates it as a JWT against the configured IdP (`client_id`, `issuer`, JWKS), and rejects invalid or expired tokens with **401**.
3. If there is no valid Bearer key and no `id_token` cookie, the response is **401**.

Important distinctions:

- **Do not** send OAuth tokens as `Authorization: Bearer` — the publish skill uses **cookies** for the OAuth path.
- A recognized API key never returns **401** for auth; an invalid key with no cookie still returns **401**. If the key is valid but something else is wrong, you get **200/201** or **403**, not **401**.
- The API lives under **`/api`** (`root_path` in [helm/web-streaming-example/templates/configmap.yaml](../../../helm/web-streaming-example/templates/configmap.yaml)). The write URL is `{portal_url}/api/apps/{app_id}`, not `{portal_url}/apps/...`.

Discovery endpoints (no auth):

```text
GET {portal_url}/config/main.json → auth.clientId, auth.authority, auth.metadataUri, auth.scope
GET {metadataUri} → device_authorization_endpoint, token_endpoint (if supported)
```

Full publish workflow: [publish-streaming-app SKILL.md](../../skills/publish-streaming-app/SKILL.md).

## Diagnosis

Work through the checklist that matches your auth path.

### 1. Confirm 401 vs 403

| Status | Meaning | Next doc |
|--------|---------|----------|
| **401** | Missing, invalid, or expired credential | This guide |
| **403** | Authenticated but not in the portal admin group | [put-403-admin-dl.md](put-403-admin-dl.md) |

Quick probe with an existing session or key:

```text
GET {portal_url}/api/users/me
```

- **401** — fix authentication (below).
- **200** with user info — auth works; retry PUT. If PUT still fails, inspect payload and `app_id`, not credentials.
- **403** on PUT only — admin group issue, not 401.

### 2. Swagger / browser UI

1. Open `{portal_url}` and **sign in** through the portal IdP.
2. Open `{portal_url}/api/` (Swagger), execute **Authorize** if prompted, or rely on session cookies.
3. Retry `PUT /apps/{app_id}`.

If it still returns **401**:

- Hard-refresh or open Swagger in a new tab after sign-in.
- Clear stale cookies for the portal domain and sign in again.
- Confirm the Swagger host matches the portal you signed into (no http/https or hostname mismatch).

### 3. OAuth device-flow (publish-streaming-app Step 3a)

Verify each step from the skill:

| Check | Failure mode |
|-------|----------------|
| `device_authorization_endpoint` present in OIDC metadata | If absent, use API key path (Step 3b), not OAuth |
| User completed approval at `verification_uri_complete` or `verification_uri` + `user_code` | Polling returns `authorization_pending` until approved; `access_denied` / `expired_token` aborts |
| Poll captured **`id_token`** (required) and **`access_token`** | PUT needs both cookies when access token is available |
| PUT sends **`Cookie: id_token=...; access_token=...`** | Sending tokens in `Authorization` header → **401** |
| Poll finished within **`expires_in`** | Expired device code → restart Step 3a |
| JWT still valid at PUT time | Short-lived tokens → re-run device flow |

On PowerShell, use `Invoke-RestMethod` or `curl.exe` for POST/PUT so cookies are attached explicitly.

### 4. API key path (publish-streaming-app Step 3b)

| Check | Failure mode |
|-------|----------------|
| IdP lacks `device_authorization_endpoint` | OAuth device flow unavailable — API key is the supported automation path |
| **`apiKeys.enabled: true`** on the deployment | [helm/web-streaming-example/values.yaml](../../../helm/web-streaming-example/values.yaml) defaults to `enabled: false` |
| Key exists in **`api-keys.toml`** mounted at `API_KEYS_PATH` | Missing file → no keys loaded ([backend/app/api_keys.py](../../../backend/app/api_keys.py)) |
| Header is exactly **`Authorization: Bearer {api_key}`** | `Bearer` prefix required; extra quotes or whitespace breaks match |
| Key value matches deployment secret | Regenerate or copy from admin; old rotated key → **401** |
| Not using NGC API key or NVCF token | Those are different services |

Administrators provision keys via Helm `apiKeys.keys` or an existing Kubernetes Secret (`apiKeys.existingSecret`). Example values shape:

```yaml
apiKeys:
 enabled: true
 keys:
 - name: "admin-service"
 value: "<secret>"
```

Shared dev portal: request or rotate keys through your portal administrator when using a team dev deployment.

### 5. JWT / IdP configuration (less common)

If cookies are present but validation still fails:

- **`aud`** must match portal `client_id`
- **`iss`** must match configured `issuer` or IdP discovery `issuer`
- **`exp`** must be in the future
- Backend can reach **`metadata_uri`** and JWKS (`JWT validation not configured` or silent **401** in logs)

These usually affect all authenticated routes, not PUT alone.

## Fix

Apply the smallest change that matches your diagnosis.

### A. Browser / Swagger

1. Sign out and sign in at `{portal_url}`.
2. Retry from `{portal_url}/api/` Swagger.
3. Use **`GET /users/me`** to confirm **200** before PUT.

### B. OAuth device flow (agents and scripts)

1. Restart at [publish-streaming-app](../../skills/publish-streaming-app/SKILL.md) **Step 2** (discover IdP) and **Step 3a** (device flow).
2. Complete user approval before `expires_in` elapses.
3. On **Step 5**, send **`Cookie: id_token=...; access_token=...`** only — no Bearer header.
4. If the environment blocks shell network calls, escalate per the skill’s Step 0b and retry the same PUT.

### C. API key automation

1. Confirm with the portal admin that API keys are **enabled** and your key is in `api-keys.toml`.
2. Obtain a fresh key if the current one may be rotated or mistyped.
3. Send **`Authorization: Bearer {api_key}`** on PUT (and on GET if verifying with `/users/me`).
4. Re-run **Step 5** of `publish-streaming-app` with the corrected header.

### D. Wrong token type

Replace NGC/NVCF bearer tokens with either:

- Portal API key (`Authorization: Bearer`), or
- Portal IdP **`id_token`** via OAuth device flow (`Cookie` header)

Do not echo `id_token`, `access_token`, or API key values in chat, logs, or verbose curl output.

## Verification

1. **`GET {portal_url}/api/users/me`** returns **200** with user metadata.
2. **`PUT {portal_url}/api/apps/{app_id}`** returns **201 Created** (new app) or **200 OK** (update).
3. Open **`{portal_url}/app/{app_id}`** (URL-encode `app_id` if it contains `:`) and confirm the tile appears.
4. Optional: run **`check-streaming-app`** with `portal_url` and `app_id` to confirm registration and NVCF linkage.

If auth succeeds but PUT returns **403**, switch to [put-403-admin-dl.md](put-403-admin-dl.md). If PUT succeeds but the app is missing from the UI, see [app-invisible-after-register.md](app-invisible-after-register.md).

## Related documentation

| Resource | Relevance |
|----------|-----------|
| [publish-streaming-app SKILL.md](../../skills/publish-streaming-app/SKILL.md) | Canonical OAuth vs API-key workflow for PUT |
| [remove-streaming-app SKILL.md](../../skills/remove-streaming-app/SKILL.md) | Same auth patterns for DELETE |
| [put-403-admin-dl.md](put-403-admin-dl.md) | Authenticated but not admin (**403**, not **401**) |
| [Portal API Swagger]({portal_url}/api/) | Interactive PUT after browser sign-in (dev portal) |
| [STREAMING-REFERENCE.md](../STREAMING-REFERENCE.md) | Phase B portal registration checklist |
| [backend/app/auth.py](../../../backend/app/auth.py) | Cookie vs Bearer evaluation and JWT validation |
| [helm/web-streaming-example/values.yaml](../../../helm/web-streaming-example/values.yaml) | `apiKeys` and `config.auth.adminGroup` |

## Agent notes

- Use **`publish-streaming-app`** to register apps — it discovers IdP capabilities and picks OAuth device flow or API key automatically.
- On **401**, restart authentication at **Step 3** of the publish skill; do not retry PUT with the same expired cookies or key.
- Prefer **`GET /users/me`** as a cheap auth probe before PUT.
- Never guess `function_id` or `function_version_id`; never invent `portal_url`.
- Never echo secrets. Redact tokens and API keys in command history and user-facing output.
- Distinguish **401** (this doc) from **403** (admin DL) before telling the user to request group membership.