#!/bin/sh
if [ -z "$SONAR_TOKEN" ]; then echo "SONAR_TOKEN is required" >&2; exit 1; fi
SONAR_HOST_URL="${SONAR_HOST_URL:-http://host.docker.internal:9000}"
exec mvn -B clean verify sonar:sonar \
  "-Dsonar.host.url=${SONAR_HOST_URL}" \
  "-Dsonar.token=${SONAR_TOKEN}" \
  "-Dsonar.qualitygate.wait=true"
