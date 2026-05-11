# Streaming reference (Kit / NVCF / portal)

Shared facts for the [issue documentation fleet](README.md). Use per-issue guides for diagnosis and fixes.

## Diagnostic phases

| Phase | When | Fleet folder |
|-------|------|----------------|
| A — Build / package | `repo.sh build`, `package_container`, Docker push | [build-package/](build-package/) |
| B — NVCF deploy | Function DEPLOYING, capacity, NGC UI ports | [nvcf-deployment/](nvcf-deployment/) |
| C — Portal registration | App missing, UNKNOWN/ERROR, PUT 401/403 | [portal-registration/](portal-registration/) |
| D — Stream start | Click app; browser errors | [portal-ui/](portal-ui/) |

Triage workflow: [diagnose-streaming-issues SKILL](../skills/diagnose-streaming-issues/SKILL.md).

## NVCF streaming function (expected)

| Setting | Value |
|---------|--------|
| `functionType` | `STREAMING` |
| Low Latency Streaming | enabled |
| Health URI | `/v1/streaming/ready` |
| Health port | **8011** (Kit ≥107.3.3 all templates); 8111/8311/8011 for older Composer/Explorer — see [deploying-over-15-minutes.md](nvcf-deployment/deploying-over-15-minutes.md) |
| Inference port | **49100** |
| Inference URL | `/sign_in` |
| `maxRequestConcurrency` | **1** |

## Kit version → streaming build

| Kit | Template layer | Packaged kit file |
|-----|----------------|-------------------|
| 108+ | `[nvcf_streaming]` | `*_nvcf.kit` |
| 107.x | `[ovc_streaming]` | `*_ovc.kit` |
| 106.x | `omni.services.livestream.nvcf` in `_ovc.kit` deps | `*_ovc.kit` |

## Minimum livestream plugins (verify in NVCF logs: search `livestream`)

| Kit | Extensions (minimum versions in logs) |
|-----|----------------------------------------|
| 106.x / 107.x | `omni.services.livestream.nvcf` ≥7.2.0; `omni.kit.livestream.webrtc` ≥7.0.0; `omni.kit.livestream.core` ≥7.5.1 |
| 108.x | `omni.services.livestream.session` ≥8.0.2; `omni.kit.livestream.webrtc` ≥8.0.7; `omni.kit.livestream.core` ≥8.0.2; `omni.kit.livestream.app` ≥8.0.4 |

## NVDA_KIT_ARGS (portal)

| Kit | Resume timeout arg |
|-----|-------------------|
| 106.x / 107.x | `--/app/livestream/nvcf/sessionResumeTimeoutSeconds=300` |
| 108+ | `--/exts/omni.services.livestream.session/resumeTimeoutSeconds=300` |

Nucleus (when required): `NVDA_KIT_NUCLEUS`, `OMNI_JWT_ENABLED=1` — see [nucleus-auth/](nucleus-auth/).

## Health logs

| Signal | Meaning |
|--------|---------|
| No **RTX Ready** | Kit/RTX failed to start — scroll up for crash |
| **RTX Ready** but NVCF not ACTIVE | Health/signaling misconfiguration |
| **RTX Ready** but slow first stream | Scale `minInstances`; NVCF gating beyond Kit ready |

## Client errors

See [OV-WEB-RTC-ERROR-CODES.md](OV-WEB-RTC-ERROR-CODES.md).

## External docs

- [NVCF debuggability](https://docs.nvidia.com/cloud-functions/user-guide/latest/cloud-function/debuggability.html)
- [OV on DGXC](https://docs.omniverse.nvidia.com/omniverse-dgxc/latest/index.html)
