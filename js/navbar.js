/* ==========================================
   NAVBAR MANAGER
   ========================================== */
class NavbarManager {
  constructor() { this.init(); }

  async init() {
    await this._render();
    this._setupMobile();
  }

  async _render() {
    const container = document.getElementById('header-actions');
    if (!container) return;

    let authUser = null;
    try {
      const client = await getSupabaseClient();
      const { data: { user } } = await client.auth.getUser();
      authUser = user;
    } catch { /* offline or not loaded yet */ }

    const guestStored = _getStoredUser();
    const isGuest = !authUser && guestStored?.guest;

    if (isGuest) {
      // Guest: show sign-in + logout guest
      container.innerHTML = `
        <button class="nav-auth-btn nav-guest-out" id="guestSignOutBtn" title="End guest session">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign In
        </button>
      `;
      document.getElementById('guestSignOutBtn')?.addEventListener('click', () => {
        signOutGuest();
        window.location.href = '/index.html';
      });

      // Hide profile link for guests
      const profileLink = document.getElementById('dynamic-nav-link');
      if (profileLink) profileLink.style.display = 'none';
      return;
    }

    if (!authUser) {
      // Not logged in
      container.innerHTML = `
        <a href="/index.html" class="nav-auth-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Sign In
        </a>
      `;
      const profileLink = document.getElementById('dynamic-nav-link');
      if (profileLink) profileLink.style.display = 'none';
      return;
    }

    // Logged-in user
    const isAdmin = await isUserAdmin();
    const dynLink = document.getElementById('dynamic-nav-link');
    if (dynLink) {
      if (isAdmin) {
        dynLink.textContent = 'Admin';
        dynLink.href = '/pages/admin.html';
      } else {
        dynLink.textContent = 'Profile';
        dynLink.href = '/pages/profile.html';
      }
      dynLink.style.display = '';
    }

    container.innerHTML = `
      <button class="nav-auth-btn" id="signOutBtn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign Out
      </button>
    `;
    document.getElementById('signOutBtn')?.addEventListener('click', async () => {
      try {
        const client = await getSupabaseClient();
        await client.auth.signOut();
      } catch { /* ignore */ }
      setCurrentUser(null);
      showNotification('Signed out', 'success');
      setTimeout(() => { window.location.href = '/index.html'; }, 600);
    });
  }

  _setupMobile() {
    const toggle = document.querySelector('.nav-toggle');
    const links  = document.querySelector('.nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('active');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('nav-open', open);
    });

    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => { new NavbarManager(); });
