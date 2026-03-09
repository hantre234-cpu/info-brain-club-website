;(function () {
  'use strict';

  function getEventId() {
    return new URLSearchParams(window.location.search).get('id');
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function setSeatsUI(taken, total) {
    setText('taken-seats', taken);
    setText('total-seats', total);
    const pct = total > 0 ? Math.min(100, (taken / total) * 100) : 0;
    const fill = document.getElementById('seats-progress');
    if (fill) fill.style.width = pct + '%';
  }

  function showError(msg) {
    const el = document.getElementById('event-error');
    if (el) { el.textContent = msg; el.hidden = false; }
  }

  async function init() {
    const eventId   = getEventId();
    const regBtn    = document.getElementById('register-btn');
    const cancelBtn = document.getElementById('cancel-reg-btn');

    if (!eventId) {
      showError('Invalid event link.');
      if (regBtn) regBtn.disabled = true;
      return;
    }

    if (typeof getSupabaseClient !== 'function') {
      showError('Cannot load event data.');
      return;
    }

    let ev = null, taken = 0, total = 0;

    try {
      const client = await getSupabaseClient();
      const resp = await client
        .from('events')
        .select('id,title,description,location,event_date,event_time,category,image_url,capacity,regis_user')
        .eq('id', eventId)
        .single();

      if (resp.error || !resp.data) throw resp.error || new Error('Event not found');
      ev = resp.data;

      setText('event-title', ev.title || 'Event');
      setText('event-category-pill', ev.category || 'Event');
      setText('event-description', ev.description || '');
      setText('event-long-description', ev.description || '');
      setText('event-date-text', ev.event_date || 'Date TBA');
      setText('event-time-text', ev.event_time || 'Time TBA');
      setText('event-location-text', ev.location || 'Location TBA');

      const img  = document.getElementById('event-image');
      if (img && ev.image_url) img.src = ev.image_url;

      const chip = document.getElementById('event-chip-text');
      if (chip) chip.textContent = ev.category || 'Upcoming';

      total = typeof ev.capacity  === 'number' ? ev.capacity  : 0;
      taken = typeof ev.regis_user === 'number' ? ev.regis_user : 0;
      setSeatsUI(taken, total);

      // Check if user is already registered
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        const { count } = await client
          .from('event_registrations')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .eq('user_id', user.id);

        if (count > 0) {
          _showCancelState(regBtn, cancelBtn);
        }
      }

    } catch (err) {
      console.error('Error loading event:', err);
      showError('Could not load this event.');
      if (regBtn) regBtn.disabled = true;
      return;
    }

    /* ── REGISTER ── */
    regBtn?.addEventListener('click', async () => {
      const allowed = await redirectIfGuest();
      if (!allowed) return;

      if (total > 0 && taken >= total) {
        showNotification('This event is fully booked.', 'warning');
        return;
      }

      regBtn.disabled = true;
      regBtn.textContent = 'Registering...';

      try {
        const client = await getSupabaseClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) { window.location.href = '/index.html'; return; }

        // Duplicate check
        const { count } = await client
          .from('event_registrations')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', ev.id)
          .eq('user_id', user.id);

        if (count > 0) {
          showNotification('You are already registered for this event.', 'info');
          _showCancelState(regBtn, cancelBtn);
          return;
        }

        const { error: insErr } = await client
          .from('event_registrations')
          .insert({ event_id: ev.id, user_id: user.id });

        if (insErr) throw insErr;

        taken += 1;
        await client.from('events').update({ regis_user: taken }).eq('id', ev.id);
        setSeatsUI(taken, total);

        showNotification('Successfully registered! 🎉', 'success');
        _showCancelState(regBtn, cancelBtn);

      } catch (err) {
        console.error('Registration error:', err);
        showNotification('Registration failed. Please try again.', 'error');
        regBtn.disabled = false;
        regBtn.textContent = 'Register Now';
      }
    });

    /* ── CANCEL REGISTRATION ── */
    cancelBtn?.addEventListener('click', async () => {
      if (!confirm('Cancel your registration for this event?')) return;
      cancelBtn.disabled = true;
      cancelBtn.textContent = 'Cancelling...';

      try {
        const client = await getSupabaseClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) { window.location.href = '/index.html'; return; }

        const { error } = await client
          .from('event_registrations')
          .delete()
          .eq('event_id', ev.id)
          .eq('user_id', user.id);

        if (error) throw error;

        if (taken > 0) taken -= 1;
        await client.from('events').update({ regis_user: taken }).eq('id', ev.id);
        setSeatsUI(taken, total);

        showNotification('Registration cancelled.', 'info');
        _showRegisterState(regBtn, cancelBtn);

      } catch (err) {
        console.error('Cancel error:', err);
        showNotification('Could not cancel registration.', 'error');
        cancelBtn.disabled = false;
        cancelBtn.textContent = 'Cancel Registration';
      }
    });
  }

  function _showCancelState(reg, cancel) {
    if (reg)    { reg.style.display = 'none'; }
    if (cancel) { cancel.style.display = ''; cancel.disabled = false; cancel.textContent = 'Cancel Registration'; }
  }

  function _showRegisterState(reg, cancel) {
    if (cancel) { cancel.style.display = 'none'; }
    if (reg)    { reg.style.display = ''; reg.disabled = false; reg.textContent = 'Register Now'; }
  }

  init();
})();
