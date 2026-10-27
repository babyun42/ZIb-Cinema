'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ───────────────────────── настройки ─────────────────────────
const PORT = Number(process.env.PORT) || 2442;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const TRUST_PROXY = process.env.TRUST_PROXY === '1';     // 1, если сервер стоит за nginx/Cloudflare

// HTTPS: если Node сам отдаёт HTTPS, укажите пути к сертификату (например, fullchain.pem и privkey.pem).
// Если HTTPS делает nginx/Caddy/Cloudflare — оставьте пустым и поставьте TRUST_PROXY=1.
const SSL_CERT = process.env.SSL_CERT || '';
const SSL_KEY = process.env.SSL_KEY || '';

// Домен вашего сайта (для CORS). www-вариант разрешается автоматически.
const SITE_DOMAIN = (process.env.SITE_DOMAIN || 'zib-cinema.xyz').toLowerCase();
const PROXYCHECK_KEY = process.env.PROXYCHECK_KEY || '284k7c-c87879-204249-0yy21w';  // ключ proxycheck.io для точного VPN-детекта

// Раздача сайта: либо из локальной папки public/, либо с GitHub (если заданы GITHUB_USERNAME и GITHUB_REPO)
const PUBLIC_DIR = path.join(__dirname, 'public');
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'babyun42';
const GITHUB_REPO = process.env.GITHUB_REPO || 'Zib-Cinema';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_PATH = process.env.GITHUB_PATH || '';   // папка с сайтом внутри репозитория: '' — корень, 'public' — папка public
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''; // нужен только для приватного репозитория
const ADMIN_KEY = process.env.ADMIN_KEY || '';       // ключ для сброса кэша: POST /api/admin/purge-cache

// Кэш статики
const STATIC_CACHE_TTL_MS = Number(process.env.STATIC_CACHE_TTL_MS) || 5 * 60 * 1000; // свежесть: 5 минут
const STATIC_STALE_MAX_MS = 24 * 3600 * 1000; // если GitHub недоступен, отдаём устаревшую копию не старше суток
const NOT_FOUND_TTL_MS = 60 * 1000;           // «нет такого файла» тоже помним, чтобы не дёргать GitHub зря
const STATIC_CACHE_MAX = 300;                 // максимум файлов в памяти
const GITHUB_ENABLED = Boolean(GITHUB_USERNAME && GITHUB_REPO);

// Кому браузер разрешит читать ответы API (CORS):
//  • ваш сайт: https://zib-cinema.xyz и https://www.zib-cinema.xyz
//  • GitHub Pages: https://<GITHUB_USERNAME>.github.io (подставляется автоматически)
//  • ALLOWED_ORIGIN — свой список через запятую (заменяет домен сайта), '*' — разрешить всем
const ALLOWED_ORIGINS = (() => {
  const raw = process.env.ALLOWED_ORIGIN;
  if (raw && raw.trim() === '*') return null; // null = любой источник
  const list = raw
    ? raw.split(',')
    : [`https://${SITE_DOMAIN}`, `https://www.${SITE_DOMAIN}`];
  if (GITHUB_USERNAME) list.push(`https://${GITHUB_USERNAME}.github.io`);
  return new Set(list.map(o => o.trim().replace(/\/+$/, '').toLowerCase()).filter(Boolean));
})();

const MAX_BODY = 200 * 1024;
const HISTORY_LIMIT = 20;
const FAVORITES_LIMIT = 5000;

fs.mkdirSync(DATA_DIR, { recursive: true });

// ───────────────────────── секрет и база ─────────────────────────
const SECRET_FILE = path.join(DATA_DIR, 'secret.key');
let SECRET;
if (process.env.TOKEN_SECRET) {
  SECRET = process.env.TOKEN_SECRET;
} else if (fs.existsSync(SECRET_FILE)) {
  SECRET = fs.readFileSync(SECRET_FILE, 'utf8').trim();
} else {
  SECRET = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SECRET_FILE, SECRET, { mode: 0o600 });
}

const DB_FILE = path.join(DATA_DIR, 'db.json');
let db = { accounts: [] };
try {
  if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
} catch (e) {
  console.error('Не удалось прочитать db.json, чтобы не потерять данные сервер остановлен:', e.message);
  process.exit(1);
}
if (!Array.isArray(db.accounts)) db.accounts = [];

const byHash = new Map(db.accounts.map(a => [a.tokenHash, a]));

// Уникальность ников: без учёта регистра, лишних пробелов, невидимых символов и «ё/е».
const cleanNick = raw => String(raw ?? '')
  .normalize('NFKC')
  .replace(/[\p{Cc}\p{Cf}<>]/gu, '')   // управляющие и невидимые символы, угловые скобки
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 24)
  .trim();
const nickKey = n => n.toLocaleLowerCase('ru').replace(/ё/g, 'е');
const nickKeys = new Map(); // ключ ника -> аккаунт
for (const a of db.accounts) {
  const k = nickKey(cleanNick(a.nickname));
  if (!nickKeys.has(k)) nickKeys.set(k, a); // у старых аккаунтов могли быть дубли — первый остаётся владельцем ника
}

// Сеансы (устройства). Первый по времени сеанс аккаунта — главный (account.sessions[0]).
const MAX_SESSIONS = 20;
const sessionByHash = new Map(); // хэш ключа сеанса -> { account, session }
for (const a of db.accounts) {
  a.sessions = a.sessions || [];
  for (const s of a.sessions) sessionByHash.set(s.keyHash, { account: a, session: s });
}

let saveTimer = null;
function saveDb(now = false) {
  const write = () => {
    saveTimer = null;
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db));
    fs.renameSync(tmp, DB_FILE); // атомарно, файл не повредится при сбое
  };
  if (now) { if (saveTimer) clearTimeout(saveTimer); return write(); }
  if (!saveTimer) saveTimer = setTimeout(write, 250);
}
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => { try { saveDb(true); } finally { process.exit(0); } });
}

// ───────────────────────── токен ─────────────────────────
const hashToken = t => crypto.createHash('sha256').update(t).digest('hex');
const hmac = (...parts) => {
  const h = crypto.createHmac('sha256', SECRET);
  for (const p of parts) h.update(p);
  return h.digest();
};

const ENC_KEY = () => hmac('token-encryption-key');
function encryptToken(token) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', ENC_KEY(), iv);
  const data = Buffer.concat([c.update(token, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), data].map(b => b.toString('base64url')).join('.');
}
function decryptToken(packed) {
  try {
    const [iv, tag, data] = String(packed).split('.').map(x => Buffer.from(x, 'base64url'));
    const d = crypto.createDecipheriv('aes-256-gcm', ENC_KEY(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(data), d.final()]).toString('utf8');
  } catch { return null; }
}

const normalizeToken = t => String(t || '').trim();
function findAccountByToken(raw) {
  const t = normalizeToken(raw);
  if (!t) return null;
  return byHash.get(hashToken(t)) || byHash.get(hashToken(t.toUpperCase().replace(/\s+/g, ''))) || null;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const PUNCT = '!@#$%^&*()-_=+[]{}:;,.?~';
const ALPHABET = LETTERS + DIGITS + PUNCT;
const TOKEN_LENGTH = 32;

function makeToken(sig) {
  for (;;) {
    const material = [sig.ip, Date.now(), sig.ua, sig.os, sig.browser, sig.vpn, sig.client].join('|');
    const nonce = crypto.randomBytes(16);
    const limit = 256 - (256 % ALPHABET.length);
    let out = '';
    for (let counter = 0; out.length < TOKEN_LENGTH; counter++) {
      for (const byte of hmac(material, nonce, String(counter))) {
        if (byte < limit && out.length < TOKEN_LENGTH) out += ALPHABET[byte % ALPHABET.length];
      }
    }
    const punct = [...out].filter(c => PUNCT.includes(c)).length;
    const hasLetter = /[A-Za-z]/.test(out), hasDigit = /\d/.test(out);
    if (punct >= 3 && hasLetter && hasDigit && !byHash.has(hashToken(out))) return out;
  }
}

// ───────────────────────── сигналы запроса ─────────────────────────
function getIp(req) {
  let ip = req.socket.remoteAddress || '';
  if (TRUST_PROXY) {
    const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (xff) ip = xff;
  }
  return ip.replace(/^::ffff:/, '');
}

function parseUA(ua = '') {
  let os = 'Unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/YaBrowser/i.test(ua)) browser = 'Yandex';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox';
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua)) browser = 'Safari';
  return { os, browser };
}

function isPrivateIp(ip) {
  return !ip || ip === '::1' || /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|f[cd][0-9a-f]{2}:|fe80:)/i.test(ip);
}

async function detectVpn(req, ip) {
  if (isPrivateIp(ip)) return 'unknown';
  if (PROXYCHECK_KEY) {
    try {
      const r = await fetch(`https://proxycheck.io/v2/${encodeURIComponent(ip)}?key=${PROXYCHECK_KEY}&vpn=1`, {
        signal: AbortSignal.timeout(2500)
      });
      const j = await r.json();
      if (j && j[ip]) return j[ip].proxy === 'yes' ? 'yes' : 'no';
    } catch { /* падаем на эвристику */ }
  }
  const h = req.headers;
  const hops = String(h['x-forwarded-for'] || '').split(',').filter(Boolean).length;
  if (h.via || h.forwarded || h['proxy-connection'] || h['x-proxy-id'] || (!TRUST_PROXY && hops > 0)) return 'suspected';
  return 'unknown';
}

// ───────────────────────── защита от перебора ─────────────────────────
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
  if (arr.length >= max) { hits.set(key, arr); return true; }
  arr.push(now); hits.set(key, arr);
  return false;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, arr] of hits) if (!arr.some(t => now - t < 3600e3)) hits.delete(k);
}, 600e3).unref();

// ───────────────────────── сеансы ─────────────────────────
function maskIp(ip) {
  if (isPrivateIp(ip)) return 'локальная сеть';
  if (ip.includes(':')) return ip.split(':').slice(0, 2).join(':') + ':*';
  const p = ip.split('.');
  return p.length === 4 ? `${p[0]}.${p[1]}.*.*` : 'скрыт';
}

function removeSession(account, session) {
  account.sessions = account.sessions.filter(s => s !== session);
  sessionByHash.delete(session.keyHash);
}

function createSession(account, req, ip) {
  const ua = String(req.headers['user-agent'] || '').slice(0, 300);
  const { os, browser } = parseUA(ua);
  const key = crypto.randomBytes(32).toString('base64url');
  const now = new Date().toISOString();
  const session = { id: crypto.randomBytes(6).toString('hex'), keyHash: hashToken(key), createdAt: now, lastSeen: now, os, browser, ipMask: maskIp(ip) };
  account.sessions.push(session);
  sessionByHash.set(session.keyHash, { account, session });
  while (account.sessions.length > MAX_SESSIONS) removeSession(account, account.sessions[1]);
  return { key, session };
}

function deleteAccount(account) {
  db.accounts = db.accounts.filter(a => a !== account);
  byHash.delete(account.tokenHash);
  const nk = nickKey(cleanNick(account.nickname));
  if (nickKeys.get(nk) === account) nickKeys.delete(nk); // ник снова свободен
  for (const s of account.sessions) sessionByHash.delete(s.keyHash);
  account.sessions = [];
}

const isMainSession = (account, session) => account.sessions[0] === session;

// ───────────────────────── валидация ─────────────────────────
const clean = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, n) : '');

function cleanMovie(m) {
  if (!m || typeof m !== 'object') return null;
  const id = Number(m.kinopoiskId || m.filmId);
  if (!Number.isInteger(id) || id <= 0 || id > 1e9) return null;
  const out = { kinopoiskId: id };
  for (const k of ['nameRu', 'nameOriginal', 'nameEn']) {
    const s = clean(m[k], 200);
    if (s) out[k] = s;
  }
  const year = clean(String(m.year ?? ''), 10);
  if (year && /^[\d–-]+$/.test(year)) out.year = /^\d{4}$/.test(year) ? Number(year) : year;
  const rating = Number(m.ratingKinopoisk ?? m.rating);
  if (Number.isFinite(rating) && rating >= 0 && rating <= 10) out.ratingKinopoisk = Math.round(rating * 10) / 10;
  return out;
}

function mergeHistory(list) {
  const seen = new Set(), out = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const m = cleanMovie(raw);
    if (m && !seen.has(m.kinopoiskId)) { seen.add(m.kinopoiskId); out.push(m); }
    if (out.length >= HISTORY_LIMIT) break;
  }
  return out;
}

const publicUser = a => ({
  nickname: a.nickname,
  createdAt: a.createdAt,
  createdOn: a.meta ? `${a.meta.os} · ${a.meta.browser}` : ''
});
const accountPayload = a => ({ user: publicUser(a), history: a.history, favorites: a.favorites });

// ───────────────────────── http-утилиты ─────────────────────────
function send(res, status, body, extra = {}) {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extra
  });
  res.end(data);
}
const fail = (res, status, message) => send(res, status, { error: message });

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('Слишком большой запрос'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(Object.assign(new Error('Некорректный JSON'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

function authenticate(req) {
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '');
  if (!m) return null;
  const found = sessionByHash.get(hashToken(m[1].trim()));
  if (!found) return null;
  const last = Date.parse(found.session.lastSeen) || 0;
  if (Date.now() - last > 60e3) { found.session.lastSeen = new Date().toISOString(); saveDb(); }
  return found;
}

// ───────────────────────── API ─────────────────────────
async function handleApi(req, res, url) {
  const route = url.pathname.replace(/\/+$/, '');
  const ip = getIp(req);

  if (req.method === 'GET' && route === '/api/health') return send(res, 200, { ok: true });

  if (req.method === 'POST' && route === '/api/register') {
    if (limited('reg:' + ip, 10, 3600e3)) return fail(res, 429, 'Слишком много регистраций. Попробуйте позже.');
    const body = await readJson(req);
    const nickname = cleanNick(body.nickname);
    if (nickname.length < 2) return fail(res, 400, 'Ник должен быть от 2 до 24 символов.');
    const nk = nickKey(nickname);
    if (nickKeys.has(nk)) return fail(res, 409, 'Этот ник уже занят. Выберите другой.');

    const ua = String(req.headers['user-agent'] || '').slice(0, 300);
    const { os, browser } = parseUA(ua);
    const vpn = await detectVpn(req, ip);
    const c = body.client && typeof body.client === 'object' ? body.client : {};
    const client = ['platform', 'lang', 'tz', 'screen'].map(k => clean(String(c[k] ?? ''), 60)).join('/');

    const token = makeToken({ ip, ua, os, browser, vpn, client });
    const account = {
      id: crypto.randomBytes(8).toString('hex'),
      nickname,
      tokenHash: hashToken(token),
      tokenEnc: encryptToken(token),
      createdAt: new Date().toISOString(),
      meta: { os, browser, vpn, ipHash: hmac('ip:' + ip).toString('hex').slice(0, 16) },
      history: mergeHistory(body.history),
      favorites: [],
      sessions: []
    };
    // повторная проверка: пока ждали detectVpn, тот же ник мог занять другой запрос
    if (nickKeys.has(nk)) return fail(res, 409, 'Этот ник уже занят. Выберите другой.');
    nickKeys.set(nk, account);
    db.accounts.push(account);
    byHash.set(account.tokenHash, account);
    const { key } = createSession(account, req, ip);
    saveDb();
    return send(res, 201, { token, sessionKey: key, ...accountPayload(account) });
  }

  if (req.method === 'POST' && route === '/api/login') {
    if (limited('login:' + ip, 15, 10 * 60e3)) return fail(res, 429, 'Слишком много попыток входа. Подождите несколько минут.');
    const body = await readJson(req);
    const account = findAccountByToken(body.token);
    if (!account) return fail(res, 401, 'Неверный токен.');
    const { key } = createSession(account, req, ip);
    saveDb();
    return send(res, 200, { sessionKey: key, ...accountPayload(account) });
  }

  // ---- сброс кэша сайта (после обновления файлов на GitHub) ----
  if (req.method === 'POST' && route === '/api/admin/purge-cache') {
    const given = Buffer.from(String(req.headers['x-admin-key'] || ''));
    const want = Buffer.from(ADMIN_KEY);
    if (!ADMIN_KEY || given.length !== want.length || !crypto.timingSafeEqual(given, want)) return fail(res, 403, 'Нет доступа.');
    const count = staticCache.size;
    staticCache.clear();
    return send(res, 200, { ok: true, cleared: count });
  }

  const auth = authenticate(req);
  if (!auth) return fail(res, 401, 'Нужно войти в аккаунт.');
  const { account, session } = auth;

  if (req.method === 'GET' && route === '/api/me') return send(res, 200, accountPayload(account));

  if (req.method === 'POST' && route === '/api/logout') {
    removeSession(account, session);
    const accountDeleted = account.sessions.length === 0;
    if (accountDeleted) deleteAccount(account);
    saveDb();
    return send(res, 200, { ok: true, accountDeleted });
  }

  if (req.method === 'GET' && route === '/api/token') {
    if (!isMainSession(account, session)) return fail(res, 403, 'Токен доступен только на главном устройстве.');
    const token = account.tokenEnc ? decryptToken(account.tokenEnc) : null;
    if (!token) return fail(res, 404, 'Токен этого аккаунта показать нельзя.');
    return send(res, 200, { token });
  }

  if (route === '/api/sessions') {
    if (req.method === 'GET') {
      return send(res, 200, {
        canManage: isMainSession(account, session),
        sessions: account.sessions.map((s, i) => ({
          id: s.id, os: s.os, browser: s.browser, ipMask: s.ipMask,
          createdAt: s.createdAt, lastSeen: s.lastSeen, current: s === session, main: i === 0
        }))
      });
    }
    if (req.method === 'DELETE') {
      if (!isMainSession(account, session)) return fail(res, 403, 'Завершать сеансы может только главный сеанс.');
      for (const s of account.sessions.slice()) if (s !== session) removeSession(account, s);
      saveDb();
      return send(res, 200, { ok: true });
    }
  }

  const sess = /^\/api\/sessions\/([0-9a-f]{12})$/.exec(route);
  if (sess && req.method === 'DELETE') {
    if (!isMainSession(account, session)) return fail(res, 403, 'Завершать сеансы может только главный сеанс.');
    const target = account.sessions.find(s => s.id === sess[1]);
    if (!target) return fail(res, 404, 'Сеанс не найден.');
    if (target === session) return fail(res, 400, 'Чтобы выйти на этом устройстве, нажмите «Выйти из аккаунта».');
    removeSession(account, target);
    saveDb();
    return send(res, 200, { ok: true });
  }

  if (route === '/api/history') {
    if (req.method === 'POST') {
      const m = cleanMovie((await readJson(req)).movie);
      if (!m) return fail(res, 400, 'Некорректный фильм.');
      account.history = [m, ...account.history.filter(x => x.kinopoiskId !== m.kinopoiskId)].slice(0, HISTORY_LIMIT);
      saveDb();
      return send(res, 200, { history: account.history });
    }
    if (req.method === 'DELETE') {
      account.history = [];
      saveDb();
      return send(res, 200, { history: [] });
    }
  }

  const hist = /^\/api\/history\/(\d{1,10})$/.exec(route);
  if (hist && req.method === 'DELETE') { // убрать один фильм из истории
    const id = Number(hist[1]);
    account.history = account.history.filter(x => x.kinopoiskId !== id);
    saveDb();
    return send(res,200, { history: account.history });
  }

  if (route === '/api/favorites') {
    if (req.method === 'GET') return send(res, 200, { favorites: account.favorites });
    if (req.method === 'POST') {
      const m = cleanMovie((await readJson(req)).movie);
      if (!m) return fail(res, 400, 'Некорректный фильм.');
      if (!account.favorites.some(x => x.kinopoiskId === m.kinopoiskId)) {
        if (account.favorites.length >= FAVORITES_LIMIT) return fail(res, 400, 'Достигнут лимит избранного.');
        account.favorites.unshift(m);
        saveDb();
      }
      return send(res, 200, { favorites: account.favorites });
    }
  }

  const fav = /^\/api\/favorites\/(\d{1,10})$/.exec(route);
  if (fav && req.method === 'DELETE') {
    const id = Number(fav[1]);
    account.favorites = account.favorites.filter(x => x.kinopoiskId !== id);
    saveDb();
    return send(res, 200, { favorites: account.favorites });
  }

  return fail(res, 404, 'Не найдено.');
}

// ───────────────────────── статика (локально или с GitHub, с кэшем) ─────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const staticCache = new Map(); // путь -> { buffer, contentType, etag, upstreamEtag, timestamp, notFound }
const inflight = new Map();    // путь -> Promise (одновременные запросы одного файла идут к GitHub один раз)

// Безопасный путь внутри сайта или null. Всегда с «/» и без «..», точек в начале имён и т.п.
function resolveStaticPath(pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { return null; }
  if (rel.includes('\0') || rel.includes('\\')) return null;
  if (rel.endsWith('/')) rel += 'index.html';
  rel = path.posix.normalize('/' + rel);                       // схлопывает «..», выйти выше корня нельзя
  if (rel.split('/').some(seg => seg.startsWith('.'))) return null; // .git, .env и т.д.
  return rel;
}

const encodePath = p => p.split('/').map(encodeURIComponent).join('/');
const makeEtag = buf => '"' + crypto.createHash('sha1').update(buf).digest('hex').slice(0, 20) + '"';
const contentTypeFor = (rel, upstream) => MIME[path.extname(rel).toLowerCase()] || upstream || 'application/octet-stream';

function remember(rel, entry) {
  staticCache.delete(rel);
  staticCache.set(rel, entry);
  while (staticCache.size > STATIC_CACHE_MAX) staticCache.delete(staticCache.keys().next().value); // выбрасываем самые старые
}

async function readLocal(rel) {
  const file = path.join(PUBLIC_DIR, rel);
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return null;
  try {
    const buffer = await fs.promises.readFile(file);
    return { buffer, contentType: contentTypeFor(rel), etag: makeEtag(buffer), timestamp: Date.now() };
  } catch { return null; }
}

async function readGithub(rel, cached) {
  const prefix = GITHUB_PATH.replace(/^\/+|\/+$/g, '');
  const url = 'https://raw.githubusercontent.com/' +
    `${encodeURIComponent(GITHUB_USERNAME)}/${encodeURIComponent(GITHUB_REPO)}/${encodePath(GITHUB_BRANCH)}` +
    (prefix ? '/' + encodePath(prefix) : '') + encodePath(rel);

  const headers = { 'User-Agent': 'zib-cinema-server' };
  if (GITHUB_TOKEN) headers.Authorization = 'Bearer ' + GITHUB_TOKEN;
  if (cached && !cached.notFound && cached.upstreamEtag) headers['If-None-Match'] = cached.upstreamEtag;

  const r = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });

  if (r.status === 304 && cached) return { ...cached, timestamp: Date.now() };   // файл не менялся
  if (r.status === 404) {
    if (rel === '/index.html') {
      console.warn(`GitHub вернул 404 для ${url}\n  Проверьте GITHUB_USERNAME, GITHUB_REPO, GITHUB_BRANCH, GITHUB_PATH (для приватного репозитория ещё и GITHUB_TOKEN).`);
    }
    return null;
  }
  if (!r.ok) throw new Error(`GitHub ответил ${r.status}`);

  const buffer = Buffer.from(await r.arrayBuffer());
  return {
    buffer,
    contentType: contentTypeFor(rel, r.headers.get('content-type')),
    etag: makeEtag(buffer),
    upstreamEtag: r.headers.get('etag') || '',
    timestamp: Date.now()
  };
}

// Вернёт запись { buffer, contentType, etag } или null, если файла нет
async function loadStatic(rel) {
  const cached = staticCache.get(rel);
  const age = cached ? Date.now() - cached.timestamp : Infinity;
  if (cached && age < (cached.notFound ? NOT_FOUND_TTL_MS : STATIC_CACHE_TTL_MS)) return cached.notFound ? null : cached;

  if (inflight.has(rel)) return inflight.get(rel);

  const job = (async () => {
    try {
      const entry = GITHUB_ENABLED ? await readGithub(rel, cached) : await readLocal(rel);
      if (!entry) { remember(rel, { notFound: true, timestamp: Date.now() }); return null; }
      remember(rel, entry);
      return entry;
    } catch (e) {
      // GitHub недоступен: отдаём устаревшую копию, а если её нет — локальный файл из public/
      if (cached && !cached.notFound && age < STATIC_STALE_MAX_MS) {
        console.warn(`GitHub недоступен (${e.message}), отдаю устаревшую копию: ${rel}`);
        return cached;
      }
      const local = GITHUB_ENABLED ? await readLocal(rel) : null;
      if (local) { console.warn(`GitHub недоступен (${e.message}), отдаю локальный файл: ${rel}`); return local; }
      throw e;
    } finally {
      inflight.delete(rel);
    }
  })();

  inflight.set(rel, job);
  return job;
}

async function serveStatic(req, res, url) {
  const rel = resolveStaticPath(url.pathname);
  if (!rel) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404'); }

  let entry;
  try {
    entry = await loadStatic(rel);
  } catch (e) {
    console.error('Не удалось получить файл сайта:', rel, '-', e.message);
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('502 Не удалось загрузить сайт с GitHub');
  }
  if (!entry) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404'); }

  const headers = {
    'Content-Type': entry.contentType,
    'Cache-Control': 'public, max-age=60, must-revalidate',
    'ETag': entry.etag
  };
  if (req.headers['if-none-match'] === entry.etag) { res.writeHead(304, headers); return res.end(); }

  res.writeHead(200, { ...headers, 'Content-Length': entry.buffer.length });
  res.end(req.method === 'HEAD' ? undefined : entry.buffer);
}

// ───────────────────────── сервер ─────────────────────────
function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Max-Age', '600');
  res.setHeader('Vary', 'Origin');
  const origin = String(req.headers.origin || '');
  if (ALLOWED_ORIGINS === null) res.setHeader('Access-Control-Allow-Origin', '*');
  else if (origin && ALLOWED_ORIGINS.has(origin.toLowerCase())) res.setHeader('Access-Control-Allow-Origin', origin);
}

async function onRequest(req, res) {
  applyCors(req, res);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const secure = Boolean(req.socket.encrypted) || (TRUST_PROXY && req.headers['x-forwarded-proto'] === 'https');
  if (secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000');

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (req.method === 'GET' || req.method === 'HEAD') return await serveStatic(req, res, url);
    return fail(res, 405, 'Метод не поддерживается.');
  } catch (e) {
    if (!res.headersSent) fail(res, e.status || 500, e.status ? e.message : 'Ошибка сервера.');
    if (!e.status) console.error(e);
  }
}

const readTls = () => ({ cert: fs.readFileSync(SSL_CERT), key: fs.readFileSync(SSL_KEY) });
const useTls = Boolean(SSL_CERT && SSL_KEY);
const server = useTls ? https.createServer(readTls(), onRequest) : http.createServer(onRequest);

if (useTls) { // Let's Encrypt обновляет сертификат раз в ~60 дней — подхватываем его без перезапуска
  setInterval(() => {
    try { server.setSecureContext(readTls()); } catch (e) { console.error('Не удалось перечитать сертификат:', e.message); }
  }, 12 * 3600 * 1000).unref();
}

server.listen(PORT, HOST, () => {
  console.log(`Zib Cinema backend: ${useTls ? 'https' : 'http'}://localhost:${PORT}  (аккаунтов: ${db.accounts.length})`);
  console.log('CORS разрешён для: ' + (ALLOWED_ORIGINS === null ? 'всех (*)' : [...ALLOWED_ORIGINS].join(', ')));
  if (!useTls && !TRUST_PROXY) console.warn('Внимание: HTTPS не настроен (ни SSL_CERT/SSL_KEY, ни TRUST_PROXY=1 за прокси). С https-сайта запросы к нему будут заблокированы.');
  if (GITHUB_ENABLED) {
    console.log(`Сайт раздаётся с GitHub: ${GITHUB_USERNAME}/${GITHUB_REPO}@${GITHUB_BRANCH}${GITHUB_PATH ? '/' + GITHUB_PATH : ''} (кэш ${Math.round(STATIC_CACHE_TTL_MS / 1000)} с)`);
  } else {
    console.log('Сайт раздаётся из локальной папки public/ (чтобы брать с GitHub, задайте GITHUB_USERNAME и GITHUB_REPO)');
    if (GITHUB_USERNAME || GITHUB_REPO) console.warn('Внимание: для GitHub нужны обе переменные — GITHUB_USERNAME и GITHUB_REPO.');
  }
});
