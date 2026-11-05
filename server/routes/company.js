// Kompaniya API: profil, ish o'rinlari, savollar, nomzodlar, hisobotlar.
// Barcha so'rovlar tokendan olingan company_id bilan cheklanadi (multi-tenant izolyatsiya).
const router = require('express').Router();
const { all, get, run, tx, log, j } = require('../db');
const { auth, role, tenant, wrap } = require('../middleware');
const { VERDICTS } = require('../scoring');
const { attemptPdf } = require('../pdf');

router.use(auth, role('company'), tenant);

const str = (v, n = 500) => String(v ?? '').slice(0, n);

router.get('/profile', (req, res) => res.json(req.company));
router.put('/profile', wrap((req, res) => {
  const b = req.body || {};
  if (!str(b.name).trim()) return res.status(400).json({ error: 'Kompaniya nomi majburiy' });
  const logo = str(b.logo, 400000);
  if (logo && !/^(https?:\/\/|data:image\/(png|jpeg|jpg|webp|svg\+xml|gif);base64,)/.test(logo)) return res.status(400).json({ error: "Logotip formati noto'g'ri" });
  run('UPDATE companies SET name=?, logo=?, description=?, industry=?, website=?, city=?, size=? WHERE id=?',
    str(b.name, 120), logo, str(b.description, 2000), str(b.industry, 120), str(b.website, 200), str(b.city, 100), str(b.size, 50), req.company.id);
  res.json({ ok: true });
}));

// ---------- Dashboard ----------
router.get('/dashboard', wrap((req, res) => {
  const cid = req.company.id;
  const att = all(`SELECT a.id, a.total_score, a.verdict, a.decision, a.finished_at, j.title, u.first_name, u.last_name
    FROM attempts a JOIN jobs j ON j.id=a.job_id JOIN users u ON u.id=a.user_id WHERE a.company_id=? AND a.status='done' ORDER BY a.id DESC`, cid);
  const verdicts = { full: 0, interview: 0, review: 0, no: 0 };
  att.forEach((a) => verdicts[a.verdict]++);
  const perJob = all(`SELECT j.id, j.title, COUNT(a.id) AS candidates, ROUND(AVG(a.total_score)) AS avg FROM jobs j
    LEFT JOIN attempts a ON a.job_id=j.id AND a.status='done' WHERE j.company_id=? GROUP BY j.id ORDER BY j.id DESC`, cid);
  const days = all(`SELECT substr(finished_at,1,10) AS day, COUNT(*) AS n FROM attempts WHERE company_id=? AND status='done' AND finished_at >= date('now','-13 day') GROUP BY day ORDER BY day`, cid);
  res.json({
    company: { name: req.company.name, status: req.company.status },
    stats: {
      jobs: get("SELECT COUNT(*) n FROM jobs WHERE company_id=? AND status='open'", cid).n,
      candidates: att.length,
      avg: att.length ? Math.round(att.reduce((a, b) => a + b.total_score, 0) / att.length) : 0,
      hired: att.filter((a) => a.decision === 'hired').length,
    },
    verdicts, perJob, days, top: [...att].sort((a, b) => b.total_score - a.total_score).slice(0, 5), recent: att.slice(0, 6),
  });
}));

// ---------- Ish o'rinlari ----------
const reqsOf = (id) => all('SELECT t.id, t.name, jr.min_score FROM job_requirements jr JOIN technologies t ON t.id=jr.technology_id WHERE jr.job_id=?', id);

router.get('/jobs', wrap((req, res) => {
  const rows = all(`SELECT j.*, cat.name AS category, (SELECT COUNT(*) FROM attempts a WHERE a.job_id=j.id AND a.status='done') AS candidates
    FROM jobs j LEFT JOIN categories cat ON cat.id=j.category_id WHERE j.company_id=? ORDER BY j.id DESC`, req.company.id);
  rows.forEach((r) => (r.requirements = reqsOf(r.id)));
  res.json(rows);
}));

function saveJob(req, id) {
  const b = req.body || {};
  const reqs = (Array.isArray(b.requirements) ? b.requirements : []).filter((r) => get('SELECT id FROM technologies WHERE id=?', r.technology_id));
  const vals = [str(b.title, 150), Number(b.category_id) || null, str(b.description, 4000), str(b.salary, 100), str(b.employment, 60) || "To'liq stavka",
  Math.min(100, Math.max(0, Number(b.min_score) || 0)), Math.min(240, Math.max(5, Number(b.duration_min) || 30)),
  Math.min(15, Math.max(1, Number(b.questions_per_tech) || 4)), b.status === 'closed' ? 'closed' : 'open'];
  return tx(() => {
    let jid = id;
    if (id) run('UPDATE jobs SET title=?, category_id=?, description=?, salary=?, employment=?, min_score=?, duration_min=?, questions_per_tech=?, status=? WHERE id=? AND company_id=?', ...vals, id, req.company.id);
    else jid = run('INSERT INTO jobs (title, category_id, description, salary, employment, min_score, duration_min, questions_per_tech, status, company_id) VALUES (?,?,?,?,?,?,?,?,?,?)', ...vals, req.company.id).id;
    run('DELETE FROM job_requirements WHERE job_id=?', jid);
    reqs.forEach((r) => run('INSERT OR REPLACE INTO job_requirements (job_id, technology_id, min_score) VALUES (?,?,?)', jid, r.technology_id, Math.min(100, Math.max(0, Number(r.min_score) || 60))));
    return jid;
  });
}

router.post('/jobs', wrap((req, res) => {
  if (!str(req.body?.title).trim()) return res.status(400).json({ error: 'Lavozim nomini kiriting' });
  if (!req.body.requirements?.length) return res.status(400).json({ error: 'Kamida bitta texnologiya tanlang' });
  const id = saveJob(req, null);
  log(req.user.id, 'job_create', req.body.title);
  res.status(201).json({ id });
}));
router.put('/jobs/:id', wrap((req, res) => {
  if (!get('SELECT id FROM jobs WHERE id=? AND company_id=?', req.params.id, req.company.id)) return res.status(404).json({ error: "Ish o'rni topilmadi" });
  saveJob(req, Number(req.params.id));
  res.json({ ok: true });
}));
router.delete('/jobs/:id', wrap((req, res) => {
  const r = run('DELETE FROM jobs WHERE id=? AND company_id=?', req.params.id, req.company.id);
  res.status(r.changes ? 200 : 404).json(r.changes ? { ok: true } : { error: "Ish o'rni topilmadi" });
}));

// ---------- Savollar ----------
router.get('/questions', wrap((req, res) => {
  const rows = all(`SELECT q.*, t.name AS tech, j.title AS job_title FROM questions q LEFT JOIN technologies t ON t.id=q.technology_id LEFT JOIN jobs j ON j.id=q.job_id
    WHERE q.company_id=? ORDER BY q.id DESC`, req.company.id);
  res.json(rows.map((q) => ({ ...q, options: j(q.options, []), tests: j(q.tests, []) })));
}));

function validateQuestion(b) {
  const types = ['choice', 'truefalse', 'short', 'debug', 'scenario', 'code'];
  if (!types.includes(b.type)) return "Savol turi noto'g'ri";
  if (!str(b.text).trim()) return 'Savol matnini kiriting';
  if (!get('SELECT id FROM technologies WHERE id=?', b.technology_id)) return 'Texnologiyani tanlang';
  if (['choice', 'debug'].includes(b.type)) {
    if (!Array.isArray(b.options) || b.options.filter((o) => String(o).trim()).length < 2) return 'Kamida 2 ta variant kiriting';
    if (b.answer === '' || b.answer == null || !b.options[Number(b.answer)]) return "To'g'ri javobni belgilang";
  }
  if (b.type === 'truefalse' && !['true', 'false'].includes(String(b.answer))) return "To'g'ri javobni belgilang";
  if (['short', 'scenario'].includes(b.type) && !(Array.isArray(b.answer) ? b.answer : []).filter(Boolean).length) return 'Kamida bitta kalit so\'z kiriting';
  if (b.type === 'code') {
    if (!Array.isArray(b.tests) || !b.tests.length) return "Kamida bitta test case kiriting";
    if (b.tests.some((t) => !Array.isArray(t.args))) return "Test case argumentlari massiv bo'lishi kerak";
  }
  return null;
}

router.post('/questions', wrap((req, res) => saveQuestion(req, res, null)));
router.put('/questions/:id', wrap((req, res) => saveQuestion(req, res, Number(req.params.id))));
function saveQuestion(req, res, id) {
  const b = req.body || {};
  const err = validateQuestion(b);
  if (err) return res.status(400).json({ error: err });
  let jobId = Number(b.job_id) || null;
  if (jobId && !get('SELECT id FROM jobs WHERE id=? AND company_id=?', jobId, req.company.id)) jobId = null;
  const answer = ['short', 'scenario'].includes(b.type) ? JSON.stringify(b.answer.filter(Boolean)) : String(b.answer ?? '');
  const vals = [jobId, b.technology_id, b.type, str(b.text, 3000), str(b.code, 5000), JSON.stringify((b.options || []).map((o) => str(o, 300))), answer,
    str(b.explanation, 1000), str(b.language || 'javascript', 20), str(b.starter, 5000), JSON.stringify(b.type === 'code' ? b.tests : []), Math.min(10, Math.max(1, Number(b.points) || 1)), str(b.difficulty || "o'rta", 20)];
  const cols = 'job_id=?, technology_id=?, type=?, text=?, code=?, options=?, answer=?, explanation=?, language=?, starter=?, tests=?, points=?, difficulty=?';
  if (id) {
    const r = run(`UPDATE questions SET ${cols} WHERE id=? AND company_id=?`, ...vals, id, req.company.id);
    if (!r.changes) return res.status(404).json({ error: 'Savol topilmadi' });
    return res.json({ ok: true });
  }
  const nid = run(`INSERT INTO questions (job_id, technology_id, type, text, code, options, answer, explanation, language, starter, tests, points, difficulty, company_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, ...vals, req.company.id).id;
  res.status(201).json({ id: nid });
}
router.delete('/questions/:id', wrap((req, res) => {
  const r = run('DELETE FROM questions WHERE id=? AND company_id=?', req.params.id, req.company.id);
  res.status(r.changes ? 200 : 404).json(r.changes ? { ok: true } : { error: 'Savol topilmadi' });
}));

// ---------- Nomzodlar ----------
function candidateRows(cid, jobId) {
  return all(`SELECT a.id, a.job_id, a.total_score, a.tech_scores, a.correct, a.wrong, a.practical_score, a.verdict, a.decision, a.human_score, a.finished_at,
      j.title AS job_title, u.id AS user_id, u.first_name, u.last_name, u.email, u.phone, u.city, u.direction
    FROM attempts a JOIN jobs j ON j.id=a.job_id JOIN users u ON u.id=a.user_id
    WHERE a.company_id=? AND a.status='done' AND (? = 0 OR a.job_id=?) ORDER BY a.total_score DESC`, cid, jobId, jobId)
    .map((r) => ({ ...r, tech_scores: j(r.tech_scores, []), verdict_label: VERDICTS[r.verdict] }));
}
router.get('/candidates', wrap((req, res) => res.json(candidateRows(req.company.id, Number(req.query.job_id) || 0))));

router.get('/candidates.csv', wrap((req, res) => {
  const rows = candidateRows(req.company.id, Number(req.query.job_id) || 0);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Ism', 'Familiya', 'Email', 'Telefon', 'Lavozim', 'Umumiy ball', "To'g'ri", "Noto'g'ri", 'Amaliy %', 'Texnologiyalar', 'Xulosa', 'Qaror', 'Mutaxassis bahosi', 'Sana'];
  const dec = { pending: 'Kutilmoqda', hired: 'Qabul qilindi', rejected: 'Rad etildi' };
  const lines = rows.map((r) => [r.first_name, r.last_name, r.email, r.phone, r.job_title, Math.round(r.total_score), r.correct, r.wrong, r.practical_score ?? '',
  r.tech_scores.map((t) => `${t.name}:${t.score}`).join('; '), r.verdict_label, dec[r.decision], r.human_score ?? '', r.finished_at].map(esc).join(','));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="skillproof-nomzodlar.csv"');
  res.send('\uFEFF' + [head.map(esc).join(','), ...lines].join('\r\n'));
}));

function theirAttempt(req, res) {
  const a = get("SELECT * FROM attempts WHERE id=? AND company_id=? AND status='done'", req.params.id, req.company.id);
  if (!a) res.status(404).json({ error: 'Natija topilmadi' });
  return a;
}

router.get('/attempts/:id', wrap((req, res) => {
  const a = theirAttempt(req, res); if (!a) return;
  const user = get('SELECT id, first_name, last_name, email, phone, city, direction, bio, skills FROM users WHERE id=?', a.user_id);
  const job = get('SELECT id, title, min_score FROM jobs WHERE id=?', a.job_id);
  const ids = j(a.question_ids, []);
  const ans = Object.fromEntries(all('SELECT question_id, score, response FROM answers WHERE attempt_id=?', a.id).map((x) => [x.question_id, x]));
  const qs = all(`SELECT q.id, q.text, q.type, t.name AS tech FROM questions q LEFT JOIN technologies t ON t.id=q.technology_id WHERE q.id IN (${ids.map(() => '?').join(',')})`, ...ids);
  res.json({
    ...a, question_ids: undefined, tech_scores: j(a.tech_scores, []), strengths: j(a.strengths, []), weaknesses: j(a.weaknesses, []),
    recommendations: j(a.recommendations, []), verdict_label: VERDICTS[a.verdict], user, job,
    requirements: reqsOf(a.job_id),
    review: qs.map((q) => ({ ...q, score: ans[q.id]?.score ?? 0, response: q.type === 'code' || q.type === 'short' || q.type === 'scenario' ? ans[q.id]?.response : undefined })),
  });
}));

router.post('/attempts/:id/decision', wrap((req, res) => {
  const a = theirAttempt(req, res); if (!a) return;
  const { decision, human_score, note } = req.body || {};
  if (!['hired', 'rejected', 'pending'].includes(decision)) return res.status(400).json({ error: "Noto'g'ri qaror" });
  const hs = human_score === '' || human_score == null ? null : Math.min(100, Math.max(0, Number(human_score)));
  run('UPDATE attempts SET decision=?, human_score=?, company_note=?, decided_at=? WHERE id=?', decision, hs, str(note, 1000), new Date().toISOString(), a.id);
  log(req.user.id, 'decision', `Natija #${a.id}: ${decision}`);
  res.json({ ok: true });
}));

router.get('/attempts/:id/pdf', wrap((req, res) => {
  const a = theirAttempt(req, res); if (!a) return;
  attemptPdf(res, {
    attempt: a, job: get('SELECT * FROM jobs WHERE id=?', a.job_id), company: req.company, user: get('SELECT * FROM users WHERE id=?', a.user_id),
    techScores: j(a.tech_scores, []), strengths: j(a.strengths, []), weaknesses: j(a.weaknesses, []), recommendations: j(a.recommendations, []),
  });
}));

module.exports = router;

