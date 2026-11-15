// Unified Git Auto-Pull & Auto-Push engine for the Minecraft server panel.
// Single-flight locked so git operations never collide on .git/index.lock.
'use strict';

const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const WEB_PANEL_DIR = __dirname;
const AUDIT_LOG_PATH = path.join(__dirname, 'logs', 'command-audit.log');

let isSyncing = false;
let lastStatus = { state: 'idle', message: 'Git sync ready' };
const statusListeners = [];

function onStatus(cb) {
  statusListeners.push(cb);
}

function getLastStatus() {
  return lastStatus;
}

function timestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
         `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function audit(message) {
  try {
    fs.mkdirSync(path.dirname(AUDIT_LOG_PATH), { recursive: true });
    fs.appendFileSync(AUDIT_LOG_PATH, `[${timestamp()}] [GIT] ${message}\n`, 'utf8');
  } catch (_) {}
}

function report(state, message) {
  lastStatus = { state, message };
  audit(message);
  const payload = { type: 'git_status', state, message };
  for (const cb of statusListeners) {
    try { cb(payload); } catch (_) {}
  }
  return lastStatus;
}

function git(args, timeoutMs = 15000, env = null) {
  return new Promise((resolve, reject) => {
    execFile('git', args, {
      cwd: ROOT,
      timeout: timeoutMs,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
      env: env ? { ...process.env, ...env } : process.env
    }, (err, stdout, stderr) => {
      if (err) {
        err.stderr = (stderr || '').toString();
        reject(err);
      } else {
        resolve(stdout.toString().trim());
      }
    });
  });
}

function isOfflineError(err) {
  const text = `${err.message || ''} ${err.stderr || ''}`.toLowerCase();
  return text.includes('could not resolve') ||
         text.includes('timed out') ||
         text.includes('connection') ||
         text.includes('network') ||
         text.includes('unable to access') ||
         text.includes('failed to connect') ||
         text.includes('the remote end hung up');
}

async function checkOnline() {
  try {
    await git(['ls-remote', '--heads', 'origin', 'HEAD'], 8000);
    return true;
  } catch (_) {
    return false;
  }
}

async function pullLatest(isServerActive) {
  if (isSyncing) {
    return { state: 'skipped', message: 'Sync already in progress' };
  }
  if (isServerActive) {
    return report('skipped', 'Server running — pull skipped');
  }

  isSyncing = true;
  try {
    // Never overwrite uncommitted local work
    const dirty = await git(['status', '--porcelain']);
    if (dirty) {
      return report('dirty', 'Local unsaved changes — pull skipped');
    }

    if (!(await checkOnline())) {
      return report('offline', 'Offline — using local files');
    }

    const beforeHash = await git(['rev-parse', 'HEAD']);
    await git(['pull', '--ff-only'], 15000);
    const afterHash = await git(['rev-parse', 'HEAD']);

    // If panel dependencies changed, reinstall production deps
    if (beforeHash !== afterHash) {
      const changed = await git(['diff', '--name-only', beforeHash, afterHash]);
      if (changed.split(/\r?\n/).includes('web-panel/package.json')) {
        await new Promise((resolve, reject) => {
          execFile('npm', ['install', '--omit=dev'], {
            cwd: WEB_PANEL_DIR,
            timeout: 120000,
            windowsHide: true,
            shell: true
          }, (err) => (err ? reject(err) : resolve()));
        });
      }
    }

    const short = (await git(['rev-parse', '--short', 'HEAD'])).slice(0, 7);
    return report('synced', `Synced from GitHub (${short})`);
  } catch (err) {
    if (isOfflineError(err)) {
      return report('offline', 'Offline — using local files');
    }
    return report('error', `Pull failed: ${(err.stderr || err.message || '').toString().split('\n')[0]}`);
  } finally {
    isSyncing = false;
  }
}

async function pushLatest(reason, isServerActive) {
  if (isSyncing) {
    return { state: 'skipped', message: 'Sync already in progress' };
  }
  if (isServerActive) {
    return report('skipped', 'Server running — push skipped');
  }

  isSyncing = true;
  report('pushing', 'Pushing world & server changes to GitHub...');
  try {
    const porcelain = await git(['status', '--porcelain']);
    if (!porcelain) {
      let ahead = '0';
      try {
        ahead = await git(['rev-list', '--count', '@{u}..HEAD']);
      } catch (_) {}
      if (ahead === '0') {
        return report('synced', 'Already up to date on GitHub');
      }
    }

    // Always commit locally first — world saves must never be lost to a network drop
    await git(['add', '-A']);
    const stamp = timestamp();
    await git(['commit', '-m', `Auto-save server & world (${reason}) [${stamp}]`], 20000);

    // Then push directly; never prompt for credentials
    await git(['push'], 120000, { GIT_TERMINAL_PROMPT: '0' });

    const short = (await git(['rev-parse', '--short', 'HEAD'])).slice(0, 7);
    return report('pushed', `Pushed latest save to GitHub (${short})`);
  } catch (err) {
    const msg = (err.stderr || err.message || '').toString();
    // Commit may fail when there is genuinely nothing new to commit
    if (msg.includes('nothing to commit')) {
      return report('synced', 'Already up to date on GitHub');
    }
    // Only classify as offline for real network/DNS failures
    const lower = msg.toLowerCase();
    if (lower.includes('could not resolve') ||
        lower.includes('failed to connect') ||
        lower.includes('connection timed out') ||
        lower.includes('unable to access') ||
        lower.includes('network is unreachable') ||
        lower.includes('connection refused')) {
      return report('offline', 'Offline — changes saved locally only');
    }
    audit(`Push failed details: ${msg.split('\n').slice(0, 3).join(' | ')}`);
    return report('error', 'Push failed — check logs');
  } finally {
    isSyncing = false;
  }
}

module.exports = { pullLatest, pushLatest, onStatus, getLastStatus };
