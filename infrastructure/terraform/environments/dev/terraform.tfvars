# Development Environment Configuration

environment = "dev"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"

# EKS Configuration
eks_cluster_version = "1.28"
eks_node_groups = {
  general = {
    ami_type       = "AL2_x86_64"
    capacity_type  = "SPOT"
    instance_types = ["t3.small"]
    scaling_config = {
      desired_size = 1
      max_size     = 3
      min_size     = 1
    }
  }
}

# RDS Configuration
rds_instance_class          = "db.t3.micro"
rds_allocated_storage       = 20
rds_backup_retention_period = 1

# Domain (leave empty for dev)
domain_name = ""