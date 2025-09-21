# CaddyAI Infrastructure Variables

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "caddyai"
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnets" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnets" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

# EKS Configuration
variable "eks_cluster_version" {
  description = "EKS cluster version"
  type        = string
  default     = "1.28"
}

variable "eks_node_groups" {
  description = "EKS node group configurations"
  type = map(object({
    ami_type       = string
    capacity_type  = string
    instance_types = list(string)
    scaling_config = object({
      desired_size = number
      max_size     = number
      min_size     = number
    })
  }))
  default = {
    general = {
      ami_type       = "AL2_x86_64"
      capacity_type  = "ON_DEMAND"
      instance_types = ["t3.medium"]
      scaling_config = {
        desired_size = 2
        max_size     = 10
        min_size     = 1
      }
    }
    gpu = {
      ami_type       = "AL2_x86_64_GPU"
      capacity_type  = "ON_DEMAND"
      instance_types = ["g4dn.xlarge"]
      scaling_config = {
        desired_size = 1
        max_size     = 3
        min_size     = 0
      }
    }
  }
}

# RDS Configuration
variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
  default     = 7
}

# Environment-specific overrides
variable "environment_configs" {
  description = "Environment-specific configurations"
  type = map(object({
    eks_node_groups = optional(map(object({
      ami_type       = string
      capacity_type  = string
      instance_types = list(string)
      scaling_config = object({
        desired_size = number
        max_size     = number
        min_size     = number
      })
    })))
    rds_instance_class = optional(string)
    rds_multi_az      = optional(bool)
  }))
  default = {
    dev = {
      rds_instance_class = "db.t3.micro"
      rds_multi_az      = false
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
    }
    staging = {
      rds_instance_class = "db.t3.small"
      rds_multi_az      = false
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
    }
    prod = {
      rds_instance_class = "db.r5.large"
      rds_multi_az      = true
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
    }
  }
}