#!/bin/bash
# CaddyAI Cost Optimization Script

set -e

ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}
DRY_RUN=${3:-true}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Function to analyze current costs
analyze_current_costs() {
    log_info "Analyzing current AWS costs..."

    # Get cost and usage for last 30 days
    local end_date=$(date +%Y-%m-%d)
    local start_date=$(date -d '30 days ago' +%Y-%m-%d)

    log_debug "Analyzing costs from $start_date to $end_date"

    # Get costs by service
    local cost_data=$(aws ce get-cost-and-usage \
        --time-period Start=$start_date,End=$end_date \
        --granularity MONTHLY \
        --metrics BlendedCost \
        --group-by Type=DIMENSION,Key=SERVICE \
        --region $REGION \
        --output json)

    echo "$cost_data" | jq -r '.ResultsByTime[0].Groups[] | "\(.Keys[0]): $\(.Metrics.BlendedCost.Amount)"' | head -10

    # Get total cost
    local total_cost=$(echo "$cost_data" | jq -r '.ResultsByTime[0].Total.BlendedCost.Amount')
    log_info "Total monthly cost: \$$total_cost"

    # Check for cost anomalies
    local anomalies=$(aws ce get-anomalies \
        --date-interval Start=$start_date,End=$end_date \
        --region $REGION \
        --output json 2>/dev/null || echo '{"Anomalies":[]}')

    local anomaly_count=$(echo "$anomalies" | jq '.Anomalies | length')
    if [ "$anomaly_count" -gt 0 ]; then
        log_warn "Found $anomaly_count cost anomalies"
        echo "$anomalies" | jq -r '.Anomalies[] | "Anomaly: \(.RootCauses[0].Service) - Impact: $\(.Impact.TotalImpact)"'
    fi
}

# Function to get EC2 rightsizing recommendations
get_rightsizing_recommendations() {
    log_info "Getting EC2 rightsizing recommendations..."

    local recommendations=$(aws ce get-rightsizing-recommendation \
        --service EC2-Instance \
        --region $REGION \
        --output json 2>/dev/null || echo '{"RightsizingRecommendations":[]}')

    local rec_count=$(echo "$recommendations" | jq '.RightsizingRecommendations | length')

    if [ "$rec_count" -gt 0 ]; then
        log_warn "Found $rec_count rightsizing recommendations:"
        echo "$recommendations" | jq -r '.RightsizingRecommendations[] |
            "Instance: \(.CurrentInstance.ResourceId)
            Current: \(.CurrentInstance.InstanceType)
            Recommended: \(.RightsizingType)
            Estimated Savings: $\(.EstimatedMonthlySavings)"'
    else
        log_info "No rightsizing recommendations found"
    fi
}

# Function to check for unused resources
check_unused_resources() {
    log_info "Checking for unused resources..."

    # Check for unattached EBS volumes
    local unattached_volumes=$(aws ec2 describe-volumes \
        --region $REGION \
        --filters Name=status,Values=available \
        --query 'Volumes[].{VolumeId:VolumeId,Size:Size,VolumeType:VolumeType}' \
        --output json)

    local volume_count=$(echo "$unattached_volumes" | jq '. | length')
    if [ "$volume_count" -gt 0 ]; then
        log_warn "Found $volume_count unattached EBS volumes:"
        echo "$unattached_volumes" | jq -r '.[] | "Volume: \(.VolumeId) Size: \(.Size)GB Type: \(.VolumeType)"'
    fi

    # Check for unused Elastic IPs
    local unused_eips=$(aws ec2 describe-addresses \
        --region $REGION \
        --query 'Addresses[?AssociationId==null].{PublicIp:PublicIp,AllocationId:AllocationId}' \
        --output json)

    local eip_count=$(echo "$unused_eips" | jq '. | length')
    if [ "$eip_count" -gt 0 ]; then
        log_warn "Found $eip_count unused Elastic IPs:"
        echo "$unused_eips" | jq -r '.[] | "EIP: \(.PublicIp) ID: \(.AllocationId)"'
    fi

    # Check for unused load balancers
    local unused_albs=$(aws elbv2 describe-load-balancers \
        --region $REGION \
        --query 'LoadBalancers[?State.Code==`active`]' \
        --output json)

    if [ "$(echo "$unused_albs" | jq '. | length')" -gt 0 ]; then
        # Check if they have targets
        for lb_arn in $(echo "$unused_albs" | jq -r '.[].LoadBalancerArn'); do
            local target_groups=$(aws elbv2 describe-target-groups \
                --load-balancer-arn $lb_arn \
                --region $REGION \
                --output json 2>/dev/null || echo '{"TargetGroups":[]}')

            local has_healthy_targets=false
            for tg_arn in $(echo "$target_groups" | jq -r '.TargetGroups[].TargetGroupArn'); do
                local health=$(aws elbv2 describe-target-health \
                    --target-group-arn $tg_arn \
                    --region $REGION \
                    --output json 2>/dev/null || echo '{"TargetHealthDescriptions":[]}')

                local healthy_count=$(echo "$health" | jq '[.TargetHealthDescriptions[] | select(.TargetHealth.State=="healthy")] | length')
                if [ "$healthy_count" -gt 0 ]; then
                    has_healthy_targets=true
                    break
                fi
            done

            if [ "$has_healthy_targets" = false ]; then
                local lb_name=$(echo "$unused_albs" | jq -r ".[] | select(.LoadBalancerArn==\"$lb_arn\") | .LoadBalancerName")
                log_warn "Load balancer $lb_name has no healthy targets"
            fi
        done
    fi
}

# Function to optimize EKS cluster
optimize_eks_cluster() {
    log_info "Analyzing EKS cluster optimization opportunities..."

    local cluster_name="caddyai-$ENVIRONMENT"

    # Check cluster status
    local cluster_status=$(aws eks describe-cluster \
        --name $cluster_name \
        --region $REGION \
        --query 'cluster.status' \
        --output text 2>/dev/null || echo "NOT_FOUND")

    if [ "$cluster_status" != "ACTIVE" ]; then
        log_warn "EKS cluster $cluster_name not found or not active"
        return
    fi

    # Get node groups
    local node_groups=$(aws eks list-nodegroups \
        --cluster-name $cluster_name \
        --region $REGION \
        --output json)

    for ng in $(echo "$node_groups" | jq -r '.nodegroups[]'); do
        local ng_details=$(aws eks describe-nodegroup \
            --cluster-name $cluster_name \
            --nodegroup-name $ng \
            --region $REGION \
            --output json)

        local desired=$(echo "$ng_details" | jq -r '.nodegroup.scalingConfig.desiredSize')
        local min=$(echo "$ng_details" | jq -r '.nodegroup.scalingConfig.minSize')
        local max=$(echo "$ng_details" | jq -r '.nodegroup.scalingConfig.maxSize')
        local instance_types=$(echo "$ng_details" | jq -r '.nodegroup.instanceTypes[]' | tr '\n' ',' | sed 's/,$//')
        local capacity_type=$(echo "$ng_details" | jq -r '.nodegroup.capacityType')

        log_info "Node Group: $ng"
        log_info "  Capacity Type: $capacity_type"
        log_info "  Instance Types: $instance_types"
        log_info "  Scaling: min=$min, desired=$desired, max=$max"

        # Check if we can recommend spot instances for dev
        if [ "$ENVIRONMENT" = "dev" ] && [ "$capacity_type" = "ON_DEMAND" ]; then
            log_warn "  💡 Consider using SPOT instances for development (60-70% savings)"
        fi

        # Check for over-provisioning
        if [ "$desired" -gt 2 ] && [ "$ENVIRONMENT" != "prod" ]; then
            log_warn "  💡 Consider reducing node count for non-production environment"
        fi
    done
}

# Function to optimize RDS instances
optimize_rds_instances() {
    log_info "Analyzing RDS optimization opportunities..."

    local db_instances=$(aws rds describe-db-instances \
        --region $REGION \
        --output json)

    for db_id in $(echo "$db_instances" | jq -r '.DBInstances[].DBInstanceIdentifier'); do
        local db_details=$(echo "$db_instances" | jq -r ".DBInstances[] | select(.DBInstanceIdentifier==\"$db_id\")")

        local instance_class=$(echo "$db_details" | jq -r '.DBInstanceClass')
        local engine=$(echo "$db_details" | jq -r '.Engine')
        local multi_az=$(echo "$db_details" | jq -r '.MultiAZ')
        local storage_type=$(echo "$db_details" | jq -r '.StorageType')
        local allocated_storage=$(echo "$db_details" | jq -r '.AllocatedStorage')
        local backup_retention=$(echo "$db_details" | jq -r '.BackupRetentionPeriod')

        log_info "RDS Instance: $db_id"
        log_info "  Instance Class: $instance_class"
        log_info "  Engine: $engine"
        log_info "  Multi-AZ: $multi_az"
        log_info "  Storage: $storage_type ($allocated_storage GB)"
        log_info "  Backup Retention: $backup_retention days"

        # Optimization recommendations
        if [[ "$db_id" == *"dev"* ]] || [[ "$db_id" == *"staging"* ]]; then
            if [ "$multi_az" = "true" ]; then
                log_warn "  💡 Consider disabling Multi-AZ for non-production (50% savings)"
            fi
            if [ "$backup_retention" -gt 7 ]; then
                log_warn "  💡 Consider reducing backup retention for non-production"
            fi
            if [[ "$instance_class" == *"large"* ]] || [[ "$instance_class" == *"xlarge"* ]]; then
                log_warn "  💡 Consider smaller instance class for non-production"
            fi
        fi

        if [ "$storage_type" = "gp2" ] && [ "$allocated_storage" -lt 100 ]; then
            log_warn "  💡 Consider gp3 storage for better price/performance"
        fi
    done
}

# Function to check S3 lifecycle policies
check_s3_optimization() {
    log_info "Checking S3 optimization opportunities..."

    # Get all buckets
    local buckets=$(aws s3api list-buckets --region $REGION --query 'Buckets[].Name' --output text)

    for bucket in $buckets; do
        if [[ "$bucket" == *"caddyai"* ]]; then
            log_info "Checking bucket: $bucket"

            # Check lifecycle configuration
            local lifecycle=$(aws s3api get-bucket-lifecycle-configuration \
                --bucket $bucket \
                --region $REGION 2>/dev/null || echo "NO_LIFECYCLE")

            if [ "$lifecycle" = "NO_LIFECYCLE" ]; then
                log_warn "  💡 No lifecycle policy found - consider adding one for cost optimization"
            fi

            # Check intelligent tiering
            local intelligent_tiering=$(aws s3api list-bucket-intelligent-tiering-configurations \
                --bucket $bucket \
                --region $REGION 2>/dev/null || echo "NO_IT")

            if [ "$intelligent_tiering" = "NO_IT" ]; then
                log_warn "  💡 Consider enabling S3 Intelligent Tiering"
            fi

            # Get bucket size
            local size=$(aws cloudwatch get-metric-statistics \
                --namespace AWS/S3 \
                --metric-name BucketSizeBytes \
                --dimensions Name=BucketName,Value=$bucket Name=StorageType,Value=StandardStorage \
                --statistics Average \
                --start-time $(date -d '2 days ago' --iso-8601) \
                --end-time $(date --iso-8601) \
                --period 86400 \
                --region $REGION \
                --output json 2>/dev/null | jq -r '.Datapoints[-1].Average // 0')

            local size_gb=$(echo "$size / 1024 / 1024 / 1024" | bc -l | xargs printf "%.2f")
            log_info "  Size: ${size_gb} GB"
        fi
    done
}

# Function to apply optimizations
apply_optimizations() {
    log_info "Applying cost optimizations..."

    if [ "$DRY_RUN" = "true" ]; then
        log_warn "DRY RUN MODE - No changes will be made"
        return
    fi

    # Scale down dev environments during off-hours
    if [ "$ENVIRONMENT" = "dev" ]; then
        local hour=$(date +%H)
        if [ $hour -ge 19 ] || [ $hour -le 8 ]; then
            log_info "Scaling down development environment (off-hours)"
            kubectl scale deployment --all --replicas=0 -n caddyai-dev || log_warn "Failed to scale down deployments"
        fi
    fi

    # Clean up unattached EBS volumes older than 7 days
    local old_volumes=$(aws ec2 describe-volumes \
        --region $REGION \
        --filters Name=status,Values=available \
        --query 'Volumes[?CreateTime<=`'$(date -d '7 days ago' --iso-8601)'`].VolumeId' \
        --output text)

    for volume in $old_volumes; do
        log_warn "Deleting old unattached volume: $volume"
        aws ec2 delete-volume --volume-id $volume --region $REGION || log_error "Failed to delete volume $volume"
    done

    # Release unused Elastic IPs
    local unused_eips=$(aws ec2 describe-addresses \
        --region $REGION \
        --query 'Addresses[?AssociationId==null].AllocationId' \
        --output text)

    for eip in $unused_eips; do
        log_warn "Releasing unused Elastic IP: $eip"
        aws ec2 release-address --allocation-id $eip --region $REGION || log_error "Failed to release EIP $eip"
    done
}

# Function to generate cost report
generate_cost_report() {
    log_info "Generating cost optimization report..."

    local report_file="cost-optimization-report-$(date +%Y%m%d).md"
    local end_date=$(date +%Y-%m-%d)
    local start_date=$(date -d '30 days ago' +%Y-%m-%d)

    cat > $report_file << EOF
# CaddyAI Cost Optimization Report

**Generated**: $(date)
**Environment**: $ENVIRONMENT
**Region**: $REGION

## Current Cost Analysis

EOF

    # Add cost data to report
    aws ce get-cost-and-usage \
        --time-period Start=$start_date,End=$end_date \
        --granularity MONTHLY \
        --metrics BlendedCost \
        --group-by Type=DIMENSION,Key=SERVICE \
        --region $REGION \
        --output table >> $report_file

    cat >> $report_file << EOF

## Optimization Recommendations

### Immediate Actions
- Scale down non-production environments during off-hours
- Remove unattached EBS volumes and unused Elastic IPs
- Implement S3 lifecycle policies

### Medium-term Actions
- Consider Reserved Instances for consistent workloads
- Implement Spot instances for development environments
- Right-size EC2 instances based on utilization

### Long-term Actions
- Implement auto-scaling based on demand patterns
- Consider Aurora Serverless for variable database workloads
- Implement advanced caching strategies

## Next Steps
1. Review and approve recommended changes
2. Implement changes in staging first
3. Monitor impact and adjust as needed
4. Schedule regular cost optimization reviews

---
*Report generated by CaddyAI Cost Optimizer*
EOF

    log_info "Cost report generated: $report_file"
}

# Function to set up cost monitoring
setup_cost_monitoring() {
    log_info "Setting up cost monitoring and alerts..."

    # Create CloudWatch dashboard for cost monitoring
    cat > cost-dashboard.json << EOF
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "AWS/Billing", "EstimatedCharges", "Currency", "USD" ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "us-east-1",
        "title": "Estimated AWS Charges",
        "period": 86400
      }
    }
  ]
}
EOF

    if [ "$DRY_RUN" != "true" ]; then
        aws cloudwatch put-dashboard \
            --dashboard-name "CaddyAI-Cost-Monitoring" \
            --dashboard-body file://cost-dashboard.json \
            --region us-east-1 || log_error "Failed to create cost dashboard"
    fi

    rm -f cost-dashboard.json
}

# Main execution function
main() {
    log_info "🚀 Starting CaddyAI Cost Optimization"
    log_info "Environment: $ENVIRONMENT"
    log_info "Region: $REGION"
    log_info "Dry Run: $DRY_RUN"

    echo "----------------------------------------"

    analyze_current_costs
    echo "----------------------------------------"

    get_rightsizing_recommendations
    echo "----------------------------------------"

    check_unused_resources
    echo "----------------------------------------"

    optimize_eks_cluster
    echo "----------------------------------------"

    optimize_rds_instances
    echo "----------------------------------------"

    check_s3_optimization
    echo "----------------------------------------"

    apply_optimizations
    echo "----------------------------------------"

    generate_cost_report
    echo "----------------------------------------"

    setup_cost_monitoring

    log_info "✅ Cost optimization analysis completed"
    log_info "Review the generated report for detailed recommendations"
}

# Handle script arguments
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "Usage: $0 [environment] [region] [dry-run]"
    echo ""
    echo "Arguments:"
    echo "  environment   Target environment (dev, staging, prod) [default: dev]"
    echo "  region        AWS region [default: us-east-1]"
    echo "  dry-run       Run in dry-run mode (true/false) [default: true]"
    echo ""
    echo "Examples:"
    echo "  $0 dev us-east-1 true    # Analyze dev environment (dry-run)"
    echo "  $0 prod us-east-1 false  # Optimize prod environment (apply changes)"
    exit 0
fi

# Run main function
main "$@"