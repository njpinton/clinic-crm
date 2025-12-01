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
    && rm -rf /var/lib/apt/lists/*

# Download Cloud SQL Proxy
RUN curl -o cloud-sql-proxy https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 && \
    chmod +x cloud-sql-proxy && \
    mv cloud-sql-proxy /usr/local/bin/

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

# Run Cloud SQL Proxy and gunicorn
CMD ["sh", "-c", "cloud-sql-proxy -instances=${CLOUD_SQL_CONNECTION_NAME}=unix:/cloudsql/postgres --max-connections=5 & python manage.py migrate --noinput && python manage.py seed_users || true && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3 --timeout 120"]
