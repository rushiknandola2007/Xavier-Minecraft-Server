const path = require('path');
const os = require('os');
const fs = require('fs');
const http = require('http');
const net = require('net');
const crypto = require('crypto');
const { spawn, exec, execFileSync } = require('child_process');
const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const multer = require('multer');
const gitSync = require('./git-sync');

// Auto-create .env from .env.example on first run so the panel works out of the box
const ENV_PATH = path.join(__dirname, '.env');
const ENV_EXAMPLE_PATH = path.join(__dirname, '.env.example');
if (!fs.existsSync(ENV_PATH) && fs.existsSync(ENV_EXAMPLE_PATH)) {
  try {
    fs.copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
  } catch (_) {}
}
require('dotenv').config({ path: ENV_PATH });

const PORT = parseInt(process.env.PORT, 10) || 3000;
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme123';
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || 'secret123';
const BRIDGE_URL = process.env.BRIDGE_URL || 'http://127.0.0.1:8081';

const SERVER_DIR = path.resolve(__dirname, '..');
const JAR_NAME = 'paper.jar';
const PROPERTIES_PATH = path.join(SERVER_DIR, 'server.properties');
const PLUGINS_DIR = path.join(SERVER_DIR, 'plugins');
const OPS_PATH = path.join(SERVER_DIR, 'ops.json');
const LOGS_DIR = path.join(__dirname, 'logs');
const AUDIT_LOG_PATH = path.join(LOGS_DIR, 'command-audit.log');

// Ensure required directories exist
if (!fs.existsSync(PLUGINS_DIR)) {
  fs.mkdirSync(PLUGINS_DIR, { recursive: true });
}
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const MAX_LOG_HISTORY = 500;
const adminTokens = new Set();
const logHistory = [];
const onlinePlayers = new Set();

let serverStatus = 'Offline'; // 'Offline' | 'Starting' | 'Online' | 'Stopping'
let minecraftProcess = null;
let serverStartTime = null;
let restartPending = false;

// Multer storage for plugin JAR uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PLUGINS_DIR),
  filename: (req, file, cb) => cb(null, path.basename(file.originalname))
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const lower = file.originalname.toLowerCase();
    if (lower.endsWith('.jar') || lower.endsWith('.jar.disabled')) {
      cb(null, true);
    } else {
      cb(new Error('Only .jar or .jar.disabled files are permitted.'));
    }
  },
  limits: { fileSize: 150 * 1024 * 1024 }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==============================================================================
// ADMIN AUTH — passcode unlock issues an in-memory bearer token
// ==============================================================================
function authenticateAdminToken(token) {
  return Boolean(token) && adminTokens.has(token);
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (authenticateAdminToken(token)) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Admin passcode required.' });
}

// ==============================================================================
// COMMAND AUDIT LOG — append-only record of every console & player command
// Format: [YYYY-MM-DD HH:MM:SS] [SOURCE] details
// ==============================================================================
function auditLog(source, details) {
  try {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
               `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    fs.appendFileSync(AUDIT_LOG_PATH, `[${ts}] [${source}] ${details}\n`, 'utf8');
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

// Network and Properties Helpers
function getTailscaleIp() {
  if (cachedTailscaleIp !== undefined) return cachedTailscaleIp;
  cachedTailscaleIp = null;

  try {
    const nets = os.networkInterfaces();
    const isTailscaleRange = (addr) => {
      const p = addr.split('.').map(Number);
      return p[0] === 100 && p[1] >= 64 && p[1] <= 127;
    };
    // Prefer an interface literally named "Tailscale"
    for (const [name, addrs] of Object.entries(nets)) {
      if (!/tailscale/i.test(name)) continue;
      for (const ni of addrs || []) {
        if (ni.family === 'IPv4' && !ni.internal && isTailscaleRange(ni.address)) {
          cachedTailscaleIp = ni.address;
          return cachedTailscaleIp;
        }
      }
    }
    // Then any interface in the 100.64.0.0/10 CGNAT range
    for (const addrs of Object.values(nets)) {
      for (const ni of addrs || []) {
        if (ni.family === 'IPv4' && !ni.internal && isTailscaleRange(ni.address)) {
          cachedTailscaleIp = ni.address;
          return cachedTailscaleIp;
        }
      }
    }
    // Fallback: `tailscale ip -4`
    try {
      const out = execFileSync('tailscale', ['ip', '-4'], { timeout: 3000 }).toString().trim().split(/\r?\n/)[0];
      if (out) cachedTailscaleIp = out;
    } catch (_) {}
  } catch (_) {}

  return cachedTailscaleIp;
}

let cachedTailscaleIp;

// Network and Properties Helpers
function getServerNetworkInfo() {
  let serverPort = '25565';
  let serverIp = '127.0.0.1';
  let motd = 'A Minecraft Server';
  let maxPlayers = '20';

  try {
    if (fs.existsSync(PROPERTIES_PATH)) {
      const content = fs.readFileSync(PROPERTIES_PATH, 'utf8');
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx !== -1) {
          const key = line.substring(0, eqIdx).trim();
          const val = line.substring(eqIdx + 1).trim();
          if (key === 'server-port') serverPort = val;
          if (key === 'server-ip') serverIp = val || '127.0.0.1';
          if (key === 'motd') motd = val;
          if (key === 'max-players') maxPlayers = val;
        }
      }
    }
  } catch (_) {}

  // Prefer the host's Tailscale IPv4 (100.64.0.0/10) so friends can connect remotely;
  // fall back to server-ip from server.properties.
  const shareIp = getTailscaleIp() || serverIp;
  return { ip: shareIp, port: serverPort, motd, maxPlayers: parseInt(maxPlayers, 10) || 20 };
}

function getServerUptimeSeconds() {
  if (!serverStartTime || serverStatus === 'Offline') {
    return 0;
  }
  return Math.floor((Date.now() - serverStartTime) / 1000);
}

function formatBytes(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getOpsList() {
  try {
    if (fs.existsSync(OPS_PATH)) {
      const data = JSON.parse(fs.readFileSync(OPS_PATH, 'utf8'));
      if (Array.isArray(data)) {
        return new Set(data.map(op => (op.name || '').toLowerCase()));
      }
    }
  } catch (_) {}
  return new Set();
}

function getPlayersData() {
  const ops = getOpsList();
  return Array.from(onlinePlayers).map(username => ({
    name: username,
    isOp: ops.has(username.toLowerCase()),
    avatar: `https://minotar.net/helm/${encodeURIComponent(username)}/64.png`
  }));
}

// WebSocket Broadcasts
function broadcastAll(payload) {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Live git sync status → every connected client (friend pill included)
gitSync.onStatus((payload) => broadcastAll(payload));

function broadcastPublicStatus() {
  const netInfo = getServerNetworkInfo();
  const payload = JSON.stringify({
    type: 'public_status',
    status: serverStatus,
    uptime: getServerUptimeSeconds(),
    playerCount: onlinePlayers.size,
    maxPlayers: netInfo.maxPlayers,
    serverIp: netInfo.ip,
    serverPort: netInfo.port,
    pid: minecraftProcess ? minecraftProcess.pid : null
  });

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function broadcastAdmin(payload) {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN && client.isAdmin) {
      client.send(message);
    }
  }
}

function pushLog(line, stream = 'stdout') {
  const timestamp = new Date().toLocaleTimeString();
  const entry = { text: line, stream, timestamp };
  logHistory.push(entry);
  if (logHistory.length > MAX_LOG_HISTORY) {
    logHistory.shift();
  }
  // Console logs are ONLY streamed to authenticated Admin clients
  broadcastAdmin({ type: 'log', entry });
}

function setServerStatus(newStatus) {
  serverStatus = newStatus;
  if (newStatus === 'Online' && !serverStartTime) {
    serverStartTime = Date.now();
  } else if (newStatus === 'Offline') {
    serverStartTime = null;
    onlinePlayers.clear();
    broadcastAdmin({ type: 'players', players: [] });
  }

  broadcastPublicStatus();
  broadcastAdmin({
    type: 'status',
    status: serverStatus,
    uptime: getServerUptimeSeconds(),
    pid: minecraftProcess ? minecraftProcess.pid : null,
  });
}

function handleServerOutput(chunk, stream = 'stdout') {
  const lines = chunk.toString().split(/\r?\n/);
  for (const line of lines) {
    if (!line && line.trim() === '') continue;

    pushLog(line, stream);

    // Online detection
    if (serverStatus === 'Starting') {
      const lower = line.toLowerCase();
      if (lower.includes('done (') || lower.includes('for help, type "help"') || lower.includes('timings reset')) {
        setServerStatus('Online');
        setTimeout(() => {
          if (minecraftProcess && serverStatus === 'Online' && minecraftProcess.stdin.writable) {
            minecraftProcess.stdin.write('list\n');
          }
        }, 1500);
      }
    }

    // Player Join Parsing
    const joinMatch = line.match(/(?:INFO\]:\s+)([a-zA-Z0-9_]{2,16})(?:\[.*?\]\s+logged in with entity id|\s+joined the game)/i);
    if (joinMatch) {
      const username = joinMatch[1];
      onlinePlayers.add(username);
      broadcastPublicStatus();
      broadcastAdmin({ type: 'players', players: getPlayersData() });
    }

    // Player Leave Parsing
    const leaveMatch = line.match(/(?:INFO\]:\s+)([a-zA-Z0-9_]{2,16})\s+(?:lost connection|left the game)/i);
    if (leaveMatch) {
      const username = leaveMatch[1];
      onlinePlayers.delete(username);
      broadcastPublicStatus();
      broadcastAdmin({ type: 'players', players: getPlayersData() });
    }

    // In-game player command audit: "<name> issued server command: /<cmd>"
    const issuedMatch = line.match(/([A-Za-z0-9_]{2,16}) issued server command: (\/\S+)/);
    if (issuedMatch) {
      auditLog(`PLAYER:${issuedMatch[1]}`, issuedMatch[2]);
    }

    // List Output Parsing
    const listMatch = line.match(/There are \d+ of a max of \d+ players online:(.*)/i);
    if (listMatch) {
      const namesPart = listMatch[1].trim();
      onlinePlayers.clear();
      if (namesPart) {
        namesPart.split(',').forEach(n => {
          const clean = n.trim();
          if (clean) onlinePlayers.add(clean);
        });
      }
      broadcastPublicStatus();
      broadcastAdmin({ type: 'players', players: getPlayersData() });
    }
  }
}

// Silent Child Process Manager (windowsHide: true)
function startMinecraftServer() {
  if (serverStatus !== 'Offline' || minecraftProcess) {
    throw new Error(`Cannot start server: current status is ${serverStatus}`);
  }

  setServerStatus('Starting');
  restartPending = false;
  onlinePlayers.clear();
  broadcastAdmin({ type: 'players', players: [] });
  pushLog(`[Panel]: Launching Paper server (2G-4G, silent background)...`, 'system');

  const args = ['-Xms2G', '-Xmx4G', '-jar', JAR_NAME, '--nogui'];

  minecraftProcess = spawn('java', args, {
    cwd: SERVER_DIR,
    shell: false,
    windowsHide: true, // Silent execution with no CMD window
    stdio: ['pipe', 'pipe', 'pipe']
  });

  minecraftProcess.stdout.on('data', (data) => handleServerOutput(data, 'stdout'));
  minecraftProcess.stderr.on('data', (data) => handleServerOutput(data, 'stderr'));

  minecraftProcess.on('error', (err) => {
    pushLog(`[Panel Error]: Failed to spawn Java process: ${err.message}`, 'stderr');
    setServerStatus('Offline');
    minecraftProcess = null;
  });

  minecraftProcess.on('close', (code, signal) => {
    pushLog(`[Panel]: Process stopped (code: ${code}, signal: ${signal || 'none'})`, 'system');
    minecraftProcess = null;
    const wasRestart = restartPending;
    restartPending = false;
    setServerStatus('Offline');

    // Auto-push world & config to GitHub once the process has fully exited
    gitSync.pushLatest('server-stop', false).catch(() => {});

    if (wasRestart) {
      pushLog(`[Panel]: Restart initiated. Relaunching...`, 'system');
      setTimeout(() => {
        try {
          startMinecraftServer();
        } catch (err) {
          pushLog(`[Panel Error]: Restart failed: ${err.message}`, 'stderr');
        }
      }, 1500);
    }
  });

  return { success: true, pid: minecraftProcess.pid };
}

function stopMinecraftServer() {
  if (serverStatus === 'Offline') {
    throw new Error('Server is currently offline.');
  }
  if (!minecraftProcess) {
    throw new Error('Server was not started by this panel; cannot send stop.');
  }
  if (serverStatus === 'Stopping') {
    throw new Error('Server is already stopping.');
  }

  setServerStatus('Stopping');
  pushLog('[Panel]: Sending "stop" command to server...', 'system');
  minecraftProcess.stdin.write('stop\n');
  return { success: true };
}

function restartMinecraftServer() {
  if (serverStatus === 'Offline' || !minecraftProcess) {
    return startMinecraftServer();
  }

  restartPending = true;
  pushLog('[Panel]: Restart requested. Stopping active instance...', 'system');
  if (serverStatus !== 'Stopping') {
    minecraftProcess.stdin.write('stop\n');
    setServerStatus('Stopping');
  }
  return { success: true, message: 'Restart queued.' };
}

function forceKillMinecraftServer() {
  if (!minecraftProcess && serverStatus === 'Offline') {
    throw new Error('No active process to terminate.');
  }

  restartPending = false;
  const pid = minecraftProcess ? minecraftProcess.pid : null;
  pushLog(`[Panel]: Force terminating server process (PID: ${pid})...`, 'system');

  if (pid) {
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${pid} /T /F`, () => {
        try {
          if (minecraftProcess) minecraftProcess.kill('SIGKILL');
        } catch (_) {}
      });
    } else {
      try {
        minecraftProcess.kill('SIGKILL');
      } catch (_) {}
    }
  }

  minecraftProcess = null;
  setServerStatus('Offline');
  return { success: true };
}

function sendConsoleCommand(command) {
  if (!command || !command.trim()) return false;
  if (!minecraftProcess || serverStatus === 'Offline' || !minecraftProcess.stdin.writable) {
    throw new Error('Cannot send command: server is offline.');
  }

  const cleanCmd = command.trim();
  pushLog(`> ${cleanCmd}`, 'input');
  auditLog('CONSOLE', cleanCmd);
  minecraftProcess.stdin.write(`${cleanCmd}\n`);
  return true;
}

// ==============================================================================
// PUBLIC ENDPOINTS (Friend View - No Admin Token Required)
// ==============================================================================

app.get('/api/public/status', (req, res) => {
  const netInfo = getServerNetworkInfo();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return res.json({
    status: serverStatus,
    serverUptime: getServerUptimeSeconds(),
    pid: minecraftProcess ? minecraftProcess.pid : null,
    serverIp: netInfo.ip,
    serverPort: netInfo.port,
    motd: netInfo.motd,
    playerCount: onlinePlayers.size,
    maxPlayers: netInfo.maxPlayers,
    ram: {
      totalMb: formatBytes(totalMem),
      usedMb: formatBytes(usedMem),
      freeMb: formatBytes(freeMem),
      usagePercent: ((usedMem / totalMem) * 100).toFixed(1)
    }
  });
});

app.post('/api/public/start', (req, res) => {
  try {
    auditLog('PANEL', 'Start Server');
    const result = startMinecraftServer();
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.post('/api/public/stop', (req, res) => {
  try {
    auditLog('PANEL', 'Stop Server');
    const result = stopMinecraftServer();
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Admin passcode unlock — issues a session token for all admin routes/WS
app.post('/api/admin/unlock', (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASS) {
    const token = crypto.randomBytes(24).toString('hex');
    adminTokens.add(token);
    auditLog('ADMIN', 'Admin mode unlocked');
    return res.json({ success: true, token });
  }
  auditLog('ADMIN', 'Failed unlock attempt');
  return res.status(401).json({ success: false, error: 'Incorrect passcode' });
});

// ==============================================================================
// SERVER CONTROL ENDPOINTS (admin token required)
// ==============================================================================

app.post('/api/server/restart', requireAdmin, (req, res) => {
  try {
    auditLog('PANEL', 'Restart');
    const result = restartMinecraftServer();
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.post('/api/server/kill', requireAdmin, (req, res) => {
  try {
    auditLog('PANEL', 'Force Kill');
    const result = forceKillMinecraftServer();
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.post('/api/server/command', requireAdmin, (req, res) => {
  const { command } = req.body || {};
  try {
    sendConsoleCommand(command);
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.get('/api/system/stats', requireAdmin, (req, res) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memoryUsage = process.memoryUsage();
  const netInfo = getServerNetworkInfo();

  return res.json({
    status: serverStatus,
    serverUptime: getServerUptimeSeconds(),
    pid: minecraftProcess ? minecraftProcess.pid : null,
    systemUptime: Math.floor(os.uptime()),
    serverIp: netInfo.ip,
    serverPort: netInfo.port,
    playerCount: onlinePlayers.size,
    maxPlayers: netInfo.maxPlayers,
    ram: {
      totalMb: formatBytes(totalMem),
      usedMb: formatBytes(usedMem),
      freeMb: formatBytes(freeMem),
      usagePercent: ((usedMem / totalMem) * 100).toFixed(1)
    },
    nodeRam: {
      rssMb: formatBytes(memoryUsage.rss),
      heapUsedMb: formatBytes(memoryUsage.heapUsed),
      heapTotalMb: formatBytes(memoryUsage.heapTotal)
    }
  });
});

// Manual Git Sync (friend-screen buttons; internally skips while server is active)
app.post('/api/git/pull', async (req, res) => {
  try {
    const result = await gitSync.pullLatest(isServerRunning());
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ state: 'error', message: err.message });
  }
});

app.post('/api/git/push', async (req, res) => {
  try {
    const result = await gitSync.pushLatest('manual', isServerRunning());
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ state: 'error', message: err.message });
  }
});

// Command Audit Log API — latest entries from command-audit.log
app.get('/api/command-logs', requireAdmin, (req, res) => {
  try {
    if (!fs.existsSync(AUDIT_LOG_PATH)) {
      return res.json({ entries: [] });
    }
    const lines = fs.readFileSync(AUDIT_LOG_PATH, 'utf8').split(/\r?\n/).filter(l => l.trim());
    const entries = lines.slice(-300).reverse();
    return res.json({ entries });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read command log: ' + err.message });
  }
});

// Online Players API
app.get('/api/players', requireAdmin, (req, res) => {
  return res.json({ players: getPlayersData() });
});

app.post('/api/players/refresh', requireAdmin, (req, res) => {
  if (serverStatus !== 'Online' || !minecraftProcess || !minecraftProcess.stdin.writable) {
    return res.json({ success: false, message: 'Server is not online' });
  }
  auditLog('PANEL', 'Player list refresh');
  minecraftProcess.stdin.write('list\n');
  return res.json({ success: true });
});

app.post('/api/players/action', requireAdmin, (req, res) => {
  const { player, action, value } = req.body || {};
  if (!player || typeof player !== 'string') {
    return res.status(400).json({ error: 'Player name is required' });
  }

  const cleanPlayer = player.trim();
  let cmd = '';

  switch (action) {
    case 'kill':
      cmd = `kill ${cleanPlayer}`;
      break;
    case 'kick':
      cmd = `kick ${cleanPlayer}${value ? ' ' + value.trim() : ''}`;
      break;
    case 'ban':
      cmd = `ban ${cleanPlayer}${value ? ' ' + value.trim() : ''}`;
      break;
    case 'op':
      cmd = `op ${cleanPlayer}`;
      break;
    case 'deop':
      cmd = `deop ${cleanPlayer}`;
      break;
    case 'gamemode':
      cmd = `gamemode ${value || 'survival'} ${cleanPlayer}`;
      break;
    case 'clear':
      cmd = `clear ${cleanPlayer}`;
      break;
    default:
      return res.status(400).json({ error: `Unsupported player action: ${action}` });
  }

  try {
    auditLog('PANEL', `Player action: ${action} on ${cleanPlayer}${value ? ' ' + value.trim() : ''}`);
    sendConsoleCommand(cmd);
    if (action === 'op' || action === 'deop') {
      setTimeout(() => broadcastAdmin({ type: 'players', players: getPlayersData() }), 600);
    }
    return res.json({ success: true, command: cmd });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// server.properties API
app.get('/api/properties', requireAdmin, (req, res) => {
  try {
    if (!fs.existsSync(PROPERTIES_PATH)) {
      return res.status(404).json({ error: 'server.properties not found' });
    }

    const content = fs.readFileSync(PROPERTIES_PATH, 'utf8');
    const lines = content.split(/\r?\n/);
    const properties = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx !== -1) {
        properties[line.substring(0, eqIdx).trim()] = line.substring(eqIdx + 1).trim();
      }
    }

    return res.json({ properties, raw: content });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read server.properties: ' + err.message });
  }
});

app.post('/api/properties', requireAdmin, (req, res) => {
  try {
    const { updates, restart } = req.body || {};
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Invalid updates payload' });
    }

    if (!fs.existsSync(PROPERTIES_PATH)) {
      return res.status(404).json({ error: 'server.properties not found' });
    }

    const originalContent = fs.readFileSync(PROPERTIES_PATH, 'utf8');
    const lines = originalContent.split(/\r?\n/);
    const updatedKeys = new Set();

    const newLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) return line;
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) return line;

      const key = line.substring(0, eqIdx).trim();
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        updatedKeys.add(key);
        return `${key}=${updates[key]}`;
      }
      return line;
    });

    for (const [key, value] of Object.entries(updates)) {
      if (!updatedKeys.has(key)) {
        newLines.push(`${key}=${value}`);
      }
    }

    fs.writeFileSync(PROPERTIES_PATH, newLines.join('\n'), 'utf8');
    auditLog('PANEL', `server.properties saved${restart ? ' (with restart)' : ''}`);
    pushLog('[Panel]: server.properties updated by administrator.', 'system');

    if (restart) {
      restartMinecraftServer();
    }

    return res.json({
      success: true,
      message: restart ? 'Properties saved and server restart initiated.' : 'Properties saved successfully.',
      restart: Boolean(restart)
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update server.properties: ' + err.message });
  }
});

// Plugin Manager API
app.get('/api/plugins', requireAdmin, (req, res) => {
  try {
    if (!fs.existsSync(PLUGINS_DIR)) {
      return res.json({ plugins: [] });
    }

    const files = fs.readdirSync(PLUGINS_DIR);
    const plugins = [];

    for (const file of files) {
      const lower = file.toLowerCase();
      if (lower.endsWith('.jar') || lower.endsWith('.jar.disabled')) {
        const fullPath = path.join(PLUGINS_DIR, file);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            plugins.push({
              name: file,
              enabled: !lower.endsWith('.disabled'),
              sizeBytes: stat.size,
              formattedSize: formatFileSize(stat.size),
              modified: stat.mtime
            });
          }
        } catch (_) {}
      }
    }

    plugins.sort((a, b) => a.name.localeCompare(b.name));
    return res.json({ plugins });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list plugins: ' + err.message });
  }
});

app.post('/api/plugins/upload', requireAdmin, (req, res) => {
  upload.single('plugin')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No plugin file provided.' });
    auditLog('PANEL', `Plugin uploaded: ${req.file.filename}`);
    pushLog(`[Panel]: Plugin uploaded: ${req.file.filename}`, 'system');
    return res.json({ success: true, filename: req.file.filename });
  });
});

app.post('/api/plugins/toggle', requireAdmin, (req, res) => {
  try {
    const { filename } = req.body || {};
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const safeFilename = path.basename(filename);
    const currentPath = path.join(PLUGINS_DIR, safeFilename);

    if (!fs.existsSync(currentPath)) {
      return res.status(404).json({ error: `Plugin not found: ${safeFilename}` });
    }

    let newFilename = '';
    if (safeFilename.toLowerCase().endsWith('.jar')) {
      newFilename = `${safeFilename}.disabled`;
    } else if (safeFilename.toLowerCase().endsWith('.jar.disabled')) {
      newFilename = safeFilename.slice(0, -9);
    } else {
      return res.status(400).json({ error: 'Invalid plugin file extension' });
    }

    fs.renameSync(currentPath, path.join(PLUGINS_DIR, newFilename));
    auditLog('PANEL', `Plugin ${newFilename.toLowerCase().endsWith('.disabled') ? 'disabled' : 'enabled'}: ${newFilename}`);
    pushLog(`[Panel]: Plugin renamed: ${safeFilename} -> ${newFilename}`, 'system');
    return res.json({
      success: true,
      filename: newFilename,
      enabled: !newFilename.toLowerCase().endsWith('.disabled')
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle plugin: ' + err.message });
  }
});

app.delete('/api/plugins/:filename', requireAdmin, (req, res) => {
  try {
    const safeFilename = path.basename(req.params.filename);
    const targetPath = path.join(PLUGINS_DIR, safeFilename);

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: `Plugin not found: ${safeFilename}` });
    }

    fs.unlinkSync(targetPath);
    auditLog('PANEL', `Plugin deleted: ${safeFilename}`);
    pushLog(`[Panel]: Plugin deleted: ${safeFilename}`, 'system');
    return res.json({ success: true, filename: safeFilename });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete plugin: ' + err.message });
  }
});

// Bridge Proxy API
async function forwardToBridge(endpointPath, method = 'GET', body = null) {
  const url = `${BRIDGE_URL}${endpointPath}`;
  const headers = {
    'X-Bridge-Secret': BRIDGE_SECRET,
    'Content-Type': 'application/json'
  };
  const options = { method, headers };
  if (body) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const response = await fetch(url, options);
  const data = await response.json();
  return { status: response.status, data };
}

app.get('/api/bridge/player/:name', requireAdmin, async (req, res) => {
  try {
    const result = await forwardToBridge(`/player/${encodeURIComponent(req.params.name)}`, 'GET');
    return res.status(result.status).json(result.data);
  } catch (err) {
    return res.status(503).json({
      error: 'Paper Bridge plugin is offline or unreachable on ' + BRIDGE_URL + '. Ensure the Paper server is online and ServerPanelBridge.jar is installed (restart the server to load it).'
    });
  }
});

app.post('/api/bridge/player/:name/move', requireAdmin, async (req, res) => {
  try {
    auditLog('PANEL', `Inventory move on ${req.params.name}: ${JSON.stringify(req.body || {})}`);
    const result = await forwardToBridge(`/player/${encodeURIComponent(req.params.name)}/move`, 'POST', req.body);
    return res.status(result.status).json(result.data);
  } catch (err) {
    return res.status(503).json({ error: 'Paper Bridge plugin is offline or unreachable: ' + err.message });
  }
});

app.post('/api/bridge/player/:name/item', requireAdmin, async (req, res) => {
  try {
    auditLog('PANEL', `Inventory edit on ${req.params.name}: ${JSON.stringify(req.body || {})}`);
    const result = await forwardToBridge(`/player/${encodeURIComponent(req.params.name)}/item`, 'POST', req.body);
    return res.status(result.status).json(result.data);
  } catch (err) {
    return res.status(503).json({ error: 'Paper Bridge plugin is offline or unreachable: ' + err.message });
  }
});

// WebSocket Server Handling (no auth — local desktop panel)
wss.on('connection', (ws, req) => {
  // Send full initial state on connection
  const netInfo = getServerNetworkInfo();
  ws.send(JSON.stringify({
    type: 'public_status',
    status: serverStatus,
    uptime: getServerUptimeSeconds(),
    playerCount: onlinePlayers.size,
    maxPlayers: netInfo.maxPlayers,
    serverIp: netInfo.ip,
    serverPort: netInfo.port
  }));

  // Current git sync state for the friend-screen pill
  ws.send(JSON.stringify(gitSync.getLastStatus()));

  // Admin data (console logs, players, full status) is only sent after auth
  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());

      // Admin auth upgrade
      if (parsed.type === 'auth') {
        if (authenticateAdminToken(parsed.token)) {
          ws.isAdmin = true;
          ws.send(JSON.stringify({
            type: 'init_admin',
            status: serverStatus,
            uptime: getServerUptimeSeconds(),
            pid: minecraftProcess ? minecraftProcess.pid : null,
            logs: logHistory,
            players: getPlayersData()
          }));
        } else {
          ws.isAdmin = false;
          ws.send(JSON.stringify({ type: 'error', error: 'Invalid admin token.' }));
        }
        return;
      }

      // Console Command Execution (admin only)
      if (parsed.type === 'command') {
        if (!ws.isAdmin) {
          ws.send(JSON.stringify({ type: 'error', error: 'Admin authentication required.' }));
          return;
        }
        sendConsoleCommand(parsed.command);
        return;
      }

      // Actions (admin only)
      if (parsed.type === 'action') {
        if (!ws.isAdmin) {
          ws.send(JSON.stringify({ type: 'error', error: 'Admin authentication required.' }));
          return;
        }
        if (parsed.action === 'start') {
          auditLog('PANEL', 'Start Server');
          startMinecraftServer();
        } else if (parsed.action === 'stop') {
          auditLog('PANEL', 'Stop Server');
          stopMinecraftServer();
        } else if (parsed.action === 'restart') {
          auditLog('PANEL', 'Restart');
          restartMinecraftServer();
        } else if (parsed.action === 'kill') {
          auditLog('PANEL', 'Force Kill');
          forceKillMinecraftServer();
        }
      }
    } catch (err) {
      if (ws.isAdmin) {
        ws.send(JSON.stringify({
          type: 'log',
          entry: {
            text: `[Panel Command Error]: ${err.message}`,
            stream: 'stderr',
            timestamp: new Date().toLocaleTimeString()
          }
        }));
      }
    }
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==============================================================================
// Startup port probe: if a Minecraft server is already listening on the
// configured port (e.g. started outside the panel), reflect it as Online.
// ==============================================================================
function probeMinecraftPort() {
  const netInfo = getServerNetworkInfo();
  const port = parseInt(netInfo.port, 10) || 25565;

  const markOfflineIfUnmanaged = () => {
    if (!minecraftProcess && serverStatus === 'Online') {
      setServerStatus('Offline');
      pushLog('[Panel]: Minecraft server is no longer responding; marked Offline.', 'system');
    }
  };

  const socket = net.createConnection({ host: '127.0.0.1', port }, () => {
    socket.destroy();
    if (serverStatus === 'Offline' && !minecraftProcess) {
      serverStartTime = Date.now();
      setServerStatus('Online');
      pushLog(`[Panel]: Detected an existing Minecraft server listening on port ${port}.`, 'system');
    }
  });
  socket.on('error', () => { socket.destroy(); markOfflineIfUnmanaged(); });
  socket.setTimeout(1500, () => { socket.destroy(); markOfflineIfUnmanaged(); });
}

// Periodic sync: refresh the player list via `list` while our managed server is
// Online, and re-probe the port so externally-run servers are tracked live.
setInterval(() => {
  if (serverStatus === 'Online' && minecraftProcess && minecraftProcess.stdin.writable) {
    try {
      minecraftProcess.stdin.write('list\n');
    } catch (_) {}
    return;
  }
  if (!minecraftProcess && (serverStatus === 'Online' || serverStatus === 'Offline')) {
    probeMinecraftPort();
  }
}, 60000);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Minecraft Panel] Port ${PORT} is already in use — another panel instance may be running.`);
  } else {
    console.error('[Minecraft Panel] HTTP server error:', err);
  }
});

server.listen(PORT, () => {
  console.log(`[Minecraft Panel] Server running at http://127.0.0.1:${PORT}`);
  console.log(`[Minecraft Panel] Target Minecraft Directory: ${SERVER_DIR}`);
  setTimeout(probeMinecraftPort, 500);
  setTimeout(probeMinecraftPort, 2500);
});

// ==============================================================================
// Runtime helpers exported for electron-main.js (safe shutdown on window close)
// ==============================================================================
function isServerRunning() {
  return serverStatus !== 'Offline' || Boolean(minecraftProcess);
}

function waitForServerOffline(timeoutMs = 30000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      if (!isServerRunning() || Date.now() - start > timeoutMs) {
        resolve(!isServerRunning());
        return;
      }
      setTimeout(check, 500);
    };
    check();
  });
}

module.exports = {
  isServerRunning,
  waitForServerOffline,
  gitPushLatest: (reason) => gitSync.pushLatest(reason, isServerRunning()),
  getServerStatus: () => serverStatus,
  stopMinecraftServer,
  forceKillMinecraftServer
};
