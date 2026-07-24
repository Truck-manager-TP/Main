# TP-Truck — Fleet & Logistics Management Platform

Enterprise truck fleet, route, driver and marketing management with a
standardized DevOps toolchain.

## Business modules
| Module | Description | Package |
|--------|-------------|---------|
| Fleet & Expense | Trucks + overheads (fuel, maintenance, tickets) | `com.tptruck.fleet.fleet` |
| Route Tracking | Domestic & international routes, live GPS | `com.tptruck.fleet.route` |
| Driver Management | Compliance & access control | `com.tptruck.fleet.driver` |
| Marketing & Growth | Lead capture funnel | `com.tptruck.fleet.marketing` |

## Standardized toolchain (9 tools)
**Jira · ServiceNow · Maven · Docker · SonarQube · GitHub Actions · Jenkins · Argo CD · Grafana**

## Repository layout
```
app/                     Spring Boot (Maven, Flyway, tests)
docker/                  Postgres, Flyway, SonarQube, Grafana, Prometheus configs
docker-compose*.yml      Local DEV/UAT/PROD runtime
k8s/                     Kustomize base + dev/uat/prod overlays
gitops/argocd/           Argo CD Applications (GitOps CD)
jenkins/scripts/         CD helper scripts (promote, sync, ticketing)
itsm/                    ServiceNow + Jira payload templates
agile/jira/              Backlog import + workflow automation
.github/workflows/       GitHub Actions CI (build, test, Sonar gate)
Jenkinsfile              Jenkins CD pipeline (deploy orchestration)
docs/                    DevOps lifecycle + tool introductions
```

## Quick start (DEV)
```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
# App:       http://localhost:8080/swagger-ui.html
# Admin map: http://localhost:8080/admin/map.html  (admin/admin)
# SonarQube: http://localhost:9000
# Grafana:   http://localhost:3000  (admin/admin)
# Prometheus:http://localhost:9090
```

## CI/CD flow
1. **GitHub Actions (CI)** — PR/main: Maven verify + SonarQube gate
2. **Jenkins (CD)** — main: Docker build/push, ServiceNow change, Argo CD sync
3. **Argo CD (GitOps)** — reconciles `k8s/overlays/{dev,uat,prod}` to cluster
4. **Grafana (Operate)** — dashboards + alerts → ServiceNow/Jira on SLO breach

See [`docs/DEVOPS_SETUP_GUIDE.md`](docs/DEVOPS_SETUP_GUIDE.md) (setup status & remaining tasks), [`docs/DEVOPS_LIFECYCLE.md`](docs/DEVOPS_LIFECYCLE.md), and [`docs/DEVOPS_TOOLS_INTRO.md`](docs/DEVOPS_TOOLS_INTRO.md).
