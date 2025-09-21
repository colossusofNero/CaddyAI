# CaddyAI Disaster Recovery Plan

## Overview
This document outlines the disaster recovery procedures for CaddyAI infrastructure and applications. The plan is designed to ensure business continuity and minimize downtime in case of various failure scenarios.

## Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)

| Service | RTO | RPO | Description |
|---------|-----|-----|-------------|
| API Service | 15 minutes | 5 minutes | Core application functionality |
| Voice Processing | 30 minutes | 10 minutes | AI voice processing capabilities |
| Database | 1 hour | 15 minutes | User data and application state |
| Static Assets | 5 minutes | 1 hour | CDN cached content |

## Infrastructure Components

### 1. AWS Multi-Region Setup

#### Primary Region: us-east-1
- Production workloads
- Primary database
- Primary EKS cluster

#### Secondary Region: us-west-2
- Disaster recovery environment
- Cross-region database replication
- Standby EKS cluster

### 2. Database Backup and Recovery

#### Automated Backups
- **RDS Automated Backups**: 30-day retention for production
- **Point-in-time recovery**: Available for last 30 days
- **Cross-region snapshots**: Daily snapshots replicated to secondary region
- **Backup verification**: Weekly automated restore tests

#### Manual Backup Procedures
```bash
# Create manual snapshot
aws rds create-db-snapshot \
    --db-instance-identifier caddyai-prod \
    --db-snapshot-identifier caddyai-manual-$(date +%Y%m%d-%H%M%S)

# Copy snapshot to DR region
aws rds copy-db-snapshot \
    --source-db-snapshot-identifier caddyai-manual-$(date +%Y%m%d-%H%M%S) \
    --target-db-snapshot-identifier caddyai-dr-$(date +%Y%m%d-%H%M%S) \
    --source-region us-east-1 \
    --target-region us-west-2
```

### 3. Application Data Backup

#### Voice Models and Assets
- **EFS Cross-region replication**: Voice models replicated to DR region
- **S3 Cross-region replication**: Static assets and user uploads
- **Automated sync**: Hourly synchronization of critical files

#### Configuration Backup
- **Kubernetes manifests**: Stored in Git repository
- **Terraform state**: Backend stored in S3 with versioning
- **Secrets**: Backed up using AWS Secrets Manager cross-region replication

## Disaster Scenarios and Response Procedures

### Scenario 1: Single Pod/Service Failure

**Detection**: Health checks, monitoring alerts
**Impact**: Minimal - load balancer routes traffic to healthy instances
**Recovery**: Automatic via Kubernetes self-healing

**Manual Steps (if needed):**
```bash
# Check pod status
kubectl get pods -n caddyai-prod

# Restart failed pods
kubectl delete pod <failed-pod-name> -n caddyai-prod

# Scale up replicas if needed
kubectl scale deployment caddyai-api --replicas=5 -n caddyai-prod
```

### Scenario 2: Database Failure

**Detection**: Database connection failures, monitoring alerts
**Impact**: High - application becomes unavailable
**Recovery**: 30-60 minutes

**Recovery Steps:**
1. **Assess the situation**
   ```bash
   # Check RDS instance status
   aws rds describe-db-instances --db-instance-identifier caddyai-prod
   ```

2. **Minor Issues - Reboot instance**
   ```bash
   aws rds reboot-db-instance --db-instance-identifier caddyai-prod
   ```

3. **Major Issues - Restore from backup**
   ```bash
   # List available snapshots
   aws rds describe-db-snapshots --db-instance-identifier caddyai-prod

   # Restore from latest snapshot
   aws rds restore-db-instance-from-db-snapshot \
       --db-instance-identifier caddyai-prod-restored \
       --db-snapshot-identifier <latest-snapshot-id> \
       --db-instance-class db.r5.large

   # Update application connection string
   kubectl patch secret caddyai-secrets \
       -p '{"data":{"database-url":"<new-encoded-connection-string>"}}' \
       -n caddyai-prod
   ```

### Scenario 3: EKS Cluster Failure

**Detection**: Node failures, API server unavailable
**Impact**: High - entire application unavailable
**Recovery**: 45-90 minutes

**Recovery Steps:**
1. **Check cluster status**
   ```bash
   aws eks describe-cluster --name caddyai-prod
   kubectl get nodes
   ```

2. **Node group issues**
   ```bash
   # Update node group
   aws eks update-nodegroup-version \
       --cluster-name caddyai-prod \
       --nodegroup-name general \
       --force
   ```

3. **Complete cluster rebuild**
   ```bash
   # Deploy to DR region (if available)
   aws eks update-kubeconfig --region us-west-2 --name caddyai-dr

   # Deploy application to DR cluster
   kubectl apply -k k8s/overlays/prod

   # Update DNS to point to DR region
   aws route53 change-resource-record-sets \
       --hosted-zone-id Z123456789 \
       --change-batch file://dns-failover.json
   ```

### Scenario 4: Complete Region Failure

**Detection**: Multiple service failures, AWS status page alerts
**Impact**: Critical - entire primary infrastructure unavailable
**Recovery**: 2-4 hours

**Recovery Steps:**
1. **Activate DR region**
   ```bash
   # Switch to DR region
   aws configure set region us-west-2

   # Deploy infrastructure
   cd infrastructure/terraform
   terraform workspace select dr
   terraform plan -var-file=environments/dr/terraform.tfvars
   terraform apply -auto-approve
   ```

2. **Restore database**
   ```bash
   # Restore from latest cross-region snapshot
   aws rds restore-db-instance-from-db-snapshot \
       --db-instance-identifier caddyai-prod-dr \
       --db-snapshot-identifier <latest-cross-region-snapshot>
   ```

3. **Deploy applications**
   ```bash
   # Update kubeconfig for DR cluster
   aws eks update-kubeconfig --region us-west-2 --name caddyai-dr

   # Deploy applications
   kubectl apply -k k8s/overlays/prod
   ```

4. **Update DNS and CDN**
   ```bash
   # Update Route 53 records
   aws route53 change-resource-record-sets \
       --hosted-zone-id Z123456789 \
       --change-batch file://dns-dr-failover.json

   # Update CloudFront origin
   aws cloudfront update-distribution \
       --id E123456789 \
       --distribution-config file://cloudfront-dr-config.json
   ```

### Scenario 5: Security Incident / Data Breach

**Detection**: Security alerts, anomalous activity
**Impact**: Varies - potential data exposure
**Recovery**: Immediate isolation, investigation, recovery

**Immediate Response:**
1. **Isolate affected systems**
   ```bash
   # Remove from load balancer
   kubectl patch service caddyai-api-external -p '{"spec":{"selector":{"app":"isolated"}}}'

   # Scale down affected deployments
   kubectl scale deployment caddyai-api --replicas=0 -n caddyai-prod
   ```

2. **Preserve evidence**
   ```bash
   # Create snapshots of affected systems
   aws ec2 create-snapshot --volume-id vol-1234567890abcdef0 --description "Security incident $(date)"
   ```

3. **Deploy clean environment**
   ```bash
   # Deploy to isolated namespace
   kubectl create namespace caddyai-incident-recovery
   kubectl apply -k k8s/overlays/prod -n caddyai-incident-recovery
   ```

## Backup Verification and Testing

### Automated Testing
- **Weekly**: Automated restore tests in staging environment
- **Monthly**: Full DR environment deployment test
- **Quarterly**: Complete failover simulation

### Test Procedures
```bash
#!/bin/bash
# DR Test Script
set -e

echo "Starting DR test..."

# Test database restore
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier caddyai-test-restore \
    --db-snapshot-identifier $(aws rds describe-db-snapshots --query 'DBSnapshots[0].DBSnapshotIdentifier' --output text)

# Test application deployment
kubectl apply -k k8s/overlays/staging -n caddyai-test

# Verify health checks
kubectl wait --for=condition=ready pod -l app=caddyai-api -n caddyai-test --timeout=300s

echo "DR test completed successfully"
```

## Communication Plan

### Internal Communication
- **Incident Commander**: CTO or designated technical lead
- **Engineering Team**: Via Slack #incident-response channel
- **Management**: Email updates every 30 minutes during incidents
- **Status Page**: https://status.caddyai.com for external communication

### External Communication
- **Customer notifications**: Via in-app messaging and email
- **Service status**: Updated on public status page
- **Post-incident report**: Published within 48 hours of resolution

### Escalation Matrix
| Time | Action | Responsible |
|------|--------|-------------|
| 0 minutes | Initial alert | On-call engineer |
| 5 minutes | Incident declared | Engineering manager |
| 15 minutes | Management notified | Incident commander |
| 30 minutes | Customer communication | Marketing/Support |
| 60 minutes | Executive briefing | CTO |

## Recovery Procedures Checklist

### Pre-Recovery
- [ ] Assess the scope and impact of the failure
- [ ] Notify stakeholders and activate incident response team
- [ ] Determine appropriate recovery strategy
- [ ] Verify backup integrity and availability

### During Recovery
- [ ] Execute recovery procedures
- [ ] Monitor recovery progress
- [ ] Test functionality as systems come online
- [ ] Update stakeholders on progress

### Post-Recovery
- [ ] Verify all systems are fully operational
- [ ] Conduct post-incident review
- [ ] Update documentation and procedures
- [ ] Schedule preventive measures implementation

## Contact Information

### Primary Contacts
- **On-Call Engineer**: +1-XXX-XXX-XXXX
- **Engineering Manager**: engineering-manager@caddyai.com
- **CTO**: cto@caddyai.com
- **AWS Support**: Business support case

### Vendor Contacts
- **AWS Technical Account Manager**: tam@amazon.com
- **Datadog Support**: support@datadoghq.com
- **PagerDuty Support**: support@pagerduty.com

## Document Maintenance

This disaster recovery plan should be:
- **Reviewed**: Quarterly
- **Updated**: When infrastructure changes occur
- **Tested**: Monthly (components), Quarterly (full test)
- **Version controlled**: All changes tracked in Git

**Last Updated**: $(date)
**Next Review Date**: $(date -d "+3 months")
**Document Owner**: Engineering Team