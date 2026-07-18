# syntax=docker/dockerfile:1
# Dedicated Prometheus image pre-loaded with TP-Truck scrape config & alert rules.
FROM prom/prometheus:v2.53.0

LABEL org.opencontainers.image.title="tptruck-prometheus" \
      org.opencontainers.image.description="Metrics collection & alerting for the fleet platform"

COPY prometheus.yml /etc/prometheus/prometheus.yml
COPY rules/ /etc/prometheus/rules/

EXPOSE 9090
