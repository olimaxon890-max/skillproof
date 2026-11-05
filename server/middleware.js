// Autentifikatsiya (JWT) va rollar bo'yicha ruxsat
const jwt = require('jsonwebtoken');
const { get } = require('./db');

const SECRET = process.env.JWT_SECRET || 'skillproof-dev-secret-ozgartiring';
const sign = (user) => jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '7d' });

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Tizimga kirish talab etiladi' });
  try {
    const p = jwt.verify(token, SECRET);
    // Har bir so'rovda foydalanuvchi holati bazadan tekshiriladi (bloklangan bo'lsa kirish yopiladi)
    const u = get('SELECT id, email, role, status, company_id, first_name, last_name FROM users WHERE id=?', p.id);
    if (!u) return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });
    if (u.status === 'blocked') return res.status(403).json({ error: 'Hisobingiz bloklangan' });
    req.user = u;
    next();
  } catch {
    res.status(401).json({ error: 'Sessiya muddati tugagan, qayta kiring' });
  }
}

const role = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Bu amal uchun ruxsatingiz yo\'q' });

// Kompaniya foydalanuvchisi: tenant (company_id) har doim tokendan olinadi, so'rovdan emas
function tenant(req, res, next) {
  const c = get('SELECT * FROM companies WHERE id=?', req.user.company_id);
  if (!c) return res.status(403).json({ error: 'Kompaniya topilmadi' });
  if (c.status === 'blocked') return res.status(403).json({ error: 'Kompaniyangiz bloklangan' });
  req.company = c;
  next();
}

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { sign, auth, role, tenant, wrap, SECRET };

