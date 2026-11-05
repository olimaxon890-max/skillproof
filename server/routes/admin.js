// Super Admin API
const router = require('express').Router();
const { all, get, run, log } = require('../db');
const { auth, role, wrap } = require('../middleware');

router.use(auth, role('admin'));
const s = (v, n = 120) => String(v ?? '').trim().slice(0, n);

router.get('/stats', wrap((req, res) => {
  const n = (sql) => get(sql).n;
  const days = all(`SELECT substr(created_at,1,10) AS day, COUNT(*) AS n FROM users WHERE created_at >= date('now','-13 day') GROUP BY day ORDER BY day`);
  const attemptsByDay = all(`SELECT substr(finished_at,1,10) AS day, COUNT(*) AS n FROM attempts WHERE status='done' AND finished_at >= date('now','-13 day') GROUP BY day ORDER BY day`);
  res.json({
    users: n("SELECT COUNT(*) n FROM users WHERE role='candidate'"),
    companies: n('SELECT COUNT(*) n FROM companies'),
    pending: n("SELECT COUNT(*) n FROM companies WHERE status='pending'"),
    blocked: n("SELECT COUNT(*) n FROM companies WHERE status='blocked'"),
    jobs: n('SELECT COUNT(*) n FROM jobs'),
    questions: n('SELECT COUNT(*) n FROM questions'),
    tests: n("SELECT COUNT(*) n FROM attempts WHERE status='done'"),
    avgScore: Math.round(get("SELECT AVG(total_score) v FROM attempts WHERE status='done'").v || 0),
    byCategory: all(`SELECT c.name, COUNT(j.id) AS n FROM categories c LEFT JOIN jobs j ON j.category_id=c.id GROUP BY c.id ORDER BY n DESC`),
    days, attemptsByDay,
    activity: all(`SELECT a.action, a.details, a.created_at, u.email FROM activity a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 15`),
  });
}));

router.get('/companies', wrap((req, res) => res.json(all(`SELECT c.*, (SELECT COUNT(*) FROM jobs WHERE company_id=c.id) AS jobs,
  (SELECT COUNT(*) FROM attempts WHERE company_id=c.id AND status='done') AS tests, (SELECT email FROM users WHERE company_id=c.id LIMIT 1) AS owner_email
  FROM companies c ORDER BY c.id DESC`).map((c) => ({ ...c, logo: c.logo && c.logo.length < 300 ? c.logo : '' })))));

router.put('/companies/:id/status', wrap((req, res) => {
  const st = req.body?.status;
  if (!['approved', 'pending', 'blocked'].includes(st)) return res.status(400).json({ error: "Noto'g'ri holat" });
  const r = run('UPDATE companies SET status=? WHERE id=?', st, req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Kompaniya topilmadi' });
  log(req.user.id, 'company_status', `Kompaniya #${req.params.id}: ${st}`);
  res.json({ ok: true });
}));

router.get('/users', wrap((req, res) => res.json(all(`SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.status, u.created_at, c.name AS company_name
  FROM users u LEFT JOIN companies c ON c.id=u.company_id ORDER BY u.id DESC`))));

router.put('/users/:id/status', wrap((req, res) => {
  const st = req.body?.status;
  if (!['active', 'blocked'].includes(st)) return res.status(400).json({ error: "Noto'g'ri holat" });
  const u = get('SELECT role FROM users WHERE id=?', req.params.id);
  if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  if (u.role === 'admin') return res.status(400).json({ error: 'Adminni bloklab bo\'lmaydi' });
  run('UPDATE users SET status=? WHERE id=?', st, req.params.id);
  log(req.user.id, 'user_status', `Foydalanuvchi #${req.params.id}: ${st}`);
  res.json({ ok: true });
}));

// Kategoriyalar (kasblar)
router.post('/categories', wrap((req, res) => {
  const name = s(req.body?.name); if (!name) return res.status(400).json({ error: 'Nom kiriting' });
  try { res.status(201).json({ id: run('INSERT INTO categories (name, icon, description) VALUES (?,?,?)', name, s(req.body.icon, 40) || 'bi-briefcase', s(req.body.description, 300)).id }); }
  catch { res.status(409).json({ error: 'Bunday kategoriya mavjud' }); }
}));
router.put('/categories/:id', wrap((req, res) => {
  const name = s(req.body?.name); if (!name) return res.status(400).json({ error: 'Nom kiriting' });
  try { run('UPDATE categories SET name=?, icon=COALESCE(NULLIF(?,\'\'),icon), description=? WHERE id=?', name, s(req.body.icon, 40), s(req.body.description, 300), req.params.id); res.json({ ok: true }); }
  catch { res.status(409).json({ error: 'Bunday kategoriya mavjud' }); }
}));
router.delete('/categories/:id', wrap((req, res) => { run('DELETE FROM categories WHERE id=?', req.params.id); res.json({ ok: true }); }));

// Texnologiyalar
router.post('/technologies', wrap((req, res) => {
  const name = s(req.body?.name); if (!name) return res.status(400).json({ error: 'Nom kiriting' });
  try { res.status(201).json({ id: run('INSERT INTO technologies (name, category_id) VALUES (?,?)', name, Number(req.body.category_id) || null).id }); }
  catch { res.status(409).json({ error: 'Bunday texnologiya mavjud' }); }
}));
router.put('/technologies/:id', wrap((req, res) => {
  const name = s(req.body?.name); if (!name) return res.status(400).json({ error: 'Nom kiriting' });
  try { run('UPDATE technologies SET name=?, category_id=? WHERE id=?', name, Number(req.body.category_id) || null, req.params.id); res.json({ ok: true }); }
  catch { res.status(409).json({ error: 'Bunday texnologiya mavjud' }); }
}));
router.delete('/technologies/:id', wrap((req, res) => { run('DELETE FROM technologies WHERE id=?', req.params.id); res.json({ ok: true }); }));

module.exports = router;

