# Staging Environment Configuration

environment = "staging"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr = "10.1.0.0/16"

# EKS Configuration
eks_cluster_version = "1.28"
eks_node_groups = {
  general = {
    ami_type       = "AL2_x86_64"
    capacity_type  = "ON_DEMAND"
    instance_types = ["t3.medium"]
    scaling_config = {
      desired_size = 2
      max_size     = 5
      min_size     = 1
    }
  }
}

# RDS Configuration
rds_instance_class          = "db.t3.small"
rds_allocated_storage       = 50
rds_backup_retention_period = 7

# Domain for staging
domain_name = "staging.caddyai.com"