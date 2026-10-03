// Конфигурация Tailwind CSS
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                m3: {
                    surface: 'rgb(var(--m3-surface) / <alpha-value>)',
                    surfaceDim: 'rgb(var(--m3-surface-dim) / <alpha-value>)',
                    surfaceBright: 'rgb(var(--m3-surface-bright) / <alpha-value>)',
                    surfaceContainerLowest: 'rgb(var(--m3-surface-container-lowest) / <alpha-value>)',
                    surfaceContainerLow: 'rgb(var(--m3-surface-container-low) / <alpha-value>)',
                    surfaceContainer: 'rgb(var(--m3-surface-container) / <alpha-value>)',
                    surfaceContainerHigh: 'rgb(var(--m3-surface-container-high) / <alpha-value>)',
                    surfaceContainerHighest: 'rgb(var(--m3-surface-container-highest) / <alpha-value>)',
                    primary: 'rgb(var(--m3-primary) / <alpha-value>)',
                    onPrimary: 'rgb(var(--m3-on-primary) / <alpha-value>)',
                    primaryContainer: 'rgb(var(--m3-primary-container) / <alpha-value>)',
                    onPrimaryContainer: 'rgb(var(--m3-on-primary-container) / <alpha-value>)',
                    secondary: 'rgb(var(--m3-secondary) / <alpha-value>)',
                    onSecondary: 'rgb(var(--m3-on-secondary) / <alpha-value>)',
                    outline: 'rgb(var(--m3-outline) / <alpha-value>)',
                    outlineVariant: 'rgb(var(--m3-outline-variant) / <alpha-value>)',
                    onSurface: 'rgb(var(--m3-on-surface) / <alpha-value>)'
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
};

// Material You Soft / Desaturated Color Generator
let currentThemeMode = 'dark';
let currentThemeColor = '#8C694D';

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgbStr(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return `${Math.round(255 * f(0))} ${Math.round(255 * f(8))} ${Math.round(255 * f(4))}`;
}

function generateDynamicM3Palette(hexColor, mode) {
    const { r, g, b } = hexToRgb(hexColor);
    const { h, s } = rgbToHsl(r, g, b);
    const isDark = mode === 'dark';

    const surfSat = Math.min(s, 10);
    const priSat = Math.min(s, 32);

    if (isDark) {
        return {
            surface: hslToRgbStr(h, surfSat, 11),
            surfaceDim: hslToRgbStr(h, surfSat, 9),
            surfaceBright: hslToRgbStr(h, surfSat, 20),
            surfaceContainerLowest: hslToRgbStr(h, surfSat, 7),
            surfaceContainerLow: hslToRgbStr(h, surfSat, 13),
            surfaceContainer: hslToRgbStr(h, surfSat, 16),
            surfaceContainerHigh: hslToRgbStr(h, surfSat, 20),
            surfaceContainerHighest: hslToRgbStr(h, surfSat, 24),
            onSurface: hslToRgbStr(h, 10, 88),
            secondary: hslToRgbStr(h, 12, 70),
            onSecondary: hslToRgbStr(h, 15, 20),
            outline: hslToRgbStr(h, 10, 50),
            outlineVariant: hslToRgbStr(h, 10, 28),
            primary: hslToRgbStr(h, priSat, 72),
            onPrimary: hslToRgbStr(h, priSat, 18),
            primaryContainer: hslToRgbStr(h, priSat, 30),
            onPrimaryContainer: hslToRgbStr(h, priSat, 90)
        };
    } else {
        return {
            surface: hslToRgbStr(h, surfSat, 96),
            surfaceDim: hslToRgbStr(h, surfSat, 85),
            surfaceBright: hslToRgbStr(h, surfSat, 98),
            surfaceContainerLowest: hslToRgbStr(h, surfSat, 100),
            surfaceContainerLow: hslToRgbStr(h, surfSat, 94),
            surfaceContainer: hslToRgbStr(h, surfSat, 91),
            surfaceContainerHigh: hslToRgbStr(h, surfSat, 88),
            surfaceContainerHighest: hslToRgbStr(h, surfSat, 84),
            onSurface: hslToRgbStr(h, 10, 15),
            secondary: hslToRgbStr(h, 12, 40),
            onSecondary: hslToRgbStr(h, 12, 98),
            outline: hslToRgbStr(h, 10, 55),
            outlineVariant: hslToRgbStr(h, 10, 82),
            primary: hslToRgbStr(h, priSat, 38),
            onPrimary: hslToRgbStr(h, 0, 98),
            primaryContainer: hslToRgbStr(h, priSat, 85),
            onPrimaryContainer: hslToRgbStr(h, priSat, 18)
        };
    }
}

function applyTheme(mode, colorHex) {
    const tokens = generateDynamicM3Palette(colorHex, mode);
    const root = document.documentElement.style;

    root.setProperty('--m3-primary-hex', colorHex);
    root.setProperty('--m3-surface', tokens.surface);
    root.setProperty('--m3-surface-dim', tokens.surfaceDim);
    root.setProperty('--m3-surface-bright', tokens.surfaceBright);
    root.setProperty('--m3-surface-container-lowest', tokens.surfaceContainerLowest);
    root.setProperty('--m3-surface-container-low', tokens.surfaceContainerLow);
    root.setProperty('--m3-surface-container', tokens.surfaceContainer);
    root.setProperty('--m3-surface-container-high', tokens.surfaceContainerHigh);
    root.setProperty('--m3-surface-container-highest', tokens.surfaceContainerHighest);
    root.setProperty('--m3-on-surface', tokens.onSurface);
    root.setProperty('--m3-secondary', tokens.secondary);
    root.setProperty('--m3-on-secondary', tokens.onSecondary);
    root.setProperty('--m3-outline', tokens.outline);
    root.setProperty('--m3-outline-variant', tokens.outlineVariant);

    root.setProperty('--m3-primary', tokens.primary);
    root.setProperty('--m3-on-primary', tokens.onPrimary);
    root.setProperty('--m3-primary-container', tokens.primaryContainer);
    root.setProperty('--m3-on-primary-container', tokens.onPrimaryContainer);

    if (mode === 'light') {
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.add('dark');
    }

    currentThemeMode = mode;
    currentThemeColor = colorHex;

    try {
        localStorage.setItem('zib_theme_mode', mode);
        localStorage.setItem('zib_theme_color', colorHex);
    } catch (e) {}
}

(function initThemeEarly() {
    let savedMode = 'dark';
    let savedColor = '#8C694D';
    try {
        savedMode = localStorage.getItem('zib_theme_mode') || 'dark';
        savedColor = localStorage.getItem('zib_theme_color') || '#8C694D';
    } catch (e) {}
    applyTheme(savedMode, savedColor);
})();

// JavaScript Application Logic
const KP_API_KEY = '8c8e1a50-6322-4135-8875-5d40a5420d86';
const API_HEADERS = { 'X-API-KEY': KP_API_KEY, 'Content-Type': 'application/json' };

const fallbackPoster = 'https://placehold.co/400x600/181614/e2dcd6?text=Постер+не+найден';

const NAV_TAB_ORDER = ['home', 'popular', 'collections', 'profile', 'search', 'settings'];
let currentActiveTab = 'home';

let currentMode = 'external_sspoisk';
let activeMovieId = null;
let activeMovieType = 'FILM';
let searchDebounceTimer = null;

function setThemeMode(mode) {
    applyTheme(mode, currentThemeColor);
    updateSettingsUIActiveStates();
}

function setThemeColor(hexColor) {
    applyTheme(currentThemeMode, hexColor);
    updateSettingsUIActiveStates();
}

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

    document.querySelectorAll('.color-swatch-btn').forEach(btn => {
        const btnColor = btn.getAttribute('data-color');
        const check = btn.querySelector('.check-icon');
        if (btnColor && btnColor.toLowerCase() === currentThemeColor.toLowerCase()) {
            btn.classList.add('border-m3-onSurface', 'scale-110', 'shadow-lg');
            if (check) check.classList.remove('hidden');
        } else {
            btn.classList.remove('border-m3-onSurface', 'scale-110', 'shadow-lg');
            if (check) check.classList.add('hidden');
        }
    });

    const picker = document.getElementById('custom-color-picker');
    const hexLabel = document.getElementById('custom-hex-label');
    if (picker) picker.value = currentThemeColor;
    if (hexLabel) hexLabel.innerText = currentThemeColor.toUpperCase();
}

window.onload = function() {
    switchNavTab('home');
    initSliderFades();
    initSliderArrows();
    loadHomeData();
    renderHistory();
    initAuth();
    updateSettingsUIActiveStates();

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.group')) {
            document.getElementById('search-suggestions').classList.add('hidden');
        }
    });

    window.addEventListener('resize', () => {
        updateNavIndicator(currentActiveTab);
    });
};

function updateSliderFade(el) {
    const first = el.firstElementChild, last = el.lastElementChild;
    const wrap = el.parentElement;
    const fl = wrap && wrap.querySelector('.slider-fade-l');
    const fr = wrap && wrap.querySelector('.slider-fade-r');
    if (!first || !last || !fl || !fr) return;

    [fl, fr].forEach(o => {
        o.style.top = first.offsetTop + 'px';
        o.style.height = first.offsetHeight + 'px';
    });

    const box = el.getBoundingClientRect();
    fl.classList.toggle('is-on', first.getBoundingClientRect().left < box.left - 2);
    fr.classList.toggle('is-on', last.getBoundingClientRect().right > box.right + 2);
}

function initSliderFades() {
    document.querySelectorAll('.fade-slider').forEach(el => {
        el.addEventListener('scroll', () => updateSliderFade(el), { passive: true });
        new ResizeObserver(() => updateSliderFade(el)).observe(el);
        new MutationObserver(() => updateSliderFade(el)).observe(el, { childList: true });
        updateSliderFade(el);
    });
    window.addEventListener('resize', () => {
        document.querySelectorAll('.fade-slider').forEach(updateSliderFade);
    });
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => document.querySelectorAll('.fade-slider').forEach(updateSliderFade));
    }
}

function initSliderArrows() {
    const NEAR = 140;
    const MIN_OPACITY = 0.25;
    let ticking = false, mx = 0, my = 0;

    function update() {
        ticking = false;
        document.querySelectorAll('.slider-arrow').forEach(btn => {
            const r = btn.getBoundingClientRect();
            if (!r.width) return;
            const dx = mx - (r.left + r.width / 2);
            const dy = my - (r.top + r.height / 2);
            const dist = Math.max(0, Math.hypot(dx, dy) - r.width / 2);
            const t = Math.max(0, 1 - dist / NEAR);
            btn.style.opacity = (MIN_OPACITY + (1 - MIN_OPACITY) * t).toFixed(2);
        });
    }

    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
}

function createMovieCard(movie, isSlider = false) {
    const mId = movie.kinopoiskId || movie.filmId;
    const rating = movie.ratingKinopoisk || movie.ratingImdb || movie.rating || '—';
    const year = movie.year || 'Н/Д';
    const name = esc(movie.nameRu || movie.nameOriginal || movie.nameEn || 'Без названия');
    const isFav = favIds.has(String(mId));
    const slim = slimMovie(movie);
    if (slim) movieRegistry.set(String(mId), slim);

    const widthClass = isSlider ? 'w-36 sm:w-44 shrink-0 snap-start' : 'w-full';

    return `
    <div onclick="openMoviePlayer('${mId}')" data-mid="${mId}" class="${isSlider ? '' : 'grid-card '}${widthClass} group relative bg-m3-surfaceContainer p-2 sm:p-3 rounded-3xl border border-m3-outlineVariant/20 hover:border-m3-outlineVariant/50 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between h-full">
        <div class="relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 bg-m3-surfaceContainerLowest">
            <img src="https://st.kp.yandex.net/images/film_big/${mId}.jpg" alt="${name}"
                 referrerpolicy="no-referrer" loading="lazy" decoding="async"
                 onerror="this.onerror=null; this.src='${fallbackPoster}';"
                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="absolute top-2 right-2 bg-black/80 px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-300 border border-white/10 shadow">
                ★ ${rating}
            </div>
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div class="w-12 h-12 rounded-full bg-m3-primary text-m3-onPrimary flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                    <i class="fa-solid fa-play ml-0.5"></i>
                </div>
            </div>
            <button type="button" data-fav="${mId}" aria-label="Избранное" onclick="event.stopPropagation(); toggleFavorite('${mId}')" class="fav-btn ${isFav ? 'is-fav' : ''} absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-xs cursor-pointer">
                <i class="${isFav ? 'fa-solid text-rose-400' : 'fa-regular text-white'} fa-heart"></i>
            </button>
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

function hideMainView(el) {
    if (!el) return;
    el.classList.add('hidden');
}

function showMainView(el, direction = 'right') {
    if (!el) return;
    el.classList.remove('hidden');
    const enterClass = direction === 'left' ? 'view-enter-left' : 'view-enter-right';
    el.classList.add(enterClass);
    void el.offsetWidth;
    requestAnimationFrame(() => {
        el.classList.remove(enterClass);
    });
}

function stopPlayer() {
    const wrapper = document.getElementById('player-wrapper');
    if (wrapper) wrapper.innerHTML = '';
    activeMovieId = null;
}

let navAnimFrame = null;

function updateNavIndicator(tabName) {
    const activeBtn = document.getElementById('nav-btn-' + tabName);
    const indicator = document.getElementById('nav-indicator');
    if (!activeBtn || !indicator) return;

    indicator.style.opacity = '1';

    if (window.innerWidth >= 640) {
        if (navAnimFrame) { cancelAnimationFrame(navAnimFrame); navAnimFrame = null; }
        indicator.style.transition = '';
        indicator.style.width = activeBtn.offsetWidth + 'px';
        indicator.style.left = activeBtn.offsetLeft + 'px';
        return;
    }

    const nav = activeBtn.closest('nav');
    indicator.style.transition = 'none';

    let curL = parseFloat(indicator.style.left) || 0;
    let curW = parseFloat(indicator.style.width) || 0;
    if (curW === 0) {
        curL = activeBtn.offsetLeft;
        curW = activeBtn.offsetWidth;
    }

    if (navAnimFrame) cancelAnimationFrame(navAnimFrame);
    const start = performance.now();

    function step(now) {
        const btn = document.getElementById('nav-btn-' + currentActiveTab) || activeBtn;
        const tl = btn.offsetLeft, tw = btn.offsetWidth;
        curL += (tl - curL) * 0.2;
        curW += (tw - curW) * 0.2;
        indicator.style.left = curL + 'px';
        indicator.style.width = curW + 'px';

        if (nav && nav.scrollWidth > nav.clientWidth) {
            const want = tl - (nav.clientWidth - tw) / 2;
            nav.scrollLeft += (want - nav.scrollLeft) * 0.2;
        }

        const settled = Math.abs(tl - curL) < 0.5 && Math.abs(tw - curW) < 0.5;
        if (now - start < 450 || !settled) {
            navAnimFrame = requestAnimationFrame(step);
        } else {
            indicator.style.left = tl + 'px';
            indicator.style.width = tw + 'px';
            navAnimFrame = null;
        }
    }
    navAnimFrame = requestAnimationFrame(step);
}

function switchNavTab(tabName) {
    stopPlayer();

    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.classList.remove('text-m3-onPrimaryContainer', 'font-bold', 'is-active-tab');
        btn.classList.add('text-m3-secondary');
    });

    const activeBtn = document.getElementById('nav-btn-' + tabName);
    if (activeBtn) {
        activeBtn.classList.add('text-m3-onPrimaryContainer', 'font-bold', 'is-active-tab');
        activeBtn.classList.remove('text-m3-secondary');
    }

    updateNavIndicator(tabName);

    const fromIndex = NAV_TAB_ORDER.indexOf(currentActiveTab);
    const toIndex = NAV_TAB_ORDER.indexOf(tabName);
    const direction = toIndex >= fromIndex ? 'right' : 'left';
    currentActiveTab = tabName;

    const homeView = document.getElementById('home-view');
    const popularView = document.getElementById('popular-view');
    const searchView = document.getElementById('search-view');
    const playerView = document.getElementById('player-view');
    const genericView = document.getElementById('generic-view');
    const settingsView = document.getElementById('settings-view');
    const profileView = document.getElementById('profile-view');
    const collectionsView = document.getElementById('collections-view');

    hideMainView(profileView);
    hideMainView(collectionsView);
    if(homeView) hideMainView(homeView);
    if(popularView) hideMainView(popularView);
    if(searchView) hideMainView(searchView);
    hideMainView(playerView);
    hideMainView(genericView);
    hideMainView(settingsView);

    if (tabName === 'home') {
        if(homeView) showMainView(homeView, direction);
    } else if (tabName === 'popular') {
        if(popularView) showMainView(popularView, direction);
        loadPopularTop100();
    } else if (tabName === 'search') {
        if(searchView) showMainView(searchView, direction);
    } else if (tabName === 'settings') {
        showMainView(settingsView, direction);
    } else if (tabName === 'profile') {
        showMainView(profileView, direction);
        renderProfileView();
        if (authUser && !freshToken) loadSessions();
    } else if (tabName === 'collections') {
        showMainView(collectionsView, direction);
        renderCollections();
    } else {
        showMainView(genericView, direction);
        document.getElementById('generic-title').innerText = tabName === 'collections' ? 'Подборки' : 'Профиль';
        document.getElementById('generic-icon').className = tabName === 'collections' ? 'fa-solid fa-layer-group' : 'fa-solid fa-user';
    }
}

let savedListState = null;

function visibleCardById(mid) {
    return [...document.querySelectorAll('[data-mid="' + mid + '"]')].find(e => e.offsetParent !== null) || null;
}

function saveListState(kpId) {
    const playerView = document.getElementById('player-view');
    if (playerView && !playerView.classList.contains('hidden')) return;

    const card = visibleCardById(kpId);
    const sliders = {};
    document.querySelectorAll('.fade-slider').forEach(el => { sliders[el.id] = el.scrollLeft; });

    savedListState = {
        tab: currentActiveTab,
        mid: String(kpId),
        y: window.scrollY,
        offset: card ? card.getBoundingClientRect().top : null,
        sliders
    };
}

function restoreListState() {
    const st = savedListState;
    if (!st || st.tab !== currentActiveTab) return;
    savedListState = null;

    Object.keys(st.sliders).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.scrollBehavior = 'auto';
        el.scrollLeft = st.sliders[id];
        requestAnimationFrame(() => { el.style.scrollBehavior = ''; });
    });

    const apply = () => {
        let top = st.y;
        const card = visibleCardById(st.mid);
        if (card && st.offset !== null) top = card.getBoundingClientRect().top + window.scrollY - st.offset;
        window.scrollTo({ top, behavior: 'instant' });
    };
    apply();
    requestAnimationFrame(apply);
}

function showCatalogView() {
    stopPlayer();
    switchNavTab(currentActiveTab);
    restoreListState();
}

async function loadHomeData() {
    const slider = document.getElementById('home-popular-slider');
    try {
        const res = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/collections?type=TOP_POPULAR_ALL&page=1`, { headers: API_HEADERS });
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();

        if (data.items && data.items.length > 0) {
            slider.innerHTML = data.items.slice(0, 15).map(movie => createMovieCard(movie, true)).join('');
        }
    } catch (err) {
        slider.innerHTML = `<div class="text-sm text-m3-outline py-10">Ошибка загрузки</div>`;
    }
}

const POPULAR_FIRST_YEAR = new Date().getFullYear();
const POPULAR_LAST_YEAR = 1960;
const POPULAR_SOURCES = [{ kind: 'collection' }];
for (let y = POPULAR_FIRST_YEAR; y >= POPULAR_LAST_YEAR; y--) POPULAR_SOURCES.push({ kind: 'year', year: y });

let popularSrc = 0;
let popularNextPage = 1;
let popularTotalPages = null;
let popularLoadedCount = 0;
let popularLoadingMore = false;
let popularInitLoading = false;
let popularSeen = new Set();

function resetPopularState() {
    popularSrc = 0;
    popularNextPage = 1;
    popularTotalPages = null;
    popularLoadedCount = 0;
    popularSeen = new Set();
}

function popularExhausted() {
    return popularSrc >= POPULAR_SOURCES.length;
}

function advancePopularSource() {
    popularSrc++;
    popularNextPage = 1;
    popularTotalPages = null;
}

function popularPageUrl(src, page) {
    const base = 'https://kinopoiskapiunofficial.tech/api/v2.2/films';
    if (src.kind === 'collection') return `${base}/collections?type=TOP_POPULAR_ALL&page=${page}`;
    return `${base}?order=NUM_VOTE&type=ALL&yearFrom=${src.year}&yearTo=${src.year}&page=${page}`;
}

async function fetchPopularBatch(minItems = 100) {
    const out = [];

    while (out.length < minItems && !popularExhausted()) {
        const src = POPULAR_SOURCES[popularSrc];

        let pagesToFetch = 1;
        if (popularTotalPages !== null) {
            pagesToFetch = Math.min(5, popularTotalPages - popularNextPage + 1);
            if (pagesToFetch <= 0) { advancePopularSource(); continue; }
        }

        let failed = 0;
        const promises = [];
        for (let i = popularNextPage; i < popularNextPage + pagesToFetch; i++) {
            promises.push(
                fetch(popularPageUrl(src, i), { headers: API_HEADERS })
                    .then(res => res.json())
                    .catch(() => { failed++; return { items: [] }; })
            );
        }

        const results = await Promise.all(promises);
        if (failed === pagesToFetch) throw new Error('network');

        let gotAny = false;
        results.forEach(data => {
            if (typeof data.totalPages === 'number') popularTotalPages = data.totalPages;
            (data.items || []).forEach(movie => {
                const id = movie.kinopoiskId || movie.filmId;
                if (!id || popularSeen.has(id)) return;
                popularSeen.add(id);
                out.push(movie);
                gotAny = true;
            });
        });

        popularNextPage += pagesToFetch;

        if (popularTotalPages === null || popularNextPage > popularTotalPages || (!gotAny && results.every(d => !(d.items && d.items.length)))) {
            advancePopularSource();
        }
    }

    return out;
}

function updatePopularCountLabel() {
    const countLabel = document.getElementById('catalog-count-label');
    if (countLabel) countLabel.innerHTML = `Найдено позиций: ${popularLoadedCount}`;
}

function removeLoadMoreButton() {
    const wrap = document.getElementById('popular-load-more-wrap');
    if (wrap) wrap.remove();
}

function renderLoadMoreButton() {
    removeLoadMoreButton();
    if (popularExhausted()) return;

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

    if (popularLoadedCount > 0 || popularInitLoading) return;
    popularInitLoading = true;

    resetPopularState();

    grid.innerHTML = `<div class="col-span-full text-center py-10"><i class="fa-solid fa-spinner fa-spin text-m3-primary text-2xl"></i><span class="ml-3 text-m3-outline text-sm block mt-2">Сбор данных...</span></div>`;

    try {
        const items = await fetchPopularBatch(100);

        if (items.length > 0) {
            grid.innerHTML = items.map(movie => createMovieCard(movie, false)).join('');
            popularLoadedCount = items.length;
            updatePopularCountLabel();
            renderLoadMoreButton();
        } else {
            grid.innerHTML = `<div class="col-span-full text-center py-10 text-m3-outline text-sm">Нет данных.</div>`;
        }
    } catch (err) {
        grid.innerHTML = `<div class="col-span-full text-center py-10 text-m3-outline text-sm">Ошибка сети.</div>`;
    } finally {
        popularInitLoading = false;
    }
}

async function loadMorePopular() {
    if (popularLoadingMore) return;
    if (popularExhausted()) { removeLoadMoreButton(); return; }

    popularLoadingMore = true;
    const btn = document.getElementById('popular-load-more-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Загрузка...`;
    }

    try {
        const items = await fetchPopularBatch(100);
        const grid = document.getElementById('movies-grid-container');

        removeLoadMoreButton();

        if (items.length > 0) {
            grid.insertAdjacentHTML('beforeend', items.map(movie => createMovieCard(movie, false)).join(''));
            popularLoadedCount += items.length;
        }

        updatePopularCountLabel();
        renderLoadMoreButton();
    } catch (err) {
        renderLoadMoreButton();
    } finally {
        popularLoadingMore = false;
    }
}

// ================= ПРОФИЛИ, ИСТОРИЯ, ИЗБРАННОЕ =================
const ZIB_API = (() => {
    const custom = localStorage.getItem('zib_api_base');
    if (custom) return custom.replace(/\/$/, '');
    return location.protocol === 'file:' ? 'http://localhost:3000' : '';
})();

const HISTORY_LIMIT = 20;
const movieRegistry = new Map();
localStorage.removeItem('zibToken');
let authToken = localStorage.getItem('zibSession') || null;
let sessionsList = [];
let sessionsCanManage = false;
let sessionsState = 'idle';
let authUser = null;
let authHistory = [];
let favorites = [];
let favIds = new Set();
let profileMode = 'create';
let profileError = '';
let profileBusy = false;
let freshToken = null;

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function slimMovie(m) {
    const id = Number(m && (m.kinopoiskId || m.filmId));
    if (!Number.isInteger(id) || id <= 0) return null;
    const out = { kinopoiskId: id };
    ['nameRu', 'nameOriginal', 'nameEn'].forEach(k => { if (m[k]) out[k] = m[k]; });
    if (m.year) out.year = m.year;
    const r = m.ratingKinopoisk ?? m.rating;
    if (r !== undefined && r !== null && r !== '' && !isNaN(Number(r))) out.ratingKinopoisk = Number(r);
    return out;
}

async function apiFetch(path, { method = 'GET', body, token = authToken } = {}) {
    let res;
    try {
        res = await fetch(ZIB_API + path, {
            method,
            headers: {
                ...(body ? { 'Content-Type': 'application/json' } : {}),
                ...(token ? { 'Authorization': 'Bearer ' + token } : {})
            },
            body: body ? JSON.stringify(body) : undefined
        });
    } catch (e) {
        throw Object.assign(new Error('Сервер профилей недоступен. Проверьте, что бэкенд запущен.'), { status: 0 });
    }
    let data = {};
    try { data = await res.json(); } catch {}
    if (res.status === 401 && token && token === authToken) {
        clearSession();
        showToast('Сеанс завершён. Войдите снова.');
    }
    if (!res.ok) throw Object.assign(new Error(data.error || 'Ошибка сервера'), { status: res.status });
    return data;
}

let toastTimer = null;
function showToast(text, action) {
    let el = document.getElementById('zib-toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'zib-toast';
        el.className = 'fixed bottom-6 left-1/2 z-[100] max-w-[90vw] flex items-center gap-3 px-4 py-3 rounded-2xl bg-m3-surfaceContainerHighest text-m3-onSurface text-sm border border-m3-outlineVariant/40 shadow-2xl transition-all duration-300';
        el.style.transform = 'translate(-50%, 16px)';
        el.style.opacity = '0';
        document.body.appendChild(el);
    }
    el.innerHTML = '<span>' + esc(text) + '</span>';
    if (action) {
        const b = document.createElement('button');
        b.className = 'font-bold text-m3-primary whitespace-nowrap cursor-pointer';
        b.textContent = action.label;
        b.onclick = () => { el.style.opacity = '0'; el.style.transform = 'translate(-50%, 16px)'; action.fn(); };
        el.appendChild(b);
    }
    void el.offsetWidth;
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%, 0)';
    el.style.pointerEvents = 'auto';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translate(-50%, 16px)'; el.style.pointerEvents = 'none'; }, 4000);
}

function saveAuthCache() {
    if (!authUser) return;
    try { localStorage.setItem('zibCache', JSON.stringify({ user: authUser, history: authHistory, favorites })); } catch {}
}

function applyAccount(d) {
    authUser = d.user;
    authHistory = d.history || [];
    favorites = d.favorites || [];
    favIds = new Set(favorites.map(m => String(m.kinopoiskId)));
    favorites.forEach(m => movieRegistry.set(String(m.kinopoiskId), m));
    saveAuthCache();
    renderHistory();
    refreshAllFavUI();
    updatePlayerFavBtn();
    if (currentActiveTab === 'profile') renderProfileView();
    if (currentActiveTab === 'collections') renderCollections();
}

async function initAuth() {
    if (!authToken) return;
    try {
        const cache = JSON.parse(localStorage.getItem('zibCache') || 'null');
        if (cache && cache.user) applyAccount(cache);
    } catch {}
    try {
        applyAccount(await apiFetch('/api/me'));
    } catch (e) {}
}

function clearSession() {
    authToken = null; authUser = null; authHistory = []; favorites = []; favIds = new Set();
    freshToken = null; sessionsList = []; sessionsCanManage = false; tokenReveal = null;
    localStorage.removeItem('zibSession');
    localStorage.removeItem('zibCache');
    renderHistory();
    refreshAllFavUI();
    updatePlayerFavBtn();
    if (currentActiveTab === 'profile') renderProfileView();
    if (currentActiveTab === 'collections') renderCollections();
}

function getHistory() {
    return authUser ? authHistory : JSON.parse(localStorage.getItem('zibHistory') || '[]');
}

function renderHistory() {
    const slider = document.getElementById('home-history-slider');
    const history = getHistory();

    if (history.length === 0) {
        slider.innerHTML = `<div class="text-sm text-m3-outline py-6 px-4 bg-m3-surfaceContainerLow rounded-2xl w-full border border-m3-outlineVariant/20 border-dashed text-center">Вы еще ничего не смотрели. История пуста.</div>`;
    } else {
        slider.innerHTML = history.map(movie => createMovieCard(movie, true)).join('');
    }
    if (currentActiveTab === 'profile') renderProfileView();
}

function addToHistory(movieData) {
    const slim = slimMovie(movieData);
    if (!slim) return;
    movieRegistry.set(String(slim.kinopoiskId), slim);

    const list = getHistory().filter(m => (m.kinopoiskId || m.filmId) != slim.kinopoiskId);
    list.unshift(slim);
    if (list.length > HISTORY_LIMIT) list.length = HISTORY_LIMIT;

    if (authUser) {
        authHistory = list;
        saveAuthCache();
        apiFetch('/api/history', { method: 'POST', body: { movie: slim } })
            .catch(e => showToast('История не синхронизирована: ' + e.message));
    } else {
        localStorage.setItem('zibHistory', JSON.stringify(list));
    }
    renderHistory();
}

function clearHistory() {
    if (authUser) {
        authHistory = [];
        saveAuthCache();
        apiFetch('/api/history', { method: 'DELETE' }).catch(e => showToast('Не удалось очистить на сервере: ' + e.message));
    } else {
        localStorage.removeItem('zibHistory');
    }
    renderHistory();
}

function setFavIcon(btn, isFav, animate = false) {
    btn.classList.toggle('is-fav', isFav);
    const i = btn.querySelector('i');
    if (!i) return;
    i.className = (isFav ? 'fa-solid text-rose-400' : 'fa-regular text-white') + ' fa-heart';
    if (animate && isFav) { void i.offsetWidth; i.classList.add('fav-pop'); }
}

function updateFavUI(id) {
    const isFav = favIds.has(String(id));
    document.querySelectorAll('.fav-btn[data-fav="' + id + '"]').forEach(b => setFavIcon(b, isFav, true));
    updatePlayerFavBtn(true);
}

function refreshAllFavUI() {
    document.querySelectorAll('.fav-btn').forEach(b => setFavIcon(b, favIds.has(b.dataset.fav)));
}

function updatePlayerFavBtn(animate = false) {
    const btn = document.getElementById('player-fav-btn');
    if (!btn) return;
    const isFav = activeMovieId && favIds.has(String(activeMovieId));
    const icon = btn.querySelector('i');
    icon.className = (isFav ? 'fa-solid text-rose-400' : 'fa-regular') + ' fa-heart';
    if (animate && isFav) { void icon.offsetWidth; icon.classList.add('fav-pop'); }
    btn.querySelector('span').textContent = isFav ? 'В избранном' : 'В избранное';
}

function toggleFavorite(id) {
    id = String(id || '');
    if (!/^\d+$/.test(id)) return;

    if (!authUser) {
        showToast('Войдите в профиль, чтобы сохранять избранное.', {
            label: 'Войти',
            fn: () => { stopPlayer(); switchNavTab('profile'); }
        });
        return;
    }

    const wasFav = favIds.has(id);
    const snapshot = favorites.slice();

    if (wasFav) {
        favorites = favorites.filter(m => String(m.kinopoiskId) !== id);
        favIds.delete(id);
        removeFromFavoritesGrid(id);
    } else {
        const movie = movieRegistry.get(id) || { kinopoiskId: Number(id), nameRu: 'Фильм #' + id };
        favorites.unshift(movie);
        favIds.add(id);
    }
    updateFavUI(id);
    saveAuthCache();
    if (currentActiveTab === 'profile') renderProfileView();

    const req = wasFav
        ? apiFetch('/api/favorites/' + id, { method: 'DELETE' })
        : apiFetch('/api/favorites', { method: 'POST', body: { movie: movieRegistry.get(id) || { kinopoiskId: Number(id), nameRu: 'Фильм #' + id } } });

    req.catch(e => {
        favorites = snapshot;
        favIds = new Set(favorites.map(m => String(m.kinopoiskId)));
        updateFavUI(id);
        saveAuthCache();
        if (currentActiveTab === 'collections') renderCollections();
        showToast('Не удалось сохранить: ' + e.message);
    });
}

function removeFromFavoritesGrid(id) {
    const grid = document.getElementById('favorites-grid');
    if (!grid) return;
    const card = grid.querySelector('[data-mid="' + id + '"]');
    const finish = () => {
        if (card) card.remove();
        if (!grid.children.length) renderCollections();
        else document.getElementById('favorites-count').textContent = favorites.length;
    };
    if (!card) return finish();
    card.style.pointerEvents = 'none';
    card.style.opacity = '0';
    card.style.transform = 'scale(.9)';
    setTimeout(finish, 280);
}

function renderCollections() {
    const grid = document.getElementById('favorites-grid');
    const count = document.getElementById('favorites-count');
    if (!grid) return;

    if (!authUser) {
        count.textContent = '—';
        grid.innerHTML = `<div class="col-span-full text-center py-12 px-6 bg-m3-surfaceContainerLow rounded-3xl border border-m3-outlineVariant/20 border-dashed space-y-3">
            <i class="fa-solid fa-user-lock text-3xl text-m3-outline"></i>
            <p class="text-sm text-m3-secondary">Войдите в профиль, чтобы сохранять избранное и видеть его здесь.</p>
            <button onclick="switchNavTab('profile')" class="px-5 py-2 rounded-full bg-m3-primary text-m3-onPrimary text-sm font-bold cursor-pointer">Открыть профиль</button>
        </div>`;
        return;
    }
    count.textContent = favorites.length;
    if (!favorites.length) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 px-6 bg-m3-surfaceContainerLow rounded-3xl border border-m3-outlineVariant/20 border-dashed space-y-2">
            <i class="fa-regular fa-heart text-3xl text-m3-outline"></i>
            <p class="text-sm text-m3-secondary">Пока пусто. Нажмите на сердечко на карточке фильма, чтобы добавить его сюда.</p>
        </div>`;
        return;
    }
    grid.innerHTML = favorites.map(m => createMovieCard(m, false)).join('');
}

function fmtDate(iso) {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

let profileRenderedKind = null;
let profileNickname = '';
let profileTokenInput = '';
let tokenReveal = null;
let tokenRevealTimer = null;

function renderProfileView() {
    const box = document.getElementById('profile-content');
    if (!box) return;

    const kind = (freshToken && authUser) ? 'fresh' : (authUser ? 'account' : 'guest');
    const enter = kind !== profileRenderedKind ? 'pf-enter' : '';
    profileRenderedKind = kind;

    const card = 'bg-m3-surfaceContainer rounded-4xl border border-m3-outlineVariant/30 p-6 sm:p-8';
    const input = 'w-full px-4 py-3 rounded-2xl bg-m3-surfaceContainerLow border border-m3-outlineVariant/40 text-m3-onSurface text-sm outline-none focus:border-m3-primary transition-colors';
    const err = m => (profileError && profileMode === m) ? `<p class="pf-error text-sm text-red-400">${esc(profileError)}</p>` : '';
    const busy = m => (profileBusy && profileMode === m) ? 'opacity-60 pointer-events-none' : '';
    const spin = m => (profileBusy && profileMode === m) ? '<i class="fa-solid fa-spinner fa-spin mr-2"></i>' : '';

    if (kind === 'fresh') {
        box.innerHTML = `<div class="${card} ${enter} space-y-5 text-center">
            <div class="w-16 h-16 rounded-full bg-m3-primaryContainer text-m3-onPrimaryContainer mx-auto flex items-center justify-center text-2xl"><i class="fa-solid fa-key"></i></div>
            <h2 class="text-2xl font-bold text-m3-onSurface">Аккаунт создан!</h2>
            <p class="text-sm text-m3-secondary">Это ваш токен для входа на других устройствах. Сохраните его: регистр букв и знаки важны.</p>
            <div class="px-4 py-4 rounded-2xl bg-m3-surfaceContainerLow border border-m3-primary/40 font-mono text-sm sm:text-base font-bold text-m3-primary break-all select-all">${esc(freshToken)}</div>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <button onclick="copyToken()" class="px-5 py-2.5 rounded-full bg-m3-surfaceContainerHigh hover:bg-m3-surfaceContainerHighest text-m3-onSurface text-sm font-bold border border-m3-outlineVariant/40 cursor-pointer"><i class="fa-regular fa-copy mr-2"></i>Скопировать</button>
                <button onclick="finishFreshToken()" class="px-5 py-2.5 rounded-full bg-m3-primary text-m3-onPrimary text-sm font-bold cursor-pointer">Продолжить</button>
            </div>
        </div>`;
        return;
    }

    if (kind === 'account') {
        const hist = getHistory().length;
        const meta = [fmtDate(authUser.createdAt) && 'Создан ' + fmtDate(authUser.createdAt), authUser.createdOn].filter(Boolean).join(' · ');
        const tokenBlock = sessionsCanManage ? `<div class="space-y-2">
                <div class="text-xs font-bold text-m3-outline uppercase tracking-wider">Токен для входа</div>
                <div class="flex items-center gap-2">
                    <div class="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-m3-surfaceContainerLow border border-m3-outlineVariant/30 font-mono text-xs sm:text-sm text-m3-secondary break-all select-all">${tokenReveal ? esc(tokenReveal) : '••••••••••••••••••••••••••••••••'}</div>
                    <button onclick="toggleTokenReveal()" title="Показать / скрыть" class="w-11 h-11 shrink-0 rounded-full bg-m3-surfaceContainerHigh hover:bg-m3-surfaceContainerHighest text-m3-onSurface cursor-pointer"><i class="fa-solid ${tokenReveal ? 'fa-eye-slash' : 'fa-eye'}"></i></button>
                    <button onclick="copyProfileToken()" title="Скопировать токен" class="w-11 h-11 shrink-0 rounded-full bg-m3-primaryContainer hover:opacity-90 text-m3-onPrimaryContainer cursor-pointer"><i class="fa-regular fa-copy"></i></button>
                </div>
            </div>` : '';
        box.innerHTML = `<div class="${card} ${enter} space-y-6">
            <div class="flex items-center gap-4">
                <div class="w-16 h-16 shrink-0 rounded-full bg-m3-primaryContainer text-m3-onPrimaryContainer flex items-center justify-center text-2xl font-bold">${esc((authUser.nickname || '?').charAt(0).toUpperCase())}</div>
                <div class="min-w-0">
                    <h2 class="text-2xl font-bold text-m3-onSurface truncate">${esc(authUser.nickname)}</h2>
                    <p class="text-xs text-m3-outline mt-0.5">${esc(meta)}</p>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div class="rounded-2xl bg-m3-surfaceContainerLow border border-m3-outlineVariant/20 p-4">
                    <div class="text-2xl font-bold text-m3-onSurface">${hist}</div>
                    <div class="text-xs text-m3-outline mt-0.5"><i class="fa-solid fa-clock-rotate-left mr-1"></i>В истории</div>
                </div>
                <button onclick="switchNavTab('collections')" class="text-left rounded-2xl bg-m3-surfaceContainerLow hover:bg-m3-surfaceContainerHigh border border-m3-outlineVariant/20 p-4 cursor-pointer">
                    <div class="text-2xl font-bold text-m3-onSurface">${favorites.length}</div>
                    <div class="text-xs text-m3-outline mt-0.5"><i class="fa-solid fa-heart mr-1 text-m3-primary"></i>В избранном</div>
                </button>
            </div>
            ${tokenBlock}
            ${renderSessionsBlock()}
            <button onclick="profileLogout()" class="w-full px-5 py-3 rounded-full bg-m3-surfaceContainerHigh hover:bg-m3-surfaceContainerHighest text-red-300 text-sm font-bold border border-m3-outlineVariant/40 cursor-pointer"><i class="fa-solid fa-right-from-bracket mr-2"></i>Выйти из аккаунта</button>
        </div>`;
        return;
    }

    box.innerHTML = `<div id="profile-guest" data-mode="${profileMode}" class="${card} ${enter} space-y-6">
        <div class="text-center space-y-3">
            <div class="w-16 h-16 rounded-full bg-m3-primaryContainer text-m3-onPrimaryContainer mx-auto flex items-center justify-center text-2xl"><i class="fa-solid fa-user"></i></div>
            <h2 class="text-2xl font-bold text-m3-onSurface">Профиль</h2>
            <p class="text-sm text-m3-secondary">Аккаунт сохраняет историю просмотров и избранное и открывает их на любом устройстве.</p>
        </div>
        <div class="relative flex p-1 rounded-full bg-m3-surfaceContainerLow border border-m3-outlineVariant/20">
            <div class="pf-seg-pill absolute top-1 bottom-1 left-1 rounded-full bg-m3-primaryContainer shadow-sm" style="width: calc(50% - 4px)"></div>
            <button onclick="setProfileMode('create')" class="pf-seg-btn pf-seg-create relative z-10 flex-1 py-2.5 rounded-full text-sm cursor-pointer">Создать аккаунт</button>
            <button onclick="setProfileMode('login')" class="pf-seg-btn pf-seg-login relative z-10 flex-1 py-2.5 rounded-full text-sm cursor-pointer">Войти</button>
        </div>
        <div class="grid">
            <div class="pf-panel pf-panel-create space-y-3">
                <label class="text-xs font-bold text-m3-outline uppercase tracking-wider">Ваш ник</label>
                <input id="profile-nickname" maxlength="24" autocomplete="off" value="${esc(profileNickname)}" oninput="profileNickname=this.value" placeholder="Например, Кинолюб" class="${input}" onkeydown="if(event.key==='Enter')profileCreate()">
                ${err('create')}
                <button onclick="profileCreate()" class="w-full px-5 py-3 rounded-full bg-m3-primary text-m3-onPrimary text-sm font-bold cursor-pointer ${busy('create')}">${spin('create')}Создать аккаунт</button>
                <p class="text-[11px] text-m3-outline text-center">Просмотренное на этом устройстве перенесётся в новый аккаунт.</p>
            </div>
            <div class="pf-panel pf-panel-login space-y-3">
                <label class="text-xs font-bold text-m3-outline uppercase tracking-wider">Токен</label>
                <input id="profile-token" autocomplete="off" spellcheck="false" value="${esc(profileTokenInput)}" oninput="profileTokenInput=this.value" placeholder="Вставьте токен целиком" class="${input} font-mono" onkeydown="if(event.key==='Enter')profileLogin()">
                ${err('login')}
                <button onclick="profileLogin()" class="w-full px-5 py-3 rounded-full bg-m3-primary text-m3-onPrimary text-sm font-bold cursor-pointer ${busy('login')}">${spin('login')}Войти</button>
            </div>
        </div>
    </div>`;
}

async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
        document.body.appendChild(ta);
        ta.select(); ta.setSelectionRange(0, text.length);
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
    } catch { return false; }
}

async function fetchAccountToken() {
    const data = await apiFetch('/api/token');
    return data.token;
}

async function toggleTokenReveal() {
    if (tokenReveal) { tokenReveal = null; clearTimeout(tokenRevealTimer); return renderProfileView(); }
    try {
        tokenReveal = await fetchAccountToken();
        clearTimeout(tokenRevealTimer);
        tokenRevealTimer = setTimeout(() => { tokenReveal = null; if (currentActiveTab === 'profile') renderProfileView(); }, 30000);
        renderProfileView();
    } catch (e) { showToast(e.message); }
}

async function copyProfileToken() {
    try {
        const t = tokenReveal || await fetchAccountToken();
        showToast(await copyText(t) ? 'Токен скопирован.' : 'Не удалось скопировать. Нажмите на глаз и скопируйте вручную.');
    } catch (e) { showToast(e.message); }
}

function fmtAgo(iso) {
    const t = Date.parse(iso);
    if (!t) return '';
    const m = Math.floor((Date.now() - t) / 60000);
    if (m < 1) return 'только что';
    if (m < 60) return m + ' мин. назад';
    const h = Math.floor(m / 60);
    if (h < 24) return h + ' ч. назад';
    const d = Math.floor(h / 24);
    return d + ' дн. назад';
}
