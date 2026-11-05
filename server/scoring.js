// Baholash tizimi: javoblarni tekshirish, ball hisoblash, talablar bilan taqqoslash va xulosa
const { all, get, j } = require('./db');

const VERDICTS = {
  full: "Talablarga to'liq mos",
  interview: 'Suhbatga tavsiya etiladi',
  review: "Qo'shimcha tekshiruv talab etiladi",
  no: 'Hozircha talabga mos emas',
};

const norm = (s) => String(s ?? '').toLowerCase().replace(/[ʻʼ'’`]/g, "'").replace(/\s+/g, ' ').trim();

// Code'dan tashqari savol turlari uchun avtomatik tekshirish
function gradeSimple(q, response) {
  const type = q.type;
  if (type === 'choice' || type === 'debug') {
    const ok = String(response) === String(q.answer);
    return { score: ok ? 1 : 0 };
  }
  if (type === 'truefalse') return { score: String(response) === String(q.answer) ? 1 : 0 };
  if (type === 'short' || type === 'scenario') {
    const kws = j(q.answer, null) || String(q.answer).split(',');
    const text = norm(response);
    if (!text) return { score: 0 };
    // Har bir element — sinonimlar guruhi ("a|b"); kamida bittasi javobda bo'lishi kerak
    const hit = kws.filter((k) => norm(k).split('|').some((alt) => alt && text.includes(alt.trim()))).length;
    const ratio = kws.length ? hit / kws.length : 0;
    return { score: Math.min(1, Math.round(ratio * 100) / 100), detail: `${hit}/${kws.length} asosiy tushuncha topildi` };
  }
  return { score: 0 };
}

function evaluateAttempt(attemptId) {
  const attempt = get('SELECT * FROM attempts WHERE id=?', attemptId);
  const job = get('SELECT * FROM jobs WHERE id=?', attempt.job_id);
  const qids = j(attempt.question_ids, []);
  if (!qids.length) return null;
  const ph = qids.map(() => '?').join(',');
  const qs = all(`SELECT q.*, t.name AS tech FROM questions q LEFT JOIN technologies t ON t.id=q.technology_id WHERE q.id IN (${ph})`, ...qids);
  const ans = Object.fromEntries(all('SELECT * FROM answers WHERE attempt_id=?', attemptId).map((a) => [a.question_id, a]));
  const reqs = all('SELECT jr.min_score, t.name, t.id FROM job_requirements jr JOIN technologies t ON t.id=jr.technology_id WHERE jr.job_id=?', job.id);

  const byTech = {};
  let correct = 0, wrong = 0, codeSum = 0, codeMax = 0, sum = 0, max = 0;
  for (const q of qs) {
    const a = ans[q.id];
    const s = a ? a.score : 0;
    const key = q.tech || 'Umumiy';
    byTech[key] ??= { name: key, got: 0, max: 0, correct: 0, total: 0 };
    byTech[key].got += s * q.points; byTech[key].max += q.points; byTech[key].total++;
    sum += s * q.points; max += q.points;
    if (s >= 0.6) { correct++; byTech[key].correct++; } else wrong++;
    if (q.type === 'code') { codeSum += s * q.points; codeMax += q.points; }
  }
  const reqMap = Object.fromEntries(reqs.map((r) => [r.name, r.min_score]));
  const techScores = Object.values(byTech).map((t) => {
    const score = t.max ? Math.round((t.got / t.max) * 100) : 0;
    const required = reqMap[t.name] ?? null;
    return { name: t.name, score, required, met: required == null ? null : score >= required, correct: t.correct, total: t.total };
  });
  const total = max ? Math.round((sum / max) * 100) : 0;
  const practical = codeMax ? Math.round((codeSum / codeMax) * 100) : null;

  const withReq = techScores.filter((t) => t.required != null);
  const unmet = withReq.filter((t) => !t.met);
  let verdict;
  if (!unmet.length) verdict = total >= job.min_score ? 'full' : 'interview';
  else if (total >= job.min_score && unmet.length <= Math.ceil(withReq.length / 2)) verdict = 'interview';
  else if (total >= job.min_score * 0.7) verdict = 'review';
  else verdict = 'no';

  const strengths = techScores.filter((t) => t.score >= 75).sort((a, b) => b.score - a.score).map((t) => `${t.name} bo'yicha yuqori natija (${t.score} ball)`);
  const weaknesses = unmet.map((t) => `${t.name}: ${t.score} ball, talab ${t.required} ball (${t.required - t.score} ball yetishmaydi)`);
  techScores.filter((t) => t.required == null && t.score < 50).forEach((t) => weaknesses.push(`${t.name} bo'yicha bilim past (${t.score} ball)`));
  if (practical != null && practical < 50) weaknesses.push(`Amaliy dasturlash topshiriqlari past bajarilgan (${practical}%)`);
  const recommendations = [...unmet, ...techScores.filter((t) => t.required == null && t.score < 50)]
    .map((t) => `${t.name} bo'yicha bilimingizni rivojlantirish tavsiya etiladi`);
  if (practical != null && practical < 50) recommendations.push("Algoritmik masalalar yechish orqali amaliy ko'nikmani oshiring");

  const level = total >= 85 ? 'a\'lo' : total >= 70 ? 'yaxshi' : total >= 50 ? "o'rtacha" : 'past';
  let summary;
  if (verdict === 'full') summary = `Nomzod kompaniyaning barcha talablariga to'liq javob beradi. Umumiy bilim darajasi ${level} (${total}/100).`;
  else {
    summary = `Nomzod kompaniyaning barcha talablariga to'liq javob bermaydi. `;
    summary += total >= 70 ? `Lekin umumiy bilim darajasi ${level} (${total}/100). ` : `Umumiy bilim darajasi ${level} (${total}/100). `;
    if (unmet.length) summary += `${unmet.map((t) => t.name).join(', ')} bo'yicha bilimini rivojlantirishi tavsiya etiladi.`;
  }
  return { total, techScores, correct, wrong, practical, verdict, summary, strengths, weaknesses, recommendations };
}

module.exports = { VERDICTS, gradeSimple, evaluateAttempt };

