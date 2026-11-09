'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const fs = require('fs'), crypto = require('crypto');
const express = require('express'), nodemailer = require('nodemailer');

const ROOT = path.join(__dirname, '..'), DATA = path.join(__dirname, 'data'), DB = path.join(DATA, 'inquiries.json');
const PORT = +process.env.PORT || 3000;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase(), ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const MAIL_TO = process.env.MAIL_TO || ADMIN_EMAIL;
const ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500').split(',').map(s => s.trim());
const BUDGETS = ['Under $250', '$250 – $500', '$500 – $1,000', '$1,000 – $2,500', '$2,500+', 'Not sure yet'];

fs.mkdirSync(DATA, { recursive: true });
let list = []; try { list = JSON.parse(fs.readFileSync(DB, 'utf8')); } catch (e) {}
const save = () => { fs.writeFileSync(DB + '.tmp', JSON.stringify(list, null, 2)); fs.renameSync(DB + '.tmp', DB); };

const sessions = new Map(); // random token -> expiry (server-side, revocable)
const cookie = (req, n) => { for (const c of (req.headers.cookie || '').split(';')) { const i = c.indexOf('='); if (c.slice(0, i).trim() === n) return c.slice(i + 1).trim(); } return ''; };
const authed = req => { const t = cookie(req, 'adm'), e = sessions.get(t); if (!e) return false; if (e < Date.now()) { sessions.delete(t); return false; } return true; };
const dig = s => crypto.createHash('sha256').update(String(s)).digest();
const same = (a, b) => crypto.timingSafeEqual(dig(a), dig(b));

const hits = new Map();
function limited(key, max, ms) { const n = Date.now(), a = (hits.get(key) || []).filter(t => n - t < ms); a.push(n); hits.set(key, a); return a.length > max; }

const WIN = 15 * 60e3, LOCK = 15 * 60e3, fails = new Map(), wait = ms => new Promise(r => setTimeout(r, ms));
const lockLeft = k => { const f = fails.get(k); return f && f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 1000) : 0; };
function addFail(k, max) { const n = Date.now(); let f = fails.get(k); if (!f || n - f.first > WIN) f = { n: 0, first: n, until: 0 }; if (++f.n >= max) f.until = n + LOCK; fails.set(k, f); return f.n; }
setInterval(() => { const n = Date.now(); sessions.forEach((e, t) => e < n && sessions.delete(t)); fails.forEach((f, k) => n - f.first > WIN && f.until < n && fails.delete(k)); hits.forEach((a, k) => a.every(t => n - t > 36e5) && hits.delete(k)); }, 600e3).unref();

const app = express();
if (process.env.TRUST_PROXY) app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => { res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' }); if (req.secure) res.set('Strict-Transport-Security', 'max-age=31536000'); next(); });
app.use(express.json({ limit: '20kb' }));

// public: inquiry form
app.use('/api/inquiries', (req, res, next) => {
  const o = req.headers.origin;
  if (o && ORIGINS.includes(o)) res.set({ 'Access-Control-Allow-Origin': o, Vary: 'Origin', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  req.method === 'OPTIONS' ? res.sendStatus(204) : next();
});
const mailer = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS ? nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: +process.env.SMTP_PORT || 465, secure: (+process.env.SMTP_PORT || 465) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }) : null;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

app.post('/api/inquiries', async (req, res) => {
  const b = req.body || {}, t = (k, n) => String(b[k] == null ? '' : b[k]).trim().slice(0, n);
  if (b.website) return res.json({ ok: true }); // honeypot
  if (limited('inq:' + req.ip, 5, 3600e3)) return res.status(429).json({ error: 'Too many inquiries. Please try again later.' });
  const q = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'new', name: t('name', 100), email: t('email', 200), company: t('company', 150),
    project: t('project', 200), budget: BUDGETS.includes(b.budget) ? b.budget : '', timeline: t('timeline', 100), details: t('details', 5000) };
  if (!q.name || !q.project || q.details.length < 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.email)) return res.status(400).json({ error: 'Please fill in all required fields correctly.' });
  list.push(q); save();
  if (mailer) {
    const rows = [['Name', q.name], ['Email', q.email], ['Company', q.company], ['Project', q.project], ['Budget', q.budget], ['Timeline', q.timeline], ['Details', q.details]].filter(r => r[1]);
    mailer.sendMail({ from: `"Portfolio Inquiry" <${process.env.SMTP_USER}>`, to: MAIL_TO, replyTo: q.email, subject: ('New inquiry: ' + q.project).replace(/[\r\n]+/g, ' '),
      text: rows.map(r => r[0] + ': ' + r[1]).join('\n'),
      html: '<table cellpadding="6">' + rows.map(r => `<tr><td><b>${r[0]}</b></td><td style="white-space:pre-wrap">${esc(r[1])}</td></tr>`).join('') + '</table>' })
      .catch(e => console.error('Email failed:', e.message));
  }
  res.json({ ok: true });
});

// admin API
const origin = (req, res, next) => { const o = req.headers.origin; try { if (o && new URL(o).host !== req.headers.host) return res.status(403).json({ error: 'Forbidden' }); } catch (e) { return res.status(403).json({ error: 'Forbidden' }); } next(); };
const guard = (req, res, next) => authed(req) ? next() : res.status(401).json({ error: 'Unauthorized' });
app.post('/api/admin/login', origin, async (req, res) => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return res.status(503).json({ error: 'Admin is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env' });
  const body = req.body || {}, email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 200) : '', pw = typeof body.password === 'string' ? body.password.slice(0, 200) : '';
  const ipK = 'ip:' + req.ip, emK = 'em:' + dig(email).toString('hex').slice(0, 16);
  const left = Math.max(lockLeft(ipK), lockLeft(emK));
  if (left) return res.set('Retry-After', left).status(429).json({ error: `Too many failed attempts. Try again in ${Math.ceil(left / 60)} min.`, retryAfter: left });
  if (!(same(email, ADMIN_EMAIL) & same(pw, ADMIN_PASSWORD))) {
    const n = addFail(ipK, 5); addFail(emK, 20);
    await wait(500 + Math.min(n, 5) * 300 + Math.random() * 200); // slow down guessing
    return res.status(401).json({ error: n >= 5 ? 'Too many failed attempts. Locked for 15 minutes.' : 'Invalid email or password.' });
  }
  fails.delete(ipK); fails.delete(emK);
  const token = crypto.randomBytes(32).toString('hex'), age = body.remember ? 30 * 864e5 : 12 * 36e5;
  if (sessions.size > 50) sessions.clear();
  sessions.set(token, Date.now() + age);
  res.set('Set-Cookie', `adm=${token}; HttpOnly; SameSite=Strict; Path=/${body.remember ? '; Max-Age=' + age / 1000 : ''}${req.secure ? '; Secure' : ''}`);
  res.json({ ok: true });
});
app.post('/api/admin/logout', origin, (req, res) => { sessions.delete(cookie(req, 'adm')); res.set('Set-Cookie', 'adm=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); res.json({ ok: true }); });
app.get('/api/admin/inquiries', guard, (req, res) => res.set('Cache-Control', 'no-store').json(list.slice().reverse()));
app.patch('/api/admin/inquiries/:id', origin, guard, (req, res) => {
  const q = list.find(x => x.id === req.params.id); if (!q) return res.sendStatus(404);
  q.status = req.body && req.body.status === 'read' ? 'read' : 'new'; save(); res.json(q);
});
app.delete('/api/admin/inquiries/:id', origin, guard, (req, res) => {
  const i = list.findIndex(x => x.id === req.params.id); if (i < 0) return res.sendStatus(404);
  list.splice(i, 1); save(); res.json({ ok: true });
});

// pages
app.use(['/admin', '/admin.html', '/login', '/admin-login.html'], (req, res, next) => { res.set({ 'X-Frame-Options': 'DENY', 'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'" }); next(); });
app.get(['/admin', '/admin.html'], (req, res) => authed(req) ? res.set('Cache-Control', 'no-store').sendFile(path.join(ROOT, 'admin.html')) : res.redirect('/admin-login.html'));
app.get(['/login', '/admin-login.html'], (req, res) => authed(req) ? res.redirect('/admin') : res.sendFile(path.join(ROOT, 'admin-login.html')));
app.use((req, res, next) => /^\/(backend|node_modules|data)(\/|$)|\/\./i.test(req.path) ? res.sendStatus(404) : next());
// /page.html -> /page (301), /index.html -> /
app.get(/^\/(.+?)\.html$/i, (req, res, next) => {
  const name = req.params[0];
  if (name === 'admin' || name === 'admin-login') return next();
  const i = req.url.indexOf('?'), q = i < 0 ? '' : req.url.slice(i);
  res.redirect(301, (name.toLowerCase() === 'index' ? '/' : '/' + name) + q);
});
app.use(express.static(ROOT, { extensions: ['html'], dotfiles: 'deny' }));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: 'Bad request' }));

app.listen(PORT, () => {
  console.log(`Site:  http://localhost:${PORT}\nAdmin: http://localhost:${PORT}/admin`);
  if (!ADMIN_PASSWORD) console.warn('! ADMIN_EMAIL / ADMIN_PASSWORD not set — admin login disabled');
  if (!mailer) console.warn('! SMTP not set — inquiries are saved but no email is sent');
});
