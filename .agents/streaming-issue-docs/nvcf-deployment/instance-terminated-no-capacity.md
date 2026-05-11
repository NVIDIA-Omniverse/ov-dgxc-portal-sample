---
id: instance-terminated-no-capacity
category: nvcf-deployment
symptom: "pod terminated due to state instance-terminated-no-capacity"
status: complete
skills:
  - check-nvcf-function
  - check-streaming-app
docs:
  - "https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html"
---

# instance-terminated-no-capacity

## Symptom

NVCF **History** or deploy logs show a pod lifecycle failure with a termination reason similar to:

> **pod terminated due to state instance-terminated-no-capacity**

NVCF could not place or keep the instance on the selected cluster. The scheduler rejected the pod because the target cluster lacks available GPU quota for the requested instance type, or the cluster is temporarily unhealthy.

Downstream effects depend on timing:

| Surface | What the user sees |
|---------|-------------------|
| **During initial deploy** | Function stuck **DEPLOYING**, then **ERROR**; no **RTX Ready** in History |
| **Portal app status** | **ERROR** or **DEGRADED** when min instances cannot be satisfied |
| **Stream start** | HTTP **408**, WebSocket timeout (*try again later*), or failed session when scale-up cannot allocate pods |
| **NVCF UI** | Zero or fewer than `minInstances` active instances; repeated pod recycle in History |

This is a **cluster placement / quota** failure (Phase A — NVCF deployment), not a Kit build, health-port, or WebRTC misconfiguration. Do not chase livestream plugins until capacity is resolved.

## When you see this

| Pattern | What it suggests |
|---------|------------------|
| **First deploy to a dev cluster (e.g. a busy shared cluster)** | Shared cluster quota exhausted for your GPU / instance type |
| **Deploy worked yesterday, fails today on same cluster** | Cluster incident, maintenance, or org-wide quota consumption |
| **Fails only when `minInstances` > 1** | Min pool exceeds remaining quota — try min **1** first |
| **Fails after raising max instances** | New ceiling exceeds cluster capacity — see [max-instances-over-available.md](max-instances-over-available.md) for UI-time blocking |
| **Intermittent — some pods start, others terminate** | Partial capacity; autoscaler competing with other tenants on shared dev clusters |
| **Every cluster in spec fails** | Instance type (GPU SKU) not available in any listed cluster, or org quota exhausted globally |

Collect before diagnosing: `function_id`, `function_version_id`, cluster name(s) from deployment spec, GPU / `instanceType`, `minInstances` / `maxInstances`, NGC org, whether failure is first deploy or after a config change, and portal `app_id` if registered.

## Distinguish from similar capacity errors

| Symptom | When it appears | Layer |
|---------|-----------------|-------|
| **`instance-terminated-no-capacity`** (this doc) | Pod scheduled or attempted, then terminated — in **History** logs | Runtime placement on cluster |
| **Max instances over available** | NGC UI **blocks** deploy before submission | Deploy-time quota check — [max-instances-over-available.md](max-instances-over-available.md) |
| **HTTP 408 creating session** | User clicks app; portal times out waiting for instance | Stream start — often saturation or slow scale-up — [http-408-creating-session.md](http-408-creating-session.md) |
| **Stream timeout — try again later** | WebSocket closes during handshake | May follow capacity failure under load — [stream-timeout-try-again-later.md](../portal-ui/stream-timeout-try-again-later.md) |
| **DEPLOYING >15 min, no capacity string** | Health misconfig or container crash | [deploying-over-15-minutes.md](deploying-over-15-minutes.md) |
| **Portal ERROR, logs show crash / no RTX Ready** | Container failed after placement | [portal-status-error.md](../portal-registration/portal-status-error.md) |

If History shows **RTX Ready** on some instances but others terminate with `instance-terminated-no-capacity`, the image and health config are likely fine — focus on cluster and scaling only.

## Root causes

| Cause | How it happens |
|-------|----------------|
| **Cluster GPU quota full** | Shared dev clusters (e.g. a busy shared cluster) serve many orgs; no free nodes for your `instanceType` |
| **Cluster unhealthy** | Platform incident — scheduler cannot place pods even if nominal quota exists |
| **`minInstances` too high** | NVCF tries to warm N pods at deploy; any pod that cannot land terminates with this state |
| **Wrong cluster for instance type** | GPU SKU not offered on selected cluster |
| **Org quota exhausted** | NGC org-level limits across clusters |
| **Recent scale-up under load** | Autoscaler requests new pods when cluster has no headroom |

## Diagnosis

Work in order: confirm NVCF deployment spec, read History for the termination reason, then adjust cluster or scaling. Use the skills listed in frontmatter.

### 1. Portal linkage (optional) — `check-streaming-app`

When the user has a portal URL or `app_id`, run this first to resolve NVCF IDs and note portal status.

Confirm:

- **`function_id`** and **`function_version_id`** match NVCF Overview
- Portal runtime status **ERROR**, **DEGRADED**, or stuck **DEPLOYING** (capacity failures often surface here)
- **`deployment.cluster`**, **`minInstances`**, **`maxInstances`** — record for comparison with `check-nvcf-function`

If `deployment` is null, proceed with NVCF IDs the user provides.

### 2. NVCF deployment spec — `check-nvcf-function`

Provide `function_id` and `function_version_id`. The report must include control-plane status and deployment fields from Step 4 of the skill.

| Check | What to look for |
|-------|------------------|
| Control-plane status | **ERROR**, **DEPLOYING**, or **DEGRADED** — not stable **ACTIVE** with expected instance count |
| **`clusters[]`** | Which cluster(s) deployment targets — note exact name (e.g. `<cluster-from-deployment-spec>`) |
| **GPU / `instanceType`** | SKU must exist on chosen cluster |
| **`minInstances` / `maxInstances`** | High min on a saturated cluster triggers immediate placement failure |
| **`activeInstances`** | Below `minInstances` or zero while status is not ACTIVE |
| Container / health / inference | Document for context only — wrong health does **not** produce `instance-terminated-no-capacity` |

Example interpretation:

```text
Status: ERROR
Cluster: <cluster-from-deployment-spec>
minInstances: 4, maxInstances: 8, activeInstances: 0
→ Likely cannot place 4 warm pods; lower min or change cluster
```

Cross-check the NGC UI: [NVCF functions](https://nvcf.ngc.nvidia.com/functions) → function → version → **Deployment** tab for cluster list and instance settings.

### 3. NVCF logs — History (primary)

Open **Logs** → **History** for the function version ([NVCF debuggability](https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html)).

| Log signal | Interpretation |
|------------|----------------|
| **`instance-terminated-no-capacity`** | Confirms this doc — placement/quota, not Kit crash |
| Pod starts, **no RTX Ready**, then termination with capacity state | Never got a healthy instance — cluster could not retain the pod |
| **RTX Ready** on other instance IDs in same deploy | Partial success — reduce min or move overflow to another cluster |
| Repeated terminate / recreate loop | Autoscaler or min-instance enforcement fighting empty quota |
| Crash, OOM, extension errors **without** capacity state | Different root cause — [portal-status-error.md](../portal-registration/portal-status-error.md) |

Search History for the exact string `instance-terminated-no-capacity` and note the **cluster** and **instance ID** on the failing lines.

Live Tail is useful only after at least one instance is running; for deploy-time failures, History is authoritative.

### 4. Capacity sanity checks

- Compare your **`minInstances`** to what the cluster can absorb — on shared dev clusters, start with **1**.
- Ask whether other functions in the same org recently increased max instances on the same cluster.
- If multiple clusters are listed in `clusters[]`, NVCF may try alternatives — if all fail, every listed cluster lacks quota for your SKU.
- Capacity updates: contact your NVCF platform owner or the owner of the target cluster/region.

## Fix

Apply the smallest change that matches log evidence. Change **one variable at a time** (cluster **or** min instances **or** instance type — not all at once).

1. **Switch cluster** — Edit deployment spec in NGC UI (or redeploy via API/script) to a cluster with known headroom. Common dev alternates: **another entitled cluster** (names vary by environment — use clusters your org is entitled to).

2. **Lower `minInstances`** — Set to **1**, redeploy, confirm **ACTIVE**, then raise min only if quota allows ( discusses min-pool vs concurrent load).

3. **Lower `maxInstances`** — If deploy UI allowed a max that cluster cannot sustain at scale-up time, reduce max to fit shared quota ([max-instances-over-available.md](max-instances-over-available.md)).

4. **Change GPU / instance type** — Pick a SKU with availability on the target cluster (requires new deployment spec and redeploy).

5. **Wait and retry** — Transient cluster incidents may clear; retry deploy after your NVCF or cluster owner confirms the incident is cleared.

6. **Update portal** — If you created a **new function version** UUID after redeploy, update `function_version_id` via portal API or `publish-streaming-app` skill.

Do **not** rebuild the container image or change health ports for a pure capacity error — that wastes time unless History also shows missing **RTX Ready** or extension failures.

## Verification

1. **`check-nvcf-function`** — control-plane status **ACTIVE**; `activeInstances` ≥ `minInstances` (or at least 1 if min is 1); cluster matches your chosen target.
2. **`check-streaming-app`** (if registered) — portal status **ACTIVE** or **DEGRADING**, not **ERROR**; deployment cluster and scaling reflect the redeploy.
3. **History logs** — new deploy shows **RTX Ready** on placed instances; no new `instance-terminated-no-capacity` lines.
4. **Launch test** — start a **new** streaming session from the portal; session creation should not return HTTP 408 solely from missing pods.
5. **Scale test** (optional) — if you raised min/max, open concurrent sessions up to expected peak and confirm no recurrence in History.

## Related patterns

| Resource | Relevance |
|----------|-----------|
| [STREAMING-REFERENCE.md](../STREAMING-REFERENCE.md) | NVCF deployment; Phase A checklist |
| [max-instances-over-available.md](max-instances-over-available.md) | UI blocks when max exceeds quota at configure time |
| [http-408-creating-session.md](http-408-creating-session.md) | HTTP 408 when session create waits on NVCF |
| [stream-timeout-try-again-later.md](../portal-ui/stream-timeout-try-again-later.md) | Portal WebSocket timeout under saturation |
| [portal-status-error.md](../portal-registration/portal-status-error.md) | Portal ERROR when deploy fails (includes capacity row) |
| [deploying-over-15-minutes.md](deploying-over-15-minutes.md) | Stuck DEPLOYING without capacity termination |
| [NVCF debuggability](https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html) | History vs Live Tail |

## Agent notes

- Run **`check-nvcf-function`** early — `clusters[]`, GPU, and min/max from the deployment API are the fastest signal.
- Use **`check-streaming-app`** first when the user has a portal URL to resolve IDs and see portal-side status.
- Search History for the exact string **`instance-terminated-no-capacity`** before suggesting image or health fixes.
- Distinguish this from **[max-instances-over-available.md](max-instances-over-available.md)**: UI validation error at form submit vs pod termination in logs.
- Default remediation order: **lower min to 1** → **switch cluster** → **lower max** → **change instance type** → escalate.
- Do not echo API keys when running check skills.