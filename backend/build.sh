#!/bin/bash

# Install dependencies
pip install -r requirements/production.txt

# Collect static files
python manage.py collectstatic --noinput
