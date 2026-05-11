---
id: app-not-on-home-page
category: portal-registration
symptom: "Application not showing on portal home page"
status: complete
skills:
 - check-streaming-app
 - check-nvcf-function
docs:
  - "https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html"
  - "https://nvcf.ngc.nvidia.com/functions"
---

# App not on home page

## Symptom

After publishing or updating a streaming application, the user does not see its tile on the portal **home page** (the main app grid for the selected sidebar page). The app may still exist in the portal database and respond on `GET /api/apps/{app_id}`, but it never appears in the UI catalog the user browses.

This is different from:

- **[app-invisible-after-register.md](app-invisible-after-register.md)** — PUT succeeded with `ACTIVE` status, but `page` / `category` / navigation metadata points somewhere the user is not looking.
- **Stream start errors** (portal-ui docs) — the tile is visible and clickable, but launching a session fails.

## When you see this

This symptom appears at **portal registration / visibility** (Phase B in the diagnostic foundation), before the user clicks to stream.

| Pattern | What it suggests |
|---------|------------------|
| **Never appeared** after first publish | NVCF function not `ACTIVE`, wrong `function_id` / `function_version_id`, or org mismatch → portal status `UNKNOWN` / `ERROR` |
| **Disappeared** after it used to show | Function went `INACTIVE`, `ERROR`, or `DEPLOYING`; NVCF recycle; deployment removed |
| **API shows app, UI does not** | Frontend filters non-visible statuses (see below); fix NVCF runtime, not portal PUT |
| **Wrong sidebar page** | App may be on another `page` value — check all pages or `?page=` query (see related doc) |
| **Tile visible but gray / not clickable** | Status is `DEGRADED` (no instances) — app is on the home page but cannot launch |

Collect before diagnosing: `portal_url`, `app_id` or both NVCF IDs, whether the app ever appeared, and the portal **runtime status** if the user can open admin/API views.

## How home-page visibility works

The portal home page loads apps from `GET /api/apps/`, then the **frontend filters** which records become tiles. Only these NVCF-aligned statuses are shown:

| Status | On home page? | User experience |
|--------|---------------|-----------------|
| `ACTIVE` | Yes | Normal clickable tile |
| `DEGRADING` | Yes | Clickable; fewer instances than `minInstances` |
| `DEGRADED` | Yes | Tile shown with warning; **not** clickable (no instances) |
| `UNKNOWN` | **No** | Portal cannot match IDs to NVCF control plane |
| `ERROR` | **No** | Deployment failed on NVCF |
| `INACTIVE` | **No** | Function disabled in NVCF |
| `DEPLOYING` | **No** | Still rolling out (often >15 min if misconfigured) |

Backend logic: each published app’s `status` is set by correlating `function_id` and `function_version_id` with the NVCF function list (`get_nvcf_function_status`). If no match is found, status is `UNKNOWN`.

Frontend filter (authoritative for “missing tile”): `web/src/state/Apps.ts` — only `ACTIVE`, `DEGRADING`, and `DEGRADED` pass `getStreamingApps`.

## Diagnosis

Work portal linkage first, then NVCF health. Use the skills in frontmatter.

### 1. Portal app record — `check-streaming-app`

Provide `portal_url` and either `app_id` or both `function_id` and `function_version_id`.

Confirm:

| Field | Why it matters |
|-------|----------------|
| **Runtime status** | Must be `ACTIVE`, `DEGRADING`, or `DEGRADED` for any home tile; `UNKNOWN` / `ERROR` / `INACTIVE` / `DEPLOYING` → hidden |
| **Function ID / version ID** | Must exactly match NVCF Overview (copy from function → version, not function root only) |
| **Page** | Must match a configured sidebar page name; wrong `page` → app on another tab (see [app-invisible-after-register.md](app-invisible-after-register.md)) |
| **Title / category** | Does not hide the tile when status is visible; only affects grouping within the page |
| **Deployment block** | If `null`, NVCF deployment API failed — status may still be wrong; run `check-nvcf-function` |

Interpret status:

- **`UNKNOWN`** → Wrong IDs, wrong NGC org, function deleted, or portal cannot list NVCF functions. See [portal-status-unknown.md](portal-status-unknown.md).
- **`ERROR`** → Container or NVCF deployment failure. See [portal-status-error.md](portal-status-error.md) and NVCF History logs.
- **`DEPLOYING`** → Wait or fix health/signaling if stuck >15 min. See [deploying-over-15-minutes.md](../nvcf-deployment/deploying-over-15-minutes.md).
- **`DEGRADED`** → App **is** on the home page but unusable; scale instances or fix cluster capacity.
- **`ACTIVE` but still no tile** → Almost always wrong **`page`** or user on wrong sidebar page — not this doc’s primary path.

Authenticated API check (same data as the skill):

```text
GET {portal_url}/api/apps/{app_id}
```

Compare `status` with what the user sees. List endpoint with filters:

```text
GET {portal_url}/api/apps/?function_id={uuid}&function_version_id={uuid}
```

### 2. NVCF function runtime — `check-nvcf-function`

Provide `function_id` and `function_version_id`. The report must show:

| Check | Target for a launchable app |
|-------|----------------------------|
| **Control-plane status** | `ACTIVE` (primary signal aligned with portal) |
| **Function API status** | Consistent with control plane; note mismatches |
| **Deployment** | Valid cluster, `minInstances` ≥ 1 if you expect immediate capacity |
| **Function type** | `STREAMING` with Low Latency Streaming for Kit streaming apps |
| **Health** | Correct port (`8011` for Kit ≥107.3.3, or template-specific); `/v1/streaming/ready` → 200 |
| **Inference** | Port **49100**, path **`/sign_in`** |

If NVCF is not `ACTIVE`, the portal will not show a normal launchable tile until runtime health is fixed.

### 3. NVCF logs (when status is ERROR or DEPLOYING)

Open [NVCF functions](https://nvcf.ngc.nvidia.com/functions) → your function → **Logs** → **History**.

| Log signal | Interpretation |
|------------|----------------|
| No **RTX Ready** | Kit/GPU failed — build or runtime error |
| **RTX Ready** but not **ACTIVE** | Health/signaling mismatch; wrong ports or missing livestream services |
| **RTX Ready** but slow to become invocable | Known gap between Kit ready and NVCF `ACTIVE` |

### 4. Org and registration sanity

| Check | Action |
|-------|--------|
| Same NGC org | Portal backend and NVCF deployment must use the org the portal is configured for (e.g. dev: **your NGC organization**) |
| Version published to portal | `function_version_id` in PUT must be the version you deployed, not an old draft |
| Re-publish after NVCF fix | `PUT /api/apps/{app_id}` upserts metadata only — fixing NVCF does not require re-PUT unless IDs changed |

## Fix

Apply the smallest change that matches diagnosis. Change one variable at a time.

1. **`UNKNOWN` — fix IDs** — Copy `function_id` and `function_version_id` from NVCF Overview into the portal app (re-run `publish-streaming-app` or correct PUT payload). Confirm org matches.

2. **`ERROR` / crash** — Fix container build, streaming layers, health/inference endpoints; redeploy function version; update portal if `function_version_id` changed.

3. **Stuck `DEPLOYING`** — Set health port/path and inference **49100** + **`/sign_in`**; enable Low Latency Streaming; fill **Health** before **Inference** in NGC UI. See [deploying-over-15-minutes.md](../nvcf-deployment/deploying-over-15-minutes.md).

4. **`INACTIVE`** — Activate the function in NVCF UI or redeploy.

5. **`DEGRADED` (tile visible, cannot launch)** — Increase `minInstances`, fix cluster capacity, or terminate bad instances. See [max-instances-over-available.md](../nvcf-deployment/max-instances-over-available.md).

6. **`ACTIVE` in API but wrong page** — Update `page` (and `category` if needed) via publish skill; browse all sidebar pages or use `?page=` on home URL.

7. **Kit not ready but logs show RTX Ready** — Wait for NVCF control plane; if prolonged, treat as health/signaling or min-instances issue (build/package phase in [STREAMING-REFERENCE.md](../STREAMING-REFERENCE.md)).

## Verification

1. Run **`check-nvcf-function`** — control-plane status `ACTIVE` (or acceptable `DEGRADING` if you understand reduced capacity).
2. Run **`check-streaming-app`** — portal status `ACTIVE` (or `DEGRADING` / `DEGRADED` if that matches intent).
3. Sign in to the portal as an end user; open the home page for the app’s **`page`**; confirm the tile appears.
4. If status is `ACTIVE`, click the tile and confirm a **new** session starts (stream start is a separate checklist).
5. Optional: `GET {portal_url}/api/apps/?status=ACTIVE` (authenticated) — app appears when filtered.

## Related issues and documentation

| Resource | Relevance |
|----------|-----------|
| [portal-status-unknown.md](portal-status-unknown.md) | `UNKNOWN` — ID or org mismatch |
| [portal-status-error.md](portal-status-error.md) | `ERROR` — NVCF deployment failure |
| [app-invisible-after-register.md](app-invisible-after-register.md) | `ACTIVE` but wrong `page` / category |
| [deploying-over-15-minutes.md](../nvcf-deployment/deploying-over-15-minutes.md) | Hidden while `DEPLOYING` |
| [NVCF debuggability](https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html) | History vs Live Tail |
| [STREAMING-REFERENCE.md](../STREAMING-REFERENCE.md) | — |
| `publish-streaming-app` skill | Correct metadata and PUT upsert |
| Portal API | `{portal_url}/api/` — `GET /apps/{app_id}` |

## Agent notes

- Run **`check-streaming-app` first** when the user has `app_id` or a portal URL — it returns the **portal runtime status** that drives home-page filtering.
- Do not confuse **missing tile** (`UNKNOWN` / `ERROR` / `INACTIVE` / `DEPLOYING`) with **wrong page** (`ACTIVE` in API, user on default home tab) or **degraded tile** (`DEGRADED` still listed).
- The home page refetches apps every **30 seconds** — after fixing NVCF, ask the user to wait one refresh cycle or hard-reload.
- `GET /api/apps/` returns apps regardless of frontend filter when `status` query is `ALL` (default for API); the **browser catalog** is stricter.
- If `check-streaming-app` shows `ACTIVE` but the user still sees nothing, pivot to [app-invisible-after-register.md](app-invisible-after-register.md) before deep NVCF log dives.
- Never echo portal tokens, API keys, or NVCF keys in chat or command output when running check skills.