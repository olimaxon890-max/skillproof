// Ommaviy (autentifikatsiyasiz) ma'lumotlar: kompaniyalar, ish o'rinlari, kategoriyalar, statistika
const router = require('express').Router();
const { all, get } = require('../db');
const { wrap } = require('../middleware');
const sandbox = require('../sandbox');

const COMPANY_COLS = 'c.id, c.name, c.slug, c.logo, c.description, c.industry, c.website, c.city, c.size';
const like = (q) => `%${String(q).replace(/[%_]/g, '')}%`;

router.get('/stats', wrap((req, res) => {
  res.json({
    companies: get("SELECT COUNT(*) n FROM companies WHERE status='approved'").n,
    jobs: get("SELECT COUNT(*) n FROM jobs j JOIN companies c ON c.id=j.company_id WHERE j.status='open' AND c.status='approved'").n,
    candidates: get("SELECT COUNT(*) n FROM users WHERE role='candidate'").n,
    tests: get("SELECT COUNT(*) n FROM attempts WHERE status='done'").n,
  });
}));

router.get('/categories', wrap((req, res) => {
  res.json(all(`SELECT c.*, (SELECT COUNT(*) FROM jobs j JOIN companies co ON co.id=j.company_id WHERE j.category_id=c.id AND j.status='open' AND co.status='approved') AS jobs
                FROM categories c ORDER BY c.name`));
}));

router.get('/technologies', wrap((req, res) => {
  res.json(all('SELECT t.*, c.name AS category FROM technologies t LEFT JOIN categories c ON c.id=t.category_id ORDER BY t.name'));
}));

router.get('/companies', wrap((req, res) => {
  const { q = '', industry = '' } = req.query;
  res.json(all(`SELECT ${COMPANY_COLS},
      (SELECT COUNT(*) FROM jobs j WHERE j.company_id=c.id AND j.status='open') AS open_jobs
    FROM companies c WHERE c.status='approved' AND (c.name LIKE ? OR c.description LIKE ?) AND c.industry LIKE ?
    ORDER BY open_jobs DESC, c.name`, like(q), like(q), like(industry)));
}));

router.get('/companies/:id', wrap((req, res) => {
  const c = get(`SELECT ${COMPANY_COLS} FROM companies c WHERE c.id=? AND c.status='approved'`, req.params.id);
  if (!c) return res.status(404).json({ error: 'Kompaniya topilmadi' });
  const jobs = all(`SELECT j.*, cat.name AS category FROM jobs j LEFT JOIN categories cat ON cat.id=j.category_id WHERE j.company_id=? AND j.status='open' ORDER BY j.id DESC`, c.id);
  jobs.forEach((j) => (j.requirements = reqs(j.id)));
  res.json({ ...c, jobs });
}));

const reqs = (jobId) => all('SELECT t.id, t.name, jr.min_score FROM job_requirements jr JOIN technologies t ON t.id=jr.technology_id WHERE jr.job_id=?', jobId);

router.get('/jobs', wrap((req, res) => {
  const { q = '', category = '', tech = '' } = req.query;
  const rows = all(`SELECT j.*, c.name AS company_name, c.logo AS company_logo, c.id AS company_id, cat.name AS category
    FROM jobs j JOIN companies c ON c.id=j.company_id LEFT JOIN categories cat ON cat.id=j.category_id
    WHERE j.status='open' AND c.status='approved' AND (j.title LIKE ? OR c.name LIKE ?)
      AND (? = '' OR j.category_id = ?) ORDER BY j.id DESC`, like(q), like(q), String(category), Number(category) || 0);
  rows.forEach((j) => (j.requirements = reqs(j.id)));
  res.json(tech ? rows.filter((j) => j.requirements.some((r) => String(r.id) === String(tech))) : rows);
}));

router.get('/jobs/:id', wrap((req, res) => {
  const j = get(`SELECT j.*, c.name AS company_name, c.logo AS company_logo, c.description AS company_description, cat.name AS category
    FROM jobs j JOIN companies c ON c.id=j.company_id LEFT JOIN categories cat ON cat.id=j.category_id
    WHERE j.id=? AND j.status='open' AND c.status='approved'`, req.params.id);
  if (!j) return res.status(404).json({ error: 'Ish o\'rni topilmadi' });
  j.requirements = reqs(j.id);
  res.json(j);
}));

router.get('/sandbox', (req, res) => res.json(sandbox.info()));

module.exports = router;

