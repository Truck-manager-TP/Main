#!/usr/bin/env python3
"""Poll SonarQube Web API and expose project metrics for Prometheus."""

from __future__ import annotations

import logging
import os
import threading
import time
from typing import Any

import requests
from prometheus_client import Gauge, start_http_server

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("sonarqube-exporter")

SONAR_HOST = os.environ.get("SONAR_HOST", "http://sonarqube:9000").rstrip("/")
SONAR_TOKEN = os.environ.get("SONAR_TOKEN", "")
SONAR_PROJECT_KEY = os.environ.get("SONAR_PROJECT_KEY", "tptruck-fleet")
SCRAPE_INTERVAL = int(os.environ.get("SCRAPE_INTERVAL_SECONDS", "60"))
EXPORTER_PORT = int(os.environ.get("EXPORTER_PORT", "8190"))

quality_gate_status = Gauge(
    "sonarqube_quality_gate_status",
    "Quality gate status (1=OK, 0=ERROR)",
    ["project"],
)
bugs_total = Gauge("sonarqube_bugs_total", "Open bugs", ["project"])
vulnerabilities = Gauge("sonarqube_vulnerabilities", "Open vulnerabilities", ["project"])
code_smells = Gauge("sonarqube_code_smells", "Open code smells", ["project"])
coverage = Gauge("sonarqube_coverage", "Line coverage percentage", ["project"])
bugs_by_severity = Gauge(
    "sonarqube_bugs",
    "Open bugs by severity",
    ["project", "severity"],
)
exporter_up = Gauge("sonarqube_exporter_up", "1 if the last scrape succeeded")


def _auth() -> tuple[str, str] | None:
    if SONAR_TOKEN:
        return SONAR_TOKEN, ""
    return None


def _get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    url = f"{SONAR_HOST}{path}"
    response = requests.get(url, params=params, auth=_auth(), timeout=30)
    response.raise_for_status()
    return response.json()


def scrape() -> None:
    project = SONAR_PROJECT_KEY

    try:
        gate = _get(
            "/api/qualitygates/project_status",
            {"projectKey": project},
        )
        status = gate.get("projectStatus", {}).get("status", "NONE")
        quality_gate_status.labels(project=project).set(1 if status == "OK" else 0)

        measures = _get(
            "/api/measures/component",
            {
                "component": project,
                "metricKeys": "bugs,vulnerabilities,code_smells,coverage",
            },
        ).get("component", {}).get("measures", [])

        metric_map = {item["metric"]: item.get("value", "0") for item in measures}
        bugs_total.labels(project=project).set(float(metric_map.get("bugs", 0)))
        vulnerabilities.labels(project=project).set(float(metric_map.get("vulnerabilities", 0)))
        code_smells.labels(project=project).set(float(metric_map.get("code_smells", 0)))
        coverage.labels(project=project).set(float(metric_map.get("coverage", 0)))

        critical = _get(
            "/api/issues/search",
            {
                "projectKeys": project,
                "types": "BUG",
                "severities": "CRITICAL",
                "resolved": "false",
                "ps": 1,
            },
        )
        bugs_by_severity.labels(project=project, severity="critical").set(
            float(critical.get("total", 0))
        )

        exporter_up.set(1)
        log.info("Scraped SonarQube project %s (gate=%s)", project, status)
    except Exception as exc:  # noqa: BLE001 - exporter must survive transient API errors
        exporter_up.set(0)
        log.warning("SonarQube scrape failed: %s", exc)


def _poll_loop() -> None:
    while True:
        scrape()
        time.sleep(SCRAPE_INTERVAL)


def main() -> None:
    log.info(
        "Starting SonarQube exporter on :%s (host=%s project=%s interval=%ss)",
        EXPORTER_PORT,
        SONAR_HOST,
        SONAR_PROJECT_KEY,
        SCRAPE_INTERVAL,
    )
    thread = threading.Thread(target=_poll_loop, daemon=True)
    thread.start()
    start_http_server(EXPORTER_PORT)


if __name__ == "__main__":
    main()
