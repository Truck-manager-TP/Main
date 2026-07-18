terraform {
  required_version = ">= 1.6.0"

  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }

  # Remote state keeps DEV/UAT/PROD isolated and auditable. Backend config is
  # supplied per environment via `terraform init -backend-config=...`.
  backend "local" {}
}

provider "docker" {
  host = var.docker_host
}
