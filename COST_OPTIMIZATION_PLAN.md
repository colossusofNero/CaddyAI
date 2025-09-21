# CaddyAI Cost Optimization Plan

## Overview
This document outlines comprehensive cost optimization strategies for CaddyAI infrastructure, targeting a 30-40% reduction in AWS costs while maintaining performance and reliability.

## Current Cost Analysis

### Estimated Monthly Costs (Production)
| Service | Cost | Percentage | Optimization Potential |
|---------|------|------------|----------------------|
| EKS Cluster | $2,500 | 35% | High (25-40%) |
| RDS Database | $1,800 | 25% | Medium (15-25%) |
| EC2 Instances | $1,500 | 21% | High (30-50%) |
| Data Transfer | $600 | 8% | Medium (20-30%) |
| Storage (EBS/EFS) | $400 | 6% | Low (10-15%) |
| CloudFront CDN | $200 | 3% | Low (5-10%) |
| Other Services | $150 | 2% | Medium (15-20%) |
| **Total** | **$7,150** | **100%** | **Target: $4,500** |

## Cost Optimization Strategies

### 1. Compute Optimization

#### 1.1 EC2 Instance Right-Sizing
```yaml
# Current vs Optimized Instance Types
Current:
  - API: t3.large (2 vCPU, 8GB RAM) - $0.0832/hour
  - Voice: g4dn.xlarge (4 vCPU, 16GB RAM, 1 GPU) - $0.526/hour

Optimized:
  - API: t3.medium (2 vCPU, 4GB RAM) - $0.0416/hour (50% savings)
  - Voice: g4dn.large (2 vCPU, 8GB RAM, 1 GPU) - $0.263/hour (50% savings)
```

#### 1.2 Spot Instances for Development
```yaml
# Terraform configuration for Spot instances
eks_node_groups = {
  spot = {
    ami_type      = "AL2_x86_64"
    capacity_type = "SPOT"
    instance_types = ["t3.medium", "t3.large", "m5.large"]
    scaling_config = {
      desired_size = 3
      max_size     = 10
      min_size     = 1
    }
  }
}
```

#### 1.3 Auto-Scaling Optimization
```yaml
# Kubernetes HPA with custom metrics
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: caddyai-api-cost-optimized
spec:
  minReplicas: 1  # Reduced from 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80  # Increased from 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 85  # Increased from 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 900  # Wait longer before scaling down
      policies:
      - type: Percent
        value: 25  # Scale down more aggressively
        periodSeconds: 60
```

### 2. Database Optimization

#### 2.1 RDS Instance Right-Sizing
```hcl
# Terraform configuration for cost-optimized RDS
resource "aws_db_instance" "main" {
  instance_class = var.environment == "prod" ? "db.r5.large" : "db.t3.small"

  # Enable automated scaling
  max_allocated_storage = var.environment == "prod" ? 1000 : 100

  # Optimize backup retention
  backup_retention_period = var.environment == "prod" ? 7 : 1

  # Use GP2 instead of GP3 for smaller workloads
  storage_type = var.db_allocated_storage < 100 ? "gp2" : "gp3"
}
```

#### 2.2 Read Replica Optimization
```hcl
# Create read replicas only for production
resource "aws_db_instance" "read_replica" {
  count = var.environment == "prod" && var.create_read_replica ? 1 : 0

  replicate_source_db = aws_db_instance.main.identifier
  instance_class      = "db.r5.large"  # Smaller than primary

  # Schedule read replica to run only during business hours
  auto_minor_version_upgrade = true
}
```

#### 2.3 Connection Pooling
```yaml
# PgBouncer deployment for connection pooling
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pgbouncer
spec:
  template:
    spec:
      containers:
      - name: pgbouncer
        image: pgbouncer/pgbouncer:latest
        env:
        - name: DATABASES_HOST
          value: "caddyai-postgres"
        - name: DATABASES_PORT
          value: "5432"
        - name: DATABASES_USER
          value: "caddyai"
        - name: DATABASES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: caddyai-secrets
              key: database-password
        - name: POOL_MODE
          value: "transaction"
        - name: MAX_CLIENT_CONN
          value: "1000"
        - name: DEFAULT_POOL_SIZE
          value: "20"  # Reduced pool size
```

### 3. Storage Optimization

#### 3.1 S3 Lifecycle Policies
```json
{
  "Rules": [
    {
      "ID": "CaddyAI-Lifecycle-Policy",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        },
        {
          "Days": 365,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ]
    }
  ]
}
```

#### 3.2 EBS Volume Optimization
```hcl
# Terraform for optimized EBS volumes
resource "aws_ebs_volume" "optimized" {
  availability_zone = var.availability_zone
  size             = 20  # Start smaller
  type             = "gp3"

  # Optimize IOPS and throughput
  iops       = 3000  # Baseline, can be increased as needed
  throughput = 125   # MB/s baseline

  # Enable encryption
  encrypted = true

  tags = {
    Name = "caddyai-optimized-volume"
  }
}
```

#### 3.3 EFS Performance Mode
```hcl
# Use bursting performance mode for cost savings
resource "aws_efs_file_system" "models" {
  performance_mode = "generalPurpose"  # Instead of provisioned
  throughput_mode  = "bursting"        # Pay-per-use

  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }
}
```

### 4. Network Optimization

#### 4.1 VPC Endpoints
```hcl
# Add VPC endpoints to reduce data transfer costs
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.s3"

  tags = {
    Name = "CaddyAI S3 VPC Endpoint"
  }
}

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.us-east-1.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
}
```

#### 4.2 CloudFront Optimization
```yaml
# CloudFront distribution with cost optimization
Resources:
  CaddyAICDN:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        PriceClass: PriceClass_100  # US, Canada, Europe only
        DefaultCacheBehavior:
          Compress: true
          CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad  # CachingOptimized
```

### 5. Monitoring and Alerting for Cost Control

#### 5.1 AWS Budgets
```yaml
# CloudFormation template for budget alerts
Resources:
  CaddyAIBudget:
    Type: AWS::Budgets::Budget
    Properties:
      Budget:
        BudgetName: CaddyAI-Monthly-Budget
        BudgetLimit:
          Amount: 5000
          Unit: USD
        TimeUnit: MONTHLY
        BudgetType: COST
      NotificationsWithSubscribers:
        - Notification:
            NotificationType: ACTUAL
            ComparisonOperator: GREATER_THAN
            Threshold: 80
          Subscribers:
            - SubscriptionType: EMAIL
              Address: finance@caddyai.com
        - Notification:
            NotificationType: FORECASTED
            ComparisonOperator: GREATER_THAN
            Threshold: 100
          Subscribers:
            - SubscriptionType: EMAIL
              Address: cto@caddyai.com
```

#### 5.2 Cost Anomaly Detection
```hcl
resource "aws_ce_anomaly_detector" "caddyai_cost_anomaly" {
  name     = "caddyai-cost-anomaly-detector"
  type     = "DIMENSIONAL"

  specification = jsonencode({
    DimensionKey = "SERVICE"
    Operator     = "EQUALS"
    Values       = ["Amazon Elastic Kubernetes Service", "Amazon RDS", "Amazon EC2-Instance"]
  })

  tags = {
    Name = "CaddyAI Cost Anomaly Detector"
  }
}

resource "aws_ce_anomaly_subscription" "caddyai_cost_anomaly" {
  name      = "caddyai-cost-anomaly-subscription"
  frequency = "DAILY"

  monitor_arn_list = [
    aws_ce_anomaly_detector.caddyai_cost_anomaly.arn
  ]

  subscriber {
    type    = "EMAIL"
    address = "finance@caddyai.com"
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
}
```

### 6. Development Environment Optimization

#### 6.1 Scheduled Shutdown
```yaml
# CronJob to shut down dev environments
apiVersion: batch/v1
kind: CronJob
metadata:
  name: dev-environment-shutdown
spec:
  schedule: "0 19 * * 1-5"  # Shutdown at 7 PM weekdays
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: shutdown-script
            image: bitnami/kubectl
            command:
            - /bin/sh
            - -c
            - |
              kubectl scale deployment --all --replicas=0 -n caddyai-dev
              # Stop RDS instance
              aws rds stop-db-instance --db-instance-identifier caddyai-dev
          restartPolicy: OnFailure
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: dev-environment-startup
spec:
  schedule: "0 8 * * 1-5"  # Start at 8 AM weekdays
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: startup-script
            image: bitnami/kubectl
            command:
            - /bin/sh
            - -c
            - |
              # Start RDS instance
              aws rds start-db-instance --db-instance-identifier caddyai-dev
              # Scale up deployments
              kubectl scale deployment caddyai-api --replicas=1 -n caddyai-dev
              kubectl scale deployment caddyai-voice --replicas=1 -n caddyai-dev
          restartPolicy: OnFailure
```

#### 6.2 Ephemeral Environments
```yaml
# GitHub Actions workflow for ephemeral environments
name: Ephemeral Environment
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  deploy-ephemeral:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Ephemeral Environment
        run: |
          # Create namespace with TTL
          kubectl create namespace pr-${{ github.event.number }}
          kubectl annotate namespace pr-${{ github.event.number }} \
            janitor/expires=$(date -d '+2 hours' --iso-8601=seconds)

          # Deploy lightweight version
          kubectl apply -k k8s/overlays/ephemeral -n pr-${{ github.event.number }}
```

### 7. Reserved Instances and Savings Plans

#### 7.1 EC2 Reserved Instances Strategy
```yaml
# Reserved Instance Plan
Production:
  - Instance Type: t3.medium
  - Quantity: 3 (for consistent baseline)
  - Term: 1 year
  - Payment: Partial upfront
  - Savings: ~40%

Staging:
  - Use On-Demand for flexibility
  - Spot instances for testing workloads
```

#### 7.2 RDS Reserved Instances
```yaml
# RDS Reserved Instance Plan
Production:
  - Instance Class: db.r5.large
  - Engine: PostgreSQL
  - Term: 1 year
  - Payment: All upfront
  - Savings: ~45%

Development:
  - Use On-Demand for flexibility
  - Aurora Serverless for variable workloads
```

### 8. Application-Level Optimizations

#### 8.1 Caching Strategy
```yaml
# Redis configuration for better caching
redis_config:
  maxmemory: "2gb"
  maxmemory_policy: "allkeys-lru"

# Application cache settings
cache_settings:
  voice_models:
    ttl: 3600  # 1 hour
    max_size: "1gb"
  api_responses:
    ttl: 300   # 5 minutes
    max_size: "100mb"
```

#### 8.2 Resource Limits Optimization
```yaml
# Kubernetes resource limits
resources:
  requests:
    memory: "256Mi"  # Reduced from 512Mi
    cpu: "200m"      # Reduced from 250m
  limits:
    memory: "512Mi"  # Reduced from 1Gi
    cpu: "500m"      # Reduced from 1000m
```

### 9. Cost Monitoring Dashboard

#### 9.1 Grafana Dashboard Configuration
```json
{
  "dashboard": {
    "title": "CaddyAI Cost Monitoring",
    "panels": [
      {
        "title": "Daily AWS Costs",
        "type": "graph",
        "targets": [
          {
            "expr": "aws_billing_estimated_charges",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "Cost per Service",
        "type": "piechart",
        "targets": [
          {
            "expr": "aws_billing_estimated_charges_by_service",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "Monthly Cost Trend",
        "type": "graph",
        "targets": [
          {
            "expr": "increase(aws_billing_estimated_charges[30d])",
            "legendFormat": "Monthly Cost"
          }
        ]
      }
    ]
  }
}
```

## Implementation Timeline

### Phase 1 (Week 1-2): Quick Wins
- [ ] Right-size EC2 instances in development
- [ ] Implement S3 lifecycle policies
- [ ] Add VPC endpoints
- [ ] Set up cost monitoring alerts

**Expected Savings**: 15-20%

### Phase 2 (Week 3-4): Infrastructure Optimization
- [ ] Implement Spot instances for development
- [ ] Optimize EKS node groups
- [ ] Add connection pooling
- [ ] Implement scheduled shutdown for dev environments

**Expected Savings**: Additional 10-15%

### Phase 3 (Week 5-6): Advanced Optimization
- [ ] Purchase Reserved Instances
- [ ] Implement advanced caching
- [ ] Optimize application resource usage
- [ ] Fine-tune auto-scaling policies

**Expected Savings**: Additional 10-15%

### Phase 4 (Week 7-8): Monitoring and Refinement
- [ ] Deploy comprehensive cost monitoring
- [ ] Implement cost anomaly detection
- [ ] Create automated optimization reports
- [ ] Establish ongoing cost review processes

## Cost Optimization Scripts

### 9.1 Automated Cost Analysis Script
```bash
#!/bin/bash
# cost-analyzer.sh

aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-02-01 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --output table

# Generate recommendations
aws ce get-rightsizing-recommendation \
  --service EC2-Instance \
  --configuration '{"BenefitsConsidered": true, "RecommendationTarget": "CROSS_INSTANCE_FAMILY"}' \
  --output table
```

### 9.2 Resource Utilization Monitor
```python
#!/usr/bin/env python3
# resource-monitor.py

import boto3
import json
from datetime import datetime, timedelta

def get_resource_utilization():
    cloudwatch = boto3.client('cloudwatch')

    # Get EKS cluster metrics
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=7)

    cpu_metrics = cloudwatch.get_metric_statistics(
        Namespace='AWS/EKS',
        MetricName='cluster_node_cpu_utilization_percent',
        Dimensions=[
            {'Name': 'ClusterName', 'Value': 'caddyai-prod'}
        ],
        StartTime=start_time,
        EndTime=end_time,
        Period=3600,
        Statistics=['Average']
    )

    avg_cpu = sum(point['Average'] for point in cpu_metrics['Datapoints']) / len(cpu_metrics['Datapoints'])

    print(f"Average CPU Utilization: {avg_cpu:.2f}%")

    if avg_cpu < 30:
        print("⚠️  Recommendation: Consider downsizing instances")
    elif avg_cpu > 80:
        print("⚠️  Recommendation: Consider upsizing instances")
    else:
        print("✅ CPU utilization is optimal")

if __name__ == "__main__":
    get_resource_utilization()
```

## Success Metrics

### Key Performance Indicators (KPIs)
- **Total Monthly Cost**: Target reduction from $7,150 to $4,500 (37% savings)
- **Cost per User**: Track cost efficiency as user base grows
- **Infrastructure Utilization**: CPU/Memory utilization > 60%
- **Cost Variance**: Monthly cost variance < 10%

### Monitoring and Reporting
- **Daily**: Automated cost alerts for budget thresholds
- **Weekly**: Resource utilization reports
- **Monthly**: Comprehensive cost optimization review
- **Quarterly**: Reserved instance and savings plan analysis

## Risk Mitigation

### Performance Impact Assessment
- Monitor application response times during optimization
- Maintain SLA compliance (99.9% uptime)
- Implement gradual rollouts for resource changes

### Rollback Procedures
- Document all changes with rollback instructions
- Test optimizations in staging first
- Maintain infrastructure as code for quick recovery

## Conclusion

This comprehensive cost optimization plan targets a 37% reduction in AWS costs while maintaining system performance and reliability. The phased approach ensures minimal risk while maximizing savings opportunities.

**Expected Annual Savings**: $31,800 (from $85,800 to $54,000)

The plan focuses on:
1. Right-sizing resources based on actual usage
2. Leveraging cost-effective instance types and pricing models
3. Implementing intelligent caching and resource management
4. Establishing robust monitoring and alerting
5. Creating automated optimization processes

Regular reviews and adjustments will ensure continued cost optimization as the system scales and evolves.