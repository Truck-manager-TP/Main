# syntax=docker/dockerfile:1
# ----------------------------------------------------------------------------
# TP-Truck Fleet application image (multi-stage: Maven build -> slim JRE run)
# ----------------------------------------------------------------------------

# --- Stage 1: build & unit-test with Maven -------------------------------------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace

# Cache dependencies first for faster incremental builds.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
# Package the fat jar (tests run in the CI stage; skip here for image build speed).
RUN mvn -B -q clean package -DskipTests

# --- Stage 2: minimal runtime -------------------------------------------------
FROM eclipse-temurin:17-jre-jammy AS runtime
WORKDIR /app

# Run as an unprivileged user (reduces attack surface / satisfies security gate).
RUN groupadd --system tptruck && useradd --system --gid tptruck --home /app tptruck

COPY --from=build /workspace/target/truck-fleet.jar /app/truck-fleet.jar

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0" \
    APP_ENV=dev
EXPOSE 8080

# Container-native health check backed by the Actuator liveness probe.
HEALTHCHECK --interval=15s --timeout=3s --start-period=45s --retries=5 \
    CMD wget -qO- http://localhost:8080/actuator/health/liveness || exit 1

USER tptruck
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/truck-fleet.jar"]
