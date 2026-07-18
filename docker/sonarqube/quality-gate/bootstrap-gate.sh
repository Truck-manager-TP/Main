#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Creates/updates the "TP-Truck Gate" in SonarQube via the Web API so the gate
# is version-controlled and reproducible instead of manually configured.
# Usage: SONAR_URL=http://sonarqube:9000 SONAR_TOKEN=xxx ./bootstrap-gate.sh
# ---------------------------------------------------------------------------
set -euo pipefail

SONAR_URL="${SONAR_URL:-http://sonarqube:9000}"
SONAR_TOKEN="${SONAR_TOKEN:?SONAR_TOKEN is required}"
GATE_NAME="TP-Truck Gate"
AUTH=(-u "${SONAR_TOKEN}:")

echo ">> Creating gate '${GATE_NAME}' (ignore error if it already exists)"
curl -sf "${AUTH[@]}" -X POST "${SONAR_URL}/api/qualitygates/create" \
  --data-urlencode "name=${GATE_NAME}" || true

add_condition () {
  local metric="$1" op="$2" err="$3"
  echo ">> condition: ${metric} ${op} ${err}"
  curl -sf "${AUTH[@]}" -X POST "${SONAR_URL}/api/qualitygates/create_condition" \
    --data-urlencode "gateName=${GATE_NAME}" \
    --data-urlencode "metric=${metric}" \
    --data-urlencode "op=${op}" \
    --data-urlencode "error=${err}" || true
}

# Gate on NEW code (clean-as-you-code): blocks the Digital.ai release if breached.
add_condition "new_coverage"                 "LT" "80"
add_condition "new_duplicated_lines_density" "GT" "3"
add_condition "new_violations"               "GT" "0"
add_condition "new_security_hotspots_reviewed" "LT" "100"
add_condition "new_reliability_rating"       "GT" "1"
add_condition "new_security_rating"          "GT" "1"
add_condition "new_maintainability_rating"   "GT" "1"

echo ">> Setting '${GATE_NAME}' as default"
curl -sf "${AUTH[@]}" -X POST "${SONAR_URL}/api/qualitygates/set_as_default" \
  --data-urlencode "name=${GATE_NAME}" || true

echo ">> Done."
