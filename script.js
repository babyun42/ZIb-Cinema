
const BACKEND_URL = 'https://zib-cinema.xyz';

// ===== Настройки внешнего вида =====
const SLIDER_FADE_EXTRA_TOP = 10;
const SLIDER_FADE_EXTRA_BOTTOM = 10;

// ===== Информация о сайте =====
const SITE_INFO_TITLE = 'О сайте';
const SITE_INFO_TEXT = `Zib-Cinema — просто сайт для просмотра фильмов

Делал этот сайт потому что не было удобных решений для меня и я хотел сделать что то прикольное в стиле Material you

Проект будет поддерживаться и добавлься всякие функции еще много, если вы думаете я его забросил то зайдите на [GitHub](https://github.com/babyun42/ZIb-Cinema) и посмотрите когда было послднее обнавление кода

Может он вам чем то не понрасится но я не имею средств держать фильмы у себя или хотя бы иметь доступ к плееру

Если вы нашли ошибку или просто хотите написать автору сайта то можете написать мне в [Telegram](https://t.me/Babyun42)

Если вам нравится мой сайт то можете поддрежать меня поставив мне stars на [GitHub](https://github.com/babyun42/ZIb-Cinema)`;

// ============================================================================
// Material You Expressive — индикатор загрузки из морфящихся фигур
// 35 фигур (как в наборе Material 3 Expressive). Фигуры вращаются и плавно перетекают одна в другую.
// ============================================================================

// Какие фигуры показывать по кругу. Названия — из списка ZIB_SHAPES ниже, либо 'all' (все 35 фигур).
let ZIB_LOADER_SHAPES = ['softBurst', 'cookie9', 'pentagon', 'pill', 'sunny', 'cookie4', 'oval'];
const ZIB_LOADER_HOLD_MS = 200;   // сколько держится фигура
const ZIB_LOADER_MORPH_MS = 400;  // сколько длится превращение в следующую

const ZIB_SHAPE_N = 240; // число лучей (точек контура)

// ---------- геометрия ----------
const _zTAU = Math.PI * 2;
const _zAng = k => -Math.PI / 2 + _zTAU * (k + 0.5) / ZIB_SHAPE_N;
const _zPhi = a => a + Math.PI / 2;

function _zRadial(cx, cy, rf) {
    const p = new Float64Array(ZIB_SHAPE_N * 2);
    for (let k = 0; k < ZIB_SHAPE_N; k++) {
        const a = _zAng(k), r = rf(a, k);
        p[2 * k] = cx + r * Math.cos(a);
        p[2 * k + 1] = cy + r * Math.sin(a);
    }
    return p;
}

function _zCentroid(poly) {
    let A = 0, cx = 0, cy = 0;
    for (let i = 0; i < poly.length; i++) {
        const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length];
        const f = x0 * y1 - x1 * y0;
        A += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
    }
    if (Math.abs(A) < 1e-9) {
        return [poly.reduce((s, q) => s + q[0], 0) / poly.length, poly.reduce((s, q) => s + q[1], 0) / poly.length];
    }
    return [cx / (3 * A), cy / (3 * A)];
}

function _zRayCast(poly, c) {
    const out = new Float64Array(ZIB_SHAPE_N);
    for (let k = 0; k < ZIB_SHAPE_N; k++) {
        const a = _zAng(k), dx = Math.cos(a), dy = Math.sin(a);
        let best = 0;
        for (let i = 0; i < poly.length; i++) {
            const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
            const ex = bx - ax, ey = by - ay;
            const den = dx * ey - dy * ex;
            if (Math.abs(den) < 1e-12) continue;
            const t = ((ax - c[0]) * ey - (ay - c[1]) * ex) / den;
            const s = ((ax - c[0]) * dy - (ay - c[1]) * dx) / den;
            if (t > 0 && s >= -1e-9 && s <= 1 + 1e-9 && t > best) best = t;
        }
        out[k] = best;
    }
    return out;
}

function _zSmooth(r, sigma) {
    if (!sigma) return r;
    const R = Math.ceil(sigma * 3), w = [];
    let sum = 0;
    for (let i = -R; i <= R; i++) { const v = Math.exp(-(i * i) / (2 * sigma * sigma)); w.push(v); sum += v; }
    const out = new Float64Array(r.length);
    for (let k = 0; k < r.length; k++) {
        let s = 0;
        for (let i = -R; i <= R; i++) s += r[(k + i + r.length * 4) % r.length] * w[i + R];
        out[k] = s / sum;
    }
    return out;
}

function _zScaleRadial(p, fn) {
    const poly = [];
    for (let i = 0; i < ZIB_SHAPE_N; i++) poly.push([p[2 * i], p[2 * i + 1]]);
    const [cx, cy] = _zCentroid(poly), out = new Float64Array(p.length);
    for (let k = 0; k < ZIB_SHAPE_N; k++) {
        const f = fn(_zAng(k));
        out[2 * k] = cx + (p[2 * k] - cx) * f;
        out[2 * k + 1] = cy + (p[2 * k + 1] - cy) * f;
    }
    return out;
}

const _zFromPoly = (poly, sigma = 0) => {
    const c = _zCentroid(poly);
    const r = _zSmooth(_zRayCast(poly, c), sigma);
    return _zRadial(c[0], c[1], (a, k) => r[k]);
};

function _zStar(n, ro, ri, radii) {
    const poly = [];
    for (let i = 0; i < n * 2; i++) {
        const phi = Math.PI * i / n;
        const r = i % 2 === 0 ? (radii ? radii[(i / 2) % radii.length] : ro) : ri;
        poly.push([r * Math.sin(phi), -r * Math.cos(phi)]);
    }
    return poly;
}

function _zDistPoly(px, py, poly, sign) {
    let best = Infinity, inside = poly.length >= 3;
    for (let i = 0; i < poly.length; i++) {
        const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
        const ex = bx - ax, ey = by - ay, l2 = ex * ex + ey * ey;
        const t = l2 ? Math.max(0, Math.min(1, ((px - ax) * ex + (py - ay) * ey) / l2)) : 0;
        const dx = px - (ax + t * ex), dy = py - (ay + t * ey);
        best = Math.min(best, Math.hypot(dx, dy));
        if (inside && (ex * (py - ay) - ey * (px - ax)) * sign < -1e-12) inside = false;
    }
    return inside ? 0 : best;
}

function _zRounded(inner, rho) {
    let area = 0;
    for (let i = 0; i < inner.length; i++) {
        const [x0, y0] = inner[i], [x1, y1] = inner[(i + 1) % inner.length];
        area += x0 * y1 - x1 * y0;
    }
    const sign = area >= 0 ? 1 : -1, c = _zCentroid(inner);
    return _zRadial(c[0], c[1], a => {
        const dx = Math.cos(a), dy = Math.sin(a);
        let lo = 0, hi = 6;
        for (let i = 0; i < 26; i++) {
            const mid = (lo + hi) / 2;
            if (_zDistPoly(c[0] + dx * mid, c[1] + dy * mid, inner, sign) > rho + 1e-9) hi = mid; else lo = mid;
        }
        return (lo + hi) / 2;
    });
}

function _zCircles(r0, circles, sx = 1, sy = 1) {
    return _zRadial(0, 0, a => {
        const phi = _zPhi(a);
        let r = r0;
        for (const { ang, d, rho } of circles) {
            const al = phi - ang, s = d * Math.sin(al), disc = rho * rho - s * s;
            if (disc >= 0) r = Math.max(r, d * Math.cos(al) + Math.sqrt(disc));
        }
        return r;
    }).map((v, i) => i % 2 === 0 ? v * sx : v * sy);
}

const _zRegular = (n, r, phase = 0) => Array.from({ length: n }, (_, i) => {
    const phi = phase + _zTAU * i / n;
    return [r * Math.sin(phi), -r * Math.cos(phi)];
});
const _zSuper = (a, n) => Math.pow(Math.pow(Math.abs(Math.cos(a)), n) + Math.pow(Math.abs(Math.sin(a)), n), -1 / n);
const _zCookie = (n, amp, phase = 0) => _zRadial(0, 0, a => 1 + amp * Math.cos(n * (_zPhi(a) - phase)));
const _zBump = (a, center, width) => Math.exp(-Math.pow((a - center) / width, 2));
const _zClamp01 = v => Math.max(0, Math.min(1, v));

function _zPixels(cols, rows, filled) {
    const cx = cols / 2, cy = rows / 2;
    return _zRadial(cx, cy, a => {
        const dx = Math.cos(a), dy = Math.sin(a);
        let t = 0;
        while (t < Math.max(cols, rows)) {
            const x = Math.floor(cx + dx * (t + 0.02)), y = Math.floor(cy + dy * (t + 0.02));
            if (x < 0 || y < 0 || x >= cols || y >= rows || !filled(x, y)) break;
            t += 0.02;
        }
        return t;
    });
}

// ---------- 35 фигур ----------
const ZIB_SHAPES = {
    circle:        { name: 'Circle',         build: () => _zRadial(0, 0, () => 1) },
    square:        { name: 'Square',         build: () => _zRadial(0, 0, a => _zSuper(a, 4.4)) },
    slanted:       { name: 'Slanted',        build: () => _zRounded([[-0.46, -0.42], [0.54, -0.42], [0.46, 0.42], [-0.54, 0.42]], 0.42) },
    arch: { name: 'Arch', build: () => {
        const inner = [];
        for (let i = 0; i <= 14; i++) { const t = Math.PI + Math.PI * i / 14; inner.push([0.72 * Math.cos(t), 0.72 * Math.sin(t)]); }
        inner.push([0.72, 0.72], [-0.72, 0.72]);
        return _zRounded(inner, 0.28);
    } },
    semicircle: { name: 'Semicircle', build: () => {
        const inner = [];
        for (let i = 0; i <= 14; i++) { const t = Math.PI + Math.PI * i / 14; inner.push([0.78 * Math.cos(t), 0.78 * Math.sin(t)]); }
        return _zRounded(inner, 0.22);
    } },
    oval: { name: 'Oval', build: () => {
        const rot = -0.72, A = 1, B = 0.68;
        return _zRadial(0, 0, a => { const al = a - rot; return A * B / Math.hypot(B * Math.cos(al), A * Math.sin(al)); });
    } },
    pill:          { name: 'Pill',           build: () => _zRounded([[-0.2, 0.2], [0.2, -0.2]], 0.72) },
    triangle:      { name: 'Triangle',       build: () => _zRounded(_zRegular(3, 0.62), 0.24) },
    arrow: { name: 'Arrow', build: () =>
        _zScaleRadial(_zRounded(_zRegular(3, 0.5), 0.4), a => 1 - 0.26 * _zBump(a, Math.PI / 2, 0.42))
    },
    fan: { name: 'Fan', build: () => {
        const inner = [[0, 0.78]];
        for (let i = 0; i <= 14; i++) { const t = -Math.PI / 2 + (Math.PI / 2) * i / 14; inner.push([0.78 * Math.cos(t), 0.78 + 0.78 * Math.sin(t)]); }
        return _zRounded(inner, 0.22);
    } },
    diamond:       { name: 'Diamond',        build: () => _zRounded([[0, -0.52], [0.36, 0], [0, 0.52], [-0.36, 0]], 0.32) },
    clamshell:     { name: 'Clamshell',      build: () => _zRounded([[-0.6, 0], [-0.3, -0.3], [0.3, -0.3], [0.6, 0], [0.3, 0.3], [-0.3, 0.3]], 0.3) },
    pentagon:      { name: 'Pentagon',       build: () => _zRounded(_zRegular(5, 0.58), 0.3) },
    gem:           { name: 'Gem',            build: () => _zRounded([[0.02, -0.7], [0.62, -0.26], [0.5, 0.42], [-0.06, 0.7], [-0.52, 0.4], [-0.6, -0.26]], 0.28) },
    verySunny:     { name: 'Very sunny',     build: () => _zRadial(0, 0, a => 0.8 + 0.2 * Math.pow((Math.cos(8 * _zPhi(a)) + 1) / 2, 0.4)) },
    sunny:         { name: 'Sunny',          build: () => _zFromPolyStar(8, 1, 0.8, 2.6) },
    cookie4:       { name: '4-sided cookie', build: () => _zCookie(4, 0.15, Math.PI / 4) },
    cookie6:       { name: '6-sided cookie', build: () => _zCookie(6, 0.075) },
    cookie7:       { name: '7-sided cookie', build: () => _zCookie(7, 0.07) },
    cookie9:       { name: '9-sided cookie', build: () => _zCookie(9, 0.06) },
    cookie12:      { name: '12-sided cookie', build: () => _zCookie(12, 0.065) },
    clover4:       { name: '4-leaf clover',  build: () => _zCircles(0.35, [1, 3, 5, 7].map(i => ({ ang: Math.PI * i / 4, d: 0.42, rho: 0.58 }))) },
    clover8:       { name: '8-leaf clover',  build: () => _zCircles(0.5, Array.from({ length: 8 }, (_, i) => ({ ang: _zTAU * i / 8, d: 0.64, rho: 0.37 }))) },
    burst:         { name: 'Burst',          build: () => _zFromPolyStar(12, 1, 0.68, 0) },
    softBurst:     { name: 'Soft burst',     build: () => _zFromPolyStar(12, 1, 0.76, 5) },
    boom:          { name: 'Boom',           build: () => _zFromPolyStar(15, 1, 0.36, 0) },
    softBoom:      { name: 'Soft boom',      build: () => _zRadial(0, 0, a => 0.4 + 0.6 * Math.pow(Math.abs(Math.cos(8 * _zPhi(a))), 0.5)) },
    flower: { name: 'Flower', build: () => _zFromPoly(_zStar(8, 1, 0.45, [1, 0.8]), 5) },
    puffy:         { name: 'Puffy',          build: () => _zCircles(0.7, Array.from({ length: 10 }, (_, i) => ({ ang: _zTAU * i / 10, d: 0.7, rho: 0.28 })), 1, 0.82) },
    puffyDiamond:  { name: 'Puffy diamond',  build: () => _zCircles(0.5, [
        ...[0, 1, 2, 3].map(i => ({ ang: Math.PI * i / 2, d: 0.64, rho: 0.36 })),
        ...[0, 1, 2, 3].map(i => ({ ang: Math.PI / 4 + Math.PI * i / 2, d: 0.55, rho: 0.2 }))
    ]) },
    ghostish: { name: 'Ghost-ish', build: () => {
        const inner = [];
        for (let i = 0; i <= 14; i++) { const t = Math.PI + Math.PI * i / 14; inner.push([0.7 * Math.cos(t), 0.7 * Math.sin(t) - 0.1]); }
        inner.push([0.7, 0.6], [-0.7, 0.6]);
        return _zScaleRadial(_zRounded(inner, 0.3), a => 1 - 0.3 * _zBump(a, Math.PI / 2, 0.38));
    } },
    pixelCircle: { name: 'Pixel circle', build: () => _zPixels(11, 11, (x, y) => Math.hypot(x + 0.5 - 5.5, y + 0.5 - 5.5) <= 5.4) },
    pixelTriangle: { name: 'Pixel triangle', build: () => _zPixels(10, 15, (x, y) => x < Math.round(10 * (1 - Math.abs(y + 0.5 - 7.5) / 8))) },
    bun: { name: 'Bun', build: () => {
        const top = [[-0.55, -0.47], [0.55, -0.47]], bottom = [[-0.55, 0.47], [0.55, 0.47]];
        const a = _zRounded(top, 0.47), b = _zRounded(bottom, 0.47);
        return _zSmoothPts(_zUnionPts(a, b), 2.2);
    } },
    heart: { name: 'Heart', build: () => {
        const poly = [];
        for (let i = 0; i < 400; i++) {
            const t = _zTAU * i / 400;
            poly.push([16 * Math.pow(Math.sin(t), 3), -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]);
        }
        return _zFromPoly(poly, 2.2);
    } }
};

function _zFromPolyStar(n, ro, ri, sigma) { return _zFromPoly(_zStar(n, ro, ri), sigma); }

const _zToPoly = p => Array.from({ length: ZIB_SHAPE_N }, (_, i) => [p[2 * i], p[2 * i + 1]]);

function _zUnionPts(pa, pb) {
    const ra = _zRayCast(_zToPoly(pa), [0, 0]), rb = _zRayCast(_zToPoly(pb), [0, 0]);
    return _zRadial(0, 0, (a, k) => Math.max(ra[k], rb[k]));
}

function _zSmoothPts(p, sigma) {
    const r = _zSmooth(_zRayCast(_zToPoly(p), [0, 0]), sigma);
    return _zRadial(0, 0, (a, k) => r[k]);
}

function _zNormalize(p) {
    const poly = []; for (let i = 0; i < ZIB_SHAPE_N; i++) poly.push([p[2 * i], p[2 * i + 1]]);
    const [cx, cy] = _zCentroid(poly);
    let maxR = 0;
    for (const [x, y] of poly) maxR = Math.max(maxR, Math.hypot(x - cx, y - cy));
    const s = 46 / maxR, out = new Float64Array(p.length);
    for (let i = 0; i < ZIB_SHAPE_N; i++) {
        out[2 * i] = 50 + (p[2 * i] - cx) * s;
        out[2 * i + 1] = 50 + (p[2 * i + 1] - cy) * s;
    }
    return out;
}

const _zShapeCache = {};
function zibShapePoints(id) {
    if (!_zShapeCache[id]) _zShapeCache[id] = _zNormalize(ZIB_SHAPES[id].build());
    return _zShapeCache[id];
}

function zibShapePath(points) {
    let d = 'M';
    for (let i = 0; i < ZIB_SHAPE_N; i++) d += (i ? 'L' : '') + points[2 * i].toFixed(1) + ' ' + points[2 * i + 1].toFixed(1);
    return d + 'Z';
}

// ---------- анимация ----------
const _zEaseOutBack = t => { const c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const _zLoaderIds = () => ZIB_LOADER_SHAPES === 'all' ? Object.keys(ZIB_SHAPES) : ZIB_LOADER_SHAPES.filter(id => ZIB_SHAPES[id]);

function zibLoaderPathAt(now) {
    const ids = _zLoaderIds(), period = ZIB_LOADER_HOLD_MS + ZIB_LOADER_MORPH_MS;
    const step = Math.floor(now / period), local = now % period;
    const from = zibShapePoints(ids[step % ids.length]);
    if (local < ZIB_LOADER_HOLD_MS) return zibShapePath(from);
    const to = zibShapePoints(ids[(step + 1) % ids.length]);
    const e = _zEaseOutBack((local - ZIB_LOADER_HOLD_MS) / ZIB_LOADER_MORPH_MS);
    const mid = new Float64Array(from.length);
    for (let i = 0; i < mid.length; i++) mid[i] = from[i] + (to[i] - from[i]) * e;
    return zibShapePath(mid);
}

let _zLoaderRunning = false, _zLoaderIdle = 0, _zLoaderLastD = '';

function _zLoaderTick(now) {
    const nodes = document.querySelectorAll('.zib-loader path');
    if (!nodes.length) {
        if (++_zLoaderIdle > 90) { _zLoaderRunning = false; return; }
    } else _zLoaderIdle = 0;
    const d = zibLoaderPathAt(now);
    if (d !== _zLoaderLastD) { _zLoaderLastD = d; nodes.forEach(n => n.setAttribute('d', d)); }
    requestAnimationFrame(_zLoaderTick);
}

function zibLoaderStart() {
    if (_zLoaderRunning) return;
    _zLoaderRunning = true; _zLoaderIdle = 0;
    requestAnimationFrame(_zLoaderTick);
}

function zibLoader(size = '2.5rem', extraClass = '') {
    zibLoaderStart();
    const d = _zLoaderLastD || zibLoaderPathAt(performance.now());
    return `<span class="zib-loader ${extraClass}" style="--zib-loader-size:${size}" role="status" aria-label="Загрузка"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="${d}"/></svg></span>`;
}

function zibLoaderWarmUp() {
    const ids = _zLoaderIds().slice();
    const next = () => { const id = ids.shift(); if (id) { zibShapePoints(id); setTimeout(next, 30); } };
    next();
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => { zibLoaderStart(); setTimeout(zibLoaderWarmUp, 400); });
}

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


// ================= ОСНОВНАЯ ЛОГИКА =================

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
    document.querySelectorAll('[data-ui-option]').forEach(sw => {
        sw.setAttribute('aria-checked', String(getUiOption(sw.dataset.uiOption)));
    });

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

// ================= ПЕРЕКЛЮЧАТЕЛИ ИНТЕРФЕЙСА =================
// Чтобы добавить новую настройку: допишите её сюда, добавьте switch в разметку (data-ui-option="имя")
// и опишите в CSS, что делает класс offClass на <html>.
const UI_OPTIONS = {
    navHover: { storageKey: 'zibUiNavHover', defaultOn: true, offClass: 'no-nav-hover' } // подсветка вкладок шапки при наведении
};

function getUiOption(name) {
    const o = UI_OPTIONS[name];
    const v = localStorage.getItem(o.storageKey);
    return v === null ? o.defaultOn : v === '1';
}

function applyUiOptions() {
    for (const name of Object.keys(UI_OPTIONS)) {
        document.documentElement.classList.toggle(UI_OPTIONS[name].offClass, !getUiOption(name));
    }
}

function toggleUiOption(name) {
    localStorage.setItem(UI_OPTIONS[name].storageKey, getUiOption(name) ? '0' : '1');
    applyUiOptions();
    updateSettingsUIActiveStates();
}

applyUiOptions();

// ================= МОДАЛЬНЫЕ ОКНА =================
function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add('is-open');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.zib-modal.is-open')) document.body.style.overflow = '';
}

function closeAllModals() {
    document.querySelectorAll('.zib-modal.is-open').forEach(m => closeModal(m.id));
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });

// Превращает [текст](адрес) в кликабельную ссылку, всё остальное экранируется
function formatSiteInfo(text) {
    return esc(text).replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-m3-primary font-semibold underline underline-offset-2 hover:text-m3-onSurface transition-colors break-all">$1</a>'
    );
}

function openSiteInfo() {
    document.getElementById('info-modal-title').textContent = SITE_INFO_TITLE;
    const body = document.getElementById('info-modal-body');
    body.innerHTML = SITE_INFO_TEXT
        .split(/\n\s*\n/)
        .map(par => `<p>${formatSiteInfo(par.trim()).replace(/\n/g, '<br>')}</p>`)
        .join('');
    openModal('info-modal');
}

let currentPosterFull = '';
let currentPosterTitle = '';

function openPosterViewer() {
    const thumb = document.getElementById('player-poster-img');
    const img = document.getElementById('poster-viewer-img');
    const thumbSrc = thumb ? thumb.src : '';
    img.onerror = () => { img.onerror = null; img.src = thumbSrc || fallbackPoster; };
    img.src = currentPosterFull || thumbSrc || fallbackPoster;
    document.getElementById('poster-viewer-caption').textContent = currentPosterTitle;
    openModal('poster-viewer');
}

// ================= АДРЕС СТРАНИЦЫ =================
// Страница запоминается в адресе (#/popular, #/movie/301), поэтому после F5 вы остаётесь там же,
// а кнопки браузера «назад/вперёд» тоже работают. Хэш-адреса не требуют настроек сервера и подходят для GitHub Pages.
const ROUTE_TABS = ['home', 'popular', 'collections', 'profile', 'settings'];
let routeWritesEnabled = false;      // выключено, пока страница восстанавливается после загрузки
let currentRouteHash = location.hash;
let movieOpenedFromList = false;     // фильм открыт из списка в этой сессии → «Назад» = шаг назад в истории

function setRoute(hash) {
    if (!routeWritesEnabled || location.hash === hash) return;
    currentRouteHash = hash;
    location.hash = hash;
}

function parseRoute(hash) {
    const parts = String(hash || '').replace(/^#\/?/, '').split('/');
    if (parts[0] === 'movie' && /^\d{1,10}$/.test(parts[1] || '')) return { type: 'movie', id: parts[1] };
    if (ROUTE_TABS.includes(parts[0])) return { type: 'tab', tab: parts[0] };
    return { type: 'tab', tab: 'home' };
}

function isPlayerVisible() {
    const v = document.getElementById('player-view');
    return !!v && !v.classList.contains('hidden');
}

// Кнопки браузера «назад/вперёд» и ручное изменение адреса
function applyRoute() {
    const r = parseRoute(location.hash);
    if (r.type === 'movie') {
        if (String(activeMovieId) !== r.id) openMoviePlayer(r.id);
        return;
    }
    const wasPlayer = isPlayerVisible();
    if (wasPlayer || currentActiveTab !== r.tab) {
        switchNavTab(r.tab);
        if (wasPlayer) restoreListState();
    }
}

window.addEventListener('hashchange', () => {
    if (location.hash === currentRouteHash) return; // это мы сами поменяли адрес
    currentRouteHash = location.hash;
    closeAllModals();
    applyRoute();
});

window.onload = function() {
    // восстанавливаем страницу из адреса (без записи в историю)
    const initialRoute = parseRoute(location.hash);
    let baseTab = initialRoute.type === 'tab' ? initialRoute.tab : sessionStorage.getItem('zibBackTab');
    if (!ROUTE_TABS.includes(baseTab)) baseTab = 'home';
    switchNavTab(baseTab);
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

    routeWritesEnabled = true;
    if (initialRoute.type === 'movie') {
        openMoviePlayer(initialRoute.id);
        movieOpenedFromList = false; // после перезагрузки «Назад» ведёт в раздел, откуда открывали фильм
    }
};


// ===== Затухание краёв слайдеров =====
function updateSliderFade(el) {
    const first = el.firstElementChild, last = el.lastElementChild;
    const wrap = el.parentElement;
    const fl = wrap && wrap.querySelector('.slider-fade-l');
    const fr = wrap && wrap.querySelector('.slider-fade-r');
    if (!first || !last || !fl || !fr) return;

    // Полосы строго по высоте карточек. (Отрицательные отступы слайдера «схлопываются» с контейнером,
    // поэтому высоту контейнера использовать нельзя — полосы заезжали бы на заголовки.)
    [fl, fr].forEach(o => {
        o.style.top = (first.offsetTop - SLIDER_FADE_EXTRA_TOP) + 'px';
        o.style.height = (first.offsetHeight + SLIDER_FADE_EXTRA_TOP + SLIDER_FADE_EXTRA_BOTTOM) + 'px';
    });

    const box = el.getBoundingClientRect();
    // Затухание нужно только если крайняя карточка реально обрезана краем слайдера
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
    // после загрузки шрифтов высота карточек может измениться
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => document.querySelectorAll('.fade-slider').forEach(updateSliderFade));
    }
}

// ===== Кнопки перемотки проявляются при приближении курсора =====
function initSliderArrows() {
    const NEAR = 140;      // с какого расстояния (px) кнопка начинает проявляться
    const MIN_OPACITY = 0.25;
    let ticking = false, mx = 0, my = 0;

    function update() {
        ticking = false;
        document.querySelectorAll('.slider-arrow').forEach(btn => {
            // Стрелки видны, только когда курсор находится над строкой слайдера
            const wrapper = btn.closest('[class*="group/slider"]') || btn.parentElement;
            if (!wrapper || !wrapper.matches(':hover')) {
                btn.style.opacity = '0';
                return;
            }
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

    // Мгновенно скрываем стрелки, когда курсор покидает строку —
    // иначе они бы остались на последнем значении до следующего движения мыши
    document.querySelectorAll('[class*="group/slider"]').forEach(wrapper => {
        wrapper.addEventListener('mouseleave', () => {
            wrapper.querySelectorAll('.slider-arrow').forEach(b => b.style.opacity = '0');
        });
    });

    // На случай, если страница открылась и мышь уже стояла над строкой — прячем всё сразу
    document.querySelectorAll('.slider-arrow').forEach(b => b.style.opacity = '0');
}

function createMovieCard(movie, isSlider = false, opts = {}) {
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
            ${opts.removable ? `<button type="button" title="Убрать из истории" aria-label="Убрать из истории" onclick="event.stopPropagation(); removeFromHistory('${mId}', this)" class="hist-remove-btn absolute bottom-2 right-2 z-10 w-7 h-7 rounded-full bg-black/70 hover:bg-red-500/80 border border-white/10 flex items-center justify-center text-xs text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>` : ''}
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

    // ПК: подписи не анимируются, хватает обычного CSS-перехода
    if (window.innerWidth >= 640) {
        if (navAnimFrame) { cancelAnimationFrame(navAnimFrame); navAnimFrame = null; }
        indicator.style.transition = '';
        indicator.style.width = activeBtn.offsetWidth + 'px';
        indicator.style.left = activeBtn.offsetLeft + 'px';
        return;
    }

    // Телефон: подпись активной вкладки плавно раскрывается, а предыдущая сворачивается,
    // поэтому плашку каждый кадр плавно подтягиваем к текущему положению активной кнопки
    const nav = activeBtn.closest('nav');
    indicator.style.transition = 'none';

    let curL = parseFloat(indicator.style.left) || 0;
    let curW = parseFloat(indicator.style.width) || 0;
    if (curW === 0) { // первый показ — без анимации
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

        // если меню шире экрана — плавно подкручиваем его к активной вкладке
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
    setRoute('#/' + tabName);

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

// ===== Запоминаем место в списке, откуда открыли фильм =====
let savedListState = null;

function visibleCardById(mid) {
    return [...document.querySelectorAll('[data-mid="' + mid + '"]')].find(e => e.offsetParent !== null) || null;
}

function saveListState(kpId) {
    const playerView = document.getElementById('player-view');
    if (playerView && !playerView.classList.contains('hidden')) return; // уже в плеере — не затираем

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

    // горизонтальные слайдеры на главной
    Object.keys(st.sliders).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.scrollBehavior = 'auto';
        el.scrollLeft = st.sliders[id];
        requestAnimationFrame(() => { el.style.scrollBehavior = ''; });
    });

    // вертикальная позиция: ставим именно ту карточку на то же место экрана
    const apply = () => {
        let top = st.y;
        const card = visibleCardById(st.mid);
        if (card && st.offset !== null) top = card.getBoundingClientRect().top + window.scrollY - st.offset;
        window.scrollTo({ top, behavior: 'instant' });
    };
    apply();
    requestAnimationFrame(apply); // поправка, когда браузер досчитает размеры карточек
}

function showCatalogView() {
    if (movieOpenedFromList && routeWritesEnabled) { // шаг назад в истории вернёт список и место в нём
        movieOpenedFromList = false;
        history.back();
        return;
    }
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
        slider.innerHTML = `<div class="text-sm text-m3-outline flex items-center">${zibLoader('1.4rem', 'zib-loader-inline')}Загрузка новинок...</div>`;
    }
}

// ===== Лента «Популярное» =====
// Сначала берём основную подборку Кинопоиска (TOP_POPULAR_ALL). У API она ограничена
// по числу страниц, поэтому когда она заканчивается, лента продолжается
// по годам (от нового к старому), внутри каждого года — по убыванию популярности.
// Повторы отсеиваются, так что слотов можно открыть сколько угодно.
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

// Собирает минимум minItems новых (не повторяющихся) фильмов
async function fetchPopularBatch(minItems = 100) {
    const out = [];

    while (out.length < minItems && !popularExhausted()) {
        const src = POPULAR_SOURCES[popularSrc];

        // Пока не знаем число страниц источника — берём одну, дальше пачками по 5
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

        // источник закончился (или вернул пустоту) — переходим к следующему
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

    grid.innerHTML = `<div class="col-span-full text-center py-10">${zibLoader('2.75rem')}<span class="ml-3 text-m3-outline text-sm block mt-2">Сбор данных...</span></div>`;
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
        btn.innerHTML = `${zibLoader('1.1em', 'zib-loader-inline')} Загрузка...`;
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
// Адрес бэкенда: BACKEND_URL (вверху файла) → localStorage 'zib_api_base' → localhost:3000 при открытии файлом.
const ZIB_API = (() => {
    const custom = localStorage.getItem('zib_api_base') || BACKEND_URL;
    if (custom) return custom.replace(/\/$/, '');
    return location.protocol === 'file:' ? 'http://localhost:3000' : '';
})();

const HISTORY_LIMIT = 20;
const movieRegistry = new Map();   // id -> краткие данные фильма (для избранного)
localStorage.removeItem('zibToken'); // старый формат (до сеансов)
let authToken = localStorage.getItem('zibSession') || null; // ключ текущего сеанса
let sessionsList = [];
let sessionsCanManage = false;
let sessionsState = 'idle'; // idle | loading | error
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
    if (!ZIB_API && /\.github\.io$/.test(location.hostname)) {
        throw Object.assign(new Error('Не указан адрес сервера. Задайте BACKEND_URL в начале script.js.'), { status: 0 });
    }
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
    try { data = await res.json(); } catch { /* пустой ответ */ }
    if (res.status === 401 && token && token === authToken) { // сеанс завершён на другом устройстве
        clearSession();
        showToast('Сеанс завершён. Войдите снова.');
    }
    if (!res.ok) throw Object.assign(new Error(data.error || 'Ошибка сервера'), { status: res.status });
    return data;
}

// ---------- уведомления ----------
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

// ---------- состояние аккаунта ----------
function saveAuthCache() {
    if (!authUser) return;
    try { localStorage.setItem('zibCache', JSON.stringify({ user: authUser, history: authHistory, favorites })); } catch { /* переполнено */ }
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
    try { // мгновенно показываем сохранённые данные, пока ждём сервер
        const cache = JSON.parse(localStorage.getItem('zibCache') || 'null');
        if (cache && cache.user) applyAccount(cache);
    } catch { /* битый кэш */ }
    try {
        applyAccount(await apiFetch('/api/me'));
    } catch (e) { /* 401 обработан в apiFetch, при отсутствии сети остаёмся на кэше */ }
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

// ---------- история просмотров ----------
function getHistory() {
    return authUser ? authHistory : JSON.parse(localStorage.getItem('zibHistory') || '[]');
}

function renderHistory() {
    const slider = document.getElementById('home-history-slider');
    const history = getHistory();

    if (history.length === 0) {
        slider.innerHTML = `<div class="text-sm text-m3-outline py-6 px-4 bg-m3-surfaceContainerLow rounded-2xl w-full border border-m3-outlineVariant/20 border-dashed text-center">Вы еще ничего не смотрели. История пуста.</div>`;
    } else {
        slider.innerHTML = history.map(movie => createMovieCard(movie, true, { removable: true })).join('');
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
    if (!getHistory().length) { showToast('История уже пуста.'); return; }
    if (!confirm('Очистить всю историю просмотров?')) return;
    if (authUser) {
        authHistory = [];
        saveAuthCache();
        apiFetch('/api/history', { method: 'DELETE' }).catch(e => showToast('Не удалось очистить на сервере: ' + e.message));
    } else {
        localStorage.removeItem('zibHistory');
    }
    renderHistory();
}

// Убрать один фильм из истории
function removeFromHistory(id, btn) {
    id = String(id);
    if (!confirm('Убрать этот фильм из истории просмотров?')) return;
    const list = getHistory().filter(m => String(m.kinopoiskId || m.filmId) !== id);
    if (authUser) {
        authHistory = list;
        saveAuthCache();
        apiFetch('/api/history/' + id, { method: 'DELETE' }).catch(e => showToast('Не удалось удалить на сервере: ' + e.message));
    } else {
        localStorage.setItem('zibHistory', JSON.stringify(list));
    }

    const slider = document.getElementById('home-history-slider');
    const card = btn && btn.closest('[data-mid]');
    const finish = () => {
        if (card) card.remove();
        if (!list.length) renderHistory(); else updateSliderFade(slider);
        if (currentActiveTab === 'profile') renderProfileView();
    };
    if (!card) return finish();
    card.style.pointerEvents = 'none';
    card.style.opacity = '0';
    card.style.transform = 'scale(.9)';
    setTimeout(finish, 260);
}

// ---------- избранное ----------
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

    req.catch(e => { // не вышло — откатываем
        favorites = snapshot;
        favIds = new Set(favorites.map(m => String(m.kinopoiskId)));
        updateFavUI(id);
        saveAuthCache();
        if (currentActiveTab === 'collections') renderCollections();
        showToast('Не удалось сохранить: ' + e.message);
    });
}

// ---------- вкладка «Подборки» ----------
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

// ---------- вкладка «Профиль» ----------
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
    const spin = m => (profileBusy && profileMode === m) ? zibLoader('1.1em', 'zib-loader-inline') : '';
    // 1) только что создан аккаунт — показываем токен
    if (kind === 'fresh') {
        box.innerHTML = `<div class="${card} ${enter} space-y-5 text-center">
            <div class="w-16 h-16 rounded-full bg-m3-primaryContainer text-m3-onPrimaryContainer mx-auto flex items-center justify-center text-2xl"><i class="fa-solid fa-key"></i></div>
            <h2 class="text-2xl font-bold text-m3-onSurface">Аккаунт создан!</h2>
            <p class="text-sm text-m3-secondary">Это ваш токен для входа на других устройствах. Сохраните его: регистр букв и знаки важны. Позже его можно будет скопировать в профиле на главном устройстве.</p>
            <div class="px-4 py-4 rounded-2xl bg-m3-surfaceContainerLow border border-m3-primary/40 font-mono text-sm sm:text-base font-bold text-m3-primary break-all select-all">${esc(freshToken)}</div>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <button onclick="copyToken()" class="px-5 py-2.5 rounded-full bg-m3-surfaceContainerHigh hover:bg-m3-surfaceContainerHighest text-m3-onSurface text-sm font-bold border border-m3-outlineVariant/40 cursor-pointer"><i class="fa-regular fa-copy mr-2"></i>Скопировать</button>
                <button onclick="finishFreshToken()" class="px-5 py-2.5 rounded-full bg-m3-primary text-m3-onPrimary text-sm font-bold cursor-pointer">Продолжить</button>
            </div>
        </div>`;
        return;
    }

    // 2) вошли в аккаунт
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

    // 3) гость: создать аккаунт / войти (обе формы в DOM, переключаются анимацией)
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

// ---------- копирование ----------
async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch { /* нет доступа к буферу (например, http) */ }
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
        tokenRevealTimer = setTimeout(() => { tokenReveal = null; if (currentActiveTab === 'profile') renderProfileView(); }, 30000); // автоскрытие
        renderProfileView();
    } catch (e) { showToast(e.message); }
}

async function copyProfileToken() {
    try {
        const t = tokenReveal || await fetchAccountToken();
        showToast(await copyText(t) ? 'Токен скопирован.' : 'Не удалось скопировать. Нажмите на глаз и скопируйте вручную.');
    } catch (e) { showToast(e.message); }
}

// ---------- сеансы ----------
function fmtAgo(iso) {
    const t = Date.parse(iso);
    if (!t) return '';
    const m = Math.floor((Date.now() - t) / 60000);
    if (m < 1) return 'только что';
    if (m < 60) return m + ' мин. назад';
    const h = Math.floor(m / 60);
    if (h < 24) return h + ' ч. назад';
    const d = Math.floor(h / 24);
    if (d < 7) return d + ' дн. назад';
    return fmtDate(iso);
}

function osIcon(os) {
    return ({ Windows: 'fa-brands fa-windows', macOS: 'fa-brands fa-apple', iOS: 'fa-brands fa-apple', Android: 'fa-brands fa-android', Linux: 'fa-brands fa-linux', ChromeOS: 'fa-brands fa-chrome' })[os] || 'fa-solid fa-globe';
}

function renderSessionsBlock() {
    let body;
    if (sessionsState === 'loading' && !sessionsList.length) {
      body = `<div class="text-center py-6 text-m3-outline text-sm">${zibLoader('1.3rem', 'zib-loader-inline')}Загрузка сеансов…</div>`;
    } else if (sessionsState === 'error') {
        body = '<div class="text-center py-4 text-sm text-red-400">Не удалось загрузить сеансы.</div>';
    } else {
        body = sessionsList.map(s => {
            const badges = [
                s.current ? '<span class="px-2 py-0.5 rounded-full bg-m3-primaryContainer text-m3-onPrimaryContainer text-[10px] font-bold">Это устройство</span>' : '',
                s.main ? '<span class="px-2 py-0.5 rounded-full bg-m3-primary text-m3-onPrimary text-[10px] font-bold"><i class="fa-solid fa-shield-halved mr-1"></i>Главная</span>' : ''
            ].join('');
            const canDelete = sessionsCanManage && !s.current && !s.main;
            return `<div data-session="${esc(s.id)}" class="flex items-center gap-3 p-3 rounded-2xl bg-m3-surfaceContainerLow border border-m3-outlineVariant/20">
                <div class="w-11 h-11 shrink-0 rounded-2xl bg-m3-primaryContainer text-m3-onPrimaryContainer flex items-center justify-center text-lg"><i class="${osIcon(s.os)}"></i></div>
                <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span class="text-sm font-bold text-m3-onSurface">${esc(s.os)} · ${esc(s.browser)}</span>${badges}
                    </div>
                    <div class="text-[11px] text-m3-outline mt-0.5">${s.current ? 'Активен сейчас' : 'Активность: ' + esc(fmtAgo(s.lastSeen))} · вход ${esc(fmtDate(s.createdAt))} · IP ${esc(s.ipMask)}</div>
                </div>
                ${canDelete ? `<button onclick="deleteSession('${esc(s.id)}', this)" title="Завершить сеанс" class="w-10 h-10 shrink-0 rounded-full bg-m3-surfaceContainerHigh hover:bg-red-500/20 text-red-300 transition-colors cursor-pointer"><i class="fa-solid fa-trash-can"></i></button>` : ''}
            </div>`;
        }).join('');
    }

    const others = sessionsList.filter(s => !s.current).length;
    const killAll = sessionsCanManage && others > 0
        ? `<button onclick="deleteOtherSessions()" class="w-full px-4 py-2.5 rounded-full bg-m3-surfaceContainerHigh hover:bg-red-500/20 text-red-300 text-xs font-bold border border-m3-outlineVariant/40 transition-colors cursor-pointer">Завершить все остальные сеансы</button>` : '';
    const hint = sessionsList.length && !sessionsCanManage
        ? '<p class="text-[11px] text-m3-outline">Завершать чужие сеансы может только главный — тот, с которого был первый вход.</p>' : '';

    return `<div class="space-y-3">
        <div class="flex items-center justify-between">
            <div class="text-xs font-bold text-m3-outline uppercase tracking-wider">Сеансы</div>
            <span class="text-xs text-m3-outline">${sessionsList.length || ''}</span>
        </div>
        <div class="space-y-2">${body}</div>
        ${killAll}${hint}
    </div>`;
}

async function loadSessions() {
    if (!authUser) return;
    sessionsState = 'loading';
    try {
        const data = await apiFetch('/api/sessions');
        sessionsList = data.sessions || [];
        sessionsCanManage = !!data.canManage;
        sessionsState = 'idle';
    } catch (e) {
        if (e.status === 0 && sessionsList.length) sessionsState = 'idle'; else sessionsState = 'error';
    }
    if (currentActiveTab === 'profile' && !freshToken) renderProfileView();
}

async function deleteSession(id, btn) {
    if (!confirm('Завершить этот сеанс? Устройство будет разлогинено.')) return;
    try {
        await apiFetch('/api/sessions/' + id, { method: 'DELETE' });
        const row = btn && btn.closest('[data-session]');
        if (row) { // плавно «схлопываем» строку
            row.style.maxHeight = row.offsetHeight + 'px';
            void row.offsetWidth;
            row.classList.add('pf-leave');
            await new Promise(r => setTimeout(r, 300));
        }
        showToast('Сеанс завершён.');
    } catch (e) { showToast(e.message); }
    loadSessions();
}

async function deleteOtherSessions() {
    if (!confirm('Завершить все сеансы, кроме этого устройства?')) return;
    try {
        await apiFetch('/api/sessions', { method: 'DELETE' });
        showToast('Остальные сеансы завершены.');
    } catch (e) { showToast(e.message); }
    loadSessions();
}

// если сеанс завершили на другом устройстве — узнаем, когда вкладка снова станет активной
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && authToken) apiFetch('/api/me').catch(() => {});
});

function setProfileMode(mode) {
    if (profileMode === mode) return;
    profileMode = mode;
    profileError = '';
    const root = document.getElementById('profile-guest');
    if (root) { // меняем на месте, чтобы сработала анимация
        root.dataset.mode = mode;
        root.querySelectorAll('.pf-error').forEach(e => e.remove());
    } else renderProfileView();
}

function clientInfo() {
    return {
        platform: (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '',
        lang: navigator.language || '',
        tz: (Intl.DateTimeFormat().resolvedOptions().timeZone) || '',
        screen: screen.width + 'x' + screen.height
    };
}

async function profileCreate() {
    const nickname = (document.getElementById('profile-nickname').value || '').trim();
    profileNickname = nickname;
    if (nickname.length < 2) { profileError = 'Ник должен быть от 2 до 24 символов.'; return renderProfileView(); }
    profileBusy = true; profileError = ''; renderProfileView();
    try {
        const guestHistory = getHistory().map(slimMovie).filter(Boolean);
        const data = await apiFetch('/api/register', { method: 'POST', token: null, body: { nickname, history: guestHistory, client: clientInfo() } });
        authToken = data.sessionKey;
        localStorage.setItem('zibSession', authToken);
        freshToken = data.token; profileNickname = '';
        profileBusy = false;
        applyAccount(data);
    } catch (e) {
        profileBusy = false; profileError = e.message; renderProfileView();
    }
}

async function profileLogin() {
    const token = (document.getElementById('profile-token').value || '').trim();
    profileTokenInput = token;
    if (!token) { profileError = 'Вставьте токен.'; return renderProfileView(); }
    profileBusy = true; profileError = ''; renderProfileView();
    try {
        const data = await apiFetch('/api/login', { method: 'POST', token: null, body: { token } });
        authToken = data.sessionKey;
        localStorage.setItem('zibSession', authToken);
        profileBusy = false; profileTokenInput = '';
        applyAccount(data);
        loadSessions();
        showToast('Добро пожаловать, ' + data.user.nickname + '!');
    } catch (e) {
        profileBusy = false; profileError = e.message; renderProfileView();
    }
}

async function profileLogout() {
    if (sessionsList.length <= 1 && !confirm('Это ваш единственный сеанс. Если выйти, аккаунт будет удалён вместе с историей и избранным, так как не останется ни одного сеанса. Продолжить?')) return;
    let deleted = false;
    try { deleted = !!(await apiFetch('/api/logout', { method: 'POST' })).accountDeleted; } catch { /* сеанс и так недействителен */ }
    clearSession();
    profileMode = 'login';
    renderProfileView();
    showToast(deleted ? 'Аккаунт удалён: не осталось ни одного сеанса.' : 'Вы вышли из аккаунта.');
}

function finishFreshToken() { freshToken = null; renderProfileView(); loadSessions(); }

async function copyToken() {
    if (!freshToken) return;
    showToast(await copyText(freshToken) ? 'Токен скопирован.' : 'Не удалось скопировать. Выделите токен и скопируйте вручную.');
}

function scrollSlider(sliderId, direction) {
    const slider = document.getElementById(sliderId);
    if (slider) {
        const scrollAmount = slider.clientWidth * 0.70;
        slider.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
    }
}

function handleLiveSearch(query) {
    query = query.trim();
    const container = document.getElementById('suggestions-container');
    const icon = document.getElementById('search-btn-icon');

    if (!query) {
        container.innerHTML = '<div class="text-xs text-m3-outline p-3 text-center">Начните вводить название...</div>';
        return;
    }

    icon.className = 'fa-solid fa-spinner fa-spin';

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(async () => {
        try {
            if (/^\d+$/.test(query)) {
                container.innerHTML = `
                    <button onclick="openMoviePlayer('${query}')" class="w-full text-left p-3 hover:bg-m3-surfaceContainerHighest transition-colors flex items-center gap-3 rounded-xl animate-fade-in-down cursor-pointer">
                        <div class="w-10 h-10 rounded bg-m3-primaryContainer text-m3-onPrimaryContainer flex items-center justify-center shrink-0"><i class="fa-solid fa-hashtag"></i></div>
                        <div>
                            <div class="text-sm font-bold text-m3-onSurface">Открыть по ID: ${query}</div>
                            <div class="text-[10px] text-m3-outline">Прямой переход к плееру</div>
                        </div>
                    </button>
                `;
                return;
            }

            const res = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(query)}&page=1`, { headers: API_HEADERS });
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();

            if (data.films && data.films.length > 0) {
                const topResults = data.films.slice(0, 5);
                container.innerHTML = topResults.map((film, index) => {
                    const name = film.nameRu || film.nameEn || 'Неизвестно';
                    const year = film.year || '';
                    const rating = film.rating ? `<span class="text-amber-300 font-bold px-1 rounded bg-amber-400/10">★ ${film.rating}</span>` : '';

                    return `
                        <button onclick="openMoviePlayer('${film.filmId}')" class="w-full text-left p-2 hover:bg-m3-surfaceContainerHighest transition-colors flex items-center gap-3 rounded-xl animate-fade-in-down cursor-pointer" style="animation-delay: ${index * 50}ms">
                            <img src="${film.posterUrlPreview || film.posterUrl}" class="w-10 h-14 object-cover rounded bg-m3-surfaceContainerLowest" referrerpolicy="no-referrer" onerror="this.src='${fallbackPoster}'">
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
    }, 500);
}

async function executeDirectSearch() {
    const query = document.getElementById('search-input').value.trim();
    document.getElementById('search-suggestions').classList.add('hidden');

    if (!query) return;

    if (/^\d+$/.test(query)) {
        openMoviePlayer(query);
        return;
    }

    const searchNavBtn = document.getElementById('nav-btn-search');
    if (searchNavBtn) {
        searchNavBtn.classList.remove('hidden');
        searchNavBtn.classList.add('flex');
    }

    switchNavTab('search');

    document.getElementById('search-query-label').innerText = query;
    const grid = document.getElementById('search-grid-container');
    const countLabel = document.getElementById('search-results-count');

  grid.innerHTML = `<div class="col-span-full text-center py-10">${zibLoader('2.75rem')}<span class="ml-3 text-m3-outline text-sm block mt-2">Поиск по запросу «${query}»...</span></div>`;
  countLabel.innerText = 'Поиск...';

    try {
        const res = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(query)}&page=1`, { headers: API_HEADERS });
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();

        if (data.films && data.films.length > 0) {
            grid.innerHTML = data.films.map(movie => createMovieCard(movie, false)).join('');
            countLabel.innerText = `Найдено: ${data.films.length}`;
        } else {
            grid.innerHTML = `<div class="col-span-full text-center py-12 text-m3-outline text-sm"><i class="fa-solid fa-magnifying-glass text-3xl mb-3 block"></i>По запросу «${query}» ничего не найдено.</div>`;
            countLabel.innerText = '0 результатов';
        }
    } catch (err) {
        console.error('Search error:', err);
        grid.innerHTML = `<div class="col-span-full text-center py-10 text-red-400 text-sm">Ошибка при загрузке результатов поиска.</div>`;
        countLabel.innerText = 'Ошибка';
    }
}

async function openMoviePlayer(kpId) {
    kpId = String(kpId);
    if (!isPlayerVisible()) {
        movieOpenedFromList = routeWritesEnabled;
        sessionStorage.setItem('zibBackTab', currentActiveTab === 'search' ? 'home' : currentActiveTab);
    }
    saveListState(kpId);
    setRoute('#/movie/' + kpId);
    document.getElementById('search-suggestions').classList.add('hidden');
    document.getElementById('search-input').value = '';

    const homeView = document.getElementById('home-view');
    const popularView = document.getElementById('popular-view');
    const searchView = document.getElementById('search-view');
    const genericView = document.getElementById('generic-view');
    const playerView = document.getElementById('player-view');

    if(homeView) hideMainView(homeView);
    if(popularView) hideMainView(popularView);
    if(searchView) hideMainView(searchView);
    if(genericView) hideMainView(genericView);
    hideMainView(document.getElementById('profile-view'));
    hideMainView(document.getElementById('collections-view'));
    showMainView(playerView, 'right');

    document.getElementById('current-player-kp-id').innerText = kpId;
    document.getElementById('player-movie-title').innerText = 'Загрузка информации...';
    document.getElementById('player-movie-description').innerText = '';
    document.getElementById('player-movie-meta').innerHTML = zibLoader('1.5rem');
    document.getElementById('meta-bg-blur').style.backgroundImage = 'none';

    // постер: миниатюра сразу, чтобы блок не прыгал
    currentPosterFull = '';
    currentPosterTitle = '';
    const posterImg = document.getElementById('player-poster-img');
    posterImg.onerror = () => { posterImg.onerror = null; posterImg.src = fallbackPoster; };
    posterImg.src = `https://st.kp.yandex.net/images/film_big/${kpId}.jpg`;

    activeMovieId = kpId;
    activeMovieType = 'FILM';
    updatePlayerFavBtn();

    const wrapper = document.getElementById('player-wrapper');
    if (wrapper) {
        wrapper.innerHTML = `
          <div class="absolute inset-0 flex flex-col items-center justify-center text-m3-outline gap-3 bg-black">
              ${zibLoader('3rem')}
              <span class="text-xs">Подключение медиа...</span>
          </div>
        `;
    }

    try {
        const res = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/${kpId}`, { headers: API_HEADERS });
        if (res.ok) {
            const film = await res.json();

            activeMovieType = film.type || 'FILM';
            setPlayerMode(currentMode);

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
                <span class="px-2 py-1 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">★ ${rating}</span>
            `;

            document.getElementById('meta-bg-blur').style.backgroundImage = `url('https://st.kp.yandex.net/images/film_big/${kpId}.jpg')`;
            currentPosterFull = film.posterUrl || '';
            currentPosterTitle = name;

            const slimFilm = slimMovie(film);
            if (slimFilm) { movieRegistry.set(String(kpId), slimFilm); }
            addToHistory(film);
        }
    } catch (err) {
        console.error("Failed to load details:", err);
        document.getElementById('player-movie-title').innerText = `Просмотр (ID: ${kpId})`;
        document.getElementById('player-movie-meta').innerHTML = '<span class="text-red-400 text-xs">Данные не загружены</span>';

        setPlayerMode(currentMode);
        addToHistory({ kinopoiskId: kpId, nameRu: `Фильм #${kpId}` });
    }
}

function togglePlayerSelectMenu() {
    const dropdown = document.getElementById('player-selector-dropdown');
    const arrow = document.getElementById('player-selector-arrow');

    if (dropdown.classList.contains('hidden')) {
        dropdown.classList.remove('hidden');
        dropdown.classList.add('flex');
        dropdown.classList.remove('animate-fade-in-down');
        void dropdown.offsetWidth;
        dropdown.classList.add('animate-fade-in-down');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
    } else {
        dropdown.classList.add('hidden');
        dropdown.classList.remove('flex');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    }
}

function setPlayerMode(mode) {
    currentMode = mode;
    if (!activeMovieId) return;

    const dropdown = document.getElementById('player-selector-dropdown');
    const arrow = document.getElementById('player-selector-arrow');
    if (dropdown) { dropdown.classList.add('hidden'); dropdown.classList.remove('flex'); }
    if (arrow) arrow.style.transform = 'rotate(0deg)';

    const namesMap = {
        'external_sspoisk': 'SSpoisk',
        'external_kinobox': 'Kinobox',
        'external_gokino' : 'Gokino'
    };
    document.getElementById('active-player-name-badge').innerText = namesMap[mode] || 'Платформа';

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

    const wrapper = document.getElementById('player-wrapper');
    let iframeSrc = '';

    if (mode === 'external_kinobox') {
        iframeSrc = `https://on.kinohub.vip/movie/${activeMovieId}`;
    } else if (mode === 'external_sspoisk') {
        const isSeries = ['TV_SERIES', 'MINI_SERIES', 'TV_SHOW'].includes(activeMovieType);
        const route = isSeries ? 'series' : 'film';
        iframeSrc = `https://fixtyflux.cfd/${route}/${activeMovieId}/`;
    } else if (mode === 'external_gokino') {
        iframeSrc = `https://matrix.gokino.by/search.php?q=${activeMovieId}`;
    }

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
    }
}
