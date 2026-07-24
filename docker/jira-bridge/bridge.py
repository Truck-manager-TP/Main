#!/usr/bin/env python3
"""Translate Grafana alert webhooks into Jira Bug issues."""

from __future__ import annotations

import logging
import os
from typing import Any

import requests
from flask import Flask, jsonify, request

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("jira-bridge")

app = Flask(__name__)

JIRA_BASE_URL = os.environ.get("JIRA_BASE_URL", "").rstrip("/")
JIRA_EMAIL = os.environ.get("JIRA_EMAIL", "")
JIRA_API_TOKEN = os.environ.get("JIRA_API_TOKEN", "")
JIRA_PROJECT_KEY = os.environ.get("JIRA_PROJECT_KEY", "TPT")
JIRA_ISSUE_TYPE = os.environ.get("JIRA_ISSUE_TYPE", "Bug")
DEDUP_ENABLED = os.environ.get("DEDUP_ENABLED", "true").lower() == "true"


def _jira_session() -> requests.Session:
    session = requests.Session()
    session.auth = (JIRA_EMAIL, JIRA_API_TOKEN)
    session.headers.update({"Accept": "application/json", "Content-Type": "application/json"})
    return session


def _find_duplicate(session: requests.Session, summary: str) -> str | None:
    if not DEDUP_ENABLED:
        return None

    jql = (
        f'project = "{JIRA_PROJECT_KEY}" AND labels = "grafana-alert" '
        f'AND summary ~ "\\"{summary[:120]}\\"" AND status != Done ORDER BY created DESC'
    )
    response = session.get(
        f"{JIRA_BASE_URL}/rest/api/2/search",
        params={"jql": jql, "maxResults": 1, "fields": "key"},
        timeout=30,
    )
    response.raise_for_status()
    issues = response.json().get("issues", [])
    return issues[0]["key"] if issues else None


def _build_description(labels: dict[str, str], annotations: dict[str, str]) -> str:
    project = labels.get("project", "tptruck-fleet")
    alertname = labels.get("alertname", "UnknownAlert")
    summary = annotations.get("summary", "")
    description = annotations.get("description", "")
    dashboard_url = annotations.get("dashboard_url", f"http://sonarqube:9000/dashboard?id={project}")

    return (
        f"h2. Observability Alert — SonarQube\n\n"
        f"*Alert:* {alertname}\n"
        f"*Project:* {project}\n"
        f"*Severity:* {labels.get('severity', 'unknown')}\n\n"
        f"h3. Summary\n{summary}\n\n"
        f"h3. Details\n{description}\n\n"
        f"*SonarQube dashboard:* {dashboard_url}\n\n"
        f"_Auto-created via Grafana → Jira bridge (Approach 2)._"
    )


def _create_issue(session: requests.Session, payload: dict[str, Any]) -> str:
    response = session.post(f"{JIRA_BASE_URL}/rest/api/2/issue", json=payload, timeout=30)
    response.raise_for_status()
    return response.json()["key"]


@app.get("/health")
def health() -> tuple[dict[str, str], int]:
    configured = bool(JIRA_BASE_URL and JIRA_EMAIL and JIRA_API_TOKEN)
    return {"status": "ok" if configured else "misconfigured"}, 200 if configured else 503


@app.post("/webhooks/grafana")
def grafana_webhook() -> tuple[Any, int]:
    if not (JIRA_BASE_URL and JIRA_EMAIL and JIRA_API_TOKEN):
        log.error("Jira credentials are not configured")
        return jsonify({"error": "Jira credentials missing"}), 503

    alert_group = request.get_json(silent=True) or {}
    if alert_group.get("status") != "firing":
        return jsonify({"status": "ignored", "reason": "not firing"}), 200

    labels = alert_group.get("commonLabels", {})
    annotations = alert_group.get("commonAnnotations", {})

    if labels.get("source") != "sonarqube":
        return jsonify({"status": "ignored", "reason": "not sonarqube"}), 200

    project = labels.get("project", "tptruck-fleet")
    alertname = labels.get("alertname", "SonarQubeAlert")
    summary = f"[Grafana/SonarQube] {alertname} — {project}"

    session = _jira_session()
    existing = _find_duplicate(session, summary)
    if existing:
        log.info("Duplicate suppressed — returning existing issue %s", existing)
        return jsonify({"status": "duplicate", "jira_issue": existing}), 200

    jira_payload = {
        "fields": {
            "project": {"key": JIRA_PROJECT_KEY},
            "issuetype": {"name": JIRA_ISSUE_TYPE},
            "summary": summary,
            "description": _build_description(labels, annotations),
            "priority": {"name": "Highest"},
            "labels": ["sonarqube", "grafana-alert", "quality-gate", "auto-created"],
            "components": [{"name": "Platform"}],
        }
    }

    issue_key = _create_issue(session, jira_payload)
    log.info("Created Jira issue %s for alert %s", issue_key, alertname)
    return jsonify({"status": "created", "jira_issue": issue_key}), 201


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8090)
