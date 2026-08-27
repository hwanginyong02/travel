output "front_public_ip" {
  description = "Public IP address of Frontend EC2 instance"
  value       = module.compute.front_public_ip
}

output "front_public_dns" {
  description = "Public DNS of Frontend EC2 instance"
  value       = module.compute.front_public_dns
}

output "back_public_ip" {
  description = "Public IP address of Backend EC2 instance"
  value       = module.compute.back_public_ip
}

output "back_public_dns" {
  description = "Public DNS of Backend EC2 instance"
  value       = module.compute.back_public_dns
}

output "rds_endpoint" {
  description = "Connection endpoint for RDS PostgreSQL"
  value       = module.database.rds_endpoint
}

output "rds_address" {
  description = "Hostname of RDS PostgreSQL instance"
  value       = module.database.rds_address
}

output "rds_db_name" {
  description = "Database name"
  value       = module.database.rds_db_name
}

output "backend_database_url_template" {
  description = "DATABASE_URL environment variable format for Backend FastAPI"
  value       = "postgresql://${var.db_username}:${var.db_password}@${module.database.rds_address}:5432/${module.database.rds_db_name}"
  sensitive   = true
}

output "ssh_front_command" {
  description = "SSH Command to access Front EC2"
  value       = "ssh ubuntu@${module.compute.front_public_ip}"
}

output "ssh_back_command" {
  description = "SSH Command to access Back EC2"
  value       = "ssh ubuntu@${module.compute.back_public_ip}"
}
