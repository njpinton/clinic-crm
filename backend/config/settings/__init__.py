"""
Django settings module router.
Routes to production or development settings based on environment.
"""
import os

# Determine which settings to use based on DJANGO_ENV
django_env = os.environ.get('DJANGO_ENV', 'development')

if django_env == 'production':
    from .production import *
else:
    from .development import *
