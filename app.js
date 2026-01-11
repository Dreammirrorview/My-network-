// Network Monitor Dashboard - JavaScript Application

// Global Variables
let map;
let currentZoom = 13;
let deviceMarkers = [];
let activeConnections = 0;
let blockedDevices = [];
let currentAlertDevice = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    startNetworkScan();
    startSpeedMonitoring();
    simulateIncomingConnections();
});

// Initialize Satellite Map
function initializeMap() {
    map = L.map('satellite-map').setView([40.7128, -74.0060], currentZoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add user location marker
    const userIcon = L.divIcon({
        html: '🎯',
        iconSize: [30, 30],
        className: 'user-marker'
    });
    
    L.marker([40.7128, -74.0060], {icon: userIcon}).addTo(map)
        .bindPopup('Your Location');
    
    // Update location info
    updateLocationInfo(40.7128, -74.0060);
}

// Map Controls
function zoomIn() {
    currentZoom++;
    map.setZoom(currentZoom);
}

function zoomOut() {
    if (currentZoom > 1) {
        currentZoom--;
        map.setZoom(currentZoom);
    }
}

function centerMap() {
    map.setView([40.7128, -74.0060], currentZoom);
}

let satelliteMode = false;
function toggleSatellite() {
    satelliteMode = !satelliteMode;
    if (satelliteMode) {
        map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
        }).addTo(map);
    } else {
        location.reload();
    }
}

// Update Location Information
function updateLocationInfo(lat, lng) {
    document.getElementById('coordinates').textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    document.getElementById('street-address').textContent = '123 Network Security Ave';
    document.getElementById('city').textContent = 'New York';
    document.getElementById('country').textContent = 'United States';
    document.getElementById('proxy-info').textContent = 'Direct Connection';
}

// Network Scanning
function startNetworkScan() {
    // Simulate scanning process
    setInterval(() => {
        const scanProgress = document.querySelector('.scanner');
        scanProgress.style.opacity = scanProgress.style.opacity === '0.5' ? '1' : '0.5';
    }, 1000);
    
    // Detect network types
    detectNetworkTypes();
}

function detectNetworkTypes() {
    const networkTypes = document.querySelectorAll('.network-type');
    
    networkTypes.forEach(type => {
        setInterval(() => {
            const isActive = Math.random() > 0.3;
            type.style.background = isActive ? 
                'rgba(0, 255, 136, 0.2)' : 'rgba(0, 255, 136, 0.05)';
            type.style.borderColor = isActive ? 
                'var(--primary)' : 'rgba(0, 255, 136, 0.3)';
        }, 2000 + Math.random() * 3000);
    });
}

// Device Management
function addDevice(device) {
    const deviceList = document.getElementById('device-list');
    const deviceItem = document.createElement('div');
    deviceItem.className = 'device-item unauthorized';
    deviceItem.id = `device-${device.id}`;
    
    deviceItem.innerHTML = `
        <div class="device-icon">${device.icon}</div>
        <div class="device-info">
            <div class="device-name">${device.name}</div>
            <div class="device-details">${device.ip} • ${device.type}</div>
        </div>
        <div class="device-actions">
            <button class="device-action btn-allow" onclick="allowDevice('${device.id}')">✅</button>
            <button class="device-action btn-block" onclick="blockDevice('${device.id}')">🚫</button>
        </div>
    `;
    
    deviceList.appendChild(deviceItem);
    
    // Add marker to map
    addDeviceMarker(device);
}

function addDeviceMarker(device) {
    const lat = 40.7128 + (Math.random() - 0.5) * 0.1;
    const lng = -74.0060 + (Math.random() - 0.5) * 0.1;
    
    const deviceIcon = L.divIcon({
        html: device.icon,
        iconSize: [25, 25],
        className: 'device-marker'
    });
    
    const marker = L.marker([lat, lng], {icon: deviceIcon})
        .addTo(map)
        .bindPopup(`<b>${device.name}</b><br>${device.ip}<br>${device.location}`);
    
    deviceMarkers.push({id: device.id, marker: marker});
}

function allowDevice(deviceId) {
    const deviceItem = document.getElementById(`device-${deviceId}`);
    if (deviceItem) {
        deviceItem.classList.remove('unauthorized');
        deviceItem.style.borderLeftColor = 'var(--primary)';
        
        // Update connection count
        activeConnections++;
        updateConnectionCount();
        
        // Add to log
        addLogEntry(`Device ${deviceId} allowed access`, 'allowed');
        
        // Play success sound
        playSound('success');
    }
}

function blockDevice(deviceId) {
    const deviceItem = document.getElementById(`device-${deviceId}`);
    if (deviceItem) {
        deviceItem.remove();
        
        // Remove from map
        const markerIndex = deviceMarkers.findIndex(d => d.id === deviceId);
        if (markerIndex !== -1) {
            map.removeLayer(deviceMarkers[markerIndex].marker);
            deviceMarkers.splice(markerIndex, 1);
        }
        
        // Add to blocked list
        blockedDevices.push(deviceId);
        
        // Add to log
        addLogEntry(`Device ${deviceId} blocked forever`, 'blocked');
        
        // Play block sound
        playSound('block');
    }
}

// Alert System
function showAlert(device) {
    currentAlertDevice = device;
    
    document.getElementById('alert-device').textContent = device.name;
    document.getElementById('alert-ip').textContent = device.ip;
    document.getElementById('alert-location').textContent = device.location;
    document.getElementById('alert-type').textContent = device.type;
    
    document.getElementById('alert-popup').classList.add('active');
    
    // Play alert sound
    playSound('alert');
    
    // Vibrate if supported
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
    }
}

function allowConnection() {
    if (currentAlertDevice) {
        allowDevice(currentAlertDevice.id);
        closeAlert();
    }
}

function blockConnection() {
    if (currentAlertDevice) {
        blockDevice(currentAlertDevice.id);
        closeAlert();
    }
}

function closeAlert() {
    document.getElementById('alert-popup').classList.remove('active');
    currentAlertDevice = null;
}

// Sound System
function playSound(type) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
        case 'alert':
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            break;
        case 'success':
            oscillator.frequency.value = 523.25;
            oscillator.type = 'sine';
            break;
        case 'block':
            oscillator.frequency.value = 200;
            oscillator.type = 'square';
            break;
    }
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Speed Monitoring
function startSpeedMonitoring() {
    let downloadSpeed = 0;
    let uploadSpeed = 0;
    
    setInterval(() => {
        // Simulate speed fluctuations
        downloadSpeed = 50 + Math.random() * 100;
        uploadSpeed = 10 + Math.random() * 30;
        
        // Update display
        document.getElementById('download-speed').textContent = downloadSpeed.toFixed(1);
        document.getElementById('upload-speed').textContent = uploadSpeed.toFixed(1);
        document.getElementById('network-speed').textContent = `${downloadSpeed.toFixed(1)} Mbps`;
        
        // Update speed bar
        const speedPercentage = (downloadSpeed / 150) * 100;
        document.getElementById('speed-fill').style.width = `${speedPercentage}%`;
    }, 2000);
}

// Connection Log
function addLogEntry(message, status) {
    const logSection = document.getElementById('connection-log');
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    
    const timestamp = new Date().toLocaleTimeString();
    
    logItem.innerHTML = `
        <span class="log-time">${timestamp}</span>
        <span class="log-status ${status}">${message}</span>
    `;
    
    logSection.insertBefore(logItem, logSection.firstChild);
    
    // Keep only last 50 logs
    while (logSection.children.length > 50) {
        logSection.removeChild(logSection.lastChild);
    }
}

// Browser Functions
function navigate() {
    const url = document.getElementById('browser-url').value;
    if (url) {
        // Simulate navigation
        addLogEntry(`Navigated to ${url}`, 'allowed');
    }
}

// Simulate Incoming Connections
function simulateIncomingConnections() {
    const deviceTypes = [
        {type: 'Ethernet', icon: '🌐'},
        {type: 'Bluetooth', icon: '📶'},
        {type: 'Infrared', icon: '📡'}
    ];
    
    const deviceNames = [
        'Unknown Device', 'Mobile Phone', 'Laptop', 'Tablet', 
        'Smart TV', 'IoT Device', 'Router', 'Server'
    ];
    
    const locations = [
        'New York, USA', 'London, UK', 'Tokyo, Japan', 
        'Paris, France', 'Berlin, Germany', 'Sydney, Australia'
    ];
    
    setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance of new connection
            const deviceId = Date.now().toString();
            const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
            const deviceName = deviceNames[Math.floor(Math.random() * deviceNames.length)];
            const location = locations[Math.floor(Math.random() * locations.length)];
            
            const device = {
                id: deviceId,
                name: `${deviceName} ${Math.floor(Math.random() * 1000)}`,
                ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                type: deviceType.type,
                icon: deviceType.icon,
                location: location
            };
            
            // Check if blocked
            if (!blockedDevices.includes(deviceId)) {
                showAlert(device);
                addDevice(device);
            }
        }
    }, 8000); // New connection attempt every 8 seconds
}

// Update Connection Count
function updateConnectionCount() {
    document.getElementById('connection-count').textContent = activeConnections;
}

// Initialize with some sample data
setTimeout(() => {
    addLogEntry('Network Monitor Dashboard initialized', 'allowed');
    addLogEntry('Scanning for network connections...', 'allowed');
    addLogEntry('Security protocols activated', 'allowed');
    addLogEntry('Owner: Olawale Abdul-Ganiyu', 'allowed');
}, 1000);