# Production Environment Configuration

environment = "prod"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr = "10.2.0.0/16"

# EKS Configuration
eks_cluster_version = "1.28"
eks_node_groups = {
  general = {
    ami_type       = "AL2_x86_64"
    capacity_type  = "ON_DEMAND"
    instance_types = ["t3.large"]
    scaling_config = {
      desired_size = 3
      max_size     = 20
      min_size     = 2
    }
  }
  gpu = {
    ami_type       = "AL2_x86_64_GPU"
    capacity_type  = "ON_DEMAND"
    instance_types = ["g4dn.xlarge"]
    scaling_config = {
      desired_size = 2
      max_size     = 5
      min_size     = 1
    }
  }
}

# RDS Configuration
rds_instance_class          = "db.r5.large"
rds_allocated_storage       = 100
rds_backup_retention_period = 30

# Domain for production
domain_name = "caddyai.com"