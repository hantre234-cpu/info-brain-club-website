/**
 * UHBC Shared Footer Component
 * Inject into any page: <script src="/js/footer.js"></script>
 * Then call: Footer.render();
 */
const Footer = (() => {
    const CSS = `
        .uhbc-footer {
            background: #0f172a;
            color: #94a3b8;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 3rem 2rem 1.5rem;
            margin-top: auto;
        }
        .uhbc-footer__inner {
            max-width: 1280px;
            margin: 0 auto;
        }
        .uhbc-footer__grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 2.5rem;
            padding-bottom: 2.5rem;
            border-bottom: 1px solid #1e293b;
        }
        .uhbc-footer__brand-logo {
            width: 40px;
            height: 40px;
            background: url('uhbc_logo.svg') center/contain no-repeat;
            margin-bottom: 0.75rem;
        }
        .uhbc-footer__brand-name {
            font-size: 1.2rem;
            font-weight: 700;
            color: #f1f5f9;
            margin-bottom: 0.75rem;
        }
        .uhbc-footer__brand-name span { color: #ff8a02; }
        .uhbc-footer__desc {
            font-size: 0.875rem;
            line-height: 1.7;
            color: #64748b;
            max-width: 260px;
        }
        .uhbc-footer__col-title {
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #f1f5f9;
            margin-bottom: 1rem;
        }
        .uhbc-footer__col ul {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 0.55rem;
        }
        .uhbc-footer__col ul a {
            font-size: 0.875rem;
            color: #64748b;
            text-decoration: none;
            transition: color 0.15s;
        }
        .uhbc-footer__col ul a:hover { color: #ff8a02; }
        .uhbc-footer__bottom {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 1.5rem;
            font-size: 0.8rem;
            gap: 1rem;
            flex-wrap: wrap;
        }
        .uhbc-footer__socials {
            display: flex;
            gap: 0.75rem;
        }
        .uhbc-footer__social-link {
            width: 34px;
            height: 34px;
            border-radius: 8px;
            background: #1e293b;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            color: #94a3b8;
            transition: background 0.15s, color 0.15s;
            font-size: 0.85rem;
        }
        .uhbc-footer__social-link:hover {
            background: #ff8a02;
            color: white;
        }
        @media (max-width: 768px) {
            .uhbc-footer__grid {
                grid-template-columns: 1fr 1fr;
            }
        }
        @media (max-width: 480px) {
            .uhbc-footer__grid {
                grid-template-columns: 1fr;
            }
            .uhbc-footer__bottom {
                flex-direction: column;
                text-align: center;
            }
        }
    `;

    function injectStyles() {
        if (document.getElementById('uhbc-footer-styles')) return;
        const style = document.createElement('style');
        style.id = 'uhbc-footer-styles';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function render({ container = null } = {}) {
        injectStyles();

        const year = new Date().getFullYear();

        const html = `
            <footer class="uhbc-footer" id="uhbc-footer">
                <div class="uhbc-footer__inner">
                    <div class="uhbc-footer__grid">
                        <div class="uhbc-footer__col">
                            <div class="uhbc-footer__brand-logo"></div>
                            <div class="uhbc-footer__brand-name">UH<span>BC</span></div>
                            <p class="uhbc-footer__desc">
                                Unified Hub for Building Communities — connecting students, researchers, and innovators across Algeria.
                            </p>
                        </div>
                        <div class="uhbc-footer__col">
                            <div class="uhbc-footer__col-title">Platform</div>
                            <ul>
                                <li><a href="homepage.html">Home</a></li>
                                <li><a href="news.html">News</a></li>
                                <li><a href="resources.html">Resources</a></li>
                                <li><a href="about.html">About</a></li>
                            </ul>
                        </div>
                        <div class="uhbc-footer__col">
                            <div class="uhbc-footer__col-title">Account</div>
                            <ul>
                                <li><a href="index.html">Sign in</a></li>
                                <li><a href="index.html#register">Sign up</a></li>
                                <li><a href="profile.html">Profile</a></li>
                                <li><a href="settings.html">Settings</a></li>
                            </ul>
                        </div>
                        <div class="uhbc-footer__col">
                            <div class="uhbc-footer__col-title">Legal</div>
                            <ul>
                                <li><a href="privacy.html">Privacy Policy</a></li>
                                <li><a href="terms.html">Terms of Use</a></li>
                                <li><a href="contact.html">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="uhbc-footer__bottom">
                        <span>© ${year} UHBC · AI House. All rights reserved.</span>
                        <div class="uhbc-footer__socials">
                            <a href="#" class="uhbc-footer__social-link" title="Facebook">f</a>
                            <a href="#" class="uhbc-footer__social-link" title="Twitter/X">𝕏</a>
                            <a href="#" class="uhbc-footer__social-link" title="LinkedIn">in</a>
                            <a href="#" class="uhbc-footer__social-link" title="GitHub">gh</a>
                        </div>
                    </div>
                </div>
            </footer>`;

        const target = container || document.body;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        target.appendChild(wrapper.firstElementChild);
    }

    return { render };
})();
