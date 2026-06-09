/* ═══════════════════════════════════════════════════════════════════════
   ContentFlow — App Logic v10
   ═══════════════════════════════════════════════════════════════════════ */

const API = '/api';

// ── Format label helper (used everywhere format is displayed) ─────────────
const FMT_MAP = {
  carousel:     { label: 'Carousel',         icon: '📱', color: '#6366f1' },
  single_post:  { label: 'Single Post',      icon: '🖼️',  color: '#8b5cf6' },
  video_heygen: { label: 'Video Reel',        icon: '🎬', color: '#ec4899' },
  video_canva:  { label: 'Video Reel',        icon: '🎥', color: '#f59e0b' },
};
function fmtLabel(raw) {
  if (!raw) return { label: 'Post', icon: '📄', color: '#9ca3af' };
  // handle comma-separated multi-format (use first)
  const key = raw.split(',')[0].trim().toLowerCase();
  return FMT_MAP[key] || { label: raw.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()), icon:'📄', color:'#9ca3af' };
}

// ── Re-render helper: refresh list + board when data changes ──────────────
function syncAllViews() {
  // Sync board cache from state
  if (state.currentCalendarData) {
    _boardConcepts = state.currentCalendarData.concepts || [];
    _boardCalId    = state.currentCalendarId;
  }
  const active = state.activeProjectTab;
  if (active === 'board')    renderBoard();
  if (active === 'list')     renderListView();
  if (active === 'overview') renderCGTable();
}

// ── State ─────────────────────────────────────────────────────────────────
const state = {
  currentProjectId: null,
  currentProject: null,
  currentCalendarId: null,
  currentCalendarData: null,
  activeProjectTab: 'overview',
  wizardStep: 1,
  wizardData: {
    name:'', niche:'', business_type:'', goal:'', emoji:'🚀', color:'#667eea',
    target_age:'25-34', target_gender:'All', target_location:'', target_interests:'',
    target_pain_points:'', unique_selling_point:'', competitor_handles:'', brand_colors:'',
    tone_of_voice:'Fun & Relatable', campaign_days:30, posting_frequency:'Daily',
    goal_type:'followers', value_bomb_types:['Value Bomb','Carousel Tutorial','Free PDF Bomb'],
    members: []
  },
  contentTypeChart: null,
  engagementChart: null,
  // Pre-populated from server-rendered __CF_USER__ — no async race possible
  currentUser: (typeof window !== 'undefined' && window.__CF_USER__) || { role: 'worker' },
  activityItems: [],
  activityPage: 1,
};

// ── Role-Based Access Control ─────────────────────────────────────────────
//
//  admin     — full access, manage users, delete anything
//  manager   — grid + board + calendar + list, invite members, NO delete comment
//  executive — calendar + list only, mark done, comment, ads
//  worker    — calendar + list only (same as executive, different label)
//
const ROLE_PERMS = {
  admin:     { grid:true,  board:true,  calendar:true, list:true,
               generate:true,  assign:true,   deleteContent:true,
               deleteComment:true,  manageUsers:true, invite:true,
               editConcept:true, moveCard:true },
  manager:   { grid:true,  board:true,  calendar:true, list:true,
               generate:true,  assign:true,   deleteContent:false,
               deleteComment:false, manageUsers:false, invite:true,
               editConcept:true, moveCard:true },
  executive: { grid:false, board:false, calendar:true, list:true,
               generate:false, assign:false,  deleteContent:false,
               deleteComment:false, manageUsers:false, invite:false,
               editConcept:false, moveCard:false },
  worker:    { grid:false, board:false, calendar:true, list:true,
               generate:false, assign:false,  deleteContent:false,
               deleteComment:false, manageUsers:false, invite:false,
               editConcept:false, moveCard:false },
};

function can(action) {
  const role = (state.currentUser && state.currentUser.role) || 'worker';
  const perms = ROLE_PERMS[role] || ROLE_PERMS.worker;
  return !!perms[action];
}

function myRole() {
  return (state.currentUser && state.currentUser.role) || 'worker';
}

// Labels & colours for each role
const ROLE_META = {
  admin:     { label: 'Admin',     color: '#ef4444', bg: '#fef2f2', icon: '🛡️' },
  manager:   { label: 'Manager',   color: '#f59e0b', bg: '#fffbeb', icon: '⚙️' },
  executive: { label: 'Executive', color: '#3b82f6', bg: '#eff6ff', icon: '💼' },
  worker:    { label: 'Worker',    color: '#10b981', bg: '#f0fdf4', icon: '🎨' },
};

function roleMeta(r) { return ROLE_META[r] || ROLE_META.worker; }

async function loadCurrentUser() {
  // state.currentUser is already set from window.__CF_USER__ (server-rendered, synchronous).
  // Apply role gates immediately using that data — no waiting for fetch.
  const preloaded = state.currentUser;
  applyRoleToDocument(preloaded.role || 'worker');
  updateSidebarUser(preloaded);

  // Then refresh from /api/me in the background to pick up any mid-session role changes.
  try {
    const me = await api('GET', '/me');
    if (me && me.role) {
      state.currentUser = me;
      applyRoleToDocument(me.role);
      updateSidebarUser(me);
    }
  } catch(e) { /* keep server-injected user */ }
}

function applyRoleToDocument(role) {
  document.body.setAttribute('data-role', role);
  // Show/hide tabs based on role
  document.querySelectorAll('.ptab[data-tab]').forEach(btn => {
    const tab = btn.getAttribute('data-tab');
    const restricted = ['overview', 'board'];
    if (restricted.includes(tab) && !can('grid') && !can('board')) {
      btn.style.display = 'none';
    } else {
      btn.style.display = '';
    }
  });
  // Specifically gate each tab button
  const tabGates = { overview: 'grid', board: 'board' };
  Object.entries(tabGates).forEach(([tab, perm]) => {
    const btn = document.querySelector(`.ptab[data-tab="${tab}"]`);
    if (btn) btn.style.display = can(perm) ? '' : 'none';
  });
  // Show/hide admin-only sidebar link
  const adminLink = document.querySelector('.sidebar-nav a[href="/admin"]');
  if (adminLink) adminLink.parentElement.style.display = can('manageUsers') ? '' : 'none';
  // Show/hide role-gated elements added by JS (re-evaluate after each render)
}

function updateSidebarUser(me) {
  const nameEl  = document.querySelector('.sidebar-user-name');
  const emailEl = document.querySelector('.sidebar-user-email');
  const avatarEl = document.getElementById('sidebar-user-avatar');
  if (nameEl)  nameEl.textContent = me.name || 'User';
  if (emailEl) emailEl.textContent = me.email || '';
  if (avatarEl) {
    avatarEl.textContent = (me.name || me.email || 'U')[0].toUpperCase();
    avatarEl.style.background = roleMeta(me.role).color;
    avatarEl.style.color = '#fff';
  }
  // Inject role badge below email if not already there
  const userDiv = document.getElementById('sidebar-user-info');
  if (userDiv && !userDiv.querySelector('.role-badge')) {
    const rm = roleMeta(me.role || 'worker');
    const badge = document.createElement('span');
    badge.className = 'role-badge';
    badge.style.cssText = `display:inline-block;font-size:9px;font-weight:700;padding:1px 6px;
      border-radius:20px;background:${rm.bg};color:${rm.color};border:1px solid ${rm.color}44;
      margin-top:2px;letter-spacing:.4px;`;
    badge.textContent = `${rm.icon} ${rm.label}`;
    userDiv.appendChild(badge);
  }
}

/* ── Heartbeat — keeps last_seen fresh every 30s ─────────────────────── */
async function sendHeartbeat() {
  try { await api('POST', '/heartbeat'); } catch(e) { /* silent */ }
}

/* ── Presence panel — shows who's online (manager+) ─────────────────── */
function fmtAgo(seconds) {
  if (seconds === null || seconds === undefined) return 'never';
  if (seconds < 60)  return 'just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  return Math.floor(seconds / 86400) + 'd ago';
}

async function loadPresence() {
  if (!can('generate')) return; // manager+ only
  const panel = document.getElementById('sidebar-online-panel');
  if (!panel) return;
  try {
    const users = await api('GET', '/presence');
    if (!Array.isArray(users)) return;
    const list   = document.getElementById('online-members-list');
    const badge  = document.getElementById('online-count-badge');
    const online = users.filter(u => u.status === 'online');
    const away   = users.filter(u => u.status === 'away');
    const visible = [...online, ...away, ...users.filter(u => u.status === 'offline')];

    if (badge) badge.textContent = online.length || '0';

    // Compact avatar strip — show all users, sorted online first
    if (list) {
      list.innerHTML = visible.map(u => {
        const rm   = ROLE_META[u.role] || ROLE_META.worker;
        const name = u.name || u.email || '?';
        const init = name[0].toUpperCase();
        const statusLabel = u.status === 'online' ? 'Online' : u.status === 'away' ? 'Away' : 'Offline';
        const roleLabel = (u.role||'worker').charAt(0).toUpperCase()+(u.role||'worker').slice(1);
        return `<div class="pa-avatar" style="background:${rm.color}" title="${name} · ${roleLabel} · ${statusLabel}">
          ${init}
          <span class="pa-dot ${u.status}"></span>
        </div>`;
      }).join('');
    }
  } catch(e) { /* silent */ }
}

function startPresenceLoop() {
  sendHeartbeat();
  loadPresence();
  setInterval(sendHeartbeat, 30000);
  if (can('generate')) setInterval(loadPresence, 30000);
}

/* ═══════════════════════════════════════════════════════════════════════
   TEAM CHAT (Hangout)
   ═══════════════════════════════════════════════════════════════════════ */
const _chat = { open: false, lastId: 0, pollTimer: null, unread: 0 };

function toggleChat() {
  const panel = document.getElementById('chat-panel');
  if (!panel) return;
  _chat.open = !_chat.open;
  panel.classList.toggle('chat-open', _chat.open);
  if (_chat.open) {
    _chat.unread = 0;
    updateChatBadge();
    chatLoadMessages();
    document.getElementById('chat-input')?.focus();
    if (!_chat.pollTimer) _chat.pollTimer = setInterval(chatPoll, 3000);
  } else {
    clearInterval(_chat.pollTimer); _chat.pollTimer = null;
  }
}

function updateChatBadge() {
  const b = document.getElementById('chat-fab-badge');
  if (!b) return;
  b.textContent = _chat.unread || '';
  b.style.display = _chat.unread > 0 ? 'flex' : 'none';
}

function chatTimeLabel(ts) {
  if (!ts) return '';
  const d = new Date(ts.replace(' ','T') + (ts.includes('+') ? '' : 'Z'));
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60)  return 'just now';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  const hh = d.getHours(), mm = String(d.getMinutes()).padStart(2,'0');
  return `${hh}:${mm}`;
}

function chatRenderMessages(msgs, append) {
  const box = document.getElementById('chat-messages');
  if (!box) return;
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
  const myId = state.currentUser?.id;

  const html = msgs.map(m => {
    const rm = ROLE_META[m.user_role] || ROLE_META.worker;
    const isMine = m.user_id === myId;
    const init = (m.user_name||'?')[0].toUpperCase();
    const roleLabel = (m.user_role||'worker').charAt(0).toUpperCase()+(m.user_role||'worker').slice(1);
    return `<div class="chat-msg ${isMine ? 'chat-msg-mine' : ''}" data-id="${m.id}">
      ${!isMine ? `<div class="chat-msg-avatar" style="background:${rm.color}">${init}</div>` : ''}
      <div class="chat-msg-body">
        ${!isMine ? `<div class="chat-msg-meta"><span class="chat-msg-name">${m.user_name}</span><span class="chat-msg-role" style="color:${rm.color}">(${roleLabel})</span></div>` : ''}
        <div class="chat-bubble">${escHtml(m.message)}</div>
        <div class="chat-msg-time">${chatTimeLabel(m.created_at)}</div>
      </div>
      ${isMine ? `<div class="chat-msg-avatar chat-msg-avatar-right" style="background:${rm.color}">${init}</div>` : ''}
    </div>`;
  }).join('');

  if (append) {
    box.insertAdjacentHTML('beforeend', html);
  } else {
    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
    return;
  }
  if (atBottom) box.scrollTop = box.scrollHeight;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function chatLoadMessages() {
  try {
    const msgs = await api('GET', '/chat');
    if (msgs.length) _chat.lastId = msgs[msgs.length-1].id;
    chatRenderMessages(msgs, false);
  } catch(e) {}
}

async function chatPoll() {
  if (!_chat.open) return;
  try {
    const msgs = await api('GET', `/chat?since=${_chat.lastId}`);
    if (!msgs.length) return;
    _chat.lastId = msgs[msgs.length-1].id;
    chatRenderMessages(msgs, true);
    if (!_chat.open) { _chat.unread += msgs.length; updateChatBadge(); }
  } catch(e) {}
}

async function chatSend() {
  const input = document.getElementById('chat-input');
  const msg = (input?.value || '').trim();
  if (!msg) return;
  input.value = '';
  input.disabled = true;
  try {
    const saved = await api('POST', '/chat', { message: msg });
    if (saved && saved.id) {
      _chat.lastId = saved.id;
      chatRenderMessages([saved], true);
    }
  } catch(e) { toast('Failed to send message', 'error'); }
  finally { input.disabled = false; input.focus(); }
}

function chatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatSend(); }
}

function applyTopbarRoleGates() {
  // "Generate Calendar" button in topbar — only admin/manager
  const genBtn = document.querySelector('.project-topbar-right .btn-primary');
  if (genBtn) genBtn.style.display = can('generate') ? '' : 'none';

  // "Delete Project" in project menu — admin only
  const delBtn = document.querySelector('.project-menu .danger');
  if (delBtn) delBtn.style.display = can('deleteContent') ? '' : 'none';

  // Inject Invite + Manage Users buttons into topbar if not there yet
  const topbarRight = document.querySelector('.project-topbar-right');
  if (topbarRight && !topbarRight.querySelector('.topbar-invite-btn')) {
    if (can('invite')) {
      const invBtn = document.createElement('button');
      invBtn.className = 'btn-secondary btn-sm topbar-invite-btn';
      invBtn.innerHTML = '<i class="fas fa-user-plus"></i> Invite';
      invBtn.onclick = openInviteModal;
      topbarRight.insertBefore(invBtn, topbarRight.firstChild);
    }
    if (can('manageUsers')) {
      const usrBtn = document.createElement('button');
      usrBtn.className = 'btn-secondary btn-sm topbar-invite-btn';
      usrBtn.style.marginRight = '4px';
      usrBtn.innerHTML = '<i class="fas fa-users-cog"></i> Users';
      usrBtn.onclick = openUserManager;
      topbarRight.insertBefore(usrBtn, topbarRight.firstChild);
    }
  }
}

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadCurrentUser();
  loadSidebar();
  loadSettings();
  wireGoalCards();
  setDefaultDate();
  // Start heartbeat + presence after a brief delay so user/role are ready
  setTimeout(startPresenceLoop, 1500);
});

function setDefaultDate() {
  const el = document.getElementById('gen-start-date');
  if (!el) return;
  // Use LOCAL date parts — toISOString() gives UTC which can be yesterday in UTC+7 before 7AM
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const dy = String(now.getDate()).padStart(2, '0');
  el.value = `${y}-${mo}-${dy}`;
}

// ── Toast ─────────────────────────────────────────────────────────────────
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => { el.className = 'toast'; }, 3500);
}

// ── Views ─────────────────────────────────────────────────────────────────
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const v = document.getElementById(id);
  if (v) v.classList.add('active');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// ── Sidebar ───────────────────────────────────────────────────────────────
async function loadSidebar() {
  try {
    const projects = await api('GET', '/clients');
    const container = document.getElementById('sidebar-projects');
    if (!projects.length) {
      container.innerHTML = '<div class="sidebar-empty">No projects yet</div>';
      return;
    }
    container.innerHTML = projects.map(p => `
      <div class="sidebar-project-item ${p.id === state.currentProjectId ? 'active' : ''}"
           onclick="openProject('${p.id}')">
        <div class="proj-avatar" style="background:${p.color || '#667eea'}20;">
          <span>${p.emoji || '🚀'}</span>
        </div>
        <div style="overflow:hidden; min-width:0;">
          <div class="sidebar-project-name">${esc(p.name)}</div>
          <div class="sidebar-project-meta">${esc(p.niche || '')}</div>
        </div>
      </div>
    `).join('');

    // Populate generate modal project dropdown
    const sel = document.getElementById('gen-client-select');
    if (sel) {
      sel.innerHTML = '<option value="">Choose a project...</option>' +
        projects.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
    }
  } catch(e) {
    console.error('loadSidebar', e);
  }
}

// ── Open Project ──────────────────────────────────────────────────────────
async function openProject(id) {
  state.currentProjectId = id;
  showView('view-project');
  clearSidebarActive();
  document.querySelectorAll('.sidebar-project-item').forEach(el => {
    el.classList.toggle('active', el.querySelector('.sidebar-project-name') &&
      el.onclick && el.onclick.toString().includes(id));
  });
  // Re-render sidebar to update active state
  await loadSidebar();
  // Re-highlight
  document.querySelectorAll('.sidebar-project-item').forEach(el => {
    if (el.getAttribute('onclick') && el.getAttribute('onclick').includes(id)) {
      el.classList.add('active');
    }
  });

  await loadProjectView(id);
  switchProjectTab(state.activeProjectTab || 'overview');
}

async function loadProjectView(id) {
  try {
    const project = await api('GET', `/clients/${id}`);
    state.currentProject = project;

    document.getElementById('project-emoji').textContent = project.emoji || '🚀';
    document.getElementById('project-name-header').textContent = project.name;
    document.getElementById('project-niche-header').textContent = project.niche + (project.business_type ? ` · ${project.business_type}` : '');

    renderProjectStats(project);
    renderMilestones(project.milestones || []);
    renderCalendarsList(project.calendars || [], id);
    renderActivityFeed(project.activity || []);
    renderTeamTab(project.members || []);
    populateBoardCalendarSelects(project.calendars || []);
    populateCalendarDropdowns(project.calendars || []);
    applyTopbarRoleGates();
  } catch(e) {
    toast('Failed to load project', 'error');
  }
}

// ── Project Stats ─────────────────────────────────────────────────────────
function renderProjectStats(project) {
  const calendars  = project.calendars  || [];
  const members    = project.members    || [];
  const milestones = project.milestones || [];
  const done       = milestones.filter(m => m.completed).length;
  const total      = project.total_concepts     || 0;
  const published  = project.published_concepts || 0;
  const el = document.getElementById('project-stats-row');
  if (!el) return;

  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">📝</div>
      <div class="stat-label">Total Posts</div>
      <div class="stat-value">${total}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">✅</div>
      <div class="stat-label">Published</div>
      <div class="stat-value">${published}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">📅</div>
      <div class="stat-label">Calendars</div>
      <div class="stat-value">${calendars.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">👥</div>
      <div class="stat-label">Team</div>
      <div class="stat-value">${members.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🎯</div>
      <div class="stat-label">Milestones</div>
      <div class="stat-value">${done}/${milestones.length || 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">${project.goal_type === 'sales' ? '💰' : '📈'}</div>
      <div class="stat-label">Goal</div>
      <div class="stat-value" style="font-size:13px;">${project.goal_type === 'sales' ? 'Drive Sales' : 'Grow Followers'}</div>
    </div>
  `;
}

// ── Project Tabs ──────────────────────────────────────────────────────────
function switchProjectTab(tab) {
  // Role gate: executive / worker cannot access grid or board
  if (tab === 'overview' && !can('grid')) {
    toast('Your role does not have access to the Campaign Grid', 'error');
    tab = 'calendar';
  }
  if (tab === 'board' && !can('board')) {
    toast('Your role does not have access to the Board', 'error');
    tab = 'calendar';
  }

  state.activeProjectTab = tab;
  document.querySelectorAll('.ptab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === 'tab-' + tab);
  });

  if (tab === 'overview')  loadGridDashboard();
  if (tab === 'board')     loadBoard();
  if (tab === 'list')      renderListView();
  if (tab === 'followers') loadFollowersPushTab();
}

// ── Milestones ────────────────────────────────────────────────────────────
function renderMilestones(milestones) {
  const el = document.getElementById('milestones-list');
  if (!el) return;
  if (!milestones.length) {
    el.innerHTML = '<div class="milestone-empty">No milestones yet. Click + to add one.</div>';
    return;
  }
  el.innerHTML = milestones.map(m => `
    <div class="milestone-item ${m.completed ? 'done' : ''}" id="ms-${m.id}">
      <div class="milestone-check" onclick="toggleMilestone('${m.id}', ${m.completed ? 0 : 1})">
        ${m.completed ? '<i class="fas fa-check" style="font-size:10px;"></i>' : ''}
      </div>
      <div class="milestone-title">${esc(m.title)}</div>
      <div class="milestone-date">${m.due_date ? fmtDate(m.due_date) : ''}</div>
    </div>
  `).join('');
}

async function toggleMilestone(id, completed) {
  await api('PUT', `/milestones/${id}`, { completed });
  const item = document.getElementById('ms-' + id);
  if (item) {
    item.classList.toggle('done', !!completed);
    const check = item.querySelector('.milestone-check');
    check.innerHTML = completed ? '<i class="fas fa-check" style="font-size:10px;"></i>' : '';
    check.setAttribute('onclick', `toggleMilestone('${id}', ${completed ? 0 : 1})`);
    const title = item.querySelector('.milestone-title');
    if (title) title.style.textDecoration = completed ? 'line-through' : '';
  }
  toast(completed ? 'Milestone completed! 🎉' : 'Milestone reopened', completed ? 'success' : '');
}

// ── Calendars List ────────────────────────────────────────────────────────
function renderCalendarsList(calendars, projectId) {
  const el = document.getElementById('project-calendars-list');
  if (!el) return;
  if (!calendars.length) {
    el.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:12px 0;">No calendars yet. Click Generate to create one.</div>';
    return;
  }
  el.innerHTML = calendars.map(c => `
    <div class="cal-list-item" onclick="viewCalendar('${c.id}')">
      <div class="cal-list-info">
        <span class="cal-list-icon">📅</span>
        <div>
          <div class="cal-list-name">${c.month} Calendar</div>
          <div class="cal-list-meta">${c.campaign_days || 30} days · ${c.goal_type === 'sales' ? 'Drive Sales' : 'Grow Followers'}</div>
        </div>
      </div>
      <span class="cal-list-badge">${c.status}</span>
    </div>
  `).join('');
}

// ── Activity Feed ─────────────────────────────────────────────────────────
const ACTIVITY_PER_PAGE = 10;

function renderActivityFeed(activity, resetPage) {
  const el = document.getElementById('activity-feed');
  if (!el) return;

  // Store full list; reset to page 1 when loading fresh data
  if (activity !== undefined) {
    state.activityItems = activity || [];
    if (resetPage !== false) state.activityPage = 1;
  }

  const items     = state.activityItems;
  const totalPages = Math.max(1, Math.ceil(items.length / ACTIVITY_PER_PAGE));
  const page      = Math.min(state.activityPage, totalPages);
  state.activityPage = page;

  const start = (page - 1) * ACTIVITY_PER_PAGE;
  const slice = items.slice(start, start + ACTIVITY_PER_PAGE);

  if (!items.length) {
    el.innerHTML = '<div class="activity-empty">No activity yet</div>';
  } else {
    el.innerHTML = slice.map(a => `
      <div class="activity-item">
        <div class="activity-avatar">${(a.actor || 'U')[0].toUpperCase()}</div>
        <div>
          <div class="activity-text"><strong>${esc(a.actor)}</strong> ${esc(a.action)}${a.target ? ': <em>' + esc(a.target) + '</em>' : ''}</div>
          <div class="activity-time">${timeAgo(a.created_at)}</div>
        </div>
      </div>
    `).join('');
  }

  // Inject / update pagination bar right after the feed
  let pager = document.getElementById('activity-pager');
  if (!pager) {
    pager = document.createElement('div');
    pager.id = 'activity-pager';
    pager.className = 'activity-pager';
    el.parentNode.insertBefore(pager, el.nextSibling);
  }

  if (totalPages <= 1) {
    pager.style.display = 'none';
  } else {
    pager.style.display = 'flex';
    pager.innerHTML = `
      <button class="activity-page-btn" onclick="changeActivityPage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
      </button>
      <span class="activity-page-info">Page ${page} of ${totalPages}</span>
      <button class="activity-page-btn" onclick="changeActivityPage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>
        <i class="fas fa-chevron-right"></i>
      </button>
    `;
  }
}

function changeActivityPage(page) {
  const totalPages = Math.ceil(state.activityItems.length / ACTIVITY_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  state.activityPage = page;
  renderActivityFeed(undefined, false);
}

// ── Board View ────────────────────────────────────────────────────────────
const BOARD_COLS = [
  { key:'idea',        label:'Ideas',       color:'#9ca3af', icon:'💡' },
  { key:'assigned',    label:'Assigned',    color:'#3b82f6', icon:'👤' },
  { key:'in_progress', label:'In Progress', color:'#f59e0b', icon:'⚡' },
  { key:'submitted',   label:'Submitted',   color:'#8b5cf6', icon:'📤' },
  { key:'approved',    label:'Approved',    color:'#10b981', icon:'✅' },
  { key:'published',   label:'Published',   color:'#ec4899', icon:'🚀' },
  { key:'failed',      label:'Failed',      color:'#ef4444', icon:'❌' },
];

// Human-readable format labels
const FORMAT_LABELS = {
  carousel:    { label:'Carousel',    icon:'📱', color:'#6366f1' },
  single_post: { label:'Single Post', icon:'🖼️', color:'#8b5cf6' },
  video_heygen:{ label:'Video Reel',  icon:'🎬', color:'#ec4899' },
  video_canva: { label:'Video Reel',  icon:'🎥', color:'#f59e0b' },
};

// Grid column badge by grid_slot_type name
function _gridBadge(gridSlotType) {
  const name = (gridSlotType || '').toLowerCase();
  if (name.includes('value'))  return { label:'Value',  color:'#6366f1', bg:'#6366f115' };
  if (name.includes('growth')) return { label:'Growth', color:'#10b981', bg:'#10b98115' };
  if (name.includes('sales'))  return { label:'Sales',  color:'#f59e0b', bg:'#f59e0b15' };
  return { label: gridSlotType || 'Content', color:'#9ca3af', bg:'#9ca3af15' };
}

// Module-level board data cache
let _boardConcepts = [];
let _boardCalId    = null;

async function loadBoard() {
  const container = document.getElementById('board-columns');
  if (!container) return;

  // Which calendar to show?
  const sel = document.getElementById('board-calendar-select');
  const selCalId = sel ? sel.value : '';

  // Use selected calendar or fall back to currently loaded one
  const calId = selCalId || state.currentCalendarId || _boardCalId;

  if (!calId && !state.currentCalendarData) {
    container.innerHTML = `
      <div style="color:var(--text-muted);padding:40px;text-align:center;width:100%;">
        <i class="fas fa-columns" style="font-size:36px;opacity:.2;display:block;margin-bottom:12px;"></i>
        <div style="font-size:14px;">Generate a campaign first to see the board</div>
      </div>`;
    return;
  }

  container.innerHTML = `<div style="color:var(--text-muted);padding:20px;"><i class="fas fa-spinner fa-spin"></i> Loading board…</div>`;

  try {
    let concepts = [];
    if (calId) {
      const data = await api('GET', `/calendars/${calId}`);
      _boardCalId = calId;
      // Keep state in sync
      if (calId === state.currentCalendarId) state.currentCalendarData = data;
      concepts = data.concepts || [];
    } else if (state.currentCalendarData) {
      concepts = state.currentCalendarData.concepts || [];
    }
    _boardConcepts = concepts;
    renderBoard();
  } catch(e) {
    container.innerHTML = `<div style="color:var(--text-muted);padding:20px;">Failed to load board — try switching to Grid tab first.</div>`;
  }
}

function renderBoard() {
  const container = document.getElementById('board-columns');
  if (!container) return;

  if (!_boardConcepts.length) {
    container.innerHTML = `
      <div style="color:var(--text-muted);padding:40px;text-align:center;width:100%;">
        <i class="fas fa-columns" style="font-size:36px;opacity:.2;display:block;margin-bottom:12px;"></i>
        <div style="font-size:14px;">No concepts yet — generate your campaign in the Grid tab</div>
      </div>`;
    return;
  }

  const todayMid = new Date(); todayMid.setHours(0,0,0,0);
  const validKeys = new Set(BOARD_COLS.map(c => c.key));
  const grouped = {};
  BOARD_COLS.forEach(c => grouped[c.key] = []);
  // "Failed" = post date has passed AND status is still in early stage
  // (idea / assigned / in_progress). If someone submitted/approved/published
  // even late, it belongs in the real status column, not Failed.
  const failedStages = new Set(['idea', 'assigned', 'in_progress']);
  _boardConcepts.forEach(c => {
    const raw      = (c.status || 'idea').toLowerCase();
    const cardDate = c.date ? new Date(c.date + 'T00:00:00') : null;
    const isOverdue = cardDate && cardDate < todayMid && failedStages.has(raw);
    if (isOverdue) {
      grouped['failed'].push(c);
    } else {
      grouped[validKeys.has(raw) ? raw : 'idea'].push(c);
    }
  });

  container.innerHTML = BOARD_COLS.map(col => {
    // Build generate buttons inside the map so `col` is defined
    const genButtons = (col.key === 'idea' && _cgGrids.length)
      ? `<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:8px;">
          ${_cgGrids.map((g, gi) => {
            const nextEmpty = _findNextEmptySlot(gi);
            return nextEmpty
              ? `<button onclick="openCGPanel(${nextEmpty},${gi})"
                   style="font-size:10px;padding:4px 8px;border-radius:6px;border:1px solid ${g.color}50;
                          background:${g.color}10;color:${g.color};cursor:pointer;text-align:left;font-weight:600;">
                   <i class="fas fa-plus"></i> ${esc(g.name)} · Day ${nextEmpty}
                 </button>`
              : `<div style="font-size:10px;padding:4px 8px;color:var(--text-muted);text-align:center;">
                   ${esc(g.name)} — all slots filled ✓
                 </div>`;
          }).join('')}
         </div>`
      : '';

    return `
    <div class="board-col">
      <div class="board-col-header">
        <div class="board-col-title">
          <div class="board-col-dot" style="background:${col.color};box-shadow:0 0 0 3px ${col.color}22;"></div>
          ${col.label}
        </div>
        <span class="board-col-count" style="background:${col.color}15;color:${col.color};border-color:${col.color}30;">${grouped[col.key].length}</span>
      </div>
      ${col.key === 'idea' ? genButtons : ''}
      <div class="board-cards" id="col-${col.key}">
        ${grouped[col.key].length
          ? grouped[col.key].map(c => renderBoardCard(c, todayMid)).join('')
          : '<div class="board-empty"><i class="fas fa-inbox" style="display:block;font-size:18px;opacity:.3;margin-bottom:4px;"></i>No items</div>'}
      </div>
    </div>`;
  }).join('');
}

// Find the next day with an empty slot for a given grid index
function _findNextEmptySlot(gi) {
  const todayMid = new Date(); todayMid.setHours(0,0,0,0);
  const startDt  = _cgStartDate ? new Date(_cgStartDate + 'T00:00:00') : new Date();
  for (let day = 1; day <= (_cgDays || 30); day++) {
    const dt = new Date(startDt); dt.setDate(dt.getDate() + day - 1);
    if (dt < todayMid) continue; // skip past days
    const slot = cgGetSlot(day, gi);
    if (slot && !_cgConcepts[`${day}-${gi}`]) return day;
  }
  return null;
}

function renderBoardCard(c, todayMid) {
  const now      = todayMid || (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  const fmt      = fmtLabel(c.format);
  const grid     = _gridBadge(c.grid_slot_type);
  const status   = (c.status || 'idea').toLowerCase();
  const done     = status === 'approved' || status === 'published';
  const cardDate = c.date ? new Date(c.date + 'T00:00:00') : null;
  const isToday  = cardDate && cardDate.toDateString() === now.toDateString();
  const isFailed = cardDate && cardDate < now && ['idea','assigned','in_progress'].includes(status); // overdue + still early stage
  const assignee = (c.assigned_to || '').trim();

  // Border glow class
  let glowClass = '';
  if (done)         glowClass = 'board-card--done';    // green glow
  else if (isToday) glowClass = 'board-card--today';   // orange glow
  else if (isFailed) glowClass = 'board-card--missed'; // red glow (reuses existing animation)

  // Status indicator pill colour
  const statusColors = {
    idea:'#9ca3af', assigned:'#3b82f6', in_progress:'#f59e0b',
    submitted:'#8b5cf6', approved:'#10b981', published:'#ec4899', failed:'#ef4444'
  };
  const sBg = statusColors[status] || '#9ca3af';

  // Status dropdown — exclude 'failed' (it's computed, not manually set)
  const statusOptions = BOARD_COLS
    .filter(col => col.key !== 'failed')
    .map(col => `<option value="${col.key}" ${status===col.key?'selected':''}>${col.icon} ${col.label}</option>`)
    .join('');

  return `
    <div class="board-card ${glowClass}" id="bcard-${c.id}">

      <!-- Top row: day · date | grid badge | delete -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;gap:4px;">
        <span style="font-size:10px;color:var(--text-muted);flex:1;min-width:0;">
          ${isFailed ? '<i class="fas fa-times-circle" style="color:#ef4444;margin-right:3px;"></i>' :
            isToday  ? '<i class="fas fa-bell" style="color:#f59e0b;margin-right:3px;"></i>' :
            done     ? '<i class="fas fa-check-circle" style="color:#10b981;margin-right:3px;"></i>' : ''}
          Day ${c.day} · ${fmtDate(c.date)}
        </span>
        <span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:20px;background:${grid.bg};color:${grid.color};white-space:nowrap;">${grid.label}</span>
        <button onclick="boardDeleteCard('${c.id}')" title="Delete card"
          style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:2px 4px;border-radius:4px;font-size:11px;flex-shrink:0;line-height:1;transition:color .15s;"
          onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--text-muted)'">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>

      <!-- Hook — click to open modal -->
      <div class="board-card-hook" onclick="openConceptModal('${c.id}')" style="cursor:pointer;" title="Open detail">${esc(c.hook)}</div>

      <!-- Format + status badges -->
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
        <span style="font-size:10px;font-weight:600;padding:2px 7px;border-radius:20px;background:${fmt.color}15;color:${fmt.color};">
          ${fmt.icon} ${fmt.label}
        </span>
        <span style="font-size:9px;font-weight:600;padding:2px 7px;border-radius:20px;background:${sBg}18;color:${sBg};">
          ${BOARD_COLS.find(b=>b.key===status)?.icon||''} ${status.replace('_',' ')}
        </span>
        ${isToday  ? '<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:20px;background:#f59e0b20;color:#f59e0b;letter-spacing:.3px;">TODAY</span>' : ''}
        ${isFailed ? '<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:20px;background:#ef444425;color:#ef4444;letter-spacing:.3px;">FAILED</span>' : ''}
      </div>

      <!-- Status selector (no "Failed" option — it's auto-computed) -->
      <div style="margin-bottom:8px;">
        <select class="board-status-sel" onchange="setBoardStatus('${c.id}', this.value)">
          ${statusOptions}
        </select>
      </div>

      <!-- Assignee row -->
      <div id="bcard-assign-row-${c.id}">
        ${assignee
          ? `<div style="display:flex;align-items:center;justify-content:space-between;">
               <div style="display:flex;align-items:center;gap:6px;">
                 <div style="width:22px;height:22px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:700;">${esc(assignee[0].toUpperCase())}</div>
                 <span style="font-size:11px;color:var(--text-secondary);">${esc(assignee)}</span>
               </div>
               <button onclick="boardClearAssignee('${c.id}')" style="background:none;border:none;color:var(--text-muted);font-size:11px;cursor:pointer;" title="Remove"><i class="fas fa-times"></i></button>
             </div>`
          : `<button class="board-assign-btn" onclick="boardShowAssignInput('${c.id}')">
               <i class="fas fa-user-plus"></i> Assign to someone
             </button>`}
      </div>

      <!-- Hidden assign input -->
      <div id="bcard-assign-input-${c.id}" style="display:none;margin-top:6px;">
        <div style="display:flex;gap:6px;">
          <input id="bcard-assign-val-${c.id}" type="text" placeholder="Name or email…" class="board-assign-input"
            onkeydown="if(event.key==='Enter')boardSaveAssignee('${c.id}')">
          <button onclick="boardSaveAssignee('${c.id}')" style="background:var(--primary);color:#fff;border:none;border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer;">
            <i class="fas fa-check"></i>
          </button>
          <button onclick="boardHideAssignInput('${c.id}')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 7px;font-size:11px;cursor:pointer;">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>`;
}

// ── Board action handlers ──────────────────────────────────────────────────

async function setBoardStatus(id, newStatus) {
  try {
    await api('PUT', `/concepts/${id}`, { status: newStatus });
    // Update in-memory
    const c = _boardConcepts.find(x => x.id === id);
    if (c) c.status = newStatus;
    if (state.currentCalendarData) {
      const sc = (state.currentCalendarData.concepts || []).find(x => x.id === id);
      if (sc) sc.status = newStatus;
    }
    renderBoard();
    toast(`Moved to "${newStatus.replace('_',' ')}"`, 'success');
  } catch(e) { toast('Update failed', 'error'); }
}

function boardShowAssignInput(id) {
  const row   = document.getElementById(`bcard-assign-row-${id}`);
  const input = document.getElementById(`bcard-assign-input-${id}`);
  if (row)   row.style.display   = 'none';
  if (input) { input.style.display = 'block'; document.getElementById(`bcard-assign-val-${id}`)?.focus(); }
}

function boardHideAssignInput(id) {
  const row   = document.getElementById(`bcard-assign-row-${id}`);
  const input = document.getElementById(`bcard-assign-input-${id}`);
  if (row)   row.style.display   = '';
  if (input) input.style.display = 'none';
}

async function boardSaveAssignee(id) {
  const val = (document.getElementById(`bcard-assign-val-${id}`)?.value || '').trim();
  if (!val) { toast('Enter a name first', 'error'); return; }

  try {
    // Auto-move to "assigned" if still at idea stage
    const c = _boardConcepts.find(x => x.id === id);
    const newStatus = (!c || c.status === 'idea') ? 'assigned' : (c?.status || 'assigned');
    await api('PUT', `/concepts/${id}`, { assigned_to: val, status: newStatus });
    if (c) { c.assigned_to = val; c.status = newStatus; }
    if (state.currentCalendarData) {
      const sc = (state.currentCalendarData.concepts || []).find(x => x.id === id);
      if (sc) { sc.assigned_to = val; sc.status = newStatus; }
    }
    renderBoard();
    toast(`Assigned to ${val}`, 'success');
  } catch(e) { toast('Failed to assign', 'error'); }
}

async function boardClearAssignee(id) {
  try {
    await api('PUT', `/concepts/${id}`, { assigned_to: '' });
    const c = _boardConcepts.find(x => x.id === id);
    if (c) c.assigned_to = '';
    if (state.currentCalendarData) {
      const sc = (state.currentCalendarData.concepts || []).find(x => x.id === id);
      if (sc) sc.assigned_to = '';
    }
    renderBoard();
  } catch(e) { toast('Failed to remove assignee', 'error'); }
}

async function boardDeleteCard(id) {
  const c = _boardConcepts.find(x => x.id === id);
  const label = c ? `"${c.hook.slice(0,40)}${c.hook.length>40?'…':''}"` : 'this card';

  // Inline confirm inside the card instead of a blocking dialog
  const card = document.getElementById(`bcard-${id}`);
  if (!card) return;

  // If confirm row already showing — do nothing (prevents double-click spam)
  if (card.querySelector('.bcard-confirm-row')) return;

  card.insertAdjacentHTML('beforeend', `
    <div class="bcard-confirm-row" style="margin-top:8px;padding:8px;border-radius:8px;background:#ef444412;border:1px solid #ef444430;">
      <div style="font-size:11px;color:#ef4444;margin-bottom:6px;font-weight:600;">
        <i class="fas fa-exclamation-triangle" style="margin-right:4px;"></i>Delete this card?
      </div>
      <div style="display:flex;gap:6px;">
        <button onclick="boardConfirmDelete('${id}')"
          style="flex:1;background:#ef4444;color:#fff;border:none;border-radius:6px;padding:5px;font-size:11px;font-weight:600;cursor:pointer;">
          Yes, Delete
        </button>
        <button onclick="this.closest('.bcard-confirm-row').remove()"
          style="flex:1;background:none;border:1px solid var(--border);border-radius:6px;padding:5px;font-size:11px;cursor:pointer;">
          Cancel
        </button>
      </div>
    </div>`);
}

async function boardConfirmDelete(id) {
  try {
    await api('DELETE', `/concepts/${id}`);
    // Remove from all caches
    _boardConcepts = _boardConcepts.filter(x => x.id !== id);
    if (state.currentCalendarData) {
      state.currentCalendarData.concepts = (state.currentCalendarData.concepts || []).filter(x => x.id !== id);
    }
    // Also remove from CG concepts grid if loaded
    delete _cgConcepts[Object.keys(_cgConcepts).find(k => _cgConcepts[k]?.id === id) || ''];
    renderBoard();
    renderCGTable();
    toast('Card deleted', 'success');
  } catch(e) { toast('Delete failed', 'error'); }
}

// ── Calendar View ─────────────────────────────────────────────────────────
function populateBoardCalendarSelects(calendars) {
  ['board-calendar-select'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="">All Calendars</option>' +
      calendars.map(c => `<option value="${c.id}">${c.month} (${c.campaign_days || 30}d)</option>`).join('');
  });
}

function populateCalendarDropdowns(calendars) {
  ['cal-select-dropdown', 'list-calendar-select'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = (id === 'list-calendar-select' ? '<option value="">All Calendars</option>' : '<option value="">Select calendar...</option>') +
      calendars.map(c => `<option value="${c.id}">${c.month} (${c.campaign_days || 30}d)</option>`).join('');
  });
  // Auto-select latest
  if (calendars.length) {
    const sel = document.getElementById('cal-select-dropdown');
    if (sel) { sel.value = calendars[0].id; loadSelectedCalendar(calendars[0].id); }
  }
}

async function loadSelectedCalendar(calId) {
  if (!calId) {
    document.getElementById('calendar-grid-container').innerHTML = '';
    document.getElementById('concept-detail-panel').style.display = 'none';
    return;
  }
  _calMonthOffset = 0; // reset to start month of this calendar
  document.getElementById('calendar-grid-container').innerHTML = '<div style="color:var(--text-muted);padding:20px;">Loading...</div>';
  try {
    const data = await api('GET', `/calendars/${calId}`);
    state.currentCalendarId = calId;
    state.currentCalendarData = data;
    renderCalendarGrid(data);
    // Sync board cache and re-render board if it's visible
    _boardConcepts = data.concepts || [];
    _boardCalId = calId;
    renderBoard();
  } catch(e) {
    toast('Failed to load calendar', 'error');
  }
}

let _calFilter = 'all'; // 'all' | 'carousel' | 'video'
let _calMonthOffset = 0; // 0 = current month of calendar, +1/-1 = next/prev

function renderCalendarGrid(data) {
  const allConcepts = data.concepts || [];
  const container   = document.getElementById('calendar-grid-container');
  if (!allConcepts.length) {
    container.innerHTML = '<div style="color:var(--text-muted);padding:20px;">No concepts in this calendar.</div>';
    return;
  }

  // Determine month range
  const dates = allConcepts.map(c => c.date).filter(Boolean).sort();
  // Use local date string to avoid UTC-midnight shift in UTC+7
  const _now = new Date();
  const _todayStr = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`;
  const calStart = dates[0] || _todayStr;
  const baseMonth = new Date(calStart + 'T00:00:00');
  baseMonth.setMonth(baseMonth.getMonth() + _calMonthOffset);
  const yr  = baseMonth.getFullYear();
  const mo  = baseMonth.getMonth();
  const monthLabel = baseMonth.toLocaleDateString('en-US', { month:'long', year:'numeric' });

  // Figure out valid month offsets (min/max) based on actual concept dates
  const allMonths = [...new Set(dates.map(d => d.slice(0,7)))].sort();

  // Filter by month
  let concepts = allConcepts.filter(c => {
    if (!c.date) return true;
    const d = new Date(c.date + 'T00:00:00');
    return d.getFullYear() === yr && d.getMonth() === mo;
  });

  // Filter by format
  if (_calFilter === 'carousel') {
    concepts = concepts.filter(c => (c.format||'').toLowerCase() === 'carousel');
  } else if (_calFilter === 'video') {
    concepts = concepts.filter(c => (c.format||'').toLowerCase() !== 'carousel');
  }

  // Build month strings with pure arithmetic — avoids toISOString() UTC-offset bug
  const prevMonth = mo === 0 ? `${yr-1}-12` : `${yr}-${String(mo).padStart(2,'0')}`;
  const nextMonth = mo === 11 ? `${yr+1}-01` : `${yr}-${String(mo+2).padStart(2,'0')}`;
  const curMonth  = `${yr}-${String(mo+1).padStart(2,'0')}`;
  const hasPrev   = allMonths.includes(prevMonth) || allMonths.some(m => m < curMonth);
  const hasNext   = allMonths.includes(nextMonth) || allMonths.some(m => m > curMonth);

  const html = `
    <div class="cal-toolbar">
      <div class="cal-month-nav">
        <button class="cal-nav-btn" onclick="_calMonthOffset--; renderCalendarGrid(state.currentCalendarData)" ${!hasPrev ? 'disabled' : ''}>
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="cal-month-label">${monthLabel}</span>
        <button class="cal-nav-btn" onclick="_calMonthOffset++; renderCalendarGrid(state.currentCalendarData)" ${!hasNext ? 'disabled' : ''}>
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <div class="cal-filter-chips">
        <button class="cal-chip ${_calFilter==='all' ? 'active' : ''}" onclick="_calFilter='all'; renderCalendarGrid(state.currentCalendarData)">All</button>
        <button class="cal-chip carousel-chip ${_calFilter==='carousel' ? 'active' : ''}" onclick="_calFilter='carousel'; renderCalendarGrid(state.currentCalendarData)">
          <i class="fas fa-layer-group"></i> Carousel
        </button>
        <button class="cal-chip video-chip ${_calFilter==='video' ? 'active' : ''}" onclick="_calFilter='video'; renderCalendarGrid(state.currentCalendarData)">
          <i class="fas fa-play"></i> Video / Reel
        </button>
      </div>
      <div class="cal-count-label">${concepts.length} post${concepts.length!==1?'s':''}</div>
    </div>
    <div class="cal-grid-wrapper">
      ${concepts.length ? `<div class="cal-grid">${concepts.map(c => renderCalCard(c)).join('')}</div>`
        : '<div style="color:var(--text-muted);padding:24px;text-align:center;">No posts match this filter for '+monthLabel+'</div>'}
    </div>
  `;
  container.innerHTML = html;
}

function renderCalCard(c) {
  const badge = getTypeBadge(c.content_type);
  const isOffer = c.content_type === 'Godfather Offer' || c.content_type === 'Flash Sale' || c.content_type === 'Bundle Deal';
  const statusColor = getStatusColor(c.status || 'idea');
  const isVerified = c.verification_status === 'verified';
  const isPending  = c.verification_status === 'pending';
  const isOverdue  = !isVerified && !isPending && !!c.is_overdue;
  const boost = c.boost_status && c.boost_status !== 'none' ? c.boost_status : '';
  const stateClass = isVerified ? 'card-done' : isPending ? 'card-pending' : isOverdue ? 'card-overdue' : '';

  let banner = '';
  if (isVerified) banner = '<div class="card-status-banner banner-done"><i class="fas fa-check-double"></i> VERIFIED DONE</div>';
  else if (isPending) banner = '<div class="card-status-banner banner-pending"><i class="fas fa-clock"></i> AWAITING VERIFICATION</div>';
  else if (isOverdue) banner = '<div class="card-status-banner banner-overdue"><i class="fas fa-exclamation-triangle"></i> OVERDUE</div>';

  const boostNotePreview = (c.boost_notes || '').slice(0, 40);
  const boostTitle = boost ? `Ad ${boost}${boostNotePreview ? ' · ' + boostNotePreview : ''}` : '';
  const boostBar = boost ? `<div class="card-boost-bar boost-bar-${boost}" title="${esc(boostTitle)}"><i class="fas fa-${boost === 'running' ? 'play-circle' : 'pause-circle'}"></i> AD ${boost.toUpperCase()}</div>` : '';

  return `
    <div class="cal-card ${isOffer ? 'godfather' : 'value-bomb'} ${stateClass}" id="calcard-${c.id}"
         onclick="showConceptDetail('${c.id}')">
      ${banner}
      <div class="cal-card-top-row">
        <div class="cal-card-day">Day ${c.day}</div>
        ${isVerified ? '<span class="card-done-badge"><i class="fas fa-check-double"></i></span>' : ''}
        ${isPending ? '<span class="card-overdue-badge" style="color:#f59e0b;"><i class="fas fa-hourglass-half"></i></span>' : ''}
        ${isOverdue ? '<span class="card-overdue-badge"><i class="fas fa-exclamation-circle"></i></span>' : ''}
      </div>
      <span class="cal-card-type ${badge.cls}">${badge.emoji} ${esc(c.content_type)}</span>
      <div class="cal-card-hook">${esc(c.hook)}</div>
      <div class="cal-card-format">${esc(c.format || 'Reel')} · ${esc(c.platform || 'Instagram')}</div>
      <div class="cal-card-status" style="background:${statusColor};" title="${c.status || 'idea'}"></div>
      ${boostBar}
    </div>
  `;
}

function showConceptDetail(conceptId) {
  _activeConceptId = conceptId;
  // Highlight selected
  document.querySelectorAll('.cal-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById('calcard-' + conceptId);
  if (card) card.classList.add('selected');

  const panel = document.getElementById('concept-detail-panel');
  const data = state.currentCalendarData;
  if (!data) return;
  const c = (data.concepts || []).find(x => x.id === conceptId);
  if (!c) return;

  const badge = getTypeBadge(c.content_type);
  const captions = c.captions || [];
  const hashtags = c.hashtags || [];
  const comments = c.comments || [];

  const isVerified2 = c.verification_status === 'verified';
  const isPending2  = c.verification_status === 'pending';
  const isOverdue2  = !isVerified2 && !isPending2 && !!c.is_overdue;

  panel.style.display = 'block';
  // ── Calendar worker panel — read-only content + actions ─────────────────
  const fmt = fmtLabel(c.format);
  const boost = c.boost_status && c.boost_status !== 'none' ? c.boost_status : '';
  const boostColor = boost === 'running' ? '#10b981' : boost === 'paused' ? '#f59e0b' : '';

  panel.innerHTML = `
    <!-- ── Header bar ── -->
    <div class="cal-worker-header">
      <div class="cal-worker-meta">
        <span class="detail-day-badge">Day ${c.day} · ${fmtDate(c.date)}</span>
        <span class="cm-format-pill" style="background:${fmt.color}18;color:${fmt.color};border-color:${fmt.color}40;font-size:12px;">
          ${fmt.icon} ${fmt.label}
        </span>
        ${c.assigned_to ? `<span style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:4px;"><i class="fas fa-user"></i> ${esc(c.assigned_to)}</span>` : ''}
        ${boost ? `<span class="cal-ad-pill cal-ad-${boost}"><i class="fas fa-${boost==='running'?'play-circle':'pause-circle'}"></i> AD ${boost.toUpperCase()}</span>` : ''}
        ${isVerified2 ? '<span class="done-tag"><i class="fas fa-check-double"></i> Done</span>' : ''}
        ${isPending2  ? '<span class="pending-tag"><i class="fas fa-hourglass-half"></i> Awaiting Approval</span>' : ''}
        ${isOverdue2  ? '<span class="overdue-tag"><i class="fas fa-exclamation-circle"></i> Overdue</span>' : ''}
      </div>
      <div class="cal-worker-actions">
        ${isVerified2
          ? `<button class="btn-done-active" onclick="unverifyConceptDone('${c.id}')"><i class="fas fa-undo"></i> Unmark</button>`
          : isPending2
          ? `<span class="btn-pending-verify"><i class="fas fa-hourglass-half"></i> Pending approval</span>
             <button class="btn-verify" onclick="verifyConceptDone('${c.id}')"><i class="fas fa-check-double"></i> Verify ✓✓</button>`
          : `<button class="btn-mark-done" onclick="submitForVerification('${c.id}')"><i class="fas fa-check"></i> Mark as Done</button>`
        }
        <button class="detail-close" onclick="closeDetailPanel()"><i class="fas fa-times"></i></button>
      </div>
    </div>

    <div class="cal-worker-body">

      <!-- ── Hook + Brief ── -->
      <div class="cal-worker-hook">${esc(c.hook)}</div>
      ${c.idea_brief ? `<div class="cal-worker-brief">${esc(c.idea_brief)}</div>` : ''}

      <!-- ── Post details row ── -->
      <div class="cal-worker-fields">
        ${c.problem  ? `<div class="cal-wf"><div class="cal-wf-label">😣 Problem</div><div class="cal-wf-val">${esc(c.problem)}</div></div>` : ''}
        ${c.solution ? `<div class="cal-wf"><div class="cal-wf-label">💡 Solution</div><div class="cal-wf-val">${esc(c.solution)}</div></div>` : ''}
        ${c.cta      ? `<div class="cal-wf"><div class="cal-wf-label">📣 CTA</div><div class="cal-wf-val">${esc(c.cta)}</div></div>` : ''}
      </div>

      <!-- ── Captions (read-only + copy) ── -->
      ${captions.length ? `
        <div class="cal-worker-section">
          <div class="cal-worker-section-title"><i class="fas fa-pen-nib"></i> Captions</div>
          ${captions.map(cap => `
            <div class="cal-caption-card">
              <div class="cal-caption-num">Caption ${cap.variation_number || ''}</div>
              <div class="cal-caption-body">${esc(cap.text)}</div>
              <button class="cal-copy-btn" onclick="copyText(this, ${JSON.stringify(cap.text)})"><i class="fas fa-copy"></i> Copy</button>
            </div>`).join('')}
        </div>` : ''}

      <!-- ── Hashtags ── -->
      ${hashtags.length ? `
        <div class="cal-worker-section">
          <div class="cal-worker-section-title"><i class="fas fa-hashtag"></i> Hashtags
            <button class="cal-copy-btn" style="margin-left:auto;" onclick="copyText(this, '${hashtags.map(h=>esc(h.tag)).join(' ')}')"><i class="fas fa-copy"></i> Copy all</button>
          </div>
          <div class="hashtags-cloud">${hashtags.map(h => `<span class="hashtag ${h.volume_level||'niche'}">${esc(h.tag)}</span>`).join('')}</div>
        </div>` : ''}

      <!-- ── Ad / Boost status ── -->
      <div class="cal-worker-section">
        <div class="cal-worker-section-title"><i class="fas fa-bolt"></i> Ad / Boost Status</div>
        <div class="boost-chips">
          <button class="boost-chip ${!c.boost_status||c.boost_status==='none'?'active-none':''}" onclick="setBoostStatus('${c.id}','none',this)">
            <i class="fas fa-ban"></i> Not Boosted
          </button>
          <button class="boost-chip ${c.boost_status==='running'?'active-running':''}" onclick="setBoostStatus('${c.id}','running',this)">
            <i class="fas fa-play-circle"></i> Running
          </button>
          <button class="boost-chip ${c.boost_status==='paused'?'active-paused':''}" onclick="setBoostStatus('${c.id}','paused',this)">
            <i class="fas fa-pause-circle"></i> Paused
          </button>
        </div>
        ${boost ? `<div style="margin-top:8px;font-size:12px;color:${boostColor};font-weight:600;display:flex;align-items:center;gap:5px;"><i class="fas fa-circle" style="font-size:8px;"></i> Ad is currently <strong>${boost}</strong></div>` : ''}
        <textarea class="boost-notes-input" style="margin-top:8px;" id="boost-notes-${c.id}"
                  placeholder="Ad notes: budget, audience, objective, results…"
                  onblur="saveBoostNotes('${c.id}')">${esc(c.boost_notes || '')}</textarea>
      </div>

      <!-- ── Comments — chat with owner ── -->
      <div class="cal-worker-section cal-comments-section">
        <div class="cal-worker-section-title"><i class="fas fa-comments"></i> Chat with Owner
          ${comments.length ? `<span style="margin-left:6px;background:var(--primary);color:#fff;padding:1px 7px;border-radius:10px;font-size:10px;font-weight:700;">${comments.length}</span>` : ''}
        </div>
        <div class="comments-section" id="comments-list-${c.id}">
          ${comments.length ? comments.map(cm => `
            <div class="comment-item" id="cmt-${cm.id}">
              <div class="comment-avatar">${(cm.author||'?')[0].toUpperCase()}</div>
              <div style="flex:1;">
                <div class="comment-author">${esc(cm.author)}</div>
                <div class="comment-text">${esc(cm.text)}</div>
                <div class="comment-time">${timeAgo(cm.created_at)}</div>
              </div>
              ${can('deleteComment') ? `<button class="comment-del-btn" title="Delete" onclick="deleteComment('${cm.id}')"><i class="fas fa-trash-alt"></i></button>` : ''}
            </div>`).join('')
          : '<div class="comments-empty">No messages yet — start the conversation</div>'}
        </div>
        <div class="add-comment-row" style="margin-top:10px;">
          <input type="text" class="form-input" id="comment-input-${c.id}"
                 placeholder="Message the owner…"
                 onkeydown="if(event.key==='Enter') addComment('${c.id}')">
          <button class="btn-primary btn-sm" onclick="addComment('${c.id}')"><i class="fas fa-paper-plane"></i> Send</button>
        </div>
      </div>

    </div>
  `;

  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Auto-render cached creative if already stored in DB (no API call needed)
  if (c.image_prompt || c.video_prompt) {
    try {
      const imgData = c.image_prompt ? (typeof c.image_prompt === 'string' ? JSON.parse(c.image_prompt) : c.image_prompt) : null;
      const vidData = c.video_prompt ? (typeof c.video_prompt === 'string' ? JSON.parse(c.video_prompt) : c.video_prompt) : null;
      if (imgData) {
        _creativeCache[`${conceptId}-image-en`] = { data: imgData, format: c.format };
        const imgEl = document.getElementById(`dt-imgprompt-content-${conceptId}`);
        if (imgEl) renderCreativeWithRegenBtn(imgEl, { data: imgData, format: c.format }, 'image', c.format, conceptId, 'dt');
      }
      if (vidData) {
        _creativeCache[`${conceptId}-video-en`] = { data: vidData, format: c.format };
        const vidEl = document.getElementById(`dt-vidprompt-content-${conceptId}`);
        if (vidEl) renderCreativeWithRegenBtn(vidEl, { data: vidData, format: c.format }, 'video', c.format, conceptId, 'dt');
      }
    } catch(e) { /* malformed JSON — leave Generate button showing */ }
  }
}

// ── Load creative prompts (Image / Video) on demand ───────────────────────────
const _creativeCache = {};
let _creativeLang = 'en';
let _activeConceptId = null;

function setCreativeLang(lang, conceptId, format, prefix) {
  if (_creativeLang === lang) return;
  _creativeLang = lang;
  // update toggle buttons
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  // clear both caches for this concept and regenerate
  delete _creativeCache[`${conceptId}-image-${lang === 'en' ? 'th' : 'en'}`];
  delete _creativeCache[`${conceptId}-video-${lang === 'en' ? 'th' : 'en'}`];
  delete _creativeCache[`${conceptId}-image-${lang}`];
  delete _creativeCache[`${conceptId}-video-${lang}`];
  api('POST', `/concepts/${conceptId}/regenerate-creative`, {});
  // re-trigger whichever tab is active
  const activeTab = document.querySelector('.detail-tab.active');
  if (activeTab) {
    const text = activeTab.textContent.toLowerCase();
    const type = text.includes('image') ? 'image' : text.includes('video') ? 'video' : null;
    if (type) triggerCreative(conceptId, format, type, prefix);
  }
}

async function triggerCreative(conceptId, format, type, prefix) {
  const key      = type === 'image' ? 'imgprompt' : 'vidprompt';
  const btnId    = `${prefix}-${type === 'image' ? 'img' : 'vid'}btn-${conceptId}`;
  const targetId = `${prefix}-${key}-content-${conceptId}`;
  const el       = document.getElementById(targetId);
  const btn      = document.getElementById(btnId);
  if (!el) return;

  const cacheKey = `${conceptId}-${type}-${_creativeLang}`;
  if (_creativeCache[cacheKey]) {
    renderCreativeWithRegenBtn(el, _creativeCache[cacheKey], type, format, conceptId, prefix);
    return;
  }

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating…'; }
  try {
    const data = await api('GET', `/concepts/${conceptId}/creative?lang=${_creativeLang}`);

    // Competitor reverse-engineer slot: show placeholder, no generation
    if (data.competitor_slot) {
      el.innerHTML = `
        <div class="competitor-slot-empty">
          <i class="fas fa-search"></i>
          <div class="cse-title">🔍 Competitor Research Slot</div>
          <div class="cse-desc">This day is reserved for manually reverse-engineering a competitor. Study their top posts, hooks, and engagement — then create your own inspired version.</div>
          <div class="cse-steps">
            <span>1. Visit a competitor's profile on Instagram/TikTok</span>
            <span>2. Find their top 3 posts from this week</span>
            <span>3. Note the hook, format, caption style + engagement rate</span>
            <span>4. Create your own version with your brand's unique angle</span>
          </div>
        </div>`;
      if (btn) { btn.disabled = false; btn.style.display = 'none'; }
      return;
    }

    const imgData = typeof data.image_prompt === 'string' ? JSON.parse(data.image_prompt) : data.image_prompt;
    const vidData = typeof data.video_prompt === 'string' ? JSON.parse(data.video_prompt) : data.video_prompt;
    _creativeCache[`${conceptId}-image-${_creativeLang}`] = { data: imgData, format };
    _creativeCache[`${conceptId}-video-${_creativeLang}`] = { data: vidData, format };
    renderCreativeWithRegenBtn(el, _creativeCache[cacheKey], type, format, conceptId, prefix);
  } catch(e) {
    if (btn) { btn.disabled = false; btn.innerHTML = type === 'image' ? '<i class="fas fa-magic"></i> Generate Canva Instructions' : '<i class="fas fa-robot"></i> Generate HeyGen Script'; }
    el.innerHTML = `<div style="text-align:center;padding:16px;color:#ef4444;"><i class="fas fa-times-circle"></i> ${esc(e.message)}</div>`;
  }
}

async function regenCreative(conceptId, format, type, prefix) {
  delete _creativeCache[`${conceptId}-image-${_creativeLang}`];
  delete _creativeCache[`${conceptId}-video-${_creativeLang}`];
  await api('POST', `/concepts/${conceptId}/regenerate-creative`, {});
  await triggerCreative(conceptId, format, type, prefix);
}

function copyText(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    btn.style.background = '#10b981';
    btn.style.color = '#fff';
    setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; btn.style.color = ''; }, 1500);
  }).catch(() => toast('Copy failed — select text manually', 'error'));
}

// Safe copy via global brief registry (avoids inline string escaping issues)
window._briefTexts = window._briefTexts || {};
function copyBrief(btn, key) {
  const text = window._briefTexts[key] || '';
  if (!text) { toast('Nothing to copy yet', 'error'); return; }
  copyText(btn, text);
}
// Safe copy via data-copy attribute on parent element
function copyFromData(btn) {
  const container = btn.closest('[data-copy]');
  const text = container ? container.getAttribute('data-copy') : '';
  copyText(btn, text);
}

function buildCopyAll(d, format) {
  const isCarousel = /carousel/i.test(format || '');
  const lines = [];
  if (isCarousel && d.slides) {
    lines.push('── CAROUSEL BRIEF (5 Cards) ──');
    if (d.color_theme)  lines.push('Colors: ' + d.color_theme);
    if (d.font_pairing) lines.push('Fonts: '  + d.font_pairing);
    d.slides.forEach(s => {
      const num = s.card || s.slide || '';
      lines.push('');
      lines.push('CARD ' + num + ' — ' + (s.type || '').toUpperCase());
      if (s.headline)    lines.push('  Headline: ' + s.headline);
      if (s.subheadline) lines.push('  Subheadline: ' + s.subheadline);
      if (s.body)        lines.push('  Body: ' + s.body);
      if (s.cta)         lines.push('  CTA Button: ' + s.cta);
      if (s.bg_prompt)   lines.push('  Background (Canva AI): ' + s.bg_prompt);
    });
  } else if (d.offer_title) {
    lines.push('── CANVA DESIGN BRIEF ──');
    lines.push('');
    lines.push('STEP 1 — BACKGROUND (paste into Canva AI → Generate image):');
    lines.push(d.canva_bg_prompt || d.canva_ai_prompt || '');
    lines.push('');
    lines.push('STEP 2 — TEXT LAYERS (add each in Canva using "Add text"):');
    if (d.offer_title) lines.push('H1 HEADLINE: ' + d.offer_title);
    (d.benefits || []).forEach(b => {
      lines.push((b.emoji || '•') + ' ' + (b.text || ''));
    });
    if (d.cta_text) lines.push('CTA BUTTON: ' + d.cta_text);
  }
  return lines.join('\n');
}

function renderCreativeWithRegenBtn(el, creative, type, format, conceptId, prefix) {
  renderCreative(el, creative, type, format);
  // Footer row: saved badge + regenerate button
  const footer = document.createElement('div');
  footer.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:8px;border-top:1px solid var(--border);';
  footer.innerHTML = `<span style="font-size:11px;color:#10b981;display:flex;align-items:center;gap:4px;"><i class="fas fa-check-circle"></i> Saved to database</span>`;
  const regenBtn = document.createElement('button');
  regenBtn.className = 'btn-regen-creative';
  regenBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Regenerate';
  regenBtn.onclick = () => regenCreative(conceptId, format, type, prefix);
  footer.appendChild(regenBtn);
  el.appendChild(footer);
}

// ── Creative Chat — send a modification request ────────────────────────────
async function sendCreativeChatMsg(conceptId, type, format, prefix) {
  const chatKey    = `${conceptId}-${type}`;
  const input      = document.getElementById(`chat-input-${chatKey}`);
  const messagesEl = document.getElementById(`chat-msgs-${chatKey}`);
  if (!input || !messagesEl) return;

  const msg = input.value.trim();
  if (!msg) { input.focus(); return; }
  input.value = '';

  // User bubble
  messagesEl.insertAdjacentHTML('beforeend', `
    <div class="chat-msg user-msg">
      <div class="chat-bubble user-bubble">${esc(msg)}</div>
      <div class="chat-avatar user-avatar"><i class="fas fa-user"></i></div>
    </div>`);

  // Loading bubble
  const loadId = `cload-${Date.now()}`;
  messagesEl.insertAdjacentHTML('beforeend', `
    <div class="chat-msg ai-msg" id="${loadId}">
      <div class="chat-avatar"><i class="fas fa-robot"></i></div>
      <div class="chat-bubble"><i class="fas fa-spinner fa-spin"></i> Updating brief…</div>
    </div>`);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  // Update history
  window._chatHistory = window._chatHistory || {};
  window._chatHistory[chatKey] = window._chatHistory[chatKey] || [];
  window._chatHistory[chatKey].push({ role: 'user', content: msg });

  try {
    const ctx = (window._chatContent || {})[chatKey] || {};
    const res  = await api('POST', `/concepts/${conceptId}/creative-chat`, {
      message:         msg,
      current_content: ctx.data || {},
      content_type:    type,
      format:          format,
      history:         window._chatHistory[chatKey].slice(-8)
    });

    const loadEl = document.getElementById(loadId);

    if (res.type === 'update' && res.content) {
      // Re-render content with updated data
      const updated = { data: res.content, format };
      window._chatContent[chatKey] = { data: res.content, type, format };
      _creativeCache[`${conceptId}-${type}-${_creativeLang}`] = updated;

      const tmp = document.createElement('div');
      tmp.id = `${prefix}-${type === 'image' ? 'imgprompt' : 'vidprompt'}-content-${conceptId}`;
      renderCreative(tmp, updated, type, format);

      if (loadEl) loadEl.outerHTML = `
        <div class="chat-msg ai-msg">
          <div class="chat-avatar"><i class="fas fa-robot"></i></div>
          <div class="chat-bubble">
            <div class="chat-bubble-intro">${esc(res.message || 'Updated!')} ✨</div>
            ${tmp.innerHTML}
          </div>
        </div>`;

      window._chatHistory[chatKey].push({ role: 'assistant', content: res.message || 'Updated.' });

    } else {
      // Plain text reply
      const text = res.message || res.error || 'Done!';
      if (loadEl) loadEl.outerHTML = `
        <div class="chat-msg ai-msg">
          <div class="chat-avatar"><i class="fas fa-robot"></i></div>
          <div class="chat-bubble chat-text-reply">${esc(text)}</div>
        </div>`;
      window._chatHistory[chatKey].push({ role: 'assistant', content: text });
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
    input.focus();

  } catch(e) {
    const loadEl = document.getElementById(loadId);
    if (loadEl) loadEl.outerHTML = `
      <div class="chat-msg ai-msg">
        <div class="chat-avatar"><i class="fas fa-robot"></i></div>
        <div class="chat-bubble" style="color:#ef4444;"><i class="fas fa-times-circle"></i> ${esc(e.message)}</div>
      </div>`;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}

async function loadCreative(conceptId, format, type, context) {
  const prefix = context === 'modal' ? 'cm' : 'dt';
  triggerCreative(conceptId, format, type, prefix);
}

function renderCreative(el, creative, type, format) {
  if (!creative) { el.innerHTML = '<div class="creative-loading">No data.</div>'; return; }
  const d = creative.data || creative;
  if (!d || d.raw) {
    el.innerHTML = `<div class="creative-note" style="color:#ef4444;padding:12px;"><i class="fas fa-exclamation-triangle"></i> AI response could not be parsed. Click Regenerate to try again.</div>`;
    return;
  }

  // Detect schema version by key presence
  const isCarouselFormat = /carousel/i.test(format || '');
  const hasNewImgSchema  = !!(d.offer_title || d.slides || d.h1 || d.canva_bg_prompt);
  const hasOldImgSchema  = !!(d.thumbnail_prompt || d.key_frames);
  const hasNewVidSchema  = !!(d.avatar || d.scenes);
  const hasOldVidSchema  = !!(d.heygen_avatar_style || d.scene_breakdown);

  if (type === 'image') {
    // ── Carousel 5-card brief ──────────────────────────────────────────────
    if (d.slides && d.slides.length) {
      const cardsHtml = d.slides.map(s => {
        const num      = s.card || s.slide || '';
        const heading  = s.headline || s.title || '';
        const subhead  = s.subheadline || '';
        const body     = s.body || s.subtitle || '';
        const cta      = s.cta || '';
        const bgPrompt = s.bg_prompt || '';
        const q = t => t.replace(/'/g,"&#39;");
        const row = (label, text, extraClass) => text ? `
          <div class="canva-copy-row${extraClass ? ' ' + extraClass : ''}">
            <span class="canva-copy-label">${label}</span>
            <span class="canva-copy-text">${esc(text)}</span>
            <button class="copy-btn" onclick="copyText(this,'${q(esc(text))}')"><i class="fas fa-copy"></i></button>
          </div>` : '';
        return `
          <div class="canva-card-block">
            <div class="canva-card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <span class="canva-card-num">${s.emoji ? s.emoji + ' ' : ''}Card ${num} — ${esc(s.type || '')}</span>
            </div>
            <div class="canva-card-copy">
              ${row('H1', heading, 'canva-headline-row')}
              ${row('Sub', subhead, '')}
              ${row('Body', body, '')}
              ${row('CTA', cta, 'canva-cta-row')}
              ${bgPrompt ? `
              <div class="canva-copy-row canva-bg-row">
                <span class="canva-copy-label" style="white-space:nowrap;"><i class="fas fa-robot"></i> BG</span>
                <span class="canva-copy-text" style="font-size:11px;color:#0369a1;">${esc(bgPrompt)}</span>
                <button class="copy-btn" onclick="copyText(this,'${q(esc(bgPrompt))}')"><i class="fas fa-copy"></i></button>
              </div>` : ''}
            </div>
          </div>`;
      }).join('');
      const copyAllText = buildCopyAll(d, format);
      const copyAllEsc  = copyAllText.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n');
      el.innerHTML = `
        <div class="creative-section">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
            <div class="creative-chip canva-chip" style="margin:0;"><i class="fas fa-layer-group"></i> 5-Card Carousel — Exact Text for Canva</div>
            <button class="copy-all-btn" onclick="copyText(this,'${copyAllEsc}')"><i class="fas fa-clipboard"></i> Copy Complete Brief</button>
          </div>
          <div class="canva-meta-row">
            ${d.color_theme  ? `<span><i class="fas fa-palette"></i> <strong>Colors:</strong> ${esc(d.color_theme)}</span>` : ''}
            ${d.font_pairing ? `<span><i class="fas fa-font"></i> <strong>Fonts:</strong> ${esc(d.font_pairing)}</span>` : ''}
          </div>
          <div class="canva-fields-guide">
            <i class="fas fa-info-circle"></i> In Canva — click <strong>"Add text"</strong>, then paste each field below exactly as shown
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">${cardsHtml}</div>
        </div>`;

    // ── Reel: single combined prompt block ────────────────────────────────
    } else if (hasNewImgSchema) {
      const bg      = d.canva_bg_prompt || d.canva_ai_prompt || d.scene || '';
      const h1      = d.h1      || d.offer_title || '';
      const h2      = d.h2      || '';
      const problem = d.problem || '';
      const solution= d.solution|| '';
      const offer   = d.offer   || '';
      const tips    = d.tips    || [];
      const cta     = d.cta     || d.cta_text || '';

      const lines = [];
      if (bg)       { lines.push('[BACKGROUND IMAGE — paste into Canva AI]'); lines.push(bg); lines.push(''); }
      if (h1)       { lines.push('[H1 HEADLINE]'); lines.push(h1); lines.push(''); }
      if (h2)       { lines.push('[H2 SUBHEADLINE]'); lines.push(h2); lines.push(''); }
      if (problem)  { lines.push('[PROBLEM]'); lines.push(problem); lines.push(''); }
      if (solution) { lines.push('[SOLUTION]'); lines.push(solution); lines.push(''); }
      if (offer)    { lines.push('[IRRESISTIBLE OFFER]'); lines.push(offer); lines.push(''); }
      tips.forEach(t => {
        lines.push(`[TIP ${t.number || ''} — ${t.title || ''}]`);
        lines.push(t.body || '');
        lines.push('');
      });
      if (cta)      { lines.push('[CTA BUTTON]'); lines.push(cta); }

      const combined = lines.join('\n');

      el.innerHTML = `
        <div class="prompt-block" data-copy="${esc(combined)}">
          <pre class="prompt-text">${esc(combined)}</pre>
          <button class="prompt-copy-btn" onclick="copyFromData(this)"><i class="fas fa-copy"></i> Copy</button>
        </div>`;

    // ── Old schema fallback ────────────────────────────────────────────────
    } else if (hasOldImgSchema) {
      const framesHtml = (d.key_frames || []).map(f => `
        <div class="slide-row">
          <div class="slide-num">${esc(f.timestamp || '')}</div>
          <div class="slide-content"><div class="slide-heading">${esc(f.description || JSON.stringify(f))}</div></div>
        </div>`).join('');
      const palette = (d.color_palette || []).map(c =>
        `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${esc(c)};vertical-align:middle;margin:0 2px;"></span><code>${esc(c)}</code>`
      ).join(' ');
      el.innerHTML = `
        <div class="creative-section">
          <div class="creative-chip canva-chip"><i class="fas fa-image"></i> Canva Visual Brief</div>
          ${d.thumbnail_prompt ? `<div class="creative-offer-title">${esc(d.thumbnail_prompt)}</div>` : ''}
          ${d.text_overlay     ? `<div class="creative-note"><i class="fas fa-font"></i> Text overlay: <strong>${esc(d.text_overlay)}</strong></div>` : ''}
          ${palette            ? `<div class="creative-note"><i class="fas fa-palette"></i> Colors: ${palette}</div>` : ''}
          ${framesHtml         ? `<div class="slides-list" style="margin-top:8px;">${framesHtml}</div>` : ''}
          <div class="creative-note" style="color:#f59e0b;margin-top:8px;"><i class="fas fa-sync-alt"></i> Old format — click Regenerate for the updated layout</div>
        </div>`;

    } else {
      el.innerHTML = `<div class="creative-note" style="color:#ef4444;padding:12px;"><i class="fas fa-exclamation-triangle"></i> No displayable data. Try Regenerate.</div>`;
    }

  } else {
    // ── Video: new schema (avatar + scenes) ───────────────────────────────
    if (hasNewVidSchema) {
      const fullScript = d.full_script || (d.scenes || []).map(s => s.script).filter(Boolean).join(' ');
      const vidLines = [];
      if (d.avatar)   { vidLines.push('[AVATAR]'); vidLines.push(d.avatar); vidLines.push(''); }
      if (fullScript) { vidLines.push('[FULL SCRIPT]'); vidLines.push(fullScript); vidLines.push(''); }
      (d.scenes || []).forEach(s => {
        vidLines.push(`[SCENE ${s.scene || ''} — ${s.timestamps || ''}]`);
        vidLines.push(s.script || '');
        if (s.on_screen_text) vidLines.push(`On screen: ${s.on_screen_text}`);
        vidLines.push('');
      });
      if (d.music_style)   { vidLines.push('[MUSIC]'); vidLines.push(d.music_style); }
      if (d.caption_style) { vidLines.push('[CAPTIONS]'); vidLines.push(d.caption_style); }
      const combined = vidLines.join('\n');
      el.innerHTML = `
        <div class="prompt-block" data-copy="${esc(combined)}">
          <pre class="prompt-text">${esc(combined)}</pre>
          <button class="prompt-copy-btn" onclick="copyFromData(this)">
            <i class="fas fa-copy"></i> Copy
          </button>
        </div>`;

    // ── Video: old schema fallback ─────────────────────────────────────────
    } else if (hasOldVidSchema) {
      const scenesHtml = (d.scene_breakdown || []).map(s => `
        <div class="slide-row">
          <div class="slide-num">${esc(s.duration || ('Scene ' + s.scene))}</div>
          <div class="slide-content">
            <div class="slide-heading">${esc(s.script || '')}</div>
            ${s.visual_cue ? `<div class="slide-visual"><i class="fas fa-eye"></i> ${esc(s.visual_cue)}</div>` : ''}
          </div>
        </div>`).join('');
      el.innerHTML = `
        <div class="creative-section">
          <div class="creative-chip heygen-chip"><i class="fas fa-robot"></i> HeyGen Video Script</div>
          ${d.hook_line          ? `<div class="script-hook"><strong>Hook (0-3s):</strong> "${esc(d.hook_line)}"</div>` : ''}
          ${d.heygen_avatar_style? `<div class="heygen-avatar"><i class="fas fa-user-circle"></i> <strong>Avatar:</strong> ${esc(d.heygen_avatar_style)}</div>` : ''}
          ${scenesHtml           ? `<div class="slides-list">${scenesHtml}</div>` : (d.voiceover_script ? `<div class="script-full">${esc(d.voiceover_script).replace(/\n/g,'<br>')}</div>` : '')}
          ${d.cta_line           ? `<div class="script-hook" style="margin-top:8px;"><strong>CTA:</strong> "${esc(d.cta_line)}"</div>` : ''}
          ${d.background_music   ? `<div class="creative-note"><i class="fas fa-music"></i> Music: ${esc(d.background_music)}</div>` : ''}
          <div class="creative-note" style="color:#f59e0b;margin-top:8px;"><i class="fas fa-sync-alt"></i> Old format — click Regenerate for the updated layout</div>
        </div>`;

    } else {
      el.innerHTML = `<div class="creative-note" style="color:#ef4444;padding:12px;"><i class="fas fa-exclamation-triangle"></i> No displayable data. Try Regenerate.</div>`;
    }
  }
}

function switchDetailTab(btn, panelId) {
  const body = btn.closest('.detail-body');
  body.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
  body.querySelectorAll('.detail-tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const p = document.getElementById(panelId);
  if (p) p.classList.add('active');
}

function closeDetailPanel() {
  document.getElementById('concept-detail-panel').style.display = 'none';
  document.querySelectorAll('.cal-card').forEach(c => c.classList.remove('selected'));
}

async function submitForVerification(id) {
  await api('PUT', `/concepts/${id}`, { verification_status: 'pending' });
  if (state.currentCalendarData) {
    const c = (state.currentCalendarData.concepts || []).find(x => x.id === id);
    if (c) { c.verification_status = 'pending'; renderCalendarGrid(state.currentCalendarData); showConceptDetail(id); }
  }
  toast('Submitted for verification — awaiting owner approval', 'success');
}

async function verifyConceptDone(id) {
  const res = await api('POST', `/concepts/${id}/verify`, {});
  if (state.currentCalendarData) {
    const c = (state.currentCalendarData.concepts || []).find(x => x.id === id);
    if (c) {
      c.finished_at = res.finished_at; c.is_overdue = 0;
      c.verification_status = 'verified';
      renderCalendarGrid(state.currentCalendarData); showConceptDetail(id);
    }
  }
  toast('Verified and marked done! ✓✓', 'success');
}

async function unverifyConceptDone(id) {
  await api('PUT', `/concepts/${id}`, { finished_at: null, is_overdue: 0, verification_status: null });
  if (state.currentCalendarData) {
    const c = (state.currentCalendarData.concepts || []).find(x => x.id === id);
    if (c) { c.finished_at = null; c.verification_status = null; renderCalendarGrid(state.currentCalendarData); showConceptDetail(id); }
  }
  toast('Unmarked — back to pending', '');
}

async function regenerateIdea(id) {
  const btn  = document.getElementById('regen-btn-' + id);
  const text = document.getElementById('idea-brief-text-' + id);
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating…'; }
  if (text) text.style.opacity = '0.4';
  try {
    const res = await api('POST', `/concepts/${id}/regenerate`, {});
    if (text) { text.textContent = res.idea_brief; text.style.opacity = '1'; }
    // update local state
    if (state.currentCalendarData) {
      const c = (state.currentCalendarData.concepts || []).find(x => x.id === id);
      if (c) { c.idea_brief = res.idea_brief; c.image_prompt = null; c.video_prompt = null; }
    }
    // clear creative cache (all lang variants) so image/video prompts re-generate with new brief
    ['en','th'].forEach(lang => {
      delete _creativeCache[`${id}-image-${lang}`];
      delete _creativeCache[`${id}-video-${lang}`];
    });
    toast('Idea regenerated!', 'success');
  } catch(e) {
    if (text) text.style.opacity = '1';
    toast('Regeneration failed: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sync-alt"></i> Regenerate'; }
  }
}

async function setBoostStatus(id, status, btn) {
  await api('PUT', `/concepts/${id}`, { boost_status: status });
  // Update local state
  if (state.currentCalendarData) {
    const c = (state.currentCalendarData.concepts || []).find(x => x.id === id);
    if (c) {
      c.boost_status = status;
      renderCalendarGrid(state.currentCalendarData);
      showConceptDetail(id);
    }
  }
  const labels = { none:'Not Boosted', running:'Ad Running', paused:'Ad Paused' };
  toast(labels[status] || status, status === 'running' ? 'success' : '');
}

async function saveBoostNotes(id) {
  const notes = (document.getElementById('boost-notes-' + id) || {}).value || '';
  await api('PUT', `/concepts/${id}`, { boost_notes: notes });
}

async function updateConceptStatus(id, status) {
  await api('PUT', `/concepts/${id}`, { status });
  // Sync all state stores
  if (state.currentCalendarData) {
    const c = (state.currentCalendarData.concepts || []).find(x => x.id === id);
    if (c) { c.status = status; renderCalendarGrid(state.currentCalendarData); }
  }
  const bc = _boardConcepts.find(x => x.id === id);
  if (bc) { bc.status = status; renderBoard(); }
  // Update status badge in the open modal if still visible
  const badge = document.querySelector(`#concept-modal-content .status-badge`);
  if (badge) badge.innerHTML = `<span class="status-dot"></span>${status.replace('_',' ')}`;
  toast(`Moved to "${status.replace('_', ' ')}"`, 'success');
}

// assignConcept — inputId is the actual element ID of the assign input (passed from onclick)
async function assignConcept(id, name, taskType, inputId) {
  const trimmed = (name || '').trim();
  if (!trimmed) { toast('Enter a name or email to assign', 'error'); return; }
  // Auto-move to "assigned" status if still at idea stage
  const curConcept = (state.currentCalendarData?.concepts || []).find(x => x.id === id)
                  || _boardConcepts.find(x => x.id === id);
  const newStatus = (!curConcept || curConcept.status === 'idea') ? 'assigned' : (curConcept?.status || 'assigned');
  await api('PUT', `/concepts/${id}`, { assigned_to: trimmed, status: newStatus });
  // Update all state stores
  if (state.currentCalendarData) {
    const c = (state.currentCalendarData.concepts || []).find(x => x.id === id);
    if (c) { c.assigned_to = trimmed; c.status = newStatus; }
  }
  const bc = _boardConcepts.find(x => x.id === id);
  if (bc) { bc.assigned_to = trimmed; bc.status = newStatus; renderBoard(); }
  // Show inline confirmation — find the input by explicit ID, or try all known patterns
  const input = (inputId && document.getElementById(inputId))
             || document.getElementById(`cm-assign-img-${id}`)
             || document.getElementById(`cm-assign-vid-${id}`)
             || document.getElementById(`dt-assign-img-${id}`)
             || document.getElementById(`dt-assign-vid-${id}`);
  if (input) {
    // Remove any previous feedback
    const prevFb = document.getElementById(`assign-fb-${id}`);
    if (prevFb) prevFb.remove();
    const taskLabel = taskType === 'image' ? 'Canva design' : 'HeyGen video';
    const wrapper = input.closest('.assign-input-wrap') || input.parentElement;
    wrapper.insertAdjacentHTML('afterend', `
      <div style="font-size:11px;color:#10b981;margin-top:6px;display:flex;align-items:center;gap:5px;" id="assign-fb-${id}">
        <i class="fas fa-check-circle"></i>
        <span>Saved — <strong>${esc(trimmed)}</strong> assigned to ${taskLabel} for this post</span>
      </div>`);
  }
  toast(`Assigned to ${trimmed}`, 'success');
}

// ── Assign input autosuggest ──────────────────────────────────────────────
let _assignSuggestActive = null; // { ddId, inputEl }
async function assignSuggest(inputEl, conceptId) {
  const q  = inputEl.value.trim();
  const dd = document.getElementById('assign-dd-' + conceptId);
  if (!dd) return;
  if (q.length < 1) { dd.style.display = 'none'; return; }
  try {
    const members = await api('GET', '/team/suggest?q=' + encodeURIComponent(q));
    if (!members.length) { dd.style.display = 'none'; return; }
    _assignSuggestActive = { ddId: 'assign-dd-' + conceptId, inputEl };
    dd.innerHTML = members.map(m => `
      <div class="assign-suggest-item"
           onmousedown="pickAssignSuggest(event,'assign-dd-${conceptId}','${esc((m.name||'').replace(/'/g,"&#39;"))}','${esc((m.email||'').replace(/'/g,"&#39;"))}')">
        <div class="assign-avatar">${(m.name||'?')[0].toUpperCase()}</div>
        <div>
          <div class="assign-sug-name">${esc(m.name)}</div>
          <div class="assign-sug-email">${esc(m.email)}${m.role ? ' · ' + esc(m.role) : ''}</div>
        </div>
      </div>
    `).join('');
    dd.style.display = '';
  } catch(e) { dd.style.display = 'none'; }
}
function pickAssignSuggest(e, ddId, name, email) {
  e.preventDefault(); // prevent blur firing before mousedown
  const dd = document.getElementById(ddId);
  if (dd) dd.style.display = 'none';
  // Fill whichever assign input is in the same dropdown container
  const wrap = dd && dd.closest('.assign-input-wrap');
  const inp  = wrap && wrap.querySelector('input.form-input');
  if (inp) inp.value = name + (email ? ' <' + email + '>' : '');
}
function closeAssignSuggest(conceptId) {
  const dd = document.getElementById('assign-dd-' + conceptId);
  if (dd) setTimeout(() => { dd.style.display = 'none'; }, 150);
}

async function addComment(conceptId) {
  const input = document.getElementById('comment-input-' + conceptId);
  const text = input.value.trim();
  if (!text) return;
  await api('POST', `/concepts/${conceptId}/comments`, { author: 'You', text });
  input.value = '';
  const list = document.getElementById('comments-list-' + conceptId);
  const item = document.createElement('div');
  item.className = 'comment-item';
  item.innerHTML = `
    <div class="comment-avatar">Y</div>
    <div>
      <div class="comment-author">You</div>
      <div class="comment-text">${esc(text)}</div>
      <div class="comment-time">Just now</div>
    </div>`;
  const empty = list.querySelector('.comments-empty');
  if (empty) empty.remove();
  list.appendChild(item);
  toast('Comment added', 'success');
}

async function deleteComment(cmtId) {
  if (!can('deleteComment')) { toast('Only admins can delete comments', 'error'); return; }
  if (!confirm('Delete this comment?')) return;
  try {
    await api('DELETE', `/comments/${cmtId}`);
    const el = document.getElementById(`cmt-${cmtId}`);
    if (el) el.remove();
    toast('Comment deleted', 'success');
  } catch(e) { toast('Could not delete comment', 'error'); }
}

// ── User Management (admin only) ──────────────────────────────────────────
async function openUserManager() {
  if (!can('manageUsers')) { toast('Admin only', 'error'); return; }
  const users = await api('GET', '/users');
  const modal = document.getElementById('user-mgr-modal');
  if (!modal) return;
  document.getElementById('user-mgr-list').innerHTML = users.map(u => {
    const rm = roleMeta(u.role || 'worker');
    return `
    <div class="umgr-row" id="umgr-${u.id}">
      <div class="umgr-avatar" style="background:${rm.color}">${(u.name||u.email||'?')[0].toUpperCase()}</div>
      <div class="umgr-info">
        <div class="umgr-name">${esc(u.name || u.email)}</div>
        <div class="umgr-email">${esc(u.email)}</div>
      </div>
      <select class="umgr-role-select select-sm" onchange="changeUserRole('${u.id}', this.value)">
        ${['admin','manager','executive','worker'].map(r =>
          `<option value="${r}" ${u.role===r?'selected':''}>${roleMeta(r).icon} ${roleMeta(r).label}</option>`
        ).join('')}
      </select>
    </div>`;
  }).join('');
  modal.classList.add('open');
}

function closeUserManager() {
  const m = document.getElementById('user-mgr-modal');
  if (m) m.classList.remove('open');
}

async function changeUserRole(uid, newRole) {
  try {
    await api('PATCH', `/users/${uid}/role`, { role: newRole });
    toast(`Role updated to ${roleMeta(newRole).label}`, 'success');
    // Re-apply document role gates if self
    if (state.currentUser && state.currentUser.id === uid) {
      state.currentUser.role = newRole;
      applyRoleToDocument(newRole);
    }
  } catch(e) { toast('Could not update role', 'error'); }
}

// ── Invite Team Member (admin + manager) ─────────────────────────────────
function openInviteModal() {
  if (!can('invite')) { toast('Admin or Manager access required', 'error'); return; }
  const modal = document.getElementById('invite-modal');
  if (modal) {
    document.getElementById('inv-name').value = '';
    document.getElementById('inv-phone').value = '';
    document.getElementById('inv-email').value = '';
    document.getElementById('inv-role').value = myRole() === 'admin' ? 'worker' : 'worker';
    document.getElementById('inv-result').innerHTML = '';
    modal.classList.add('open');
  }
}

function closeInviteModal() {
  const m = document.getElementById('invite-modal');
  if (m) m.classList.remove('open');
}

async function sendInvite() {
  const name   = document.getElementById('inv-name').value.trim();
  const phone  = document.getElementById('inv-phone').value.trim();
  const email  = document.getElementById('inv-email').value.trim();
  const role   = document.getElementById('inv-role').value;
  if (!name) { toast('Enter a name', 'error'); return; }
  if (!phone && !email) { toast('Enter a phone or email', 'error'); return; }
  const resultEl = document.getElementById('inv-result');
  resultEl.innerHTML = '<span style="color:var(--text-secondary);font-size:12px;">Sending…</span>';
  try {
    const res = await api('POST', '/invite', {
      name, phone, email, app_role: role,
      client_id: state.currentProjectId || ''
    });
    const url = res.invite_url || '';
    const via = res.sent_via ? ` — sent via ${res.sent_via}` : '';
    resultEl.innerHTML = `
      <div style="background:var(--primary)10;border:1px solid var(--primary)33;border-radius:8px;padding:10px 12px;margin-top:10px;">
        <div style="font-size:11px;font-weight:700;color:var(--primary);margin-bottom:4px;">
          <i class="fas fa-check-circle"></i> Invite created${via}
        </div>
        <div style="font-size:12px;color:var(--text);word-break:break-all;">${url}</div>
        <button class="btn-secondary btn-sm" style="margin-top:6px;"
          onclick="navigator.clipboard.writeText('${url}').then(()=>toast('Link copied','success'))">
          <i class="fas fa-copy"></i> Copy Link
        </button>
      </div>`;
    toast('Invite created!', 'success');
  } catch(e) {
    resultEl.innerHTML = `<div style="color:#ef4444;font-size:12px;margin-top:6px;">Failed: ${e.message||'error'}</div>`;
  }
}

// ── Concept Modal (from Board / List) ─────────────────────────────────────
async function openConceptModal(conceptId) {
  if (!state.currentCalendarData) return;
  const c = (state.currentCalendarData.concepts || []).find(x => x.id === conceptId);
  if (!c) return;

  const badge = getTypeBadge(c.content_type);
  const captions = c.captions || [];
  const hashtags = c.hashtags || [];
  const comments = c.comments || [];

  document.getElementById('concept-modal-content').innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;gap:12px;">
      <div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
          <span class="status-badge s-${c.status || 'idea'}"><span class="status-dot"></span>${esc((c.status || 'idea').replace('_',' '))}</span>
          <span class="detail-type-badge ${badge.cls}">${badge.emoji} ${esc(c.content_type)}</span>
          <span style="font-size:12px;color:var(--text-muted);">Day ${c.day} · ${fmtDate(c.date)}</span>
        </div>
        <h2 style="font-size:17px;font-weight:700;line-height:1.3;">${esc(c.hook)}</h2>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-shrink:0;">
        <select class="status-select" onchange="updateConceptStatus('${c.id}', this.value)">
          ${['idea','assigned','in_progress','submitted','approved','published'].map(s =>
            `<option value="${s}" ${c.status === s ? 'selected' : ''}>${s.replace('_',' ')}</option>`
          ).join('')}
        </select>
        <button class="btn-wa-share" onclick="openWhatsAppModal('${c.id}')" title="Send to WhatsApp">
          <i class="fab fa-whatsapp"></i>
        </button>
        <button class="btn-timer-start-concept" onclick="startTimerForConcept('${c.id}','${esc(c.hook).replace(/'/g,"\\'")}')" title="Start timer for this task">
          <i class="fas fa-stopwatch"></i>
        </button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
      <div class="concept-field">
        <div class="concept-field-label">😣 Problem</div>
        <div class="concept-field-value">${esc(c.problem || '—')}</div>
      </div>
      <div class="concept-field">
        <div class="concept-field-label">💡 Solution</div>
        <div class="concept-field-value">${esc(c.solution || '—')}</div>
      </div>
      <div class="concept-field">
        <div class="concept-field-label">📣 CTA</div>
        <div class="concept-field-value">${esc(c.cta || '—')}</div>
      </div>
      <div class="concept-field">
        <div class="concept-field-label">📱 Format</div>
        <div class="concept-field-value">${esc(c.format || 'Reel')} on ${esc(c.platform || 'Instagram')}</div>
      </div>
    </div>

    ${(() => {
      const fmt    = fmtLabel(c.format);
      const isVid  = (c.format || '').toLowerCase().includes('video');
      const assignId = isVid ? `cm-assign-vid-${c.id}` : `cm-assign-img-${c.id}`;
      const assignRole = isVid ? 'Video Editor' : 'Designer';
      const assignType = isVid ? 'video' : 'image';
      return `
    <!-- Format type badge (replaces tab bar) -->
    <div class="cm-format-bar">
      <span class="cm-format-pill" style="background:${fmt.color}18;color:${fmt.color};border-color:${fmt.color}40;">
        ${fmt.icon} ${fmt.label}
      </span>
      <span style="font-size:12px;color:var(--text-muted);">on ${esc(c.platform || 'Instagram')}</span>
    </div>

    <!-- Content Brief -->
    <div class="idea-brief-box">
      <div class="idea-brief-label"><i class="fas fa-scroll"></i> Content Brief</div>
      <p class="idea-brief-text">${esc(c.idea_brief || 'No brief — regenerate calendar to get AI briefs.')}</p>
    </div>

    <!-- Captions & Hashtags -->
    ${captions.length ? `
      <div style="margin-top:12px;">
        <div class="idea-brief-label" style="margin-bottom:8px;"><i class="fas fa-pen"></i> Caption Ideas</div>
        ${captions.map(cap => `
          <div class="caption-item">
            <div class="caption-num">Caption ${cap.variation_number}</div>
            <div class="caption-text">${esc(cap.text)}</div>
          </div>`).join('')}
        <div class="hashtags-cloud" style="margin-top:10px;">${hashtags.map(h => `<span class="hashtag ${h.volume_level||'niche'}">${esc(h.tag)}</span>`).join('')}</div>
      </div>` : '<div class="no-captions-msg"><i class="fas fa-pen"></i> No captions yet — generate this post to create them</div>'}

    <!-- Creative section — Canva or HeyGen based on format -->
    <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:12px;color:var(--text-secondary);font-weight:600;">
          ${isVid ? '🎬 HEYGEN VIDEO SCRIPT' : '🎨 CANVA DESIGN BRIEF'}
        </span>
        <div class="lang-toggle">
          <button class="lang-btn active" data-lang="en" onclick="setCreativeLang('en','${c.id}','${c.format}','cm')">EN</button>
          <button class="lang-btn" data-lang="th" onclick="setCreativeLang('th','${c.id}','${c.format}','cm')">TH</button>
        </div>
      </div>
      <div id="${isVid ? `cm-vidprompt-content-${c.id}` : `cm-imgprompt-content-${c.id}`}" style="text-align:center;padding:16px 0;">
        <i class="fas ${isVid ? 'fa-film' : 'fa-palette'}" style="font-size:28px;color:var(--primary);opacity:.6;margin-bottom:10px;display:block;"></i>
        <p style="color:var(--text-secondary);font-size:13px;margin-bottom:14px;">
          ${isVid ? 'Generate a word-for-word HeyGen avatar script — scenes, timing, avatar setup, voiceover.' : 'Generate an exact Canva step-by-step design brief — background, headline, overlay, brand placement.'}
        </p>
        <button class="btn-gen-creative" id="${isVid ? `cm-vidbtn-${c.id}` : `cm-imgbtn-${c.id}`}"
                onclick="triggerCreative('${c.id}','${c.format}','${isVid ? 'video' : 'image'}','cm')">
          <i class="fas ${isVid ? 'fa-robot' : 'fa-magic'}"></i>
          ${isVid ? 'Generate HeyGen Script' : 'Generate Canva Instructions'}
        </button>
      </div>
      <!-- Hidden stub so cached creative loader still finds both IDs -->
      <div id="${isVid ? `cm-imgprompt-content-${c.id}` : `cm-vidprompt-content-${c.id}`}" style="display:none;"></div>
    </div>

    <!-- Assign -->
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
      <div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">Assign to ${assignRole}</div>
      <div style="display:flex;gap:8px;align-items:center;">
        <div class="assign-input-wrap" style="flex:1;position:relative;">
          <input type="text" class="form-input" id="${assignId}"
                 placeholder="Type name or email…"
                 value="${esc(c.assigned_to||'')}"
                 style="width:100%;font-size:13px;"
                 autocomplete="off"
                 oninput="assignSuggest(this,'${c.id}')"
                 onblur="closeAssignSuggest('${c.id}')">
          <div class="assign-suggest-dd" id="assign-dd-${c.id}" style="display:none;"></div>
        </div>
        <button class="btn-primary btn-sm" onclick="assignConcept('${c.id}', document.getElementById('${assignId}').value, '${assignType}', '${assignId}')">
          <i class="fas fa-paper-plane"></i> Assign
        </button>
      </div>
      ${c.assigned_to ? `<div style="font-size:11px;color:#10b981;margin-top:5px;display:flex;align-items:center;gap:4px;" id="assign-fb-${c.id}"><i class="fas fa-user-check"></i>Currently assigned to <strong>${esc(c.assigned_to)}</strong></div>` : ''}
    </div>

    <!-- Comments -->
    <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border);">
      <div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;"><i class="fas fa-comment"></i> Comments${comments.length ? ` (${comments.length})` : ''}</div>
      <div class="comments-section" id="cm-comments-list-${c.id}">
        ${comments.map(cm => `
          <div class="comment-item" id="cmt-${cm.id}">
            <div class="comment-avatar">${(cm.author||'?')[0].toUpperCase()}</div>
            <div style="flex:1;">
              <div class="comment-author">${esc(cm.author)}</div>
              <div class="comment-text">${esc(cm.text)}</div>
            </div>
            ${can('deleteComment') ? `<button class="comment-del-btn" title="Delete" onclick="deleteComment('${cm.id}')"><i class="fas fa-trash-alt"></i></button>` : ''}
          </div>`).join('') || '<div class="comments-empty">No comments yet</div>'}
      </div>
      <div class="add-comment-row" style="margin-top:10px;">
        <input type="text" class="form-input" id="cm-comment-input-${c.id}" placeholder="Add a comment..." onkeydown="if(event.key==='Enter') addCommentModal('${c.id}')">
        <button class="btn-primary btn-sm" onclick="addCommentModal('${c.id}')"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
      `;
    })()}
  `;
  openModal('conceptModal');

  // Auto-render cached creative so user doesn't have to click Generate each time
  if (c.image_prompt || c.video_prompt) {
    try {
      const imgData = c.image_prompt ? (typeof c.image_prompt === 'string' ? JSON.parse(c.image_prompt) : c.image_prompt) : null;
      const vidData = c.video_prompt ? (typeof c.video_prompt === 'string' ? JSON.parse(c.video_prompt) : c.video_prompt) : null;
      if (imgData) {
        _creativeCache[`${c.id}-image-en`] = { data: imgData, format: c.format };
        const imgEl = document.getElementById(`cm-imgprompt-content-${c.id}`);
        if (imgEl) renderCreativeWithRegenBtn(imgEl, { data: imgData, format: c.format }, 'image', c.format, c.id, 'cm');
      }
      if (vidData) {
        _creativeCache[`${c.id}-video-en`] = { data: vidData, format: c.format };
        const vidEl = document.getElementById(`cm-vidprompt-content-${c.id}`);
        if (vidEl) renderCreativeWithRegenBtn(vidEl, { data: vidData, format: c.format }, 'video', c.format, c.id, 'cm');
      }
    } catch(e) { /* leave Generate button showing if data is malformed */ }
  }
}

async function addCommentModal(conceptId) {
  const input = document.getElementById('cm-comment-input-' + conceptId);
  const text = input.value.trim();
  if (!text) return;
  await api('POST', `/concepts/${conceptId}/comments`, { author: 'You', text });
  input.value = '';
  const list = document.getElementById('cm-comments-list-' + conceptId);
  const empty = list.querySelector('.comments-empty');
  if (empty) empty.remove();
  list.insertAdjacentHTML('beforeend', `
    <div class="comment-item">
      <div class="comment-avatar">Y</div>
      <div><div class="comment-author">You</div><div class="comment-text">${esc(text)}</div></div>
    </div>`);
  toast('Comment added', 'success');
}

// ── List View — Stats only, no editing ───────────────────────────────────
function renderListView() {
  const statusFilter = document.getElementById('list-status-filter');
  const container    = document.getElementById('list-table-container');
  if (!container) return;

  const allConcepts = (state.currentCalendarData && state.currentCalendarData.concepts)
                      || _boardConcepts || [];

  // ── Stats totals (always from full set, unfiltered) ──
  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const todayMid = new Date(); todayMid.setHours(0,0,0,0);
  const failedSet = new Set(['idea','assigned','in_progress']);
  const stats = {
    total:      allConcepts.length,
    done:       allConcepts.filter(c => c.status === 'approved' || c.status === 'published').length,
    inProgress: allConcepts.filter(c => c.status === 'in_progress').length,
    assigned:   allConcepts.filter(c => c.status === 'assigned').length,
    today:      allConcepts.filter(c => c.date === todayStr).length,
    failed:     allConcepts.filter(c => {
                  const cd = c.date ? new Date(c.date+'T00:00:00') : null;
                  return cd && cd < todayMid && failedSet.has((c.status||'idea').toLowerCase());
                }).length,
    adRunning:  allConcepts.filter(c => c.boost_status === 'running').length,
  };

  // ── Apply filter ──
  const statusVal = statusFilter ? statusFilter.value : '';
  let concepts = statusVal ? allConcepts.filter(c => c.status === statusVal) : allConcepts;
  concepts = [...concepts].sort((a, b) => (a.day||0) - (b.day||0));

  // Grid badge helper
  function gridBadge(c) {
    const gName = c.grid_slot_type || '';
    let gi = _cgGrids.findIndex(g => g.name === gName);
    if (gi < 0 && c.grid_index != null) gi = Number(c.grid_index);
    const g = _cgGrids[gi] || null;
    if (!g) return '—';
    return `<span style="background:${g.color}18;color:${g.color};padding:1px 7px;border-radius:8px;font-size:10px;font-weight:700;">${g.icon} ${esc(g.name)}</span>`;
  }

  container.innerHTML = `
    <!-- ── Stats summary cards ── -->
    <div class="lv-stats-row">
      <div class="lv-stat-card">
        <div class="lv-stat-num">${stats.total}</div>
        <div class="lv-stat-label">Total Posts</div>
      </div>
      <div class="lv-stat-card lv-stat--done">
        <div class="lv-stat-num">${stats.done}</div>
        <div class="lv-stat-label">✅ Done</div>
      </div>
      <div class="lv-stat-card lv-stat--progress">
        <div class="lv-stat-num">${stats.inProgress}</div>
        <div class="lv-stat-label">⚡ In Progress</div>
      </div>
      <div class="lv-stat-card lv-stat--assigned">
        <div class="lv-stat-num">${stats.assigned}</div>
        <div class="lv-stat-label">👤 Assigned</div>
      </div>
      <div class="lv-stat-card lv-stat--today">
        <div class="lv-stat-num">${stats.today}</div>
        <div class="lv-stat-label">📅 Today</div>
      </div>
      <div class="lv-stat-card lv-stat--failed">
        <div class="lv-stat-num">${stats.failed}</div>
        <div class="lv-stat-label">❌ Failed</div>
      </div>
      <div class="lv-stat-card lv-stat--ad">
        <div class="lv-stat-num">${stats.adRunning}</div>
        <div class="lv-stat-label">⚡ Ads Running</div>
      </div>
    </div>

    <!-- ── Post table ── -->
    ${!concepts.length ? `
      <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
        <i class="fas fa-inbox" style="font-size:32px;opacity:.3;display:block;margin-bottom:10px;"></i>
        No posts match this filter.
      </div>` : `
    <div class="list-table-wrap">
      <table class="list-table">
        <thead>
          <tr>
            <th style="width:44px;text-align:center;">Day</th>
            <th style="width:76px;">Date</th>
            <th>Hook</th>
            <th style="width:120px;">Column</th>
            <th style="width:110px;">Format</th>
            <th style="width:100px;">Status</th>
            <th style="width:80px;text-align:center;">Ad</th>
            <th style="width:110px;">Assigned to</th>
          </tr>
        </thead>
        <tbody>
          ${concepts.map(c => {
            const fmt = fmtLabel(c.format);
            const st  = c.status || 'idea';
            const cd  = c.date ? new Date(c.date+'T00:00:00') : null;
            const isFailed = cd && cd < todayMid && failedSet.has(st);
            const rowStyle = isFailed ? 'background:#ef444408;' : c.date === todayStr ? 'background:#f59e0b08;' : '';
            return `
              <tr style="${rowStyle}">
                <td style="text-align:center;font-weight:700;font-size:14px;color:var(--accent);">${c.day}</td>
                <td style="white-space:nowrap;font-size:12px;color:var(--text-secondary);">${fmtDate(c.date)}</td>
                <td style="font-size:13px;font-weight:500;color:var(--text-primary);max-width:240px;">${esc(c.hook || '—')}</td>
                <td>${gridBadge(c)}</td>
                <td>
                  <span style="display:inline-flex;align-items:center;gap:3px;background:${fmt.color}18;color:${fmt.color};padding:2px 8px;border-radius:8px;font-size:11px;font-weight:600;">
                    ${fmt.icon} ${esc(fmt.label)}
                  </span>
                </td>
                <td>
                  ${isFailed
                    ? `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:8px;background:#ef444420;color:#ef4444;">❌ FAILED</span>`
                    : `<span class="status-badge s-${st}"><span class="status-dot"></span>${esc(st.replace('_',' '))}</span>`}
                </td>
                <td style="text-align:center;">
                  ${c.boost_status === 'running'
                    ? `<span style="color:#10b981;font-size:11px;font-weight:700;"><i class="fas fa-play-circle"></i> Running</span>`
                    : c.boost_status === 'paused'
                    ? `<span style="color:#f59e0b;font-size:11px;"><i class="fas fa-pause-circle"></i> Paused</span>`
                    : '<span style="color:var(--text-muted);font-size:11px;">—</span>'}
                </td>
                <td style="font-size:12px;">${c.assigned_to
                  ? `<span style="font-weight:500;color:var(--text-primary);">${esc(c.assigned_to)}</span>`
                  : '<span style="color:var(--text-muted);">—</span>'}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`}
  `;
}
function loadListView() { renderListView(); }

// ── Team Tab ──────────────────────────────────────────────────────────────
function renderTeamTab(members) {
  const el = document.getElementById('team-members-grid');
  if (!members.length) {
    el.innerHTML = '<div class="team-empty"><i class="fas fa-user-plus" style="font-size:32px;margin-bottom:12px;display:block;"></i>No team members yet. Click Invite Member.</div>';
    return;
  }
  el.innerHTML = members.map(m => `
    <div class="team-card">
      <div class="team-avatar-lg" style="background:${m.avatar_color || '#667eea'};">${(m.name||'?')[0].toUpperCase()}</div>
      <div class="team-name">${esc(m.name)}</div>
      <div class="team-role">${esc(m.role || 'Team Member')}</div>
      ${m.email ? `<a class="team-email" href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ''}
      <button class="team-remove" onclick="removeMember('${m.id}')"><i class="fas fa-user-minus"></i> Remove</button>
    </div>
  `).join('');
}

async function removeMember(mid) {
  if (!confirm('Remove this team member?')) return;
  await api('DELETE', `/team/members/${mid}`);
  const p = state.currentProject;
  if (p) {
    p.members = (p.members || []).filter(m => m.id !== mid);
    renderTeamTab(p.members);
  }
  toast('Member removed');
}

// ── Global Views ──────────────────────────────────────────────────────────
function openGlobalView(name) {
  state.currentProjectId = null;
  clearSidebarActive();
  document.querySelectorAll('.sidebar-nav-item').forEach(el => {
    el.classList.toggle('active', el.id === 'nav-' + name);
  });

  if (name === 'team')      { showView('view-global-team');      loadGlobalTeam(); }
  if (name === 'analytics') { showView('view-global-analytics'); loadGlobalAnalytics(); }
  if (name === 'settings')  { showView('view-global-settings');  applySettingsRoleGate(); }
}

function clearSidebarActive() {
  document.querySelectorAll('.sidebar-project-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav-item').forEach(el => el.classList.remove('active'));
}

async function loadGlobalTeam() {
  try {
    const members = await api('GET', '/team');
    const el = document.getElementById('global-team-grid');
    if (!members.length) {
      el.innerHTML = '<div class="team-empty">No team members yet.</div>';
      return;
    }
    el.innerHTML = members.map(m => `
      <div class="team-card">
        <div class="team-avatar-lg" style="background:${m.avatar_color || '#667eea'};">${(m.name||'?')[0].toUpperCase()}</div>
        <div class="team-name">${esc(m.name)}</div>
        <div class="team-role">${esc(m.role || 'Team Member')}</div>
        ${m.email ? `<a class="team-email" href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ''}
      </div>
    `).join('');
  } catch(e) {}
}

async function loadGlobalAnalytics() {
  try {
    const stats = await api('GET', '/stats');
    document.getElementById('global-stats-row').innerHTML = `
      <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">Clients</div><div class="stat-value">${stats.total_clients}</div></div>
      <div class="stat-card"><div class="stat-icon">📅</div><div class="stat-label">Calendars</div><div class="stat-value">${stats.total_calendars}</div></div>
      <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-label">Published</div><div class="stat-value">${stats.published_posts}</div></div>
      <div class="stat-card"><div class="stat-icon">👁️</div><div class="stat-label">Total Views</div><div class="stat-value">${stats.total_views.toLocaleString()}</div></div>
      <div class="stat-card"><div class="stat-icon">❤️</div><div class="stat-label">Avg Engagement</div><div class="stat-value">${stats.avg_engagement}</div></div>
      <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-label">Sales Generated</div><div class="stat-value">${stats.total_sales}</div></div>
    `;
    renderGlobalCharts();
  } catch(e) {}
}

function renderGlobalCharts() {
  const ctxType = document.getElementById('contentTypeChart');
  const ctxEng  = document.getElementById('engagementTrendChart');
  if (!ctxType || !ctxEng) return;

  if (state.contentTypeChart) state.contentTypeChart.destroy();
  if (state.engagementChart)  state.engagementChart.destroy();

  state.contentTypeChart = new Chart(ctxType, {
    type: 'doughnut',
    data: {
      labels: ['Value Bomb', 'Carousel', 'Godfather Offer', 'Free PDF', 'Secret Video'],
      datasets: [{ data: [40, 20, 20, 10, 10], backgroundColor: ['#6366f1','#3b82f6','#f59e0b','#10b981','#ec4899'], borderWidth: 0 }]
    },
    options: { responsive: true, plugins: { legend: { position: 'right' } } }
  });

  const labels = Array.from({length:30}, (_,i) => `Day ${i+1}`);
  state.engagementChart = new Chart(ctxEng, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: 'Engagement %', data: labels.map(() => +(Math.random()*4+1).toFixed(1)), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,.08)', fill: true, tension: .4, pointRadius: 0 }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
  });
}

// ── Settings ──────────────────────────────────────────────────────────────
async function loadSettings() {
  try {
    const data = await api('GET', '/settings');
    const bar = document.getElementById('api-key-status-bar');
    if (bar) {
      bar.className = 'api-status-bar ' + (data.api_key_set ? 'set' : 'missing');
      bar.innerHTML = data.api_key_set
        ? `<i class="fas fa-check-circle"></i> API key saved (${data.api_key_preview}) — ready to generate`
        : '<i class="fas fa-exclamation-triangle"></i> No API key saved yet';
    }
  } catch(e) {}

  // Load Apify settings
  try {
    const intData = await api('GET', '/settings/integrations');
    if (intData.apify_api_key) {
      const inp = document.getElementById('apifyKeyInput');
      if (inp) inp.value = intData.apify_api_key;
      const msg = document.getElementById('apify-key-message');
      if (msg) { msg.className = 'api-msg success'; msg.innerHTML = '<i class="fas fa-check-circle"></i> Token loaded'; }
    }
  } catch(e) {}

  // Load Email settings
  try {
    const emailData = await api('GET', '/settings/email');
    if (emailData.smtp_host) {
      const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
      set('smtp-host', emailData.smtp_host);
      set('smtp-port', emailData.smtp_port);
      set('smtp-user', emailData.smtp_user);
      set('smtp-from-name', emailData.smtp_from_name);
      set('smtp-from', emailData.smtp_from);
      // Don't pre-fill password for security
      const bar = document.getElementById('email-status-bar');
      if (bar) { bar.className = 'api-status-bar set'; bar.innerHTML = '<i class="fas fa-check-circle"></i> SMTP configured — ' + esc(emailData.smtp_host); }
    } else {
      const bar = document.getElementById('email-status-bar');
      if (bar) { bar.className = 'api-status-bar missing'; bar.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Email not configured — set up SMTP to enable notifications'; }
    }
  } catch(e) {}
}

async function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  const msg = document.getElementById('api-key-message');
  try {
    const res = await api('POST', '/settings', { api_key: key });
    msg.className = 'api-msg success';
    msg.innerHTML = '<i class="fas fa-check-circle"></i> ' + res.message;
    loadSettings();
    toast('API key saved!', 'success');
  } catch(e) {
    msg.className = 'api-msg error';
    msg.innerHTML = '<i class="fas fa-times-circle"></i> ' + (e.message || 'Save failed');
  }
}

async function testApiKey() {
  const msg = document.getElementById('api-key-message');
  msg.className = 'api-msg';
  msg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing connection...';
  try {
    const res = await api('GET', '/settings/test');
    if (res.status === 'valid') {
      msg.className = 'api-msg success';
      msg.innerHTML = '<i class="fas fa-check-circle"></i> ' + res.message;
      toast('Connected!', 'success');
    } else {
      msg.className = 'api-msg error';
      msg.innerHTML = '<i class="fas fa-times-circle"></i> ' + res.message;
    }
  } catch(e) {
    msg.className = 'api-msg error';
    msg.innerHTML = 'Connection error: ' + e.message;
  }
}

async function saveApifyKey() {
  const key = document.getElementById('apifyKeyInput').value.trim();
  const msg = document.getElementById('apify-key-message');
  if (!key) { msg.className = 'api-msg error'; msg.innerHTML = 'Please enter your Apify token.'; return; }
  try {
    await api('POST', '/settings/integrations', { apify_api_key: key });
    msg.className = 'api-msg success';
    msg.innerHTML = '<i class="fas fa-check-circle"></i> Apify token saved!';
    toast('Apify token saved!', 'success');
  } catch(e) {
    msg.className = 'api-msg error';
    msg.innerHTML = '<i class="fas fa-times-circle"></i> ' + (e.message || 'Save failed');
  }
}

async function saveEmailSettings() {
  const msg = document.getElementById('email-settings-message');
  const payload = {
    smtp_host:      document.getElementById('smtp-host').value.trim(),
    smtp_port:      parseInt(document.getElementById('smtp-port').value) || 587,
    smtp_user:      document.getElementById('smtp-user').value.trim(),
    smtp_password:  document.getElementById('smtp-password').value,
    smtp_from_name: document.getElementById('smtp-from-name').value.trim() || 'ContentFlow',
    smtp_from:      document.getElementById('smtp-from').value.trim(),
  };
  if (!payload.smtp_host || !payload.smtp_user || !payload.smtp_password || !payload.smtp_from) {
    msg.className = 'api-msg error';
    msg.innerHTML = '<i class="fas fa-times-circle"></i> Host, username, password and from email are required.';
    return;
  }
  try {
    await api('POST', '/settings/email', payload);
    msg.className = 'api-msg success';
    msg.innerHTML = '<i class="fas fa-check-circle"></i> Email settings saved!';
    const bar = document.getElementById('email-status-bar');
    if (bar) { bar.className = 'api-status-bar set'; bar.innerHTML = '<i class="fas fa-check-circle"></i> SMTP configured — ' + esc(payload.smtp_host); }
    toast('Email settings saved!', 'success');
  } catch(e) {
    msg.className = 'api-msg error';
    msg.innerHTML = '<i class="fas fa-times-circle"></i> ' + (e.message || 'Save failed');
  }
}

async function testEmailSettings() {
  const msg = document.getElementById('email-settings-message');
  msg.className = 'api-msg';
  msg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending test email...';
  try {
    const res = await api('POST', '/settings/email/test', {});
    msg.className = 'api-msg success';
    msg.innerHTML = '<i class="fas fa-check-circle"></i> ' + (res.message || 'Test email sent!');
    toast('Test email sent!', 'success');
  } catch(e) {
    msg.className = 'api-msg error';
    msg.innerHTML = '<i class="fas fa-times-circle"></i> ' + (e.message || 'Test failed');
  }
}

// ── Settings tabs ─────────────────────────────────────────────────────────
function switchSettingsTab(tab) {
  document.querySelectorAll('.settings-nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.spanel').forEach(p => p.classList.remove('active'));
  const btn = document.getElementById('stab-' + tab);
  const panel = document.getElementById('spanel-' + tab);
  if (btn) btn.classList.add('active');
  if (panel) panel.classList.add('active');
  if (tab === 'team') loadTeamUsers();
  if (tab === 'integrations') loadSettings();
  if (tab === 'notifications') loadSettings();
  if (tab === 'workspace') loadWorkspaceSettings();
  if (tab === 'account') loadMyProfile();
  if (tab === 'messaging') loadMessagingSettings();
}

function applySettingsRoleGate() {
  const isAdmin = (state.currentUser.role === 'admin');
  document.querySelectorAll('[data-admin-only="true"]').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
  // Non-admins land on My Account
  if (!isAdmin) {
    switchSettingsTab('account');
  }
}

// Workspace
async function loadWorkspaceSettings() {
  try {
    const d = await api('GET', '/admin/settings');
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('ws-app-name', d.app_name);
    set('ws-guest-login', d.allow_guest_login === '0' ? '0' : '1');
    set('ws-google-id', d.google_client_id);
    set('ws-google-secret', d.google_client_secret);
  } catch(e) {}
}

async function saveWorkspaceSettings() {
  const msg = document.getElementById('ws-msg');
  const get = id => (document.getElementById(id) || {}).value || '';
  try {
    await api('POST', '/admin/settings', {
      app_name: get('ws-app-name'),
      allow_guest_login: get('ws-guest-login'),
      google_client_id: get('ws-google-id'),
      google_client_secret: get('ws-google-secret'),
    });
    msg.className = 'api-msg success';
    msg.innerHTML = '<i class="fas fa-check-circle"></i> Workspace settings saved!';
    toast('Workspace saved', 'success');
  } catch(e) {
    msg.className = 'api-msg error';
    msg.innerHTML = '<i class="fas fa-times-circle"></i> ' + (e.message || 'Save failed');
  }
}

// My Profile
async function loadMyProfile() {
  const user = state.currentUser || {};
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('profile-name', user.name);
  set('profile-email', user.email);
  set('profile-role', user.role);
}

async function saveMyProfile() {
  const msg = document.getElementById('profile-msg');
  const name = (document.getElementById('profile-name') || {}).value.trim();
  if (!name) { msg.className = 'api-msg error'; msg.innerHTML = 'Name cannot be empty.'; return; }
  try {
    await api('PATCH', '/me', { name });
    state.currentUser.name = name;
    msg.className = 'api-msg success';
    msg.innerHTML = '<i class="fas fa-check-circle"></i> Profile updated!';
    toast('Profile saved', 'success');
    // Update sidebar display
    updateSidebarUser(state.currentUser);
  } catch(e) {
    msg.className = 'api-msg error';
    msg.innerHTML = '<i class="fas fa-times-circle"></i> ' + (e.message || 'Save failed');
  }
}

async function saveMyPassword() {
  const msg = document.getElementById('password-msg');
  const pw  = (document.getElementById('new-password') || {}).value;
  const pw2 = (document.getElementById('confirm-password') || {}).value;
  if (!pw || pw.length < 6) { msg.className = 'api-msg error'; msg.innerHTML = 'Password must be at least 6 characters.'; return; }
  if (pw !== pw2) { msg.className = 'api-msg error'; msg.innerHTML = 'Passwords do not match.'; return; }
  try {
    await api('PATCH', '/me', { password: pw });
    msg.className = 'api-msg success';
    msg.innerHTML = '<i class="fas fa-check-circle"></i> Password updated!';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    toast('Password changed', 'success');
  } catch(e) {
    msg.className = 'api-msg error';
    msg.innerHTML = '<i class="fas fa-times-circle"></i> ' + (e.message || 'Save failed');
  }
}

// Team users
const ROLE_OPTIONS = ['admin','manager','executive','worker'];
async function loadTeamUsers() {
  const wrap = document.getElementById('team-users-table');
  if (!wrap) return;
  try {
    const users = await api('GET', '/admin/users');
    const badge = document.getElementById('team-count-badge');
    if (badge) badge.textContent = users.length + ' member' + (users.length !== 1 ? 's' : '');
    wrap.innerHTML = `
      <table class="team-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th></th></tr></thead>
        <tbody>
          ${users.map(u => `
            <tr id="trow-${u.id}">
              <td><div class="tt-avatar" style="background:${roleColor(u.role)}">${(u.name||'?')[0].toUpperCase()}</div> ${esc(u.name||'—')}</td>
              <td class="tt-email">${esc(u.email)}</td>
              <td>
                <select class="tt-role-select" onchange="changeUserRole('${u.id}', this.value)" ${u.id === state.currentUser.id ? 'disabled title="Cannot change your own role"' : ''}>
                  ${ROLE_OPTIONS.map(r => `<option value="${r}" ${r===u.role?'selected':''}>${r.charAt(0).toUpperCase()+r.slice(1)}</option>`).join('')}
                </select>
              </td>
              <td class="tt-date">${u.created_at ? u.created_at.substring(0,10) : '—'}</td>
              <td>
                ${u.id !== state.currentUser.id ? `<button class="tt-del-btn" onclick="deleteUser('${u.id}','${esc(u.name||u.email)}')" title="Remove user"><i class="fas fa-trash"></i></button>` : '<span style="color:var(--text-muted);font-size:11px;">You</span>'}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch(e) {
    wrap.innerHTML = '<div class="settings-loading" style="color:var(--error)">Failed to load users</div>';
  }
}

function roleColor(role) {
  return { admin:'#6366f1', manager:'#f59e0b', executive:'#10b981', worker:'#6b7280' }[role] || '#9ca3af';
}

async function changeUserRole(uid, newRole) {
  try {
    await api('PUT', `/admin/users/${uid}`, { role: newRole });
    toast('Role updated', 'success');
  } catch(e) { toast('Failed to update role: ' + e.message, 'error'); }
}

async function deleteUser(uid, name) {
  const ok = await showConfirmDialog('Remove User', `Remove <strong>${esc(name)}</strong> from the workspace? They will no longer be able to log in.`, 'Remove', 'Cancel');
  if (!ok) return;
  try {
    await api('DELETE', `/admin/users/${uid}`);
    const row = document.getElementById('trow-' + uid);
    if (row) row.remove();
    toast('User removed', 'success');
    loadTeamUsers();
  } catch(e) { toast('Failed: ' + e.message, 'error'); }
}

// Integrations extras (Asana)
async function loadIntegrationExtras() {
  try {
    const d = await api('GET', '/admin/settings');
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('asana-key', d.asana_api_key || '');
    set('asana-workspace', d.asana_workspace_id || '');
  } catch(e) {}
}

async function saveIntegrationExtras() {
  const msg = document.getElementById('integration-extras-msg');
  const get = id => (document.getElementById(id) || {}).value || '';
  try {
    await api('POST', '/admin/settings', { asana_api_key: get('asana-key'), asana_workspace_id: get('asana-workspace') });
    msg.className = 'api-msg success';
    msg.innerHTML = '<i class="fas fa-check-circle"></i> Asana settings saved!';
    toast('Asana saved', 'success');
  } catch(e) {
    msg.className = 'api-msg error';
    msg.innerHTML = '<i class="fas fa-times-circle"></i> ' + (e.message || 'Save failed');
  }
}

// Messaging (Twilio)
async function loadMessagingSettings() {
  try {
    const d = await api('GET', '/admin/settings');
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('twilio-sid', d.twilio_account_sid || '');
    set('twilio-token', d.twilio_auth_token || '');
    set('twilio-number', d.twilio_whatsapp_number || '');
  } catch(e) {}
}

async function saveMessagingSettings() {
  const msg = document.getElementById('messaging-msg');
  const get = id => (document.getElementById(id) || {}).value || '';
  try {
    await api('POST', '/admin/settings', {
      twilio_account_sid: get('twilio-sid'),
      twilio_auth_token: get('twilio-token'),
      twilio_whatsapp_number: get('twilio-number'),
    });
    msg.className = 'api-msg success';
    msg.innerHTML = '<i class="fas fa-check-circle"></i> WhatsApp settings saved!';
    toast('Messaging saved', 'success');
  } catch(e) {
    msg.className = 'api-msg error';
    msg.innerHTML = '<i class="fas fa-times-circle"></i> ' + (e.message || 'Save failed');
  }
}

// ── Project Creation Wizard ────────────────────────────────────────────────
function openProjectWizard() {
  state.wizardStep = 0;
  state.wizardData = {
    name:'', niche:'', business_type:'', goal:'', emoji:'🚀', color:'#667eea',
    target_age:'25-34', target_gender:'All', target_location:'', target_interests:'',
    target_pain_points:'', unique_selling_point:'', competitor_handles:'', brand_colors:'',
    tone_of_voice:'Fun & Relatable', campaign_days:30, posting_frequency:'Daily',
    goal_type:'followers', value_bomb_types:['Value Bomb','Carousel Tutorial','Free PDF Bomb'],
    members: []
  };
  document.getElementById('wizard-members-list').innerHTML = '';
  wizardSolutions.length = 0;
  renderSolutions();
  // Reset AI step
  const aiInput = document.getElementById('ai-describe-input');
  if (aiInput) aiInput.value = '';
  const aiResult = document.getElementById('ai-extract-result');
  if (aiResult) { aiResult.style.display = 'none'; aiResult.innerHTML = ''; }
  renderWizardStep(0);
  openModal('wizardModal');
}

function renderWizardStep(step) {
  const isAI = step === 0;

  // AI pre-step visibility
  const aiStep = document.getElementById('wstep-ai');
  if (aiStep) aiStep.classList.toggle('active', isAI);

  // Wizard form header + footer
  const formHeader = document.getElementById('wizard-form-header');
  const footer = document.getElementById('wizard-footer');
  if (formHeader) formHeader.style.display = isAI ? 'none' : '';
  if (footer) footer.style.display = isAI ? 'none' : 'flex';

  if (isAI) return;

  document.querySelectorAll('.wizard-step').forEach((el, i) => {
    el.classList.toggle('active', i + 1 === step);
  });
  document.querySelectorAll('.wstep').forEach((el, i) => {
    const s = i + 1;
    el.classList.toggle('active', s === step);
    el.classList.toggle('done', s < step);
  });
  document.getElementById('wizard-step-label').textContent = `Step ${step} of 6`;
  document.getElementById('wizard-back-btn').style.display = step > 1 ? 'flex' : 'none';
  const nextBtn = document.getElementById('wizard-next-btn');
  if (step === 6) {
    nextBtn.innerHTML = '<i class="fas fa-rocket"></i> Create Project';
    nextBtn.onclick = createProject;
  } else {
    nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
    nextBtn.onclick = wizardNext;
  }

  if (step === 6) renderWizardReview();
}

// ── AI Pre-fill ───────────────────────────────────────────────────────────
async function aiContinueToQuestions() {
  const text = (document.getElementById('ai-describe-input').value || '').trim();
  if (!text) { toast('Please describe your project first', 'error'); return; }

  // Switch to stage B — show typing indicator
  document.getElementById('ai-stage-a').style.display = 'none';
  document.getElementById('ai-stage-b').style.display = '';
  document.getElementById('ai-answer-area').style.display = 'none';

  const bubble = document.getElementById('ai-conv-bubble');
  bubble.innerHTML = '<div class="ai-conv-typing"><span></span><span></span><span></span></div>';

  try {
    const res = await api('POST', '/ai/questions', { text });

    // Render AI message — convert newlines to <br> and bold numbered questions
    const formatted = (res.message || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    bubble.innerHTML = formatted;

    // Show answer area
    document.getElementById('ai-q-answer').value = '';
    document.getElementById('ai-extract-result').style.display = 'none';
    document.getElementById('ai-extract-result').innerHTML = '';
    document.getElementById('ai-build-actions').style.display = '';
    document.getElementById('ai-answer-area').style.display = '';
    setTimeout(() => document.getElementById('ai-q-answer').focus(), 100);

  } catch(e) {
    bubble.innerHTML = 'Sorry, I couldn\'t load questions. Please try again.';
    toast('Failed to load AI questions: ' + (e.message || ''), 'error');
  }
}

function aiGoBackToDescription() {
  document.getElementById('ai-stage-b').style.display = 'none';
  document.getElementById('ai-stage-a').style.display = '';
}

async function fillWithAI() {
  const description = (document.getElementById('ai-describe-input').value || '').trim();
  const answers     = (document.getElementById('ai-q-answer').value || '').trim();

  if (!answers) { toast('Please answer the questions above', 'error'); return; }

  const combined = `PROJECT DESCRIPTION:\n${description}\n\nUSER'S ANSWERS TO CLARIFYING QUESTIONS:\n${answers}`;

  const loading  = document.getElementById('ai-extract-loading');
  const result   = document.getElementById('ai-extract-result');
  const buildBtn = document.querySelector('#ai-build-actions .btn-primary');

  loading.style.display = 'flex';
  result.style.display  = 'none';
  document.getElementById('ai-build-actions').style.display = 'none';
  if (buildBtn) buildBtn.disabled = true;

  try {
    const data = await api('POST', '/ai/extract', { text: combined });

    // Fill wizardData from AI response
    const fields = ['name','niche','business_type','goal','emoji','target_age','target_gender',
      'target_location','target_interests','target_pain_points','unique_selling_point',
      'competitor_handles','brand_colors','tone_of_voice','campaign_days','goal_type'];
    fields.forEach(f => { if (data[f]) state.wizardData[f] = data[f]; });
    if (data.value_bomb_types && data.value_bomb_types.length)
      state.wizardData.value_bomb_types = data.value_bomb_types;

    const days = data.campaign_days || 30;

    result.style.display = 'block';
    result.innerHTML = `
      <div class="ai-result-success">
        <i class="fas fa-check-circle"></i> AI built your ${days}-day project plan
      </div>
      <div class="ai-preview-grid">
        ${data.name ? `<div class="ai-preview-row"><span class="ai-preview-label">Project</span><span>${esc(data.emoji||'🚀')} ${esc(data.name)}</span></div>` : ''}
        ${data.niche ? `<div class="ai-preview-row"><span class="ai-preview-label">Niche</span><span>${esc(data.niche)}</span></div>` : ''}
        ${data.target_age ? `<div class="ai-preview-row"><span class="ai-preview-label">Audience</span><span>${esc(data.target_age)} · ${esc(data.target_gender||'All')}</span></div>` : ''}
        ${data.tone_of_voice ? `<div class="ai-preview-row"><span class="ai-preview-label">Tone</span><span>${esc(data.tone_of_voice)}</span></div>` : ''}
        <div class="ai-preview-row"><span class="ai-preview-label">Campaign</span><span>${days} days</span></div>
        ${data.value_bomb_types && data.value_bomb_types.length ? `<div class="ai-preview-row" style="grid-column:1/-1;"><span class="ai-preview-label">Content Mix</span><span>${data.value_bomb_types.map(v=>esc(v)).join(' · ')}</span></div>` : ''}
        ${data.target_pain_points ? `<div class="ai-preview-row" style="grid-column:1/-1;"><span class="ai-preview-label">Pain Points</span><span>${esc(data.target_pain_points)}</span></div>` : ''}
      </div>
      <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn-primary" onclick="proceedFromAI()"><i class="fas fa-arrow-right"></i> Review &amp; Edit All Details</button>
        <button class="btn-ghost btn-sm" onclick="retryAI()">Try Again</button>
      </div>
    `;

    toast(`AI built your ${days}-day plan!`, 'success');
  } catch(e) {
    document.getElementById('ai-build-actions').style.display = '';
    toast('AI extract failed: ' + (e.message || 'Try again'), 'error');
  } finally {
    loading.style.display = 'none';
    if (buildBtn) buildBtn.disabled = false;
  }
}

function retryAI() {
  document.getElementById('ai-extract-result').style.display = 'none';
  document.getElementById('ai-extract-result').innerHTML = '';
  document.getElementById('ai-build-actions').style.display = '';
  document.getElementById('ai-q-answer').value = '';
}

function proceedFromAI() {
  state.wizardStep = 1;
  renderWizardStep(1);
  // Pre-fill form fields with wizardData
  prefillWizardForms();
}

function skipToManual() {
  state.wizardStep = 1;
  renderWizardStep(1);
}

function prefillWizardForms() {
  const d = state.wizardData;
  const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
  // Step 1
  set('w-name', d.name);
  set('w-niche', d.niche);
  set('w-business-type', d.business_type);
  set('w-goal', d.goal);
  set('w-emoji', d.emoji);
  // Step 2 — age multi-chips
  if (d.target_age) {
    const ages = d.target_age.split(',').map(s => s.trim());
    document.querySelectorAll('.age-chip').forEach(chip => {
      const active = ages.includes(chip.dataset.age);
      chip.classList.toggle('active', active);
    });
    const ageInput = document.getElementById('w-target-age');
    if (ageInput) ageInput.value = d.target_age;
  }
  set('w-target-gender', d.target_gender);
  set('w-target-location', d.target_location);
  set('w-target-interests', d.target_interests);
  // Step 3
  set('w-pain-points', d.target_pain_points);
  set('w-usp', d.unique_selling_point);
  set('w-competitors', d.competitor_handles);
  set('w-brand-colors', d.brand_colors);
  // Step 4
  set('w-tone', d.tone_of_voice);
  set('w-campaign-days', d.campaign_days);
  if (d.success_goal) set('w-success-goal', d.success_goal);
  // Pre-fill start date with today if empty
  const startDateEl = document.getElementById('w-start-date');
  if (startDateEl && !startDateEl.value) {
    startDateEl.value = d.start_date || new Date().toISOString().slice(0, 10);
  }
  // Step 5: restore grid configs if previously set
  if (d.campaign_grids) {
    d.campaign_grids.forEach((g, i) => {
      const nameEl  = document.getElementById(`wgrid-name-${i}`);
      const colorEl = document.getElementById(`wgrid-color-${i}`);
      const typesEl = document.getElementById(`wgrid-types-${i}`);
      const swatchEl = document.getElementById(`wgrid-swatch-${i}`);
      if (nameEl)  nameEl.value  = g.name  || '';
      if (colorEl) colorEl.value = g.color || '#6366f1';
      if (typesEl) typesEl.value = (g.content_types || []).join(', ');
      if (swatchEl && g.color) swatchEl.style.background = g.color;
    });
  }
}

function wizardNext() {
  const step = state.wizardStep;
  if (step === 1) {
    const name = document.getElementById('w-name').value.trim();
    const niche = document.getElementById('w-niche').value.trim();
    if (!name || !niche) { toast('Project name and niche are required', 'error'); return; }
    state.wizardData.name          = name;
    state.wizardData.niche         = niche;
    state.wizardData.business_type = document.getElementById('w-business-type').value.trim();
    state.wizardData.goal          = document.getElementById('w-goal').value.trim();
    state.wizardData.emoji         = document.getElementById('w-emoji').value.trim() || '🚀';
  }
  if (step === 2) {
    state.wizardData.target_age       = document.getElementById('w-target-age').value;
    state.wizardData.target_gender    = document.getElementById('w-target-gender').value;
    state.wizardData.target_location  = document.getElementById('w-target-location').value.trim();
    state.wizardData.target_interests = document.getElementById('w-target-interests').value.trim();
  }
  if (step === 3) {
    const pain = document.getElementById('w-pain-points').value.trim();
    if (!pain) { toast('Pain points help AI create better content', 'error'); return; }
    if (wizardSolutions.length < 3) {
      document.getElementById('solutions-hint').style.display = '';
      toast('Add at least 3 specific solutions to continue', 'error'); return;
    }
    state.wizardData.target_pain_points  = pain;
    state.wizardData.solutions           = [...wizardSolutions];
    state.wizardData.unique_selling_point= document.getElementById('w-usp').value.trim();
    state.wizardData.competitor_handles  = document.getElementById('w-competitors').value.trim();
    state.wizardData.brand_colors        = document.getElementById('w-brand-colors').value.trim();
  }
  if (step === 4) {
    state.wizardData.tone_of_voice   = document.getElementById('w-tone').value;
    state.wizardData.campaign_days   = parseInt(document.getElementById('w-campaign-days').value) || 30;
    state.wizardData.posting_frequency = 'Daily'; // locked to campaign grid system
    state.wizardData.goal_type       = 'campaign'; // new system uses grids, not goal radio
    const startDateEl = document.getElementById('w-start-date');
    if (startDateEl && startDateEl.value) state.wizardData.start_date = startDateEl.value;
    const successGoal = document.getElementById('w-success-goal');
    if (successGoal) state.wizardData.success_goal = successGoal.value.trim();
  }
  if (step === 5) {
    // Collect grid configs from the 3 grid cards
    const grids = [0, 1, 2].map(i => ({
      grid_index: i,
      name:          (document.getElementById(`wgrid-name-${i}`)?.value || '').trim() || ['Value Content','Growth Content','Sales Content'][i],
      color:         document.getElementById(`wgrid-color-${i}`)?.value || ['#6366f1','#10b981','#f59e0b'][i],
      content_types: (document.getElementById(`wgrid-types-${i}`)?.value || '').split(',').map(s => s.trim()).filter(Boolean),
      icon:          ['💎','🚀','🔥'][i],
    }));
    state.wizardData.campaign_grids = grids;
    // Also set content types for backward compat
    state.wizardData.value_bomb_types = grids.flatMap(g => g.content_types);
  }

  state.wizardStep = step + 1;
  renderWizardStep(state.wizardStep);
}

function wizardBack() {
  if (state.wizardStep > 1) {
    state.wizardStep--;
    renderWizardStep(state.wizardStep);
  }
}

function renderWizardReview() {
  const d = state.wizardData;
  document.getElementById('wizard-review-summary').innerHTML = `
    <div class="review-row"><span class="review-label">Project:</span><span class="review-value">${d.emoji} ${esc(d.name)}</span></div>
    <div class="review-row"><span class="review-label">Niche:</span><span class="review-value">${esc(d.niche)}</span></div>
    <div class="review-row"><span class="review-label">Target Audience:</span><span class="review-value">${esc(d.target_age)} · ${esc(d.target_gender)}${d.target_location ? ' · ' + esc(d.target_location) : ''}</span></div>
    <div class="review-row"><span class="review-label">Tone:</span><span class="review-value">${esc(d.tone_of_voice)}</span></div>
    <div class="review-row"><span class="review-label">Campaign:</span><span class="review-value">${esc(String(d.campaign_days))} days${d.start_date ? ' · starts ' + esc(d.start_date) : ''}</span></div>
    ${d.success_goal ? `<div class="review-row"><span class="review-label">Goal:</span><span class="review-value">${esc(d.success_goal)}</span></div>` : ''}
    ${(d.campaign_grids || []).map((g,i) => `<div class="review-row"><span class="review-label" style="color:${g.color};">${['A','B','C'][i]} Grid:</span><span class="review-value">${esc(g.name)} — ${esc((g.content_types||[]).join(', '))}</span></div>`).join('')}
  `;
}

function addWizardMember() {
  const nameEl  = document.getElementById('w-member-name');
  const roleEl  = document.getElementById('w-member-role');
  const emailEl = document.getElementById('w-member-email');
  const name  = nameEl.value.trim();
  if (!name) return;
  const email = emailEl ? emailEl.value.trim() : '';
  const role  = roleEl.value.trim();
  state.wizardData.members.push({ name, role, email });
  const list = document.getElementById('wizard-members-list');
  const idx = state.wizardData.members.length - 1;
  list.insertAdjacentHTML('beforeend', `
    <div class="wizard-member-tag" id="wm-${idx}">
      <span>${esc(name)}${role ? ' — ' + esc(role) : ''}${email ? ' <span style="color:var(--text-muted);font-size:11px;">(' + esc(email) + ')</span>' : ''}</span>
      <button onclick="removeWizardMember(${idx})"><i class="fas fa-times"></i></button>
    </div>
  `);
  nameEl.value = ''; roleEl.value = '';
  if (emailEl) emailEl.value = '';
  closeTeamSuggest();
}

function removeWizardMember(idx) {
  state.wizardData.members.splice(idx, 1);
  document.getElementById('wizard-members-list').innerHTML = state.wizardData.members.map((m, i) => `
    <div class="wizard-member-tag">
      <span>${esc(m.name)}${m.role ? ' — ' + esc(m.role) : ''}</span>
      <button onclick="removeWizardMember(${i})"><i class="fas fa-times"></i></button>
    </div>
  `).join('');
}

async function createProject() {
  const d = state.wizardData;
  const nextBtn = document.getElementById('wizard-next-btn');
  nextBtn.disabled = true;
  nextBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

  try {
    const res = await api('POST', '/clients', {
      ...d,
      value_bomb_types: d.value_bomb_types,
      campaign_days: d.campaign_days
    });

    // Add members
    for (const m of d.members) {
      await api('POST', `/clients/${res.id}/members`, m);
    }

    // Auto-create a calendar and pre-configure grids if wizard provided them
    if (d.campaign_grids && d.campaign_grids.length === 3) {
      try {
        const now = new Date();
        const startDate = d.start_date || now.toISOString().slice(0, 10);
        const calRes = await api('POST', '/calendars', {
          client_id: res.id,
          month: startDate.slice(0, 7),
          start_date: startDate,
          campaign_days: d.campaign_days || 30,
          goal_type: 'campaign',
          create_only: true,
        });
        // Route may return either 'id' or 'calendar_id' — handle both
        const createdCalId = calRes && (calRes.id || calRes.calendar_id);
        if (createdCalId) {
          // Save grid configs
          await api('PUT', `/calendars/${createdCalId}/campaign-grids`, { grids: d.campaign_grids });
        }
      } catch(gridErr) { /* non-fatal */ }
    }

    closeModal('wizardModal');
    await loadSidebar();
    await openProject(res.id);
    toast(`${d.emoji} ${d.name} created — campaign grids ready!`, 'success');
  } catch(e) {
    toast('Failed to create project: ' + e.message, 'error');
  } finally {
    nextBtn.disabled = false;
    nextBtn.innerHTML = '<i class="fas fa-rocket"></i> Create Project';
    nextBtn.onclick = createProject;
  }
}

function selectColor(el) {
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  const color = el.dataset.color;
  document.getElementById('w-color').value = color;
  state.wizardData.color = color;
}

// ── Emoji Picker ──────────────────────────────────────────────────────────
function toggleEmojiPicker() {
  const picker = document.getElementById('emoji-picker');
  if (picker) picker.style.display = picker.style.display === 'none' ? '' : 'none';
}
function pickEmoji(emoji) {
  const input = document.getElementById('w-emoji');
  if (input) input.value = emoji;
  state.wizardData.emoji = emoji;
  const picker = document.getElementById('emoji-picker');
  if (picker) picker.style.display = 'none';
}

// ── Brand Color Auto-suggest ──────────────────────────────────────────────
const NICHE_COLORS = {
  golf: '#166534', sport: '#166534', fitness: '#10b981', gym: '#10b981',
  food: '#f97316', restaurant: '#f97316', cafe: '#b45309', coffee: '#b45309',
  hotel: '#1e293b', luxury: '#1e293b', premium: '#8b5cf6',
  beauty: '#ec4899', fashion: '#ec4899', jewel: '#f59e0b',
  tech: '#3b82f6', digital: '#6366f1', agency: '#6366f1',
  health: '#10b981', wellness: '#14b8a6', yoga: '#14b8a6',
  finance: '#1e293b', legal: '#1e293b', consult: '#3b82f6',
};
function suggestBrandColors() {
  const niche = (document.getElementById('w-niche').value || '').toLowerCase();
  if (!niche) return;
  const match = Object.keys(NICHE_COLORS).find(k => niche.includes(k));
  if (!match) return;
  const color = NICHE_COLORS[match];
  // Highlight the matching swatch
  document.querySelectorAll('.color-swatch').forEach(s => {
    if (s.dataset.color === color) {
      s.classList.add('active');
      document.getElementById('w-color').value = color;
      state.wizardData.color = color;
    } else {
      s.classList.remove('active');
    }
  });
}

// ── Age Range Multi-select ────────────────────────────────────────────────
function toggleAgeChip(btn) {
  btn.classList.toggle('active');
  const selected = Array.from(document.querySelectorAll('.age-chip.active')).map(b => b.dataset.age);
  document.getElementById('w-target-age').value = selected.join(', ') || '25-34';
}

// ── Solutions ─────────────────────────────────────────────────────────────
const wizardSolutions = [];
function addSolution() {
  const input = document.getElementById('solution-input');
  const text = (input.value || '').trim();
  if (!text) return;
  wizardSolutions.push(text);
  renderSolutions();
  input.value = '';
  document.getElementById('solutions-hint').style.display = 'none';
}
function removeSolution(idx) {
  wizardSolutions.splice(idx, 1);
  renderSolutions();
}
function renderSolutions() {
  const list = document.getElementById('solutions-list');
  list.innerHTML = wizardSolutions.map((s, i) => `
    <div class="solution-item">
      <div class="solution-num">${i + 1}</div>
      <div class="solution-text">${esc(s)}</div>
      <button class="solution-remove" onclick="removeSolution(${i})" title="Remove"><i class="fas fa-times"></i></button>
    </div>
  `).join('');
}

// ── Competitor Finder ─────────────────────────────────────────────────────
async function findCompetitors() {
  const niche    = (document.getElementById('w-niche') || {}).value || state.wizardData.niche || '';
  const location = (document.getElementById('w-target-location') || {}).value || state.wizardData.target_location || '';
  const btn      = document.getElementById('find-competitors-btn');
  const results  = document.getElementById('competitor-results');

  if (!niche) { toast('Fill in the niche field first (Step 1)', 'error'); return; }

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...'; }
  if (results) results.style.display = 'none';

  try {
    const data = await api('POST', '/competitors/find', { niche, location });
    const competitors = data.competitors || [];

    if (!competitors.length) {
      toast(data.message || 'No competitors found — try a broader niche', 'error');
      return;
    }

    results.style.display = '';
    results.innerHTML = `
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;"><i class="fas fa-check-circle" style="color:#10b981;"></i> Found ${competitors.length} competitors — click to add</div>
      ${competitors.map((c, i) => `
        <div class="competitor-card" id="comp-card-${i}" onclick="selectCompetitor(${i}, '${esc(c.handle)}')">
          <div class="competitor-avatar"><i class="fab fa-instagram"></i></div>
          <div class="competitor-info">
            <div class="competitor-handle">${esc(c.handle)}</div>
            <div class="competitor-meta">${c.followers ? c.followers.toLocaleString() + ' followers' : ''} ${c.bio ? '· ' + esc(c.bio.substring(0, 60)) : ''}</div>
          </div>
          <span class="competitor-platform">Instagram</span>
        </div>
      `).join('')}
    `;
    toast(`Found ${competitors.length} competitors!`, 'success');
  } catch(e) {
    toast('Competitor search failed: ' + (e.message || ''), 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fab fa-instagram"></i> Find on Instagram'; }
  }
}

function selectCompetitor(idx, handle) {
  const card = document.getElementById('comp-card-' + idx);
  if (card) card.classList.toggle('selected');
  const input = document.getElementById('w-competitors');
  if (!input) return;
  const existing = input.value.split(',').map(s => s.trim()).filter(Boolean);
  if (existing.includes(handle)) {
    input.value = existing.filter(h => h !== handle).join(', ');
  } else {
    existing.push(handle);
    input.value = existing.join(', ');
  }
}

// ── Content Mix ───────────────────────────────────────────────────────────
function clearAllContentTypes() {
  document.querySelectorAll('#content-type-grid input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
    const card = cb.closest('.content-type-card');
    if (card) card.classList.remove('selected');
  });
  updateContentTypeCount();
}
function updateContentTypeCount() {
  const n = document.querySelectorAll('#content-type-grid input:checked').length;
  const el = document.getElementById('content-type-count');
  if (el) el.textContent = n + ' selected';
}

// ── Team Auto-suggest ─────────────────────────────────────────────────────
let _teamSuggestCache = [];
async function teamAutoSuggest(q) {
  if (q.length < 1) { closeTeamSuggest(); return; }
  try {
    const members = await api('GET', '/team/suggest?q=' + encodeURIComponent(q));
    _teamSuggestCache = members;
    const dd = document.getElementById('team-suggest-dropdown');
    if (!members.length) { closeTeamSuggest(); return; }
    dd.innerHTML = members.map((m, i) => `
      <div class="team-suggest-item" onmousedown="pickTeamSuggest(${i})">
        <div class="team-suggest-avatar">${(m.name||'?')[0].toUpperCase()}</div>
        <div>
          <div class="team-suggest-name">${esc(m.name)}</div>
          <div class="team-suggest-email">${esc(m.email)} ${m.role ? '· ' + esc(m.role) : ''}</div>
        </div>
      </div>
    `).join('');
    dd.style.display = '';
  } catch(e) { closeTeamSuggest(); }
}
function pickTeamSuggest(idx) {
  const m = _teamSuggestCache[idx];
  if (!m) return;
  document.getElementById('w-member-name').value  = m.name;
  document.getElementById('w-member-email').value = m.email;
  document.getElementById('w-member-role').value  = m.role || '';
  closeTeamSuggest();
}
function closeTeamSuggest() {
  const dd = document.getElementById('team-suggest-dropdown');
  if (dd) dd.style.display = 'none';
}

// ── Generate Calendar Modal ────────────────────────────────────────────────
function openGenerateModal(preGridId) {
  if (!can('generate')) { toast('Your role cannot generate campaigns', 'error'); return; }
  // Pre-select current project
  const sel = document.getElementById('gen-client-select');
  if (sel && state.currentProjectId) sel.value = state.currentProjectId;

  // Clear grid banner (campaign grid uses its own flow)
  const hiddenInput = document.getElementById('gen-grid-id');
  const banner      = document.getElementById('gen-grid-banner');
  if (hiddenInput) hiddenInput.value = '';
  if (banner) banner.style.display = 'none';

  openModal('generateModal');
}

// ── Reset Campaign ────────────────────────────────────────────────────────────
async function resetCampaign() {
  if (!can('generate')) { toast('Your role cannot reset campaigns', 'error'); return; }
  const calId = (document.getElementById('cg-calendar-select') || {}).value;
  if (!calId) { toast('No campaign selected to reset', 'error'); return; }

  const calLabel = (document.getElementById('cg-campaign-label') || {}).textContent || 'this campaign';
  const confirmed = await showConfirmDialog(
    '⚠️ Reset Campaign',
    `This will permanently delete ALL generated content for <strong>${calLabel.trim()}</strong> and clear the grid back to empty.<br><br>This cannot be undone. Continue?`,
    'Reset Campaign',
    'Cancel'
  );
  if (!confirmed) return;

  try {
    await api('DELETE', `/calendars/${calId}/reset`);
    toast('Campaign reset — grid cleared', 'success');
    // Reload grid
    await loadCGCalendar(calId);
  } catch(e) {
    toast('Reset failed: ' + (e.message || 'unknown error'), 'error');
  }
}

// Simple confirm dialog helper (returns Promise<bool>)
function showConfirmDialog(title, bodyHtml, okLabel, cancelLabel) {
  return new Promise(resolve => {
    // Re-use or create a tiny confirm overlay
    let el = document.getElementById('_confirm-dialog');
    if (!el) {
      el = document.createElement('div');
      el.id = '_confirm-dialog';
      el.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;';
      document.body.appendChild(el);
    }
    el.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:32px 28px;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.25);">
        <div style="font-size:18px;font-weight:700;color:#111;margin-bottom:12px;">${title}</div>
        <div style="font-size:14px;color:#374151;line-height:1.6;margin-bottom:24px;">${bodyHtml}</div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button id="_confirm-cancel" style="padding:9px 18px;border-radius:8px;border:1.5px solid #e5e7eb;background:#fff;font-size:13px;font-weight:600;cursor:pointer;">${cancelLabel}</button>
          <button id="_confirm-ok" style="padding:9px 18px;border-radius:8px;border:none;background:#ef4444;color:#fff;font-size:13px;font-weight:700;cursor:pointer;">${okLabel}</button>
        </div>
      </div>`;
    el.style.display = 'flex';
    const cleanup = () => { el.style.display = 'none'; };
    document.getElementById('_confirm-ok').onclick     = () => { cleanup(); resolve(true); };
    document.getElementById('_confirm-cancel').onclick = () => { cleanup(); resolve(false); };
  });
}

async function generateCalendar(event) {
  event.preventDefault();
  const clientId = document.getElementById('gen-client-select').value;
  if (!clientId) { toast('Select a project first', 'error'); return; }

  const goalType  = 'campaign';
  const startDate = document.getElementById('gen-start-date').value;
  const days      = parseInt(document.getElementById('gen-campaign-days').value) || 30;

  const form    = document.querySelector('#generateModal form');
  const progress= document.getElementById('gen-progress');
  const fill    = document.getElementById('gen-progress-fill');
  const progTxt = document.getElementById('gen-progress-text');

  form.style.display    = 'none';
  progress.style.display= 'block';
  progTxt.textContent   = 'Generating concepts with AI…';

  let pct = 0;
  const interval = setInterval(() => {
    pct = Math.min(pct + 2, 90);
    fill.style.width = pct + '%';
  }, 500);

  const gridId = (document.getElementById('gen-grid-id') || {}).value || null;

  try {
    const payload = { client_id: clientId, goal_type: goalType,
                      start_date: startDate, campaign_days: days };
    if (gridId) payload.grid_id = gridId;
    const res = await api('POST', '/calendars', payload);

    clearInterval(interval);
    fill.style.width = '100%';
    progTxt.textContent = `✅ Generated ${res.concepts} concepts! Now writing captions…`;

    // Phase 2: poll caption generation progress
    const calId = res.calendar_id;
    const totalConcepts = res.concepts;
    let pollCount = 0;
    const capPoll = setInterval(async () => {
      pollCount++;
      try {
        const prog = await api('GET', `/calendars/${calId}/progress`);
        const done  = prog.done  || 0;
        const total = prog.total || totalConcepts;
        const pct2  = total > 0 ? Math.round((done / total) * 100) : 0;
        fill.style.width = pct2 + '%';
        progTxt.textContent = `Writing captions… ${done}/${total} (${pct2}%)`;
        if (prog.status === 'done' || pollCount > 120) {
          clearInterval(capPoll);
          fill.style.width = '100%';
          progTxt.textContent = `✅ All done! ${totalConcepts} concepts + captions ready.`;
          setTimeout(finishGeneration, 900);
        }
      } catch(e) {
        if (pollCount > 10) { clearInterval(capPoll); finishGeneration(); }
      }
    }, 1500);

    async function finishGeneration() {
      closeModal('generateModal');
      form.style.display    = '';
      progress.style.display= 'none';
      fill.style.width      = '0%';

      await loadSidebar();
      if (clientId !== state.currentProjectId) {
        await openProject(clientId);
      } else {
        await loadProjectView(clientId);
      }

      await loadSelectedCalendar(calId);
      switchProjectTab('calendar');
      const sel = document.getElementById('cal-select-dropdown');
      if (sel) sel.value = calId;

      toast(`Calendar generated! ${totalConcepts} concepts + captions ready.`, 'success');
    }
  } catch(e) {
    clearInterval(interval);
    form.style.display    = '';
    progress.style.display= 'none';
    fill.style.width      = '0%';
    toast(e.message || 'Generation failed', 'error');
  }
}

// ── Team Member Modal ──────────────────────────────────────────────────────
function openAddMemberModal() {
  document.getElementById('member-name-input').value  = '';
  document.getElementById('member-role-input').value  = '';
  document.getElementById('member-email-input').value = '';
  openModal('addMemberModal');
}

function openAddGlobalMemberModal() { openAddMemberModal(); }

async function submitAddMember() {
  const name  = document.getElementById('member-name-input').value.trim();
  const role  = document.getElementById('member-role-input').value.trim();
  const email = document.getElementById('member-email-input').value.trim();
  if (!name) { toast('Name is required', 'error'); return; }

  const projectId = state.currentProjectId;
  if (!projectId) { toast('Select a project first', 'error'); return; }

  try {
    await api('POST', `/clients/${projectId}/members`, { name, role, email });
    closeModal('addMemberModal');
    await loadProjectView(projectId);
    toast(`${name} added to team!`, 'success');
  } catch(e) {
    toast('Failed to add member', 'error');
  }
}

// ── Milestone Modal ────────────────────────────────────────────────────────
function openAddMilestone() {
  document.getElementById('milestone-title-input').value = '';
  document.getElementById('milestone-date-input').value  = '';
  openModal('addMilestoneModal');
}

async function submitAddMilestone() {
  const title = document.getElementById('milestone-title-input').value.trim();
  const date  = document.getElementById('milestone-date-input').value;
  if (!title) { toast('Title is required', 'error'); return; }

  const projectId = state.currentProjectId;
  if (!projectId) { toast('Select a project first', 'error'); return; }

  try {
    await api('POST', '/milestones', { project_id: projectId, title, due_date: date });
    closeModal('addMilestoneModal');
    await loadProjectView(projectId);
    toast('Milestone added!', 'success');
  } catch(e) {
    toast('Failed to add milestone', 'error');
  }
}

// ── Project Settings ───────────────────────────────────────────────────────
// ── Project Menu Dropdown ─────────────────────────────────────────────────
function toggleProjectMenu() {
  const dd = document.getElementById('projectMenuDropdown');
  if (!dd) return;
  const isOpen = dd.classList.contains('open');
  dd.classList.toggle('open');
  if (!isOpen) {
    setTimeout(() => document.addEventListener('click', _closeMenuOnBlur, { once: true }), 0);
  }
}
function closeProjectMenu() {
  const dd = document.getElementById('projectMenuDropdown');
  if (dd) dd.classList.remove('open');
}
function _closeMenuOnBlur(e) {
  const wrap = document.getElementById('projectMenuWrap');
  if (wrap && !wrap.contains(e.target)) closeProjectMenu();
}
function openProjectSettings() {
  if (!state.currentProjectId || !state.currentProject) {
    toast('Open a project first', 'error');
    return;
  }
  const p = state.currentProject;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('ps-emoji',        p.emoji);
  set('ps-name',         p.name);
  set('ps-niche',        p.niche);
  set('ps-business-type', p.business_type);
  set('ps-usp',          p.unique_selling_point);
  set('ps-target-age',   p.target_age);
  set('ps-interests',    p.target_interests);
  set('ps-pain-points',  p.target_pain_points);
  const toneEl = document.getElementById('ps-tone');
  if (toneEl && p.tone_of_voice) {
    for (let i = 0; i < toneEl.options.length; i++) {
      if (toneEl.options[i].value === p.tone_of_voice || toneEl.options[i].text === p.tone_of_voice) {
        toneEl.selectedIndex = i; break;
      }
    }
  }
  openModal('projectSettingsModal');
}

async function saveProjectSettings() {
  const name = (document.getElementById('ps-name') || {}).value || '';
  if (!name.trim()) { toast('Project name is required', 'error'); return; }
  const data = {
    name:                 name.trim(),
    emoji:                (document.getElementById('ps-emoji') || {}).value || '',
    niche:                (document.getElementById('ps-niche') || {}).value || '',
    business_type:        (document.getElementById('ps-business-type') || {}).value || '',
    unique_selling_point: (document.getElementById('ps-usp') || {}).value || '',
    target_age:           (document.getElementById('ps-target-age') || {}).value || '',
    target_interests:     (document.getElementById('ps-interests') || {}).value || '',
    target_pain_points:   (document.getElementById('ps-pain-points') || {}).value || '',
    tone_of_voice:        (document.getElementById('ps-tone') || {}).value || '',
  };
  try {
    const updated = await api('PUT', `/clients/${state.currentProjectId}`, data);
    state.currentProject = { ...state.currentProject, ...data };
    // Refresh header name + emoji
    const nameEl = document.getElementById('project-name-header');
    if (nameEl) nameEl.textContent = data.name;
    const emojiEl = document.getElementById('project-emoji');
    if (emojiEl && data.emoji) emojiEl.textContent = data.emoji;
    const nicheEl = document.getElementById('project-niche-header');
    if (nicheEl && data.niche) nicheEl.textContent = data.niche;
    closeModal('projectSettingsModal');
    toast('Project settings saved', 'success');
    await loadSidebar();
  } catch(e) {
    toast('Save failed: ' + e.message, 'error');
  }
}

// ── Delete Project ────────────────────────────────────────────────────────
async function confirmDeleteProject() {
  if (!can('deleteContent')) { toast('Only Admins can delete projects', 'error'); return; }
  const name = (document.getElementById('project-name-header') || {}).textContent || 'this project';
  const ok = confirm(`Delete "${name}"?\n\nThis will permanently remove the project and all 30 days of content. This cannot be undone.`);
  if (!ok) return;
  try {
    await api('DELETE', `/clients/${state.currentProjectId}`);
    toast('Project deleted', 'success');
    state.currentProjectId = null;
    showView('view-home');
    await loadSidebar();
  } catch(e) {
    toast('Delete failed: ' + e.message, 'error');
  }
}

// ── Content Strategy Modal ────────────────────────────────────────────────
let _csProjectId = null;
async function openContentStrategy() {
  if (!state.currentProjectId) { toast('Open a project first', 'error'); return; }
  openModal('contentStrategyModal');
  if (_csProjectId !== state.currentProjectId) {
    await reloadContentStrategy();
  }
}
async function reloadContentStrategy() {
  if (!state.currentProjectId) return;
  _csProjectId = null;
  const loadEl    = document.getElementById('cs-loading');
  const contentEl = document.getElementById('cs-content');
  loadEl.style.display    = 'block';
  loadEl.innerHTML        = '<i class="fas fa-spinner fa-spin cs-loading-icon"></i><p>Generating strategy ideas for your business… <span style="font-size:12px;color:#9ca3af;">(takes ~20 seconds)</span></p>';
  contentEl.style.display = 'none';
  try {
    const data = await api('POST', `/clients/${state.currentProjectId}/content-strategy`);
    renderContentStrategy(data);
    _csProjectId = state.currentProjectId;
  } catch(e) {
    loadEl.innerHTML = `<div style="color:#ef4444;padding:20px;"><i class="fas fa-times-circle"></i> Failed to generate: ${esc(e.message)}</div>`;
  }
}
function renderContentStrategy(data) {
  const vbEl = document.getElementById('cs-valuebombs');
  const gfEl = document.getElementById('cs-godfather');

  vbEl.innerHTML = (data.value_bombs || []).map(b => `
    <div class="cs-card" onclick="this.classList.toggle('selected')">
      <div class="cs-card-badge">${esc(b.format || 'Content')}</div>
      <div class="cs-card-title">${esc(b.title)}</div>
      <div class="cs-card-desc">${esc(b.description)}</div>
      <div class="cs-card-why"><i class="fas fa-bolt"></i>&nbsp;${esc(b.why_they_need_it)}</div>
    </div>`).join('');

  gfEl.innerHTML = (data.godfather_offers || []).map(o => `
    <div class="cs-card" onclick="this.classList.toggle('selected')">
      <div class="cs-card-badge offer-badge">${esc(o.value_stack || 'Offer')}</div>
      <div class="cs-card-title">${esc(o.title)}</div>
      <div class="cs-card-desc">${esc(o.what_you_get)}</div>
      <div class="cs-card-why"><i class="fas fa-fire"></i>&nbsp;${esc(o.irresistible_hook)}</div>
    </div>`).join('');

  document.getElementById('cs-loading').style.display  = 'none';
  document.getElementById('cs-content').style.display  = 'block';
}

// ── Modal Helpers ──────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
// Close modal on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ── Goal Card Toggle ───────────────────────────────────────────────────────
function wireGoalCards() {
  document.querySelectorAll('.goal-card input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const name = radio.name;
      document.querySelectorAll(`.goal-card input[name="${name}"]`).forEach(r => {
        r.closest('.goal-card').classList.toggle('active', r.checked);
      });
    });
  });

  // Content type card checkboxes — full user control, count updates
  document.querySelectorAll('.content-type-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      const cb = card.querySelector('input[type="checkbox"]');
      if (cb) cb.checked = card.classList.contains('selected');
      updateContentTypeCount();
    });
  });
  updateContentTypeCount();
}

// ── View Calendar (from overview/list) ───────────────────────────────────
function viewCalendar(calId) {
  switchProjectTab('calendar');
  const sel = document.getElementById('cal-select-dropdown');
  if (sel) sel.value = calId;
  loadSelectedCalendar(calId);
}

// ── Helpers ───────────────────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(str) {
  if (!str) return '';
  try {
    return new Date(str + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' });
  } catch(e) { return str; }
}

function timeAgo(str) {
  if (!str) return '';
  try {
    const diff = Date.now() - new Date(str).getTime();
    if (diff < 60000)    return 'Just now';
    if (diff < 3600000)  return Math.floor(diff/60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
    return Math.floor(diff/86400000) + 'd ago';
  } catch(e) { return ''; }
}

function getTypeBadge(type) {
  const map = {
    'Value Bomb':        { cls:'badge-value-bomb', emoji:'💡' },
    'Free PDF Bomb':     { cls:'badge-pdf',        emoji:'📄' },
    'Template Drop':     { cls:'badge-pdf',        emoji:'📋' },
    'Secret Video':      { cls:'badge-secret',     emoji:'🎬' },
    'Carousel Tutorial': { cls:'badge-carousel',   emoji:'🎠' },
    'Tutorial Reel':     { cls:'badge-carousel',   emoji:'🎓' },
    'Q&A Bomb':          { cls:'badge-value-bomb', emoji:'❓' },
    'Behind the Scenes': { cls:'badge-secret',     emoji:'🎥' },
    'Godfather Offer':   { cls:'badge-godfather',  emoji:'🤝' },
    'Flash Sale':        { cls:'badge-godfather',  emoji:'⚡' },
    'Bundle Deal':       { cls:'badge-godfather',  emoji:'📦' },
  };
  return map[type] || { cls:'badge-default', emoji:'📌' };
}

function getStatusColor(status) {
  const map = { idea:'#9ca3af', assigned:'#3b82f6', in_progress:'#f59e0b', submitted:'#8b5cf6', approved:'#10b981', published:'#ec4899' };
  return map[status] || '#9ca3af';
}

// ── Floating AI Chat ──────────────────────────────────────────────────────
const chatHistory = [];

function toggleAIChat() {
  const panel = document.getElementById('ai-chat-panel');
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) {
    setTimeout(() => {
      const input = document.getElementById('ai-chat-input');
      if (input) input.focus();
    }, 250);
  }
}

function appendChatMsg(role, text) {
  const container = document.getElementById('ai-chat-messages');
  const div = document.createElement('div');
  div.className = 'ai-msg ' + role;
  div.innerHTML = esc(text).replace(/\n/g, '<br>');
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

async function sendChatMessage() {
  const input = document.getElementById('ai-chat-input');
  const text = (input.value || '').trim();
  if (!text) return;

  input.value = '';
  appendChatMsg('user', text);
  chatHistory.push({ role: 'user', content: text });

  const thinking = appendChatMsg('ai', '…');
  thinking.style.opacity = '0.5';

  try {
    let context = state.currentProject
      ? `Current project: ${state.currentProject.name} | Niche: ${state.currentProject.niche || ''} | Goal: ${state.currentProject.goal_type || ''}`
      : 'No project selected yet.';
    if (_activeConceptId && state.currentCalendarData) {
      const ac = (state.currentCalendarData.concepts || []).find(x => x.id === _activeConceptId);
      if (ac) context += ` | Open post: Day ${ac.day} — "${ac.hook}" | Format: ${ac.format || 'Reel'} | Platform: ${ac.platform || 'Instagram'} | Type: ${ac.content_type || ''} | Status: ${ac.status || 'idea'}`;
    }

    const res = await api('POST', '/ai/chat', {
      message: text,
      history: chatHistory.slice(-10),
      context
    });

    thinking.remove();
    const reply = res.reply || 'Sorry, I could not respond.';
    appendChatMsg('ai', reply);
    chatHistory.push({ role: 'assistant', content: reply });
  } catch(e) {
    thinking.remove();
    appendChatMsg('ai', 'Error: ' + (e.message || 'Something went wrong. Try again.'));
  }
}

// ── API Helper ────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  let data;
  try {
    data = await res.json();
  } catch(e) {
    // Server returned non-JSON (HTML error page or redirect)
    if (res.status === 401 || res.redirected) {
      throw new Error('Session expired — please refresh the page and log in again');
    }
    throw new Error(`Server error (HTTP ${res.status}) — please refresh and try again`);
  }
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

/* ═══════════════════════════════════════════════════════════════════════
   TASK TIMER
   ═══════════════════════════════════════════════════════════════════════ */
const _timer = {
  id: null, running: false, paused: false,
  elapsed: 0, startedAt: 0, intervalId: null, snapIntervalId: null
};

function toggleTimerWidget() {
  const w = document.getElementById('task-timer-widget');
  const body = document.getElementById('timer-widget-body');
  const chevron = document.getElementById('timer-chevron');
  const collapsed = w.classList.toggle('collapsed');
  body.style.display = collapsed ? 'none' : '';
  chevron.className = collapsed ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
  // Also load today's work log whenever opened
  if (!collapsed) loadTodayTimerLog();
}

async function timerStart() {
  const name = document.getElementById('timer-task-input').value.trim() || 'Work Session';
  const clientId = state.currentProjectId || '';
  try {
    const res = await api('POST', '/timers', { task_name: name, client_id: clientId });
    _timer.id = res.id;
    _timer.running = true; _timer.paused = false;
    _timer.elapsed = 0; _timer.startedAt = Date.now();
    document.getElementById('timer-start-btn').style.display = 'none';
    document.getElementById('timer-stop-btn').style.display = '';
    document.getElementById('timer-task-input').disabled = true;
    document.getElementById('task-timer-widget').classList.add('running');
    _timer.intervalId = setInterval(timerTick, 1000);
    // Auto screenshot every 5 minutes
    _timer.snapIntervalId = setInterval(async () => {
      if (_timer.running && !_timer.paused && _timer.id) {
        await timerSnap(true);
      }
    }, 300000); // 5 min
    toast('Timer started ⏱️');
  } catch(e) { toast('Timer error: ' + e.message, 'error'); }
}

function timerTick() {
  if (_timer.paused) return;
  _timer.elapsed = Math.floor((Date.now() - _timer.startedAt) / 1000);
  const h = Math.floor(_timer.elapsed / 3600);
  const m = Math.floor((_timer.elapsed % 3600) / 60);
  const s = _timer.elapsed % 60;
  document.getElementById('timer-display').textContent =
    `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

async function timerStop() {
  if (!_timer.id) return;
  clearInterval(_timer.intervalId);
  clearInterval(_timer.snapIntervalId);
  _timer.running = false;
  const dur = _timer.elapsed;
  try {
    await api('PUT', `/timers/${_timer.id}`, { status: 'stopped', duration_seconds: dur });
    toast(`Session saved: ${fmtSec(dur)} ✅`, 'success');
    addTimerSessionToLog(document.getElementById('timer-task-input').value.trim() || 'Work Session', dur);
  } catch(e) {}
  document.getElementById('timer-start-btn').style.display = '';
  document.getElementById('timer-stop-btn').style.display = 'none';
  document.getElementById('timer-task-input').disabled = false;
  document.getElementById('task-timer-widget').classList.remove('running');
  document.getElementById('timer-display').textContent = '00:00:00';
  _timer.id = null; _timer.elapsed = 0;
}

function timerPause() {
  if (!_timer.running) return;
  _timer.paused = !_timer.paused;
  const btn = document.getElementById('timer-pause-btn');
  btn.innerHTML = _timer.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
  btn.title = _timer.paused ? 'Resume' : 'Pause';
  if (!_timer.paused) {
    // Adjust start time to account for pause
    _timer.startedAt = Date.now() - (_timer.elapsed * 1000);
  }
}

async function timerSnap(silent) {
  if (!_timer.id) { if (!silent) toast('Start a timer first', 'error'); return; }
  try {
    const res = await api('POST', `/timers/${_timer.id}/screenshot`);
    if (!silent) toast('Screenshot captured 📸');
    addSnapThumb(res.url, res.id);
  } catch(e) {
    if (!silent) toast('Screenshot failed: ' + e.message, 'error');
  }
}

function addSnapThumb(url, id) {
  const strip = document.getElementById('timer-screenshot-strip');
  const img = document.createElement('img');
  img.className = 'snap-thumb';
  img.src = url;
  img.title = 'Click to view full size';
  img.onclick = () => window.open(url, '_blank');
  strip.insertBefore(img, strip.firstChild);
  if (strip.children.length > 6) strip.removeChild(strip.lastChild);
}

function addTimerSessionToLog(name, dur) {
  const log = document.getElementById('timer-session-log');
  const div = document.createElement('div');
  div.className = 'timer-log-item';
  div.innerHTML = `<i class="fas fa-check-circle" style="color:var(--green)"></i> <strong>${esc(name)}</strong> — ${fmtSec(dur)}`;
  log.insertBefore(div, log.firstChild);
  if (log.children.length > 5) log.removeChild(log.lastChild);
}

async function loadTodayTimerLog() {
  const log = document.getElementById('timer-session-log');
  if (!log) return;
  try {
    const rows = await api('GET', '/timers?limit=20');
    const today = new Date().toDateString();
    const todayRows = (rows || []).filter(r => {
      if (!r.started_at) return false;
      return new Date(r.started_at).toDateString() === today;
    });
    if (!todayRows.length) {
      log.innerHTML = '<div style="font-size:11px;color:#6b7280;padding:4px 0;">No sessions today yet</div>';
      return;
    }
    log.innerHTML = todayRows.slice(0, 8).map(r => {
      const dur = r.duration_seconds ? fmtSec(r.duration_seconds) : (r.status === 'running' ? 'Running…' : '—');
      const who = r.user_email ? r.user_email.split('@')[0] : 'You';
      return `<div class="timer-log-item">
        <i class="fas fa-check-circle" style="color:#10b981"></i>
        <strong>${esc(r.task_name||'Work Session')}</strong> — ${dur}
        <span style="font-size:10px;color:#6b7280;margin-left:4px;">by ${esc(who)}</span>
      </div>`;
    }).join('');
  } catch(e) { /* silently ignore */ }
}

function fmtSec(sec) {
  const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = sec%60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function startTimerForConcept(conceptId, hookText) {
  const w = document.getElementById('task-timer-widget');
  const inp = document.getElementById('timer-task-input');
  inp.value = hookText.slice(0,60);
  w.classList.remove('collapsed');
  document.getElementById('timer-widget-body').style.display = '';
  document.getElementById('timer-chevron').className = 'fas fa-chevron-down';
  if (!_timer.running) timerStart();
  toast('Timer ready ⏱️');
}

// Init user info on load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const me = await fetch('/api/me').then(r => r.json());
    const av = document.getElementById('sidebar-user-avatar');
    const nm = document.querySelector('#sidebar-user-info .sidebar-user-name');
    const em = document.querySelector('#sidebar-user-info .sidebar-user-email');
    if (av) { av.textContent = (me.name||'G')[0].toUpperCase(); if (me.picture) { av.style.backgroundImage=`url(${me.picture})`; av.style.backgroundSize='cover'; av.textContent=''; } }
    if (nm) nm.textContent = me.name || 'Guest';
    if (em) em.textContent = me.email || '';
  } catch(e) {}
  // Expand timer widget on load so it's visible but minimized
  const w = document.getElementById('task-timer-widget');
  if (w) { w.classList.add('collapsed'); document.getElementById('timer-widget-body').style.display='none'; }
});


/* ═══════════════════════════════════════════════════════════════════════
   CAMPAIGN GRID  (3-column × date-row model)
   ═══════════════════════════════════════════════════════════════════════ */

// Legacy grid calendar modal (keep for compatibility)
let _gridTemplates = [];
let _selectedGrid  = null;
let _gridSlots     = [];

async function openGridCalendar() {
  openModal('gridCalendarModal');
  showGridStep(1);
  if (!_gridTemplates.length) {
    try {
      _gridTemplates = await api('GET', '/grids/templates');
    } catch(e) { toast('Failed to load grid templates', 'error'); return; }
  }
  renderGridTemplates();
}
function renderGridTemplates() {
  const el = document.getElementById('grid-template-list');
  if (!el) return;
  el.innerHTML = _gridTemplates.map(g => `
    <div class="grid-template-card" onclick="selectGrid('${g.id}')">
      <div class="gtc-icon">${g.icon}</div>
      <div class="gtc-body">
        <div class="gtc-name">${esc(g.name)}</div>
        <div class="gtc-desc">${esc(g.description)}</div>
        <div class="gtc-slots">
          ${(g.slots||[]).map((s,i) => `<span class="gtc-slot" style="background:${(g.colors||[])[i]||'#6366f1'}20;color:${(g.colors||[])[i]||'#6366f1'};border:1px solid ${(g.colors||[])[i]||'#6366f1'}40;">${s}</span>`).join('')}
        </div>
      </div>
      <i class="fas fa-chevron-right" style="color:#d1d5db;align-self:center;"></i>
    </div>
  `).join('');
}

// ── Campaign Grid state ────────────────────────────────────────────────
let _cgCalendarId  = null;
let _cgDays        = 30;
let _cgStartDate   = null;
let _cgConcepts    = {};   // key: "day-gridIndex" → concept object
let _cgGrids       = [
  { grid_index: 0, name: 'Value Content',  color: '#6366f1', icon: '💎', content_types: ['Value Bomb','Carousel Tutorial','Tutorial Reel'] },
  { grid_index: 1, name: 'Growth Content', color: '#10b981', icon: '📚', content_types: ['Problem-Solution','Industry Insight','Myth-Bust','How-It-Works','Step-by-Step Guide'] },
  { grid_index: 2, name: 'Sales Content',  color: '#f59e0b', icon: '🔥', content_types: ['Service Spotlight','Outcome Proof','Expertise Showcase','Direct Offer','Booking Push'] },
];

// Rotation: for a given day, which 2 grids are active and what timing
function cgRotation(day) {
  const cycle = (day - 1) % 3;
  return [
    { gridIndex: cycle,       timing: 'AM' },
    { gridIndex: (cycle+1)%3, timing: 'PM' },
  ];
}
function cgGetSlot(day, gi) {
  return cgRotation(day).find(r => r.gridIndex === gi) || null; // null = rest
}

// Load campaign grids config for a calendar
async function loadCGGrids(calId) {
  try {
    const grids = await api('GET', `/calendars/${calId}/campaign-grids`);
    if (grids && grids.length === 3) _cgGrids = grids;
  } catch(e) {}
  renderCGPills();
}

// Render the 3 grid pills in the setup bar
function renderCGPills() {
  const el = document.getElementById('cg-grid-pills');
  if (!el) return;
  el.innerHTML = _cgGrids.map((g, i) => {
    const letter = String.fromCharCode(65 + i);
    return `<div class="cg-grid-pill" style="background:${g.color}18;color:${g.color};border-color:${g.color}40;"
              onclick="openCGGridEditor()"
              title="Click to configure">
              ${g.icon || letter} ${esc(g.name)}
            </div>`;
  }).join('');
}

// Load a specific calendar into the campaign grid
async function loadCGCalendar(calId) {
  if (!calId) {
    document.getElementById('cg-table-outer').innerHTML =
      `<div class="cg-empty-state" id="cg-empty-state">
        <i class="fas fa-calendar-plus"></i>
        <p>Generate a campaign to see the 3-column grid</p>
        <button class="btn-primary" onclick="openGenerateModal()"><i class="fas fa-magic"></i> Generate Campaign</button>
      </div>`;
    return;
  }
  _cgCalendarId = calId;
  state.currentCalendarId = calId;

  // Load calendar data
  try {
    const data = await api('GET', `/calendars/${calId}`);
    state.currentCalendarData = data;
    _cgDays = data.campaign_days || 30;

    // Parse start date from calendar month
    const m = data.month || '';
    _cgStartDate = m.length === 7 ? m + '-01' : m;

    // Load grid configs FIRST — we need _cgGrids to be up-to-date before building the concept map
    await loadCGGrids(calId);

    // Build concept lookup by day + grid (after grids are loaded so names match)
    // One concept per slot — if duplicates exist in DB, keep the one with more content (longer hook)
    _cgConcepts = {};
    (data.concepts || []).forEach(c => {
      const gName = c.grid_slot_type || '';
      // Exact name match first, then grid_index fallback for legacy rows
      let gi = _cgGrids.findIndex(g => g.name === gName);
      if (gi < 0 && c.grid_index != null) gi = c.grid_index;
      if (gi < 0) return; // can't place — skip
      const key = `${c.day}-${gi}`;
      const prev = _cgConcepts[key];
      // Keep whichever has a longer / more complete hook (de-dup safety net)
      if (!prev || (c.hook || '').length >= (prev.hook || '').length) {
        _cgConcepts[key] = c;
      }
    });

    // Render
    renderCGTable();

    // Scroll to today's row (first row that is today or in the future)
    setTimeout(() => {
      const todayRow = document.querySelector('.cg-row:not(.cg-row--past)');
      if (todayRow) todayRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);

    // Update label
    const label = document.getElementById('cg-campaign-label');
    if (label) label.textContent = `${_cgDays} days · ${data.goal_type || 'followers'} focus`;

    // Show campaign bar
    const bar = document.getElementById('cg-cal-bar');
    if (bar) bar.style.display = '';
    const sel = document.getElementById('cg-calendar-select');
    if (sel) sel.value = calId;

  } catch(e) {
    toast('Failed to load campaign: ' + e.message, 'error');
  }
}

// Main table renderer
function renderCGTable() {
  const outer = document.getElementById('cg-table-outer');
  if (!outer) return;

  if (!_cgCalendarId) {
    outer.innerHTML = `<div class="cg-empty-state" id="cg-empty-state">
      <i class="fas fa-calendar-plus"></i>
      <p>Generate a campaign to see the 3-column grid</p>
      <button class="btn-primary" onclick="openGenerateModal()"><i class="fas fa-magic"></i> Generate Campaign</button>
    </div>`;
    return;
  }

  const startDt = _cgStartDate ? new Date(_cgStartDate + 'T00:00:00') : new Date();
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);

  // Header
  const thDate = `<th class="cg-thead cg-th-date" style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid var(--border);background:var(--bg-secondary);position:sticky;top:0;z-index:2;color:var(--text-muted);width:100px;">Date</th>`;
  const thGrids = _cgGrids.map((g, i) => `
    <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;border-bottom:2px solid ${g.color};border-top:3px solid ${g.color};background:${g.color}10;position:sticky;top:0;z-index:2;min-width:180px;">
      <div style="color:${g.color};font-size:13px;">${g.icon || String.fromCharCode(65+i)} ${esc(g.name)}</div>
      <div style="color:${g.color}99;font-size:10px;font-weight:400;margin-top:2px;">${(g.content_types||[]).slice(0,2).join(' · ')}</div>
    </th>`).join('');

  // Rows
  const rows = Array.from({length: _cgDays}, (_, idx) => {
    const day = idx + 1;
    const dt  = new Date(startDt); dt.setDate(dt.getDate() + idx);
    const isPast = dt < todayMidnight;
    const isToday = dt.toDateString() === todayMidnight.toDateString();
    const dStr = dt.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
    const rotation = cgRotation(day);

    const cells = _cgGrids.map((g, gi) => {
      const slot    = rotation.find(r => r.gridIndex === gi);
      const concept = _cgConcepts[`${day}-${gi}`];

      if (!slot) {
        // Rest day for this grid
        return `<td class="cg-cell cg-cell--rest${isPast ? ' cg-cell--past' : ''}" style="border-right:1px solid var(--border);"></td>`;
      }

      if (concept) {
        // Filled — read-only in grid, click opens concept modal
        const fmt         = fmtLabel(concept.format);
        const offerSnippet = concept.idea_brief && concept.idea_brief !== concept.hook
          ? `<div class="cg-concept-offer" title="${esc(concept.idea_brief)}">🎯 ${esc(concept.idea_brief.length > 45 ? concept.idea_brief.slice(0,42)+'…' : concept.idea_brief)}</div>`
          : '';
        const fmtBadge = `<div style="margin-top:4px;font-size:9px;font-weight:600;color:${fmt.color};opacity:.85;">${fmt.icon} ${fmt.label}</div>`;
        if (isPast) {
          return `<td class="cg-cell cg-cell--filled cg-cell--past" style="border-right:1px solid var(--border);background:${g.color}05;">
                    <div class="cg-timing-badge" style="background:${g.color}15;color:${g.color}99;">${slot.timing}</div>
                    <div class="cg-concept-hook" style="opacity:.7;">${esc(concept.hook||'')}</div>
                    <div class="cg-concept-type" style="opacity:.6;">${esc(concept.content_type||'')}</div>
                    ${fmtBadge}${offerSnippet}
                    <div class="cg-past-lock"><i class="fas fa-lock"></i> Past</div>
                  </td>`;
        }
        // Future/today filled cell — click to view detail (read-only)
        return `<td class="cg-cell cg-cell--filled cg-cell--readonly" style="border-right:1px solid var(--border);cursor:pointer;background:${g.color}08;"
                    onclick="openConceptModal('${concept.id}')">
                  <div class="cg-timing-badge" style="background:${g.color}20;color:${g.color};">${slot.timing}</div>
                  <div class="cg-concept-hook">${esc(concept.hook||'')}</div>
                  <div class="cg-concept-type">${esc(concept.content_type||'')}</div>
                  ${fmtBadge}${offerSnippet}
                  <div class="cg-grid-view-hint"><i class="fas fa-eye"></i> View</div>
                </td>`;
      }

      // Empty cell
      if (isPast) {
        return `<td class="cg-cell cg-cell--empty cg-cell--past" style="border-right:1px solid var(--border);">
                  <div class="cg-timing-badge" style="background:${g.color}15;color:${g.color}99;">${slot.timing}</div>
                  <div class="cg-past-lock"><i class="fas fa-lock"></i> Past</div>
                </td>`;
      }

      // Empty — click to generate directly in grid
      return `<td class="cg-cell cg-cell--empty cg-cell--generate" style="border-right:1px solid var(--border);cursor:pointer;"
                  onclick="openCGPanel(${day},${gi})">
                <div class="cg-timing-badge" style="background:${g.color}15;color:${g.color}99;">${slot.timing}</div>
                <div class="cg-go-board-hint" style="color:${g.color}99;">
                  <i class="fas fa-plus-circle"></i> Click to generate
                </div>
              </td>`;
    }).join('');

    const todayHighlight = isToday ? ' style="background:var(--primary)08;border-left:3px solid var(--primary);"' : '';
    const pastRowStyle   = isPast  ? ' style="opacity:.5;"' : '';

    return `<tr class="cg-row${isPast ? ' cg-row--past' : ''}">
      <td class="cg-date-td"${isToday ? ' style="border-left:3px solid var(--primary);"' : ''}>
        <div class="cg-date-num"${isToday ? ' style="color:var(--primary);font-weight:800;"' : isPast ? ' style="opacity:.5;"' : ''}>${day}</div>
        <div class="cg-date-text"${isToday ? ' style="color:var(--primary);font-weight:600;"' : ''}>${dStr}${isToday ? ' <span style="font-size:9px;background:var(--primary);color:#fff;padding:1px 5px;border-radius:8px;">TODAY</span>' : ''}</div>
      </td>
      ${cells}
    </tr>`;
  }).join('');

  outer.innerHTML = `
    <table class="cg-table">
      <thead><tr>${thDate}${thGrids}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ── Campaign panel state ───────────────────────────────────────────────
let _cgPanel = {
  day: null, gi: null, step: 1,
  offerText: '', selectedFormats: new Set(),
  lastResult: null,
  offerSelectedIdx: -1,         // legacy single-select (kept for compat)
  offerSelectedIdxSet: new Set(), // multi-select pool picks
  offerPickSet: new Set(),        // multi-select when building/adding to pool
  bulkOffers: []                  // ordered list of offers for bulk generation
};

// Per-grid offer pools — keyed by grid index (0=Value, 1=Growth, 2=Sales)
// Each grid has its own completely separate pool with different offer strategies
let _cgOfferPools = { 0: [], 1: [], 2: [] };
let _cgPickOffers = [];   // fresh offers shown when building/refreshing pool (for current gi)

// Convenience getter/setter for current panel's grid
function _cgPool()      { return _cgOfferPools[_cgPanel.gi] || []; }
function _cgSetPool(arr){ _cgOfferPools[_cgPanel.gi] = arr || []; }

const CG_FORMATS = [
  { key: 'carousel',    icon: '📱', label: 'Carousel',    sub: 'Slides (Canva)' },
  { key: 'single_post', icon: '🖼️', label: 'Single Post', sub: 'Image (Canva)' },
  { key: 'video_heygen',icon: '🎬', label: 'Video Reel',  sub: 'AI Avatar (HeyGen)' },
  { key: 'video_canva', icon: '🎥', label: 'Video Reel',  sub: 'Template (Canva)' },
];

// Open the day panel for a specific cell
// Called from grid empty cells: switch to Board tab then open CG panel
function goToBoardGenerate(day, gi) {
  switchProjectTab('board');
  // Small delay so the board tab renders before we try to open the panel
  setTimeout(() => openCGPanel(day, gi), 80);
}

async function openCGPanel(day, gi) {
  // Guard: past dates cannot be edited
  if (_cgStartDate) {
    const startDt = new Date(_cgStartDate + 'T00:00:00');
    const cellDt  = new Date(startDt); cellDt.setDate(cellDt.getDate() + day - 1);
    const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
    if (cellDt < todayMid) {
      toast('Past dates cannot be edited', 'error');
      return;
    }
  }

  const panel = document.getElementById('cg-day-panel');
  if (!panel) return;

  _cgPanel.day = day; _cgPanel.gi = gi;
  _cgPanel.step = 1; _cgPanel.offerText = '';
  _cgPanel.selectedFormats = new Set();
  _cgPanel.lastResult = null;
  _cgPanel.offerSelectedIdx = -1;
  _cgPanel.offerSelectedIdxSet = new Set();
  _cgPanel.offerPickSet = new Set();
  _cgPanel.bulkOffers = [];

  panel.classList.add('open');
  _renderCGStep1Loading('Loading offer pool…');

  if (!_cgCalendarId) return;
  try {
    const poolRes = await api('GET', `/calendars/${_cgCalendarId}/offer-pool?grid_index=${gi}`);
    _cgSetPool(poolRes.offers || []);

    if (_cgPool().length > 0) {
      // Pool exists — show it, auto-highlight today's rotation pick
      const rotIdx = (day - 1) % _cgPool().length;
      _cgPanel.offerSelectedIdx = rotIdx;
      _cgPanel.offerText = _cgPool()[rotIdx]?.offer_text || '';
      _renderCGStep1Pool();
    } else {
      // No pool yet — generate 10 offers to build one
      _renderCGStep1Loading('Generating 10 offer ideas…');
      const res = await api('GET', `/calendars/${_cgCalendarId}/offer-suggest?day=${day}&grid_index=${gi}&count=10`);
      _cgPickOffers = res.offers || [];
      _renderCGStep1Pick(false);
    }
  } catch(e) {
    _renderCGStep1Loading('Could not load — close and try again.');
  }
}

function closeCGPanel() {
  const panel = document.getElementById('cg-day-panel');
  if (panel) panel.classList.remove('open');
}

function _cgPanelMeta() {
  const g = _cgGrids[_cgPanel.gi] || {};
  const startDt = _cgStartDate ? new Date(_cgStartDate + 'T00:00:00') : new Date();
  const dt = new Date(startDt); dt.setDate(dt.getDate() + _cgPanel.day - 1);
  const dStr = dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const slot = cgGetSlot(_cgPanel.day, _cgPanel.gi);
  return { g, dStr, timing: slot ? slot.timing : 'AM' };
}

function _cgPanelHeader(stepNum) {
  const { g, dStr } = _cgPanelMeta();
  const steps = ['Confirm Offer', 'Choose Formats', 'Your Content'];
  const dots  = steps.map((s, i) => {
    const cls = i + 1 === stepNum ? 'cg-step-dot cg-step-dot--active' :
                i + 1 < stepNum  ? 'cg-step-dot cg-step-dot--done' : 'cg-step-dot';
    return `<div class="${cls}" title="${s}">${i + 1 < stepNum ? '✓' : i + 1}</div>`;
  }).join('<div class="cg-step-line"></div>');
  return `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px;">
      <div>
        <div class="cg-panel-day-label">Day ${_cgPanel.day}</div>
        <div class="cg-panel-day-title">${dStr}</div>
        <div class="cg-panel-grid-badge" style="background:${g.color||'#6366f1'}18;color:${g.color||'#6366f1'};">
          ${g.icon||''} ${esc(g.name||'')} · <strong>${_cgPanelMeta().timing}</strong>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div class="cg-step-indicator" style="justify-content:flex-end;">${dots}</div>
        <div class="cg-step-label" style="margin-top:4px;">Step ${stepNum} of 3 — ${steps[stepNum-1]}</div>
      </div>
    </div>`;
}

// ── Step 1: Offer Pool ─────────────────────────────────────────────────

function _renderCGStep1Loading(msg) {
  const body = document.getElementById('cg-panel-body');
  if (!body) return;
  body.innerHTML = `
    ${_cgPanelHeader(1)}
    <div style="text-align:center;padding:48px 0;color:var(--text-secondary);">
      <i class="fas fa-spinner fa-spin" style="font-size:22px;margin-bottom:12px;display:block;"></i>
      <div style="font-size:13px;">${esc(msg || 'Loading…')}</div>
    </div>`;
}

// ── POOL VIEW: multi-select — pick 1 for today or N for next N days ──────────
function _renderCGStep1Pool() {
  const body = document.getElementById('cg-panel-body');
  if (!body) return;
  const selSet = _cgPanel.offerSelectedIdxSet;
  const cnt    = selSet.size;

  const cards = _cgPool().map((o, i) => {
    const sel = selSet.has(i);
    return `
    <div class="cg-offer-card ${sel ? 'cg-offer-card--sel' : ''}" onclick="_cgTogglePoolOffer(${i})">
      <div class="cg-offer-card-check">${sel ? '<i class="fas fa-check"></i>' : ''}</div>
      ${o.hook_line ? `<div class="cg-offer-card-hook">${esc(o.hook_line)}</div>` : ''}
      <div class="cg-offer-card-text">${esc(o.offer_text||'')}</div>
      ${o.urgency ? `<div class="cg-offer-card-urgency"><i class="fas fa-bolt"></i> ${esc(o.urgency)}</div>` : ''}
      <button class="cg-offer-card-del" onclick="event.stopPropagation();_cgDeletePoolOffer('${o.id}',${i})" title="Remove">✕</button>
    </div>`;
  }).join('');

  const btnLabel = cnt === 0 ? 'Select an offer to continue'
    : cnt === 1 ? 'Use This Offer <i class="fas fa-arrow-right"></i>'
    : `Generate for ${cnt} Days <i class="fas fa-arrow-right"></i>`;

  const hintText = cnt === 0
    ? '<i class="fas fa-hand-pointer" style="margin-right:4px;"></i>Tap 1 offer to generate today. Tap multiple to fill consecutive days.'
    : cnt === 1
    ? `<i class="fas fa-check-circle" style="color:#10b981;margin-right:4px;"></i>Generating content for <strong>Day ${_cgPanel.day}</strong>`
    : `<i class="fas fa-calendar-check" style="color:#10b981;margin-right:4px;"></i><strong>${cnt} offers</strong> selected → will fill Days ${_cgPanel.day}–${_cgPanel.day + cnt - 1} in sequence`;

  body.innerHTML = `
    ${_cgPanelHeader(1)}
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
      <div>
        <span style="font-size:13px;font-weight:600;"><i class="fas fa-layer-group" style="color:#6366f1;margin-right:5px;"></i>
          ${['Value Pool','Edu Pool','Sales Pool'][_cgPanel.gi] || 'Offer Pool'}
        </span>
        <span style="font-size:10px;padding:2px 7px;border-radius:20px;background:${['#6366f120','#10b98120','#f59e0b20'][_cgPanel.gi]||'var(--bg-secondary)'};color:${['#6366f1','#10b981','#f59e0b'][_cgPanel.gi]||'var(--text-secondary)'};margin-left:6px;">
          ${['Value Content','Growth Content','Sales Content'][_cgPanel.gi]||''}
        </span>
        <span style="font-size:11px;color:var(--text-secondary);margin-left:6px;">${_cgPool().length} saved</span>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="cg-offer-regen-btn" onclick="_cgShowRegenPool()" id="cg-pool-regen-btn">
          <i class="fas fa-sync-alt"></i> Regenerate
        </button>
        <button class="cg-offer-regen-btn" style="border-color:#6366f160;color:#6366f1;background:var(--primary)08;" onclick="_cgShowAddToPool()" id="cg-pool-add-btn">
          <i class="fas fa-plus"></i> Add More
        </button>
      </div>
    </div>
    <div class="cg-offer-grid" id="cg-offer-grid">${cards}</div>
    <div style="margin-top:10px;">
      <div style="font-size:11px;color:var(--text-secondary);padding:6px 8px;background:var(--bg-secondary);border-radius:6px;margin-bottom:10px;" id="cg-pool-hint">${hintText}</div>
      <button class="btn-primary btn-block" onclick="_cgConfirmOffer()" id="cg-step1-confirm" ${cnt < 1 ? 'disabled' : ''}>
        ${btnLabel}
      </button>
    </div>`;
}

function _cgTogglePoolOffer(idx) {
  if (_cgPanel.offerSelectedIdxSet.has(idx)) {
    _cgPanel.offerSelectedIdxSet.delete(idx);
  } else {
    _cgPanel.offerSelectedIdxSet.add(idx);
  }
  // sync legacy single field to last selected
  const arr = Array.from(_cgPanel.offerSelectedIdxSet);
  _cgPanel.offerSelectedIdx = arr.length ? arr[arr.length - 1] : -1;
  _cgPanel.offerText = _cgPanel.offerSelectedIdx >= 0 ? (_cgPool()[_cgPanel.offerSelectedIdx]?.offer_text || '') : '';
  // re-render so hint + button update
  _renderCGStep1Pool();
}

async function _cgDeletePoolOffer(offerId, idx) {
  try {
    await api('DELETE', `/calendars/${_cgCalendarId}/offer-pool?offer_id=${offerId}`);
    _cgPool().splice(idx, 1);
    if (_cgPanel.offerSelectedIdx === idx) { _cgPanel.offerSelectedIdx = -1; _cgPanel.offerText = ''; }
    else if (_cgPanel.offerSelectedIdx > idx) _cgPanel.offerSelectedIdx--;
    if (_cgPool().length === 0) {
      _renderCGStep1Loading('Generating 10 fresh offers…');
      const res = await api('GET', `/calendars/${_cgCalendarId}/offer-suggest?day=${_cgPanel.day}&grid_index=${_cgPanel.gi}&count=10`);
      _cgPickOffers = res.offers || [];
      _cgPanel.offerPickSet = new Set();
      _renderCGStep1Pick(false);
    } else {
      _renderCGStep1Pool();
    }
  } catch(e) { /* ignore */ }
}

// ── REGEN: replace entire pool with 10 fresh ones ────────────────────
async function _cgShowRegenPool() {
  const btn = document.getElementById('cg-pool-regen-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating…'; }
  try {
    const res = await api('GET', `/calendars/${_cgCalendarId}/offer-suggest?day=${_cgPanel.day}&grid_index=${_cgPanel.gi}&count=10`);
    _cgPickOffers = res.offers || [];
    _cgPanel.offerPickSet = new Set();
    _renderCGStep1Pick(true); // true = replacing pool
  } catch(e) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sync-alt"></i> Regenerate'; }
  }
}

// ── ADD MORE: generate 10 more to pick from ──────────────────────────
async function _cgShowAddToPool() {
  const btn = document.getElementById('cg-pool-add-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating…'; }
  try {
    const res = await api('GET', `/calendars/${_cgCalendarId}/offer-suggest?day=${_cgPanel.day}&grid_index=${_cgPanel.gi}&count=10`);
    _cgPickOffers = res.offers || [];
    _cgPanel.offerPickSet = new Set();
    _renderCGStep1Pick(false); // false = adding to pool
  } catch(e) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i> Add More'; }
  }
}

// ── PICK VIEW: show 10 cards, multi-select, save to pool ─────────────
// replacing=true means selected offers REPLACE the pool; false = append
function _renderCGStep1Pick(replacing) {
  const body = document.getElementById('cg-panel-body');
  if (!body) return;
  const cnt = _cgPanel.offerPickSet.size;
  const hasPool = _cgPool().length > 0;

  const cards = _cgPickOffers.map((o, i) => {
    const sel = _cgPanel.offerPickSet.has(i);
    return `<div class="cg-offer-card ${sel ? 'cg-offer-card--sel' : ''}" onclick="_cgTogglePickOffer(${i})">
      <div class="cg-offer-card-check">${sel ? '<i class="fas fa-check"></i>' : ''}</div>
      ${o.hook_line ? `<div class="cg-offer-card-hook">${esc(o.hook_line)}</div>` : ''}
      <div class="cg-offer-card-text">${esc(o.offer||'')}</div>
      ${o.urgency ? `<div class="cg-offer-card-urgency"><i class="fas fa-bolt"></i> ${esc(o.urgency)}</div>` : ''}
    </div>`;
  }).join('');

  const title   = replacing ? '🔄 Replace Pool' : (hasPool ? '➕ Add to Pool' : '🔥 Build Your Offer Pool');
  const subtext = replacing
    ? 'Select the offers you want. They\'ll replace your current pool.'
    : (hasPool ? 'Pick the ones to add to your existing pool.' : 'Pick the offers you like. Saved to your pool — reuse any day.');
  const saveLabel = replacing
    ? `Replace Pool (${cnt})`
    : (hasPool ? `Add to Pool (${cnt})` : `Save to Pool (${cnt})`);

  body.innerHTML = `
    ${_cgPanelHeader(1)}
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
      <div>
        <div style="font-size:13px;font-weight:600;">${title}</div>
        <div style="font-size:11px;color:var(--text-secondary);margin-top:1px;">${subtext}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        ${hasPool ? `<button class="cg-offer-regen-btn" onclick="_renderCGStep1Pool()" style="border-color:#6366f160;color:#6366f1;background:var(--primary)08;">
          <i class="fas fa-arrow-left"></i> Back to Pool
        </button>` : ''}
        <button class="cg-offer-regen-btn" onclick="_cgGetFresh10(${replacing})" id="cg-fresh-btn">
          <i class="fas fa-sync-alt"></i> New 10
        </button>
      </div>
    </div>
    <div class="cg-offer-grid" id="cg-offer-grid">${cards}</div>
    <div style="display:flex;gap:10px;margin-top:16px;align-items:center;">
      <span style="font-size:11px;color:var(--text-secondary);" id="cg-pick-count">${cnt} selected</span>
      <div style="flex:1;"></div>
      <button class="btn-primary" onclick="_cgSavePickToPool(${replacing})" id="cg-pick-save-btn" ${cnt === 0 ? 'disabled' : ''}>
        ${saveLabel} <i class="fas fa-arrow-right"></i>
      </button>
    </div>`;
}

function _cgTogglePickOffer(idx) {
  if (_cgPanel.offerPickSet.has(idx)) _cgPanel.offerPickSet.delete(idx);
  else _cgPanel.offerPickSet.add(idx);
  document.querySelectorAll('#cg-offer-grid .cg-offer-card').forEach((el, i) => {
    const sel = _cgPanel.offerPickSet.has(i);
    el.classList.toggle('cg-offer-card--sel', sel);
    const chk = el.querySelector('.cg-offer-card-check');
    if (chk) chk.innerHTML = sel ? '<i class="fas fa-check"></i>' : '';
  });
  const cnt = _cgPanel.offerPickSet.size;
  const countEl = document.getElementById('cg-pick-count');
  const saveBtn = document.getElementById('cg-pick-save-btn');
  if (countEl) countEl.textContent = `${cnt} selected`;
  if (saveBtn) {
    saveBtn.disabled = cnt === 0;
    // update label
    const replacing = saveBtn.onclick?.toString().includes('true');
    saveBtn.innerHTML = `${cnt === 0 ? 'Select offers' : (replacing ? `Replace Pool (${cnt})` : `${_cgPool().length > 0 ? 'Add to Pool' : 'Save to Pool'} (${cnt})`)} <i class="fas fa-arrow-right"></i>`;
  }
}

async function _cgGetFresh10(replacing) {
  const btn = document.getElementById('cg-fresh-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating…'; }
  try {
    const res = await api('GET', `/calendars/${_cgCalendarId}/offer-suggest?day=${_cgPanel.day}&grid_index=${_cgPanel.gi}&count=10`);
    _cgPickOffers = res.offers || [];
    _cgPanel.offerPickSet = new Set();
    _renderCGStep1Pick(replacing);
  } catch(e) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sync-alt"></i> New 10'; }
  }
}

async function _cgSavePickToPool(replacing) {
  if (_cgPanel.offerPickSet.size === 0) return;
  const btn = document.getElementById('cg-pick-save-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…'; }
  const selected = Array.from(_cgPanel.offerPickSet).map(i => _cgPickOffers[i]).filter(Boolean);
  try {
    const res = await api('POST', `/calendars/${_cgCalendarId}/offer-pool`, { offers: selected, replace: !!replacing, grid_index: _cgPanel.gi });
    _cgSetPool(res.offers || []);
    const rotIdx = (_cgPanel.day - 1) % _cgPool().length;
    _cgPanel.offerSelectedIdx = rotIdx;
    _cgPanel.offerText = _cgPool()[rotIdx]?.offer_text || '';
    _renderCGStep1Pool();
  } catch(e) {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Save to Pool <i class="fas fa-arrow-right"></i>'; }
  }
}

function _cgConfirmOffer() {
  const selArr = Array.from(_cgPanel.offerSelectedIdxSet);
  if (selArr.length === 0) return;
  // Build ordered bulk offers list
  _cgPanel.bulkOffers = selArr.map(i => _cgPool()[i]).filter(Boolean);
  // Set primary offer text (first selected)
  _cgPanel.offerText = _cgPanel.bulkOffers[0]?.offer_text || '';
  _cgPanel.step = 2;
  _renderCGStep2();
}

// ── Step 2: Format selection ───────────────────────────────────────────
function _renderCGStep2() {
  const body = document.getElementById('cg-panel-body');
  if (!body) return;

  const cards = CG_FORMATS.map(f => {
    const sel = _cgPanel.selectedFormats.has(f.key);
    const { g } = _cgPanelMeta();
    const accent = g.color || '#6366f1';
    return `<div class="cg-format-card ${sel ? 'cg-format-card--sel' : ''}"
                 style="${sel ? `border-color:${accent};background:${accent}12;` : ''}"
                 onclick="_cgToggleFormat('${f.key}','${accent}')">
      <div class="cg-format-card-icon">${f.icon}</div>
      <div class="cg-format-card-body">
        <div class="cg-format-card-label">${f.label}</div>
        <div class="cg-format-card-sub">${f.sub}</div>
      </div>
      <div class="cg-format-check ${sel ? 'cg-format-check--sel' : ''}" style="${sel ? `background:${accent};border-color:${accent};` : ''}">
        ${sel ? '<i class="fas fa-check" style="color:#fff;font-size:9px;"></i>' : ''}
      </div>
    </div>`;
  }).join('');

  const anySelected = _cgPanel.selectedFormats.size > 0;
  const bulk = _cgPanel.bulkOffers.length;
  const genLabel = bulk > 1
    ? `<i class="fas fa-calendar-check"></i> Generate ${bulk} Days`
    : `<i class="fas fa-magic"></i> Generate Content`;
  const bulkNote = bulk > 1
    ? `<div style="font-size:11px;color:#10b981;background:#10b98110;padding:6px 10px;border-radius:6px;margin-bottom:10px;"><i class="fas fa-info-circle" style="margin-right:4px;"></i><strong>${bulk} offers selected</strong> — same format(s) applied to Days ${_cgPanel.day}–${_cgPanel.day + bulk - 1}</div>`
    : '';

  body.innerHTML = `
    ${_cgPanelHeader(2)}
    <div style="margin-top:14px;">
      ${bulkNote}
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Select one or more formats — all will be generated.</div>
      <div class="cg-format-grid" id="cg-format-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">${cards}</div>
    </div>
    <div style="margin-top:14px;display:flex;flex-direction:column;gap:8px;">
      <button class="btn-primary btn-block" id="cg-gen-btn" onclick="_cgGenerate()" ${anySelected ? '' : 'disabled'}>
        ${genLabel}
      </button>
      <button class="btn-secondary btn-sm" onclick="_cgPanel.step=1;_cgPool().length>0?_renderCGStep1Pool():_renderCGStep1Pick(false)">
        <i class="fas fa-arrow-left"></i> Back
      </button>
    </div>`;
}

function _cgToggleFormat(key, accent) {
  if (_cgPanel.selectedFormats.has(key)) _cgPanel.selectedFormats.delete(key);
  else _cgPanel.selectedFormats.add(key);
  _renderCGStep2();
}

// ── Step 3: Generate + show content ───────────────────────────────────
async function _cgGenerate() {
  if (!_cgCalendarId) { toast('No campaign loaded', 'error'); return; }
  if (!_cgPanel.selectedFormats.size) { toast('Select at least one format', 'error'); return; }

  const body    = document.getElementById('cg-panel-body');
  const formats = Array.from(_cgPanel.selectedFormats);
  const bulk    = _cgPanel.bulkOffers.length;

  // ── Single-day generation ──────────────────────────────────────────
  if (bulk <= 1) {
    const slot = cgGetSlot(_cgPanel.day, _cgPanel.gi);
    body.innerHTML = `
      ${_cgPanelHeader(3)}
      <div style="margin-top:30px;text-align:center;color:var(--text-muted);">
        <i class="fas fa-spinner fa-spin" style="font-size:28px;margin-bottom:12px;display:block;"></i>
        <div style="font-size:13px;">Generating content for ${formats.length} format${formats.length>1?'s':''}…</div>
        <div style="font-size:11px;margin-top:6px;opacity:.7;">~${formats.length * 5}–${formats.length * 10}s</div>
      </div>`;
    try {
      const res = await api('POST', `/calendars/${_cgCalendarId}/generate-day`, {
        day: _cgPanel.day, grid_index: _cgPanel.gi,
        timing: slot ? slot.timing : 'AM',
        confirmed_offer: _cgPanel.offerText, formats
      });
      if (res.concept) { _cgConcepts[`${_cgPanel.day}-${_cgPanel.gi}`] = res.concept; renderCGTable(); }
      _cgPanel.lastResult = res;
      _cgPanel.step = 3;
      _renderCGStep3(res);
      toast('Content generated!', 'success');
    } catch(e) {
      toast('Generation failed: ' + e.message, 'error');
      _cgPanel.step = 2; _renderCGStep2();
    }
    return;
  }

  // ── Bulk generation: N offers → N consecutive days ─────────────────
  // Find next N empty slots in this grid column starting from _cgPanel.day
  const emptySlots = [];
  for (let d = _cgPanel.day; d <= _cgDays && emptySlots.length < bulk; d++) {
    const slot = cgGetSlot(d, _cgPanel.gi);
    if (slot && !_cgConcepts[`${d}-${_cgPanel.gi}`]) emptySlots.push(d);
  }

  body.innerHTML = `
    ${_cgPanelHeader(3)}
    <div style="margin-top:20px;">
      <div style="font-size:13px;font-weight:600;margin-bottom:12px;"><i class="fas fa-calendar-check" style="color:#10b981;margin-right:6px;"></i>Bulk Generating ${emptySlots.length} Days…</div>
      <div id="cg-bulk-progress" style="display:flex;flex-direction:column;gap:8px;"></div>
    </div>`;

  const progressEl = document.getElementById('cg-bulk-progress');
  if (!progressEl) return;

  // Render placeholder rows
  emptySlots.forEach((d, idx) => {
    const offer = _cgPanel.bulkOffers[idx];
    progressEl.insertAdjacentHTML('beforeend', `
      <div id="cg-bulk-row-${d}" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:10px 12px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span id="cg-bulk-icon-${d}" style="width:20px;text-align:center;"><i class="fas fa-clock" style="color:var(--text-muted);font-size:12px;"></i></span>
          <div style="flex:1;">
            <div style="font-size:12px;font-weight:600;">Day ${d}</div>
            <div style="font-size:11px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;" title="${esc(offer?.offer_text||'')}">🎯 ${esc((offer?.offer_text||'').slice(0,50))}${(offer?.offer_text||'').length>50?'…':''}</div>
          </div>
          <span id="cg-bulk-status-${d}" style="font-size:11px;color:var(--text-muted);">Queued</span>
        </div>
      </div>`);
  });

  let lastResult = null;
  let successCount = 0;

  for (let idx = 0; idx < emptySlots.length; idx++) {
    const d     = emptySlots[idx];
    const offer = _cgPanel.bulkOffers[idx];
    const slot  = cgGetSlot(d, _cgPanel.gi);

    // Update row to "generating"
    const iconEl   = document.getElementById(`cg-bulk-icon-${d}`);
    const statusEl = document.getElementById(`cg-bulk-status-${d}`);
    if (iconEl)   iconEl.innerHTML   = '<i class="fas fa-spinner fa-spin" style="color:#6366f1;font-size:12px;"></i>';
    if (statusEl) statusEl.textContent = 'Generating…';

    try {
      const res = await api('POST', `/calendars/${_cgCalendarId}/generate-day`, {
        day: d, grid_index: _cgPanel.gi,
        timing: slot ? slot.timing : 'AM',
        confirmed_offer: offer?.offer_text || '', formats
      });
      if (res.concept) { _cgConcepts[`${d}-${_cgPanel.gi}`] = res.concept; }
      if (iconEl)   iconEl.innerHTML   = '<i class="fas fa-check-circle" style="color:#10b981;font-size:12px;"></i>';
      if (statusEl) { statusEl.textContent = '✓ Done'; statusEl.style.color = '#10b981'; }
      lastResult = res;
      successCount++;
    } catch(e) {
      if (iconEl)   iconEl.innerHTML   = '<i class="fas fa-times-circle" style="color:#ef4444;font-size:12px;"></i>';
      if (statusEl) { statusEl.textContent = 'Failed'; statusEl.style.color = '#ef4444'; }
    }
  }

  renderCGTable();

  // After all done, show summary + confirm button
  setTimeout(() => {
    if (!document.getElementById('cg-bulk-progress')) return;
    const summaryHtml = `
      <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px;">
        <div style="text-align:center;font-size:13px;color:#10b981;font-weight:600;padding:10px 0;">
          <i class="fas fa-check-circle" style="margin-right:6px;"></i>${successCount} of ${emptySlots.length} days generated
        </div>
        <button class="btn-primary btn-block cg-confirm-btn" onclick="confirmCGDay()">
          <i class="fas fa-calendar-check"></i> Done — Close Panel
        </button>
        <button class="btn-secondary btn-sm" onclick="_cgPanel.step=1;_cgPanel.bulkOffers=[];_cgPanel.offerSelectedIdxSet=new Set();_cgPool().length>0?_renderCGStep1Pool():_renderCGStep1Pick(false)">
          <i class="fas fa-redo"></i> Start Over
        </button>
      </div>`;
    const pg = document.getElementById('cg-bulk-progress');
    if (pg) pg.insertAdjacentHTML('afterend', summaryHtml);
    if (lastResult) _cgPanel.lastResult = lastResult;
    toast(`${successCount} days generated!`, 'success');
  }, 400);
}

function _renderCGStep3(res) {
  const body = document.getElementById('cg-panel-body');
  if (!body) return;
  const fc = res.formats_content || {};
  _cgPanel.lastResult = res;

  // Store per-format content in module-level map for regeneration
  _cgFormatContent = { ...fc };

  const blocks = Array.from(_cgPanel.selectedFormats).map(fk => _buildFormatBlock(fk, fc[fk] || {})).join('');

  body.innerHTML = `
    ${_cgPanelHeader(3)}
    <div style="margin-top:14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;" id="cg-format-blocks">${blocks}</div>
    <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px;">
      <button class="btn-primary btn-block cg-confirm-btn" onclick="confirmCGDay()" id="cg-confirm-btn">
        <i class="fas fa-calendar-check"></i> Add to Calendar
      </button>
      <button class="btn-secondary btn-sm" onclick="_cgPanel.step=1;_cgPanel.selectedFormats=new Set();_cgPool().length>0?_renderCGStep1Pool():_renderCGStep1Pick(false)">
        <i class="fas fa-redo"></i> Start Over
      </button>
    </div>`;
}

// Module-level store for regenerated content
let _cgFormatContent = {};

function _cgCopy(text) {
  navigator.clipboard.writeText(text).then(() => toast('Copied!', 'success')).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    toast('Copied!', 'success');
  });
}

function _copyIcon(text) {
  const safe = text.replace(/'/g, "\\'").replace(/\n/g, '\\n');
  return `<button class="cg-copy-btn" onclick="_cgCopy('${safe}')" title="Copy"><i class="fas fa-copy"></i></button>`;
}

function _buildCopyAllText(fk, data) {
  const lines = [];
  if (fk === 'single_post') {
    if (data.hook)             lines.push('HOOK: ' + data.hook);
    if (data.visual_direction) lines.push('VISUAL: ' + data.visual_direction);
    if (data.overlay_text)     lines.push('OVERLAY: ' + data.overlay_text);
    if (data.caption_hook)     lines.push('CAPTION: ' + data.caption_hook);
    if (data.cta)              lines.push('CTA: ' + data.cta);
    if (data.mood)             lines.push('MOOD: ' + data.mood);
    if (data.canva_tip)        lines.push('CANVA TIP: ' + data.canva_tip);
    lines.push('BRAND: Business name/logo in top corner of the image');
  } else if (fk === 'carousel') {
    if (data.hook) lines.push('HOOK: ' + data.hook);
    if (data.hook_slide) lines.push('HOOK SLIDE: ' + (data.hook_slide.headline||'') + (data.hook_slide.subtext ? ' — ' + data.hook_slide.subtext : ''));
    (data.slides||[]).forEach(s => {
      lines.push('SLIDE ' + s.slide_num + ': ' + (s.headline||''));
      (s.bullets||[]).forEach(b => lines.push('  • ' + b));
    });
    if (data.cta_slide) lines.push('CTA SLIDE: ' + (data.cta_slide.headline||'') + (data.cta_slide.action ? ' — ' + data.cta_slide.action : ''));
    if (data.design_tip) lines.push('CANVA TIP: ' + data.design_tip);
    lines.push('BRAND: Business name/logo in top corner on every slide');
  } else if (fk === 'video_heygen') {
    if (data.hook) lines.push('HOOK: ' + data.hook);
    lines.push('DURATION: ' + (data.duration_seconds||45) + 's');
    (data.scenes||[]).forEach(s => {
      lines.push('SCENE ' + s.scene + ' (' + (s.duration_s||'') + 's): ' + (s.script||''));
      if (s.lower_third) lines.push('  Lower third: ' + s.lower_third);
    });
    if (data.avatar_suggestion)      lines.push('AVATAR: ' + data.avatar_suggestion);
    if (data.background_suggestion)  lines.push('BG: ' + data.background_suggestion);
    if (data.cta_text)               lines.push('CTA: ' + data.cta_text);
    lines.push('BRAND: Business name/logo as persistent corner watermark throughout video');
  } else if (fk === 'video_canva') {
    if (data.hook) lines.push('HOOK: ' + data.hook);
    lines.push('DURATION: ' + (data.duration_seconds||30) + 's');
    if (data.music_mood) lines.push('MUSIC: ' + data.music_mood);
    (data.frames||[]).forEach(f => {
      lines.push((f.second||'') + 's: ' + (f.text_overlay||'') + (f.visual ? ' — ' + f.visual : '') + (f.transition ? ' · ' + f.transition : ''));
    });
    if (data.color_scheme) lines.push('COLORS: ' + data.color_scheme);
    if (data.font_style)   lines.push('FONT: ' + data.font_style);
    lines.push('BRAND: Business name/logo in top corner on every frame');
  }
  return lines.join('\n');
}

function _cgCopyAll(fk) {
  const data = _cgFormatContent[fk] || {};
  const text = _buildCopyAllText(fk, data);
  if (!text) { toast('No content to copy yet', 'error'); return; }
  navigator.clipboard.writeText(text).then(() => toast('All content copied!', 'success')).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    toast('All content copied!', 'success');
  });
}

function _buildFormatBlock(fk, data) {
  const fmt = CG_FORMATS.find(f => f.key === fk) || { icon: '📄', label: fk, sub: '' };
  let html = '';

  if (data.error) {
    html = `<div style="color:#ef4444;font-size:12px;">${esc(data.error)}</div>`;
  } else if (fk === 'carousel') {
    const slides = (data.slides || []).map(s =>
      `<div class="cg-content-slide">
        <span class="cg-slide-num">Slide ${s.slide_num}</span>
        <strong>${esc(s.headline||'')}</strong>${_copyIcon(s.headline||'')}
        ${(s.bullets||[]).map(b => `<div class="cg-slide-bullet">• ${esc(b)} ${_copyIcon(b)}</div>`).join('')}
      </div>`).join('');
    html = `
      ${data.hook ? `<div class="cg-content-row"><span class="cg-content-lbl">Hook</span><span>${esc(data.hook)}</span>${_copyIcon(data.hook||'')}</div>` : ''}
      <div class="cg-content-slide" style="background:var(--primary)10;border-left:3px solid var(--primary);">
        <span class="cg-slide-num">Hook Slide</span>
        <strong>${esc(data.hook_slide?.headline||'')}</strong>${_copyIcon(data.hook_slide?.headline||'')}
        <div style="font-size:11px;color:var(--text-muted);">${esc(data.hook_slide?.subtext||'')} ${_copyIcon(data.hook_slide?.subtext||'')}</div>
      </div>
      ${slides}
      <div class="cg-content-slide" style="background:#10b98110;border-left:3px solid #10b981;">
        <span class="cg-slide-num">📣 CTA Slide</span>
        <strong>${esc(data.cta_slide?.headline||'')}</strong>${_copyIcon(data.cta_slide?.headline||'')}
        <div style="font-size:12px;color:#10b981;font-weight:600;margin-top:3px;">${esc(data.cta_slide?.action||'')} ${_copyIcon(data.cta_slide?.action||'')}</div>
      </div>
      ${data.design_tip ? `<div class="cg-content-row"><span class="cg-content-lbl">🎨 Canva</span><span>${esc(data.design_tip)}</span>${_copyIcon(data.design_tip)}</div>` : ''}
      <div class="cg-content-row" style="background:#f59e0b10;border-radius:6px;padding:5px 8px;"><span class="cg-content-lbl" style="color:#f59e0b;">🏷 Brand</span><span style="font-size:11px;">Business name/logo in <strong>top corner</strong> on every slide</span></div>`;
  } else if (fk === 'single_post') {
    html = `
      ${data.hook ? `<div class="cg-content-row"><span class="cg-content-lbl">Hook</span><span style="font-weight:600;">${esc(data.hook)}</span>${_copyIcon(data.hook||'')}</div>` : ''}
      <div class="cg-content-row"><span class="cg-content-lbl">📸 Visual</span><span>${esc(data.visual_direction||'')}</span>${_copyIcon(data.visual_direction||'')}</div>
      <div class="cg-content-row" style="background:var(--primary)08;border-radius:6px;padding:6px 8px;"><span class="cg-content-lbl" style="color:var(--primary);">Overlay</span><span style="font-weight:700;font-size:14px;">${esc(data.overlay_text||'')}</span>${_copyIcon(data.overlay_text||'')}</div>
      <div class="cg-content-row"><span class="cg-content-lbl">Caption</span><span>${esc(data.caption_hook||'')}</span>${_copyIcon(data.caption_hook||'')}</div>
      ${data.cta ? `<div class="cg-content-row" style="background:#10b98108;border-radius:6px;padding:6px 8px;"><span class="cg-content-lbl" style="color:#10b981;">📣 CTA</span><span style="font-weight:600;">${esc(data.cta)}</span>${_copyIcon(data.cta)}</div>` : ''}
      <div class="cg-content-row"><span class="cg-content-lbl">Mood</span><span>${esc(data.mood||'')}</span></div>
      ${data.canva_tip ? `<div class="cg-content-row"><span class="cg-content-lbl">🎨 Canva</span><span>${esc(data.canva_tip)}</span>${_copyIcon(data.canva_tip)}</div>` : ''}
      <div class="cg-content-row" style="background:#f59e0b10;border-radius:6px;padding:5px 8px;"><span class="cg-content-lbl" style="color:#f59e0b;">🏷 Brand</span><span style="font-size:11px;">Business name/logo in <strong>top corner</strong> of the image</span></div>`;
  } else if (fk === 'video_heygen') {
    const scenes = (data.scenes || []).map(s =>
      `<div class="cg-content-slide">
        <span class="cg-slide-num">Scene ${s.scene} · ${s.duration_s||''}s</span>
        <div style="font-size:12px;line-height:1.5;">${esc(s.script||'')} ${_copyIcon(s.script||'')}</div>
        ${s.lower_third ? `<div style="font-size:10px;color:var(--text-muted);margin-top:3px;">Lower third: ${esc(s.lower_third)} ${_copyIcon(s.lower_third)}</div>` : ''}
      </div>`).join('');
    html = `
      ${data.hook ? `<div class="cg-content-row"><span class="cg-content-lbl">Hook</span><span>${esc(data.hook)}</span>${_copyIcon(data.hook||'')}</div>` : ''}
      <div class="cg-content-row"><span class="cg-content-lbl">Duration</span><span>${data.duration_seconds||45}s</span></div>
      ${scenes}
      ${data.avatar_suggestion ? `<div class="cg-content-row"><span class="cg-content-lbl">🤖 Avatar</span><span>${esc(data.avatar_suggestion)}</span>${_copyIcon(data.avatar_suggestion)}</div>` : ''}
      ${data.background_suggestion ? `<div class="cg-content-row"><span class="cg-content-lbl">🖼 BG</span><span>${esc(data.background_suggestion)}</span>${_copyIcon(data.background_suggestion)}</div>` : ''}
      ${data.cta_text ? `<div class="cg-content-row"><span class="cg-content-lbl">CTA</span><span>${esc(data.cta_text)}</span>${_copyIcon(data.cta_text)}</div>` : ''}
      <div class="cg-content-row" style="background:#f59e0b10;border-radius:6px;padding:5px 8px;"><span class="cg-content-lbl" style="color:#f59e0b;">🏷 Brand</span><span style="font-size:11px;">Business name/logo as <strong>persistent corner watermark</strong> throughout video</span></div>`;
  } else if (fk === 'video_canva') {
    const frames = (data.frames || []).map(f =>
      `<div class="cg-content-slide">
        <span class="cg-slide-num">${esc(f.second||'')}s</span>
        <strong>${esc(f.text_overlay||'')} ${_copyIcon(f.text_overlay||'')}</strong>
        <div style="font-size:11px;color:var(--text-muted);">${esc(f.visual||'')}${f.transition ? ` · ${esc(f.transition)}` : ''} ${_copyIcon((f.visual||'') + (f.transition ? ' · '+f.transition : ''))}</div>
      </div>`).join('');
    html = `
      ${data.hook ? `<div class="cg-content-row"><span class="cg-content-lbl">Hook</span><span>${esc(data.hook)}</span>${_copyIcon(data.hook||'')}</div>` : ''}
      <div class="cg-content-row"><span class="cg-content-lbl">Duration</span><span>${data.duration_seconds||30}s</span></div>
      <div class="cg-content-row"><span class="cg-content-lbl">🎵 Music</span><span>${esc(data.music_mood||'')}</span>${_copyIcon(data.music_mood||'')}</div>
      ${frames}
      ${data.color_scheme ? `<div class="cg-content-row"><span class="cg-content-lbl">🎨 Colors</span><span>${esc(data.color_scheme)}</span>${_copyIcon(data.color_scheme)}</div>` : ''}
      ${data.font_style ? `<div class="cg-content-row"><span class="cg-content-lbl">Aa Font</span><span>${esc(data.font_style)}</span>${_copyIcon(data.font_style)}</div>` : ''}
      <div class="cg-content-row" style="background:#f59e0b10;border-radius:6px;padding:5px 8px;"><span class="cg-content-lbl" style="color:#f59e0b;">🏷 Brand</span><span style="font-size:11px;">Business name/logo in <strong>top corner</strong> on every frame</span></div>`;
  }

  return `
    <div class="cg-content-block" id="cg-block-${fk}">
      <div class="cg-content-block-header">
        <span onclick="document.getElementById('cg-block-${fk}').classList.toggle('cg-content-block--collapsed')" style="flex:1;cursor:pointer;">
          ${fmt.icon} ${fmt.label} <span style="font-size:10px;opacity:.7;">${fmt.sub||''}</span>
        </span>
        <button class="cg-regen-btn" id="cg-regen-${fk}" onclick="regenerateCGFormat('${fk}')" title="Regenerate this format">
          <i class="fas fa-sync-alt"></i> Redo
        </button>
        <button class="cg-copy-all-btn" onclick="_cgCopyAll('${fk}')" title="Copy all content as one block">
          <i class="fas fa-clipboard"></i> Copy All
        </button>
        <i class="fas fa-chevron-up cg-content-chevron" onclick="document.getElementById('cg-block-${fk}').classList.toggle('cg-content-block--collapsed')" style="cursor:pointer;margin-left:6px;"></i>
      </div>
      <div class="cg-content-block-body" id="cg-block-body-${fk}">${html}</div>
    </div>`;
}

async function regenerateCGFormat(fk) {
  if (!_cgCalendarId) return;
  const btn = document.getElementById(`cg-regen-${fk}`);
  const bodyEl = document.getElementById(`cg-block-body-${fk}`);
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }
  if (bodyEl) bodyEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Regenerating…</div>';

  const slot = cgGetSlot(_cgPanel.day, _cgPanel.gi);
  try {
    const res = await api('POST', `/calendars/${_cgCalendarId}/regenerate-format`, {
      day: _cgPanel.day, grid_index: _cgPanel.gi,
      timing: slot ? slot.timing : 'AM',
      confirmed_offer: _cgPanel.offerText,
      format: fk
    });
    _cgFormatContent[fk] = res.content || {};
    const newBlock = _buildFormatBlock(fk, _cgFormatContent[fk]);
    const wrapper = document.getElementById(`cg-block-${fk}`);
    if (wrapper) wrapper.outerHTML = newBlock;
    toast('Regenerated!', 'success');
  } catch(e) {
    toast('Regeneration failed: ' + e.message, 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sync-alt"></i> Redo'; }
    if (bodyEl) bodyEl.innerHTML = '<div style="color:#ef4444;font-size:12px;padding:10px;">Failed — try again</div>';
  }
}

async function confirmCGDay() {
  const btn = document.getElementById('cg-confirm-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-check-circle"></i> Added to Calendar!'; btn.style.background = '#10b981'; }
  // Content is already saved to DB on generation — just show success
  setTimeout(() => {
    closeCGPanel();
    toast('Day ' + _cgPanel.day + ' content confirmed in calendar ✓', 'success');
  }, 900);
}

async function regenerateCGDay(day, gi) {
  _cgPanel.day = day; _cgPanel.gi = gi;
  _cgPanel.step = 1; _cgPanel.offerText = '';
  _cgPanel.selectedFormats = new Set();
  delete _cgConcepts[`${day}-${gi}`];
  await openCGPanel(day, gi);
}

// Legacy stub kept for any call sites
async function designCGDay(day, gi) { await openCGPanel(day, gi); }

// Grid editor modal
let _cgEditorDraft = [];

function openCGGridEditor() {
  _cgEditorDraft = _cgGrids.map(g => ({...g}));
  renderCGEditor();
  openModal('cgGridEditorModal');
}

function renderCGEditor() {
  const el = document.getElementById('cg-editor-grids');
  if (!el) return;
  el.innerHTML = _cgEditorDraft.map((g, i) => {
    const letter = String.fromCharCode(65 + i);
    return `
    <div class="cg-editor-grid-item">
      <div class="cg-editor-row">
        <div class="cg-editor-grid-letter" style="background:${g.color}20;color:${g.color};">${letter}</div>
        <div class="cg-editor-fields">
          <input class="form-input cg-editor-name" type="text" value="${esc(g.name)}"
            placeholder="Grid name" oninput="_cgEditorDraft[${i}].name=this.value">
          <input type="color" class="cg-editor-color" value="${g.color}"
            oninput="_cgEditorDraft[${i}].color=this.value;renderCGEditor()">
        </div>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Content types (comma-separated):</div>
      <input class="form-input" type="text" style="font-size:12px;"
        value="${(g.content_types||[]).join(', ')}"
        placeholder="Value Bomb, Carousel Tutorial, Tutorial Reel"
        oninput="_cgEditorDraft[${i}].content_types=this.value.split(',').map(s=>s.trim()).filter(Boolean)">
    </div>`;
  }).join('');
}

async function saveCGGrids() {
  if (!_cgCalendarId) {
    // Save to local state only (no calendar yet)
    _cgGrids = _cgEditorDraft.map((g, i) => ({...g, grid_index: i}));
    renderCGPills();
    closeModal('cgGridEditorModal');
    toast('Grid setup saved locally', 'success');
    return;
  }
  try {
    const payload = _cgEditorDraft.map((g, i) => ({...g, grid_index: i}));
    await api('PUT', `/calendars/${_cgCalendarId}/campaign-grids`, payload);
    _cgGrids = payload;
    renderCGPills();
    renderCGTable();
    closeModal('cgGridEditorModal');
    toast('Grid setup saved!', 'success');
  } catch(e) {
    toast('Save failed: ' + e.message, 'error');
  }
}

// Called when loading the project overview tab
async function loadGridDashboard() {
  if (!state.currentProjectId) return;

  // Reset state
  _cgCalendarId  = null;
  _cgConcepts    = {};
  _cgOfferPools  = { 0: [], 1: [], 2: [] };
  closeCGPanel();

  // Render pills with current grid config
  renderCGPills();

  // Populate calendar selector with project's calendars
  const cals = (state.currentProject && state.currentProject.calendars) || [];
  const sel = document.getElementById('cg-calendar-select');
  if (sel) {
    sel.innerHTML = '<option value="">— select campaign —</option>' +
      cals.map(c => `<option value="${c.id}">${c.month} (${c.campaign_days||30}d)</option>`).join('');
  }

  if (cals.length) {
    const bar = document.getElementById('cg-cal-bar');
    if (bar) bar.style.display = '';
    // Auto-load latest calendar
    const latest = cals[0];
    if (latest) {
      if (sel) sel.value = latest.id;
      await loadCGCalendar(latest.id);
    }
  } else {
    // Show empty state
    const outer = document.getElementById('cg-table-outer');
    if (outer) outer.innerHTML = `<div class="cg-empty-state">
      <i class="fas fa-calendar-plus"></i>
      <p>No campaigns yet. Generate your first one!</p>
      <button class="btn-primary" onclick="openGenerateModal()"><i class="fas fa-magic"></i> Generate Campaign</button>
    </div>`;
  }
}

// Legacy compatibility stubs
async function autoGenerateFromGrid() { openGenerateModal(); }
function generateFromGrid() { if (_selectedGrid) openGenerateModal(_selectedGrid.id); }
function showGridStep() {}
function renderGDCards() {}
function renderGDCalendar() {}
function renderGDLegend() {}
function selectGDGrid() {}
function gdCellClick() {}
async function selectGrid(gridId) {
  _selectedGrid = _gridTemplates.find(g => g.id === gridId);
  if (_selectedGrid) { closeModal('gridCalendarModal'); openGenerateModal(_selectedGrid.id); }
}
async function generateFollowerPush() {
  toast('Use Grid A (Value Content) for follower-growth posts, then click Design on any day.');
}


/* ═══════════════════════════════════════════════════════════════════════
   WHATSAPP
   ═══════════════════════════════════════════════════════════════════════ */
let _waMessage = '';
let _waUrl     = '';
let _waMailto  = '';

async function openWhatsAppModal(conceptId) {
  openModal('whatsappModal');
  const preview = document.getElementById('wa-preview');
  preview.innerHTML = '<div style="text-align:center;padding:24px;color:#9ca3af;"><i class="fas fa-spinner fa-spin" style="font-size:24px;"></i></div>';
  try {
    const res = await api('POST', '/whatsapp/format', { concept_id: conceptId });
    _waMessage = res.message || '';
    _waUrl     = res.url     || '';
    _waMailto  = res.mailto  || '';
    preview.innerHTML = `<pre style="white-space:pre-wrap;font-size:13px;line-height:1.6;color:#111827;font-family:inherit;">${esc(_waMessage)}</pre>`;
  } catch(e) {
    preview.innerHTML = '<div style="color:#ef4444;">Failed to format message</div>';
  }
}

function openWhatsApp() {
  if (_waUrl) window.open(_waUrl, '_blank');
}

function openEmailShare() {
  if (_waMailto) window.open(_waMailto, '_blank');
  else if (_waMessage) window.open('mailto:?body=' + encodeURIComponent(_waMessage), '_blank');
}

function copyWAMessage() {
  if (!_waMessage) return;
  navigator.clipboard.writeText(_waMessage).then(() => toast('Copied to clipboard ✓'));
}


/* ═══════════════════════════════════════════════════════════════════════
   FOLLOWERS PUSH TAB
   ═══════════════════════════════════════════════════════════════════════ */
function loadFollowersPushTab() {
  if (!state.currentCalendarData) {
    document.getElementById('fp-concepts-grid').innerHTML =
      '<div class="fp-empty"><i class="fas fa-calendar-plus"></i><p>Generate a calendar first to see Followers Push content here.</p></div>';
    return;
  }
  const all = state.currentCalendarData.concepts || [];
  // Follower Push = content_type includes "Follower" OR has the tag "follower" in hook
  const fpConcepts = all.filter(c =>
    (c.content_type||'').toLowerCase().includes('follower') ||
    (c.content_type||'').toLowerCase().includes('awareness') ||
    (c.hook||'').toLowerCase().includes('follower') ||
    (c.hook||'').toLowerCase().includes('grow') ||
    (c.hook||'').toLowerCase().includes('gain')
  );

  // Update stats
  document.getElementById('fp-count').textContent = fpConcepts.length;
  document.getElementById('fp-scheduled').textContent = fpConcepts.filter(c => c.status && c.status !== 'idea').length;
  document.getElementById('fp-published').textContent = fpConcepts.filter(c => c.status === 'published').length;
  const totalGain = all.reduce((s,c) => s + (c.metrics && c.metrics.follower_gain ? parseInt(c.metrics.follower_gain)||0 : 0), 0);
  document.getElementById('fp-gain').textContent = '+' + totalGain;

  if (!fpConcepts.length) {
    document.getElementById('fp-concepts-grid').innerHTML =
      `<div class="fp-empty"><i class="fas fa-user-plus"></i><p>No Follower Push posts detected in this calendar.<br>Use the <strong>Grid Calendar Planner</strong> to schedule follower-growth posts.</p><button class="btn-primary btn-sm" onclick="openGridCalendar()" style="margin-top:12px;"><i class="fas fa-th"></i> Open Grid Planner</button></div>`;
    return;
  }

  document.getElementById('fp-concepts-grid').innerHTML = fpConcepts.map(c => `
    <div class="fp-concept-card" onclick="openConceptModal('${c.id}')">
      <div class="fp-cc-day">Day ${c.day}</div>
      <div class="fp-cc-hook">${esc(c.hook)}</div>
      <div class="fp-cc-footer">
        <span class="status-badge s-${c.status||'idea'}"><span class="status-dot"></span>${esc((c.status||'idea').replace('_',' '))}</span>
        <span class="fp-format">${esc(c.format||'Reel')}</span>
      </div>
    </div>
  `).join('');
}

// generateFollowerPush is defined in the Campaign Grid section above

// (followers tab wired directly into switchProjectTab above)
