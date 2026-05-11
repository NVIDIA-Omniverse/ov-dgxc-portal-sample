---
id: app-invisible-after-register
category: portal-registration
symptom: "201/200 from PUT but app not visible in UI"
status: complete
skills:
 - check-streaming-app
 - publish-streaming-app
---

# App invisible after successful register

## Symptom

`PUT /api/apps/{app_id}` returns **201 Created** or **200 OK**, but the application does not appear on the portal home page where the user expects it.

Registration succeeded — the record exists in the portal backend — yet no tile shows in the sidebar layout. The user may report "I published the app but I can't find it."

## When you see this

This symptom appears at **portal registration / visibility** (Phase B in the diagnostic foundation), after a successful publish call and before or during the first attempt to launch from the home page.

| Pattern | What it suggests |
|---------|------------------|
| **PUT succeeded; home page empty or missing tile** | NVCF status filtered out (`UNKNOWN`, `ERROR`, `DEPLOYING`, `INACTIVE`) — see [app-not-on-home-page.md](app-not-on-home-page.md) |
| **PUT succeeded; app on a different sidebar tab** | Wrong or unexpected `page` value; user is on the default first page |
| **PUT succeeded; direct link works** | Metadata placement issue only — app exists and is reachable at `{portal_url}/app/{app_id}` |
| **Typo in page name** | New orphan sidebar entry (e.g. `Template Application` vs `Template Applications`) that is easy to miss |
| **Empty `page` or `category`** | App may not group correctly; empty `page` is excluded from page discovery |

Collect before diagnosing: `portal_url`, returned `app_id` from the PUT, `function_id` / `function_version_id`, which sidebar page the user checked, and whether `{portal_url}/app/{app_id}` loads.

## Diagnosis

Work through portal record verification first, then metadata placement, then NVCF status. Use the skills listed in frontmatter.

### 1. Confirm the app exists — `check-streaming-app`

Provide `portal_url` and either `app_id` or both NVCF IDs.

From the **Portal placement** section of the report, capture:

| Field | Role in UI |
|-------|------------|
| **Page** | Sidebar tab on the home page; apps are grouped under this exact string |
| **Category** | Section header within a page; does not hide the app, but empty category shows tiles without a header |
| **Product area** | Subtitle on the application card (e.g. `Omniverse`) |
| **Title** | Card title; multiple versions with the same title merge into one card |

Also note **Runtime status** from the same report. The home page only renders apps whose status is `ACTIVE`, `DEGRADED`, or `DEGRADING`. If status is `UNKNOWN`, `ERROR`, `DEPLOYING`, or `INACTIVE`, the app is registered but filtered out — that is a different root cause; follow [app-not-on-home-page.md](app-not-on-home-page.md) or [portal-status-unknown.md](portal-status-unknown.md).

If `GET /api/apps/{app_id}` returns **404**, the PUT did not persist or the wrong `app_id` was used — re-run `publish-streaming-app` rather than chasing UI placement.

### 2. Compare metadata against portal conventions — `publish-streaming-app`

The publish skill defines every field sent in the PUT body. Placement fields must match how this portal instance organizes its sidebar.

| Field | Required | UI effect |
|-------|----------|-----------|
| `page` | yes | Sidebar page name; case-sensitive; must match an existing page name or a name your team uses consistently |
| `category` | yes | Groups tiles within the page; shown as a section title when non-empty |
| `product_area` | yes | Gray subtitle above the app title on the card |
| `title` | yes | Main card label |
| `version` | yes | Version label; with `title` forms `app_id` as `{slug}:{version}` |
| `icon` | optional | Card image; placeholder used if omitted |

Reference values on the dev portal (from [backend/README.md](../../../backend/README.md)):

```json
{
 "page": "Template Applications",
 "category": "Template Applications",
 "product_area": "Omniverse"
}
```

Common mismatches:

- `page`: `Templates` vs `Template Applications`; trailing spaces; different casing
- `category`: arbitrary string — wrong value does not hide the app, but confuses users searching by section name
- `product_area`: cosmetic only; does not affect visibility

The frontend builds the sidebar from apps returned by `GET /apps/` after status filtering, keyed by each app's `page` field. It does **not** require the page to be pre-registered in `PUT /pages/`, but admins can set page order via `PUT /pages/` with `{"name": "...", "order": N}`.

### 3. Walk the sidebar and direct URL

1. Open the portal home page and click **every** sidebar page under **Pages** — the default selection is the first page in sort order, not necessarily where the new app was placed.
2. Append `?page={exact-page-name}` to the home URL (URL-encode spaces) to jump directly to the page reported by `check-streaming-app`.
3. Open `{portal_url}/app/{app_id}` (URL-encode `app_id` if it contains special characters). If this loads app info while the home tile is missing, the record and NVCF linkage are fine; only home-page filtering or `page` placement is wrong.

### 4. Rule out status-based filtering

If `check-streaming-app` shows `UNKNOWN` or `ERROR`, fix NVCF linkage or deployment first. If status is `DEPLOYING`, wait for `ACTIVE` or check [deploying-over-15-minutes.md](../nvcf-deployment/deploying-over-15-minutes.md).

Only when status is `ACTIVE`, `DEGRADED`, or `DEGRADING` and the app still does not appear on the expected page should you treat this as a metadata placement issue.

## Fix

Apply the smallest change that matches your diagnosis. Change one variable at a time.

1. **Wrong `page` (most common)** — Re-run `publish-streaming-app` with the same `function_id`, `function_version_id`, and `title`, but set `page` to the sidebar page where the app should appear. Use the exact string other visible apps on that portal use. PUT is an upsert; a `200 OK` update is expected.

2. **Wrong `category` or `product_area`** — Re-run `publish-streaming-app` with corrected values. These do not block visibility but should match team conventions.

3. **Status not visible** — Fix NVCF function until portal status is `ACTIVE` (or `DEGRADED` / `DEGRADING`). Update the portal app if IDs changed. See related registration docs below.

4. **Page order confusion** — If the app is on a valid but low-priority page, ask a portal admin to run `PUT /pages/` to set `order` so the target page appears first, or instruct users to select the correct sidebar tab.

5. **Empty `page`** — Re-publish with a non-empty `page` value. The backend excludes empty pages from page discovery.

## Verification

1. Run `check-streaming-app` — confirm **Page**, **Category**, **Product area**, and **Runtime status** (`ACTIVE`, `DEGRADED`, or `DEGRADING`).
2. Open the portal home page, select the sidebar page matching the reported **Page** value (or use `?page=...`).
3. Confirm the application tile appears under the expected **Category** section with the correct **Title** and **Product area** subtitle.
4. Open `{portal_url}/app/{app_id}` and start a session to confirm end-to-end linkage.
5. If the app should appear on the default landing page, confirm page sort order via `GET /pages/` or admin `PUT /pages/`.

## Related documentation

| Resource | Relevance |
|----------|-----------|
| [app-not-on-home-page.md](app-not-on-home-page.md) | App registered but hidden because NVCF status is not visible |
| [portal-status-unknown.md](portal-status-unknown.md) | Status `UNKNOWN` — wrong function IDs or org mismatch |
| [portal-status-error.md](portal-status-error.md) | Status `ERROR` — NVCF deployment failure |
| [publish-streaming-app SKILL](../../skills/publish-streaming-app/SKILL.md) | Full PUT workflow and metadata collection |
| [check-streaming-app SKILL](../../skills/check-streaming-app/SKILL.md) | Read portal placement and NVCF status |
| [STREAMING-REFERENCE.md](../STREAMING-REFERENCE.md) | Phase B checklist, registration symptom table |
| [backend/README.md](../../../backend/README.md) | Example PUT payload and page-order API |

## Agent notes

- A successful PUT only proves the backend stored the record. Home-page visibility additionally requires NVCF status in `ACTIVE`, `DEGRADED`, or `DEGRADING` (frontend filter in `web/src/state/Apps.ts`).
- Always run **`check-streaming-app`** after the user reports invisibility. Read **Portal placement** and **Runtime status** before suggesting a re-publish.
- **`page` is case-sensitive** and drives sidebar tabs. Ask which sidebar pages the user checked; instruct them to visit every tab or use `?page=` with the exact value from the API.
- Direct URL `{portal_url}/app/{app_id}` uses `GET /apps/{app_id}` and does not apply the home-page status filter the same way — use it to separate "registered but misplaced" from "not registered."
- To fix placement, re-run **`publish-streaming-app`** with corrected `page` / `category` / `product_area`; do not DELETE and re-create unless the user explicitly wants removal.
- Do not echo API keys or portal tokens when running check or publish skills.