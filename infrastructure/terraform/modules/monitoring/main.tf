# Monitoring Module for CaddyAI

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application_logs" {
  name              = "/aws/caddyai/${var.environment}/application"
  retention_in_days = var.log_retention_in_days

  tags = {
    Name = "CaddyAI Application Logs ${var.environment}"
  }
}

resource "aws_cloudwatch_log_group" "voice_processing_logs" {
  name              = "/aws/caddyai/${var.environment}/voice-processing"
  retention_in_days = var.log_retention_in_days

  tags = {
    Name = "CaddyAI Voice Processing Logs ${var.environment}"
  }
}

resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/caddyai/${var.environment}/api"
  retention_in_days = var.log_retention_in_days

  tags = {
    Name = "CaddyAI API Logs ${var.environment}"
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "caddyai-${var.environment}-alerts"

  tags = {
    Name = "CaddyAI Alerts ${var.environment}"
  }
}

resource "aws_sns_topic_subscription" "email_alerts" {
  count = length(var.alert_email_addresses)

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email_addresses[count.index]
}

# CloudWatch Dashboards
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "CaddyAI-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.load_balancer_arn_suffix],
            [".", "TargetResponseTime", ".", "."],
            [".", "HTTPCode_Target_2XX_Count", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "API Performance Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["CaddyAI", "VoiceProcessingSuccess", "Environment", var.environment],
            [".", "VoiceProcessingFailure", ".", "."],
            [".", "VoiceProcessingLatency", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Voice Processing Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/EKS", "cluster_failed_request_count", "cluster_name", var.cluster_name],
            [".", "cluster_node_count", ".", "."],
            [".", "cluster_pod_count", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "EKS Cluster Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["CaddyAI", "UserEngagement", "Environment", var.environment],
            [".", "ActiveUsers", ".", "."],
            [".", "SessionDuration", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "User Engagement Metrics"
          period  = 300
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 12
        width  = 24
        height = 6

        properties = {
          query   = "SOURCE '${aws_cloudwatch_log_group.application_logs.name}' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 100"
          region  = data.aws_region.current.name
          title   = "Recent Errors"
        }
      }
    ]
  })
}

# CloudWatch Alarms for API Response Time
resource "aws_cloudwatch_metric_alarm" "high_response_time" {
  alarm_name          = "caddyai-${var.environment}-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "2.0"
  alarm_description   = "This metric monitors API response time"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = var.load_balancer_arn_suffix
  }

  tags = {
    Name = "CaddyAI High Response Time ${var.environment}"
  }
}

# CloudWatch Alarms for Error Rate
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "caddyai-${var.environment}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API error rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = var.load_balancer_arn_suffix
  }

  tags = {
    Name = "CaddyAI High Error Rate ${var.environment}"
  }
}

# Custom CloudWatch Alarms for Voice Processing
resource "aws_cloudwatch_metric_alarm" "voice_processing_failure_rate" {
  alarm_name          = "caddyai-${var.environment}-voice-processing-failure-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "VoiceProcessingFailure"
  namespace           = "CaddyAI"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors voice processing failure rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    Environment = var.environment
  }

  tags = {
    Name = "CaddyAI Voice Processing Failure Rate ${var.environment}"
  }
}

# EKS CloudWatch Container Insights
resource "aws_eks_addon" "container_insights" {
  count = var.enable_container_insights ? 1 : 0

  cluster_name = var.cluster_name
  addon_name   = "amazon-cloudwatch-observability"

  tags = {
    Name = "CaddyAI Container Insights ${var.environment}"
  }
}

# X-Ray Tracing (optional)
resource "aws_xray_sampling_rule" "caddyai" {
  count = var.enable_xray ? 1 : 0

  rule_name      = "CaddyAI-${var.environment}"
  priority       = 10000
  version        = 1
  reservoir_size = 10
  fixed_rate     = 0.1
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "caddyai-${var.environment}"
  resource_arn   = "*"

  tags = {
    Name = "CaddyAI X-Ray Sampling Rule ${var.environment}"
  }
}

# Application-specific custom metrics
resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "caddyai-${var.environment}-error-count"
  log_group_name = aws_cloudwatch_log_group.application_logs.name
  pattern        = "[timestamp, request_id, level=\"ERROR\", ...]"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "CaddyAI"
    value     = "1"

    default_value = "0"
  }
}

resource "aws_cloudwatch_log_metric_filter" "voice_processing_latency" {
  name           = "caddyai-${var.environment}-voice-processing-latency"
  log_group_name = aws_cloudwatch_log_group.voice_processing_logs.name
  pattern        = "[timestamp, request_id, level, message=\"Processing completed\", duration]"

  metric_transformation {
    name      = "VoiceProcessingLatency"
    namespace = "CaddyAI"
    value     = "$duration"

    default_value = "0"
  }
}

# Cost anomaly detection
resource "aws_ce_anomaly_detector" "cost_anomaly" {
  count = var.environment == "prod" ? 1 : 0

  name = "caddyai-${var.environment}-cost-anomaly"
  type = "DIMENSIONAL"

  specification = jsonencode({
    DimensionKey = "SERVICE"
    Operator     = "EQUALS"
    Values       = ["Amazon Elastic Kubernetes Service", "Amazon RDS", "Amazon CloudFront"]
  })

  tags = {
    Name = "CaddyAI Cost Anomaly Detector ${var.environment}"
  }
}

resource "aws_ce_anomaly_subscription" "cost_anomaly" {
  count = var.environment == "prod" && length(var.alert_email_addresses) > 0 ? 1 : 0

  name      = "caddyai-${var.environment}-cost-anomaly-subscription"
  frequency = "DAILY"

  monitor_arn_list = [
    aws_ce_anomaly_detector.cost_anomaly[0].arn
  ]

  subscriber {
    type    = "EMAIL"
    address = var.alert_email_addresses[0]
  }

  threshold_expression {
    and {
      dimension {
        key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
        values        = ["100"]
        match_options = ["GREATER_THAN_OR_EQUAL"]
      }
    }
  }

  tags = {
    Name = "CaddyAI Cost Anomaly Subscription ${var.environment}"
  }
}

data "aws_region" "current" {}