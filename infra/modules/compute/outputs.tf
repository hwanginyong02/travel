output "front_public_ip" {
  value = aws_instance.front.public_ip
}

output "front_public_dns" {
  value = aws_instance.front.public_dns
}

output "back_public_ip" {
  value = aws_instance.back.public_ip
}

output "back_public_dns" {
  value = aws_instance.back.public_dns
}
