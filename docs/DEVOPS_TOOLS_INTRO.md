# DevOps Tools Introduction — TP-Truck Fleet & Logistics

This document introduces the **nine standardized tools** in the TP-Truck DevOps toolchain and explains each tool's architectural role in the truck fleet management platform.

---

## 1. Jira

**Category:** Agile project management & traceability

**Role in TP-Truck:** Jira is the **golden thread** for all work. Every feature — map integration (KAN-9), SonarQube config (KAN-24), driver compliance (KAN-22), ServiceNow setup (KAN-32) — is tracked as a `KAN-*` ticket assigned to team members (Adam Nouman, Wissal Benchakroun, Dounia Beslem, etc.).

**Architectural integration:**
- Branch names reference issue keys: `feature/KAN-24-sonar-config`
- Smart commits update ticket status automatically
- CI/CD failures auto-create **Bug** tickets via `jenkins/scripts/create-jira-bug.sh`
- Payload templates: `itsm/jira/incident-from-pipeline.json`, `itsm/jira/incident-from-sonarqube.json`

**Repo artifacts:** `agile/jira/workflow-automation.md`, `agile/jira/backlog-import.csv`

---

## 2. ServiceNow

**Category:** IT Service Management (ITSM) — change & incident governance

**Role in TP-Truck:** ServiceNow governs **who can deploy where**. DEV deploys freely; UAT requires a change ticket (QA Lead); PROD requires CAB approval before Argo CD syncs.

**Architectural integration:**
- Jenkins opens Change Requests before UAT/PROD promotion (`jenkins/scripts/create-servicenow-change.sh`)
- Pipeline failures raise Incidents (`jenkins/scripts/create-servicenow-incident.sh`)
- Governance policy: `itsm/servicenow/devops-config-mapping.json`

**Repo artifacts:** `itsm/servicenow/change-request.json`, `itsm/servicenow/incident-from-pipeline.json`

---

## 3. Maven

**Category:** Build automation & dependency management

**Role in TP-Truck:** Maven compiles the Spring Boot application, runs JUnit tests, generates JaCoCo coverage reports, packages the fat JAR, and invokes the SonarQube scanner.

**Architectural integration:**
- `app/pom.xml` — single source of build truth
- `mvn clean verify` — CI quality gate (compile + test + coverage)
- Flyway migrations bundled as classpath resources (`app/src/main/resources/db/migration/`)
- JaCoCo report consumed by SonarQube quality gate

**Key command:** `mvn -B clean verify sonar:sonar -Dsonar.qualitygate.wait=true`

---

## 4. Docker

**Category:** Container packaging & local runtime

**Role in TP-Truck:** Docker produces the **immutable deployable artifact** — the `ghcr.io/truck-manager-tp/truck-fleet:<sha>` container image. The same image bytes promoted through DEV, UAT, and PROD.

**Architectural integration:**
- `app/Dockerfile` — multi-stage build (Maven compile → slim JRE runtime)
- `docker-compose*.yml` — local DEV/UAT/PROD runtime (Postgres, Redis, app, SonarQube)
- Jenkins builds and pushes to GHCR; Argo CD deploys the tagged image to Kubernetes

**Principle:** Build once, promote everywhere.

---

## 5. SonarQube

**Category:** Static code analysis & quality gate enforcement

**Role in TP-Truck:** SonarQube is the **machine-enforced definition of done**. No code merges or deploys if new coverage drops below 80%, new violations appear, or security ratings degrade.

**Architectural integration:**
- Project key: `tptruck-fleet` (configured in `app/pom.xml`)
- Quality gate: **TP-Truck Gate** (`docker/sonarqube/quality-gate/tp-truck-gate.json`)
- Runs in GitHub Actions CI on every PR and main push
- Re-run as safety net in Jenkins CD pipeline
- Gate failure → Jira Bug auto-created

**Local access:** `http://localhost:9000` (docker-compose DEV)

---

## 6. GitHub Actions

**Category:** Continuous Integration (CI) — fast feedback loop

**Role in TP-Truck:** GitHub Actions provides **immediate quality feedback** on every pull request and main-branch push without waiting for Jenkins.

**Architectural integration:**
- Workflow: `.github/workflows/ci.yml`
- **Scope (CI only):** checkout → Maven verify → SonarQube gate
- **Does NOT deploy** — hands off to Jenkins on main success
- On Sonar failure: creates Jira Bug via `create-jira-bug.sh`
- On main success: triggers Jenkins CD via webhook

**Boundary:** GitHub Actions = **validate**. Jenkins = **deliver**.

---

## 7. Jenkins

**Category:** Continuous Delivery (CD) — deployment orchestration

**Role in TP-Truck:** Jenkins is the **CD conductor**. After GitHub Actions confirms code quality on `main`, Jenkins builds the Docker image, opens ServiceNow changes, promotes Kustomize overlays, and triggers Argo CD syncs.

**Architectural integration:**
- Pipeline: `Jenkinsfile` (Declarative Pipeline)
- Helper scripts: `jenkins/scripts/` (promote, sync, ticketing)
- Stages: Build → Docker push → Deploy DEV/UAT/PROD
- UAT: manual sign-off gate
- PROD: ServiceNow CAB approval gate
- `post { failure }` → Jira Bug + ServiceNow Incident

**Jenkins credentials required:** `sonar-token`, `ghcr-token`, `argocd-auth-token`, ServiceNow, Jira

---

## 8. Argo CD

**Category:** GitOps continuous deployment

**Role in TP-Truck:** Argo CD is the **deployment engine**. It watches the Git repository (`k8s/overlays/*`) and reconciles the Kubernetes cluster to match the declared desired state.

**Architectural integration:**
- Applications: `gitops/argocd/truck-fleet-{dev,uat,prod}.yaml`
- Manifests: `k8s/base/` + environment overlays
- Flyway PreSync hook: `k8s/base/migration-job.yaml` (migrations before app rollout)
- DEV: automated sync + self-heal
- UAT: automated sync after Jenkins promotion commit
- PROD: **manual sync** — only after ServiceNow CAB approval + Jenkins trigger

**Principle:** Git is the single source of truth for what's running in each environment.

---

## 9. Grafana

**Category:** Observability — dashboards, alerting & continuous feedback

**Role in TP-Truck:** Grafana is the **operations cockpit**. It visualizes fleet API metrics, live map WebSocket throughput, SonarQube quality gate status, and SLO alerts — routing critical incidents to ServiceNow and SonarQube failures to Jira.

**Architectural integration:**
- Dashboards provisioned as-code: `docker/grafana/dashboards/` (fleet overview, map tracking)
- Datasource: Prometheus (`docker/grafana/provisioning/datasources/prometheus.yml`)
- Alert rules: `docker/grafana/provisioning/alerting/` (app SLOs + SonarQube quality gate)
- Contact points:
  - Critical app alerts → **ServiceNow** (`servicenow-incidents` webhook)
  - SonarQube alerts → **Jira** via `jira-bridge` (`jira-sonarqube` webhook)
- App exposes metrics: `/actuator/prometheus` (Micrometer)
- SonarQube metrics via `sonarqube-exporter` → Prometheus

**Repo artifacts:** `docker/grafana/`, `docker/prometheus/`, `docker/sonarqube-exporter/`, `docker/jira-bridge/`

**Local access:** `http://localhost:3000` (admin/admin)

**Note:** Prometheus runs as Grafana's metrics backend (not a separate mandated toolchain tool).

---

## Tool interaction diagram

```
Developer → Jira (KAN-*)
    ↓
Git push / PR → GitHub Actions (Maven + SonarQube)
    ↓ (main, green)
Jenkins (Docker build → ServiceNow change → Git promote → Argo sync)
    ↓
Argo CD → Kubernetes (DEV / UAT / PROD)
    ↓
Grafana ← Prometheus ← app + sonarqube-exporter (continuous monitoring)
    ↓ (critical alert)
ServiceNow Incident + Jira Bug (automated)
```

---

## Quick reference

| Question | Tool | File |
|----------|------|------|
| Where is my task? | Jira | Board `KAN-*` |
| Who approves PROD deploy? | ServiceNow | `devops-config-mapping.json` |
| How is code built? | Maven | `app/pom.xml` |
| What gets deployed? | Docker | `app/Dockerfile` |
| Is code quality OK? | SonarQube | `.github/workflows/ci.yml` |
| Is the PR safe to merge? | GitHub Actions | CI workflow |
| How does it reach PROD? | Jenkins + Argo CD | `Jenkinsfile` + `gitops/argocd/` |
| What's running in UAT? | Argo CD | `k8s/overlays/uat/` |
| Is the fleet healthy? | Grafana | `docker/grafana/dashboards/` |
| Who gets paged on outage? | Grafana → ServiceNow | `contact-points.yml` |
