---
id: max-instances-over-available
category: nvcf-deployment
symptom: "The maximum instances entered is over the available number"
status: complete
skills:
  - check-nvcf-function
docs:
  - "https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/function-creation.html"
  - "https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html"
---

# Max instances over available

## Symptom

When creating or editing an NVCF deployment in the NGC UI, the form rejects the scaling values with a message like:

> **The maximum instances entered is over the available number**

The deploy action does not proceed. You may also see this via API as HTTP **400** `INVALID_REQUEST` with text such as *No available allocations for GPU … Current max allocation: 0* (, ).

This is a **deploy-time quota check** (Phase A / NVCF deployment). It is not the same as a runtime stream timeout when all warm instances are busy — see [stream-timeout-try-again-later.md](../portal-ui/stream-timeout-try-again-later.md). It is also not the same as a pod that starts then terminates with `instance-terminated-no-capacity` — see [instance-terminated-no-capacity.md](instance-terminated-no-capacity.md).

## When you see this

| Pattern | What it suggests |
|---------|------------------|
| **First deploy to a shared dev cluster** | Org quota for that cluster + GPU shape is smaller than requested `maxInstances` |
| **Raising Max Instances on an existing deploy** | New max exceeds remaining org allocation or cluster headroom |
| **Min Instances also high** | UI may block when **min** exceeds available, not only max |
| **API says `Current max allocation: 0`** | Org has no allocation for that GPU/instance type on that cluster — not a transient full cluster |
| **Works on one cluster, fails on another** | Cluster-specific quota or capacity (another cluster in your deployment) |
| **Same settings worked last week** | Shared cluster usage by other org members consumed quota; or allocation was never provisioned for a new instance type |

Collect before diagnosing: NGC org name, target cluster, GPU and instance type, requested min/max instances, `function_id` / `function_version_id`, and whether this is first deploy or a scaling change.

## How quota relates to scaling

NVCF deployment scaling has three layers agents should keep separate:

```text
Org allocation → max GPUs your NGC org may use on a cluster + instance type
Cluster headroom → GPUs physically free right now (shared across orgs on dev clusters)
Requested min/max → what you ask NVCF to keep warm / allow to scale to
```

The NGC UI error **max instances over available** usually means the **requested max (or min) exceeds org allocation or enforced cluster quota** for that GPU shape — not that your Kit container is misbuilt.

| Field | Role |
|-------|------|
| **`minInstances`** | Pre-warmed pods; must fit within available quota |
| **`maxInstances`** | Upper bound for autoscale; cannot exceed org/cluster allowance |
| **`activeInstances`** | Currently running pods (from function API); compare after a successful deploy |

On shared Omniverse dev clusters, quota is often **shared across org users**. A teammate's deployment can reduce what remains for your function without any change to your container image.

## Diagnosis

Work through requested scaling vs deployment spec first. Use `check-nvcf-function` from frontmatter.

### 1. NVCF function and deployment — `check-nvcf-function`

Provide `function_id` and `function_version_id`. From the deployment API (Step 4 of the skill), capture:

| Check | What to look for |
|-------|------------------|
| **`minInstances` / `maxInstances`** | Values you tried to set; note which field the UI rejected |
| **`clusters[]`** | Target cluster (e.g. `<cluster-from-NVCF-deployment>`) |
| **`gpu` / `instanceType`** | Must match a shape your org is allocated on that cluster |
| **`deployment.functionStatus`** | May be empty or stale if deploy never applied |
| **`activeInstances`** | If a prior deploy partially succeeded, note current usage |
| Control-plane status | `DEPLOYING`, `ERROR`, or no deployment yet — expected when quota blocks apply |

If the deployment API returns empty `deploymentSpecifications`, the function exists but **no successful deployment spec** was saved — common when the UI blocks the submit.

Cluster names are assigned per NVCF deployment; copy the exact value from `deployment.deploymentSpecifications[].clusters[]`.

### 2. NGC UI deployment form

Open [NVCF functions](https://nvcf.ngc.nvidia.com/functions) → function → **Deployment Details**.

1. Note **Dedicated cluster**, **GPU**, and **Instance type**.
2. Try **Max Instances = 1** and **Min Instances = 0 or 1** — if that succeeds, the issue is quota magnitude, not cluster access.
3. If max **1** still fails with `Current max allocation: 0`, the org lacks allocation for that instance type on that cluster .

### 3. Distinguish from runtime capacity failures

| Signal | Issue doc |
|--------|-----------|
| UI blocks before deploy completes | **This doc** |
| Deploy succeeds; pod state `instance-terminated-no-capacity` | [instance-terminated-no-capacity.md](instance-terminated-no-capacity.md) |
| Function `ACTIVE`; portal timeout under load | [stream-timeout-try-again-later.md](../portal-ui/stream-timeout-try-again-later.md) |
| HTTP 408 on session creation | [http-408-creating-session.md](http-408-creating-session.md) |

 illustrates a related gap: the scheduler may accept a request while nodes lack free GPUs (`Insufficient nvidia.com/pgpu`), which surfaces as deploy failure or unhealthy pods rather than the UI quota message. Treat scheduling failures as cluster capacity even when the form accepts your numbers.

## Root causes

| Cause | How it happens |
|-------|----------------|
| **Org allocation too low** | NGC org not provisioned for enough GPUs of the chosen instance type on the target cluster |
| **Zero allocation** | Instance type not enabled for org on that cluster — API reports `Current max allocation: 0` (, ) |
| **Shared dev cluster contention** | Other users in the org (or platform) consume quota on shared multi-tenant clusters |
| **Max/min higher than needed** | Dev/test defaults (e.g. min 8 / max 16 from load tests) exceed personal org quota |
| **Wrong cluster or GPU shape** | L40 multi-GPU shapes on a cluster where only single-GPU Kit streaming is allocated |
| **Editing deployment upward** | Existing usage + requested increase exceeds remaining allocation |

## Fix

Apply the smallest change that matches diagnosis. Change one variable at a time.

1. **Lower Max Instances** — Set max to **1** (or the minimum you need for single-user dev) and redeploy. Lower **Min Instances** to **0** or **1** if the UI blocks on min as well.

2. **Right-size for dev** — Omniverse Kit streaming for one developer rarely needs double-digit max instances. Start with min **0–1**, max **1–2**; increase only after confirming quota via a successful deploy and `check-nvcf-function`.

3. **Try another cluster** — Redeploy to an alternate forge cluster (another cluster in your deployment) where your org has allocation. See the Kit on DGXC guide and your NVCF platform owner for current cluster allocation guidance.

4. **Zero allocation (`max allocation: 0`)** — Do not keep retrying the same cluster and instance type. Ask your NVCF platform owner to provision GPU allocation for your NGC org on that cluster, or pick an instance type that is already allocated .

5. **Shared cluster full** — Wait for other sessions/deployments in your org to scale down, or coordinate with teammates on shared clusters. Lower their max instances if old functions hold quota.

6. **After deploy succeeds, need more capacity** — Increase max gradually and redeploy. If the UI blocks again, you hit the org ceiling — request higher allocation or accept lower concurrency. Runtime saturation at the current max is covered in [stream-timeout-try-again-later.md](../portal-ui/stream-timeout-try-again-later.md).

7. **Portal still degraded after fix** — Once NVCF deploy is `ACTIVE`, refresh portal app status. Tile visibility and `DEGRADED` states tied to capacity are covered in [app-not-on-home-page.md](../portal-registration/app-not-on-home-page.md).

## Verification

1. Run `check-nvcf-function` — deployment spec shows intended **cluster**, **gpu** / **instanceType**, and **min/max** values you saved.
2. Control-plane status is **`ACTIVE`** (or `DEPLOYING` briefly, then `ACTIVE`).
3. **`activeInstances`** is ≤ **`maxInstances`** and matches expected load (often 0–1 for dev).
4. NGC UI **Deployment Details** shows the deploy without the quota error.
5. Optional: start a portal stream with a **new** session to confirm end-to-end (stream start is a separate checklist).

## Related patterns

| Resource | Relevance |
|----------|-----------|
| [STREAMING-REFERENCE.md](../STREAMING-REFERENCE.md) | NVCF deployment; Phase A checklist |
| [instance-terminated-no-capacity.md](instance-terminated-no-capacity.md) | Pod terminated at runtime for capacity |
| [stream-timeout-try-again-later.md](../portal-ui/stream-timeout-try-again-later.md) | Portal timeout when instances saturated |
| [http-408-creating-session.md](http-408-creating-session.md) | Session creation timeout (post-deploy) |
| [NVCF function creation](https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/function-creation.html) | Deployment and scaling fields |
| [NVCF debuggability](https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html) | Logs after deploy succeeds |

## Agent notes

- This skill needs **`check-nvcf-function` only** — portal app linkage is optional unless verifying post-fix stream launch.
- **`maxInstances` in the API** maps to **Max Instances** in the NGC UI and **`deployment.max_instances`** in the portal backend when populated.
- When the user wants *more* concurrent streams but the UI blocks raising max, **quota is the blocker** — do not debug Kit livestream plugins until deploy accepts the scaling values.
- When **`Current max allocation: 0`** appears in API errors, escalation is **org/cluster allocation**, not container rebuild.
- Distinguish **UI quota rejection** (this doc) from **`activeInstances` ≈ `maxInstances`** at runtime (increase max only if UI allows it).
- Never echo NVCF API keys when running check skills.