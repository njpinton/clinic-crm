"""
Django production settings.
"""
import os
import dj_database_url

# Import all base settings first
from .base import *

import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

DEBUG = False

# Allow all hosts for Cloud Run (Cloud Run proxy handles security)
ALLOWED_HOSTS = ['*']

# CORS settings - allow frontend
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
    if origin.strip()
]
# Always allow localhost and the Cloud Run frontend
if not CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS = [
        'https://clinic-frontend-300842021131.us-central1.run.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ]

# Security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Content Security Policy
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# Production database configuration
# Supports Cloud SQL Proxy (Unix socket) and direct TCP connections
CLOUD_SQL_CONNECTION_NAME = os.environ.get('CLOUD_SQL_CONNECTION_NAME')

if CLOUD_SQL_CONNECTION_NAME:
    # Cloud SQL via Unix socket (Cloud Run with Cloud SQL Proxy)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'clinic'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': f'/cloudsql/{CLOUD_SQL_CONNECTION_NAME}',
            'PORT': '',
            'CONN_MAX_AGE': 600,
            'CONN_HEALTH_CHECKS': True,
        }
    }
else:
    # Direct TCP connection (for development or alternative deployments)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'clinic'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': os.environ.get('DB_HOST', '35.188.144.52'),
            'PORT': os.environ.get('DB_PORT', '5432'),
            'CONN_MAX_AGE': 600,
            'CONN_HEALTH_CHECKS': True,
        }
    }

# Sentry error tracking
SENTRY_DSN = os.environ.get('SENTRY_DSN')
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,  # HIPAA compliance
        environment=os.environ.get('SENTRY_ENVIRONMENT', 'production'),
    )

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'hipaa_audit': {
            'format': '{asctime} | {levelname} | {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'hipaa_audit': {
            'class': 'logging.StreamHandler',
            'formatter': 'hipaa_audit',
            'level': 'INFO',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'hipaa_audit': {
            'handlers': ['hipaa_audit', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
