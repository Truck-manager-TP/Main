environment     = "dev"
app_image       = "tptruck/truck-fleet:1.0.0"
app_replicas    = 1
app_port        = 8080
cpu_limit       = 0.5
memory_limit_mb = 768
# db_password supplied via -var or TF_VAR_db_password (secret store), not here.
