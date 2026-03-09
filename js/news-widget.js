/**
 * UHBC News Widget
 * Fetches from https://173.249.28.246:8090/api/v1/getinfo
 * and renders news cards. Each item links to https://www.univ-chlef.dz/ar/?p={id}
 *
 * Usage:
 *   <div id="news-widget"></div>
 *   <script src="/js/news-widget.js"></script>
 *   <script>NewsWidget.render('#news-widget');</script>
 */
const NewsWidget = (() => {
    const API_URL = 'https://173.249.28.246:8090/api/v1/getinfo';
    const POST_URL = (id) => `https://www.univ-chlef.dz/ar/?p=${id}`;

    // ── Skeleton loader HTML ──────────────────────────────────
    function skeletons(count = 4) {
        return Array.from({ length: count })
            .map(() => `<li class="news-widget__skeleton"></li>`)
            .join('');
    }

    // ── Single news item HTML ─────────────────────────────────
    function itemHTML(post) {
        const href = POST_URL(post.id);
        const title = escapeHTML(post.title || '');
        const date  = escapeHTML(post.date  || '');
        const img   = escapeHTML(post.image || '');

        return `
            <li>
                <a href="${href}" target="_blank" rel="noopener noreferrer" class="news-widget__item">
                    <img
                        class="news-widget__thumb"
                        src="${img}"
                        alt="${title}"
                        loading="lazy"
                        onerror="this.style.background='#e2e8f0'; this.removeAttribute('src');"
                    >
                    <div class="news-widget__body">
                        <div class="news-widget__title" dir="rtl" lang="ar">${title}</div>
                        <div class="news-widget__date">${date}</div>
                    </div>
                </a>
            </li>`;
    }

    // ── Sanitise text for HTML attributes / content ───────────
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── Fetch news from API ───────────────────────────────────
    async function fetchNews() {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const res = await fetch(API_URL, { signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return Array.isArray(data.posts) ? data.posts : [];
        } finally {
            clearTimeout(timeout);
        }
    }

    // ── Main render function ──────────────────────────────────
    async function render(selector = '#news-widget', options = {}) {
        const { title = 'أخبار جامعة الشلف', maxItems = 5 } = options;

        const container = typeof selector === 'string'
            ? document.querySelector(selector)
            : selector;

        if (!container) {
            console.warn(`[NewsWidget] Container "${selector}" not found.`);
            return;
        }

        // Build widget shell with skeleton loaders
        container.innerHTML = `
            <div class="news-widget">
                <div class="news-widget__header">${title}</div>
                <ul class="news-widget__list" id="_nw_list">
                    ${skeletons(maxItems)}
                </ul>
            </div>`;

        const list = container.querySelector('#_nw_list');

        try {
            const posts = await fetchNews();

            if (!posts.length) {
                list.innerHTML = `<li class="news-widget__error">No news available.</li>`;
                return;
            }

            list.innerHTML = posts
                .slice(0, maxItems)
                .map(itemHTML)
                .join('');

        } catch (err) {
            const isAbort = err.name === 'AbortError';
            list.innerHTML = `
                <li class="news-widget__error">
                    ${isAbort ? 'Request timed out.' : 'Failed to load news.'}<br>
                    <small>${escapeHTML(err.message)}</small>
                </li>`;
            console.error('[NewsWidget] Fetch error:', err);
        }
    }

    return { render, fetchNews };
})();
