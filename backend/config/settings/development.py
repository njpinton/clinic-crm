"""
Django development settings.
"""
from .base import *
import os

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]', '0.0.0.0']

# Database - Use SQLite for local development/testing (no Supabase required)
# This overrides the base.py database configuration
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL or DATABASE_URL.startswith('sqlite'):
    # Use SQLite for testing - simple and no external dependencies
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# CORS - Allow all origins in development
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',  # Frontend running on port 3001
    'http://127.0.0.1:3001',
]

# Development-specific apps
INSTALLED_APPS += []

# Email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Security settings for development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
