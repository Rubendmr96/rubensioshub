        (function () {
            // Mostrar estilos de foco solo cuando se navega con teclado
            function handleFirstTab(e) {
                if (e.key === 'Tab') {
                    document.body.classList.add('show-focus');
                    window.removeEventListener('keydown', handleFirstTab);
                }
            }
            window.addEventListener('keydown', handleFirstTab);

            // Ensure main-content focusable for skip link
            const main = document.getElementById('main-content');
            if (main) main.setAttribute('tabindex', '-1');

            // Cache nodes
            const details = Array.from(document.querySelectorAll('main details.collapsible'));
            const toggleAllBtn = document.getElementById('toggle-all');
            const tocToggle = document.getElementById('toc-toggle');
            const aside = document.getElementById('aside-nav');
            const asideBackdrop = document.getElementById('aside-backdrop');

            // Helper: set aria-expanded and open state for all details
            function setDetailsOpen(open) {
                details.forEach(d => {
                    d.open = open;
                    const s = d.querySelector('summary');
                    if (s) s.setAttribute('aria-expanded', String(!!d.open));
                });
            }

            // Initialize "Toggle all" button and default state: everything expanded
            if (toggleAllBtn) {
                // Ensure label and state reflect "all expanded" by default
                toggleAllBtn.classList.add('active');
                toggleAllBtn.setAttribute('aria-pressed', 'true');
                const label = toggleAllBtn.querySelector('.toggle-label');
                if (label) label.textContent = 'Colapsar todo';
                // Make sure all details are open initially
                setDetailsOpen(true);

                // Click handler toggles between expand/collapse
                toggleAllBtn.addEventListener('click', () => {
                    const active = toggleAllBtn.classList.toggle('active');
                    setDetailsOpen(active);
                    toggleAllBtn.setAttribute('aria-pressed', String(active));
                    const lbl = toggleAllBtn.querySelector('.toggle-label');
                    if (lbl) lbl.textContent = active ? 'Colapsar todo' : 'Expandir todo';
                });
            }

            // Initialize summaries (aria-expanded + keyboard)
            details.forEach(d => {
                const s = d.querySelector('summary');
                if (!s) return;
                s.setAttribute('aria-expanded', String(!!d.open));
                s.addEventListener('click', () => {
                    setTimeout(() => s.setAttribute('aria-expanded', String(!!d.open)), 10);
                });
                s.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        s.click();
                    }
                });
            });

            // Open/close aside overlay (mobile)
            function openAsideOverlay() {
                aside.classList.add('open');
                aside.setAttribute('aria-hidden', 'false');
                if (tocToggle) {
                    tocToggle.setAttribute('aria-expanded', 'true');
                    tocToggle.textContent = 'Cerrar';
                    tocToggle.setAttribute('aria-label', 'Cerrar índice');
                }
                asideBackdrop.classList.add('show');

                // focus first interactive element inside aside
                const firstFocusable = aside.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
                (firstFocusable || tocToggle).focus();
            }

            function closeAsideOverlay() {
                aside.classList.remove('open');
                aside.setAttribute('aria-hidden', 'true');
                if (tocToggle) {
                    tocToggle.setAttribute('aria-expanded', 'false');
                    tocToggle.textContent = 'Índice';
                    tocToggle.setAttribute('aria-label', 'Mostrar índice');
                }
                asideBackdrop.classList.remove('show');

                // return focus to toggle
                if (tocToggle) tocToggle.focus();
            }

            // Toggle handlers for mobile TOC button
            if (tocToggle) {
                tocToggle.addEventListener('click', () => {
                    aside.classList.contains('open') ? closeAsideOverlay() : openAsideOverlay();
                });
            }
            if (asideBackdrop) asideBackdrop.addEventListener('click', closeAsideOverlay);

            // Close on Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && aside.classList.contains('open')) closeAsideOverlay();
            });

            // Close overlay when clicking a TOC anchor on mobile and scroll to target
            const tocLinks = Array.from(document.querySelectorAll('aside nav a[href^="#"]'));
            tocLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');
                    if (!href || !href.startsWith('#')) return;
                    const id = href.slice(1);
                    const target = document.getElementById(id);

                    // If mobile overlay is open (or on small screens), close it and scroll to target
                    if (window.matchMedia('(max-width:879px)').matches && aside.classList.contains('open')) {
                        // allow overlay to close visually before scrolling
                        closeAsideOverlay();
                        if (target) {
                            setTimeout(() => {
                                // temporary tabindex to allow focus
                                target.setAttribute('tabindex', '-1');
                                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                setTimeout(() => {
                                    target.focus();
                                    target.removeAttribute('tabindex');
                                }, 350);
                            }, 120);
                        }
                    }
                });
            });

            // TOC highlight using IntersectionObserver only on wide screens
            const tocAllLinks = Array.from(document.querySelectorAll('aside nav a'));
            const headings = tocAllLinks
                .map(a => {
                    const id = a.getAttribute('href')?.replace('#', '');
                    if (!id) return null;
                    const el = document.getElementById(id);
                    return el ? { link: a, el } : null;
                })
                .filter(Boolean);

            if ('IntersectionObserver' in window && headings.length && window.matchMedia('(min-width:880px)').matches) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        const match = headings.find(h => h.el === entry.target);
                        if (!match) return;
                        if (entry.isIntersecting) {
                            tocAllLinks.forEach(l => l.removeAttribute('aria-current'));
                            match.link.setAttribute('aria-current', 'true');
                        }
                    });
                }, { root: null, rootMargin: '0px 0px -60% 0px', threshold: 0.01 });

                headings.forEach(h => observer.observe(h.el));
            }

            // Optional: try to remove white background from logo if same-origin
            (function removeWhiteBackground() {
                const img = document.getElementById('header-logo');
                if (!img) return;
                function process() {
                    try {
                        const w = img.naturalWidth, h = img.naturalHeight;
                        if (!w || !h) return;
                        const canvas = document.createElement('canvas');
                        canvas.width = w; canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, w, h);
                        const imgData = ctx.getImageData(0, 0, w, h);
                        const d = imgData.data;
                        let changed = false;
                        const tolerance = 250;
                        for (let i = 0; i < d.length; i += 4) {
                            const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
                            if (a > 0 && r >= tolerance && g >= tolerance && b >= tolerance) {
                                d[i + 3] = 0;
                                changed = true;
                            }
                        }
                        if (changed) {
                            ctx.putImageData(imgData, 0, 0);
                            img.src = canvas.toDataURL('image/png');
                            img.style.background = 'transparent';
                        }
                    } catch (err) {
                        // CORS o limitación: ignorar
                    }
                }
                if (img.complete) process(); else img.onload = process;
            })();
        })();