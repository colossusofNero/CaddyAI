# RDS Module Outputs

output "instance_id" {
  description = "The RDS instance ID"
  value       = aws_db_instance.main.id
}

output "instance_arn" {
  description = "The ARN of the RDS instance"
  value       = aws_db_instance.main.arn
}

output "instance_endpoint" {
  description = "The RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "instance_hosted_zone_id" {
  description = "The canonical hosted zone ID of the DB instance"
  value       = aws_db_instance.main.hosted_zone_id
}

output "instance_port" {
  description = "The RDS instance port"
  value       = aws_db_instance.main.port
}

output "instance_status" {
  description = "The RDS instance status"
  value       = aws_db_instance.main.status
}

output "database_name" {
  description = "The database name"
  value       = aws_db_instance.main.db_name
}

output "database_username" {
  description = "The master username for the database"
  value       = aws_db_instance.main.username
}

output "db_subnet_group_id" {
  description = "The db subnet group name"
  value       = aws_db_subnet_group.main.id
}

output "security_group_id" {
  description = "The ID of the security group"
  value       = aws_security_group.rds.id
}

output "kms_key_id" {
  description = "The KMS key ID used for encryption"
  value       = aws_kms_key.rds.key_id
}

output "secrets_manager_secret_arn" {
  description = "The ARN of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "secrets_manager_secret_name" {
  description = "The name of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.name
}

output "read_replica_id" {
  description = "The RDS read replica instance ID"
  value       = var.create_read_replica && var.environment == "prod" ? aws_db_instance.read_replica[0].id : null
}

output "read_replica_endpoint" {
  description = "The RDS read replica instance endpoint"
  value       = var.create_read_replica && var.environment == "prod" ? aws_db_instance.read_replica[0].endpoint : null
}