# Jira <-> DevOps toolchain automation

The Jira issue key (e.g. `TPT-142`) is the golden thread that stitches every
tool together. Automation rules (Jira Automation) and smart commits keep the
board in sync with reality with zero manual status changes.

| Trigger (tool)                         | Action in Jira                                   |
|----------------------------------------|--------------------------------------------------|
| Branch `feature/TPT-142-*` created     | Story -> **In Progress**                         |
| Commit `TPT-142 #comment ...`          | Comment mirrored onto the story (smart commit)   |
| PR opened referencing `TPT-142`        | Story -> **In Review**                           |
| SonarQube quality gate **passed**      | Adds `sonar:passed` label                         |
| SonarQube quality gate **failed** (Grafana alert) | Auto-creates **Bug** with label `sonarqube`      |
| SonarQube quality gate **failed** (CI)            | Story -> **Blocked**, flags the PR               |
| Digital.ai Release deploys to UAT      | Story -> **In UAT**                              |
| ServiceNow PROD change **Closed OK**   | Story -> **Done**, `released/1.0.0` fix version  |
| Grafana raises P1 -> ServiceNow inc.   | Auto-creates linked **Bug** in the same epic     |

Digital.ai Agility (the SAFe/portfolio layer) rolls these Jira epics up into
program increments so leadership sees TTM at the portfolio level while teams
work day-to-day in Jira.
