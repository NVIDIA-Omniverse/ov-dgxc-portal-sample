---
name: check-nvcf-function
description: Retrieves full NVCF function and deployment information for a given function ID (and optionally a function version ID) via the NVCF and NGC APIs, including status, container image, inference and health endpoints, ports, and deployment specifications. When only a function ID is provided, lists the available versions and asks the user to confirm or select one — even when only one version exists. Use when the user asks to inspect, verify, or debug an NVCF function or function version, or needs details such as ACTIVE status, container image, inference port, or cluster/GPU settings.
---

# Check NVCF Function

Use this skill to fetch and summarize everything needed to understand a specific NVCF function version: runtime status, function configuration (container, ports, endpoints), and deployment specifications. The workflow mirrors [backend/app/nvcf.py](backend/app/nvcf.py) and [backend/app/settings.py](backend/app/settings.py).

When invoked from `diagnose-streaming-issues`, if `NVCF_API_KEY` cannot be resolved, return **only** the out-of-band setup instructions below — no NVCF report and no streaming triage summary.

## Required inputs

Ask only for values the user has not already provided.

| Field | Required | Notes |
|---|---|---|
| `function_id` | yes | UUID of the NVCF function |
| `function_version_id` | no | UUID of the function version. If omitted, list available versions (Step 1b) and ask the user to confirm or select one — even when only one version exists |
| `nvcf_api_key` | yes | Resolved from env or local config — do not ask the user to paste it in chat (see below) |

Never guess `function_id` or `function_version_id`. When `function_version_id` is missing, do not assume or auto-select one — list the versions and ask the user to confirm or select, even when only one version exists.

### Platform (Windows and Linux)

Detect the shell OS before running commands (for example `uname -s` on Linux, or `$IsWindows` / `OS` in PowerShell). Use the matching blocks below for the rest of this skill.

| Task | Windows (PowerShell) | Linux / macOS (bash) |
|---|---|---|
| HTTP client | `Invoke-RestMethod` or `curl.exe` (not the `curl` alias) | `curl` |
| Env var read | `$env:NVCF_API_KEY` | `$NVCF_API_KEY` |
| Env var set (user, out of chat) | `$env:NVCF_API_KEY = '<key>'` | `export NVCF_API_KEY='<key>'` |
| Python for `settings.toml` | `python` or `py -3` | `python3` or `python` |

After resolving the key, normalize to `NVCF_API_KEY` in the shell session (copy from `NVCF_TOKEN` or `NGC_API_KEY` if needed) so all API steps use the same variable name.

> **Windows pitfall — trailing CR causes a spurious 401.** When PowerShell captures the key from a native command (e.g. `python -c "print(...)"`), it can retain a trailing carriage return/newline that corrupts the `Bearer` header and yields HTTP 401 even though the key is valid. Always `.Trim()` a captured key (and prefer `sys.stdout.write` over `print` so Python emits no newline). If NVCF returns 401 but the same key works in the running portal, suspect this before assuming the key is bad. As a fallback, run the API calls in Python (reading the key with `tomllib`, exactly like the backend) to bypass shell string-handling entirely.

### NVCF API key (do not paste in chat)

Resolve the key in this order. Stop at the first source that yields a non-empty value.

| Priority | Source | How the agent uses it                                                                                                                                |
|---|---|------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1 | Shell environment | `NVCF_API_KEY`, then `NVCF_TOKEN`, then `NGC_API_KEY` (same names as [scripts/create_function.sh](scripts/create_function.sh) and local backend dev) |
| 2 | Local backend settings | `nvcf_api_key` in [backend/settings.toml](backend/settings.toml) (gitignored; path overridable with `SETTINGS_PATH`)                                 |
| 3 | User message | Only if the user explicitly pasted a key anyway — treat as last resort and warn that chat history may retain it                                      |

**Before asking the user for anything**, run a check that only reports whether a key is available, never the value.

**Windows (PowerShell):**

```powershell
if ($env:NVCF_API_KEY) { 'NVCF_API_KEY set' }
elseif ($env:NVCF_TOKEN) { 'NVCF_TOKEN set' }
elseif ($env:NGC_API_KEY) { 'NGC_API_KEY set' }
else { 'no env key' }
```

**Linux / macOS (bash):**

```bash
if [ -n "$NVCF_API_KEY" ]; then echo 'NVCF_API_KEY set'
elif [ -n "$NVCF_TOKEN" ]; then echo 'NVCF_TOKEN set'
elif [ -n "$NGC_API_KEY" ]; then echo 'NGC_API_KEY set'
else echo 'no env key'
fi
```

To load from `backend/settings.toml` without printing the key:

**Windows (PowerShell):**

```powershell
$settingsPath = if ($env:SETTINGS_PATH) { $env:SETTINGS_PATH } else { 'backend/settings.toml' }
if ((Test-Path $settingsPath) -and -not $env:NVCF_API_KEY) {
  # .Trim() strips the trailing CR/newline PowerShell captures from Python's
  # stdout — an untrimmed key produces a malformed Bearer header and a 401.
  $env:NVCF_API_KEY = (python -c "import tomllib,sys; sys.stdout.write(tomllib.load(open(r'$settingsPath','rb'))['nvcf_api_key'])").Trim()
}
if (-not $env:NVCF_API_KEY -and $env:NVCF_TOKEN) { $env:NVCF_API_KEY = $env:NVCF_TOKEN }
if (-not $env:NVCF_API_KEY -and $env:NGC_API_KEY) { $env:NVCF_API_KEY = $env:NGC_API_KEY }
```

**Linux / macOS (bash):**

```bash
SETTINGS_PATH="${SETTINGS_PATH:-backend/settings.toml}"
if [ -f "$SETTINGS_PATH" ] && [ -z "$NVCF_API_KEY" ]; then
  PY=python3; command -v python3 >/dev/null 2>&1 || PY=python
  export NVCF_API_KEY="$("$PY" -c "import tomllib; print(tomllib.load(open('$SETTINGS_PATH','rb'))['nvcf_api_key'])")"
fi
[ -z "$NVCF_API_KEY" ] && [ -n "$NVCF_TOKEN" ] && export NVCF_API_KEY="$NVCF_TOKEN"
[ -z "$NVCF_API_KEY" ] && [ -n "$NGC_API_KEY" ] && export NVCF_API_KEY="$NGC_API_KEY"
```

Use the resolved value only inside the shell session. **Never** assign a literal key in a command the user or logs can see:

```powershell
# Forbidden on Windows — exposes the key in terminal history and tool output
$env:NVCF_API_KEY = 'nvapi-...'
```

```bash
# Forbidden on Linux — same problem
export NVCF_API_KEY='nvapi-...'
```

Authenticated requests must reference the environment variable only.

**Windows (PowerShell):**

```powershell
$headers = @{ Authorization = "Bearer $env:NVCF_API_KEY"; Accept = 'application/json' }
Invoke-RestMethod -Uri "..." -Headers $headers
```

**Linux / macOS (bash):**

```bash
curl -sS -H "Authorization: Bearer ${NVCF_API_KEY}" -H "Accept: application/json" "..."
```

If no key is available after steps 1–2, tell the user how to set one **outside chat**, then re-run the skill:

> Set your NGC Personal API key in the terminal before continuing (it will not be sent in this chat):
>
> **Windows (PowerShell, current session):** `$env:NVCF_API_KEY = '<your-key>'`
>
> **Linux / macOS (bash, current session):** `export NVCF_API_KEY='<your-key>'`
>
> **Or** add it to `backend/settings.toml` as `nvcf_api_key = "..."` (see [backend/README.md](backend/README.md); the file is gitignored).
>
> **Or** set `NVCF_TOKEN` the same way you would for [scripts/create_function.sh](scripts/create_function.sh) (`export NVCF_TOKEN=...` on Linux, `$env:NVCF_TOKEN = ...` on Windows).
>
> Scopes: `list_functions` or `list_functions_details`. Create a key: [Generate an NGC Personal API Key](https://docs.nvidia.com/ngc/gpu-cloud/ngc-user-guide/index.html#generating-personal-api-key).

Do not ask the user to paste the key into the chat unless they insist after trying env or `settings.toml`.

Optional overrides (use defaults when omitted):

| Field | Default | Env var (optional) |
|---|---|---|
| `nvcf_control_endpoint` | `https://api.nvcf.nvidia.com` | `NVCF_CONTROL_ENDPOINT` |
| `ngc_endpoint` | `https://api.ngc.nvidia.com` | `NGC_ENDPOINT` |

## Workflow

```text
- [ ] Step 0: Choose the network approach
- [ ] Step 1: Collect missing inputs and resolve API key
- [ ] Step 1b: Resolve the function version (only if function_version_id is missing)
- [ ] Step 2: Get function version configuration
- [ ] Step 3: Get runtime status from control plane
- [ ] Step 4: Get deployment specifications
- [ ] Step 5: Present the report
```

### Step 0: Choose the network approach

All NVCF calls need outbound HTTPS with the API key. Prefer `shell_command` for authenticated GETs. Follow **Platform (Windows and Linux)** for the HTTP client and env var syntax.

If a shell network call fails because of sandboxing, DNS, or TLS, rerun with `sandbox_permissions: "require_escalated"` and a short justification. Do not echo the API key in commands or output.

Example: fetch function version (replace `{fid}`, `{vid}`, and base URL):

**Windows (PowerShell):**

```powershell
$nvcf = if ($env:NVCF_CONTROL_ENDPOINT) { $env:NVCF_CONTROL_ENDPOINT } else { 'https://api.nvcf.nvidia.com' }
$h = @{ Authorization = "Bearer $env:NVCF_API_KEY"; Accept = 'application/json' }
Invoke-RestMethod -Uri "$nvcf/v2/nvcf/functions/{fid}/versions/{vid}" -Headers $h
```

**Linux / macOS (bash):**

```bash
NVCF_BASE="${NVCF_CONTROL_ENDPOINT:-https://api.nvcf.nvidia.com}"
curl -sS -H "Authorization: Bearer ${NVCF_API_KEY}" -H "Accept: application/json" \
  "${NVCF_BASE}/v2/nvcf/functions/{fid}/versions/{vid}"
```

### Step 1: Collect missing inputs and resolve API key

Stop if `function_id` is missing.

Resolve `nvcf_api_key` per **NVCF API key (do not paste in chat)** above. If resolution fails, give the out-of-band setup instructions and stop.

If `function_version_id` is missing, go to Step 1b before continuing. Otherwise skip to Step 2.

### Step 1b: Resolve the function version

Run only when `function_version_id` was not provided. List the versions for the function and ask the user to confirm or select one — even when only one version exists.

```text
GET {nvcf_control_endpoint}/v2/nvcf/functions/{function_id}/versions
Accept: application/json
Authorization: Bearer $NVCF_API_KEY
```

**Windows (PowerShell):**

```powershell
$nvcf = if ($env:NVCF_CONTROL_ENDPOINT) { $env:NVCF_CONTROL_ENDPOINT } else { 'https://api.nvcf.nvidia.com' }
$h = @{ Authorization = "Bearer $env:NVCF_API_KEY"; Accept = 'application/json' }
(Invoke-RestMethod -Uri "$nvcf/v2/nvcf/functions/{function_id}/versions" -Headers $h).functions |
  Select-Object versionId, status, name, createdAt
```

**Linux / macOS (bash):**

```bash
NVCF_BASE="${NVCF_CONTROL_ENDPOINT:-https://api.nvcf.nvidia.com}"
curl -sS -H "Authorization: Bearer ${NVCF_API_KEY}" -H "Accept: application/json" \
  "${NVCF_BASE}/v2/nvcf/functions/{function_id}/versions"
```

Documented in [List Function Versions](https://docs.api.nvidia.com/cloud-functions/reference/listfunctionversions). The response body is `{ "functions": [ ... ] }`, one entry per version.

Then:

- If no versions are returned, tell the user the function has no versions and stop.
- If one or more versions are returned, present them (`versionId`, `status`, `createdAt`) and ask the user which version to check — even when only one version exists. Wait for the answer; do not auto-select or guess. Set `function_version_id` to the user's choice, then continue to Step 2.

### Step 2: Get function version configuration

```text
GET {nvcf_control_endpoint}/v2/nvcf/functions/{function_id}/versions/{function_version_id}
Accept: application/json
Authorization: Bearer $NVCF_API_KEY
```

(`NVCF_API_KEY` is the environment variable after resolution — `$env:NVCF_API_KEY` on Windows, `$NVCF_API_KEY` on Linux — not a chat placeholder.)

Documented in [Get Function Version Details](https://docs.api.nvidia.com/cloud-functions/reference/getfunction). The response body is `{ "function": { ... } }`.

Extract and keep for the report (use `null` or “not set” when absent):

| Area | JSON fields |
|---|---|
| Identity | `id`, `versionId`, `name`, `ncaId`, `createdAt` |
| Status (config API) | `status` |
| Container | `containerImage`, `containerArgs`, `containerEnvironment`, `helmChart`, `helmChartServiceName` |
| Inference | `inferenceUrl`, `inferencePort`, `apiBodyFormat`, `functionType` (if present) |
| Health | `health` (object: `protocol`, `uri`, `port`, `timeout`, `expectedStatusCode`) and/or `healthUri` |
| Other | `models`, `resources`, `activeInstances`, `ownedByDifferentAccount` |

If HTTP is not successful, record the status code and response body snippet (no secrets) and continue with Steps 3–4 when possible.

### Step 3: Get runtime status from control plane

This matches `get_nvcf_functions()` in [backend/app/nvcf.py](backend/app/nvcf.py). The control-plane list includes statuses such as `DEGRADING` and `DEGRADED` that the portal uses via [backend/app/models.py](backend/app/models.py).

```text
GET {nvcf_control_endpoint}/v2/nvcf/functions
Authorization: Bearer $NVCF_API_KEY
```

From `functions[]`, find the entry where `id` equals `function_id` and `versionId` equals `function_version_id`. Report:

- `status` — use this as **runtime status** in the final report
- `name` from the list (cross-check with Step 2)

If no matching entry is found, set runtime status to `UNKNOWN` (same as `get_nvcf_function_status()` when the function is missing from the list).

Known runtime status values: `ACTIVE`, `INACTIVE`, `DEPLOYING`, `ERROR`, `DEGRADING`, `DEGRADED`, `UNKNOWN`.

### Step 4: Get deployment specifications

This matches `get_nvcf_deployment_details()` in [backend/app/nvcf.py](backend/app/nvcf.py).

```text
GET {ngc_endpoint}/v2/nvcf/deployments/functions/{function_id}/versions/{function_version_id}
Authorization: Bearer $NVCF_API_KEY
```

From `deployment`:

| Field | Source |
|---|---|
| `functionStatus` | `deployment.functionStatus` |
| Deployment spec | First element of `deployment.deploymentSpecifications[]` |
| GPU / instance | `gpu`, `instanceType` |
| Scaling | `minInstances`, `maxInstances`, `maxRequestConcurrency` |
| Clusters | `clusters[]` |
| Backend | `backend` (if present) |

If `deploymentSpecifications` is empty or the request fails, say deployment details are unavailable.

### Step 5: Present the report

Use this structure:

```markdown
# NVCF function {function_id}

**Version:** {function_version_id}

## Runtime status
- **Control plane:** {status from Step 3}
- **Function API status:** {status from Step 2, if retrieved}

## Container and configuration
- **Name:** …
- **Container image:** …
- **Function type:** …
- **API body format:** …
- **Container args:** …
- **Environment:** (table or bullet list of key/value)

## Endpoints and ports
- **Inference URL:** …
- **Inference port:** …
- **Health:** protocol, URI, port, timeout, expected status (from `health` or `healthUri`)

## Deployment
- **Deployment function status:** …
- **GPU / instance type:** …
- **Cluster(s):** …
- **Instances:** min / max
- **Max request concurrency:** …

## Active instances
(Summarize `activeInstances` from Step 2 if any; otherwise “none listed”.)

## Notes
- Call out mismatches (for example control plane `UNKNOWN` but function API shows `ACTIVE`).
- For streaming Kit apps, expected patterns are documented in [scripts/create_function.sh](scripts/create_function.sh): inference port `49100`, path `/sign_in`, health port often `8111` with `/v1/streaming/ready`, `functionType` `STREAMING`.
- Link to NVCF UI: https://nvcf.ngc.nvidia.com/functions
- For quota, `max allocation: 0`, or cluster capacity errors, direct the user to their **NVCF platform owner** — not internal chat channels.
```

## Rules

- Never guess IDs or API keys. When `function_version_id` is missing, always ask the user to confirm or select a version — never auto-select, even if only one version exists.
- Never echo the API key in chat, commands, terminal output, or logs.
- Never embed a literal API key in a shell command; use environment variables or load from gitignored `settings.toml` only inside the shell session.
- Prefer env / `settings.toml` over asking the user to paste a key in chat.
- Use the Windows or Linux command blocks from **Platform**; do not assume PowerShell on Linux or bash on Windows.
- Treat control-plane `status` (Step 3) as the primary runtime status for portal-aligned checks.
- Prefer three API calls (Steps 2–4) over portal scraping.
- If the user only needs portal app metadata, suggest the portal `GET /api/apps/{app_id}` path instead; this skill is for direct NVCF/NGC API inspection.
