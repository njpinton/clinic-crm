"""
Django settings module selector.
Import from development or production based on environment.
"""
import os

# Default to development if not specified
DJANGO_ENV = os.environ.get('DJANGO_ENV', 'development')

if DJANGO_ENV == 'production':
    from .production import *
else:
    from .development import *
