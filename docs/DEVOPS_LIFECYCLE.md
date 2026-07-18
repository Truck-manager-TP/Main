# TP-Truck — End-to-End DevOps Lifecycle Walkthrough

> **Role:** Senior DevOps Architect & Project Manager
> **Product:** Truck Fleet & Logistics Management Platform (Morocco domestic + international)
> **Objective:** Maximum automation, minimum human error, shortest Time-to-Market (TTM), and frictionless movement between **DEV → UAT → PROD**.

This document walks the full loop — **Plan → Build → Test → Integrate → Deploy → Operate → Continuous Feedback** — mapping every step to the mandated toolchain and to real, committed artifacts in this repository.

## The golden thread
A single Jira issue key (e.g. `TPT-142`) travels through every tool: branch name → commit → PR → SonarQube analysis → Docker image label → Digital.ai Release → ServiceNow Change → Argo sync → Grafana annotation. Nothing is deployed that cannot be traced back to a story and a change ticket.

## Toolchain-to-phase map
| Phase | Primary tools | Repo artifacts |
|-------|---------------|----------------|
| Plan | Jira, Digital.ai Agility, ServiceNow | `agile/`, `itsm/servicenow/devops-config-mapping.json` |
| Build | Maven, Flyway, Docker | `app/pom.xml`, `app/Dockerfile`, `app/src/main/resources/db/migration/` |
| Test | JMeter, SonarQube, JUnit | `docker/jmeter/`, `docker/sonarqube/`, `app/src/test/` |
| Integrate | GitHub Actions CI, SonarQube gate | `.github/workflows/ci.yml` |
| Deploy | Terraform, Argo CD, Digital.ai Release, ServiceNow | `infra/terraform/`, `gitops/argocd/`, `release/digitalai/` |
| Operate | Grafana, Prometheus, ServiceNow | `docker/prometheus/`, `docker/grafana/` |
| Feedback | Grafana → ServiceNow → Jira | `itsm/servicenow/incident-from-grafana.json` |

---

# Phase 1 — PLAN

### 1. Phase Overview
We convert the four business capabilities into a scaled-agile backlog and establish the *governance contract* up front: which environments require change approval, who approves, and how work is traced. The strategic win is **predictable TTM** — leadership sees the whole program increment in Digital.ai Agility while teams execute in Jira, and ServiceNow DevOps Config pre-declares the promotion rules so no one negotiates governance at release time.

### 2. Jira Tasks Breakdown
- **Epic PLAN — Foundation & DevOps toolchain bring-up**
  - `TPT-1` Configure Digital.ai Release pipeline template
  - `TPT-2` Stand up SonarQube + TP-Truck quality gate
  - `TPT-3` Author Flyway V1–V5 migration scripts
- **Epics BUILD/TEST/DEPLOY/OPERATE** seeded from `agile/jira/backlog-import.csv` (importable into Jira directly).

### 3. Tool Integration Breakdown
- **Jira ⇄ Digital.ai Agility:** Jira epics roll up into value streams and the `PI-2026.Q3` program increment (`agile/digitalai-agility/portfolio-mapping.yaml`). Cycle-time/throughput flow *from* Jira; deployment-frequency/MTTR flow *from* Digital.ai Release back into Agility for a single TTM view.
- **ServiceNow DevOps Config** (`itsm/servicenow/devops-config-mapping.json`) declares per-environment change policy: DEV auto-approves, UAT needs QA Lead, PROD needs CAB. This is read by the Digital.ai Release template so gates are policy-driven, not hard-coded.

### 4. Simulated Project Outputs
Jira import (excerpt from `agile/jira/backlog-import.csv`):
```csv
Issue Type,Epic Name,Summary,Component,Story Points,Sprint
Epic,BUILD,Fleet & Expense management module,Fleet,,Sprint 2
Story,,As an ops manager I register trucks classified by product type,Fleet,5,Sprint 2
```
Governance contract:
```json
"change_governance": {
  "dev":  { "change_required": false, "auto_approve": true },
  "uat":  { "change_required": true,  "auto_approve": true,  "approver": "QA Lead" },
  "prod": { "change_required": true,  "auto_approve": false, "approver": "CAB" }
}
```

---

# Phase 2 — BUILD

### 1. Phase Overview
We produce a single, immutable, versioned artifact — the `tptruck/truck-fleet` container — plus the versioned database schema that must accompany it. The strategic win is **build-once, promote-everywhere**: the exact bytes that pass UAT are what reach PROD, eliminating "works on my machine" and environment drift.

### 2. Jira Tasks Breakdown
- `TPT-20` Register trucks with classification by product/stock type
- `TPT-21` Record fuel/maintenance/traffic-ticket overheads per truck
- `TPT-30` Create domestic & international routes; `TPT-31` live GPS updates
- `TPT-40` Domestic vs international driver compliance
- `TPT-50` Lead capture + funnel
- `TPT-3` Flyway migrations V1–V5; `TPT-60` write the multi-stage `Dockerfile`

### 3. Tool Integration Breakdown
- **Maven** (`app/pom.xml`) compiles, runs unit tests, produces JaCoCo coverage and the fat JAR.
- **Docker** multi-stage build (`app/Dockerfile`) runs Maven in stage 1 and ships a slim, non-root JRE image in stage 2.
- **Flyway** owns schema: JPA is set to `ddl-auto: validate`, so the app refuses to start unless the schema matches the migrations — the DB and code version are locked together.

### 4. Simulated Project Outputs
`pom.xml` (quality wiring excerpt):
```xml
<sonar.qualitygate.wait>true</sonar.qualitygate.wait>
<sonar.coverage.jacoco.xmlReportPaths>${project.build.directory}/site/jacoco/jacoco.xml</sonar.coverage.jacoco.xmlReportPaths>
```
`Dockerfile` (multi-stage, non-root):
```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
RUN mvn -B -q clean package -DskipTests
FROM eclipse-temurin:17-jre-jammy AS runtime
USER tptruck
HEALTHCHECK CMD wget -qO- http://localhost:8080/actuator/health/liveness || exit 1
```
Flyway migrate log (simulated):
```text
Flyway 10.15 — Migrating schema "public"
  V1__init_fleet.sql .............. success (truck, expense)
  V2__route_tracking.sql .......... success (route)
  V3__driver_management.sql ....... success (driver + FK route.driver_id)
  V4__marketing.sql ............... success (lead)
  V5__seed_reference_data.sql ..... success (3 trucks, 2 drivers, 2 routes, 2 leads)
Successfully applied 5 migrations (execution time 00:00.412s)
```

---

# Phase 3 — TEST

### 1. Phase Overview
We prove the artifact is correct (unit), maintainable/secure (static analysis) and fast enough (load). The strategic win is a **machine-enforced definition of done**: humans never eyeball quality — the SonarQube gate and JMeter SLA either pass or the pipeline stops.

### 2. Jira Tasks Breakdown
- `TPT-70` JMeter load test covering all four modules (`docker/jmeter/plans/truck-load-test.jmx`)
- `TPT-71` Enforce 80% new-code coverage + zero new violations in the Sonar gate
- `TPT-72` Unit tests for `FleetService` and `DriverComplianceService`

### 3. Tool Integration Breakdown
- **JUnit + JaCoCo** run under Maven `verify`, emitting `jacoco.xml`.
- **SonarQube** ingests that report; the **TP-Truck Gate** (`docker/sonarqube/quality-gate/tp-truck-gate.json`) is applied as-code via `bootstrap-gate.sh` (no manual clicking).
- **JMeter** runs headless against the DEV/UAT app container on the shared Docker network, producing a JTL + HTML report consumed by the pipeline.

### 4. Simulated Project Outputs
SonarQube quality gate result (simulated):
```text
QUALITY GATE STATUS: PASSED
- Coverage on New Code ............ 86.4%  (>= 80)   OK
- Duplicated Lines (New) .......... 0.0%   (<= 3)    OK
- New Violations .................. 0      (== 0)    OK
- Security Hotspots Reviewed ...... 100%             OK
```
JMeter summary (simulated, DEV):
```text
summary =  36000 in 00:02:00 =  300.0/s  Avg:  142  Min: 11  Max: 690  Err: 0 (0.00%)
APDEX 0.97 | p95 218ms  (SLA p95 < 800ms)  ->  PASS
```

---

# Phase 4 — INTEGRATE (Continuous Integration)

### 1. Phase Overview
Every merge to `main` is automatically built, tested, scanned and — only if green — published as an image, then it hands off to the release orchestrator. The strategic win is a **hard quality gate on the trunk**: broken or insecure code physically cannot become a deployable artifact, and the handoff to release is instantaneous (low TTM).

### 2. Jira Tasks Breakdown
- `TPT-1` Configure CI workflow (`.github/workflows/ci.yml`)
- `TPT-80` Wire SonarQube token + host as CI secrets
- `TPT-81` Publish image to GHCR on `main`; trigger Digital.ai Release

### 3. Tool Integration Breakdown
- **GitHub Actions** spins an ephemeral PostgreSQL service, runs `mvn clean verify`, then `mvn sonar:sonar -Dsonar.qualitygate.wait=true`.
- A **failed SonarQube gate fails the CI job**, which means `build-test-scan` never succeeds, so the dependent `trigger-release` job (and thus **Digital.ai Release**) is never started — the gate blocks the release by construction.
- On success, the image is pushed and CI calls the Digital.ai Release REST API with the immutable `imageTag`.

### 4. Simulated Project Outputs
CI failure path (simulated) — Sonar gate blocks release:
```text
[INFO] SonarQube Quality Gate ......... FAILED (new_coverage 71% < 80%)
Error: Process completed with exit code 1.
Job 'build-test-scan' failed -> 'trigger-release' skipped. No image promoted.
Jira: TPT-142 transitioned to "Blocked".
```
Release trigger (success path):
```yaml
- name: Kick off Digital.ai Release pipeline
  run: curl -X POST "$DAI_RELEASE_URL/api/v1/templates/TP-Truck/start"
       -d '{"variables":{"version":"1.0.0","imageTag":"ghcr.io/.../truck-fleet:<sha>"}}'
```

---

# Phase 5 — DEPLOY

### 1. Phase Overview
Digital.ai Release orchestrates promotion through DEV → UAT → PROD. Infrastructure is created by Terraform, the desired state lives in Git, and Argo CD reconciles the cluster to Git. The strategic win is **safe, auditable, low-touch promotion**: DEV auto-syncs for speed, UAT adds a QA gate + JMeter, PROD is gated by a ServiceNow CAB approval — the same artifact flows through all three.

### 2. Jira Tasks Breakdown
- `TPT-90` Author Terraform module + dev/uat/prod tfvars (`infra/terraform/`)
- `TPT-91` Define Argo CD Applications per env (`gitops/argocd/`)
- `TPT-92` Build Digital.ai Release template (`release/digitalai/release-template.yaml`)
- `TPT-93` Gate PROD sync behind ServiceNow CAB

### 3. Tool Integration Breakdown
- **Terraform → ServiceNow:** a `terraform plan` for UAT/PROD is attached to a **ServiceNow Change Request** (`itsm/servicenow/change-request.json`); apply only proceeds after approval.
- **Digital.ai Release → Argo CD:** promotion bumps the image tag in the kustomize overlay via a Git commit; **Argo CD** detects the drift and syncs. DEV `automated`, UAT `automated` post-gate, PROD **manual** — synced by Release only after CAB approval.
- **Flyway as an Argo PreSync hook** (`k8s/base/migration-job.yaml`) guarantees migrations finish before the new pods take traffic — no half-migrated deploys.

### 4. Simulated Project Outputs
Argo CD Application (PROD, manual sync):
```yaml
# gitops/argocd/truck-fleet-prod.yaml
spec:
  source: { path: k8s/overlays/prod, targetRevision: main }
  syncPolicy:
    syncOptions: [CreateNamespace=true]   # no 'automated' -> manual, CAB-gated
```
ServiceNow Change (auto-opened by Release):
```json
{ "short_description": "Promote TP-Truck Fleet 1.0.0 to PRODUCTION",
  "assignment_group": "Change Advisory Board", "risk": "moderate",
  "u_terraform_plan_url": "${TF_PLAN_ARTIFACT_URL}", "u_argocd_app": "truck-fleet-prod" }
```
Argo sync (simulated):
```text
truck-fleet-prod  Synced  Healthy
  PreSync  Job/flyway-migrate  Completed (5 migrations, 0 pending)
  Sync     Deployment/truck-fleet  3/3 replicas Ready
```

---

# Phase 6 — OPERATE

### 1. Phase Overview
The running platform is observed continuously: Prometheus scrapes the app's Actuator metrics and Grafana visualizes SLOs. The strategic win is **proactive operations** — we watch availability, p95 latency, error-budget burn and DB pool saturation, and alerts are pre-wired to raise incidents automatically.

### 2. Jira Tasks Breakdown
- `TPT-100` Prometheus scrape config + alert rules (`docker/prometheus/`)
- `TPT-101` Grafana datasource + overview dashboard as-code (`docker/grafana/`)
- `TPT-102` Auto-raise ServiceNow incidents from critical alerts

### 3. Tool Integration Breakdown
- **App → Prometheus:** Micrometer exposes `/actuator/prometheus`; Prometheus scrapes `app:8080` every 15s.
- **Prometheus → Grafana:** provisioned datasource (`docker/grafana/provisioning/datasources/prometheus.yml`) drives the `TP-Truck | Platform Overview` dashboard, all provisioned-as-code (zero manual setup).
- **Grafana → ServiceNow:** critical alerts hit the `servicenow-incidents` webhook contact point and auto-create a P1 incident.

### 4. Simulated Project Outputs
Prometheus alert rule:
```yaml
- alert: HighServerErrorRate
  expr: sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
      / sum(rate(http_server_requests_seconds_count[5m])) > 0.05
  for: 5m
  labels: { severity: critical, servicenow: "true" }
```
Grafana panel query (p95 latency): `histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket[5m])) by (le))`

---

# Phase 7 — CONTINUOUS FEEDBACK

### 1. Phase Overview
Operational signal and user growth data flow back into planning, closing the loop. The strategic win is a **self-correcting delivery system**: incidents become bugs in the same epic, error-budget burn can auto-trigger an Argo rollback, and marketing-funnel metrics steer the next PI's priorities — continuously shrinking TTM and change-failure rate.

### 2. Jira Tasks Breakdown
- `TPT-110` Grafana P1 → ServiceNow incident → linked Jira Bug automation
- `TPT-111` Feed DORA metrics (deploy freq, CFR, MTTR) into Digital.ai Agility
- `TPT-112` Surface marketing funnel to steer growth backlog

### 3. Tool Integration Breakdown
- **Grafana → ServiceNow → Jira:** the incident payload (`itsm/servicenow/incident-from-grafana.json`) carries a `correlation_id`; ServiceNow opens the incident and Jira Automation creates a linked Bug in the affected epic (`agile/jira/workflow-automation.md`).
- **Argo/Release → Digital.ai Agility:** deployment frequency, change-failure rate and MTTR are pushed to the portfolio view alongside Jira cycle-time.
- **App → Grafana → Backlog:** `/api/v1/marketing/funnel` metrics inform the growth epic prioritization for the next increment.

### 4. Simulated Project Outputs
Rollback loop (simulated):
```text
09:14 Grafana alert HighServerErrorRate (prod) severity=critical -> webhook
09:14 ServiceNow INC0104233 opened (P1), CI=tp-truck-fleet, corr=prod/HighServerErrorRate
09:14 Jira Automation -> Bug TPT-901 created & linked to Epic OPERATE
09:15 Argo CD -> rollback truck-fleet-prod to previous healthy revision
09:22 Error rate < 1% -> INC0104233 auto-resolved, TPT-901 -> "Ready for Fix"
```
DORA snapshot fed to Digital.ai Agility (simulated):
```text
Deployment frequency: 4.2/week | Lead time for change: 6h | CFR: 4% | MTTR: 22m
```

---

## Environment shift summary (DEV → UAT → PROD)
| Concern | DEV | UAT | PROD |
|---------|-----|-----|------|
| Artifact | same image `tptruck/truck-fleet:<sha>` | same | same |
| Config | `application-dev.yml` / dev overlay | `-uat` | `-prod` (no Swagger, bigger pool) |
| Argo sync | automated + self-heal | automated (post QA gate) | **manual, CAB-gated** |
| Change ticket | none | QA Lead auto-approve | **CAB approval** |
| Terraform | `dev.tfvars` (1 replica) | `uat.tfvars` (2) | `prod.tfvars` (3) |
| Tests run | unit + Sonar | + JMeter + acceptance | smoke only |

**Only the overlay/tfvars/profile changes between environments — never the artifact.** This is the core of the low-error, low-TTM design.
