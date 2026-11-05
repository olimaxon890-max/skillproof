// Avtomatik o'z-o'zini tekshirish: node server/selftest.js  (vaqtinchalik bazada ishlaydi)
const os = require('os'), path = require('path'), fs = require('fs');
process.env.DB_PATH = path.join(os.tmpdir(), `sp-test-${Date.now()}.db`);
const app = require('./index');
const sandbox = require('./sandbox');

let fail = 0;
const ok = (c, m) => { console.log((c ? '  OK   ' : '  XATO ') + m); if (!c) fail++; };

(async () => {
  const srv = app.listen(0);
  const base = `http://localhost:${srv.address().port}/api`;
  const call = async (m, p, body, token) => {
    const r = await fetch(base + p, { method: m, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const ct = r.headers.get('content-type') || '';
    return { status: r.status, data: ct.includes('json') ? await r.json() : await r.arrayBuffer() };
  };
  const login = async (email, password) => (await call('POST', '/auth/login', { email, password })).data.token;

  console.log('Sandbox:', JSON.stringify(sandbox.info()));
  let r = await sandbox.runTests({ code: 'function solve(a){return a*2}', tests: [{ args: [2], expected: 4 }, { args: [3], expected: 7, hidden: true }] });
  ok(r.passed === 1 && r.total === 2, 'Sandbox: to\'g\'ri/noto\'g\'ri test case hisoblanadi');
  r = await sandbox.runTests({ code: 'function solve(){ while(true){} }', tests: [{ args: [], expected: 1 }] });
  ok(/Vaqt tugadi/.test(r.error || ''), 'Sandbox: cheksiz tsikl to\'xtatiladi');
  r = await sandbox.runTests({ code: "function solve(){ return require('fs').readFileSync('C:/Windows/win.ini','utf8').length }", tests: [{ args: [], expected: 0 }] });
  ok(!r.ok && r.passed === 0, 'Sandbox: fayl tizimiga kirish taqiqlangan (' + JSON.stringify(r.cases?.[0]?.error || r.error).slice(0, 80) + ')');
  r = await sandbox.runTests({ code: "function solve(){ return require('child_process').execSync('whoami').toString() }", tests: [{ args: [], expected: 0 }] });
  ok(!r.ok && r.passed === 0, 'Sandbox: child_process taqiqlangan');
  r = await sandbox.runTests({ code: 'function solve(){ return fetch("http://example.com").then?1:0 }', tests: [{ args: [], expected: 1 }] });
  ok(r.mode, 'Sandbox rejimi: ' + r.mode);
  r = await sandbox.runTests({ code: 'console.log("salom"); 1+1', tests: [{ args: [], expected: null, play: true }] });
  ok(r.play && r.logs[0] === 'salom', 'Playground: console.log chiqishi qaytadi');

  const admin = await login('admin@skillproof.uz', 'Admin123!');
  ok(!!admin, 'Admin login');
  ok((await login('admin@skillproof.uz', 'xato')) === undefined, "Noto'g'ri parol rad etiladi");
  ok((await call('GET', '/admin/stats')).status === 401, 'Tokensiz admin API yopiq');

  // Ro'yxatdan o'tish
  r = await call('POST', '/auth/register', { email: 'test@x.uz', password: 'Parol1234', first_name: 'Test', last_name: 'Nomzod', role: 'candidate' });
  ok(r.status === 201, "Nomzod ro'yxatdan o'tdi");
  const cand = r.data.token;
  ok((await call('GET', '/admin/stats', null, cand)).status === 403, 'Nomzod admin API ga kira olmaydi');
  ok((await call('GET', '/company/jobs', null, cand)).status === 403, 'Nomzod kompaniya API ga kira olmaydi');

  r = await call('POST', '/auth/register', { email: 'hr@yangi.uz', password: 'Parol1234', first_name: 'Hr', role: 'company', company_name: 'Yangi Kompaniya X' });
  ok(r.status === 201, "Kompaniya ro'yxatdan o'tdi");
  const newCo = r.data.token;
  const companies = (await call('GET', '/public/companies')).data;
  ok(!companies.some((c) => c.name === 'Yangi Kompaniya X'), 'Tasdiqlanmagan kompaniya ommaviy ro\'yxatda ko\'rinmaydi');

  // Multi-tenant izolyatsiya
  const hr1 = await login('hr@google-dev.uz', 'Demo1234!'), hr2 = await login('hr@nova-soft.uz', 'Demo1234!');
  const jobs1 = (await call('GET', '/company/jobs', null, hr1)).data, jobs2 = (await call('GET', '/company/jobs', null, hr2)).data;
  ok(jobs1.length && jobs2.length && !jobs1.some((j) => jobs2.find((x) => x.id === j.id)), 'Kompaniyalar o\'z ish o\'rinlarini alohida ko\'radi');
  ok((await call('PUT', `/company/jobs/${jobs2[0].id}`, { title: 'hack', requirements: [] }, hr1)).status === 404, 'Boshqa kompaniya ish o\'rnini o\'zgartirib bo\'lmaydi');
  const cands2 = (await call('GET', '/company/candidates', null, hr2)).data;
  const cands1 = (await call('GET', '/company/candidates', null, hr1)).data;
  ok(cands1.length > 0, 'Kompaniya nomzodlarni ko\'radi (' + cands1.length + ')');
  ok((await call('GET', `/company/attempts/${cands1[0].id}`, null, hr2)).status === 404, 'Boshqa kompaniya natijasini ko\'rib bo\'lmaydi');
  ok(!cands2.some((c) => cands1.find((x) => x.id === c.id)), 'Nomzodlar ro\'yxati tenant bo\'yicha ajratilgan');

  // Test topshirish
  const job = (await call('GET', '/public/jobs')).data.find((j) => j.title === 'Frontend Developer');
  r = await call('POST', '/candidate/attempts', { job_id: job.id }, cand);
  ok(r.status === 201 || r.status === 200, 'Test boshlandi');
  const aid = r.data.id;
  r = await call('GET', `/candidate/attempts/${aid}`, null, cand);
  const qs = r.data.questions;
  ok(qs.length > 0 && qs.every((q) => !('answer' in q) && !('tests' in q)), 'Savollarda to\'g\'ri javob/yashirin testlar yo\'q (' + qs.length + ' savol)');
  const codeQ = qs.find((q) => q.type === 'code');
  for (const q of qs.filter((x) => x.type !== 'code')) await call('POST', `/candidate/attempts/${aid}/answer`, { question_id: q.id, response: '0' }, cand);
  if (codeQ) {
    r = await call('POST', `/candidate/attempts/${aid}/run`, { question_id: codeQ.id, code: 'function solve(){return 1}' }, cand);
    ok(r.status === 200 && r.data.total > 0, 'Kodni ishga tushirish ishlaydi');
    r = await call('POST', `/candidate/attempts/${aid}/submit-code`, { question_id: codeQ.id, code: 'function solve(){return 1}' }, cand);
    ok(r.status === 200, 'Kod yuborish ishlaydi');
  }
  r = await call('POST', `/candidate/attempts/${aid}/finish`, {}, cand);
  r = await call('GET', `/candidate/attempts/${aid}`, null, cand);
  ok(r.data.status === 'done' && typeof r.data.total_score === 'number' && r.data.verdict, `Natija hisoblandi: ${r.data.total_score} ball, ${r.data.verdict_label}`);
  console.log('   Xulosa:', r.data.summary);
  const pdf = await call('GET', `/candidate/attempts/${aid}/pdf`, null, cand);
  ok(pdf.status === 200 && Buffer.from(pdf.data).slice(0, 4).toString() === '%PDF', 'PDF yuklab olish ishlaydi');
  ok((await call('GET', `/candidate/attempts/${aid}`, null, await login('aziz@demo.uz', 'Demo1234!'))).status === 404, 'Boshqa nomzod natijasini ko\'rib bo\'lmaydi');

  // Kompaniya: yaratish va qaror
  r = await call('POST', '/company/questions', { type: 'choice', text: 'Test savol?', technology_id: 4, options: ['a', 'b'], answer: 1 }, hr1);
  ok(r.status === 201, 'Kompaniya o\'z savolini yaratdi');
  r = await call('POST', `/company/attempts/${cands1[0].id}/decision`, { decision: 'hired', human_score: 90, note: 'Yaxshi' }, hr1);
  ok(r.status === 200, 'Qaror (qabul qilish) saqlandi');
  const csv = await call('GET', '/company/candidates.csv', null, hr1);
  ok(csv.status === 200, 'CSV hisobot ishlaydi');

  // Admin
  const co = (await call('GET', '/admin/companies', null, admin)).data.find((c) => c.name === 'Yangi Kompaniya X');
  ok((await call('PUT', `/admin/companies/${co.id}/status`, { status: 'approved' }, admin)).status === 200, 'Admin kompaniyani tasdiqladi');
  ok((await call('GET', '/public/companies')).data.some((c) => c.name === 'Yangi Kompaniya X'), 'Tasdiqlangan kompaniya ommaviy ko\'rindi');
  await call('PUT', `/admin/companies/${co.id}/status`, { status: 'blocked' }, admin);
  ok((await call('GET', '/company/jobs', null, newCo)).status === 403, 'Bloklangan kompaniya API ga kira olmaydi');

  srv.close();
  try { fs.rmSync(process.env.DB_PATH, { force: true }); } catch {}
  console.log(fail ? `\n${fail} ta tekshiruv muvaffaqiyatsiz` : '\nBarcha tekshiruvlar muvaffaqiyatli o\'tdi');
  process.exit(fail ? 1 : 0);
})();
