// Manual Git Sync engine for the Minecraft server panel.
// Single-flight locked so git operations never collide on .git/index.lock.
// All sync is manual-only (⬇ Pull / ⬆ Push buttons) — nothing runs automatically.
'use strict';

const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const AUDIT_LOG_PATH = path.join(__dirname, 'logs', 'command-audit.log');

let isSyncing = false;
let lastStatus = { state: 'ready', message: 'Git: Ready (Manual Sync)' };
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

const GIT_ENV = { GIT_TERMINAL_PROMPT: '0' };
const GIT_TIMEOUT = 120000;

function firstLine(text) {
  return (text || '').toString().split(/\r?\n/).map(l => l.trim()).filter(Boolean)[0] || '';
}

// ⬇ Pull — manual only. Refuses to run while the server is active or when
// local uncommitted changes exist, so world saves are never overwritten.
async function pullLatest(isServerActive) {
  if (isSyncing) {
    return { state: 'skipped', message: 'Sync already in progress' };
  }
  if (isServerActive) {
    return report('skipped', 'Server running — pull skipped');
  }

  isSyncing = true;
  report('pulling', 'Pulling latest from GitHub...');
  try {
    audit('git status --porcelain');
    const dirty = await git(['status', '--porcelain']);
    if (dirty) {
      return report('dirty', 'Unsaved local changes — commit/push or discard before pulling');
    }

    audit('git pull origin main');
    const out = await git(['pull', 'origin', 'main'], GIT_TIMEOUT, GIT_ENV);
    audit(`git pull origin main => ${firstLine(out) || 'ok'}`);

    if (/already up[ -]?to[ -]?date/i.test(out)) {
      return report('synced', 'Already up to date');
    }
    return report('synced', 'Pulled latest from main');
  } catch (err) {
    const detail = firstLine(err.stderr) || firstLine(err.message) || 'unknown error';
    audit(`git pull origin main FAILED: ${detail}`);
    return report('error', detail);
  } finally {
    isSyncing = false;
  }
}

// ⬆ Push — manual only. Stages everything, commits world/server saves, then
// pushes to origin/main. Never prompts for credentials.
async function pushLatest(reason, isServerActive) {
  if (isSyncing) {
    return { state: 'skipped', message: 'Sync already in progress' };
  }
  if (isServerActive) {
    return report('skipped', 'Server running — push skipped');
  }

  isSyncing = true;
  report('pushing', 'Pushing to GitHub...');
  try {
    audit('git add -A');
    await git(['add', '-A']);

    audit('git status --porcelain');
    const porcelain = await git(['status', '--porcelain']);
    if (porcelain) {
      const stamp = timestamp();
      // Use the machine's configured identity when present; fall back to an
      // inline identity so the commit still works on a friend's PC.
      let configured = '';
      try { configured = await git(['config', 'user.name']); } catch (_) {}
      const commitArgs = configured
        ? ['commit', '-m', `Save server & world [${stamp}]`]
        : ['-c', 'user.name=Minecraft Host', '-c', 'user.email=host@local',
           'commit', '-m', `Save server & world [${stamp}]`];
      audit(`git ${commitArgs.join(' ')}`);
      await git(commitArgs, 20000);
    }

    audit('git push -u origin main');
    await git(['push', '-u', 'origin', 'main'], GIT_TIMEOUT, GIT_ENV);

    const short = (await git(['rev-parse', '--short', 'HEAD'])).slice(0, 7);
    return report('pushed', `Pushed to main (${short})`);
  } catch (err) {
    const detail = firstLine(err.stderr) || firstLine(err.message) || 'unknown error';
    audit(`git push FAILED: ${detail}`);
    return report('error', detail);
  } finally {
    isSyncing = false;
  }
}

module.exports = { pullLatest, pushLatest, onStatus, getLastStatus };
