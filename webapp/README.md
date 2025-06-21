# UPS Monitoring & Shutdown Web App

A modern web application for monitoring Uninterruptible Power Supply (UPS) devices and managing graceful shutdowns of critical infrastructure.

## Features

- **Real-time UPS Monitoring**: Live dashboard showing UPS status, battery level, runtime, and power metrics
- **Smart Alerts**: Configurable notifications for power events and low battery conditions
- **Automated Shutdown**: Graceful shutdown of critical infrastructure based on configurable triggers
- **Manual Control**: Manual shutdown initiation for connected devices
- **Device Management**: Configure and manage servers, Synology NAS, and other critical devices
- **Secure Authentication**: Basic username/password protection for the web interface

## Architecture

The application consists of:

- **Frontend**: React.js with TypeScript, Tailwind CSS for styling
- **Backend**: Python Flask API server
- **Database**: SQLite for configuration storage
- **Containerization**: Docker for easy deployment

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Access to a running NUT server (your forked version)
- SSH access to target devices for shutdown commands

### Installation

1. Clone this repository
2. Copy the example configuration:
   ```bash
   cp webapp/config/config.example.json webapp/config/config.json
   ```
3. Edit the configuration file with your settings
4. Build and run with Docker Compose:
   ```bash
   cd webapp
   docker-compose up -d
   ```

### Configuration

Edit `webapp/config/config.json` to configure:

- NUT server connection details
- UPS device name
- Critical infrastructure devices and shutdown commands
- Alert thresholds
- Authentication credentials

## Usage

1. Access the web interface at `http://localhost:3000`
2. Log in with configured credentials
3. Monitor UPS status on the dashboard
4. Configure devices and shutdown triggers in Settings
5. Use manual shutdown controls when needed

## Development

### Frontend Development
```bash
cd webapp/frontend
npm install
npm start
```

### Backend Development
```bash
cd webapp/backend
pip install -r requirements.txt
python app.py
```

## Security Considerations

- Store sensitive credentials as environment variables
- Use SSH keys for device authentication
- Run on trusted networks or VPN
- Regularly update dependencies

## License

This project is open source and follows the same license as the NUT project. 