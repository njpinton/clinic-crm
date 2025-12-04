# Backend Dockerfile for Django
# Force rebuild: 2025-12-01 08:25:00 UTC
FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    python3-dev \
    musl-dev \
    libpq-dev \
    curl \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Download Cloud SQL Proxy v2 (latest stable)
RUN curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.1/cloud-sql-proxy.linux.amd64 && \
    chmod +x cloud-sql-proxy && \
    mv cloud-sql-proxy /usr/local/bin/

# Create directory for Cloud SQL proxy socket
RUN mkdir -p /cloudsql && chmod 777 /cloudsql

# Install Python dependencies
COPY requirements/base.txt requirements/production.txt requirements/
RUN pip install --upgrade pip && \
    pip install -r requirements/production.txt

# Copy project
COPY . .

# Set DJANGO_SETTINGS_MODULE for build
ENV ALLOWED_HOSTS=localhost,127.0.0.1 \
    DJANGO_SETTINGS_MODULE=config.settings.production

# Expose port
EXPOSE 8000

# Copy and set entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Run Cloud SQL Proxy v2 and gunicorn via entrypoint
# If CLOUD_SQL_CONNECTION_NAME is set, starts proxy; otherwise connects directly
CMD ["sh", "-c", "\
    if [ -n \"$CLOUD_SQL_CONNECTION_NAME\" ]; then \
        echo 'Starting Cloud SQL Proxy v2...' && \
        cloud-sql-proxy $CLOUD_SQL_CONNECTION_NAME --unix-socket=/cloudsql --max-connections=10 & \
        echo 'Waiting for Cloud SQL Proxy to be ready...' && \
        sleep 5 && \
        for i in 1 2 3 4 5; do \
            if [ -S /cloudsql/$CLOUD_SQL_CONNECTION_NAME/.s.PGSQL.5432 ] || nc -z localhost 5432 2>/dev/null; then \
                echo 'Cloud SQL Proxy is ready'; \
                break; \
            fi; \
            echo \"Waiting for proxy... attempt $i\"; \
            sleep 2; \
        done; \
    fi && \
    python manage.py migrate --noinput && \
    python manage.py seed_users || true && \
    gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3 --timeout 120 --access-logfile - --error-logfile -\
"]
