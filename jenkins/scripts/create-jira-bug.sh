#!/usr/bin/env bash
# Create a Jira Bug when CI/CD or SonarQube fails.
set -euo pipefail

SOURCE="${1:-pipeline}"
BRANCH="${2:-main}"
SHA="${3:-unknown}"

: "${JIRA_BASE_URL:?JIRA_BASE_URL required}"
: "${JIRA_EMAIL:?JIRA_EMAIL required}"
: "${JIRA_API_TOKEN:?JIRA_API_TOKEN required}"

PROJECT_KEY="${JIRA_PROJECT_KEY:-KAN}"
SUMMARY="[${SOURCE}] Pipeline failure — ${BRANCH} (${SHA:0:7})"
DESCRIPTION="h2. Automated pipeline failure

*Source:* ${SOURCE}
*Branch:* ${BRANCH}
*Commit:* ${SHA}

_Auto-created by TP-Truck CI/CD._"

curl -fsS -X POST "${JIRA_BASE_URL}/rest/api/2/issue" \
  -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg pk "$PROJECT_KEY" \
    --arg s  "$SUMMARY" \
    --arg d  "$DESCRIPTION" \
    '{
      fields: {
        project:   { key: $pk },
        issuetype: { name: "Bug" },
        summary:   $s,
        description: $d,
        labels:    ["pipeline-failure", "auto-created"],
        priority:  { name: "High" }
      }
    }')"

echo "Jira Bug created for ${SOURCE}"
