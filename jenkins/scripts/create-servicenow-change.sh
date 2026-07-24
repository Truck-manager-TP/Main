#!/usr/bin/env bash
# Open a ServiceNow Change Request for UAT/PROD promotion.
set -euo pipefail

ENV="${1:?env required}"
VERSION="${2:?version required}"
IMAGE_TAG="${3:?image tag required}"

: "${SERVICENOW_INSTANCE:?SERVICENOW_INSTANCE required}"
: "${SERVICENOW_USER:?SERVICENOW_USER required}"
: "${SERVICENOW_PASSWORD:?SERVICENOW_PASSWORD required}"

SHORT="Promote TP-Truck ${VERSION} to ${ENV^^}"
BODY="Deploy image ghcr.io/truck-manager-tp/truck-fleet:${IMAGE_TAG} via Argo CD overlay k8s/overlays/${ENV}"

RESP=$(curl -fsS -X POST \
  "https://${SERVICENOW_INSTANCE}/api/now/table/change_request" \
  -u "${SERVICENOW_USER}:${SERVICENOW_PASSWORD}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg s "$SHORT" \
    --arg d "$BODY" \
    --arg e "$ENV" \
    '{
      short_description: $s,
      description: $d,
      category: "Software",
      u_environment: $e,
      assignment_group: "Platform DevOps"
    }')")

echo "$RESP" | jq -r '.result.number // "CHG-UNKNOWN"'
