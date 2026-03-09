document.addEventListener('DOMContentLoaded', async () => {
  try {
    const client = await getSupabaseClient();
    const { data: { user }, error } = await client.auth.getUser();

    if (error || !user) {
      showNotification('Please sign in to view your profile', 'warning');
      setTimeout(() => { window.location.href = '/index.html'; }, 1500);
      return;
    }

    const userData = await getUserById(user.id);
    if (!userData) {
      showNotification('Error loading profile data', 'error');
      return;
    }

    _renderProfile(userData, user);
    _setupEditForm(userData, user.id);

  } catch (err) {
    console.error('Profile error:', err);
    showNotification('Failed to load profile', 'error');
  }
});

function _renderProfile(u, authUser) {
  const name  = u.full_name || authUser?.email?.split('@')[0] || 'User';
  const uname = u.username  || '';

  // Header row (sidebar)
  document.getElementById('profileDisplayName').textContent = name;
  document.getElementById('profileUsernameText').textContent = uname ? `@${uname}` : '';

  // Avatar
  const avatarEl   = document.getElementById('profileAvatar');
  const initialsEl = document.getElementById('profileInitials');
  if (hasCustomAvatar(u)) {
    avatarEl.innerHTML = `<img src="${escapeHtml(u.avatar_url)}" alt="${escapeHtml(name)}" onerror="this.remove()">`;
  } else {
    initialsEl.textContent = getInitials(name);
  }

  // Info fields
  document.getElementById('profile-fullname').textContent = u.full_name || '—';
  document.getElementById('profile-username').textContent  = uname ? `@${uname}` : '—';
  document.getElementById('profile-email').textContent    = u.email || authUser?.email || '—';
  document.getElementById('profile-bio').textContent      = u.bio || 'No bio yet.';

  // Role badges (main + sidebar)
  const roleBadge        = document.getElementById('profile-role');
  const roleBadgeSidebar = document.getElementById('profile-role-sidebar');

  const roleLabel = u.is_admin ? 'Admin' : (u.role || 'Member');
  const roleClass = u.is_admin ? 'role-badge admin' : 'role-badge user';

  [roleBadge, roleBadgeSidebar].forEach(el => {
    if (!el) return;
    el.textContent = roleLabel;
    el.className   = roleClass;
  });
}

function _setupEditForm(userData, userId) {
  const displayView = document.getElementById('displayView');
  const editView    = document.getElementById('editView');
  const editBtn     = document.getElementById('editProfileBtn');
  const cancelBtn   = document.getElementById('cancelEditBtn');
  const form        = document.getElementById('editProfileForm');

  editBtn.addEventListener('click', () => {
    document.getElementById('editFullname').value = userData.full_name || '';
    document.getElementById('editUsername').value = userData.username  || '';
    document.getElementById('editBio').value      = userData.bio       || '';
    document.getElementById('editAvatar').value   = userData.avatar_url || '';
    displayView.style.display = 'none';
    editView.style.display    = 'block';
  });

  cancelBtn.addEventListener('click', () => {
    editView.style.display    = 'none';
    displayView.style.display = '';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('saveProfileBtn');
    btn.textContent = 'Saving…';
    btn.disabled    = true;

    const updates = {
      full_name:  document.getElementById('editFullname').value.trim(),
      username:   document.getElementById('editUsername').value.trim(),
      bio:        document.getElementById('editBio').value.trim(),
      avatar_url: document.getElementById('editAvatar').value.trim()
    };

    const { error } = await updateUserProfile(userId, updates);

    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Save Changes';
    btn.disabled  = false;

    if (error) {
      showNotification(error.message || 'Update failed', 'error');
    } else {
      showNotification('Profile updated!', 'success');
      setTimeout(() => window.location.reload(), 900);
    }
  });
} 