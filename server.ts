import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// 🔒 Безопасность: НИКОГДА не логируем API-ключ (даже его часть)
console.log('🔑 API KEY loaded:', process.env.GEMINI_API_KEY ? '✅ найден' : '❌ НЕ НАЙДЕН');
console.log('🔑 APP_PASSWORD:', process.env.APP_PASSWORD ? '✅ настроен' : '⚠️ НЕ настроен — вход будет невозможен');


const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.disable('x-powered-by');
// Корректный IP за обратным прокси (Cloud Run, nginx) — нужно для rate-limit
app.set('trust proxy', 1);

// 🔒 Ограничение размера тела запроса (защита от DoS)
app.use(express.json({ limit: '1mb' }));

// 🔒 Security-заголовки + CSP + HSTS + Permissions-Policy
const IS_PROD = process.env.NODE_ENV === 'production';

const isHttpsRequest = (req: express.Request) =>
req.secure || String(req.headers['x-forwarded-proto'] || '').toLowerCase().includes('https');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');

  // CSP: разрешаем только свои скрипты, Google Fonts и data:/blob: для PDF-экспорта.
  // В dev-режиме добавляем ws:/wss: для Vite HMR (WebSocket).
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    `connect-src 'self'${IS_PROD ? '' : ' ws: wss:'}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    IS_PROD && isHttpsRequest(req) ? 'upgrade-insecure-requests' : '',
  ]
    .filter(Boolean)
    .join('; ');

  res.setHeader('Content-Security-Policy', cspDirectives);
  if (isHttpsRequest(req)) {
res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// =====================================================
// 🔒 Rate limiting (in-memory, без внешних зависимостей)
// =====================================================
const rateBuckets = new Map<string, number[]>();

setInterval(() => {
const now = Date.now();
for (const [key, hits] of rateBuckets.entries()) {
const fresh = hits.filter((t) => now - t < 60_000);
if (fresh.length === 0) rateBuckets.delete(key);
else rateBuckets.set(key, fresh);
}
}, 60_000).unref();

const rateLimit = (maxPerMinute: number) => {
return (req: express.Request, res: express.Response, next: express.NextFunction) => {
const key = req.ip || 'unknown';
const now = Date.now();
const hits = (rateBuckets.get(key) || []).filter((t) => now - t < 60_000);
if (hits.length >= maxPerMinute) {
return res
.status(429)
.json({ success: false, error: 'Слишком много запросов. Попробуйте через минуту.' });
}
hits.push(now);
rateBuckets.set(key, hits);
next();
};
};

// =====================================================
// 🔒 Сессии: клиент получает токен, пароль никогда
//    не хранится и не проверяется в браузере
// =====================================================
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 часов
const sessions = new Map<string, { createdAt: number; expiresAt: number }>();

// Периодическая очистка истёкших сессий
setInterval(() => {
  const now = Date.now();
  for (const [token, s] of sessions.entries()) {
    if (s.expiresAt < now) sessions.delete(token);
  }
}, 5 * 60_000).unref();

// =====================================================
// 🔒 Блокировка после 5 неудачных попыток входа
// =====================================================
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // блокировка на 5 минут

// Периодическая очистка устаревших записей о попытках
setInterval(() => {
  const now = Date.now();
  for (const [ip, info] of loginAttempts.entries()) {
    if (info.lockedUntil !== 0 && info.lockedUntil < now) {
      loginAttempts.delete(ip);
    }
  }
}, 60_000).unref();

// Сравнение строк без утечки по времени И без утечки длины.
// Хешируем обе строки в SHA-256 (всегда 32 байта) → timingSafeEqual
// выполняется за константное время независимо от длины исходных паролей.
const safeEqual = (a: string, b: string): boolean => {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
};
// 🔒 Имя httpOnly cookie, в которой живёт токен сессии
const SESSION_COOKIE_NAME = 'session_token';

// Минимальный парсер cookie без внешних зависимостей
const parseCookies = (req: express.Request): Record<string, string> => {
  const header = req.headers.cookie;
  const result: Record<string, string> = {};
  if (!header) return result;
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) return;
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
  });
  return result;
};

const extractToken = (req: express.Request): string => {
  // Токен теперь живёт в httpOnly cookie — недоступен из JS.
  return parseCookies(req)[SESSION_COOKIE_NAME] || '';
};

// Middleware: требует валидный токен сессии
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
const token = extractToken(req);
const session = token ? sessions.get(token) : undefined;
if (!token || !session || session.expiresAt < Date.now()) {
if (token) sessions.delete(token);
return res.status(401).json({ success: false, error: 'Требуется авторизация' });
}
next();
};

// =====================================================
// Auth API
// =====================================================
app.post('/api/auth', rateLimit(10), (req, res) => {
  const ip = req.ip || 'unknown';
  const attemptInfo = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  const now = Date.now();

  // 🔒 Если IP заблокирован — не проверяем пароль вообще
  if (attemptInfo.lockedUntil > now) {
    const remainingSec = Math.ceil((attemptInfo.lockedUntil - now) / 1000);
    return res.status(423).json({
      success: false,
      error: `Слишком много неудачных попыток. Попробуйте через ${remainingSec} сек.`,
    });
  }

  const { password } = req.body || {};
  const validPassword = process.env.APP_PASSWORD;

  if (!validPassword) {
    return res.status(500).json({ success: false, error: 'APP_PASSWORD не настроен на сервере' });
  }

  if (typeof password !== 'string' || !safeEqual(password, validPassword)) {
    // 🔒 Неудачная попытка → увеличиваем счётчик
    const newCount = attemptInfo.count + 1;
    if (newCount >= MAX_LOGIN_ATTEMPTS) {
      loginAttempts.set(ip, { count: 0, lockedUntil: now + LOCKOUT_MS });
      return res.status(423).json({
        success: false,
        error: 'Слишком много неудачных попыток. Вход заблокирован на 5 минут.',
      });
    }
    loginAttempts.set(ip, { count: newCount, lockedUntil: 0 });
    const remaining = MAX_LOGIN_ATTEMPTS - newCount;
    return res.status(401).json({
      success: false,
      error: `Неверный пароль. Осталось попыток: ${remaining}`,
    });
  }

  // ✅ Успешный вход → сбрасываем счётчик попыток
  loginAttempts.set(ip, { count: 0, lockedUntil: 0 });

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { createdAt: Date.now(), expiresAt: Date.now() + SESSION_TTL_MS });

  // 🔒 Токен уходит ТОЛЬКО в httpOnly cookie — JS его не увидит.
  // В тело ответа токен НЕ кладём.
  const cookieParts = [
    `${SESSION_COOKIE_NAME}=${token}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Strict',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (IS_PROD && isHttpsRequest(req)) cookieParts.push('Secure'); // Secure только на HTTPS
  res.setHeader('Set-Cookie', cookieParts.join('; '));

  res.json({ success: true, expiresInHours: 12 });
});

app.post('/api/logout', (req, res) => {
  sessions.delete(extractToken(req));
  // 🔒 Удаляем cookie, устанавливая Max-Age=0
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`
  );
  res.json({ success: true });
});

// Health API (публичный, не содержит чувствительных данных)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', hasGemini: !!process.env.GEMINI_API_KEY });
});

// 🔒 Проверка активности сессии: клиент при загрузке узнаёт,
// авторизован ли он (по httpOnly cookie), не храня токен в JS.
app.get('/api/session-check', requireAuth, (_req, res) => {
  res.json({ success: true });
});

// =====================================================
// Content Database JSON file
// =====================================================
const DB_FILE_PATH = path.join(process.cwd(), 'data', 'content-db.json');
if (!fs.existsSync(path.dirname(DB_FILE_PATH))) {
fs.mkdirSync(path.dirname(DB_FILE_PATH), { recursive: true });
}

// =====================================================
// 🧼 Валидация и очистка данных контент-плана
// =====================================================
const VALID_TAGS = new Set(['email', 'telegram', 'social', 'article', 'video', 'reels']);
const VALID_CONFERENCES = new Set(['AD', 'SQA', 'TWD']);
const VALID_STATUSES = new Set(['idea', 'in_progress', 'scheduled', 'published']);
const VALID_SEASONS = new Set(['winter', 'spring', 'summer', 'autumn']);

const str = (v: unknown, maxLen: number, fallback = ''): string =>
typeof v === 'string' ? v.slice(0, maxLen) : fallback;

const strArray = (v: unknown, maxItems: number, maxLen: number): string[] =>
Array.isArray(v) ? v.slice(0, maxItems).map((x) => str(x, maxLen)).filter(Boolean) : [];

function sanitizePostItem(raw: any) {
if (!raw || typeof raw !== 'object') return null;
let tags: string[] = [];
if (Array.isArray(raw.tags)) {
tags = raw.tags.filter((t: any) => VALID_TAGS.has(t));
}
if (tags.length === 0 && VALID_TAGS.has(raw.tag)) {
tags = [raw.tag];
}
if (tags.length === 0) {
tags = ['social'];
}
const conference = VALID_CONFERENCES.has(raw.conference) ? raw.conference : 'AD';
const status = VALID_STATUSES.has(raw.status) ? raw.status : 'scheduled';
const day = Number.isFinite(raw.day) ? Math.min(Math.max(Math.trunc(raw.day), 1), 31) : 1;
return {
id: str(raw.id, 64, `post-${crypto.randomUUID()}`),
title: str(raw.title, 200, 'Без названия'),
tags,
tag: tags[0],
conference,
day,
time: str(raw.time, 10, '12:00'),
status,
description: str(raw.description, 2000),
contentText: raw.contentText !== undefined ? str(raw.contentText, 10000) : undefined,
hashtags: raw.hashtags !== undefined ? strArray(raw.hashtags, 20, 60) : undefined,
bestPostingTime: raw.bestPostingTime !== undefined ? str(raw.bestPostingTime, 20) : undefined,
callToAction: raw.callToAction !== undefined ? str(raw.callToAction, 500) : undefined,
};
}

function sanitizeMonthsPayload(payload: unknown): any[] | null {
const arr = Array.isArray(payload)
? payload
: payload && typeof payload === 'object' && Array.isArray((payload as any).data)
? (payload as any).data
: null;
if (!Array.isArray(arr) || arr.length === 0 || arr.length > 24) return null;

const cleaned: any[] = [];
for (const m of arr) {
if (!m || typeof m !== 'object') return null;
const items = Array.isArray(m.items) ? m.items.slice(0, 500) : [];
const cleanItems: any[] = [];
for (const it of items) {
const clean = sanitizePostItem(it);
if (clean) cleanItems.push(clean);
}
cleaned.push({
  index: Number.isFinite(m.index) ? Math.min(Math.max(Math.trunc(m.index), 0), 11) : 0,
  year: Number.isFinite(m.year) ? Math.min(Math.max(Math.trunc(m.year), 2020), 2100) : 2026,
  name: str(m.name, 50, 'Месяц'),
  shortName: str(m.shortName, 10, 'МЕС'),
  season: VALID_SEASONS.has(m.season) ? m.season : 'winter',
  focusTopic: str(m.focusTopic, 300),
  goal: str(m.goal, 300),
  items: cleanItems,
});
}
return cleaned;
}

// =====================================================
// Content DB API (🔒 только с токеном)
// =====================================================
app.get('/api/content-db', requireAuth, rateLimit(120), (_req, res) => {
try {
if (fs.existsSync(DB_FILE_PATH)) {
const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
const parsed = JSON.parse(raw);
const monthsData = Array.isArray(parsed)
? parsed
: parsed && Array.isArray(parsed.data)
? parsed.data
: null;
return res.json({ success: true, data: monthsData });
}
res.json({ success: true, data: null });
} catch (error: any) {
console.error('Error reading DB file:', error);
res.status(500).json({ success: false, error: 'Failed to read content DB' });
}
});

app.post('/api/content-db', requireAuth, rateLimit(60), (req, res) => {
// Валидация структуры и длины всех полей перед записью на диск
const cleaned = sanitizeMonthsPayload(req.body);
if (!cleaned) {
return res.status(400).json({ success: false, error: 'Некорректный формат данных' });
}
try {
fs.writeFileSync(DB_FILE_PATH, JSON.stringify(cleaned, null, 2), 'utf-8');
res.json({ success: true, timestamp: new Date().toISOString() });
} catch (error: any) {
console.error('Error writing DB file:', error);
res.status(500).json({ success: false, error: 'Failed to save content DB' });
}
});

// =====================================================
// Gemini Client
// =====================================================
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
ai = new GoogleGenAI({ apiKey });
}

// =====================================================
// AI Generate Modular Post Suggestions (🔒 + лимиты)
// =====================================================
app.post('/api/generate-suggestions', requireAuth, rateLimit(20), async (req, res) => {
try {
if (!ai) {
return res.status(500).json({ error: 'Gemini API key is not configured' });
}
const { monthsSummary, targetConference, targetMonth, customPrompt, postCount } = req.body || {};
// 🔒 Обрезаем пользовательский ввод перед вставкой в промпт
const safeSummary = str(monthsSummary, 2000);
const safeConf = str(targetConference, 100);
const safePrompt = str(customPrompt, 1000);
const count = typeof postCount === 'number' && postCount > 0 ? Math.min(postCount, 100) : 6;

const prompt = `Ты — ведущий ИИ-контент-стратег ИТ-конференций Analyst Days (AD), SQA Days (SQA) и TechWriter Days (TWD).
Проанализируй текущий план и предложи РОВНО ${count} идей публикаций.
ВАЖНО: ${count} — это ОБЩЕЕ количество постов на все конференции и месяцы вместе, а не на каждую отдельно.
Если запрошено 6 постов — верни ровно 6 постов суммарно. Не 6 на месяц, не 6 на конференцию.
Если запрошено 36 постов — распредели по 3 поста на каждую из 3 конференций (AD, SQA, TWD) в каждом из 12 месяцев.
Контекст текущего плана:
${safeSummary || 'Контент-план публикаций ИТ-конференций на 2026 год'}
Настройки запроса:
- Целевая конференция: ${safeConf || 'Все три: AD, SQA, TWD'}
- Целевой месяц: ${targetMonth !== undefined && targetMonth !== null && targetMonth !== '' ? targetMonth : 'Распредели по всем 12 месяцам равномерно'}
- Пожелания пользователя: ${safePrompt || 'Предложи актуальные посты для поддержания баланса каналов и привлечения аудитории'}
Сформируй РОВНО ${count} уникальных предложений публикаций с указанием:
- title: четкий заголовок поста
- conference: строго 'AD', 'SQA' или 'TWD'
- tag: строго 'email', 'telegram', 'social', 'article', 'video', или 'reels'
- monthIndex: число от 0 (Январь) до 11 (Декабрь)
- day: число от 1 до 28
- description: краткое содержание поста
- reason: понятное обоснование ИИ, почему этот пост рекомендуем`;

const response = await ai.models.generateContent({
model: 'gemini-3.6-flash',
contents: prompt,
config: {
responseMimeType: 'application/json',
responseSchema: {
type: Type.OBJECT,
properties: {
suggestions: {
type: Type.ARRAY,
items: {
type: Type.OBJECT,
properties: {
title: { type: Type.STRING },
conference: { type: Type.STRING },
tag: { type: Type.STRING },
monthIndex: { type: Type.INTEGER },
day: { type: Type.INTEGER },
description: { type: Type.STRING },
reason: { type: Type.STRING },
},
required: ['title', 'conference', 'tag', 'monthIndex', 'day', 'description', 'reason'],
},
},
},
required: ['suggestions'],
},
},
});
const jsonText = response.text || '{}';
const parsed = JSON.parse(jsonText);
res.json({ success: true, suggestions: parsed.suggestions || [] });
} catch (error: any) {
console.error('Error generating suggestions:', error);
res.status(500).json({ error: error.message || 'Failed to generate suggestions' });
}
});

// =====================================================
// AI Generate 12-Month Strategy (🔒 + лимиты)
// =====================================================
app.post('/api/generate-strategy', requireAuth, rateLimit(20), async (req, res) => {
try {
if (!ai) {
return res.status(500).json({ error: 'Gemini API key is not configured' });
}
const { niche, goal, targetAudience } = req.body || {};
const safeNiche = str(niche, 300);
const safeGoal = str(goal, 300);
const safeAudience = str(targetAudience, 300);

const prompt = `Ты — ведущий контент-стратег ИТ-конференций AnalytixDay (AD), SQA Days (SQA) и TechWeb Days (TWD).
Создай годовую контент-стратегию на 12 месяцев для направления: "${safeNiche || 'ИТ-конференции AD, SQA, TWD'}".
Цель: "${safeGoal || 'Привлечение спикеров, участников и продажи билетов'}".
Целевая аудитория: "${safeAudience || 'QA инженеры, системные аналитики, веб-разработчики и тимлиды'}".
Для каждого из 12 месяцев (от Января до Декабря) предложи ключевую тему месяца, главную цель и 3-5 публикаций с указанием:
- title (название/тема поста)
- tag: строго одно из значений: ["email", "telegram", "social", "article", "video", "reels"]
- conference: строго одно из значений: ["AD", "SQA", "TWD"]
- day: число от 1 до 28
- description: краткое описание заметки`;

const response = await ai.models.generateContent({
model: 'gemini-3.6-flash',
contents: prompt,
config: {
responseMimeType: 'application/json',
responseSchema: {
type: Type.OBJECT,
properties: {
strategyTitle: { type: Type.STRING },
overview: { type: Type.STRING },
months: {
type: Type.ARRAY,
items: {
type: Type.OBJECT,
properties: {
monthIndex: { type: Type.INTEGER, description: '0 for January to 11 for December' },
monthName: { type: Type.STRING },
focusTopic: { type: Type.STRING },
goal: { type: Type.STRING },
items: {
type: Type.ARRAY,
items: {
type: Type.OBJECT,
properties: {
title: { type: Type.STRING },
tag: { type: Type.STRING },
conference: { type: Type.STRING },
day: { type: Type.INTEGER },
description: { type: Type.STRING },
},
required: ['title', 'tag', 'conference', 'day', 'description']
}
}
},
required: ['monthIndex', 'monthName', 'focusTopic', 'items']
}
}
},
required: ['strategyTitle', 'months']
}
}
});
const jsonText = response.text || '{}';
const parsed = JSON.parse(jsonText);
res.json({ success: true, data: parsed });
} catch (error: any) {
console.error('Error generating strategy:', error);
res.status(500).json({ error: error.message || 'Failed to generate strategy' });
}
});

// =====================================================
// AI Generate Individual Post Detail (🔒 + лимиты)
// =====================================================
app.post('/api/generate-post', requireAuth, rateLimit(20), async (req, res) => {
try {
if (!ai) {
return res.status(500).json({ error: 'Gemini API key is not configured' });
}
const { topic, tag, conference, monthName } = req.body || {};
const safeTopic = str(topic, 300);
const safeTag = str(tag, 50);
const safeConf = str(conference, 50);
const safeMonth = str(monthName, 50);

const prompt = `Напиши готовый контент-план и черновик поста для ИТ-конференции ${safeConf || 'SQA/AD/TWD'}.
Тема: "${safeTopic}"
Формат/Канал: "${safeTag}"
Конференция: "${safeConf || 'Общая'}"
Месяц: "${safeMonth}"
Ответь в формате JSON:
- headline: яркий заголовок
- contentText: готовый текст/сценарий
- callToAction: призыв к действию (купить билет, подать доклад, подписаться)
- hashtags: массив хэштегов
- bestPostingTime: лучшее время для публикации (например "11:00")
- contentTips: 2-3 совета по оформлению или подаче`;

const response = await ai.models.generateContent({
model: 'gemini-3.6-flash',
contents: prompt,
config: {
responseMimeType: 'application/json',
responseSchema: {
type: Type.OBJECT,
properties: {
headline: { type: Type.STRING },
contentText: { type: Type.STRING },
callToAction: { type: Type.STRING },
hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
bestPostingTime: { type: Type.STRING },
contentTips: { type: Type.ARRAY, items: { type: Type.STRING } }
},
required: ['headline', 'contentText', 'callToAction', 'hashtags']
}
}
});
const parsed = JSON.parse(response.text || '{}');
res.json({ success: true, data: parsed });
} catch (error: any) {
console.error('Error generating post:', error);
res.status(500).json({ error: error.message || 'Failed to generate post' });
}
});

// Неизвестные /api маршруты
app.use('/api', (_req, res) => {
res.status(404).json({ success: false, error: 'Not found' });
});

// =====================================================
// Vite Development or Production Static Handlers
// =====================================================
async function startServer() {
if (process.env.NODE_ENV !== 'production') {
const { createServer: createViteServer } = await import('vite');
const vite = await createViteServer({
server: { middlewareMode: true },
appType: 'spa',
});
app.use(vite.middlewares);
} else {
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
res.sendFile(path.join(distPath, 'index.html'));
});
}
app.listen(PORT, '0.0.0.0', () => {
console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
}

startServer();