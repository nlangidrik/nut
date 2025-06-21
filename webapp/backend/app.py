from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
import json
import os
import logging
from datetime import datetime, timedelta
import threading
import time
from typing import Dict, List, Optional
import paramiko
import requests
from pynut3 import PyNUT3Client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-this')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ups_monitor.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager()
login_manager.init_app(app)
CORS(app, supports_credentials=True)

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)

class Device(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 'server', 'synology', 'other'
    hostname = db.Column(db.String(100), nullable=False)
    port = db.Column(db.Integer, default=22)
    username = db.Column(db.String(50), nullable=False)
    shutdown_command = db.Column(db.String(200), nullable=False)
    ssh_key_path = db.Column(db.String(200))
    is_active = db.Column(db.Boolean, default=True)

class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String(200), nullable=False)
    level = db.Column(db.String(20), nullable=False)  # 'info', 'warning', 'critical'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)

# Configuration
class Config:
    def __init__(self):
        self.config_file = 'config/config.json'
        self.load_config()
    
    def load_config(self):
        try:
            with open(self.config_file, 'r') as f:
                self.data = json.load(f)
        except FileNotFoundError:
            self.data = self.get_default_config()
            self.save_config()
    
    def save_config(self):
        os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
        with open(self.config_file, 'w') as f:
            json.dump(self.data, f, indent=2)
    
    def get_default_config(self):
        return {
            "nut_server": {
                "host": os.environ.get('NUT_SERVER_HOST', 'localhost'),
                "port": int(os.environ.get('NUT_SERVER_PORT', 3493)),
                "ups_name": os.environ.get('UPS_NAME', 'ups')
            },
            "alerts": {
                "battery_low_threshold": 20,
                "runtime_low_threshold": 5,
                "power_failure_delay": 60
            },
            "shutdown": {
                "auto_shutdown_enabled": True,
                "battery_threshold": 15,
                "runtime_threshold": 10
            }
        }

config = Config()

# NUT Client
class NUTClient:
    def __init__(self):
        self.client = None
        self.connect()
    
    def connect(self):
        try:
            self.client = PyNUT3Client(
                host=config.data['nut_server']['host'],
                port=config.data['nut_server']['port']
            )
            logger.info("Connected to NUT server")
        except Exception as e:
            logger.error(f"Failed to connect to NUT server: {e}")
            self.client = None
    
    def get_ups_status(self):
        if not self.client:
            self.connect()
            if not self.client:
                return None
        
        try:
            ups_name = config.data['nut_server']['ups_name']
            status = self.client.GetUPSVars(ups_name)
            return status
        except Exception as e:
            logger.error(f"Error getting UPS status: {e}")
            return None

nut_client = NUTClient()

# Shutdown Manager
class ShutdownManager:
    def __init__(self):
        self.shutdown_in_progress = False
        self.shutdown_thread = None
    
    def shutdown_device(self, device: Device) -> Dict:
        """Execute shutdown command on a device"""
        try:
            if device.type == 'synology':
                return self._shutdown_synology(device)
            else:
                return self._shutdown_ssh(device)
        except Exception as e:
            logger.error(f"Shutdown failed for {device.name}: {e}")
            return {"success": False, "error": str(e)}
    
    def _shutdown_ssh(self, device: Device) -> Dict:
        """Shutdown via SSH"""
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        try:
            if device.ssh_key_path and os.path.exists(device.ssh_key_path):
                ssh.connect(
                    device.hostname,
                    port=device.port,
                    username=device.username,
                    key_filename=device.ssh_key_path
                )
            else:
                # Fallback to password (not recommended for production)
                ssh.connect(
                    device.hostname,
                    port=device.port,
                    username=device.username
                )
            
            stdin, stdout, stderr = ssh.exec_command(device.shutdown_command)
            exit_code = stdout.channel.recv_exit_status()
            
            ssh.close()
            
            if exit_code == 0:
                return {"success": True, "message": f"Shutdown initiated for {device.name}"}
            else:
                return {"success": False, "error": f"Shutdown command failed with exit code {exit_code}"}
        
        except Exception as e:
            ssh.close()
            raise e
    
    def _shutdown_synology(self, device: Device) -> Dict:
        """Shutdown Synology NAS via API"""
        # This is a placeholder - Synology API requires authentication
        # In a real implementation, you'd use the Synology DSM API
        try:
            # Example API call (would need proper authentication)
            api_url = f"http://{device.hostname}:5000/webapi/entry.cgi"
            params = {
                "api": "SYNO.Core.System.Utilization",
                "version": "1",
                "method": "shutdown"
            }
            
            response = requests.post(api_url, params=params, timeout=10)
            
            if response.status_code == 200:
                return {"success": True, "message": f"Shutdown initiated for {device.name}"}
            else:
                return {"success": False, "error": f"API call failed with status {response.status_code}"}
        
        except Exception as e:
            raise e
    
    def shutdown_all_devices(self) -> List[Dict]:
        """Shutdown all active devices"""
        if self.shutdown_in_progress:
            return [{"success": False, "error": "Shutdown already in progress"}]
        
        self.shutdown_in_progress = True
        devices = Device.query.filter_by(is_active=True).all()
        results = []
        
        for device in devices:
            result = self.shutdown_device(device)
            results.append({"device": device.name, **result})
            time.sleep(2)  # Small delay between devices
        
        self.shutdown_in_progress = False
        return results

shutdown_manager = ShutdownManager()

# Alert Manager
class AlertManager:
    def __init__(self):
        self.last_alert_time = {}
    
    def create_alert(self, message: str, level: str = 'info'):
        """Create a new alert"""
        alert = Alert(message=message, level=level)
        db.session.add(alert)
        db.session.commit()
        logger.info(f"Alert created: {message}")
    
    def check_ups_alerts(self, ups_status: Dict):
        """Check UPS status and create alerts if needed"""
        if not ups_status:
            return
        
        current_time = datetime.utcnow()
        
        # Check battery level
        battery_level = ups_status.get('battery.charge', 0)
        if isinstance(battery_level, str):
            try:
                battery_level = float(battery_level)
            except ValueError:
                battery_level = 0
        
        battery_threshold = config.data['alerts']['battery_low_threshold']
        if battery_level < battery_threshold:
            alert_key = f"battery_low_{battery_level}"
            if self._should_create_alert(alert_key, current_time, minutes=5):
                self.create_alert(
                    f"Battery level is low: {battery_level}%",
                    'warning'
                )
        
        # Check runtime
        runtime = ups_status.get('battery.runtime', 0)
        if isinstance(runtime, str):
            try:
                runtime = float(runtime)
            except ValueError:
                runtime = 0
        
        runtime_threshold = config.data['alerts']['runtime_low_threshold']
        if runtime < runtime_threshold * 60:  # Convert minutes to seconds
            alert_key = f"runtime_low_{runtime}"
            if self._should_create_alert(alert_key, current_time, minutes=2):
                self.create_alert(
                    f"Battery runtime is low: {runtime/60:.1f} minutes",
                    'critical'
                )
        
        # Check power status
        ups_status_str = ups_status.get('ups.status', '').lower()
        if 'ol' not in ups_status_str and 'ob' in ups_status_str:
            alert_key = "power_failure"
            if self._should_create_alert(alert_key, current_time, minutes=1):
                self.create_alert("UPS is running on battery power", 'warning')

    def _should_create_alert(self, key: str, current_time: datetime, minutes: int) -> bool:
        """Check if enough time has passed to create a new alert"""
        if key not in self.last_alert_time:
            self.last_alert_time[key] = current_time
            return True
        
        time_diff = current_time - self.last_alert_time[key]
        if time_diff > timedelta(minutes=minutes):
            self.last_alert_time[key] = current_time
            return True
        
        return False

alert_manager = AlertManager()

# Routes
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if user and bcrypt.check_password_hash(user.password_hash, data['password']):
        login_user(user)
        return jsonify({"success": True, "message": "Login successful"})
    
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/api/logout')
@login_required
def logout():
    logout_user()
    return jsonify({"success": True, "message": "Logout successful"})

@app.route('/api/ups/status')
@login_required
def get_ups_status():
    """Get current UPS status"""
    status = nut_client.get_ups_status()
    if status:
        alert_manager.check_ups_alerts(status)
        return jsonify({"success": True, "data": status})
    else:
        return jsonify({"success": False, "error": "Unable to connect to NUT server"}), 500

@app.route('/api/devices')
@login_required
def get_devices():
    """Get all configured devices"""
    devices = Device.query.all()
    return jsonify({
        "success": True,
        "data": [{
            "id": d.id,
            "name": d.name,
            "type": d.type,
            "hostname": d.hostname,
            "port": d.port,
            "username": d.username,
            "shutdown_command": d.shutdown_command,
            "is_active": d.is_active
        } for d in devices]
    })

@app.route('/api/devices', methods=['POST'])
@login_required
def add_device():
    """Add a new device"""
    data = request.get_json()
    
    device = Device(
        name=data['name'],
        type=data['type'],
        hostname=data['hostname'],
        port=data.get('port', 22),
        username=data['username'],
        shutdown_command=data['shutdown_command'],
        ssh_key_path=data.get('ssh_key_path')
    )
    
    db.session.add(device)
    db.session.commit()
    
    return jsonify({"success": True, "message": "Device added successfully"})

@app.route('/api/devices/<int:device_id>', methods=['PUT'])
@login_required
def update_device(device_id):
    """Update a device"""
    device = Device.query.get_or_404(device_id)
    data = request.get_json()
    
    device.name = data['name']
    device.type = data['type']
    device.hostname = data['hostname']
    device.port = data.get('port', 22)
    device.username = data['username']
    device.shutdown_command = data['shutdown_command']
    device.ssh_key_path = data.get('ssh_key_path')
    device.is_active = data.get('is_active', True)
    
    db.session.commit()
    
    return jsonify({"success": True, "message": "Device updated successfully"})

@app.route('/api/devices/<int:device_id>', methods=['DELETE'])
@login_required
def delete_device(device_id):
    """Delete a device"""
    device = Device.query.get_or_404(device_id)
    db.session.delete(device)
    db.session.commit()
    
    return jsonify({"success": True, "message": "Device deleted successfully"})

@app.route('/api/shutdown/manual', methods=['POST'])
@login_required
def manual_shutdown():
    """Manually initiate shutdown for all devices"""
    if shutdown_manager.shutdown_in_progress:
        return jsonify({"success": False, "error": "Shutdown already in progress"}), 400
    
    # Run shutdown in background thread
    def shutdown_thread():
        results = shutdown_manager.shutdown_all_devices()
        logger.info(f"Manual shutdown completed: {results}")
    
    threading.Thread(target=shutdown_thread, daemon=True).start()
    
    return jsonify({"success": True, "message": "Shutdown initiated"})

@app.route('/api/shutdown/device/<int:device_id>', methods=['POST'])
@login_required
def shutdown_single_device(device_id):
    """Shutdown a specific device"""
    device = Device.query.get_or_404(device_id)
    result = shutdown_manager.shutdown_device(device)
    
    return jsonify(result)

@app.route('/api/alerts')
@login_required
def get_alerts():
    """Get recent alerts"""
    alerts = Alert.query.order_by(Alert.timestamp.desc()).limit(50).all()
    return jsonify({
        "success": True,
        "data": [{
            "id": a.id,
            "message": a.message,
            "level": a.level,
            "timestamp": a.timestamp.isoformat(),
            "is_read": a.is_read
        } for a in alerts]
    })

@app.route('/api/alerts/<int:alert_id>/read', methods=['POST'])
@login_required
def mark_alert_read(alert_id):
    """Mark an alert as read"""
    alert = Alert.query.get_or_404(alert_id)
    alert.is_read = True
    db.session.commit()
    
    return jsonify({"success": True, "message": "Alert marked as read"})

@app.route('/api/config')
@login_required
def get_config():
    """Get current configuration"""
    return jsonify({"success": True, "data": config.data})

@app.route('/api/config', methods=['PUT'])
@login_required
def update_config():
    """Update configuration"""
    data = request.get_json()
    config.data.update(data)
    config.save_config()
    
    return jsonify({"success": True, "message": "Configuration updated"})

# Health check endpoint
@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()})

# Initialize database and create default user
def init_db():
    with app.app_context():
        db.create_all()
        
        # Create default admin user if none exists
        if not User.query.first():
            default_password = os.environ.get('DEFAULT_PASSWORD', 'admin123')
            password_hash = bcrypt.generate_password_hash(default_password).decode('utf-8')
            admin_user = User(username='admin', password_hash=password_hash)
            db.session.add(admin_user)
            db.session.commit()
            logger.info("Created default admin user")

# Initialize database on startup
init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 