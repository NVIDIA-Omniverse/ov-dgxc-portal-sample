---
id: portal-status-error
category: portal-registration
symptom: "Portal app status ERROR"
status: complete
skills:
 - check-streaming-app
 - check-nvcf-function
docs:
  - "https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html"
---

# Portal status ERROR

## Symptom

The portal reports **ERROR** for a published streaming application. The app tile may be hidden from the home page (only `ACTIVE` and `DEGRADING` tiles are launchable; see [app-not-on-home-page.md](app-not-on-home-page.md)). When inspecting via the portal API or admin tools, the `status` field on the app record is `ERROR`.

This is a **deploy-time / backend health** failure (Phase A in the diagnostic foundation), not a browser stream-start error. The linked NVCF function version failed to deploy or cannot pass health checks.

## When you see this

| Pattern | What it suggests |
|---------|------------------|
| **Immediately after first deploy** | Container crash, wrong image, missing streaming extensions, or health port mismatch |
| **After a new function version or image push** | Regression in container build, env vars, or NVCF function config |
| **Was ACTIVE, now ERROR** | Recent redeploy, cluster incident, or pod recycle that failed health |
| **Stuck DEPLOYING then ERROR** | Health endpoint unreachable or startup never reaches **RTX Ready** — see [deploying-over-15-minutes.md](../nvcf-deployment/deploying-over-15-minutes.md) |
| **Portal ERROR but you expected UNKNOWN** | IDs are valid and NVCF knows the function; NVCF control plane reports a real deployment failure |

Collect before diagnosing: `portal_url`, `app_id` or both NVCF UUIDs, Kit version, container image tag, whether this is first deploy or after an update, and any recent NGC UI or API changes to the function.

## How portal status is determined

The portal backend does not invent `ERROR`. It mirrors NVCF control-plane status for the registered `(function_id, function_version_id)` pair ([backend/app/nvcf.py](../../../backend/app/nvcf.py), [backend/app/models.py](../../../backend/app/models.py)):

```text
GET /api/apps/{app_id}
 → lookup function_id + function_version_id from app record
 → GET NVCF /v2/nvcf/functions (cached)
 → match entry → status field (ACTIVE, ERROR, DEPLOYING, …)
```

| Portal status | Meaning |
|---------------|---------|
| **ERROR** | NVCF deployment failed for this function version |
| **UNKNOWN** | Function/version not found in NVCF list, or portal cannot reach NVCF — see [portal-status-unknown.md](portal-status-unknown.md) |
| **DEPLOYING** | Deploy in progress (~10 min normal; >15 min suggests misconfig) |
| **DEGRADING** / **DEGRADED** | Deploy succeeded but instance pool is unhealthy or empty — different failure mode; user may see a warning tile, not full ERROR |
| **ACTIVE** | Healthy enough to launch streams |

If `check-streaming-app` shows **ERROR** and `check-nvcf-function` control-plane status is also **ERROR**, debug NVCF and the container — not portal registration wiring.

## Root causes

| Cause | How it happens |
|-------|----------------|
| **Container crash on startup** | Missing deps, bad entrypoint, GPU/RTX init failure, extension resolve errors |
| **Wrong health port or URI** | NVCF probes the wrong port; Kit never answers `/v1/streaming/ready` with HTTP 200 |
| **No RTX Ready in logs** | Kit/RTX failed before streaming readiness — scroll History logs upward for the first error |
| **Missing livestream extensions** | Container built without `[nvcf_streaming]` / `[ovc_streaming]` layer or required plugins |
| **Wrong function type or inference** | Not `STREAMING` / LLS off / wrong inference — often blocks ACTIVE; may surface as deploy failure combined with health |
| **Cluster capacity** | `instance-terminated-no-capacity` — pod cannot be placed |
| **Platform-incompatible extensions** | WebRTC stack on unsupported arch (e.g. DGX Spark) |
| **Bad container image** | Wrong tag, stale `latest`, or image from different org/registry |
| **Environment misconfiguration** | Missing Nucleus vars, wrong `NVDA_KIT_ARGS`, custom health env |

## Diagnosis

Work in order: confirm portal linkage, inspect NVCF config, then read History logs. Use the skills listed in frontmatter.

### 1. Portal app record — `check-streaming-app`

Provide `portal_url` and either `app_id` or both NVCF IDs.

Confirm:

- **Runtime status** is `ERROR` (not `UNKNOWN` — if `UNKNOWN`, fix IDs/org first per [portal-status-unknown.md](portal-status-unknown.md))
- **`function_id`** and **`function_version_id`** match the NVCF function you will inspect in the NGC UI Overview tab
- Portal and NVCF deployment use the **same NGC org**
- **`deployment`** block (from full `GET /api/apps/{app_id}`): cluster, GPU, min/max instances — note cluster for log correlation

If the user only knows the app title, list apps or search by function IDs via the skill workflow.

### 2. NVCF function configuration — `check-nvcf-function`

Provide `function_id` and `function_version_id`. The report must include control-plane **runtime status**, container image, health, inference, and deployment spec.

| Check | Expected for Kit streaming |
|-------|---------------------------|
| Control-plane status | **ERROR** (confirms NVCF-side failure) |
| Function type | `STREAMING` with Low Latency Streaming |
| Inference | Port **49100**, path **`/sign_in`**, `apiBodyFormat` **CUSTOM** |
| Health | URI **`/v1/streaming/ready`**, HTTP **200** expected |
| Health port | **8011** (Kit ≥107.3.3, all templates); **8111** (USD Composer ≤107.3.2); **8311** (USD Explorer ≤107.3.2) |
| Container image | Matches the image you intended to deploy (not an old tag) |
| Cluster / scaling | Cluster matches capacity expectations; min instances achievable |

Call out any mismatch between health port in NVCF and what Kit actually exposes (`CONTROL_SERVER_PORT` in build scripts). Wrong health is the most common reason deploy never reaches **ACTIVE** and may end in **ERROR** after timeout.

Reference defaults: [scripts/create_function.sh](../../../scripts/create_function.sh) (`49100`, `/sign_in`, `/v1/streaming/ready`, port often `8111` or `8011` depending on template).

### 3. NVCF logs — History (primary for ERROR)

Open [NVCF functions](https://nvcf.ngc.nvidia.com/functions) → function → version → **Logs** → **History**.

Per [NVCF debuggability](https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html): use **History** for failed deploys and startup crashes; use **Live Tail** only after you have a running instance (e.g. intermittent issues after ACTIVE).

| Log signal | Interpretation | Next step |
|------------|----------------|-----------|
| No **RTX Ready** | Kit/GPU/RTX did not initialize | Scroll up for crash, OOM, shader, or extension errors |
| **RTX Ready** then health failures | NVCF cannot reach health endpoint | Fix health port/URI in function config; verify livestream service extensions |
| Search **`livestream`** | Plugin load lines | Compare versions to foundation minimums; see [missing-livestream-extensions.md](../build-package/missing-livestream-extensions.md) |
| **`instance-terminated-no-capacity`** | Cluster full or unhealthy | Redeploy to another cluster — [instance-terminated-no-capacity.md](../nvcf-deployment/instance-terminated-no-capacity.md) |
| **`platform incompatible`** / resolve errors | Wrong platform build | [platform-incompatible-extensions.md](../build-package/platform-incompatible-extensions.md) |
| Python/traceback or Kit fatal | Application bug in container | Fix app code or env; rebuild image |

**Health interpretation** (from foundation):

| Log signal | Meaning |
|------------|---------|
| No **RTX Ready** | Fix startup/RTX first — health checks are irrelevant until Kit runs |
| **RTX Ready** but status not ACTIVE | Health/signaling path wrong, or NVCF gating delay |

### 4. Rule out registration vs runtime

| Observation | Conclusion |
|-------------|------------|
| Portal **ERROR**, NVCF UI **ERROR**, History shows crash | Container or NVCF config — follow sections above |
| Portal **ERROR**, NVCF UI **ACTIVE** | Rare cache lag or portal/NVCF key org mismatch; re-run checks after a few minutes; verify portal backend `nvcf_api_key` org |
| Portal **UNKNOWN**, NVCF function exists | Wrong `function_version_id` or org — not this doc |
| Portal **DEPLOYING** >15 min | See [deploying-over-15-minutes.md](../nvcf-deployment/deploying-over-15-minutes.md) before it flips to ERROR |

## Fix

Apply the smallest change that matches log evidence. Change one variable at a time.

1. **Health port / URI** — Update function version (or recreate) so health matches Kit: HTTP, `/v1/streaming/ready`, correct port for template and Kit version. In NGC UI, fill **Health before Inference** ([inference-wrong-after-ui-form.md](../nvcf-deployment/inference-wrong-after-ui-form.md)).

2. **Container / extensions** — Rebuild with correct streaming layer (`[nvcf_streaming]` for 108+, `[ovc_streaming]` for 107.x) and livestream dependencies; push new image; deploy new function version; update portal `function_version_id` if the version UUID changed.

3. **Function type / inference** — Ensure `functionType: STREAMING`, LLS enabled, inference **49100** + **`/sign_in`**, `apiBodyFormat: CUSTOM`. A non-streaming function may fail differently (501 at session start) but wrong inference can contribute to overall deploy health failures.

4. **Cluster capacity** — Pick another cluster in deployment spec, or lower min instances / instance type; redeploy until **ACTIVE**.

5. **Environment** — Add required vars (`NVDA_KIT_NUCLEUS`, `OMNI_JWT_ENABLED`, Kit args for portal resume timeout per [STREAMING-REFERENCE.md](../STREAMING-REFERENCE.md)). For custom apps, verify custom health env.

6. **Kit version regression** — Kit 109+ issues on OVC: compare with known-good 107.3.4 config .

After any fix, wait for deploy (~10 minutes), confirm NVCF UI shows **ACTIVE**, then confirm portal status via `check-streaming-app`.

## Verification

1. **`check-nvcf-function`** — control-plane status **ACTIVE**; health and inference match the expected table; container image is the fixed tag.
2. **`check-streaming-app`** — portal runtime status **ACTIVE** or **DEGRADING** (not ERROR); same function IDs as NVCF Overview.
3. **History logs** — **RTX Ready** present on latest deploy; no recurring crash loop.
4. **Launch test** — start a **new** streaming session from the portal tile; stream-start errors (501, No peer info, 408) are separate docs once status is ACTIVE.
5. **Home page** — app tile visible and clickable if status is ACTIVE/DEGRADING ([app-not-on-home-page.md](app-not-on-home-page.md)).

## Distinguish from similar statuses

| Symptom | Layer | Typical cause | Doc |
|---------|-------|---------------|-----|
| Portal **ERROR** | NVCF deploy / health | Container crash, wrong health, missing plugins | This doc |
| Portal **UNKNOWN** | Portal ↔ NVCF linkage | Wrong IDs or org | [portal-status-unknown.md](portal-status-unknown.md) |
| **DEPLOYING** >15 min | NVCF health / startup | Wrong port, no RTX Ready | [deploying-over-15-minutes.md](../nvcf-deployment/deploying-over-15-minutes.md) |
| **DEGRADED** tile (warning) | Instance pool | No ready instances; deploy succeeded | Capacity / min instances |
| **HTTP501** on session click | LLS config | Not STREAMING — function may still show ACTIVE | [http-501-streaming-session.md](../portal-ui/http-501-streaming-session.md) |
| **No peer info found** | Stream start / WebRTC | ACTIVE function, bad runtime peer path | [no-peer-info-found.md](../portal-ui/no-peer-info-found.md) |

## Related patterns

| Resource | Relevance |
|----------|-----------|
| [NVCF debuggability](https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html) | History vs Live Tail, operational logging |
| [STREAMING-REFERENCE.md](../STREAMING-REFERENCE.md) | Phase A checklist, health port matrix, plugin versions |
| [missing-livestream-extensions.md](../build-package/missing-livestream-extensions.md) | Build-time extension gaps |
| [forgot-nvcf-streaming-layer.md](../build-package/forgot-nvcf-streaming-layer.md) | Missing `[nvcf_streaming]` layer at template time |

## Agent notes

- Run **`check-streaming-app`** first when the user has a portal URL — resolve NVCF IDs from the app record; do not guess UUIDs.
- **`ERROR` means NVCF deployment failed** — prioritize History logs and health/config over WebRTC or browser symptoms.
- Always run **`check-nvcf-function`** after the portal check to confirm control-plane **ERROR** and capture health port, image, and cluster in one report.
- Distinguish **ERROR** from **UNKNOWN** before deep log diving; UNKNOWN is almost always ID/org mismatch, not container crash.
- Search History for **`RTX Ready`** and **`livestream`** before suggesting a full rebuild.
- If health port is wrong but logs show **RTX Ready**, fix NVCF function config only — no image rebuild required.
- Do not echo API keys or portal tokens when running check skills.
- After fixing NVCF, portal status updates on next API read (cached TTL on backend — if status lags, wait one cache cycle or verify directly in NVCF UI).