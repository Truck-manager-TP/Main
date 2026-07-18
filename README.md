# TP-Truck — Fleet & Logistics Management Platform

Enterprise truck fleet, route, driver and marketing management, delivered with a
fully automated DevOps toolchain. Every tool runs in its **own dedicated Docker
container** and every environment (DEV / UAT / PROD) is identical, reproducible
infrastructure-as-code.

## Business modules
| Module | Description | Package |
|--------|-------------|---------|
| Fleet & Expense | Trucks (classified by product/stock) + overheads: fuel/carburant, maintenance, traffic tickets | `com.tptruck.fleet.fleet` |
| Route Tracking (Suivi d'itinéraire) | Domestic (Morocco) & international routes, live position updates | `com.tptruck.fleet.route` |
| Driver Management (Gestion des Drivers) | Profiles, availability, domestic vs international compliance | `com.tptruck.fleet.driver` |
| Marketing & Growth | Lead capture & onboarding funnel | `com.tptruck.fleet.marketing` |

## Toolchain (one container each)
Maven · Flyway · SonarQube · JMeter · Docker · Terraform · Argo CD ·
Digital.ai Release/Deploy · Digital.ai Agility · Jira · ServiceNow · Grafana + Prometheus

## Repository layout
```
app/                     Spring Boot application (Maven, Flyway migrations, tests)
docker/                  Dedicated Dockerfile + config per tool (postgres, sonarqube,
                         prometheus, grafana, jmeter, flyway)
docker-compose*.yml      Full local environment + DEV/UAT/PROD overrides
infra/terraform/         Infrastructure as code (Docker target) + per-env tfvars
k8s/                     Kustomize base + dev/uat/prod overlays
gitops/argocd/           Argo CD Applications (GitOps CD)
release/digitalai/       Digital.ai Release orchestration template
itsm/servicenow/         Change/Incident payloads + DevOps Config governance
agile/                   Jira backlog import + Digital.ai Agility portfolio
.github/workflows/       CI (build, test, Sonar gate, image publish)
docs/DEVOPS_LIFECYCLE.md Full Plan→Build→Test→Integrate→Deploy→Operate→Feedback walkthrough
```

## Quick start (DEV)
```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
# App:        http://localhost:8080/swagger-ui.html
# Admin map:  http://localhost:8080/admin/map.html  (admin/admin)
# Grafana:    http://localhost:3000  (admin/admin)
# SonarQube:  http://localhost:9000
# Prometheus: http://localhost:9090
```

## Promotion
`DEV → UAT → PROD` changes only the compose override / tfvars / kustomize overlay —
never the application artifact. See [`docs/DEVOPS_LIFECYCLE.md`](docs/DEVOPS_LIFECYCLE.md).
