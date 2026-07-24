# TP-Truck DevOps Setup Guide

> **Project:** Truck Fleet & Logistics Management Platform  
> **Repository:** https://github.com/Truck-manager-TP/Main  
> **Jira board:** `KAN`  
> **Last updated:** July 2026

This document summarizes the standardized DevOps toolchain, lifecycle phases, what has been implemented locally, and what remains to complete the pipeline end-to-end.

---

## 1. Toolchain overview (9 tools)

| # | Tool | Role in one sentence |
|---|------|----------------------|
| 1 | **Jira** | Tracks every feature and bug as a `KAN-*` ticket — the golden thread across the pipeline. |
| 2 | **ServiceNow** | Governs UAT/PROD deployments via change tickets and CAB approval. |
| 3 | **Maven** | Builds the Spring Boot app, runs tests, and produces coverage for SonarQube. |
| 4 | **Docker** | Packages the app and runs the local DEV stack (Postgres, Redis, observability). |
| 5 | **SonarQube** | Enforces code quality via the **TP-Truck Gate** (80% new coverage, zero new violations). |
| 6 | **GitHub Actions** | CI on every PR and `main` push — build, test, Sonar scan; triggers Jenkins on merge. |
| 7 | **Jenkins** | CD orchestration — Docker build/push, ServiceNow change, Kustomize promote, Argo sync. |
| 8 | **Argo CD** | GitOps deploy engine — syncs `k8s/overlays/*` to Kubernetes per environment. |
| 9 | **Grafana** | Monitors app + SonarQube metrics; alerts to Jira/ServiceNow via webhooks. |

**Supporting components (not separate mandated tools):** Prometheus (Grafana datasource), Flyway (DB migrations), Redis, PostgreSQL, jira-bridge.

---

## 2. Lifecycle phases and tools

```
┌─────────┐   ┌─────────┐   ┌───────────────┐   ┌───────────┐   ┌───────────────┐
│  PLAN   │ → │  BUILD  │ → │ TEST/INTEGRATE│ → │  DELIVER  │ → │    DEPLOY     │
│  Jira   │   │Maven+Docker│ │SonarQube+GHA │   │  Jenkins  │   │   Argo CD     │
└─────────┘   └─────────┘   └───────────────┘   └───────────┘   └───────────────┘
                                                                      ↓
                    ┌─────────┐   ┌──────────────────────────────────────────┐
                    │ OPERATE │ ← │ FEEDBACK: Grafana → Jira / ServiceNow    │
                    │ Grafana │   └──────────────────────────────────────────┘
                    └─────────┘
                              ↑
                    ServiceNow governs UAT/PROD changes
```

| Phase | Tools | Repo artifacts |
|-------|-------|----------------|
| **1 — Plan** | Jira | `agile/jira/`, branch names `feature/KAN-*` |
| **2 — Govern** | ServiceNow | `itsm/servicenow/devops-config-mapping.json` |
| **3 — Build** | Maven, Docker | `app/pom.xml`, `app/Dockerfile`, `docker-compose*.yml` |
| **4 — Test** | SonarQube, JUnit | `docker/sonarqube/`, `app/src/test/`, `.github/workflows/ci.yml` |
| **5 — Integrate** | GitHub Actions | `.github/workflows/ci.yml` |
| **6 — Deliver** | Jenkins | `Jenkinsfile`, `jenkins/scripts/` |
| **7 — Deploy** | Argo CD | `gitops/argocd/`, `k8s/base/`, `k8s/overlays/` |
| **8 — Operate** | Grafana (+ Prometheus) | `docker/grafana/`, `docker/prometheus/` |
| **9 — Feedback** | Grafana → Jira / ServiceNow | `docker/jira-bridge/`, `itsm/jira/`, `itsm/servicenow/` |

See also: [DEVOPS_LIFECYCLE.md](./DEVOPS_LIFECYCLE.md) (detailed phase steps) and [DEVOPS_TOOLS_INTRO.md](./DEVOPS_TOOLS_INTRO.md) (per-tool deep dive).

---

## 3. What has been done

### Repository & application
- Spring Boot fleet app with Flyway migrations **V1–V9** (map tracking, relay points, seed data).
- Docker Compose DEV stack: Postgres, Flyway, Redis, app, SonarQube, Grafana, Prometheus, jira-bridge, sonarqube-exporter.
- `docker-compose.sonar-scan.yml` for local SonarQube analysis without installing Maven.
- DevOps standardization: removed Digital.ai, Terraform, JMeter; kept the 9-tool toolchain.

### SonarQube (KAN-24)
- Project key: **`tptruck-fleet`**
- Quality gate: **TP-Truck Gate** (`docker/sonarqube/quality-gate/tp-truck-gate.json`)
- Local scan completed successfully with gate **PASSED**
- UI: http://localhost:9000

### GitHub Actions CI (KAN-33)
- Workflow: **CI - Build, Test & Quality Gate** (`.github/workflows/ci.yml`)
- Runs on PR and `main` push: Maven verify + SonarQube gate
- On `main` success: triggers Jenkins CD job `tp-truck-cd`
- On Sonar failure: creates Jira Bug via `jenkins/scripts/create-jira-bug.sh`

### Jenkins CD
- `Jenkinsfile` with stages: Checkout → Build/Sonar → Docker push → Deploy DEV/UAT/PROD
- Helper scripts in `jenkins/scripts/` (promote overlay, Argo sync, Jira/ServiceNow tickets)
- Local Jenkins running at http://localhost:8081, job **`tp-truck-cd`** created

### Argo CD (local Kubernetes)
- Installed on Docker Desktop Kubernetes
- Project **`tp-truck`** and applications **`truck-fleet-dev`**, **`truck-fleet-uat`**, **`truck-fleet-prod`**
- GitHub repository connected successfully in Argo CD UI
- UI: https://localhost:8443 (via port-forward)

### Grafana / observability (KAN-25)
- Dashboards, alert rules, and contact points provisioned under `docker/grafana/`
- Prometheus scrapes app (`/actuator/prometheus`) and SonarQube exporter
- UI: http://localhost:3000

### Database fixes applied
- Flyway V8 made idempotent (seed data); V9 fixes `relay_point.country_code` type for JPA.
- SonarQube exporter process-lifecycle fix; Flyway one-shot container (`restart: "no"`).

---

## 4. Local access URLs

| Service | URL | Default login |
|---------|-----|---------------|
| TP-Truck app | http://localhost:8080 | admin / (see `.env`) |
| Jenkins | http://localhost:8081 | (setup wizard) |
| SonarQube | http://localhost:9000 | admin / admin |
| Grafana | http://localhost:3000 | admin / admin |
| Prometheus | http://localhost:9090 | — |
| Argo CD | https://localhost:8443 | admin / (initial password from cluster) |
| Jira bridge | http://localhost:8090 | — |

Start the Docker stack:
```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Local Sonar scan (no Maven install required):
```powershell
docker compose -f docker-compose.sonar-scan.yml run --rm sonar-scan
```

---

## 5. What remains to do

### High priority

| # | Task | Tool | Where / how |
|---|------|------|-------------|
| 1 | **Open PR and merge to `main`** | GitHub | PR from `feature/KAN-33-github-actions` → verify Actions run |
| 2 | **Add GitHub Actions secrets** | GitHub | Settings → Secrets: `SONAR_TOKEN`, `SONAR_HOST_URL`, Jira, Jenkins vars |
| 3 | **Assign SonarQube project to TP-Truck Gate** | SonarQube | Quality Gates → Projects → `tptruck-fleet` |
| 4 | **Jenkins credentials** | Jenkins | `sonar-token`, `ghcr-token`, `argocd-auth-token`, etc. |
| 5 | **Jenkins API token → GitHub secret** | Jenkins + GitHub | User → Security → API Token → `JENKINS_TOKEN` |
| 6 | **Sync Argo CD DEV app** | Argo CD | Applications → `truck-fleet-dev` → Sync |
| 7 | **Push Docker image to GHCR** | Jenkins | First successful `tp-truck-cd` build with `ghcr-token` |

### Medium priority

| # | Task | Tool | Notes |
|---|------|------|-------|
| 8 | Expose SonarQube for GitHub CI | SonarQube / tunnel | GitHub cloud cannot reach `localhost:9000` |
| 9 | Expose Jenkins for GitHub trigger | Jenkins / tunnel | Or trigger Jenkins manually until tunnel is set up |
| 10 | Configure Jira credentials in `.env` | Jira | For jira-bridge and CI failure automation |
| 11 | Verify Grafana dashboards and alerts | Grafana | KAN-50–60 backlog items |
| 12 | UAT sign-off + PROD manual sync | Argo CD | PROD requires ServiceNow CAB first |

### Lower priority / production hardening

| # | Task | Tool |
|---|------|------|
| 13 | ServiceNow change/incident webhooks | ServiceNow |
| 14 | Kubernetes imagePullSecrets for GHCR | K8s / Argo CD |
| 15 | Rotate SonarQube/Jenkins admin passwords | All |
| 16 | Upgrade SonarQube (version EOL warning in UI) | SonarQube |

---

## 6. Jira tickets mapping

| Ticket | Topic | Status |
|--------|-------|--------|
| KAN-24 | SonarQube pom + gate + local scan | Done locally; CI secrets pending |
| KAN-25 | Grafana dashboards | Files in repo; stack verification pending |
| KAN-33 | GitHub Actions CI | Workflow in repo; PR + secrets pending |
| KAN-34–36 | Jenkins / Argo CD | Jenkins job created; credentials + sync pending |
| KAN-37–39 | ServiceNow / E2E pipeline | Not started |
| KAN-50–60 | Grafana subtasks | See `agile/jira/grafana-backlog-import.csv` |

---

## 7. End-to-end flow (target)

1. Developer picks **KAN-*** story → branch `feature/KAN-XX-description`
2. **GitHub Actions** runs Maven + Sonar on PR
3. Merge to **`main`** → Jenkins **`tp-truck-cd`** triggered
4. Jenkins builds Docker image → pushes **GHCR** → updates **`k8s/overlays/{env}`** tag
5. **Argo CD** syncs cluster to Git state
6. **Grafana** monitors; failures → **Jira Bug** or **ServiceNow Incident**
7. **ServiceNow** change ticket required for UAT/PROD; PROD sync is manual after CAB

---

## 8. Related documentation

| Document | Purpose |
|----------|---------|
| [DEVOPS_LIFECYCLE.md](./DEVOPS_LIFECYCLE.md) | Phase-by-phase pipeline steps |
| [DEVOPS_TOOLS_INTRO.md](./DEVOPS_TOOLS_INTRO.md) | Architectural role of each tool |
| [README.md](../README.md) | Quick start and repo layout |
| [.env.example](../.env.example) | Environment variables template |
