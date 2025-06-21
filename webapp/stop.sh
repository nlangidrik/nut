#!/bin/bash

# UPS Monitor Web App Stop Script

echo "🛑 Stopping UPS Monitor Web Application..."

# Stop and remove containers
docker-compose down

echo "✅ Application stopped successfully!"
echo "🗑️  To remove all data and start fresh, run: docker-compose down -v" 