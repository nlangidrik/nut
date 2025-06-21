#!/bin/bash

# UPS Monitor Web App Startup Script

echo "🚀 Starting UPS Monitor Web Application..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create config directory if it doesn't exist
mkdir -p config

# Copy example config if config.json doesn't exist
if [ ! -f config/config.json ]; then
    echo "📝 Creating configuration file from example..."
    cp config/config.example.json config/config.json
    echo "⚠️  Please edit config/config.json with your NUT server settings before starting."
fi

# Create logs directory
mkdir -p logs

# Build and start the application
echo "🔨 Building and starting containers..."
docker-compose up --build -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ UPS Monitor is now running!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:5000"
    echo "📊 Default credentials: admin / admin123"
    echo ""
    echo "📋 Next steps:"
    echo "1. Open http://localhost:3000 in your browser"
    echo "2. Log in with the default credentials"
    echo "3. Configure your NUT server settings in the Settings page"
    echo "4. Add your critical devices in the Devices page"
    echo ""
    echo "🛑 To stop the application, run: docker-compose down"
else
    echo "❌ Failed to start services. Check the logs with: docker-compose logs"
    exit 1
fi 