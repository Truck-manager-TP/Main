# Jira <-> DevOps toolchain automation (KAN project)

| Trigger (tool)                              | Action in Jira / ServiceNow                      |
|---------------------------------------------|--------------------------------------------------|
| Branch `feature/KAN-*` created              | Story -> **In Progress**                         |
| PR opened referencing `KAN-*`               | Story -> **In Review**                           |
| SonarQube gate **failed** (GitHub Actions)  | Auto-creates **Bug**; Story -> **Blocked**       |
| SonarQube gate **failed** (Grafana alert)   | Auto-creates **Bug** via jira-bridge             |
| Jenkins build **failed**                    | Auto-creates **Bug** + ServiceNow Incident       |
| Argo CD sync **failed**                     | Auto-creates **Bug** + ServiceNow Incident       |
| Grafana P1 alert (app down, 5xx)            | ServiceNow Incident + linked Jira Bug            |
| Jenkins deploys to UAT                      | Story -> **In UAT**                              |
| ServiceNow PROD change **Closed OK**        | Story -> **Done**                                |

Payload templates:
- `itsm/jira/incident-from-grafana.json`
- `itsm/jira/incident-from-sonarqube.json`
- `itsm/servicenow/incident-from-grafana.json`
