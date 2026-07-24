# TP-Truck — DevOps Lifecycle (Standardized Toolchain)

> **Product:** Truck Fleet & Logistics Management Platform
> **Toolchain:** Jira · ServiceNow · Maven · Docker · SonarQube · GitHub Actions · Jenkins · Argo CD · Grafana
> **Jira project:** `KAN` (Kanban board)

## Golden thread
A single Jira issue key (e.g. `KAN-24`) travels through every tool: branch name → PR → GitHub Actions CI → SonarQube gate → Jenkins CD → Docker image → ServiceNow Change → Argo CD sync → Grafana monitoring → Done.

## Toolchain map
| Phase | Tool | Repo artifact |
|-------|------|---------------|
| Plan | Jira | `agile/jira/` |
| Govern | ServiceNow | `itsm/servicenow/devops-config-mapping.json` |
| Build | Maven + Docker | `app/pom.xml`, `app/Dockerfile` |
| Test | SonarQube + JUnit | `docker/sonarqube/`, `app/src/test/` |
| Integrate | GitHub Actions | `.github/workflows/ci.yml` |
| Deliver | Jenkins | `Jenkinsfile`, `jenkins/scripts/` |
| Deploy | Argo CD | `gitops/argocd/`, `k8s/overlays/` |
| Operate | Grafana | `docker/grafana/`, `docker/prometheus/` |
| Feedback | Grafana → ServiceNow → Jira | `itsm/servicenow/`, `itsm/jira/`, `docker/jira-bridge/` |

---

## Phase 1 — PLAN (Jira)

**From your board:** KAN-4 (cahier des charges), KAN-12/KAN-14/KAN-26 (clone repo), KAN-11 (back-end integration), KAN-9/KAN-29/KAN-31 (map integration), KAN-22 (driver compliance), KAN-24 (SonarQube pom config), KAN-25 (Grafana dashboards — extend with backlog import).

1. Product owner creates/refines story on Jira board (`KAN-*`)
2. Developer assigns self, moves to **In Progress**
3. Branch: `feature/KAN-24-sonar-config`

**Repo:** `agile/jira/backlog-import.csv`, `agile/jira/workflow-automation.md`

---

## Phase 2 — BUILD (Maven + Docker)

1. Developer implements code in `app/src/main/java/`
2. DB changes as Flyway scripts: `app/src/main/resources/db/migration/V*.sql`
3. `mvn clean verify` locally
4. Docker image built from `app/Dockerfile` (Jenkins) or `docker compose build` (local)

**Repo:** `app/pom.xml`, `app/Dockerfile`, `docker-compose.yml`

---

## Phase 3 — TEST (SonarQube + JUnit)

1. JUnit tests run under Maven `verify`
2. JaCoCo coverage report → SonarQube
3. **TP-Truck Gate** enforces: 80% new coverage, zero new violations, security ratings
4. Gate failure blocks merge and auto-creates Jira Bug

**Repo:** `docker/sonarqube/quality-gate/tp-truck-gate.json`, `.github/workflows/ci.yml`

---

## Phase 4 — INTEGRATE (GitHub Actions CI)

**Boundary: CI only — no deployment.**

```
PR opened → GitHub Actions
  ├── checkout
  ├── mvn clean verify          (Maven)
  ├── mvn sonar:sonar + gate    (SonarQube)
  └── [on Sonar fail] Jira Bug  (KAN project)

main merged (green) → trigger Jenkins CD
```

**Repo:** `.github/workflows/ci.yml`

---

## Phase 5 — DELIVER (Jenkins CD)

**Boundary: CD orchestration — build artifact, govern, promote, deploy.**

```
Jenkins (triggered by GHA on main)
  ├── mvn verify + Sonar (safety net)
  ├── docker build + push GHCR
  ├── [DEV]  promote overlay → Argo sync truck-fleet-dev
  ├── [UAT]  ServiceNow change → promote → Argo sync → manual sign-off
  └── [PROD] ServiceNow change → CAB approval → Argo sync → smoke test
```

**Repo:** `Jenkinsfile`, `jenkins/scripts/*`

---

## Phase 6 — DEPLOY (Argo CD GitOps)

1. Jenkins commits new image tag to `k8s/overlays/{env}/kustomization.yaml`
2. Argo CD detects drift, syncs to Kubernetes
3. Flyway PreSync Job runs migrations before app rollout
4. PROD sync is **manual** — only after ServiceNow CAB approval

**Repo:** `gitops/argocd/truck-fleet-*.yaml`, `k8s/base/`, `k8s/overlays/`

---

## Phase 7 — OPERATE (Grafana)

**From your board:** KAN-25 Integration dashboards Grafana (in progress / extend).

1. Prometheus scrapes app (`/actuator/prometheus`) and SonarQube exporter every 15–60s
2. Grafana dashboards visualize fleet SLOs and live map metrics
3. Alert rules fire on: app down, high 5xx rate, high latency, SonarQube gate failure
4. Critical app alerts → ServiceNow incident webhook
5. SonarQube alerts → Jira Bug via `jira-bridge`

**Repo:** `docker/grafana/`, `docker/prometheus/rules/`, `docker/grafana/provisioning/alerting/`

---

## Phase 8 — FEEDBACK (Jira + ServiceNow)

| Failure | Auto-action |
|---------|-------------|
| SonarQube gate fail (GHA) | Jira Bug (`incident-from-sonarqube.json`) |
| SonarQube gate fail (Grafana) | Jira Bug via `jira-bridge` |
| Grafana P1 (app down / 5xx) | ServiceNow Incident (`incident-from-grafana.json`) |
| Jenkins build fail | Jira Bug + ServiceNow Incident |
| Argo CD sync fail | Jenkins post-step → Jira Bug + ServiceNow Incident |
| PROD deploy success | ServiceNow Change closed; Jira story → Done |

**Repo:** `itsm/jira/`, `itsm/servicenow/incident-from-pipeline.json`

---

## Environment promotion

| Env | Change ticket | Sync | Approver |
|-----|--------------|------|----------|
| DEV | None | Argo auto | — |
| UAT | ServiceNow (auto) | Argo auto | QA manual sign-off |
| PROD | ServiceNow (CAB) | Argo manual | CAB |

**Governance:** `itsm/servicenow/devops-config-mapping.json`
