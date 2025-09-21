# Multi-stage build for CaddyAI API
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev for building)
RUN npm ci && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY knexfile.js ./
COPY public/ ./public/
COPY config/ ./config/

# Build the application if build script exists
RUN npm run build 2>/dev/null || echo "No build script found"

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S caddyai -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=caddyai:nodejs /app/dist ./dist 2>/dev/null || echo "No dist directory"
COPY --from=builder --chown=caddyai:nodejs /app/src ./src
COPY --from=builder --chown=caddyai:nodejs /app/knexfile.js ./
COPY --from=builder --chown=caddyai:nodejs /app/public ./public 2>/dev/null || echo "No public directory"
COPY --from=builder --chown=caddyai:nodejs /app/config ./config 2>/dev/null || echo "No config directory"

# Create logs directory
RUN mkdir -p /app/logs && chown -R caddyai:nodejs /app/logs

# Switch to non-root user
USER caddyai

# Expose port
EXPOSE 3001

# Enhanced health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]