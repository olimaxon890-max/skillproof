// Nomzod API: profil, test topshirish, natijalar, tarix, PDF
const router = require('express').Router();
const { all, get, run, tx, log, j } = require('../db');
const { auth, role, wrap } = require('../middleware');
const { gradeSimple, evaluateAttempt, VERDICTS } = require('../scoring');
const sandbox = require('../sandbox');
const { attemptPdf } = require('../pdf');

router.use(auth, role('candidate'));

const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((x) => x[1]);

// ---------- Profil ----------
router.get('/profile', wrap((req, res) => {
  const u = get('SELECT id,email,first_name,last_name,phone,city,direction,bio,skills,created_at FROM users WHERE id=?', req.user.id);
  res.json(u);
}));
router.put('/profile', wrap((req, res) => {
  const b = req.body || {};
  const s = (k, n = 200) => String(b[k] ?? '').slice(0, n);
  if (!s('first_name').trim()) return res.status(400).json({ error: 'Ism majburiy' });
  run('UPDATE users SET first_name=?, last_name=?, phone=?, city=?, direction=?, bio=?, skills=? WHERE id=?',
    s('first_name'), s('last_name'), s('phone', 30), s('city'), s('direction'), s('bio', 1000), s('skills', 400), req.user.id);
  res.json({ ok: true });
}));

// ---------- Dashboard ----------
router.get('/dashboard', wrap((req, res) => {
  const attempts = all(`SELECT a.id, a.total_score, a.verdict, a.finished_at, a.status, a.decision, j.title, c.name AS company_name
    FROM attempts a JOIN jobs j ON j.id=a.job_id JOIN companies c ON c.id=a.company_id WHERE a.user_id=? ORDER BY a.id DESC`, req.user.id);
  const done = attempts.filter((a) => a.status === 'done');
  const techAgg = {};
  all("SELECT tech_scores FROM attempts WHERE user_id=? AND status='done'", req.user.id).forEach((r) =>
    j(r.tech_scores, []).forEach((t) => { (techAgg[t.name] ??= []).push(t.score); }));
  const techs = Object.entries(techAgg).map(([name, v]) => ({ name, score: Math.round(v.reduce((a, b) => a + b, 0) / v.length) }));
  const dir = get('SELECT direction FROM users WHERE id=?', req.user.id).direction;
  const recommended = all(`SELECT j.id, j.title, j.min_score, c.name AS company_name, cat.name AS category FROM jobs j
    JOIN companies c ON c.id=j.company_id LEFT JOIN categories cat ON cat.id=j.category_id
    WHERE j.status='open' AND c.status='approved' AND (? = '' OR cat.name = ?) ORDER BY j.id DESC LIMIT 4`, dir, dir);
  res.json({
    stats: {
      total: done.length,
      avg: done.length ? Math.round(done.reduce((a, b) => a + b.total_score, 0) / done.length) : 0,
      best: done.length ? Math.round(Math.max(...done.map((a) => a.total_score))) : 0,
      matched: done.filter((a) => ['full', 'interview'].includes(a.verdict)).length,
    },
    techs, recent: attempts.slice(0, 6), inProgress: attempts.find((a) => a.status === 'in_progress') || null, recommended,
  });
}));

router.get('/attempts', wrap((req, res) => {
  const rows = all(`SELECT a.id, a.status, a.total_score, a.verdict, a.started_at, a.finished_at, a.decision, a.correct, a.wrong, j.title, j.id AS job_id, c.name AS company_name
    FROM attempts a JOIN jobs j ON j.id=a.job_id JOIN companies c ON c.id=a.company_id WHERE a.user_id=? ORDER BY a.id DESC`, req.user.id);
  res.json(rows.map((r) => ({ ...r, verdict_label: VERDICTS[r.verdict] || '' })));
}));

// ---------- Test generatsiyasi ----------
function buildQuestionSet(job) {
  const reqs = all('SELECT technology_id FROM job_requirements WHERE job_id=?', job.id).map((r) => r.technology_id);
  const chosen = new Map();
  const n = job.questions_per_tech || 4;
  // Kompaniya aynan shu lavozim uchun yaratgan savollar har doim kiradi
  all('SELECT id FROM questions WHERE company_id=? AND job_id=?', job.company_id, job.id).forEach((q) => chosen.set(q.id, 1));
  for (const tid of reqs) {
    const pool = all('SELECT id, type, company_id, job_id FROM questions WHERE technology_id=? AND (company_id IS NULL OR (company_id=? AND job_id IS NULL))', tid, job.company_id);
    pool.sort((a, b) => (a.company_id ? 0 : 1) - (b.company_id ? 0 : 1) || Math.random() - 0.5);
    let codeCount = 0, picked = 0;
    for (const q of pool) {
      if (picked >= n) break;
      if (chosen.has(q.id)) { picked++; continue; }
      if (q.type === 'code' && codeCount >= 2) continue;
      if (q.type === 'code') codeCount++;
      chosen.set(q.id, 1); picked++;
    }
  }
  return shuffle([...chosen.keys()]);
}

const sanitize = (q) => ({
  id: q.id, type: q.type, text: q.text, code: q.code, options: j(q.options, []), language: q.language, starter: q.starter,
  points: q.points, tech: q.tech, difficulty: q.difficulty,
  publicTests: j(q.tests, []).filter((t) => !t.hidden).map(({ args, expected }) => ({ args, expected })),
  hiddenTests: j(q.tests, []).filter((t) => t.hidden).length,
});

router.post('/attempts', wrap((req, res) => {
  const job = get(`SELECT j.* FROM jobs j JOIN companies c ON c.id=j.company_id WHERE j.id=? AND j.status='open' AND c.status='approved'`, req.body?.job_id);
  if (!job) return res.status(404).json({ error: "Ish o'rni topilmadi yoki yopilgan" });
  const existing = get("SELECT * FROM attempts WHERE user_id=? AND job_id=? AND status='in_progress'", req.user.id, job.id);
  if (existing && new Date(existing.deadline) > new Date()) return res.json({ id: existing.id, resumed: true });
  if (existing) finish(existing.id);
  const ids = buildQuestionSet(job);
  if (!ids.length) return res.status(422).json({ error: "Bu lavozim uchun hozircha test savollari mavjud emas" });
  const deadline = new Date(Date.now() + job.duration_min * 60000).toISOString();
  const id = run('INSERT INTO attempts (user_id, job_id, company_id, question_ids, deadline) VALUES (?,?,?,?,?)', req.user.id, job.id, job.company_id, JSON.stringify(ids), deadline).id;
  log(req.user.id, 'test_start', `Lavozim: ${job.title}`);
  res.status(201).json({ id });
}));

function own(req, res) {
  const a = get('SELECT * FROM attempts WHERE id=? AND user_id=?', req.params.id, req.user.id);
  if (!a) { res.status(404).json({ error: 'Test topilmadi' }); return null; }
  return a;
}

function finish(id) {
  const a = get('SELECT * FROM attempts WHERE id=?', id);
  if (a.status === 'done') return a;
  const r = evaluateAttempt(id);
  run(`UPDATE attempts SET status='done', finished_at=?, total_score=?, tech_scores=?, correct=?, wrong=?, practical_score=?, verdict=?, summary=?,
    strengths=?, weaknesses=?, recommendations=? WHERE id=?`, new Date().toISOString(), r.total, JSON.stringify(r.techScores), r.correct, r.wrong, r.practical,
    r.verdict, r.summary, JSON.stringify(r.strengths), JSON.stringify(r.weaknesses), JSON.stringify(r.recommendations), id);
  return get('SELECT * FROM attempts WHERE id=?', id);
}

function expired(a) { return a.status === 'in_progress' && Date.now() > new Date(a.deadline).getTime() + 15000; }

router.get('/attempts/:id', wrap((req, res) => {
  let a = own(req, res); if (!a) return;
  if (expired(a)) a = finish(a.id);
  const job = get('SELECT j.id, j.title, j.min_score, j.duration_min, c.name AS company_name, c.id AS company_id FROM jobs j JOIN companies c ON c.id=j.company_id WHERE j.id=?', a.job_id);
  const ids = j(a.question_ids, []);
  const qs = all(`SELECT q.*, t.name AS tech FROM questions q LEFT JOIN technologies t ON t.id=q.technology_id WHERE q.id IN (${ids.map(() => '?').join(',')})`, ...ids);
  const byId = Object.fromEntries(qs.map((q) => [q.id, q]));
  const answers = Object.fromEntries(all('SELECT question_id, response, score FROM answers WHERE attempt_id=?', a.id).map((x) => [x.question_id, x]));
  const base = { id: a.id, status: a.status, job, deadline: a.deadline, serverNow: new Date().toISOString() };

  if (a.status === 'in_progress') {
    return res.json({ ...base, questions: ids.map((id) => byId[id]).filter(Boolean).map((q) => ({ ...sanitize(q), response: answers[q.id]?.response ?? null })) });
  }
  const reqs = all('SELECT t.name, jr.min_score FROM job_requirements jr JOIN technologies t ON t.id=jr.technology_id WHERE jr.job_id=?', a.job_id);
  res.json({
    ...base, finished_at: a.finished_at, total_score: a.total_score, tech_scores: j(a.tech_scores, []), correct: a.correct, wrong: a.wrong,
    practical_score: a.practical_score, verdict: a.verdict, verdict_label: VERDICTS[a.verdict], summary: a.summary,
    strengths: j(a.strengths, []), weaknesses: j(a.weaknesses, []), recommendations: j(a.recommendations, []),
    decision: a.decision, requirements: reqs,
    review: ids.map((id) => byId[id]).filter(Boolean).map((q) => ({ id: q.id, text: q.text, tech: q.tech, type: q.type, score: answers[q.id]?.score ?? 0 })),
  });
}));

router.post('/attempts/:id/answer', wrap((req, res) => {
  const a = own(req, res); if (!a) return;
  if (a.status !== 'in_progress' || expired(a)) return res.status(409).json({ error: 'Test yakunlangan' });
  const { question_id, response } = req.body || {};
  if (!j(a.question_ids, []).includes(Number(question_id))) return res.status(400).json({ error: "Bu savol testga tegishli emas" });
  const q = get('SELECT * FROM questions WHERE id=?', question_id);
  if (q.type === 'code') {
    // Kod javobi faqat "Yuborish" orqali baholanadi; bu yerda faqat qoralama saqlanadi
    const prev = get('SELECT score FROM answers WHERE attempt_id=? AND question_id=?', a.id, q.id);
    run(`INSERT INTO answers (attempt_id, question_id, response, score) VALUES (?,?,?,?)
      ON CONFLICT(attempt_id, question_id) DO UPDATE SET response=excluded.response`, a.id, q.id, String(response ?? '').slice(0, 20000), prev?.score ?? 0);
    return res.json({ ok: true, saved: true });
  }
  const g = gradeSimple(q, response);
  run(`INSERT INTO answers (attempt_id, question_id, response, score, detail) VALUES (?,?,?,?,?)
    ON CONFLICT(attempt_id, question_id) DO UPDATE SET response=excluded.response, score=excluded.score, detail=excluded.detail`,
    a.id, q.id, String(response ?? '').slice(0, 5000), g.score, g.detail || '');
  res.json({ ok: true, saved: true }); // to'g'ri/noto'g'ri ekanligi yashirin
}));

// Kodni sinash (faqat ochiq test case'lar) — sandbox'da
router.post('/attempts/:id/run', wrap(async (req, res) => {
  const a = own(req, res); if (!a) return;
  if (a.status !== 'in_progress') return res.status(409).json({ error: 'Test yakunlangan' });
  const q = get('SELECT * FROM questions WHERE id=? AND type=?', req.body?.question_id, 'code');
  if (!q || !j(a.question_ids, []).includes(q.id)) return res.status(400).json({ error: 'Kod savoli topilmadi' });
  const tests = j(q.tests, []).filter((t) => !t.hidden);
  res.json(await sandbox.runTests({ code: req.body.code, language: req.body.language || q.language, tests }));
}));

// Kodni yuborish (barcha, shu jumladan yashirin test case'lar bilan baholanadi)
router.post('/attempts/:id/submit-code', wrap(async (req, res) => {
  const a = own(req, res); if (!a) return;
  if (a.status !== 'in_progress' || expired(a)) return res.status(409).json({ error: 'Test yakunlangan' });
  const q = get('SELECT * FROM questions WHERE id=? AND type=?', req.body?.question_id, 'code');
  if (!q || !j(a.question_ids, []).includes(q.id)) return res.status(400).json({ error: 'Kod savoli topilmadi' });
  const tests = j(q.tests, []);
  const r = await sandbox.runTests({ code: req.body.code, language: req.body.language || q.language, tests });
  const score = r.total ? r.passed / r.total : 0;
  run(`INSERT INTO answers (attempt_id, question_id, response, score, detail) VALUES (?,?,?,?,?)
    ON CONFLICT(attempt_id, question_id) DO UPDATE SET response=excluded.response, score=excluded.score, detail=excluded.detail`,
    a.id, q.id, String(req.body.code).slice(0, 20000), score, `${r.passed}/${r.total}`);
  res.json({ passed: r.passed, total: r.total, error: r.error, cases: r.cases.map((c) => (c.hidden ? { index: c.index, hidden: true, ok: c.ok } : c)), logs: r.logs });
}));

router.post('/attempts/:id/finish', wrap((req, res) => {
  const a = own(req, res); if (!a) return;
  finish(a.id);
  log(req.user.id, 'test_finish', `Test #${a.id}`);
  res.json({ ok: true, id: a.id });
}));

router.get('/attempts/:id/pdf', wrap((req, res) => {
  const a = own(req, res); if (!a) return;
  if (a.status !== 'done') return res.status(409).json({ error: 'Test hali yakunlanmagan' });
  const job = get('SELECT * FROM jobs WHERE id=?', a.job_id);
  const company = get('SELECT * FROM companies WHERE id=?', a.company_id);
  const user = get('SELECT * FROM users WHERE id=?', a.user_id);
  attemptPdf(res, { attempt: a, job, company, user, techScores: j(a.tech_scores, []), strengths: j(a.strengths, []), weaknesses: j(a.weaknesses, []), recommendations: j(a.recommendations, []) });
}));

// Dasturlash muharriri (mashq rejimi): ixtiyoriy kodni sandbox'da sinash
router.post('/playground', wrap(async (req, res) => {
  const { code, language = 'javascript', tests } = req.body || {};
  const t = Array.isArray(tests) && tests.length ? tests.slice(0, 10) : [{ args: [], expected: null, play: true }];
  res.json(await sandbox.runTests({ code, language, tests: t }));
}));

module.exports = router;
module.exports.finish = finish;
module.exports.buildQuestionSet = buildQuestionSet;
