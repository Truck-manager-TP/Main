#!/usr/bin/env bash
# Trigger Argo CD sync for a named Application.
set -euo pipefail

APP="${1:?Argo CD application name required}"

curl -fsS -X POST "${ARGOCD_SERVER}/api/v1/applications/${APP}/sync" \
  -H "Authorization: Bearer ${ARGOCD_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"prune":true,"dryRun":false}'

echo "Argo CD sync triggered for ${APP}"
