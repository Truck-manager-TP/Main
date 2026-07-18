# Terraform IaC (Docker target)

```bash
# DEV
terraform init
terraform workspace new dev || terraform workspace select dev
terraform plan  -var-file=environments/dev.tfvars  -var="db_password=$TF_VAR_db_password" -out=dev.plan
terraform apply dev.plan

# UAT / PROD swap the tfvars file and workspace. Every `apply` to UAT/PROD is
# gated by a ServiceNow Change ticket (see ../../itsm/servicenow/change-request.json).
```

Promotion between environments only changes the `-var-file`; the module is
identical, guaranteeing DEV == UAT == PROD topology and removing config drift.
