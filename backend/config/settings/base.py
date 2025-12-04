"""
Django base settings for clinic CRM.
Common settings used in both development and production.
"""
import os
from pathlib import Path
import dj_database_url

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-this-in-production')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',  # API documentation

    # Local apps
    'apps.core',
    'apps.users',
    'apps.patients',
    'apps.doctors',
    'apps.appointments',
    'apps.clinical_notes',
    'apps.laboratory',
    'apps.employees',
    'apps.prescriptions',
    'apps.insurance',
    'apps.billing',
    'apps.locations',  # PSGC geographic data
]

# Custom User Model
AUTH_USER_MODEL = 'users.User'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Static files
    'corsheaders.middleware.CorsMiddleware',  # CORS
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # Performance monitoring and error tracking
    'apps.core.monitoring_middleware.PerformanceMonitoringMiddleware',
    'apps.core.monitoring_middleware.ErrorTrackingMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases
DATABASE_URL = os.environ.get('DATABASE_URL')
CLOUD_SQL_SOCKET = os.environ.get('CLOUD_SQL_SOCKET_PATH')

if CLOUD_SQL_SOCKET:
    # Cloud SQL socket connection (via Cloud SQL Proxy)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': 'clinic',
            'USER': 'postgres',
            'PASSWORD': 'ClinicCRM2025!Secure',
            'HOST': '/cloudsql/postgres',
            'PORT': '',
            'CONN_MAX_AGE': 600,
            'CONN_HEALTH_CHECKS': True,
        }
    }
elif DATABASE_URL:
    # TCP connection (for local development or external databases)
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Fallback to environment variables - production settings should override this
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'clinic'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': os.environ.get('DB_HOST', '35.188.144.52'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Manila'  # Philippine Standard Time (PST)
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    # Rate limiting for production security
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',        # Anonymous users: 100 requests per hour
        'user': '1000/hour',       # Authenticated users: 1000 requests per hour
    },
}

# JWT Settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# API Documentation (drf-spectacular)
SPECTACULAR_SETTINGS = {
    'TITLE': 'Clinic CRM API',
    'DESCRIPTION': 'HIPAA-compliant clinic management system with comprehensive API for patient care, appointments, prescriptions, insurance, and laboratory management.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': '/api/',
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': True,
    },
    'SECURITY': [
        {
            'Bearer': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
            }
        }
    ],
    'APPEND_COMPONENTS': {
        'securitySchemes': {
            'Bearer': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
            }
        }
    },
}

# CORS settings (will be overridden in development/production)
CORS_ALLOWED_ORIGINS = []
CORS_ALLOW_CREDENTIALS = True

# Sentry Error Tracking (HIPAA-compliant)
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
import re

def scrub_sensitive_data(event, hint):
    """Remove all PHI before sending to Sentry (HIPAA compliance)"""
    # Sensitive field patterns
    sensitive_fields = [
        'password',
        'ssn',
        'social_security_number',
        'credit_card',
        'medical_record_number',
        'insurance_id',
        'date_of_birth',
        'phone',
        'email',
    ]

    # Sensitive patterns to redact
    sensitive_patterns = [
        (r'\d{3}-\d{2}-\d{4}', '[SSN-REDACTED]'),  # SSN
        (r'\d{16}', '[CC-REDACTED]'),              # Credit card
        (r'MRN\d+', '[MRN-REDACTED]'),             # Medical record numbers
    ]

    # Scrub request data
    if 'request' in event and 'data' in event['request']:
        for field in sensitive_fields:
            if field in event['request']['data']:
                event['request']['data'][field] = '[FILTERED]'

    # Scrub message
    if 'message' in event:
        for pattern, replacement in sensitive_patterns:
            event['message'] = re.sub(pattern, replacement, event['message'])

    # Scrub extra data
    if 'extra' in event:
        for field in sensitive_fields:
            if field in event['extra']:
                event['extra'][field] = '[FILTERED]'

    return event

# Redis Caching Configuration
# Supports both local development (via Django's locmem backend fallback)
# and production (via Redis)
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'socket_connect_timeout': 5,
                'socket_timeout': 5,
                'socket_keepalive': True,
            },
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
            'IGNORE_EXCEPTIONS': True,  # Fallback to database if Redis unavailable
        },
        'KEY_PREFIX': 'clinic_crm',
        'TIMEOUT': 86400,  # 24 hour default TTL
    }
}

# Initialize Sentry
SENTRY_DSN = os.environ.get('SENTRY_DSN')
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=os.environ.get('ENVIRONMENT', 'development'),
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,  # 10% of transactions for performance monitoring
        send_default_pii=False,  # HIPAA: Never send PII by default
        before_send=scrub_sensitive_data,  # HIPAA: Scrub all sensitive data
        ignore_errors=[
            'django.http.response.Http404',  # Don't log 404s
        ],
    )
