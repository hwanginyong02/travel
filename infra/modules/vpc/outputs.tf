output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_1_id" {
  value = aws_subnet.public_1.id
}

output "public_subnet_2_id" {
  value = aws_subnet.public_2.id
}

output "private_subnet_1_id" {
  value = aws_subnet.private_1.id
}

output "private_subnet_2_id" {
  value = aws_subnet.private_2.id
}

output "front_sg_id" {
  value = aws_security_group.front_sg.id
}

output "back_sg_id" {
  value = aws_security_group.back_sg.id
}

output "rds_sg_id" {
  value = aws_security_group.rds_sg.id
}
