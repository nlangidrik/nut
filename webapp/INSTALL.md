# UPS Monitor Installation Guide

This guide will help you install and configure the UPS Monitoring & Shutdown Web Application.

## Prerequisites

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **NUT Server** running and accessible
- **SSH access** to target devices (for shutdown functionality)

## Quick Start

### 1. Clone or Download the Application

```bash
# If you have the files locally, navigate to the webapp directory
cd webapp
```

### 2. Configure the Application

Copy the example configuration and edit it with your settings:

```bash
cp config/config.example.json config/config.json
```

Edit `config/config.json` with your NUT server details:

```json
{
  "nut_server": {
    "host": "your-nut-server-ip",
    "port": 3493,
    "ups_name": "your-ups-name"
  },
  "alerts": {
    "battery_low_threshold": 20,
    "runtime_low_threshold": 5,
    "power_failure_delay": 60
  },
  "shutdown": {
    "auto_shutdown_enabled": true,
    "battery_threshold": 15,
    "runtime_threshold": 10
  }
}
```

### 3. Start the Application

#### Option A: Using the startup script (Linux/macOS)
```bash
chmod +x start.sh
./start.sh
```

#### Option B: Manual Docker Compose
```bash
docker-compose up --build -d
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Default credentials**: admin / admin123

## Configuration Details

### NUT Server Configuration

The application connects to your NUT server to monitor UPS status. Ensure your NUT server is:

1. **Running and accessible** from the web app container
2. **Properly configured** with your UPS device
3. **Network accessible** (if running on a different machine)

### Device Configuration

In the Devices page, you can configure critical infrastructure that should be shut down during power events:

#### For Linux Servers:
- **Type**: Server
- **Shutdown Command**: `sudo shutdown -h now` or `sudo systemctl poweroff`

#### For Synology NAS:
- **Type**: Synology
- **Shutdown Command**: Use the Synology API (configured in the backend)

#### SSH Authentication:
- **Recommended**: Use SSH keys for authentication
- **Alternative**: Password authentication (less secure)

### Alert Configuration

Configure thresholds for proactive monitoring:

- **Battery Low Threshold**: Alert when battery level drops below this percentage
- **Runtime Low Threshold**: Alert when remaining runtime drops below this value (minutes)
- **Power Failure Delay**: Wait time before triggering power failure alerts (seconds)

### Shutdown Configuration

Configure automatic shutdown triggers:

- **Auto Shutdown Enabled**: Enable/disable automatic shutdown
- **Battery Threshold**: Shutdown devices when battery reaches this level (%)
- **Runtime Threshold**: Shutdown devices when runtime reaches this value (minutes)

## Security Considerations

### 1. Change Default Credentials

After first login, change the default admin password:

1. Log in with `admin / admin123`
2. Go to Settings
3. Update authentication credentials

### 2. Network Security

- Run the application on a **trusted network**
- Use **VPN access** if deploying remotely
- Configure **firewall rules** appropriately

### 3. SSH Key Authentication

For device shutdown, use SSH keys instead of passwords:

1. Generate SSH key pair
2. Add public key to target devices
3. Configure private key path in device settings

## Troubleshooting

### Common Issues

#### 1. Cannot Connect to NUT Server
- Verify NUT server is running: `upsc ups@localhost`
- Check network connectivity
- Verify UPS name in configuration
- Check firewall settings

#### 2. Device Shutdown Fails
- Verify SSH connectivity to target device
- Check SSH key permissions
- Ensure shutdown command works manually
- Verify user has sudo privileges

#### 3. Application Won't Start
- Check Docker and Docker Compose installation
- Verify port availability (3000, 5000)
- Check container logs: `docker-compose logs`

### Useful Commands

```bash
# View application logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart the application
docker-compose restart

# Stop the application
docker-compose down

# Remove all data and start fresh
docker-compose down -v
docker-compose up --build -d
```

## Production Deployment

### Environment Variables

For production, set these environment variables:

```bash
export SECRET_KEY="your-secure-secret-key"
export NUT_SERVER_HOST="your-nut-server-ip"
export NUT_SERVER_PORT="3493"
export UPS_NAME="your-ups-name"
```

### Reverse Proxy

For production, consider using a reverse proxy (nginx, traefik) with SSL:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Backup Configuration

Regularly backup your configuration:

```bash
# Backup configuration
cp config/config.json config/config.json.backup

# Backup database (if using external database)
docker-compose exec backend sqlite3 ups_monitor.db .dump > backup.sql
```

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review application logs
3. Verify NUT server configuration
4. Test network connectivity

## License

This application is open source and follows the same license as the NUT project. 