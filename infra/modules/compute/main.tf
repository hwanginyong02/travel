# --- AMI Data Source (Ubuntu 22.04 LTS) ---
data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

locals {
  user_data_script = <<-EOF
    #!/bin/bash
    set -e
    
    # System Update & Prereqs
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg lsb-release git

    # Add Docker GPG key & Repo
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker & Docker Compose
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-compose

    # Enable and start Docker
    systemctl enable docker
    systemctl start docker

    # Add ubuntu user to docker group
    usermod -aG docker ubuntu

    # Enable cloud-init & SSH Password Authentication
    sed -i 's/ssh_pwauth: .*/ssh_pwauth: true/' /etc/cloud/cloud.cfg || true
    echo "ssh_pwauth: true" >> /etc/cloud/cloud.cfg

    echo "PasswordAuthentication yes" > /etc/ssh/sshd_config.d/60-password-auth.conf
    sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/g' /etc/ssh/sshd_config.d/*.conf || true
    sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication yes/' /etc/ssh/sshd_config || true

    # Set password for ubuntu user
    echo "ubuntu:${var.ec2_password}" | chpasswd

    # Restart SSH daemon
    systemctl restart ssh || systemctl restart sshd
  EOF


}

# --- Front EC2 Instance (Next.js) ---
resource "aws_instance" "front" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.ec2_instance_type
  subnet_id                   = var.public_subnet_id
  vpc_security_group_ids      = [var.front_sg_id]
  associate_public_ip_address = true

  user_data                   = local.user_data_script
  user_data_replace_on_change = true

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = {
    Name = "${var.project_name}-front-ec2"
  }
}

# --- Back EC2 Instance (FastAPI) ---
resource "aws_instance" "back" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.ec2_instance_type
  subnet_id                   = var.public_subnet_id
  vpc_security_group_ids      = [var.back_sg_id]
  associate_public_ip_address = true

  user_data                   = local.user_data_script
  user_data_replace_on_change = true

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = {
    Name = "${var.project_name}-back-ec2"
  }
}

# --- Elastic IPs (고정 IP) ---
resource "aws_eip" "front_eip" {
  instance = aws_instance.front.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-front-eip"
  }
}

resource "aws_eip" "back_eip" {
  instance = aws_instance.back.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-back-eip"
  }
}

