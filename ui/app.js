const DEFAULT_API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : window.location.origin;
let API_BASE = localStorage.getItem('smartBellApiBase') || DEFAULT_API_BASE;
let audioFiles = [];
let schedules = [];

const $ = (id) => document.getElementById(id);
const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

const dayNames = [
  ['monday', 'Mon'], ['tuesday', 'Tue'], ['wednesday', 'Wed'], ['thursday', 'Thu'],
  ['friday', 'Fri'], ['saturday', 'Sat'], ['sunday', 'Sun']
];

function apiUrl(path) {
  return `${API_BASE.replace(/\/$/, '')}${path}`;
}

async function api(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...options
  });

  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

  if (!response.ok) {
    const message = data.error || data.details || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function toast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  $('toastRoot').appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

function logAction(title, data = '') {
  const line = document.createElement('div');
  line.className = 'log-line';
  const time = new Date().toLocaleTimeString();
  const payload = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  line.innerHTML = `<strong>${time} — ${title}</strong>${payload ? `<br>${escapeHtml(payload)}` : ''}`;
  $('activityLog').prepend(line);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[c]));
}

function setLoading(button, loading, label = 'Working...') {
  if (!button) return;
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = label;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function uniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
}

function getCheckedDays(scope) {
  return qsa(`[data-days-for="${scope}"] input:checked`).map(input => input.value);
}

function buildDaySelectors() {
  qsa('.days').forEach(container => {
    container.innerHTML = dayNames.map(([value, label]) => `
      <label class="day-chip"><input type="checkbox" value="${value}"><span>${label}</span></label>
    `).join('');
  });
}

function switchTab(tabId) {
  qsa('.tab').forEach(tab => tab.classList.toggle('active', tab.id === tabId));
  qsa('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
  $('pageTitle').textContent = qs(`[data-tab="${tabId}"]`)?.textContent || 'Dashboard';
}

async function refreshAll() {
  await Promise.allSettled([checkHealth(), loadFiles(), loadSchedules(), loadEmergency(), loadVolume(), loadLanguages()]);
}

async function checkHealth() {
  const dot = $('statusDot');
  try {
    const data = await api('/health');
    dot.className = 'dot ok';
    $('statusText').textContent = 'Server Connected';
    $('serverText').textContent = data.server || API_BASE;
    $('mqttStatus').textContent = data.mqtt ? 'Connected' : 'Disconnected';
    return data;
  } catch (err) {
    dot.className = 'dot bad';
    $('statusText').textContent = 'Server Offline';
    $('serverText').textContent = API_BASE;
    $('mqttStatus').textContent = 'Offline';
    return null;
  }
}

async function loadVolume() {
  try {
    const data = await api('/audio/volume');
    const volume = Number(data.volume ?? 70);
    $('volumeSlider').value = volume;
    $('volumeLabel').textContent = `${volume}%`;
  } catch (_) {}
}

async function loadFiles() {
  let files = [];
  try {
    const registered = await api('/api/schedules/files/available');
    files = (registered.files || []).map(file => ({
      filename: file.filename || file.name,
      name: file.name || file.title || file.filename,
      description: file.description || '',
      id: file.id || file.filename
    })).filter(file => file.filename);
  } catch (_) {
    try {
      const listed = await api('/announcement/list');
      files = (listed.files || []).map(filename => ({ filename, name: filename, id: filename }));
    } catch (err) {
      logAction('Failed to load files', err.message);
    }
  }

  audioFiles = files;
  $('totalFiles').textContent = files.length;
  renderFileOptions();
  renderFileList();
}

function renderFileOptions() {
  const options = audioFiles.length
    ? audioFiles.map(file => `<option value="${escapeHtml(file.filename)}">${escapeHtml(file.name || file.filename)}</option>`).join('')
    : '<option value="">No audio files found</option>';
  $('fileSelect').innerHTML = options;
  $('announcementScheduleFile').innerHTML = options;
}

function renderFileList() {
  const root = $('fileList');
  if (!audioFiles.length) {
    root.innerHTML = '<div class="item"><div><div class="item-title">No audio files found</div><div class="item-meta">Upload a file first or check backend media folder.</div></div></div>';
    return;
  }

  root.innerHTML = audioFiles.map(file => `
    <div class="item">
      <div>
        <div class="item-title">${escapeHtml(file.name || file.filename)}</div>
        <div class="item-meta">${escapeHtml(file.filename)}${file.description ? ` • ${escapeHtml(file.description)}` : ''}</div>
      </div>
      <div class="item-actions">
        <button class="btn small primary" data-play-file="${escapeHtml(file.filename)}">Play</button>
        <a class="btn small ghost" href="${apiUrl(`/media/${encodeURIComponent(file.filename)}`)}" target="_blank" rel="noopener">Open</a>
      </div>
    </div>
  `).join('');
}

async function loadSchedules() {
  try {
    const data = await api('/api/schedules');
    schedules = data.schedules || [];
    $('totalSchedules').textContent = data.count ?? schedules.length;
    renderSchedules();
  } catch (err) {
    logAction('Failed to load schedules', err.message);
  }
}

function renderSchedules() {
  const root = $('scheduleList');
  if (!schedules.length) {
    root.innerHTML = '<div class="item"><div><div class="item-title">No schedules created</div><div class="item-meta">Create bell, audio file, or TTS schedules above.</div></div></div>';
    return;
  }

  root.innerHTML = schedules.map(schedule => {
    const details = [schedule.type, schedule.time, (schedule.days || []).join(', ') || 'one-time'].filter(Boolean).join(' • ');
    const content = schedule.filename || schedule.text || `duration ${schedule.duration || 5}s`;
    return `
      <div class="item">
        <div>
          <div class="item-title">${escapeHtml(schedule.name || schedule.id)} <span class="badge ${schedule.enabled ? 'on' : 'off'}">${schedule.enabled ? 'Enabled' : 'Disabled'}</span></div>
          <div class="item-meta">${escapeHtml(details)}</div>
          <div class="item-meta">${escapeHtml(content)}</div>
        </div>
        <div class="item-actions">
          <button class="btn small" data-toggle-schedule="${escapeHtml(schedule.id)}">Toggle</button>
          <button class="btn small danger" data-delete-schedule="${escapeHtml(schedule.id)}">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

async function loadEmergency() {
  try {
    const data = await api('/emergency/status');
    const enabled = Boolean(data.enabled ?? data.bell?.enabled);
    $('emergencyStatus').textContent = enabled ? 'Enabled' : 'Disabled';
    $('emergencyMini').textContent = enabled ? 'Enabled' : 'Disabled';
    const source = data.bell || data;
    if (source.repeatCount) $('emergencyRepeatCount').value = source.repeatCount;
    if (source.repeatInterval) $('emergencyRepeatInterval').value = source.repeatInterval;
    if (source.duration) $('emergencyDuration').value = source.duration;
  } catch (err) {
    $('emergencyStatus').textContent = 'Unknown';
    $('emergencyMini').textContent = 'Unknown';
  }
}

async function loadLanguages() {
  try {
    const data = await api('/announcement/tts/languages');
    const options = (data.languages || []).map(lang => `<option value="${escapeHtml(lang.code)}">${escapeHtml(lang.name)} (${escapeHtml(lang.code)})</option>`).join('');
    if (options) {
      $('languageSelect').innerHTML = options;
      $('aiLanguage').innerHTML = options;
    }
  } catch (_) {}
}

async function postJson(path, payload, successMessage) {
  const data = await api(path, { method: 'POST', body: JSON.stringify(payload) });
  logAction(successMessage, data);
  toast(successMessage);
  return data;
}

function bindEvents() {
  qsa('.nav-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  $('refreshBtn').addEventListener('click', refreshAll);
  $('reloadFilesBtn').addEventListener('click', loadFiles);
  $('reloadSchedulesBtn').addEventListener('click', loadSchedules);
  $('clearLogBtn').addEventListener('click', () => $('activityLog').innerHTML = '');

  $('stopAllBtn').addEventListener('click', async () => {
    try { await postJson('/announcement/stop', { target: 'all' }, 'Audio stop command sent'); } catch (err) { toast(err.message, 'error'); }
  });
  $('bellOnBtn').addEventListener('click', async () => {
    try { await postJson('/bell/on', {}, 'Bell ON command sent'); } catch (err) { toast(err.message, 'error'); }
  });
  $('bellOffBtn').addEventListener('click', async () => {
    try { await postJson('/bell/off', {}, 'Bell OFF command sent'); } catch (err) { toast(err.message, 'error'); }
  });
  $('playTestBtn').addEventListener('click', async () => {
    try { await postJson('/announcement/test', {}, 'Test audio command sent'); } catch (err) { toast(err.message, 'error'); }
  });

  $('volumeSlider').addEventListener('input', e => $('volumeLabel').textContent = `${e.target.value}%`);
  $('setVolumeBtn').addEventListener('click', async () => {
    try {
      const volume = Number($('volumeSlider').value);
      const data = await api('/audio/volume', { method: 'PUT', body: JSON.stringify({ volume }) });
      logAction('Volume updated', data);
      toast('Volume updated');
    } catch (err) { toast(err.message, 'error'); }
  });

  $('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.submitter;
    const formData = new FormData(event.currentTarget);
    const path = $('uploadAutoPlay').checked ? '/announcement/upload-and-play' : '/announcement/upload';
    try {
      setLoading(button, true, 'Uploading...');
      const data = await api(path, { method: 'POST', body: formData });
      logAction('Upload successful', data);
      toast(data.message || 'Audio uploaded successfully');
      event.currentTarget.reset();
      await loadFiles();
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(button, false); }
  });

  $('playFileForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const payload = { filename: $('fileSelect').value, target: $('playTarget').value, volume: Number($('playVolume').value) };
      await postJson('/announcement/play-file', payload, 'Playback command sent');
    } catch (err) { toast(err.message, 'error'); }
  });

  document.body.addEventListener('click', async (event) => {
    const playFile = event.target.dataset.playFile;
    const toggleId = event.target.dataset.toggleSchedule;
    const deleteId = event.target.dataset.deleteSchedule;

    try {
      if (playFile) await postJson('/announcement/play-file', { filename: playFile, target: 'all', volume: Number($('playVolume').value || 70) }, 'Playback command sent');
      if (toggleId) { await postJson(`/api/schedules/${encodeURIComponent(toggleId)}/toggle`, {}, 'Schedule toggled'); await loadSchedules(); }
      if (deleteId) {
        const data = await api(`/api/schedules/${encodeURIComponent(deleteId)}`, { method: 'DELETE' });
        logAction('Schedule deleted', data);
        toast('Schedule deleted');
        await loadSchedules();
      }
    } catch (err) { toast(err.message, 'error'); }
  });

  $('ttsForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const payload = { text: $('ttsText').value, language: $('languageSelect').value, speed: Number($('ttsSpeed').value), autoPlay: $('ttsAutoPlay').checked, convertToWav: true };
      const data = await postJson('/announcement/tts', payload, 'TTS generated');
      $('generatedOutput').textContent = JSON.stringify(data, null, 2);
      await loadFiles();
    } catch (err) { toast(err.message, 'error'); }
  });

  $('previewTtsBtn').addEventListener('click', async () => {
    try {
      const data = await postJson('/announcement/tts/preview', { text: $('ttsText').value, language: $('languageSelect').value, volume: Number($('playVolume').value || 70) }, 'TTS preview playing');
      $('generatedOutput').textContent = JSON.stringify(data, null, 2);
      await loadFiles();
    } catch (err) { toast(err.message, 'error'); }
  });

  $('aiForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const payload = { prompt: $('aiPrompt').value, language: $('aiLanguage').value, target: $('aiTarget').value, autoPlay: $('aiAutoPlay').checked };
      const data = await postJson('/announcement/ai', payload, 'AI announcement created');
      $('generatedOutput').textContent = JSON.stringify(data, null, 2);
      await loadFiles();
    } catch (err) { toast(err.message, 'error'); }
  });

  $('bellScheduleForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const name = $('bellScheduleName').value.trim();
      await postJson('/api/schedules/bell', { id: uniqueId('bell'), name, time: $('bellScheduleTime').value, duration: Number($('bellDuration').value || 5), days: getCheckedDays('bell'), enabled: true }, 'Bell schedule created');
      event.currentTarget.reset();
      await loadSchedules();
    } catch (err) { toast(err.message, 'error'); }
  });

  $('announcementScheduleForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const name = $('announcementScheduleName').value.trim();
      await postJson('/api/schedules/announcement', { id: uniqueId('audio'), name, filename: $('announcementScheduleFile').value, time: $('announcementScheduleTime').value, days: getCheckedDays('announcement'), enabled: true }, 'Announcement schedule created');
      event.currentTarget.reset();
      await loadSchedules();
    } catch (err) { toast(err.message, 'error'); }
  });

  $('ttsScheduleForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const name = $('ttsScheduleName').value.trim();
      await postJson('/api/schedules/tts', { id: uniqueId('tts'), name, text: $('ttsScheduleText').value, language: $('languageSelect').value || 'en', time: $('ttsScheduleTime').value, days: getCheckedDays('tts'), enabled: true }, 'TTS schedule created');
      event.currentTarget.reset();
      await loadSchedules();
    } catch (err) { toast(err.message, 'error'); }
  });

  const triggerEmergency = async () => {
    try { await postJson('/emergency/trigger', {}, 'Emergency bell triggered'); await loadEmergency(); } catch (err) { toast(err.message, 'error'); }
  };
  $('emergencyTriggerBtn').addEventListener('click', triggerEmergency);
  $('emergencyTriggerBtnTop').addEventListener('click', triggerEmergency);
  $('emergencyStopBtn').addEventListener('click', async () => {
  try {
    await postJson('/emergency/stop', {}, 'Emergency bell stopped');
    await loadEmergency();
  } catch (err) {
    toast(err.message, 'error');
  }
});
  $('enableEmergencyBtn').addEventListener('click', async () => {
    try { await api('/emergency/enable', { method: 'PUT', body: JSON.stringify({ enabled: true }) }); toast('Emergency enabled'); await loadEmergency(); } catch (err) { toast(err.message, 'error'); }
  });
  $('disableEmergencyBtn').addEventListener('click', async () => {
    try { await api('/emergency/enable', { method: 'PUT', body: JSON.stringify({ enabled: false }) }); toast('Emergency disabled'); await loadEmergency(); } catch (err) { toast(err.message, 'error'); }
  });
  $('emergencyConfigForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const payload = { repeatCount: Number($('emergencyRepeatCount').value), repeatInterval: Number($('emergencyRepeatInterval').value), duration: Number($('emergencyDuration').value) };
      const data = await api('/emergency/config', { method: 'PUT', body: JSON.stringify(payload) });
      logAction('Emergency config updated', data);
      toast('Emergency config updated');
      await loadEmergency();
    } catch (err) { toast(err.message, 'error'); }
  });

  $('apiBaseInput').value = API_BASE;
  $('apiSettingsForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    API_BASE = $('apiBaseInput').value.trim() || DEFAULT_API_BASE;
    localStorage.setItem('smartBellApiBase', API_BASE);
    toast('API base URL saved');
    await refreshAll();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  buildDaySelectors();
  bindEvents();
  await refreshAll();
  setInterval(checkHealth, 10000);
});
