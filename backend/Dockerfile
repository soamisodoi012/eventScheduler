# Use an official Python image with valid tags
FROM python:3.11-slim-bullseye

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=backend.backendeventProjcet.settings

# Install system dependencies with improved retry logic
RUN set -eux; \
    apt-get update; \
    for i in {1..5}; do \
        apt-get install -y --no-install-recommends \
            build-essential \
            libpq-dev \
            gettext \
        && { apt-get clean; rm -rf /var/lib/apt/lists/*; break; } \
        || { echo "Attempt $i failed, retrying..."; sleep 10; apt-get update; }; \
    done

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000

# Run application
CMD ["gunicorn", "scheduler.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]