# Monitoring Module Outputs

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_log_group_application" {
  description = "Application CloudWatch log group name"
  value       = aws_cloudwatch_log_group.application_logs.name
}

output "cloudwatch_log_group_voice_processing" {
  description = "Voice processing CloudWatch log group name"
  value       = aws_cloudwatch_log_group.voice_processing_logs.name
}

output "cloudwatch_log_group_api" {
  description = "API CloudWatch log group name"
  value       = aws_cloudwatch_log_group.api_logs.name
}

output "dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "cost_anomaly_detector_arn" {
  description = "ARN of the cost anomaly detector"
  value       = var.environment == "prod" ? aws_ce_anomaly_detector.cost_anomaly[0].arn : null
}