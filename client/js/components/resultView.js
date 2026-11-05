// Natijalarni ko'rsatish (nomzod va kompaniya uchun umumiy)
import { html, bar, animateBars, chart, PALETTE, VERDICT } from '../ui.js';

export function scoreRing(score, size = 150) {
  return html`<div class="score-ring" style="--v:${Math.round(score)};width:${size}px;height:${size}px"><span>${Math.round(score)}<small>/100</small></span></div>`;
}

export const verdictBanner = (verdict, summary) => html`<div class="verdict-banner ${verdict}"><div class="d-flex gap-3 align-items-start"><i class="bi ${VERDICT[verdict]?.[1]} fs-2"></i>
  <div><div class="fw-bold fs-5 mb-1">${VERDICT[verdict]?.[0]}</div><div>${summary}</div></div></div></div>`;

export function techBars(techScores) {
  return techScores.map((t) => html`<div class="req-row"><b>${t.name}</b>${bar(t.score, t.required)}
    <span class="fw-bold text-end ${t.met === false ? 'text-warning' : t.met ? 'text-success' : ''}">${t.score}${t.required != null ? html`<small class="text-muted fw-normal">/${t.required}</small>` : ''}</span></div>`);
}

export const lists = (r) => html`<div class="row g-4">
  <div class="col-md-4"><div class="card-sp card-pad h-100"><div class="card-title-sm text-success"><i class="bi bi-hand-thumbs-up me-1"></i>Kuchli tomonlari</div>
    ${r.strengths.length ? html`<ul class="list-check good">${r.strengths.map((s) => html`<li>${s}</li>`)}</ul>` : html`<p class="text-muted small mb-0">Hozircha aniq kuchli tomon aniqlanmadi.</p>`}</div></div>
  <div class="col-md-4"><div class="card-sp card-pad h-100"><div class="card-title-sm" style="color:#b66d00"><i class="bi bi-exclamation-triangle me-1"></i>Kamchiliklari</div>
    ${r.weaknesses.length ? html`<ul class="list-check bad">${r.weaknesses.map((s) => html`<li>${s}</li>`)}</ul>` : html`<p class="text-muted small mb-0">Jiddiy kamchilik topilmadi. Ajoyib!</p>`}</div></div>
  <div class="col-md-4"><div class="card-sp card-pad h-100"><div class="card-title-sm text-violet"><i class="bi bi-lightbulb me-1"></i>Rivojlantirish kerak</div>
    ${r.recommendations.length ? html`<ul class="list-check tip">${r.recommendations.map((s) => html`<li>${s}</li>`)}</ul>` : html`<p class="text-muted small mb-0">Bilim darajangiz talablarga mos.</p>`}</div></div></div>`;

export function drawTechChart(root, techScores) {
  const c = root.querySelector('#techChart');
  if (!c || !techScores.length) return;
  const labels = techScores.map((t) => t.name);
  const req = techScores.some((t) => t.required != null);
  const datasets = [{ label: 'Nomzod balli', data: techScores.map((t) => t.score), backgroundColor: 'rgba(124,58,237,.18)', borderColor: '#7c3aed', pointBackgroundColor: '#7c3aed', borderWidth: 2 }];
  if (req) datasets.push({ label: 'Kompaniya talabi', data: techScores.map((t) => t.required ?? 0), backgroundColor: 'rgba(20,35,92,.06)', borderColor: '#14235c', borderDash: [5, 4], pointRadius: 0, borderWidth: 2 });
  if (techScores.length >= 3) chart(c, { type: 'radar', data: { labels, datasets }, options: { scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, backdropColor: 'transparent' } } }, plugins: { legend: { position: 'bottom' } } } });
  else chart(c, { type: 'bar', data: { labels, datasets }, options: { scales: { y: { min: 0, max: 100 } }, plugins: { legend: { position: 'bottom' } } } });
}

export function resultView(r, extraTop = '') {
  return html`<div class="row g-4 mb-4"><div class="col-lg-8">${verdictBanner(r.verdict, r.summary)}</div>
    <div class="col-lg-4"><div class="card-sp card-pad d-flex align-items-center gap-3 h-100">${scoreRing(r.total_score, 110)}<div><div class="text-muted small">Umumiy bilim darajasi</div>
      <div class="small mt-1"><span class="text-success fw-bold">${r.correct}</span> to'g'ri · <span class="text-danger fw-bold">${r.wrong}</span> noto'g'ri</div>
      <div class="small">Amaliy topshiriq: <b>${r.practical_score == null ? '—' : r.practical_score + '%'}</b></div></div></div></div>
    ${extraTop}
    <div class="row g-4 mb-4"><div class="col-lg-7"><div class="card-sp card-pad h-100"><div class="card-title-sm">Texnologiyalar bo'yicha ball <span class="text-muted fw-normal small">(chiziq — talab)</span></div>${techBars(r.tech_scores)}</div></div>
    <div class="col-lg-5"><div class="card-sp card-pad h-100"><div class="card-title-sm">Bilim xaritasi</div><div class="chart-box"><canvas id="techChart"></canvas></div></div></div></div>
    ${lists(r)}`;
}

export function afterResult(root, r) { animateBars(root); drawTechChart(root, r.tech_scores); }

