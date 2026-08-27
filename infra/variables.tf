variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "ap-northeast-2"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "travel"
}

variable "environment" {
  description = "Environment name (dev, stage, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# --- Compute Variables ---
variable "ec2_instance_type" {
  description = "EC2 instance type for Front and Back servers"
  type        = string
  default     = "t3.small"
}


variable "ec2_password" {
  description = "Password for EC2 ubuntu user"
  type        = string
  sensitive   = true
  default     = "your_ec2_password"
}

# --- Database Variables ---
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "PostgreSQL Database Name"
  type        = string
  default     = "travel_db"
}

variable "db_username" {
  description = "PostgreSQL Master Username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "PostgreSQL Master Password"
  type        = string
  sensitive   = true
  default     = "your_db_password"
}
