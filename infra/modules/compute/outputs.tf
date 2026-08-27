output "front_public_ip" {
  value = aws_eip.front_eip.public_ip
}

output "front_public_dns" {
  value = aws_eip.front_eip.public_dns
}

output "back_public_ip" {
  value = aws_eip.back_eip.public_ip
}

output "back_public_dns" {
  value = aws_eip.back_eip.public_dns
}

