# syntax=docker/dockerfile:1
# Dedicated Flyway image used to run DB migrations as a discrete pipeline step
# (also runnable as an init/job in each environment before the app rolls out).
FROM flyway/flyway:10.15-alpine

LABEL org.opencontainers.image.title="tptruck-flyway" \
      org.opencontainers.image.description="Versioned database migrations"

# Bake the migration scripts into the image so the exact SQL that passed UAT is
# the SQL promoted to PROD (immutable, auditable artifact).
COPY sql/ /flyway/sql/
COPY conf/flyway.conf /flyway/conf/flyway.conf

# Default action: apply outstanding migrations. Override with 'info'/'validate'.
CMD ["migrate"]
