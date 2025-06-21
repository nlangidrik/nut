#!/bin/bash

# UPS Monitor Web App Update Script

echo "🔄 Updating UPS Monitor Web Application..."

# Stop the application
echo "🛑 Stopping current application..."
docker-compose down

# Pull latest changes (if using git)
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull origin main
fi

# Rebuild and start the application
echo "🔨 Rebuilding and starting containers..."
docker-compose up --build -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ UPS Monitor updated and running!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:5000"
else
    echo "❌ Failed to start services. Check the logs with: docker-compose logs"
    exit 1
fi 