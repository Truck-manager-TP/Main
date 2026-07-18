# syntax=docker/dockerfile:1
# Dedicated PostgreSQL image for the TP-Truck platform datastore.
FROM postgres:16-alpine

LABEL org.opencontainers.image.title="tptruck-postgres" \
      org.opencontainers.image.description="Primary datastore for the fleet platform"

# Bootstrap SQL executed only on first initialisation of an empty data dir.
# (Flyway owns the schema; this only creates the app role/db and extensions.)
COPY init/ /docker-entrypoint-initdb.d/

HEALTHCHECK --interval=10s --timeout=5s --retries=10 \
    CMD pg_isready -U "${POSTGRES_USER:-tptruck}" -d "${POSTGRES_DB:-tptruck}" || exit 1
