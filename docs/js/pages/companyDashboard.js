import { api } from '../api.js';
import { html, skeletonCards, toast, chart, PALETTE, fmtDate, verdictBadge, avatar, empty, VERDICT } from '../ui.js';
import { dash, pageHead, statCard } from '../components/layout.js';

export default async function (ctx) {
  ctx.render(dash('company', html`${pageHead('Bosh panel')}${skeletonCards(4, 'col-md-6 col-xl-3')}`));
  let d;
  try { d = await api.get('/company/dashboard'); } catch (e) { return toast(e.message, 'error'); }
  if (!ctx.isCurrent()) return;
  const v = d.verdicts;
  ctx.render(dash('company', html`${pageHead(d.company.name, 'Nomzodlar va ish o\'rinlari statistikasi', html`<a class="btn btn-light-soft" href="#/company/tests"><i class="bi bi-patch-question me-1"></i>Test yaratish</a><a class="btn btn-primary" href="#/company/jobs"><i class="bi bi-plus-lg me-1"></i>Yangi ish o'rni</a>`)}
    ${d.company.status !== 'approved' ? html`<div class="alert alert-warning"><i class="bi bi-hourglass-split me-2"></i>${d.company.status === 'pending' ? "Kompaniyangiz Super Admin tomonidan tasdiqlanishini kutmoqda. Tasdiqlangunga qadar ish o'rinlari ommaga ko'rinmaydi." : 'Kompaniyangiz bloklangan.'}</div>` : ''}
    <div class="row g-4 mb-4">
      <div class="col-md-6 col-xl-3">${statCard('bi-briefcase', 'navy', d.stats.jobs, "Ochiq ish o'rinlari")}</div>
      <div class="col-md-6 col-xl-3">${statCard('bi-people', 'violet', d.stats.candidates, 'Test topshirgan nomzodlar')}</div>
      <div class="col-md-6 col-xl-3">${statCard('bi-speedometer2', 'yellow', d.stats.avg, "O'rtacha ball")}</div>
      <div class="col-md-6 col-xl-3">${statCard('bi-person-check', 'green', d.stats.hired, 'Qabul qilinganlar')}</div></div>
    <div class="row g-4 mb-4">
      <div class="col-lg-4"><div class="card-sp card-pad h-100"><div class="card-title-sm">Nomzodlar xulosalari</div>${d.stats.candidates ? html`<div class="chart-box" style="height:240px"><canvas id="c1"></canvas></div>` : empty('bi-pie-chart', "Ma'lumot yo'q", '')}</div></div>
      <div class="col-lg-4"><div class="card-sp card-pad h-100"><div class="card-title-sm">Lavozimlar bo'yicha o'rtacha ball</div><div class="chart-box" style="height:240px"><canvas id="c2"></canvas></div></div></div>
      <div class="col-lg-4"><div class="card-sp card-pad h-100"><div class="card-title-sm">Oxirgi 14 kun: testlar</div><div class="chart-box" style="height:240px"><canvas id="c3"></canvas></div></div></div></div>
    <div class="row g-4"><div class="col-lg-6"><div class="card-sp card-pad h-100"><div class="d-flex justify-content-between"><div class="card-title-sm"><i class="bi bi-trophy text-warning me-1"></i>Eng yaxshi nomzodlar</div><a href="#/company/candidates" class="small">Barchasi</a></div>
      ${d.top.length ? d.top.map((c, i) => html`<a href="#/company/candidates/${c.id}" class="d-flex align-items-center gap-3 py-2 border-bottom text-reset"><span class="fw-bold text-muted" style="width:20px">${i + 1}</span>${avatar(c.first_name, c.last_name)}
        <div class="flex-grow-1"><div class="fw-semibold">${c.first_name} ${c.last_name}</div><small class="text-muted">${c.title}</small></div><b class="fs-5">${Math.round(c.total_score)}</b></a>`) : empty('bi-people', "Hali nomzod yo'q", "Nomzodlar test topshirgach bu yerda ko'rinadi.")}</div></div>
    <div class="col-lg-6"><div class="card-sp card-pad h-100"><div class="card-title-sm">So'nggi natijalar</div>
      ${d.recent.length ? d.recent.map((c) => html`<a href="#/company/candidates/${c.id}" class="d-flex align-items-center gap-3 py-2 border-bottom text-reset">${avatar(c.first_name, c.last_name)}<div class="flex-grow-1"><div class="fw-semibold">${c.first_name} ${c.last_name}</div><small class="text-muted">${fmtDate(c.finished_at)} · ${c.title}</small></div>${verdictBadge(c.verdict)}</a>`) : empty('bi-clock', '', '')}</div></div></div>`));
  const $ = (s) => ctx.root.querySelector(s);
  if (d.stats.candidates) chart($('#c1'), { type: 'doughnut', data: { labels: Object.values(VERDICT).map((x) => x[0]), datasets: [{ data: [v.full, v.interview, v.review, v.no], backgroundColor: ['#12b76a', '#6366f1', '#f5a524', '#e5484d'], borderWidth: 0 }] }, options: { cutout: '65%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } } } });
  chart($('#c2'), { type: 'bar', data: { labels: d.perJob.map((j) => j.title), datasets: [{ data: d.perJob.map((j) => j.avg || 0), backgroundColor: PALETTE, borderRadius: 8 }] }, options: { scales: { y: { min: 0, max: 100 } }, plugins: { legend: { display: false } } } });
  chart($('#c3'), { type: 'line', data: { labels: d.days.map((x) => x.day.slice(5)), datasets: [{ data: d.days.map((x) => x.n), borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,.12)', fill: true, tension: .4 }] }, options: { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }, plugins: { legend: { display: false } } } });
}

