output "environment" {
  value = var.environment
}

output "network" {
  value = docker_network.tptruck.name
}

output "app_endpoint" {
  description = "Where the platform is reachable for this environment."
  value       = "http://localhost:${var.app_port}"
}

output "app_containers" {
  value = [for c in docker_container.app : c.name]
}
