// Zib Cinema — логика сайта

        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        m3: {
                            surface: '#121212',
                            surfaceDim: '#121212',
                            surfaceBright: '#3a3a3a',
                            surfaceContainerLowest: '#0c0c0c',
                            surfaceContainerLow: '#1b1b1b',
                            surfaceContainer: '#1f1f1f',
                            surfaceContainerHigh: '#292929',
                            surfaceContainerHighest: '#343434',
                            primary: '#d0bcff',
                            onPrimary: '#381e72',
                            primaryContainer: '#4f378b',
                            onPrimaryContainer: '#eaddff',
                            secondary: '#c8c8c8',
                            onSecondary: '#2d2d2d',
                            outline: '#949494',
                            outlineVariant: '#4a4a4a',
                            onSurface: '#ffffff'
                        }
                    },
                    fontFamily: {
                        sans: ['Roboto', 'Inter', 'sans-serif']
                    },
                    borderRadius: {
                        '4xl': '2rem'
                    }
                }
            }
        }
    

// ==================================================

        // --- Тема оформления: палитры нейтральных и акцентных цветов ---
        const THEME_NEUTRALS = {
            dark: {
                surface: '18 18 18', surfaceDim: '18 18 18', surfaceBright: '58 58 58',
                surfaceContainerLowest: '12 12 12', surfaceContainerLow: '27 27 27',
                surfaceContainer: '31 31 31', surfaceContainerHigh: '41 41 41', surfaceContainerHighest: '52 52 52',
                onSurface: '255 255 255', secondary: '200 200 200', onSecondary: '45 45 45',
                outline: '148 148 148', outlineVariant: '74 74 74'
            },
            light: {
                surface: '250 250 250', surfaceDim: '222 222 222', surfaceBright: '255 255 255',
                surfaceContainerLowest: '255 255 255', surfaceContainerLow: '245 245 245',
                surfaceContainer: '239 239 239', surfaceContainerHigh: '233 233 233', surfaceContainerHighest: '226 226 226',
                onSurface: '26 26 26', secondary: '95 95 95', onSecondary: '255 255 255',
                outline: '117 117 117', outlineVariant: '199 199 199'
            }
        };

        const ACCENT_PALETTES = {
            purple: {
                dark:  { primary: '208 188 255', onPrimary: '56 30 114', primaryContainer: '79 55 139', onPrimaryContainer: '234 221 255' },
                light: { primary: '103 80 164', onPrimary: '255 255 255', primaryContainer: '234 221 255', onPrimaryContainer: '33 0 93' }
            },
            blue: {
                dark:  { primary: '168 199 250', onPrimary: '10 48 95', primaryContainer: '26 74 122', onPrimaryContainer: '211 227 253' },
                light: { primary: '58 96 153', onPrimary: '255 255 255', primaryContainer: '216 227 255', onPrimaryContainer: '0 27 61' }
            },
            green: {
                dark:  { primary: '166 217 160', onPrimary: '12 59 15', primaryContainer: '35 81 40', onPrimaryContainer: '194 240 194' },
                light: { primary: '60 128 57', onPrimary: '255 255 255', primaryContainer: '194 240 194', onPrimaryContainer: '7 43 12' }
            },
            pink: {
                dark:  { primary: '255 177 200', onPrimary: '94 17 50', primaryContainer: '124 41 72', onPrimaryContainer: '255 217 227' },
                light: { primary: '179 38 77', onPrimary: '255 255 255', primaryContainer: '255 217 227', onPrimaryContainer: '62 0 24' }
            },
            orange: {
                dark:  { primary: '255 182 140', onPrimary: '84 33 5', primaryContainer: '122 58 16', onPrimaryContainer: '255 220 197' },
                light: { primary: '156 74 26', onPrimary: '255 255 255', primaryContainer: '255 220 197', onPrimaryContainer: '52 17 0' }
            }
        };

        let currentThemeMode = 'dark';
        let currentThemeAccent = 'purple';

        // Применяет тему, меняя CSS-переменные — вся страница обновляется мгновенно, без перезагрузки
        function applyTheme(mode, accent) {
            const neutrals = THEME_NEUTRALS[mode] || THEME_NEUTRALS.dark;
            const accentTokens = (ACCENT_PALETTES[accent] || ACCENT_PALETTES.purple)[mode] || ACCENT_PALETTES.purple.dark;
            const root = document.documentElement.style;

            root.setProperty('--m3-surface', neutrals.surface);
            root.setProperty('--m3-surface-dim', neutrals.surfaceDim);
            root.setProperty('--m3-surface-bright', neutrals.surfaceBright);
            root.setProperty('--m3-surface-container-lowest', neutrals.surfaceContainerLowest);
            root.setProperty('--m3-surface-container-low', neutrals.surfaceContainerLow);
            root.setProperty('--m3-surface-container', neutrals.surfaceContainer);
            root.setProperty('--m3-surface-container-high', neutrals.surfaceContainerHigh);
            root.setProperty('--m3-surface-container-highest', neutrals.surfaceContainerHighest);
            root.setProperty('--m3-on-surface', neutrals.onSurface);
            root.setProperty('--m3-secondary', neutrals.secondary);
            root.setProperty('--m3-on-secondary', neutrals.onSecondary);
            root.setProperty('--m3-outline', neutrals.outline);
            root.setProperty('--m3-outline-variant', neutrals.outlineVariant);

            root.setProperty('--m3-primary', accentTokens.primary);
            root.setProperty('--m3-on-primary', accentTokens.onPrimary);
            root.setProperty('--m3-primary-container', accentTokens.primaryContainer);
            root.setProperty('--m3-on-primary-container', accentTokens.onPrimaryContainer);

            currentThemeMode = mode;
            currentThemeAccent = accent;

            try {
                localStorage.setItem('zib_theme_mode', mode);
                localStorage.setItem('zib_theme_accent', accent);
            } catch (e) { /* localStorage недоступен — не критично, просто не сохранится между визитами */ }
        }

        // Восстанавливаем сохранённую тему СРАЗУ, до отрисовки body — чтобы не было мигания дефолтной темой
        (function initThemeEarly() {
            let savedMode = 'dark';
            let savedAccent = 'purple';
            try {
                savedMode = localStorage.getItem('zib_theme_mode') || 'dark';
                savedAccent = localStorage.getItem('zib_theme_accent') || 'purple';
            } catch (e) { /* игнорируем */ }
            applyTheme(savedMode, savedAccent);
        })();
    

// ==================================================

        // API Configuration (Kinopoisk Unofficial)
        const KP_API_KEY = '8c8e1a50-6322-4135-8875-5d40a5420d86'; 
        const API_HEADERS = { 'X-API-KEY': KP_API_KEY, 'Content-Type': 'application/json' };
        
        const fallbackPoster = 'https://placehold.co/400x600/1d1b20/eaddff?text=Постер+не+найден';

        // Global State
        const NAV_TAB_ORDER = ['home', 'popular', 'collections', 'profile', 'settings'];
        let currentActiveTab = 'home';

        let currentMode = 'external_villybizy'; // По умолчанию Villybizy
        let activeMovieId = null;
        let activeMovieType = 'FILM'; // Хранит тип медиа (FILM, TV_SERIES и т.д.)
        let searchDebounceTimer = null;

        // --- Настройки: тема оформления и акцентный цвет ---
        function setThemeMode(mode) {
            applyTheme(mode, currentThemeAccent);
            updateSettingsUIActiveStates();
        }

        function setThemeAccent(accent) {
            applyTheme(currentThemeMode, accent);
            updateSettingsUIActiveStates();
        }

        // Подсвечивает выбранные сейчас режим темы и акцентный цвет в разделе "Настройки"
        function updateSettingsUIActiveStates() {
            ['dark', 'light'].forEach(mode => {
                const btn = document.getElementById('theme-mode-btn-' + mode);
                if (!btn) return;
                if (mode === currentThemeMode) {
                    btn.classList.add('border-m3-primary', 'bg-m3-primaryContainer', 'text-m3-onPrimaryContainer');
                    btn.classList.remove('border-m3-outlineVariant/30', 'text-m3-secondary');
                } else {
                    btn.classList.remove('border-m3-primary', 'bg-m3-primaryContainer', 'text-m3-onPrimaryContainer');
                    btn.classList.add('border-m3-outlineVariant/30', 'text-m3-secondary');
                }
            });

            ['purple', 'blue', 'green', 'pink', 'orange'].forEach(accent => {
                const btn = document.getElementById('accent-btn-' + accent);
                if (!btn) return;
                const check = btn.querySelector('.check-icon');
                if (accent === currentThemeAccent) {
                    btn.classList.add('border-m3-onSurface', 'scale-110', 'shadow-lg');
                    if (check) check.classList.remove('hidden');
                } else {
                    btn.classList.remove('border-m3-onSurface', 'scale-110', 'shadow-lg');
                    if (check) check.classList.add('hidden');
                }
            });
        }

        // On Load initialization
        window.onload = function() {
            switchNavTab('home');
            loadHomeData(); 
            renderHistory(); 
            updateSettingsUIActiveStates(); // Отражаем сохранённую тему в разделе "Настройки"
            
            // Close suggestions when clicking outside
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.group')) {
                    document.getElementById('search-suggestions').classList.add('hidden');
                }
            });
        };

        // --- ГЕНЕРАЦИЯ КАРТОЧЕК ---
        function createMovieCard(movie, isSlider = false) {
            const mId = movie.kinopoiskId || movie.filmId;
            const rating = movie.ratingKinopoisk || movie.ratingImdb || movie.rating || '—';
            const year = movie.year || 'Н/Д';
            const name = movie.nameRu || movie.nameOriginal || 'Без названия';
            
            // Если карточка в слайдере - задаем фиксированную ширину, иначе - резиновую для сетки
            const widthClass = isSlider ? 'w-36 sm:w-44 shrink-0 snap-start' : 'w-full';
            
            return `
            <div onclick="openMoviePlayer('${mId}')" class="${widthClass} group relative bg-m3-surfaceContainer p-2 sm:p-3 rounded-3xl border border-m3-outlineVariant/20 hover:border-m3-outlineVariant/50 hover:shadow-2xl transition-all duration-300 cursor-pointer shadow-lg flex flex-col justify-between h-full">
                <div class="relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 bg-m3-surfaceContainerLowest">
                    <img src="https://st.kp.yandex.net/images/film_big/${mId}.jpg" alt="${name}" 
                         referrerpolicy="no-referrer"
                         onerror="this.onerror=null; this.src='${fallbackPoster}';"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    <div class="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-400 border border-white/10 shadow">
                        ★ ${rating}
                    </div>
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div class="w-12 h-12 rounded-full bg-m3-primary text-m3-onPrimary flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                            <i class="fa-solid fa-play ml-0.5"></i>
                        </div>
                    </div>
                </div>
                <div class="flex-grow flex flex-col justify-end">
                    <h3 class="font-bold text-xs sm:text-sm text-m3-onSurface line-clamp-2 group-hover:text-m3-primary transition-colors leading-tight">${name}</h3>
                    <div class="flex items-center justify-between text-[10px] sm:text-[11px] text-m3-outline mt-1.5">
                        <span>${year}</span>
                    </div>
                </div>
            </div>
            `;
        }

        // --- ЛОГИКА ВКЛАДОК ---

        // Плавно скрывает секцию-страницу (сразу, без задержки — чтобы не было наложения)
        function hideMainView(el) {
            if (!el) return;
            el.classList.add('hidden');
        }

        // Плавно показывает секцию-страницу (fade + сдвиг слева или справа)
        function showMainView(el, direction = 'right') {
            if (!el) return;
            el.classList.remove('hidden');
            const enterClass = direction === 'left' ? 'view-enter-left' : 'view-enter-right';
            el.classList.add(enterClass);
            // Форсируем reflow, чтобы браузер зафиксировал стартовое состояние перед анимацией
            void el.offsetWidth;
            requestAnimationFrame(() => {
                el.classList.remove(enterClass);
            });
        }

        function switchNavTab(tabName) {
            document.querySelectorAll('.nav-tab-btn').forEach(btn => {
                btn.classList.remove('text-m3-onPrimaryContainer', 'font-bold');
                btn.classList.add('text-m3-secondary');
            });

            const activeBtn = document.getElementById('nav-btn-' + tabName);
            const indicator = document.getElementById('nav-indicator');

            if (activeBtn) {
                activeBtn.classList.add('text-m3-onPrimaryContainer', 'font-bold');
                activeBtn.classList.remove('text-m3-secondary');

                if (indicator) {
                    indicator.style.width = activeBtn.offsetWidth + 'px';
                    indicator.style.left = activeBtn.offsetLeft + 'px';
                }
            }

            const fromIndex = NAV_TAB_ORDER.indexOf(currentActiveTab);
            const toIndex = NAV_TAB_ORDER.indexOf(tabName);
            const direction = toIndex >= fromIndex ? 'right' : 'left';
            currentActiveTab = tabName;

            const homeView = document.getElementById('home-view');
            const popularView = document.getElementById('popular-view');
            const playerView = document.getElementById('player-view');
            const genericView = document.getElementById('generic-view');
            const settingsView = document.getElementById('settings-view');

            if(homeView) hideMainView(homeView);
            if(popularView) hideMainView(popularView);
            hideMainView(playerView);
            hideMainView(genericView);
            hideMainView(settingsView);

            if (tabName === 'home') {
                if(homeView) showMainView(homeView, direction);
            } else if (tabName === 'popular') {
                if(popularView) showMainView(popularView, direction);
                loadPopularTop100(); // Загружаем сетку 100 фильмов
            } else if (tabName === 'settings') {
                showMainView(settingsView, direction);
            } else {
                showMainView(genericView, direction);
                document.getElementById('generic-title').innerText = tabName === 'collections' ? 'Подборки' : 'Профиль';
                document.getElementById('generic-icon').className = tabName === 'collections' ? 'fa-solid fa-layer-group text-purple-400' : 'fa-solid fa-user text-blue-400';
            }
        }

        function showCatalogView() {
            switchNavTab('home');
        }

        // --- ЗАГРУЗКА ДАННЫХ ИЗ API ---
        async function loadHomeData() {
            const slider = document.getElementById('home-popular-slider');
            try {
                const res = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/collections?type=TOP_POPULAR_ALL&page=1`, { headers: API_HEADERS });
                if (!res.ok) throw new Error('API Error');
                const data = await res.json();
                
                if (data.items && data.items.length > 0) {
                    // Берем первые 15 для слайдера на главной
                    slider.innerHTML = data.items.slice(0, 15).map(movie => createMovieCard(movie, true)).join('');
                }
            } catch (err) {
                slider.innerHTML = `<div class="text-sm text-m3-outline py-10">Ошибка загрузки</div>`;
            }
        }

        // Состояние пагинации каталога "Популярное"
        let popularNextPage = 1;      // с какой страницы API начинать следующую подгрузку
        let popularTotalPages = null; // сколько всего страниц по 20 фильмов есть в коллекции
        let popularApiTotal = null;   // сколько всего фильмов в коллекции (из ответа API)
        let popularLoadedCount = 0;   // сколько фильмов уже подгружено и показано (100, 200, 300...)
        let popularLoadingMore = false;

        // Запрашивает несколько страниц коллекции подряд и объединяет фильмы в один список
        async function fetchPopularBatch(startPage, pagesCount) {
            const promises = [];
            for (let i = startPage; i < startPage + pagesCount; i++) {
                promises.push(
                    fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/collections?type=TOP_POPULAR_ALL&page=${i}`, { headers: API_HEADERS })
                    .then(res => res.json())
                );
            }

            const results = await Promise.all(promises);
            let items = [];

            results.forEach(data => {
                if (data.items) items = items.concat(data.items);
                if (typeof data.totalPages === 'number') popularTotalPages = data.totalPages;
                if (typeof data.total === 'number') popularApiTotal = data.total;
            });

            return items;
        }

        // Обновляет надпись "Найдено позиций" реальным числом фильмов во всей коллекции
        function updatePopularCountLabel() {
            const countLabel = document.getElementById('catalog-count-label');
            if (!countLabel) return;
            countLabel.innerHTML = `Найдено позиций: ${popularLoadedCount}`;
        }

        function removeLoadMoreButton() {
            const wrap = document.getElementById('popular-load-more-wrap');
            if (wrap) wrap.remove();
        }

        // Показывает кнопку "Ещё", если в коллекции остались ещё не загруженные страницы
        function renderLoadMoreButton() {
            removeLoadMoreButton();
            if (popularTotalPages && popularNextPage > popularTotalPages) return;

            const grid = document.getElementById('movies-grid-container');
            const wrap = document.createElement('div');
            wrap.id = 'popular-load-more-wrap';
            wrap.className = 'col-span-full flex justify-center pt-2 pb-4';
            wrap.innerHTML = `<button id="popular-load-more-btn" onclick="loadMorePopular()" class="px-6 py-3 rounded-full bg-m3-surfaceContainerHigh hover:bg-m3-primary hover:text-m3-onPrimary text-m3-onSurface font-semibold text-sm transition-colors duration-300 border border-m3-outlineVariant/30 flex items-center gap-2 cursor-pointer">
                <i class="fa-solid fa-plus"></i> Ещё
            </button>`;
            grid.appendChild(wrap);
        }

        async function loadPopularTop100() {
            const grid = document.getElementById('movies-grid-container');

            // Предотвращаем повторную загрузку, если уже что-то загружено
            if(grid.children.length > 0 && !grid.innerHTML.includes('spinner')) return;

            // Сбрасываем пагинацию — это первая загрузка коллекции
            popularNextPage = 1;
            popularTotalPages = null;
            popularApiTotal = null;
            popularLoadedCount = 0;

            grid.innerHTML = `<div class="col-span-full text-center py-10"><i class="fa-solid fa-spinner fa-spin text-m3-primary text-2xl"></i><span class="ml-3 text-m3-outline text-sm block mt-2">Сбор ТОП-100...</span></div>`;

            try {
                // Первая порция — 5 страниц по 20 фильмов = 100 фильмов
                const items = await fetchPopularBatch(popularNextPage, 5);

                if (items.length > 0) {
                    grid.innerHTML = items.map(movie => createMovieCard(movie, false)).join('');
                    popularNextPage += 5;
                    popularLoadedCount = items.length;
                    updatePopularCountLabel();
                    renderLoadMoreButton();
                } else {
                    grid.innerHTML = `<div class="col-span-full text-center py-10 text-m3-outline text-sm">Нет данных.</div>`;
                }
            } catch (err) {
                grid.innerHTML = `<div class="col-span-full text-center py-10 text-m3-outline text-sm">Ошибка сети.</div>`;
            }
        }

        // Подгружает следующую порцию фильмов (ещё до 100) по кнопке "Ещё"
        async function loadMorePopular() {
            if (popularLoadingMore) return;
            if (popularTotalPages && popularNextPage > popularTotalPages) { removeLoadMoreButton(); return; }

            popularLoadingMore = true;
            const btn = document.getElementById('popular-load-more-btn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Загрузка...`;
            }

            try {
                const pagesToFetch = popularTotalPages ? Math.min(5, popularTotalPages - popularNextPage + 1) : 5;
                const items = await fetchPopularBatch(popularNextPage, pagesToFetch);
                const grid = document.getElementById('movies-grid-container');

                removeLoadMoreButton();

                if (items.length > 0) {
                    grid.insertAdjacentHTML('beforeend', items.map(movie => createMovieCard(movie, false)).join(''));
                    popularNextPage += pagesToFetch;
                    popularLoadedCount += items.length;
                }

                updatePopularCountLabel();
                renderLoadMoreButton();
            } catch (err) {
                renderLoadMoreButton(); // возвращаем кнопку, чтобы можно было попробовать ещё раз
            } finally {
                popularLoadingMore = false;
            }
        }

        // --- ИСТОРИЯ ПРОСМОТРОВ (Локальное хранилище) ---
        function renderHistory() {
            const slider = document.getElementById('home-history-slider');
            const history = JSON.parse(localStorage.getItem('zibHistory') || '[]');

            if (history.length === 0) {
                slider.innerHTML = `<div class="text-sm text-m3-outline py-6 px-4 bg-m3-surfaceContainerLow rounded-2xl w-full border border-m3-outlineVariant/20 border-dashed text-center">Вы еще ничего не смотрели. История пуста.</div>`;
            } else {
                slider.innerHTML = history.map(movie => createMovieCard(movie, true)).join('');
            }
        }

        function addToHistory(movieData) {
            if (!movieData.kinopoiskId && !movieData.filmId) return;
            
            let history = JSON.parse(localStorage.getItem('zibHistory') || '[]');
            const mId = movieData.kinopoiskId || movieData.filmId;
            
            // Удаляем старую запись, если фильм уже есть в истории (чтобы поднять его наверх)
            history = history.filter(m => (m.kinopoiskId || m.filmId) != mId);
            history.unshift(movieData); // Вставляем в начало
            
            if (history.length > 20) history.pop(); // Храним только последние 20
            
            localStorage.setItem('zibHistory', JSON.stringify(history));
            renderHistory(); // Обновляем ползунок
        }

        function clearHistory() {
            localStorage.removeItem('zibHistory');
            renderHistory();
        }

        // --- УПРАВЛЕНИЕ СЛАЙДЕРАМИ ---
        function scrollSlider(sliderId, direction) {
            const slider = document.getElementById(sliderId);
            if (slider) {
                // Прокручиваем на 70% ширины видимой области
                const scrollAmount = slider.clientWidth * 0.70; 
                slider.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
            }
        }

        // 2. LIVE SEARCH AUTOCOMPLETE
        function handleLiveSearch(query) {
            query = query.trim();
            const suggestionsBox = document.getElementById('search-suggestions');
            const container = document.getElementById('suggestions-container');
            const icon = document.getElementById('search-btn-icon');

            if (!query) {
                container.innerHTML = '<div class="text-xs text-m3-outline p-3 text-center">Начните вводить название...</div>';
                return;
            }

            // Show loading spinner
            icon.className = 'fa-solid fa-spinner fa-spin';
            
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(async () => {
                try {
                    // Check if query is just numbers (direct ID)
                    if (/^\d+$/.test(query)) {
                        container.innerHTML = `
                            <button onclick="openMoviePlayer('${query}')" class="w-full text-left p-3 hover:bg-m3-surfaceContainerHighest transition-colors flex items-center gap-3 rounded-xl animate-fade-in-down">
                                <div class="w-10 h-10 rounded bg-m3-primaryContainer text-m3-onPrimaryContainer flex items-center justify-center shrink-0"><i class="fa-solid fa-hashtag"></i></div>
                                <div>
                                    <div class="text-sm font-bold text-m3-onSurface">Открыть по ID: ${query}</div>
                                    <div class="text-[10px] text-m3-outline">Прямой переход</div>
                                </div>
                            </button>
                        `;
                        return;
                    }

                    // Text query search
                    const res = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(query)}&page=1`, { headers: API_HEADERS });
                    if (!res.ok) throw new Error('Search failed');
                    const data = await res.json();

                    if (data.films && data.films.length > 0) {
                        // Take top 5 results
                        const topResults = data.films.slice(0, 5);
                        container.innerHTML = topResults.map((film, index) => {
                            const name = film.nameRu || film.nameEn || 'Неизвестно';
                            const year = film.year || '';
                            const rating = film.rating ? `<span class="text-amber-400 font-bold px-1 rounded bg-amber-400/10">★ ${film.rating}</span>` : '';
                            
                            return `
                                <button onclick="openMoviePlayer('${film.filmId}')" class="w-full text-left p-2 hover:bg-m3-surfaceContainerHighest transition-colors flex items-center gap-3 rounded-xl animate-fade-in-down" style="animation-delay: ${index * 50}ms">
                                    <img src="${film.posterUrlPreview || film.posterUrl}" class="w-10 h-14 object-cover rounded bg-m3-surfaceLowest" referrerpolicy="no-referrer" onerror="this.src='${fallbackPoster}'">
                                    <div class="flex-grow min-w-0">
                                        <div class="text-xs sm:text-sm font-bold text-m3-onSurface truncate">${name}</div>
                                        <div class="text-[10px] text-m3-outline flex items-center gap-2 mt-0.5">
                                            <span>${year}</span> ${rating}
                                        </div>
                                    </div>
                                </button>
                            `;
                        }).join('');
                    } else {
                        container.innerHTML = '<div class="text-xs text-m3-outline p-3 text-center">Ничего не найдено</div>';
                    }
                } catch (err) {
                    console.error('Search API error:', err);
                    container.innerHTML = '<div class="text-xs text-red-400 p-3 text-center">Ошибка сети.</div>';
                } finally {
                    icon.className = 'fa-solid fa-arrow-right';
                }
            }, 500); // 500ms debounce
        }

        function executeDirectSearch() {
            const input = document.getElementById('search-input').value.trim();
            if (input) {
                // If it's an ID, open directly
                if (/^\d+$/.test(input)) {
                    openMoviePlayer(input);
                } else {
                    // Force the dropdown to show top result and simulate click on it (for simplicity, we just trigger live search)
                    handleLiveSearch(input);
                    document.getElementById('search-suggestions').classList.remove('hidden');
                }
            }
        }

        // 3. FULL MOVIE DETAILS & PLAYER LOGIC
        async function openMoviePlayer(kpId) {
            // Очищаем поиск
            document.getElementById('search-suggestions').classList.add('hidden');
            document.getElementById('search-input').value = '';

            // Переключаем интерфейс
            const homeView = document.getElementById('home-view');
            const popularView = document.getElementById('popular-view');
            const genericView = document.getElementById('generic-view');
            const playerView = document.getElementById('player-view');

            if(homeView) hideMainView(homeView);
            if(popularView) hideMainView(popularView);
            if(genericView) hideMainView(genericView);
            showMainView(playerView, 'right');
            
            // Ставим загрузочные данные
            document.getElementById('current-player-kp-id').innerText = kpId;
            document.getElementById('player-movie-title').innerText = 'Загрузка информации...';
            document.getElementById('player-movie-description').innerText = '';
            document.getElementById('player-movie-meta').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-m3-primary"></i>';
            document.getElementById('meta-bg-blur').style.backgroundImage = 'none';

            activeMovieId = kpId;
            activeMovieType = 'FILM'; // Значение по умолчанию, пока API не ответит
            
            // Ставим заглушку загрузки плеера, пока ждём данные API
            const wrapper = document.getElementById('player-wrapper');
            if (wrapper) {
                wrapper.innerHTML = `
                    <div class="absolute inset-0 flex flex-col items-center justify-center text-m3-outline gap-3 bg-black">
                        <i class="fa-solid fa-circle-notch fa-spin text-3xl"></i>
                        <span class="text-xs">Подключение медиа...</span>
                    </div>
                `;
            }

            try {
                // Загружаем полные данные из API для плеера
                const res = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/${kpId}`, { headers: API_HEADERS });
                if (res.ok) {
                    const film = await res.json();
                    
                    activeMovieType = film.type || 'FILM'; // Сохраняем тип (FILM, TV_SERIES и т.д.)
                    setPlayerMode(currentMode); // Теперь инжектим iframe, зная тип!
                    
                    const name = film.nameRu || film.nameOriginal || `Фильм #${kpId}`;
                    const year = film.year || 'Н/Д';
                    const rating = film.ratingKinopoisk || film.ratingImdb || '—';
                    const length = film.filmLength ? `${film.filmLength} мин.` : '';
                    const genres = film.genres ? film.genres.map(g => g.genre).slice(0, 3).join(', ') : '';
                    
                    document.getElementById('player-movie-title').innerText = name;
                    document.getElementById('player-movie-description').innerText = film.description || film.shortDescription || 'Описание отсутствует.';
                    
                    document.getElementById('player-movie-meta').innerHTML = `
                        <span class="px-2 py-1 rounded bg-m3-surfaceContainerLow border border-m3-outlineVariant/30">${year}</span>
                        ${genres ? `<span class="px-2 py-1 rounded bg-m3-surfaceContainerLow border border-m3-outlineVariant/30">${genres}</span>` : ''}
                        ${length ? `<span class="px-2 py-1 rounded bg-m3-surfaceContainerLow border border-m3-outlineVariant/30"><i class="fa-regular fa-clock"></i> ${length}</span>` : ''}
                        <span class="px-2 py-1 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">★ ${rating}</span>
                    `;

                    document.getElementById('meta-bg-blur').style.backgroundImage = `url('https://st.kp.yandex.net/images/film_big/${kpId}.jpg')`;

                    // Сохраняем в историю просмотров
                    addToHistory(film);
                }
            } catch (err) {
                console.error("Failed to load details:", err);
                document.getElementById('player-movie-title').innerText = `Просмотр (ID: ${kpId})`;
                document.getElementById('player-movie-meta').innerHTML = '<span class="text-red-400 text-xs">Данные не загружены</span>';
                
                // В случае ошибки пытаемся запустить плеер как фильм по умолчанию
                setPlayerMode(currentMode);
                
                // Сохраняем хотя бы ID в историю, если данные недоступны
                addToHistory({ kinopoiskId: kpId, nameRu: `Фильм #${kpId}` });
            }
        }

        // Dropdown toggle logic
        function togglePlayerSelectMenu() {
            const dropdown = document.getElementById('player-selector-dropdown');
            const arrow = document.getElementById('player-selector-arrow');
            
            if (dropdown.classList.contains('hidden')) {
                dropdown.classList.remove('hidden');
                dropdown.classList.add('flex');
                if (arrow) arrow.style.transform = 'rotate(180deg)';
            } else {
                dropdown.classList.add('hidden');
                dropdown.classList.remove('flex');
                if (arrow) arrow.style.transform = 'rotate(0deg)';
            }
        }

        // Apply Player iframe injection
        function setPlayerMode(mode) {
            currentMode = mode;
            if (!activeMovieId) return;

            // Close dropdown
            const dropdown = document.getElementById('player-selector-dropdown');
            const arrow = document.getElementById('player-selector-arrow');
            if (dropdown) { dropdown.classList.add('hidden'); dropdown.classList.remove('flex'); }
            if (arrow) arrow.style.transform = 'rotate(0deg)';

            // Update UI Badges
            const namesMap = {
                'external_villybizy': 'Villybizy',
                'external_collaps': 'Collaps CDN',
                'external_videocdn': 'VideoCDN',
                'external_kinobox': 'Kinobox'
            };
            document.getElementById('active-player-name-badge').innerText = namesMap[mode] || 'Плеер';

            // Reset buttons styling
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('bg-m3-primaryContainer', 'text-m3-onPrimaryContainer');
                const check = btn.querySelector('.check-icon');
                if (check) check.classList.add('hidden');
            });
            const activeBtn = document.getElementById('btn-mode-' + mode);
            if (activeBtn) {
                activeBtn.classList.add('bg-m3-primaryContainer', 'text-m3-onPrimaryContainer');
                const check = activeBtn.querySelector('.check-icon');
                if (check) check.classList.remove('hidden');
            }

            // Inject Iframe
            const wrapper = document.getElementById('player-wrapper');
            let iframeSrc = '';

            if (mode === 'external_kinobox') {
                iframeSrc = `https://kinobox.tv/kinopoisk/${activeMovieId}`; 
            } else if (mode === 'external_villybizy') {
                // Логика Villybizy: проверяем сериал ли это
                const isSeries = ['TV_SERIES', 'MINI_SERIES', 'TV_SHOW'].includes(activeMovieType);
                const route = isSeries ? 'series' : 'film';
                iframeSrc = `https://villybizy.skin/${route}/${activeMovieId}/`; 
            } else if (mode === 'external_collaps') {
                iframeSrc = `https://api.collaps.org/embed/movie/${activeMovieId}`;
            } else if (mode === 'external_videocdn') {
                iframeSrc = `https://vids.suralis.stream/v2/embed/kp/${activeMovieId}`;
            }

            // Сбрасываем предыдущий таймер и прячем подсказку про долгую загрузку
            if (window.playerStallTimer) clearTimeout(window.playerStallTimer);
            const stallHint = document.getElementById('player-stall-hint');
            if (stallHint) stallHint.classList.add('hidden');

            if (wrapper) {
                wrapper.innerHTML = `
                    <iframe src="${iframeSrc}" 
                            id="active-player-iframe"
                            allowfullscreen 
                            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                            referrerpolicy="origin"
                            class="w-full h-full border-0 absolute inset-0 z-10 bg-black">
                    </iframe>
                `;

                // Если за 8 секунд iframe даже не начал грузиться (частая история для
                // проблемных источников на мобильных сетях) — предлагаем переключиться
                let iframeLoaded = false;
                const iframeEl = document.getElementById('active-player-iframe');
                if (iframeEl) {
                    iframeEl.onload = () => { iframeLoaded = true; };
                }
                window.playerStallTimer = setTimeout(() => {
                    if (!iframeLoaded && stallHint) stallHint.classList.remove('hidden');
                }, 8000);
            }
        }
    
