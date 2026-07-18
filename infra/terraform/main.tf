# -----------------------------------------------------------------------------
# TP-Truck infrastructure as code.
# Docker is the target "infrastructure wrapper": Terraform declares the network,
# volumes and the containerised platform per environment. A plan diff is what a
# ServiceNow Change ticket is opened against (see itsm/servicenow).
# -----------------------------------------------------------------------------

locals {
  name_prefix = "tptruck-${var.environment}"
  common_labels = {
    "com.tptruck.platform"    = "fleet"
    "com.tptruck.environment" = var.environment
    "com.tptruck.managed-by"  = "terraform"
  }
}

resource "docker_network" "tptruck" {
  name = "${local.name_prefix}-net"
  dynamic "labels" {
    for_each = local.common_labels
    content {
      label = labels.key
      value = labels.value
    }
  }
}

resource "docker_volume" "pgdata" {
  name = "${local.name_prefix}-pgdata"
}

# ---- Database ---------------------------------------------------------------
resource "docker_image" "postgres" {
  name = "postgres:16-alpine"
}

resource "docker_container" "postgres" {
  name  = "${local.name_prefix}-postgres"
  image = docker_image.postgres.image_id

  env = [
    "POSTGRES_DB=${var.db_name}",
    "POSTGRES_USER=${var.db_user}",
    "POSTGRES_PASSWORD=${var.db_password}",
  ]

  networks_advanced {
    name = docker_network.tptruck.name
  }

  volumes {
    volume_name    = docker_volume.pgdata.name
    container_path = "/var/lib/postgresql/data"
  }

  healthcheck {
    test     = ["CMD-SHELL", "pg_isready -U ${var.db_user} -d ${var.db_name}"]
    interval = "10s"
    retries  = 10
    timeout  = "5s"
  }

  restart = "unless-stopped"
}

# ---- Redis (live map position cache) ----------------------------------------
resource "docker_volume" "redisdata" {
  name = "${local.name_prefix}-redisdata"
}

resource "docker_image" "redis" {
  name = "redis:7-alpine"
}

resource "docker_container" "redis" {
  name  = "${local.name_prefix}-redis"
  image = docker_image.redis.image_id

  networks_advanced {
    name = docker_network.tptruck.name
  }

  volumes {
    volume_name    = docker_volume.redisdata.name
    container_path = "/data"
  }

  restart = "unless-stopped"
}

# ---- Application ------------------------------------------------------------
resource "docker_image" "app" {
  name = var.app_image
}

resource "docker_container" "app" {
  count = var.app_replicas
  name  = "${local.name_prefix}-app-${count.index + 1}"
  image = docker_image.app.image_id

  env = [
    "APP_ENV=${var.environment}",
    "DB_URL=jdbc:postgresql://${docker_container.postgres.name}:5432/${var.db_name}",
    "DB_USER=${var.db_user}",
    "DB_PASSWORD=${var.db_password}",
    "REDIS_HOST=${docker_container.redis.name}",
    "REDIS_PORT=6379",
  ]

  networks_advanced {
    name = docker_network.tptruck.name
  }

  # Only the first replica publishes to the host in single-node mode; a real LB
  # (ingress) fronts the replicas in UAT/PROD.
  dynamic "ports" {
    for_each = count.index == 0 ? [1] : []
    content {
      internal = 8080
      external = var.app_port
    }
  }

  memory     = var.memory_limit_mb
  cpu_shares = floor(var.cpu_limit * 1024)

  restart = "unless-stopped"
}
