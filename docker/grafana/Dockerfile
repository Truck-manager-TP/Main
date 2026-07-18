# syntax=docker/dockerfile:1
# Dedicated Grafana image with datasources & dashboards provisioned as code.
FROM grafana/grafana:11.1.0

LABEL org.opencontainers.image.title="tptruck-grafana" \
      org.opencontainers.image.description="Observability dashboards for the fleet platform"

# Provisioning-as-code: no manual clicking to wire datasources/dashboards.
COPY provisioning/ /etc/grafana/provisioning/
COPY dashboards/ /var/lib/grafana/dashboards/

ENV GF_SECURITY_ADMIN_USER=admin \
    GF_SECURITY_ADMIN_PASSWORD=admin \
    GF_USERS_ALLOW_SIGN_UP=false \
    GF_DASHBOARDS_MIN_REFRESH_INTERVAL=5s

EXPOSE 3000
