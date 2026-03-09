/* ==========================================
   CONFIGURATION
   ========================================== */
const CONFIG = {
  SUPABASE_URL: 'https://rmmgzviytfpwedstuhly.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbWd6dml5dGZwd2Vkc3R1aGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NzAwNTYsImV4cCI6MjA4ODE0NjA1Nn0.KemNQ3DUcyDwtCL5MZuFmcL-0COiIs2-yyoXxfIZ1P8',
  CDN_URLS: [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
    'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'
  ]
};

/* ==========================================
   SUPABASE CLIENT
   ========================================== */
let _client = null;
let _loadPromise = null;

function loadSupabaseScript() {
  if (_loadPromise) return _loadPromise;
  if (typeof window.supabase !== 'undefined') return (_loadPromise = Promise.resolve());

  _loadPromise = new Promise((resolve, reject) => {
    let i = 0;
    function tryNext() {
      if (i >= CONFIG.CDN_URLS.length) return reject(new Error('Cannot load Supabase'));
      const s = document.createElement('script');
      s.src = CONFIG.CDN_URLS[i++];
      s.crossOrigin = 'anonymous';
      s.onload = () => (typeof window.supabase !== 'undefined' ? resolve() : tryNext());
      s.onerror = tryNext;
      document.head.appendChild(s);
    }
    tryNext();
  });
  return _loadPromise;
}

async function getSupabaseClient() {
  await loadSupabaseScript();
  if (!_client) _client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  return _client;
}

/* ==========================================
   AUTH HELPERS
   ========================================== */
async function isUserGuest() {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (user) return false;
    // Check localStorage guest flag
    const stored = _getStoredUser();
    return !!(stored && stored.guest);
  } catch { return true; }
}

async function isUserAdmin() {
  try {
    const client = await getSupabaseClient();
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return false;
    const { data } = await client.from('users').select('is_admin').eq('id', user.id).single();
    return data?.is_admin === true;
  } catch { return false; }
}

async function redirectIfGuest() {
  const client = await getSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    showNotification('You must be signed in first', 'warning');
    setTimeout(() => { window.location.href = '/index.html'; }, 1800);
    return false;
  }
  return true;
}

async function redirectIfNotAdmin() {
  const admin = await isUserAdmin();
  if (!admin) {
    showNotification('Access denied: Admins only', 'error');
    setTimeout(() => { window.location.href = '/pages/homepage.html'; }, 1500);
    return false;
  }
  return true;
}

function _getStoredUser() {
  try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch { return null; }
}

function getCurrentUser() { return _getStoredUser(); }
function setCurrentUser(u) {
  if (u) localStorage.setItem('currentUser', JSON.stringify(u));
  else localStorage.removeItem('currentUser');
}

function signOutGuest() {
  localStorage.removeItem('currentUser');
}

/* ==========================================
   UNIFIED NOTIFICATION SYSTEM
   ========================================== */
const _NT_COLORS = {
  success: { bg: '#006633', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` },
  error:   { bg: '#dc2626', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>` },
  warning: { bg: '#d97706', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>` },
  info:    { bg: '#1d4ed8', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>` }
};

// Inject toast styles once
function _injectNtStyles() {
  if (document.getElementById('_nt_styles')) return;
  const s = document.createElement('style');
  s.id = '_nt_styles';
  s.textContent = `
    .nt-toast{position:fixed;top:1.5rem;right:1.5rem;display:flex;align-items:center;gap:.75rem;padding:.875rem 1.25rem;border-radius:.875rem;font-family:system-ui,sans-serif;font-size:.9rem;font-weight:500;color:#fff;min-width:17rem;max-width:27rem;z-index:99999;box-shadow:0 8px 32px rgba(0,0,0,.25);animation:ntIn .35s cubic-bezier(.34,1.56,.64,1) forwards}
    .nt-toast .nt-close{margin-left:auto;background:none;border:none;color:#fff;opacity:.7;cursor:pointer;padding:0;line-height:1;font-size:1.1rem}
    .nt-toast .nt-close:hover{opacity:1}
    @keyframes ntIn{from{opacity:0;transform:translateX(2rem)}to{opacity:1;transform:translateX(0)}}
    @keyframes ntOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(2rem)}}
    @media(max-width:48rem){
      .nt-toast{top:auto;bottom:5rem;right:1rem;left:1rem;min-width:auto;max-width:none}
      @keyframes ntIn{from{opacity:0;transform:translateY(1.25rem)}to{opacity:1;transform:translateY(0)}}
      @keyframes ntOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(1.25rem)}}
    }
  `;
  document.head.appendChild(s);
}

function showNotification(message, type = 'info', duration = 3500) {
  _injectNtStyles();
  // remove existing
  document.querySelectorAll('.nt-toast').forEach(n => n.remove());

  const c = _NT_COLORS[type] || _NT_COLORS.info;
  const toast = document.createElement('div');
  toast.className = 'nt-toast';
  toast.style.background = c.bg;
  toast.innerHTML = `
    <span class="nt-icon">${c.icon}</span>
    <span class="nt-msg">${escapeHtml(message)}</span>
    <button class="nt-close" aria-label="Close">✕</button>
  `;
  toast.querySelector('.nt-close').onclick = () => _dismissToast(toast);
  document.body.appendChild(toast);

  setTimeout(() => _dismissToast(toast), duration);
}

function _dismissToast(el) {
  if (!el.parentElement) return;
  el.style.animation = 'ntOut .3s ease forwards';
  setTimeout(() => el.remove(), 300);
}

/* ==========================================
   USER DATA HELPERS
   ========================================== */
async function getUserById(id) {
  if (!id) return null;
  const c = await getSupabaseClient();
  const { data } = await c.from('users').select('*').eq('id', id).single();
  return data;
}

async function getAllUsers() {
  const c = await getSupabaseClient();
  const { data } = await c.from('users').select('*').order('created_at', { ascending: false });
  return data || [];
}

async function updateUserProfile(userId, updates) {
  if (!userId) return { error: new Error('User ID missing') };
  const c = await getSupabaseClient();
  return c.from('users').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', userId).select().single();
}

async function deleteUser(userId) {
  if (!userId) return { error: new Error('User ID missing') };
  const c = await getSupabaseClient();
  return c.from('users').delete().eq('id', userId);
}

async function toggleUserAdmin(userId, isAdmin) {
  if (!userId) return { error: new Error('User ID missing') };
  const c = await getSupabaseClient();
  return c.from('users').update({ is_admin: isAdmin }).eq('id', userId).select().single();
}

/* ==========================================
   AVATAR HELPERS
   ========================================== */
function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarUrl(user) {
  return (user?.avatar_url && user.avatar_url.trim()) ? user.avatar_url : null;
}

function hasCustomAvatar(user) {
  return !!(user?.avatar_url && user.avatar_url.trim());
}

/* ==========================================
   UTILITY FUNCTIONS
   ========================================== */
function escapeHtml(text) {
  if (typeof text !== 'string') return String(text ?? '');
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function formatDate(dateString, opts = {}) {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', ...opts
    });
  } catch { return 'Invalid date'; }
}

function debounce(fn, wait) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}
