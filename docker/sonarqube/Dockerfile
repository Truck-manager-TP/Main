# syntax=docker/dockerfile:1
# Dedicated SonarQube image (Community) for static analysis & quality gates.
FROM docker.io/library/sonarqube:10.5-community

LABEL org.opencontainers.image.title="tptruck-sonarqube" \
      org.opencontainers.image.description="Static code analysis & quality gate enforcement"

# Ship the "TP-Truck Gate" definition so the gate is reproducible via the API
# bootstrap script rather than clicked in by hand (reduces human error).
COPY quality-gate/ /opt/sonarqube/tptruck/

# SonarQube requires an elevated mmap count on the host:
#   sysctl -w vm.max_map_count=524288
EXPOSE 9000
