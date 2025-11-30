#!/bin/bash

echo "Running database migrations..."
python manage.py migrate --noinput 2>&1 || true

echo "Seeding demo users..."
python manage.py seed_users 2>&1 || true

echo "Collecting static files..."
python manage.py collectstatic --noinput 2>&1 || true

echo "Starting gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3 --access-logfile - --error-logfile -
