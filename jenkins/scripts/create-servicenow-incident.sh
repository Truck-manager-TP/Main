#!/usr/bin/env bash
# Raise a ServiceNow incident on pipeline/deploy failure.
set -euo pipefail

SOURCE="${1:-jenkins-build}"
ENV="${2:-dev}"

: "${SERVICENOW_INSTANCE:?SERVICENOW_INSTANCE required}"
: "${SERVICENOW_USER:?SERVICENOW_USER required}"
: "${SERVICENOW_PASSWORD:?SERVICENOW_PASSWORD required}"

curl -fsS -X POST \
  "https://${SERVICENOW_INSTANCE}/api/now/table/incident" \
  -u "${SERVICENOW_USER}:${SERVICENOW_PASSWORD}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg s "[P2] ${SOURCE} failed on ${ENV}" \
    --arg d "Automated incident from Jenkins pipeline failure. See Jenkins build log." \
    '{
      short_description: $s,
      description: $d,
      urgency: "2",
      impact: "2",
      category: "Software",
      cmdb_ci: "tp-truck-fleet",
      assignment_group: "Platform DevOps"
    }')"

echo "ServiceNow incident created"
