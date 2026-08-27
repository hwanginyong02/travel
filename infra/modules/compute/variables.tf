variable "project_name" {
  type = string
}

variable "ec2_instance_type" {
  type    = string
  default = "t3.micro"
}

variable "ec2_password" {
  type      = string
  sensitive = true
}

variable "public_subnet_id" {
  type = string
}

variable "front_sg_id" {
  type = string
}

variable "back_sg_id" {
  type = string
}
