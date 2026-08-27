# --- VPC Module ---
module "vpc" {
  source       = "./modules/vpc"
  project_name = var.project_name
  aws_region   = var.aws_region
  vpc_cidr     = var.vpc_cidr
}

# --- Compute Module (EC2 Front & Back) ---
module "compute" {
  source                  = "./modules/compute"
  project_name            = var.project_name
  ec2_instance_type       = var.ec2_instance_type
  ec2_password            = var.ec2_password
  public_subnet_id        = module.vpc.public_subnet_1_id
  front_sg_id             = module.vpc.front_sg_id
  back_sg_id              = module.vpc.back_sg_id
  front_eip_allocation_id = var.front_eip_allocation_id
  back_eip_allocation_id  = var.back_eip_allocation_id
}

# --- Database Module (RDS PostgreSQL) ---
module "database" {
  source               = "./modules/database"
  project_name         = var.project_name
  db_instance_class    = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  db_name              = var.db_name
  db_username          = var.db_username
  db_password          = var.db_password
  private_subnet_ids   = [module.vpc.private_subnet_1_id, module.vpc.private_subnet_2_id]
  rds_sg_id            = module.vpc.rds_sg_id
}

# ==============================================================================
# State Migration (Moved Blocks to avoid destroying existing AWS resources)
# ==============================================================================

moved {
  from = aws_vpc.main
  to   = module.vpc.aws_vpc.main
}

moved {
  from = aws_internet_gateway.igw
  to   = module.vpc.aws_internet_gateway.igw
}

moved {
  from = aws_subnet.public_1
  to   = module.vpc.aws_subnet.public_1
}

moved {
  from = aws_subnet.public_2
  to   = module.vpc.aws_subnet.public_2
}

moved {
  from = aws_subnet.private_1
  to   = module.vpc.aws_subnet.private_1
}

moved {
  from = aws_subnet.private_2
  to   = module.vpc.aws_subnet.private_2
}

moved {
  from = aws_route_table.public
  to   = module.vpc.aws_route_table.public
}

moved {
  from = aws_route_table_association.public_1
  to   = module.vpc.aws_route_table_association.public_1
}

moved {
  from = aws_route_table_association.public_2
  to   = module.vpc.aws_route_table_association.public_2
}

moved {
  from = aws_route_table.private
  to   = module.vpc.aws_route_table.private
}

moved {
  from = aws_route_table_association.private_1
  to   = module.vpc.aws_route_table_association.private_1
}

moved {
  from = aws_route_table_association.private_2
  to   = module.vpc.aws_route_table_association.private_2
}

moved {
  from = aws_security_group.front_sg
  to   = module.vpc.aws_security_group.front_sg
}

moved {
  from = aws_security_group.back_sg
  to   = module.vpc.aws_security_group.back_sg
}

moved {
  from = aws_security_group.rds_sg
  to   = module.vpc.aws_security_group.rds_sg
}

moved {
  from = aws_instance.front
  to   = module.compute.aws_instance.front
}

moved {
  from = aws_instance.back
  to   = module.compute.aws_instance.back
}

moved {
  from = aws_db_subnet_group.rds_subnet_group
  to   = module.database.aws_db_subnet_group.rds_subnet_group
}

moved {
  from = aws_db_instance.postgres
  to   = module.database.aws_db_instance.postgres
}
