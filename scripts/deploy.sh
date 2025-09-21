#!/bin/bash

# CaddyAI Backend Deployment Script
set -e

echo "🚀 Starting CaddyAI Backend Deployment..."

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "development" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    log_error ".env file not found! Please create one from .env.example"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Validate required environment variables
REQUIRED_VARS=("JWT_SECRET" "JWT_REFRESH_SECRET" "DB_PASSWORD")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        log_error "Required environment variable $var is not set"
        exit 1
    fi
done

# Pre-deployment checks
log_info "Running pre-deployment checks..."

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    log_error "docker-compose is not installed"
    exit 1
fi

# Build and deploy
log_info "Building Docker images..."
docker-compose -f $COMPOSE_FILE build --no-cache

log_info "Starting services..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
sleep 10

# Run database migrations
log_info "Running database migrations..."
docker-compose -f $COMPOSE_FILE --profile setup run --rm migrate

# Health checks
log_info "Performing health checks..."

# Check backend health
for i in {1..30}; do
    if curl -f http://localhost:${PORT:-3001}/health > /dev/null 2>&1; then
        log_info "✅ Backend is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Backend health check failed"
        docker-compose -f $COMPOSE_FILE logs caddyai-backend
        exit 1
    fi
    sleep 2
done

# Check database connection
if docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U ${DB_USER:-caddyai_user} -d ${DB_NAME:-caddyai_db} > /dev/null 2>&1; then
    log_info "✅ Database is healthy"
else
    log_error "Database health check failed"
    exit 1
fi

# Check Redis connection
if docker-compose -f $COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
    log_info "✅ Redis is healthy"
else
    log_error "Redis health check failed"
    exit 1
fi

# Display deployment information
log_info "🎉 Deployment completed successfully!"
echo ""
echo "📊 Service Status:"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo "🔗 Available URLs:"
echo "   API: http://localhost:${PORT:-3001}"
echo "   Health: http://localhost:${PORT:-3001}/health"
echo "   API Docs: http://localhost:${PORT:-3001}/api-docs"

if [ "$ENVIRONMENT" = "development" ]; then
    echo "   Database Admin: http://localhost:8080"
    echo "   Redis Admin: http://localhost:8081"
fi

echo ""
echo "📝 Useful commands:"
echo "   View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "   Stop services: docker-compose -f $COMPOSE_FILE down"
echo "   Restart: docker-compose -f $COMPOSE_FILE restart"

# Optional: Send notification (webhook, Slack, etc.)
if [ -n "$WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"CaddyAI Backend deployed successfully to $ENVIRONMENT\"}" \
        "$WEBHOOK_URL" > /dev/null 2>&1 || true
fi

log_info "Deployment script completed!"