FROM python:3.11-slim-bullseye

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System dependencies
RUN set -eux; \
    apt-get update; \
    for i in 1 2 3; do \
        apt-get install -y --no-install-recommends \
            build-essential \
            libpq-dev \
            gettext \
            curl \
        && break || sleep 5; \
    done; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

EXPOSE 8000
