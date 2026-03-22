        const DATA_URL = 'assets/data/digidigits.json';
        const grid = document.getElementById('grid');
        const status = document.getElementById('status');
        const searchInput = document.getElementById('search');
        const classSelect = document.getElementById('classFilter');
        const toTopBtn = document.getElementById('to-top');

        let digiData = [], initialColumnWidth = null, currentList = [];

        document.addEventListener('DOMContentLoaded', () => {
            loadData();
            searchInput.addEventListener('input', debounce(applyFilters, 120));
            classSelect.addEventListener('change', applyFilters);
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { searchInput.value = ''; applyFilters(); } });

            // Scroll-to-top behavior
            toTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        async function loadData() {
            setStatus('Cargando...', true);
            try {
                const res = await fetch(DATA_URL);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const data = await res.json();
                digiData = Array.isArray(data) ? data : [];
                populateClassFilter(digiData);
                render(digiData);
                updateInitialColumnWidth();
                window.addEventListener('resize', debounce(() => { updateInitialColumnWidth(); render(currentList); }, 150));
            } catch (err) {
                console.error(err);
                grid.innerHTML = '<div class="placeholder">Error al cargar los datos.</div>';
                setStatus('Error al cargar', false);
            } finally {
                setStatus('', false);
            }
        }

        const setStatus = (text, busy) => {
            status.textContent = text;
            status.setAttribute('aria-busy', busy ? 'true' : 'false');
        };

        function resolveImage(url) {
            if (!url) return '';
            if (/^(https?:)?\/\//.test(url) || url.startsWith('/')) return url;
            try { return new URL(url, document.baseURI).href; } catch { return url; }
        }

        function createCard(item) {
            const article = document.createElement('article');
            article.className = 'card';

            const thumb = document.createElement('div');
            thumb.className = 'thumbnail';

            const img = document.createElement('img');
            img.loading = 'lazy';
            img.alt = item.nombre || '';
            img.src = resolveImage(item.urlImagen || '');

            img.addEventListener('error', () => {
                if (img.parentElement) {
                    img.remove();
                    const fallback = document.createElement('div');
                    fallback.className = 'img-fallback';
                    fallback.textContent = item.nombre ? item.nombre.charAt(0).toUpperCase() : '?';
                    thumb.appendChild(fallback);
                }
            });

            thumb.appendChild(img);
            article.appendChild(thumb);

            const info = document.createElement('div');
            info.className = 'info';

            const code = document.createElement('div');
            code.className = 'code';
            code.textContent = item.codigo || '';
            code.title = item.codigo || '';
            info.appendChild(code);

            const h3 = document.createElement('h3');
            h3.textContent = item.nombre || '';
            info.appendChild(h3);

            const cls = document.createElement('div');
            cls.className = 'class';
            cls.textContent = item.clase || '';
            info.appendChild(cls);

            article.appendChild(info);
            return article;
        }

        function render(list) {
            currentList = Array.isArray(list) ? list : [];
            grid.innerHTML = '';
            if (!currentList.length) {
                grid.innerHTML = '<div class="placeholder">No se encontraron digimons.</div>';
                return;
            }
            const frag = document.createDocumentFragment();
            currentList.forEach(item => frag.appendChild(createCard(item)));
            grid.appendChild(frag);

            // keep grid centered and cards fixed width; no stretching
            grid.style.justifyContent = 'center';
            updateInitialColumnWidth();
        }

        function populateClassFilter(data) {
            const preferredOrder = ['rookie', 'champion', 'ultimate', 'mega', 'boss', 'ancient', 'spirits', 'others'];
            const classesSet = new Set(data.map(d => (d.clase || '').toLowerCase()).filter(Boolean));
            const ordered = [];
            preferredOrder.forEach(c => { if (classesSet.has(c)) { ordered.push(c); classesSet.delete(c); } });
            const rest = Array.from(classesSet).sort();
            const final = ordered.concat(rest);
            classSelect.innerHTML = '<option value="">Todas las clases</option>' + final.map(c => `<option value="${escapeHtmlAttr(c)}">${capitalize(c)}</option>`).join('');
        }

        function applyFilters() {
            const q = searchInput.value.trim().toLowerCase();
            const cls = classSelect.value;
            const filtered = digiData.filter(d => {
                const matchesClass = !cls || (d.clase && d.clase.toLowerCase() === cls);
                const matchesQuery = !q || (d.nombre && d.nombre.toLowerCase().includes(q)) || (d.codigo && d.codigo.toLowerCase().includes(q));
                return matchesClass && matchesQuery;
            });
            render(filtered);
        }

        function updateInitialColumnWidth() {
            const cards = grid.querySelectorAll('.card');
            if (cards.length > 0) {
                const rect = cards[0].getBoundingClientRect();
                if (rect && rect.width > 0) {
                    initialColumnWidth = Math.round(rect.width);
                    document.documentElement.style.setProperty('--card-width', `${initialColumnWidth}px`);
                } else {
                    const cssWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-width'), 10);
                    if (!initialColumnWidth && cssWidth) initialColumnWidth = cssWidth;
                }
            }
        }

        function debounce(fn, wait) {
            let t;
            return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
        }
        function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
        function escapeHtmlAttr(str) { return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }