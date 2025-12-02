"""
Django test settings - uses SQLite in-memory database.
"""
from .development import *

# Use SQLite in-memory database for tests
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable migrations for faster tests
# MIGRATION_MODULES = {}

# Disable warnings for tests
import warnings
warnings.filterwarnings('ignore')
