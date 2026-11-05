import { api } from '../api.js';
import { html, skeletonCards, verdictBadge, fmtDate, chart, empty, toast, PALETTE } from '../ui.js';
import { dash, pageHead, statCard } from '../components/layout.js';

export default async function (ctx) {
  ctx.render(dash('candidate', html`${pageHead('Bosh panel', 'Natijalaringiz va tavsiya etilgan vakansiyalar')}${skeletonCards(4, 'col-md-6 col-xl-3')}`));
  let d;
  try { d = await api.get('/candidate/dashboard'); } catch (e) { return toast(e.message, 'error'); }
  if (!ctx.isCurrent()) return;
  ctx.render(dash('candidate', html`${pageHead('Bosh panel', 'Natijalaringiz va tavsiya etilgan vakansiyalar', html`<a class="btn btn-violet" href="#/jobs"><i class="bi bi-lightning-charge-fill me-1"></i>Yangi test topshirish</a>`)}
    ${d.inProgress ? html`<div class="alert alert-warning d-flex justify-content-between align-items-center flex-wrap gap-2"><span><i class="bi bi-hourglass-split me-2"></i><b>${d.inProgress.title}</b> (${d.inProgress.company_name}) testi davom etmoqda.</span><a class="btn btn-sm btn-primary" href="#/test/${d.inProgress.id}">Davom ettirish</a></div>` : ''}
    <div class="row g-4 mb-4">
      <div class="col-md-6 col-xl-3">${statCard('bi-clipboard-check', 'navy', d.stats.total, 'Topshirilgan testlar')}</div>
      <div class="col-md-6 col-xl-3">${statCard('bi-speedometer2', 'violet', d.stats.avg, "O'rtacha ball")}</div>
      <div class="col-md-6 col-xl-3">${statCard('bi-trophy', 'yellow', d.stats.best, 'Eng yuqori ball')}</div>
      <div class="col-md-6 col-xl-3">${statCard('bi-patch-check', 'green', d.stats.matched, 'Mos kelgan lavozimlar')}</div></div>
    <div class="row g-4 mb-4"><div class="col-lg-6"><div class="card-sp card-pad h-100"><div class="card-title-sm">Texnologiyalar bo'yicha o'rtacha ball</div>
      ${d.techs.length ? html`<div class="chart-box"><canvas id="c1"></canvas></div>` : empty('bi-bar-chart', "Hali ma'lumot yo'q", "Birinchi testni topshiring — diagramma shu yerda paydo bo'ladi.")}</div></div>
      <div class="col-lg-6"><div class="card-sp card-pad h-100"><div class="d-flex justify-content-between"><div class="card-title-sm">Oxirgi natijalar</div><a href="#/candidate/history" class="small">Barchasi</a></div>
      ${d.recent.length ? html`<div class="table-responsive"><table class="table table-hover mb-0"><tbody>${d.recent.map((a) => html`<tr class="cursor-pointer" onclick="location.hash='#/${a.status === 'done' ? 'result' : 'test'}/${a.id}'">
        <td><div class="fw-semibold">${a.title}</div><small class="text-muted">${a.company_name} · ${fmtDate(a.finished_at)}</small></td><td class="text-end">${a.status === 'done' ? html`<b>${Math.round(a.total_score)}</b><div>${verdictBadge(a.verdict)}</div>` : html`<span class="badge-soft pending">Davom etmoqda</span>`}</td></tr>`)}</tbody></table></div>`
        : empty('bi-clock-history', "Testlar yo'q", "Hozircha test topshirmagansiz.")}</div></div></div>
    <div class="card-title-sm">Siz uchun tavsiya etilgan vakansiyalar</div>
    <div class="row g-3">${d.recommended.map((j) => html`<div class="col-md-6 col-xl-3"><a href="#/jobs/${j.id}" class="card-sp hover card-pad d-block h-100"><div class="fw-bold text-navy">${j.title}</div><div class="small text-muted mb-2">${j.company_name}</div>
      <span class="chip chip-violet">${j.category || 'IT'}</span> <span class="chip">Min. ${j.min_score}</span></a></div>`)}</div>`));
  if (d.techs.length) chart(ctx.root.querySelector('#c1'), { type: 'bar', data: { labels: d.techs.map((t) => t.name), datasets: [{ data: d.techs.map((t) => t.score), backgroundColor: d.techs.map((_, i) => PALETTE[i % PALETTE.length]), borderRadius: 8 }] },
    options: { scales: { y: { min: 0, max: 100 } }, plugins: { legend: { display: false } } } });
}

