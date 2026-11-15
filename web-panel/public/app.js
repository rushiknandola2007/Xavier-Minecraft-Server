(() => {
  // DOM Elements: Top Header & Badges
  const badgeStatus = document.getElementById('badge-status');
  const badgeDot = document.getElementById('badge-dot');
  const badgeText = document.getElementById('badge-text');
  const statUptime = document.getElementById('stat-uptime');
  const statRam = document.getElementById('stat-ram');

  const headerServerAddr = document.getElementById('header-server-addr');
  const btnCopyHeaderIp = document.getElementById('btn-copy-header-ip');
  const btnStart = document.getElementById('btn-start');
  const btnStop = document.getElementById('btn-stop');
  const btnRestart = document.getElementById('btn-restart');
  const btnKill = document.getElementById('btn-kill');

  // DOM Elements: Friend Screen (Hero Overview)
  const heroStatusDot = document.getElementById('hero-status-dot');
  const heroStatusText = document.getElementById('hero-status-text');
  const friendMotd = document.getElementById('friend-motd');
  const friendServerAddr = document.getElementById('friend-server-addr');
  const btnCopyIp = document.getElementById('btn-copy-ip');
  const friendPlayerCount = document.getElementById('friend-player-count');
  const friendMaxPlayers = document.getElementById('friend-max-players');
  const friendRamUsage = document.getElementById('friend-ram-usage');
  const friendRamPct = document.getElementById('friend-ram-pct');
  const friendUptime = document.getElementById('friend-uptime');
  const btnHeroStart = document.getElementById('btn-hero-start');
  const btnHeroStop = document.getElementById('btn-hero-stop');

  // DOM Elements: Command Audit Log Modal
  const commandLogsModal = document.getElementById('command-logs-modal');
  const commandLogContent = document.getElementById('command-log-content');
  const btnCommandLogs = document.getElementById('btn-command-logs');
  const btnCommandLogsRefresh = document.getElementById('btn-command-logs-refresh');
  const btnCommandLogsClose = document.getElementById('btn-command-logs-close');

  // DOM Elements: Admin Navigation & Tabs
  const adminNavBar = document.getElementById('admin-nav-bar');
  const tabButtons = document.querySelectorAll('.tab-nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const tabBadgePlayers = document.getElementById('tab-badge-players');

  // DOM Elements: Console Tab
  const consoleOutput = document.getElementById('console-output');
  const consoleForm = document.getElementById('console-form');
  const consoleInput = document.getElementById('console-input');
  const consoleOfflineHint = document.getElementById('console-offline-hint');
  const btnSendCommand = document.getElementById('btn-send-command');
  const toggleAutoscroll = document.getElementById('toggle-autoscroll');
  const btnClearConsole = document.getElementById('btn-clear-console');
  const logCount = document.getElementById('log-count');

  // DOM Elements: Players Tab
  const playersContainer = document.getElementById('players-list-container');
  const btnRefreshPlayers = document.getElementById('btn-refresh-players');

  // DOM Elements: server.properties Tab
  const formProperties = document.getElementById('form-properties');
  const propsNotification = document.getElementById('props-notification');
  const btnReloadProps = document.getElementById('btn-reload-props');
  const btnSaveProps = document.getElementById('btn-save-props');
  const btnSaveRestartProps = document.getElementById('btn-save-restart-props');
  const btnSavePropsBottom = document.getElementById('btn-save-props-bottom');
  const btnSaveRestartPropsBottom = document.getElementById('btn-save-restart-props-bottom');
  const badgeCracked = document.getElementById('badge-cracked');

  const propMotd = document.getElementById('prop-motd');
  const propMaxPlayers = document.getElementById('prop-max-players');
  const propWhiteList = document.getElementById('prop-white-list');
  const propOnlineMode = document.getElementById('prop-online-mode');
  const propGamemode = document.getElementById('prop-gamemode');
  const propDifficulty = document.getElementById('prop-difficulty');
  const propPvp = document.getElementById('prop-pvp');
  const propAllowFlight = document.getElementById('prop-allow-flight');
  const propViewDistance = document.getElementById('prop-view-distance');
  const propSimulationDistance = document.getElementById('prop-simulation-distance');

  // DOM Elements: Plugin Manager (merged into Properties & Plugins tab)
  const formUploadPlugin = document.getElementById('form-upload-plugin');
  const pluginFileInput = document.getElementById('plugin-file-input');
  const pluginDropzone = document.getElementById('plugin-dropzone');
  const pluginUploadCard = document.getElementById('plugin-upload-card');
  const pluginUploadStatus = document.getElementById('plugin-upload-status');
  const pluginsTableBody = document.getElementById('plugins-table-body');
  const pluginsTableCount = document.getElementById('plugins-table-count');
  const pluginsEmpty = document.getElementById('plugins-empty');
  const btnRefreshPlugins = document.getElementById('btn-refresh-plugins');

  // DOM Elements: Live Inventory Modal
  const inventoryModal = document.getElementById('inventory-modal');
  const invPlayerAvatar = document.getElementById('inv-player-avatar');
  const invPlayerName = document.getElementById('inv-player-name');
  const invPlayerGamemode = document.getElementById('inv-player-gamemode');
  const invPlayerHp = document.getElementById('inv-player-hp');
  const invPlayerFood = document.getElementById('inv-player-food');
  const invPlayerCoords = document.getElementById('inv-player-coords');

  const invErrorBanner = document.getElementById('inv-error-banner');
  const invErrorText = document.getElementById('inv-error-text');
  const btnInvRetry = document.getElementById('btn-inv-retry');
  const btnInvRefresh = document.getElementById('btn-inv-refresh');
  const btnInvClose = document.getElementById('btn-inv-close');
  const btnInvCloseBottom = document.getElementById('btn-inv-close-bottom');

  const slotArmor39 = document.getElementById('slot-armor-39');
  const slotArmor38 = document.getElementById('slot-armor-38');
  const slotArmor37 = document.getElementById('slot-armor-37');
  const slotArmor36 = document.getElementById('slot-armor-36');
  const slotOffhand40 = document.getElementById('slot-offhand-40');

  const gridMainInv = document.getElementById('grid-main-inv');
  const gridHotbarInv = document.getElementById('grid-hotbar-inv');
  const gridEnderchest = document.getElementById('grid-enderchest');
  const btnInvGiveItem = document.getElementById('btn-inv-give-item');

  // DOM Elements: Slot Edit Modal
  const slotEditModal = document.getElementById('slot-edit-modal');
  const slotEditTitle = document.getElementById('slot-edit-title');
  const slotEditCurrent = document.getElementById('slot-edit-current');
  const slotEditMaterial = document.getElementById('slot-edit-material');
  const slotEditAmount = document.getElementById('slot-edit-amount');
  const btnSlotSetItem = document.getElementById('btn-slot-set-item');
  const slotEditAmountSection = document.getElementById('slot-edit-amount-section');
  const slotUpdateCountInput = document.getElementById('slot-update-count-input');
  const btnSlotUpdateCount = document.getElementById('btn-slot-update-count');
  const btnSlotClear = document.getElementById('btn-slot-clear');
  const btnSlotEditClose = document.getElementById('btn-slot-edit-close');
  const quickMatButtons = document.querySelectorAll('.btn-quick-mat');

  // DOM Elements: Quick Give Modal
  const quickGiveModal = document.getElementById('quick-give-modal');
  const giveMaterialInput = document.getElementById('give-material-input');
  const giveAmountInput = document.getElementById('give-amount-input');
  const btnSubmitQuickGive = document.getElementById('btn-submit-quick-give');
  const btnQuickGiveClose = document.getElementById('btn-quick-give-close');

  // DOM Elements: Passcode Modal & Lock
  const headerBrand = document.getElementById('header-brand');
  const btnAdminLock = document.getElementById('btn-admin-lock');
  const passcodeModal = document.getElementById('passcode-modal');
  const passcodeForm = document.getElementById('passcode-form');
  const passcodeInput = document.getElementById('passcode-input');
  const passcodeError = document.getElementById('passcode-error');
  const btnPasscodeClose = document.getElementById('btn-passcode-close');
  const btnPasscodeCancel = document.getElementById('btn-passcode-cancel');

  // Application State
  let adminToken = sessionStorage.getItem('panel_admin_token') || '';
  let isAdmin = Boolean(adminToken);
  let socket = null;
  let wsReconnectTimer = null;
  let statusPollTimer = null;
  let currentServerStatus = 'Offline';
  let totalLines = 0;
  let currentInspectPlayer = null;
  let currentEditingSlot = null;
  let draggedSlot = null;

  // Command History Navigation
  const commandHistory = [];
  let historyIndex = -1;
  let currentDraft = '';

  // Helpers
  function formatUptime(seconds) {
    if (!seconds || seconds <= 0) return '00:00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  }

  function stripAnsi(str) {
    if (!str) return '';
    return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // REST API Client
  async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = {};
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }

    const options = { method, headers };
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      options.body = body;
    }

    const res = await fetch(endpoint, options);
    if (res.status === 401 && isAdmin) {
      lockAdminMode();
      throw new Error('Admin session expired.');
    }
    return res.json();
  }

  // UI Mode: Friend view (status card only) vs Admin Mode (3 tabs)
  function applyAdminModeUI() {
    if (isAdmin) {
      adminNavBar.classList.remove('hidden');
      adminNavBar.classList.add('flex');
      btnRestart.classList.remove('hidden');
      btnKill.classList.remove('hidden');
      btnAdminLock.classList.remove('hidden');
      btnAdminLock.classList.add('inline-block');
      switchTab('tab-content-console');
    } else {
      adminNavBar.classList.add('hidden');
      adminNavBar.classList.remove('flex');
      btnRestart.classList.add('hidden');
      btnKill.classList.add('hidden');
      btnAdminLock.classList.add('hidden');
      btnAdminLock.classList.remove('inline-block');
      switchTab('tab-content-overview');
    }
  }

  function lockAdminMode() {
    sessionStorage.removeItem('panel_admin_token');
    adminToken = '';
    isAdmin = false;
    applyAdminModeUI();
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'auth', token: '' }));
    }
  }

  // Navigation Tab Switching
  function switchTab(targetId) {
    tabButtons.forEach(btn => {
      const isTarget = btn.getAttribute('data-target') === targetId;
      if (isTarget) {
        btn.classList.remove('border-transparent', 'text-zinc-400');
        btn.classList.add('border-emerald-500', 'text-emerald-400');
      } else {
        btn.classList.remove('border-emerald-500', 'text-emerald-400');
        btn.classList.add('border-transparent', 'text-zinc-400');
      }
    });

    tabPanes.forEach(pane => {
      if (pane.id === targetId) {
        pane.classList.remove('hidden');
        pane.classList.add('flex');
      } else {
        pane.classList.add('hidden');
        pane.classList.remove('flex');
      }
    });

    if (isAdmin) {
      if (targetId === 'tab-content-players') fetchPlayers();
      else if (targetId === 'tab-content-properties') { fetchProperties(); fetchPlugins(); }
      else if (targetId === 'tab-content-console') fetchPlayers();
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-target'));
    });
  });

  // Status Updates
  function updateStatusDisplay(data) {
    const status = data.status || 'Offline';
    currentServerStatus = status;

    badgeText.textContent = status;
    heroStatusText.textContent = status;

    badgeDot.className = 'w-2 h-2 rounded-full';
    heroStatusDot.className = 'w-3.5 h-3.5 rounded-full';
    badgeStatus.className = 'px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ';

    switch (status) {
      case 'Online':
        badgeDot.classList.add('bg-emerald-400');
        heroStatusDot.classList.add('bg-emerald-400', 'shadow-[0_0_12px_rgba(52,211,153,0.8)]');
        badgeStatus.classList.add('bg-emerald-950/40', 'border-emerald-600/40', 'text-emerald-300');
        btnStart.disabled = true;
        btnHeroStart.disabled = true;
        btnStop.disabled = false;
        btnHeroStop.disabled = false;
        btnRestart.disabled = false;
        btnKill.disabled = false;
        break;

      case 'Starting':
        badgeDot.classList.add('bg-amber-400', 'animate-ping');
        heroStatusDot.classList.add('bg-amber-400', 'animate-pulse');
        badgeStatus.classList.add('bg-amber-950/40', 'border-amber-600/40', 'text-amber-300');
        btnStart.disabled = true;
        btnHeroStart.disabled = true;
        btnStop.disabled = false;
        btnHeroStop.disabled = false;
        btnRestart.disabled = true;
        btnKill.disabled = false;
        break;

      case 'Stopping':
        badgeDot.classList.add('bg-orange-400', 'animate-pulse');
        heroStatusDot.classList.add('bg-orange-400', 'animate-pulse');
        badgeStatus.classList.add('bg-orange-950/40', 'border-orange-600/40', 'text-orange-300');
        btnStart.disabled = true;
        btnHeroStart.disabled = true;
        btnStop.disabled = true;
        btnHeroStop.disabled = true;
        btnRestart.disabled = true;
        btnKill.disabled = false;
        break;

      case 'Offline':
      default:
        badgeDot.classList.add('bg-zinc-500');
        heroStatusDot.classList.add('bg-zinc-600');
        badgeStatus.classList.add('bg-zinc-800', 'border-zinc-700', 'text-zinc-400');
        btnStart.disabled = false;
        btnHeroStart.disabled = false;
        btnStop.disabled = true;
        btnHeroStop.disabled = true;
        btnRestart.disabled = true;
        btnKill.disabled = true;
        statUptime.textContent = '00:00:00';
        friendUptime.textContent = '00:00:00';
        break;
    }

    if (data.serverUptime !== undefined) {
      const up = formatUptime(data.serverUptime);
      statUptime.textContent = up;
      friendUptime.textContent = up;
    }

    if (data.serverIp || data.serverPort) {
      const addr = `${data.serverIp || '127.0.0.1'}:${data.serverPort || '25565'}`;
      friendServerAddr.textContent = addr;
      headerServerAddr.textContent = addr;
    }

    if (data.motd) {
      friendMotd.textContent = data.motd;
    }

    if (data.playerCount !== undefined) {
      friendPlayerCount.textContent = data.playerCount;
      tabBadgePlayers.textContent = data.playerCount;
    }
    if (data.maxPlayers) {
      friendMaxPlayers.textContent = `/ ${data.maxPlayers}`;
    }

    if (data.ram) {
      const usedGb = (data.ram.usedMb / 1024).toFixed(1);
      const totalGb = (data.ram.totalMb / 1024).toFixed(1);
      statRam.textContent = `${usedGb} / ${totalGb} GB`;
      friendRamUsage.textContent = `${usedGb} / ${totalGb} GB`;
      friendRamPct.textContent = `(${data.ram.usagePercent || 0}%)`;
    }

    updateConsoleInputState();
    updateGitButtonsState();
  }

  async function fetchPublicStatus() {
    try {
      const data = await apiRequest('/api/public/status');
      if (data) {
        updateStatusDisplay(data);
      }
    } catch (_) {}
  }

  // ==============================================================================
  // GIT SYNC STATUS PILL & MANUAL BUTTONS (Friend Screen)
  // ==============================================================================
  const gitStatusPill = document.getElementById('git-status-pill');
  const gitStatusText = document.getElementById('git-status-text');
  const btnGitPull = document.getElementById('btn-git-pull');
  const btnGitPush = document.getElementById('btn-git-push');

  function updateGitStatus(state, message) {
    if (!gitStatusPill) return;
    const s = (state || 'idle').toLowerCase();
    gitStatusText.textContent = message || '';
    gitStatusPill.className = 'px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ';
    switch (s) {
      case 'ready':
        gitStatusPill.classList.add('bg-zinc-800', 'border-zinc-700', 'text-zinc-400');
        gitStatusPill.textContent = 'Git: Ready (Manual Sync)';
        break;
      case 'pulling':
        gitStatusPill.classList.add('bg-sky-950/60', 'border-sky-700/50', 'text-sky-300');
        gitStatusPill.textContent = 'Git: Pulling…';
        break;
      case 'synced':
        gitStatusPill.classList.add('bg-emerald-950/60', 'border-emerald-700/50', 'text-emerald-300');
        gitStatusPill.textContent = 'Git: Synced';
        break;
      case 'pushed':
        gitStatusPill.classList.add('bg-emerald-950/60', 'border-emerald-700/50', 'text-emerald-300');
        gitStatusPill.textContent = 'Git: Pushed';
        break;
      case 'pushing':
        gitStatusPill.classList.add('bg-sky-950/60', 'border-sky-700/50', 'text-sky-300');
        gitStatusPill.textContent = 'Git: Pushing…';
        break;
      case 'dirty':
        gitStatusPill.classList.add('bg-amber-950/60', 'border-amber-700/50', 'text-amber-300');
        gitStatusPill.textContent = 'Git: Local changes';
        break;
      case 'skipped':
        gitStatusPill.classList.add('bg-zinc-800', 'border-zinc-700', 'text-zinc-400');
        gitStatusPill.textContent = 'Git: Skipped';
        break;
      case 'offline':
        gitStatusPill.classList.add('bg-zinc-800', 'border-zinc-600', 'text-zinc-500');
        gitStatusPill.textContent = 'Git: Offline';
        break;
      case 'error':
        gitStatusPill.classList.add('bg-red-950/60', 'border-red-700/50', 'text-red-300');
        gitStatusPill.textContent = 'Git: Error';
        break;
      default:
        gitStatusPill.classList.add('bg-zinc-800', 'border-zinc-700', 'text-zinc-400');
        gitStatusPill.textContent = 'Git: Idle';
    }
  }

  function updateGitButtonsState() {
    const serverBusy = currentServerStatus !== 'Offline';
    btnGitPull.disabled = serverBusy;
    btnGitPush.disabled = serverBusy;
  }

  async function gitAction(endpoint) {
    try {
      const data = await apiRequest(endpoint, 'POST');
      if (data && data.state && data.message) updateGitStatus(data.state, data.message);
    } catch (err) {
      updateGitStatus('error', err.message);
    }
  }

  btnGitPull.addEventListener('click', () => gitAction('/api/git/pull'));
  btnGitPush.addEventListener('click', () => gitAction('/api/git/push'));

  // Copy Server Address Button
  btnCopyIp.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(friendServerAddr.textContent);
      const original = btnCopyIp.textContent;
      btnCopyIp.textContent = 'Copied!';
      btnCopyIp.classList.add('bg-emerald-700', 'text-white');
      setTimeout(() => {
        btnCopyIp.textContent = original;
        btnCopyIp.classList.remove('bg-emerald-700', 'text-white');
      }, 1500);
    } catch (_) {
      alert('Address: ' + friendServerAddr.textContent);
    }
  });

  // Header IP Copy Button
  btnCopyHeaderIp.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(headerServerAddr.textContent);
      const original = btnCopyHeaderIp.textContent;
      btnCopyHeaderIp.textContent = 'Copied!';
      setTimeout(() => { btnCopyHeaderIp.textContent = original; }, 1500);
    } catch (_) {
      alert('Address: ' + headerServerAddr.textContent);
    }
  });

  // Command Audit Log Modal
  async function fetchCommandLogs() {
    if (!isAdmin) return;
    try {
      const data = await apiRequest('/api/command-logs');
      const entries = (data && data.entries) || [];
      commandLogContent.textContent = entries.length
        ? entries.join('\n')
        : 'No commands recorded yet.';
    } catch (err) {
      commandLogContent.textContent = 'Failed to load command log: ' + err.message;
    }
  }

  function openCommandLogs() {
    commandLogsModal.classList.remove('hidden');
    commandLogsModal.classList.add('flex');
    fetchCommandLogs();
  }
  function closeCommandLogs() {
    commandLogsModal.classList.add('hidden');
    commandLogsModal.classList.remove('flex');
  }

  btnCommandLogs.addEventListener('click', openCommandLogs);
  btnCommandLogsRefresh.addEventListener('click', fetchCommandLogs);
  btnCommandLogsClose.addEventListener('click', closeCommandLogs);
  commandLogsModal.addEventListener('click', (e) => {
    if (e.target === commandLogsModal) closeCommandLogs();
  });

  // Public Start/Stop Controls
  async function performPublicAction(endpoint) {
    try {
      await apiRequest(endpoint, 'POST');
      setTimeout(fetchPublicStatus, 400);
    } catch (err) {
      alert('Action error: ' + err.message);
    }
  }

  // Public Start/Stop endpoints (friend-accessible)
  btnStart.addEventListener('click', () => performPublicAction('/api/public/start'));
  btnHeroStart.addEventListener('click', () => performPublicAction('/api/public/start'));
  btnStop.addEventListener('click', () => performPublicAction('/api/public/stop'));
  btnHeroStop.addEventListener('click', () => performPublicAction('/api/public/stop'));

  // Admin-Only Restart/Kill Controls
  btnRestart.addEventListener('click', async () => {
    try {
      await apiRequest('/api/server/restart', 'POST');
    } catch (err) {
      alert('Restart failed: ' + err.message);
    }
  });

  btnKill.addEventListener('click', async () => {
    if (confirm('Force terminate Minecraft server immediately?')) {
      try {
        await apiRequest('/api/server/kill', 'POST');
      } catch (err) {
        alert('Kill failed: ' + err.message);
      }
    }
  });

  // ==============================================================================
  // STEALTH ADMIN UNLOCK — Ctrl+Shift+Alt+A or 5 rapid clicks on header title
  // ==============================================================================
  function openPasscodeModal() {
    passcodeError.classList.add('hidden');
    passcodeInput.value = '';
    passcodeModal.classList.remove('hidden');
    passcodeModal.classList.add('flex');
    passcodeInput.focus();
  }

  function closePasscodeModal() {
    passcodeModal.classList.add('hidden');
    passcodeModal.classList.remove('flex');
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.altKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      openPasscodeModal();
    } else if (e.key === 'Escape' && !passcodeModal.classList.contains('hidden')) {
      closePasscodeModal();
    }
  });

  // 5 clicks on the header title within 2 seconds opens the passcode modal
  let brandClicks = [];
  headerBrand.addEventListener('click', () => {
    const now = Date.now();
    brandClicks = brandClicks.filter(t => now - t < 2000);
    brandClicks.push(now);
    if (brandClicks.length >= 5) {
      brandClicks = [];
      openPasscodeModal();
    }
  });

  btnPasscodeClose.addEventListener('click', closePasscodeModal);
  btnPasscodeCancel.addEventListener('click', closePasscodeModal);

  passcodeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passcodeInput.value })
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        adminToken = data.token;
        sessionStorage.setItem('panel_admin_token', adminToken);
        isAdmin = true;
        closePasscodeModal();
        applyAdminModeUI();
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'auth', token: adminToken }));
        }
      } else {
        passcodeError.textContent = data.error || 'Incorrect passcode';
        passcodeError.classList.remove('hidden');
      }
    } catch (err) {
      passcodeError.textContent = 'Connection error: ' + err.message;
      passcodeError.classList.remove('hidden');
    }
  });

  btnAdminLock.addEventListener('click', lockAdminMode);

  // ==============================================================================
  // TAB: SERVER & CONSOLE (Admin Only)
  // ==============================================================================
  function appendLogEntry(entry) {
    if (!entry || !entry.text) return;
    const cleanText = stripAnsi(entry.text).trimEnd();
    if (!cleanText) return;

    const row = document.createElement('div');
    row.className = 'font-mono text-xs sm:text-[13px] leading-relaxed break-all px-1 rounded hover:bg-zinc-900/40 transition-colors flex items-start gap-2';

    let typeClass = 'text-zinc-300';
    let tag = '';
    let tagClass = '';
    const upper = cleanText.toUpperCase();

    if (entry.stream === 'system') {
      typeClass = 'text-purple-300 font-semibold';
      tag = 'SYS';
      tagClass = 'bg-purple-900/50 text-purple-300 border-purple-700/50';
    } else if (entry.stream === 'input') {
      typeClass = 'text-emerald-300 font-semibold';
      tag = 'CMD';
      tagClass = 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50';
    } else if (upper.includes('/ERROR') || upper.includes('[ERROR]') || upper.includes('EXCEPTION') || entry.stream === 'stderr') {
      typeClass = 'text-red-300';
      tag = 'ERROR';
      tagClass = 'bg-red-950/70 text-red-400 border-red-800/60';
    } else if (upper.includes('/WARN') || upper.includes('[WARN]')) {
      typeClass = 'text-amber-300';
      tag = 'WARN';
      tagClass = 'bg-amber-950/70 text-amber-400 border-amber-800/60';
    } else if (upper.includes('/INFO') || upper.includes('[INFO]')) {
      typeClass = 'text-zinc-200';
      tag = 'INFO';
      tagClass = 'bg-sky-950/60 text-sky-400 border-sky-800/50';
    }

    const timestampSpan = entry.timestamp
      ? `<span class="text-zinc-600 select-none text-[11px] shrink-0 font-mono">${escapeHtml(entry.timestamp)}</span>`
      : '';

    const tagBadge = tag
      ? `<span class="px-1.5 py-0.2 rounded border text-[10px] font-bold uppercase shrink-0 ${tagClass}">${tag}</span>`
      : '';

    row.innerHTML = `
      ${timestampSpan}
      ${tagBadge}
      <span class="${typeClass} flex-1 whitespace-pre-wrap">${escapeHtml(cleanText)}</span>
    `;

    consoleOutput.appendChild(row);
    totalLines++;
    logCount.textContent = `(${totalLines} lines)`;

    if (consoleOutput.children.length > 800) {
      consoleOutput.removeChild(consoleOutput.firstElementChild);
    }

    if (toggleAutoscroll.checked) {
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
  }

  // Console command input is disabled while the server is Offline
  function updateConsoleInputState() {
    const offline = currentServerStatus === 'Offline';
    consoleInput.disabled = offline;
    btnSendCommand.disabled = offline;
    consoleOfflineHint.classList.toggle('hidden', !offline);
  }

  btnClearConsole.addEventListener('click', () => {
    consoleOutput.innerHTML = '';
    totalLines = 0;
    logCount.textContent = '(0 lines)';
  });

  consoleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const cmd = consoleInput.value.trim();
    if (!cmd) return;

    commandHistory.push(cmd);
    historyIndex = commandHistory.length;
    currentDraft = '';

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'command', command: cmd }));
    } else {
      apiRequest('/api/server/command', 'POST', { command: cmd });
    }
    consoleInput.value = '';
  });

  consoleInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      if (historyIndex === commandHistory.length) currentDraft = consoleInput.value;
      if (historyIndex > 0) {
        historyIndex--;
        consoleInput.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        consoleInput.value = commandHistory[historyIndex];
      } else if (historyIndex === commandHistory.length - 1) {
        historyIndex = commandHistory.length;
        consoleInput.value = currentDraft;
      }
    }
  });

  // ==============================================================================
  // TAB: ONLINE PLAYERS & LIVE INVENTORY (Admin Only)
  // ==============================================================================
  function renderPlayers(players) {
    const list = players || [];
    tabBadgePlayers.textContent = list.length;
    friendPlayerCount.textContent = list.length;

    if (currentServerStatus !== 'Online') {
      playersContainer.innerHTML = `
        <div class="col-span-full py-12 text-center bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-8">
          <div class="text-4xl mb-3">💤</div>
          <h3 class="text-sm font-semibold text-zinc-300">Server is currently ${escapeHtml(currentServerStatus)}</h3>
          <p class="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">Connected players will appear here once the server is online.</p>
        </div>
      `;
      return;
    }

    if (list.length === 0) {
      playersContainer.innerHTML = `
        <div class="col-span-full py-12 text-center bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-8">
          <div class="text-4xl mb-3">🎮</div>
          <h3 class="text-sm font-semibold text-zinc-300">No Players Currently Online</h3>
          <p class="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">Connected players and live inventory inspection will appear here.</p>
        </div>
      `;
      return;
    }

    playersContainer.innerHTML = list.map(player => {
      const safeName = escapeHtml(player.name);
      const isOp = Boolean(player.isOp);
      const avatarUrl = player.avatar || `https://minotar.net/helm/${encodeURIComponent(player.name)}/64.png`;

      return `
        <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-lg">
          <div class="flex items-center space-x-3">
            <img src="${avatarUrl}" alt="${safeName}" class="w-12 h-12 rounded-lg bg-zinc-950 border border-zinc-700/60" onerror="this.src='https://minotar.net/helm/Steve/64.png'">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2">
                <span class="font-bold text-sm text-white truncate">${safeName}</span>
                ${isOp ? '<span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">OP</span>' : ''}
              </div>
              <span class="text-[11px] text-emerald-400 font-mono">● Online</span>
            </div>
          </div>

          <div class="space-y-2 pt-1 border-t border-zinc-800/80">
            <button onclick="window.openPlayerInventory('${safeName}')" class="w-full py-2 px-3 bg-emerald-600/90 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded font-medium text-xs transition-colors shadow flex items-center justify-center space-x-1.5">
              <span>🎒</span>
              <span>Inspect Inventory</span>
            </button>

            <div class="grid grid-cols-3 gap-1.5 text-xs">
              <button onclick="window.executePlayerAction('${safeName}', 'kill')" class="px-2 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/50 rounded font-medium">☠ Kill</button>
              <button onclick="window.executePlayerAction('${safeName}', 'kick')" class="px-2 py-1.5 bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800/50 rounded font-medium">👢 Kick</button>
              <button onclick="window.executePlayerAction('${safeName}', 'ban')" class="px-2 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded font-medium">⛔ Ban</button>
            </div>

            <div class="grid grid-cols-2 gap-1.5 text-xs">
              <button onclick="window.executePlayerAction('${safeName}', '${isOp ? 'deop' : 'op'}')" class="px-2 py-1.5 ${isOp ? 'bg-zinc-800 text-zinc-300' : 'bg-yellow-950/60 text-yellow-300 border border-yellow-800/50'} rounded font-medium">★ ${isOp ? 'Deop' : 'Make OP'}</button>
              <button onclick="window.executePlayerAction('${safeName}', 'clear')" class="px-2 py-1.5 bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/50 rounded font-medium">🧹 Clear Inv</button>
            </div>

            <div class="flex items-center space-x-1 pt-1 text-[11px]">
              <span class="text-zinc-500 font-medium px-1">Mode:</span>
              <button onclick="window.executePlayerAction('${safeName}', 'gamemode', 'survival')" class="flex-1 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded">Surv</button>
              <button onclick="window.executePlayerAction('${safeName}', 'gamemode', 'creative')" class="flex-1 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded">Crea</button>
              <button onclick="window.executePlayerAction('${safeName}', 'gamemode', 'spectator')" class="flex-1 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded">Spec</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  async function fetchPlayers() {
    if (!isAdmin) return;
    try {
      const data = await apiRequest('/api/players');
      if (data && Array.isArray(data.players)) {
        renderPlayers(data.players);
      }
    } catch (_) {}
  }

  window.executePlayerAction = async (player, action, value = null) => {
    let extraValue = value;
    if (action === 'kick') {
      const reason = prompt(`Kick "${player}"? Optional reason:`, 'Kicked by admin');
      if (reason === null) return;
      extraValue = reason;
    } else if (action === 'ban') {
      const reason = prompt(`Ban "${player}"? Optional reason:`, 'Banned by admin');
      if (reason === null) return;
      extraValue = reason;
    } else if (action === 'kill' && !confirm(`Kill ${player}?`)) {
      return;
    } else if (action === 'clear' && !confirm(`Clear inventory of ${player}?`)) {
      return;
    }

    try {
      await apiRequest('/api/players/action', 'POST', { player, action, value: extraValue });
      setTimeout(fetchPlayers, 600);
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  btnRefreshPlayers.addEventListener('click', async () => {
    try {
      await apiRequest('/api/players/refresh', 'POST');
      setTimeout(fetchPlayers, 600);
    } catch (_) {
      fetchPlayers();
    }
  });

  // ==============================================================================
  // INVENTORY MODAL & BRIDGE API (Admin Only)
  // ==============================================================================
  function getItemIconUrl(material) {
    if (!material) return '';
    const clean = material.replace('minecraft:', '').toLowerCase();
    return `https://assets.mcasset.cloud/1.21.1/assets/minecraft/textures/item/${clean}.png`;
  }

  function getItemBlockIconUrl(material) {
    if (!material) return '';
    const clean = material.replace('minecraft:', '').toLowerCase();
    return `https://assets.mcasset.cloud/1.21.1/assets/minecraft/textures/block/${clean}.png`;
  }

  function setupSlotElement(slotEl, type, slotIndex, item, placeholderIcon = '') {
    slotEl.dataset.type = type;
    slotEl.dataset.slot = slotIndex;
    slotEl.innerHTML = '';

    const hasItem = item && item.material && !item.material.endsWith(':air') && item.amount > 0;

    if (hasItem) {
      slotEl.draggable = true;
      const cleanMat = item.material.replace('minecraft:', '').toLowerCase();
      const displayName = item.displayName || cleanMat.toUpperCase().replace(/_/g, ' ');
      slotEl.title = `${displayName}\nID: ${item.material}\nAmount: ${item.amount}\nSlot: #${slotIndex} (${type === 'ender' ? 'Ender' : 'Inv'})`;

      const img = document.createElement('img');
      img.src = getItemIconUrl(cleanMat);
      img.alt = cleanMat;
      img.className = 'w-7 h-7 sm:w-8 sm:h-8 object-contain pointer-events-none drop-shadow';
      img.onerror = function() {
        this.onerror = function() {
          this.style.display = 'none';
          if (this.nextElementSibling) {
            this.nextElementSibling.classList.remove('hidden');
            this.nextElementSibling.classList.add('flex');
          }
        };
        this.src = getItemBlockIconUrl(cleanMat);
      };

      const fallback = document.createElement('div');
      fallback.className = 'hidden w-full h-full text-[9px] font-mono font-bold text-zinc-300 items-center justify-center text-center p-0.5 break-all pointer-events-none uppercase';
      fallback.textContent = cleanMat.length > 5 ? cleanMat.slice(0, 4) : cleanMat;

      slotEl.appendChild(img);
      slotEl.appendChild(fallback);

      if (item.amount > 1) {
        const badge = document.createElement('span');
        badge.className = 'absolute bottom-0 right-1 text-[11px] font-mono font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] pointer-events-none';
        badge.textContent = item.amount;
        slotEl.appendChild(badge);
      }
    } else {
      slotEl.draggable = false;
      const typeLabel = type === 'ender' ? 'Ender' : 'Inv';
      slotEl.title = `Empty Slot #${slotIndex} (${typeLabel})`;
      if (placeholderIcon) {
        const ph = document.createElement('span');
        ph.className = 'slot-placeholder text-lg opacity-30 pointer-events-none';
        ph.textContent = placeholderIcon;
        slotEl.appendChild(ph);
      }
    }

    slotEl.ondragstart = (e) => {
      if (!hasItem) return e.preventDefault();
      draggedSlot = { type, slot: slotIndex };
      e.dataTransfer.setData('text/plain', JSON.stringify(draggedSlot));
      slotEl.classList.add('dragging');
    };

    slotEl.ondragend = () => slotEl.classList.remove('dragging');
    slotEl.ondragover = (e) => { e.preventDefault(); slotEl.classList.add('drag-over'); };
    slotEl.ondragleave = () => slotEl.classList.remove('drag-over');

    slotEl.ondrop = async (e) => {
      e.preventDefault();
      slotEl.classList.remove('drag-over');
      if (!draggedSlot) return;

      const fromType = draggedSlot.type;
      const fromSlot = draggedSlot.slot;
      const toType = type;
      const toSlot = slotIndex;

      if (fromType === toType && fromSlot === toSlot) return;

      try {
        await apiRequest(`/api/bridge/player/${encodeURIComponent(currentInspectPlayer)}/move`, 'POST', {
          fromType,
          fromSlot,
          toType,
          toSlot
        });
        loadPlayerInventory(currentInspectPlayer);
      } catch (err) {
        alert('Failed to move item: ' + err.message);
      }
    };

    slotEl.onclick = () => openSlotEditor(type, slotIndex, item);
  }

  window.openPlayerInventory = (playerName) => {
    currentInspectPlayer = playerName;
    inventoryModal.classList.remove('hidden');
    inventoryModal.classList.add('flex');
    loadPlayerInventory(playerName);
  };

  function closePlayerInventory() {
    inventoryModal.classList.add('hidden');
    inventoryModal.classList.remove('flex');
    currentInspectPlayer = null;
  }

  btnInvClose.addEventListener('click', closePlayerInventory);
  btnInvCloseBottom.addEventListener('click', closePlayerInventory);
  btnInvRefresh.addEventListener('click', () => { if (currentInspectPlayer) loadPlayerInventory(currentInspectPlayer); });
  btnInvRetry.addEventListener('click', () => { if (currentInspectPlayer) loadPlayerInventory(currentInspectPlayer); });

  async function loadPlayerInventory(playerName) {
    if (!playerName) return;
    invPlayerName.textContent = playerName;
    invPlayerAvatar.src = `https://minotar.net/helm/${encodeURIComponent(playerName)}/64.png`;
    invErrorBanner.classList.add('hidden');

    try {
      const data = await apiRequest(`/api/bridge/player/${encodeURIComponent(playerName)}`);

      if (!data || data.error || !Array.isArray(data.inventory) || !Array.isArray(data.enderchest)) {
        const detail = (data && data.error) || 'Empty or malformed response from ServerPanelBridge.';
        throw new Error(detail);
      }

      invPlayerGamemode.textContent = data.gamemode || 'SURVIVAL';
      invPlayerHp.textContent = `❤️ ${parseFloat(data.health || 20).toFixed(1)} / ${parseFloat(data.maxHealth || 20).toFixed(1)} HP`;
      invPlayerFood.textContent = `🍖 ${data.foodLevel ?? 20} Food`;
      if (data.location) {
        invPlayerCoords.textContent = `📍 ${data.location.x}, ${data.location.y}, ${data.location.z} (${data.location.world})`;
      }

      const invMap = new Map();
      if (Array.isArray(data.inventory)) {
        data.inventory.forEach(i => invMap.set(i.slot, i));
      }

      const enderMap = new Map();
      if (Array.isArray(data.enderchest)) {
        data.enderchest.forEach(i => enderMap.set(i.slot, i));
      }

      setupSlotElement(slotArmor39, 'inv', 39, invMap.get(39), '🪖');
      setupSlotElement(slotArmor38, 'inv', 38, invMap.get(38), '🦺');
      setupSlotElement(slotArmor37, 'inv', 37, invMap.get(37), '👖');
      setupSlotElement(slotArmor36, 'inv', 36, invMap.get(36), '👢');
      setupSlotElement(slotOffhand40, 'inv', 40, invMap.get(40), '🛡');

      gridMainInv.innerHTML = '';
      for (let s = 9; s <= 35; s++) {
        const slotEl = document.createElement('div');
        slotEl.className = 'inv-slot';
        setupSlotElement(slotEl, 'inv', s, invMap.get(s));
        gridMainInv.appendChild(slotEl);
      }

      gridHotbarInv.innerHTML = '';
      for (let s = 0; s <= 8; s++) {
        const slotEl = document.createElement('div');
        slotEl.className = 'inv-slot';
        setupSlotElement(slotEl, 'inv', s, invMap.get(s));
        gridHotbarInv.appendChild(slotEl);
      }

      gridEnderchest.innerHTML = '';
      for (let s = 0; s <= 26; s++) {
        const slotEl = document.createElement('div');
        slotEl.className = 'inv-slot';
        setupSlotElement(slotEl, 'ender', s, enderMap.get(s));
        gridEnderchest.appendChild(slotEl);
      }
    } catch (err) {
      invErrorBanner.classList.remove('hidden');
      const detail = err && err.message ? err.message : '';
      invErrorText.textContent = detail
        ? `${detail} — if the bridge is offline, restart the Minecraft server to load ServerPanelBridge.jar.`
        : 'Paper bridge offline on 127.0.0.1:8081 — restart the Minecraft server to load ServerPanelBridge.jar.';
    }
  }

  function openSlotEditor(type, slotIndex, item) {
    currentEditingSlot = { type, slot: slotIndex, item };
    const typeLabel = type === 'ender' ? 'Ender Chest' : 'Inventory';
    slotEditTitle.textContent = `Edit ${typeLabel} Slot #${slotIndex}`;

    const hasItem = item && item.material && !item.material.endsWith(':air') && item.amount > 0;
    if (hasItem) {
      slotEditCurrent.textContent = `Current: ${item.material} (x${item.amount})`;
      slotEditMaterial.value = item.material.replace('minecraft:', '').toUpperCase();
      slotEditAmount.value = item.amount || 1;
      slotUpdateCountInput.value = item.amount || 1;
      slotEditAmountSection.classList.remove('hidden');
      btnSlotClear.disabled = false;
    } else {
      slotEditCurrent.textContent = `Current: Empty Slot`;
      slotEditMaterial.value = '';
      slotEditAmount.value = 1;
      slotUpdateCountInput.value = 1;
      slotEditAmountSection.classList.add('hidden');
      btnSlotClear.disabled = true;
    }

    slotEditModal.classList.remove('hidden');
    slotEditModal.classList.add('flex');
    slotEditMaterial.focus();
  }

  function closeSlotEditor() {
    slotEditModal.classList.add('hidden');
    slotEditModal.classList.remove('flex');
    currentEditingSlot = null;
  }

  btnSlotEditClose.addEventListener('click', closeSlotEditor);
  quickMatButtons.forEach(btn => {
    btn.addEventListener('click', () => { slotEditMaterial.value = btn.dataset.mat; });
  });

  btnSlotSetItem.addEventListener('click', async () => {
    if (!currentEditingSlot || !currentInspectPlayer) return;
    const mat = slotEditMaterial.value.trim();
    if (!mat) return alert('Enter a Material ID (e.g. DIAMOND_SWORD)');
    const amount = parseInt(slotEditAmount.value, 10) || 1;

    try {
      await apiRequest(`/api/bridge/player/${encodeURIComponent(currentInspectPlayer)}/item`, 'POST', {
        type: currentEditingSlot.type,
        slot: currentEditingSlot.slot,
        material: mat,
        amount
      });
      closeSlotEditor();
      loadPlayerInventory(currentInspectPlayer);
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  });

  btnSlotUpdateCount.addEventListener('click', async () => {
    if (!currentEditingSlot || !currentInspectPlayer) return;
    const amount = parseInt(slotUpdateCountInput.value, 10) || 1;
    try {
      await apiRequest(`/api/bridge/player/${encodeURIComponent(currentInspectPlayer)}/item`, 'POST', {
        type: currentEditingSlot.type,
        slot: currentEditingSlot.slot,
        amount
      });
      closeSlotEditor();
      loadPlayerInventory(currentInspectPlayer);
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  });

  btnSlotClear.addEventListener('click', async () => {
    if (!currentEditingSlot || !currentInspectPlayer) return;
    try {
      await apiRequest(`/api/bridge/player/${encodeURIComponent(currentInspectPlayer)}/item`, 'POST', {
        type: currentEditingSlot.type,
        slot: currentEditingSlot.slot,
        clear: true
      });
      closeSlotEditor();
      loadPlayerInventory(currentInspectPlayer);
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  });

  btnInvGiveItem.addEventListener('click', () => {
    quickGiveModal.classList.remove('hidden');
    quickGiveModal.classList.add('flex');
    giveMaterialInput.value = '';
    giveAmountInput.value = 1;
    giveMaterialInput.focus();
  });

  btnQuickGiveClose.addEventListener('click', () => {
    quickGiveModal.classList.add('hidden');
    quickGiveModal.classList.remove('flex');
  });

  btnSubmitQuickGive.addEventListener('click', async () => {
    const mat = giveMaterialInput.value.trim();
    if (!mat) return alert('Please enter a Material ID');
    const amount = parseInt(giveAmountInput.value, 10) || 1;

    try {
      await apiRequest(`/api/bridge/player/${encodeURIComponent(currentInspectPlayer)}/item`, 'POST', {
        action: 'give',
        material: mat,
        amount
      });
      quickGiveModal.classList.add('hidden');
      quickGiveModal.classList.remove('flex');
      loadPlayerInventory(currentInspectPlayer);
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  });

  // ==============================================================================
  // TAB: SERVER.PROPERTIES (Admin Only)
  // ==============================================================================
  function showPropertiesNotice(msg, isSuccess = true) {
    propsNotification.textContent = msg;
    propsNotification.className = isSuccess
      ? 'p-3 rounded-lg text-xs bg-emerald-950/60 border border-emerald-600/40 text-emerald-200'
      : 'p-3 rounded-lg text-xs bg-red-950/60 border border-red-600/40 text-red-200';
    propsNotification.classList.remove('hidden');
    setTimeout(() => propsNotification.classList.add('hidden'), 4500);
  }

  function updateCrackedBadge() {
    if (propOnlineMode.checked) {
      badgeCracked.textContent = 'Mojang Auth (Online)';
      badgeCracked.className = 'px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-700/50';
    } else {
      badgeCracked.textContent = 'Cracked Allowed (Offline)';
      badgeCracked.className = 'px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-700/50';
    }
  }

  propOnlineMode.addEventListener('change', updateCrackedBadge);

  async function fetchProperties() {
    if (!isAdmin) return;
    try {
      const data = await apiRequest('/api/properties');
      if (data && data.properties) {
        const p = data.properties;
        propMotd.value = p['motd'] || 'A Minecraft Server';
        propMaxPlayers.value = p['max-players'] || '20';
        propWhiteList.checked = p['white-list'] === 'true';
        propOnlineMode.checked = p['online-mode'] !== 'false';
        propGamemode.value = p['gamemode'] || 'survival';
        propDifficulty.value = p['difficulty'] || 'easy';
        propPvp.checked = p['pvp'] !== 'false';
        propAllowFlight.checked = p['allow-flight'] === 'true';
        propViewDistance.value = p['view-distance'] || '10';
        propSimulationDistance.value = p['simulation-distance'] || '10';
        updateCrackedBadge();
      }
    } catch (err) {
      showPropertiesNotice('Failed to load server.properties: ' + err.message, false);
    }
  }

  async function saveProperties(restart = false) {
    const updates = {
      'motd': propMotd.value,
      'max-players': propMaxPlayers.value,
      'white-list': propWhiteList.checked ? 'true' : 'false',
      'online-mode': propOnlineMode.checked ? 'true' : 'false',
      'gamemode': propGamemode.value,
      'difficulty': propDifficulty.value,
      'pvp': propPvp.checked ? 'true' : 'false',
      'allow-flight': propAllowFlight.checked ? 'true' : 'false',
      'view-distance': propViewDistance.value,
      'simulation-distance': propSimulationDistance.value,
    };

    try {
      const res = await apiRequest('/api/properties', 'POST', { updates, restart });
      showPropertiesNotice(res.message || 'Saved successfully.', true);
    } catch (err) {
      showPropertiesNotice('Failed to save: ' + err.message, false);
    }
  }

  btnReloadProps.addEventListener('click', () => { fetchProperties(); showPropertiesNotice('Reloaded from disk.', true); });
  btnSaveProps.addEventListener('click', () => saveProperties(false));
  btnSaveRestartProps.addEventListener('click', () => saveProperties(true));
  btnSavePropsBottom.addEventListener('click', () => saveProperties(false));
  btnSaveRestartPropsBottom.addEventListener('click', () => saveProperties(true));

  // ==============================================================================
  // TAB: PLUGIN MANAGER (Admin Only)
  // ==============================================================================
  function showPluginNotice(msg, isSuccess = true) {
    pluginUploadStatus.textContent = msg;
    pluginUploadStatus.className = isSuccess
      ? 'p-2.5 rounded-lg text-xs bg-emerald-950/60 border border-emerald-600/40 text-emerald-200'
      : 'p-2.5 rounded-lg text-xs bg-red-950/60 border border-red-600/40 text-red-200';
    pluginUploadStatus.classList.remove('hidden');
    setTimeout(() => pluginUploadStatus.classList.add('hidden'), 4500);
  }

  async function fetchPlugins() {
    if (!isAdmin) return;
    try {
      const data = await apiRequest('/api/plugins');
      const plugins = (data && data.plugins) || [];
      pluginsTableCount.textContent = `(${plugins.length})`;

      if (plugins.length === 0) {
        pluginsTableBody.innerHTML = '';
        pluginsEmpty.classList.remove('hidden');
        return;
      }

      pluginsEmpty.classList.add('hidden');
      pluginsTableBody.innerHTML = plugins.map(p => {
        const safeName = escapeHtml(p.name);
        const isEnabled = Boolean(p.enabled);

        return `
          <tr class="hover:bg-zinc-900/40 transition-colors">
            <td class="px-4 py-3 flex items-center space-x-2">
              <span class="text-base">📦</span>
              <span class="${isEnabled ? 'text-zinc-200 font-medium' : 'text-zinc-500 line-through'} truncate max-w-xs md:max-w-md">
                ${safeName}
              </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
              ${isEnabled
                ? '<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">Enabled</span>'
                : '<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">Disabled</span>'
              }
            </td>
            <td class="px-4 py-3 text-zinc-400 whitespace-nowrap font-mono text-[11px]">
              ${escapeHtml(p.formattedSize || '0 B')}
            </td>
            <td class="px-4 py-3 text-right whitespace-nowrap space-x-2">
              <button
                onclick="window.togglePlugin('${safeName}')"
                class="px-2.5 py-1 text-xs rounded transition-colors ${isEnabled ? 'bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800/50' : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50'}"
              >
                ${isEnabled ? 'Disable' : 'Enable'}
              </button>
              <button
                onclick="window.deletePlugin('${safeName}')"
                class="px-2.5 py-1 text-xs bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/50 rounded transition-colors"
              >
                Delete
              </button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      showPluginNotice('Failed to list plugins: ' + err.message, false);
    }
  }

  window.togglePlugin = async (filename) => {
    try {
      const res = await apiRequest('/api/plugins/toggle', 'POST', { filename });
      showPluginNotice(`Plugin "${filename}" is now ${res.enabled ? 'Enabled' : 'Disabled'}. Restart to apply.`, true);
      fetchPlugins();
    } catch (err) {
      showPluginNotice('Failed to toggle plugin: ' + err.message, false);
    }
  };

  window.deletePlugin = async (filename) => {
    if (!confirm(`Delete plugin "${filename}"?`)) return;
    try {
      await apiRequest(`/api/plugins/${encodeURIComponent(filename)}`, 'DELETE');
      showPluginNotice(`Plugin "${filename}" deleted.`, true);
      fetchPlugins();
    } catch (err) {
      showPluginNotice('Failed to delete: ' + err.message, false);
    }
  };

  async function uploadPluginFile(file) {
    const lower = (file.name || '').toLowerCase();
    if (!lower.endsWith('.jar')) {
      showPluginNotice('Only .jar plugin files can be uploaded.', false);
      return;
    }
    const formData = new FormData();
    formData.append('plugin', file);

    try {
      showPluginNotice(`Uploading "${file.name}"...`, true);
      const res = await apiRequest('/api/plugins/upload', 'POST', formData);
      showPluginNotice(`Uploaded "${res.filename}". Restart server to load.`, true);
      pluginFileInput.value = '';
      fetchPlugins();
    } catch (err) {
      showPluginNotice('Upload failed: ' + err.message, false);
    }
  }

  formUploadPlugin.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!pluginFileInput.files || pluginFileInput.files.length === 0) return;
    await uploadPluginFile(pluginFileInput.files[0]);
  });

  // Drag & drop .jar upload onto the dropzone or the whole upload card
  [pluginDropzone, pluginUploadCard].forEach(zone => {
    if (!zone) return;
    ['dragenter', 'dragover'].forEach(evt => {
      zone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.add('border-emerald-500', 'bg-emerald-950/30');
      });
    });
    ['dragleave', 'drop'].forEach(evt => {
      zone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove('border-emerald-500', 'bg-emerald-950/30');
      });
    });
    zone.addEventListener('drop', (e) => {
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) uploadPluginFile(file);
    });
  });

  btnRefreshPlugins.addEventListener('click', fetchPlugins);

  // ==============================================================================
  // WEBSOCKET COMMUNICATION (Public Status vs. Admin Stream)
  // ==============================================================================
  function connectWebSocket() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}${adminToken ? '?token=' + encodeURIComponent(adminToken) : ''}`;

    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      if (adminToken) {
        socket.send(JSON.stringify({ type: 'auth', token: adminToken }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'public_status') {
          updateStatusDisplay(msg);
        } else if (msg.type === 'init_admin') {
          updateStatusDisplay(msg);
          if (Array.isArray(msg.logs)) {
            consoleOutput.innerHTML = '';
            totalLines = 0;
            msg.logs.forEach(appendLogEntry);
          }
          if (Array.isArray(msg.players)) {
            renderPlayers(msg.players);
          }
        } else if (msg.type === 'status') {
          updateStatusDisplay(msg);
        } else if (msg.type === 'log') {
          appendLogEntry(msg.entry);
        } else if (msg.type === 'players') {
          renderPlayers(msg.players);
        } else if (msg.type === 'git_status') {
          updateGitStatus(msg.state, msg.message);
        }
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    socket.onclose = () => {
      clearTimeout(wsReconnectTimer);
      wsReconnectTimer = setTimeout(connectWebSocket, 3000);
    };

    socket.onerror = () => {
      socket.close();
    };
  }

  // Initialization — Friend view by default; Admin Mode unlocks via passcode
  applyAdminModeUI();
  fetchPublicStatus();
  connectWebSocket();

  clearInterval(statusPollTimer);
  statusPollTimer = setInterval(fetchPublicStatus, 3000);
})();
