// Autentifikatsiya: ro'yxatdan o'tish, kirish, joriy foydalanuvchi
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { get, run, tx, log } = require('../db');
const { sign, auth, wrap } = require('../middleware');

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'kompaniya';
const publicUser = (u) => ({ id: u.id, email: u.email, role: u.role, first_name: u.first_name, last_name: u.last_name, company_id: u.company_id });

router.post('/register', wrap((req, res) => {
  const { email, password, role = 'candidate', first_name = '', last_name = '', company_name, industry = '' } = req.body || {};
  if (!emailRe.test(email || '')) return res.status(400).json({ error: "Email manzili noto'g'ri" });
  if (!password || password.length < 8) return res.status(400).json({ error: "Parol kamida 8 ta belgidan iborat bo'lishi kerak" });
  if (!['candidate', 'company'].includes(role)) return res.status(400).json({ error: "Noto'g'ri rol" });
  if (!first_name.trim()) return res.status(400).json({ error: 'Ismingizni kiriting' });
  if (role === 'company' && !(company_name || '').trim()) return res.status(400).json({ error: 'Kompaniya nomini kiriting' });
  if (get('SELECT id FROM users WHERE email=?', email.toLowerCase())) return res.status(409).json({ error: "Bu email allaqachon ro'yxatdan o'tgan" });

  const hash = bcrypt.hashSync(password, 10);
  const user = tx(() => {
    let companyId = null;
    if (role === 'company') {
      let slug = slugify(company_name), n = 1;
      while (get('SELECT id FROM companies WHERE slug=?', slug)) slug = slugify(company_name) + '-' + ++n;
      companyId = run('INSERT INTO companies (name, slug, industry, status) VALUES (?,?,?,?)', company_name.trim(), slug, industry, 'pending').id;
    }
    const id = run('INSERT INTO users (email, password_hash, role, first_name, last_name, company_id) VALUES (?,?,?,?,?,?)',
      email.toLowerCase(), hash, role, first_name.trim(), last_name.trim(), companyId).id;
    log(id, 'register', role === 'company' ? `Kompaniya: ${company_name}` : 'Nomzod');
    return get('SELECT * FROM users WHERE id=?', id);
  });
  res.status(201).json({ token: sign(user), user: publicUser(user) });
}));

router.post('/login', wrap((req, res) => {
  const { email = '', password = '' } = req.body || {};
  const u = get('SELECT * FROM users WHERE email=?', String(email).toLowerCase());
  if (!u || !bcrypt.compareSync(String(password), u.password_hash)) return res.status(401).json({ error: "Email yoki parol noto'g'ri" });
  if (u.status === 'blocked') return res.status(403).json({ error: 'Hisobingiz bloklangan' });
  log(u.id, 'login');
  res.json({ token: sign(u), user: publicUser(u) });
}));

router.get('/me', auth, wrap((req, res) => {
  const u = get('SELECT * FROM users WHERE id=?', req.user.id);
  const company = u.company_id ? get('SELECT id, name, status, logo FROM companies WHERE id=?', u.company_id) : null;
  res.json({ user: publicUser(u), company });
}));

module.exports = router;

