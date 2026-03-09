/* ==========================================
   HOMEPAGE JS
   ========================================== */

// Parallax hero bg
(function () {
  const bg = document.getElementById('heroBg');
  if (!bg) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      bg.style.transform = `scale(${1 + window.scrollY * 0.0003})`;
      ticking = false;
    });
  }, { passive: true });
})();

// Reveal on scroll
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('active'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
})();

/* ── NEWS SECTION ─────────────────────────── */
(async function loadNews() {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;

  // Strategy 1: same-origin proxy path (avoids mixed-content + CORS entirely)
  const NEWS_API_PROXY  = '/api/v1/getinfo';
  // Strategy 2: direct call (works only if server sends CORS headers and page is HTTP)
  const NEWS_API_DIRECT = 'http://173.249.28.246:8090/api/v1/getinfo';
  const NEWS_BASE = 'https://www.univ-chlef.dz/ar/?p=';

  async function fetchNews() {
    // Try the same-origin proxy first — no mixed-content, no CORS issue
    try {
      const res = await fetch(NEWS_API_PROXY, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return res.json();
    } catch (_) { /* proxy not configured, fall through */ }

    // Fall back to direct call with explicit CORS mode
    const res = await fetch(NEWS_API_DIRECT, {
      mode: 'cors',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  try {
    const { posts } = await fetchNews();

    if (!posts?.length) {
      grid.innerHTML = '<p class="news-error">No news available at the moment.</p>';
      return;
    }

    grid.innerHTML = posts.slice(0, 6).map(p => `
      <a class="news-card reveal" href="${NEWS_BASE}${p.id}" target="_blank" rel="noopener">
        <img class="news-card-img" src="${escapeHtml(p.image)}" alt="" loading="lazy"
             onerror="this.style.background='linear-gradient(135deg,#d4e8d4,#b8d2b8)';this.src=''">
        <div class="news-card-body">
          <span class="news-card-date">${escapeHtml(p.date)}</span>
          <p class="news-card-title">${escapeHtml(p.title)}</p>
          <span class="news-card-link">Read more →</span>
        </div>
      </a>
    `).join('');

    // trigger reveal for newly inserted cards
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('active'); io.unobserve(e.target); } });
    }, { threshold: 0.1 });
    grid.querySelectorAll('.reveal').forEach(el => io.observe(el));

  } catch (err) {
    console.warn('News API unavailable:', err.message);
    grid.innerHTML = '<p class="news-error">University news temporarily unavailable.</p>';
  }
})();

/* ── EVENTS SECTION ───────────────────────── */
(async function loadEvents() {
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;

  function eventDetailUrl(id) {
    return id ? `/pages/event-detail.html?id=${encodeURIComponent(id)}` : '/pages/events.html';
  }

  function renderCard(ev) {
    const img = ev.image_url || 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&w=800';
    const taken = typeof ev.regis_user === 'number' ? ev.regis_user : 0;
    const cap   = typeof ev.capacity === 'number' ? ev.capacity : null;
    const url   = eventDetailUrl(ev.id);
    return `
      <article class="event-card reveal">
        <div class="event-image">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(ev.title || 'Event')}" loading="lazy"
               onerror="this.src='https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&w=800'">
          ${ev.event_date ? `<div class="date-badge">${escapeHtml(ev.event_date)}</div>` : ''}
        </div>
        <div class="event-content">
          <span class="cat-tag">${escapeHtml(ev.category || 'Event')}</span>
          <h3 class="event-title">${escapeHtml(ev.title || 'Event')}</h3>
          ${cap ? `<p class="event-seats">Seats: ${taken} / ${cap}</p>` : ''}
          <a href="${url}" class="event-link">View details</a>
          <a href="${url}" class="event-register-btn">Register</a>
        </div>
      </article>
    `;
  }

  try {
    const client = await getSupabaseClient();
    const today  = new Date().toISOString().split('T')[0];
    const { data, error } = await client
      .from('events')
      .select('id,title,category,event_date,event_time,image_url,capacity,regis_user')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(4);

    if (error) throw error;

    if (!data?.length) {
      grid.innerHTML = '<p class="events-empty">No upcoming events at the moment. Check back soon!</p>';
      return;
    }

    grid.innerHTML = data.map(renderCard).join('');

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('active'); io.unobserve(e.target); } });
    }, { threshold: 0.1 });
    grid.querySelectorAll('.reveal').forEach(el => io.observe(el));

  } catch (err) {
    console.warn('Events load failed:', err);
    grid.innerHTML = '<p class="events-empty">Could not load events. Please try again later.</p>';
  }
})();