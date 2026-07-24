# Jenkins + ServiceNow DevOps — Manual Setup

Jenkins runs as a containerized orchestrator alongside the existing GitHub
Actions workflow (`.github/workflows/ci.yml`) — it does not replace it. The
pipeline definition (`Jenkinsfile`) and the container wiring
(`docker/jenkins/`, the `jenkins` service in `docker-compose.yml` /
`docker-compose.dev.yml`) are committed and reproducible, but Jenkins itself —
plugins, tool installations, credentials — is configured by hand once, as
described below. None of this is scripted, because it touches two systems
(Jenkins' own config, and a ServiceNow instance) that don't exist yet when the
containers first start.

## 1. Start Jenkins

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build jenkins
```

Jenkins listens on `http://localhost:8081` in DEV (8080 is already taken by
the app). See [First login](#first-login--first-build) at the bottom for the
initial admin password.

## 2. Install plugins

**Manage Jenkins → Plugins → Available plugins**, install:

| Plugin | Why |
|---|---|
| Maven Integration | `tools { maven 'maven3' }`, Maven build steps |
| Docker Pipeline | `docker build` from the `Jenkinsfile` (Docker CLI already baked into the Jenkins image) |
| SonarQube Scanner | `withSonarQubeEnv`, the SonarQube server definition, quality gate webhook receiver |
| ServiceNow DevOps | `snDevOpsChange` step used in the `ServiceNow Change` stage |

Restart Jenkins when prompted.

## 3. Configure Tools (jdk17, maven3)

**Manage Jenkins → Tools**:

- **JDK installations** → Add JDK → name it exactly **`jdk17`**. Either point
  it at a JDK 17 already on the agent, or check "Install automatically" and
  pick an Adoptium/Eclipse Temurin 17 installer.
- **Maven installations** → Add Maven → name it exactly **`maven3`** → check
  "Install automatically" (latest Maven 3.x).

These names must match the `tools {}` block in the `Jenkinsfile` verbatim.

## 4. Configure the SonarQube server

**Manage Jenkins → System → SonarQube servers → Add SonarQube**:
- Name: **`SonarQube`** (must match `withSonarQubeEnv('SonarQube')` in the `Jenkinsfile`)
- Server URL: `http://sonarqube:9000` (container-to-container, on `tptruck-net`)
- Server authentication token: generate one in SonarQube (**My Account →
  Security → Generate Tokens**), store it as a Jenkins **Secret text**
  credential, and select it here.

Then, in SonarQube itself, add the webhook that lets `waitForQualityGate`
receive the gate result asynchronously:

**SonarQube → Administration → Configuration → Webhooks → Create**:
- URL: `http://jenkins:8080/sonarqube-webhook/` (internal container port —
  not the host-mapped `8081`, since this call goes SonarQube-container →
  Jenkins-container over `tptruck-net`)

Without this webhook, the `Quality Gate` stage will sit until the 5-minute
`timeout` in the `Jenkinsfile` aborts it.

## 5. Create the Pipeline job

**New Item → Pipeline** (or a **Multibranch Pipeline** if you want PRs/branches
built automatically):
- Definition: **Pipeline script from SCM**
- SCM: this repository, branch `main` (or `*/main` for multibranch)
- Script Path: `Jenkinsfile` (default, already correct — the file lives at the repo root)

Run it once manually to confirm the four checks above are wired correctly
before relying on triggers (SCM polling or a webhook from your Git host).

## 6. ServiceNow — Personal Developer Instance

1. Sign up / log in at ServiceNow's developer portal and request a **Personal
   Developer Instance (PDI)**.
2. In the PDI, activate the **DevOps Change Velocity** plugin
   (`sn_devops`) via **System Applications → All Available Applications →
   All**, search "DevOps Change Velocity", **Install**.

## 7. ServiceNow — Tool Integration for Jenkins

1. In the PDI: **DevOps → Tool Integrations → New**, type **Jenkins**.
2. Give it a name (e.g. `tptruck-jenkins`) and generate a **token** — the wizard
   produces a Jenkins-side snippet with the PDI URL and this token.
3. Back in Jenkins, **Manage Jenkins → System → ServiceNow DevOps** (the
   section added by the plugin from step 2 above): paste the PDI **instance
   URL** and the **token** generated above, then **Test Connection**.
4. `applicationName: 'TP-Truck'` in the `Jenkinsfile`'s `snDevOpsChange` step
   must match the application name registered in ServiceNow DevOps (**DevOps →
   Application Configuration**) — create it there if it doesn't exist yet.

## 8. Governance (DEV auto / UAT = QA Lead / PROD = CAB)

The approval policy is not invented per-tool — it's declared once in
[`itsm/servicenow/devops-config-mapping.json`](../itsm/servicenow/devops-config-mapping.json)
(`change_governance` block) and both Digital.ai Release and this Jenkins
pipeline should honor it:

```json
"change_governance": {
  "dev":  { "change_required": false, "auto_approve": true },
  "uat":  { "change_required": true,  "auto_approve": true,  "approver": "QA Lead" },
  "prod": { "change_required": true,  "auto_approve": false, "approver": "CAB" }
}
```

Mirror this in ServiceNow so it's enforced there too, not just documented:

- **DEV**: the `ServiceNow Change` stage in the `Jenkinsfile` only runs `when
  { branch 'main' }` and targets DEV — leave the change type as `standard` /
  pre-approved, or skip the change entirely, matching `change_required: false`.
- **UAT**: in **DevOps → Change Control** (or the Change Management app),
  set the change model/workflow used for UAT promotions to auto-approve when
  the assignment group is **QA Lead**.
- **PROD**: set the PROD change model's approval workflow to require sign-off
  from the **CAB** (Change Advisory Board) group — `auto_approve: false`, no
  Jenkins stage should bypass this; PROD promotion stays with Digital.ai
  Release as described in `docs/DEVOPS_LIFECYCLE.md`, not this Jenkinsfile.

## First login & first build

Retrieve the initial admin password (Jenkins prints it to its log and writes
it inside the container the first time it starts, before any setup wizard
step is completed):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec jenkins \
  cat /var/jenkins_home/secrets/initialAdminPassword
```

If the container isn't up yet, `up -d --build jenkins` first (or read it from
the logs instead: `docker compose logs jenkins`).

Then:
1. Open `http://localhost:8081`, paste that password into the setup wizard.
2. Install suggested plugins (or skip and install the four listed in
   [§2](#2-install-plugins) manually), create an admin user.
3. Complete steps 3–7 above (tools, SonarQube, SCM job, ServiceNow).
4. Open the job you created and click **Build Now** for the first run —
   watch **Console Output** to confirm each stage (Maven, SonarQube, Quality
   Gate, Docker build, ServiceNow change, Deploy DEV) goes green in order.
