---
id: portal-status-unknown
category: portal-registration
symptom: "Portal app status UNKNOWN"
status: complete
skills:
 - check-streaming-app
 - check-nvcf-function
docs:
  - "https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/function-creation.html"
  - "https://nvcf.ngc.nvidia.com/functions"
---

# Portal status UNKNOWN

## Symptom

After registering or inspecting a streaming app on the portal, the **runtime status** field is `UNKNOWN` instead of `ACTIVE`, `DEGRADING`, or another NVCF state.

Typical contexts:

- `GET /api/apps/{app_id}` (or the `check-streaming-app` report) shows **Runtime status: UNKNOWN**
- The app tile is missing from the portal home page (see [app-not-on-home-page.md](app-not-on-home-page.md))
- A `PUT /api/apps/{app_id}` succeeded (201/200) but the response body still shows `status: "UNKNOWN"`

`UNKNOWN` is not a stream-start error. It means the portal backend could not match the stored `function_id` and `function_version_id` to a function in the NVCF control-plane list it queries with its configured API key.

## When you see this

This symptom appears at **portal registration / visibility** (Phase B in the diagnostic foundation), before or instead of a healthy launch tile.

| Pattern | What it suggests |
|---------|------------------|
| **Immediately after PUT** | Wrong UUIDs in the registration payload, or function not visible to the portal's NGC org |
| **Was ACTIVE, now UNKNOWN** | Function deleted or redeployed under a new version ID; portal record still points at the old pair |
| **Function visible in NVCF UI, portal UNKNOWN** | Org or account mismatch — your user sees the function, the portal API key does not |
| **All apps UNKNOWN** | Portal backend `nvcf_api_key` missing, invalid, or NVCF control-plane call failing |
| **IDs look correct in both places** | Transposed `function_id` / `function_version_id`, stale cache (≤30 s), or function in a different NGC org |

Collect before diagnosing: `portal_url`, `app_id` (or both NVCF UUIDs), which NGC org you deployed to (e.g. your NGC organization), and whether the function appears in [NVCF functions](https://nvcf.ngc.nvidia.com/functions) under that org.

## How status is resolved

The portal does not store NVCF status in its database. On each `GET /api/apps/{app_id}` it:

1. Loads `function_id` and `function_version_id` from the published app record
2. Calls NVCF `GET /v2/nvcf/functions` with the portal's `nvcf_api_key`
3. Looks up the `(function_id, function_version_id)` pair in that list
4. Sets `status` to the function's control-plane status, or **`UNKNOWN`** if no match is found

So `UNKNOWN` always means **no matching entry in the control-plane list the portal can see**, not that Kit failed inside a running pod (that would be `ERROR` — see [portal-status-error.md](portal-status-error.md)).

## Diagnosis

Work through portal linkage first, then direct NVCF verification. Use the skills listed in frontmatter.

### 1. Portal app record — `check-streaming-app`

Provide `portal_url` and either `app_id` or both NVCF IDs.

Confirm and record:

| Field | Why it matters |
|-------|----------------|
| **Function ID** | Must match NVCF Overview exactly |
| **Function version ID** | Version UUID, not the function UUID; changes on each new NVCF version |
| **Runtime status** | Expect `UNKNOWN` for this issue |
| **Deployment** | Often `null` when status is `UNKNOWN` (deployment API also keys off the same IDs) |

If the user gave NVCF IDs that do not match the portal record, stop — the registration payload or a prior edit is wrong.

If **Deployment** is populated but status is still `UNKNOWN`, treat that as a transient cache or partial API failure; re-fetch after ~30 seconds and continue with Step 2.

### 2. NVCF ground truth — `check-nvcf-function`

Provide the same `function_id` and `function_version_id` from Step 1.

Interpret the report:

| `check-nvcf-function` result | Meaning |
|------------------------------|---------|
| Control-plane status `ACTIVE`, `DEPLOYING`, `ERROR`, etc. | Function exists for **your** API key — portal linkage or org config is wrong |
| Control-plane status `UNKNOWN`, function API 404 | IDs invalid or function not in an org your key can list |
| Function API 200 but `ownedByDifferentAccount: true` | Function belongs to another NGC account; portal key likely cannot see it |
| Step 2 succeeds, Step 1 still `UNKNOWN` | Portal `nvcf_api_key` / `ngc_org` differs from the key used in `check-nvcf-function` |

From the function version config, note **`ncaId`** and container name — confirm they match the org where you intended to deploy.

### 3. Compare IDs manually (NVCF Overview)

Open [NVCF functions](https://nvcf.ngc.nvidia.com/functions) in the **same NGC org** as the deployment.

1. Find the function by name or search
2. Copy **Function ID** and **Version ID** from Overview (not from the URL fragment alone)
3. Diff against the portal record from Step 1

Common mistakes:

- Using the **function ID** for both fields
- Registering an **old version ID** after `create_function.sh` or the NGC UI created a new version
- Swapping the two UUIDs in the PUT body
- Copying IDs from a teammate's org or from documentation examples

### 4. NGC org alignment

The portal backend is configured with an `nvcf_api_key` and optionally `ngc_org` (see [backend/app/settings.py](../../../backend/app/settings.py)). It only sees functions that key can list.

Verify:

- You deployed the function in the org the portal expects (dev portal commonly uses **your NGC organization** or your team's designated org)
- Your personal NGC login and the portal service account can both see the same function in the NVCF UI
- You did not deploy under a personal sandbox org while registering on a shared dev portal

If the function exists under your user but `check-streaming-app` stays `UNKNOWN` while your local `check-nvcf-function` finds it, escalate to the portal operator — the deployment's Helm `nvcf_api_key` / org settings need to match the function's org.

### 5. Portal backend health (all apps UNKNOWN)

If every app on the portal shows `UNKNOWN`:

- Portal logs may show `Failed to get NVCF functions` or missing API key
- NVCF control-plane outage or key revocation
- Not an per-app ID typo — fix portal configuration before re-publishing apps

## Fix

Apply the smallest change that matches your diagnosis. Change one variable at a time.

1. **Wrong version ID** — In NVCF Overview, copy the current **Version ID**. Update the portal app with `publish-streaming-app` (PUT same `app_id`, corrected `function_version_id`). Wait for cache TTL (~30 s) and re-run `check-streaming-app`.

2. **Wrong function ID or both IDs wrong** — Locate the correct function in NVCF. PUT updated `function_id` and `function_version_id`. If the old portal entry is obsolete, consider `remove-streaming-app` and re-register with a fresh `app_id`.

3. **Function in wrong NGC org** — Redeploy or recreate the NVCF function in the org the portal uses, then update the portal record with the new IDs.

4. **Function deleted from NVCF** — Redeploy the container, create a new function version, register the new ID pair on the portal.

5. **Portal cannot see any functions** — Portal operator fixes `nvcf_api_key` / org in deployment settings; no amount of PUT payload correction helps until the backend can list NVCF functions.

6. **Do not confuse with ERROR** — If `check-nvcf-function` shows `ERROR` or `DEPLOYING`, the linkage is correct; follow [portal-status-error.md](portal-status-error.md) or NVCF deployment guides instead of re-entering UUIDs.

## Verification

1. Run `check-nvcf-function` — control-plane status is a concrete NVCF state (`ACTIVE`, `DEPLOYING`, `ERROR`, etc.), not `UNKNOWN`.
2. Run `check-streaming-app` — **Runtime status** matches NVCF (typically `ACTIVE` or `DEGRADING` for a healthy deploy).
3. Confirm **Deployment** section is populated (cluster, GPU, min/max instances) when status is healthy.
4. Open the portal home page — app tile appears when status is `ACTIVE` or `DEGRADING`.
5. Optional: start a new streaming session to confirm end-to-end wiring (Phase C).

## Related documentation

| Resource | Relevance |
|----------|-----------|
| [STREAMING-REFERENCE.md](../STREAMING-REFERENCE.md) | Phase B checklist, symptom table for UNKNOWN vs ERROR |
| [app-not-on-home-page.md](app-not-on-home-page.md) | UNKNOWN hides the home-page tile |
| [portal-status-error.md](portal-status-error.md) | Function found but failing on NVCF (`ERROR`) |
| [app-invisible-after-register.md](app-invisible-after-register.md) | PUT succeeded, status healthy, but wrong `page` / `category` |
| `publish-streaming-app` skill | Correct `function_id` / `function_version_id` on PUT |
| [NVCF function creation](https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/function-creation.html) | Where Overview IDs come from |
| [NVCF functions UI](https://nvcf.ngc.nvidia.com/functions) | Manual ID verification |

## Agent notes

- Run **`check-streaming-app` first** to read the stored ID pair; then **`check-nvcf-function`** with those exact UUIDs. Do not substitute IDs from chat unless the user confirms them.
- **`UNKNOWN` vs `ERROR`:** `UNKNOWN` = lookup miss in NVCF control plane; `ERROR` = matched function that failed deployment. Different fixes.
- When both skills disagree (NVCF skill finds `ACTIVE`, portal shows `UNKNOWN`), suspect **portal org/API key configuration**, not user typo.
- After PUT corrections, allow **`nvcf_cache_ttl`** (default 30 s) before declaring failure.
- **`function_version_id` changes** on every new NVCF version — remind users to update the portal after redeploys.
- Never echo portal tokens, API keys, or NVCF keys in chat or command output when running the check skills.