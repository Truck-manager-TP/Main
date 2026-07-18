# syntax=docker/dockerfile:1
# Polls SonarQube Web API and exposes project quality metrics for Prometheus.
FROM docker.io/library/python:3.12-slim

LABEL org.opencontainers.image.title="tptruck-sonarqube-exporter" \
      org.opencontainers.image.description="SonarQube -> Prometheus metrics bridge"

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY exporter.py .

EXPOSE 8190
CMD ["python", "exporter.py"]
