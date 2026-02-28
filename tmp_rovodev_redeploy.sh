#!/bin/bash

# Скрипт для быстрого передеплоя на production

echo "🚀 Starting redeploy..."

# 1. Pull latest code
echo "📥 Pulling latest code from Git..."
git pull origin main

# 2. Rebuild Docker image
echo "🔨 Building Docker image..."
docker-compose build --no-cache

# 3. Restart container
echo "🔄 Restarting container..."
docker-compose down
docker-compose up -d

# 4. Show logs
echo "📋 Showing logs (Ctrl+C to exit)..."
docker-compose logs -f
