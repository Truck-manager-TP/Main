# syntax=docker/dockerfile:1
# Grafana alert webhook -> Jira REST API bridge for SonarQube incidents.
FROM docker.io/library/python:3.12-slim

LABEL org.opencontainers.image.title="tptruck-jira-bridge" \
      org.opencontainers.image.description="Observability alerts to Jira Bug automation"

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY bridge.py .

EXPOSE 8090
CMD ["python", "bridge.py"]
