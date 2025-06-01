#!/bin/sh

set -e

# Set Django settings environment variable
export DJANGO_SETTINGS_MODULE=backendeventProject.settings

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn server..."
exec gunicorn backendeventProject.wsgi:application --bind 0.0.0.0:8000 --workers 3
