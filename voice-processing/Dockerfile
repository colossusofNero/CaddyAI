# Voice Processing Service Dockerfile
FROM python:3.9-slim AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    build-essential \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.9-slim AS production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r caddyai && useradd -r -g caddyai -u 1001 caddyai

# Set working directory
WORKDIR /app

# Copy Python packages from builder
COPY --from=builder /root/.local /home/caddyai/.local

# Copy application code
COPY --chown=caddyai:caddyai . .

# Create necessary directories
RUN mkdir -p /app/logs /app/models /app/temp && \
    chown -R caddyai:caddyai /app

# Switch to non-root user
USER caddyai

# Add local pip packages to PATH
ENV PATH=/home/caddyai/.local/bin:$PATH

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["python", "main.py"]