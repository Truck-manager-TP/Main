variable "environment" {
  description = "Target environment (dev | uat | prod)."
  type        = string
  validation {
    condition     = contains(["dev", "uat", "prod"], var.environment)
    error_message = "environment must be one of: dev, uat, prod."
  }
}

variable "docker_host" {
  description = "Docker daemon endpoint."
  type        = string
  default     = "npipe:////./pipe/docker_engine" # Windows default; use unix:///var/run/docker.sock on Linux
}

variable "app_image" {
  description = "Fully qualified application image (registry/name:tag)."
  type        = string
  default     = "tptruck/truck-fleet:1.0.0"
}

variable "app_replicas" {
  description = "Number of application replicas to run."
  type        = number
  default     = 1
}

variable "app_port" {
  description = "Host port to publish for the application."
  type        = number
  default     = 8080
}

variable "db_name" {
  type    = string
  default = "tptruck"
}

variable "db_user" {
  type    = string
  default = "tptruck"
}

variable "db_password" {
  description = "DB password - injected from a secret store, never hard-coded."
  type        = string
  sensitive   = true
}

variable "cpu_limit" {
  type    = number
  default = 1.0
}

variable "memory_limit_mb" {
  type    = number
  default = 1024
}
