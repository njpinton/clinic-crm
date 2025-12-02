import pytest
import os

# Set DATABASE_URL to use SQLite before Django loads settings
# This must be done before any Django imports
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
