import { api, session } from '../api.js';
import { html, logo, empty, toast, withBusy, bar, animateBars } from '../ui.js';
import { navigate } from '../router.js';

export default async function (ctx) {
  const j = await api.get('/public/jobs/' + ctx.params.id).catch(() => null);
  if (!j) return ctx.render(html`<div class="container py-5">${empty('bi-briefcase', "Ish o'rni topilmadi", 'Vakansiya yopilgan yoki mavjud emas.')}<div class="text-center"><a class="btn btn-primary" href="#/jobs">Barcha vakansiyalar</a></div></div>`);
  const u = session.user;
  ctx.render(html`<div class="container py-5 page-enter"><a href="#/jobs" class="small text-muted"><i class="bi bi-arrow-left"></i> Ish o'rinlari</a>
    <div class="row g-4 mt-1"><div class="col-lg-8">
      <div class="card-sp card-pad mb-4"><div class="d-flex gap-3 align-items-center mb-3">${logo(j.company_name, j.company_logo)}<div><h2 class="mb-1">${j.title}</h2>
        <a href="#/companies/${j.company_id}" class="text-muted">${j.company_name}</a></div></div>
        <div class="d-flex flex-wrap gap-2 mb-3"><span class="chip chip-violet">${j.category || 'Dasturlash'}</span><span class="chip">${j.employment}</span><span class="chip"><i class="bi bi-cash-stack"></i> ${j.salary || 'Kelishiladi'}</span></div>
        <h6 class="fw-bold">Vazifalar haqida</h6><p class="text-muted">${j.description || "Tavsif kiritilmagan"}</p></div>
      <div class="card-sp card-pad"><div class="card-title-sm">Texnologiyalar bo'yicha minimal talablar</div>
        ${j.requirements.map((r) => html`<div class="req-row"><b>${r.name}</b>${bar(r.min_score)}<span class="fw-bold text-end">${r.min_score}</span></div>`)}</div></div>
    <div class="col-lg-4"><div class="card-sp card-pad position-sticky" style="top:90px"><div class="card-title-sm">Bilimingizni sinang</div>
      <ul class="list-unstyled small text-muted mb-4"><li class="mb-2"><i class="bi bi-stopwatch text-violet me-2"></i>Davomiyligi: <b class="text-dark">${j.duration_min} daqiqa</b></li>
        <li class="mb-2"><i class="bi bi-bullseye text-violet me-2"></i>Minimal ball: <b class="text-dark">${j.min_score}/100</b></li>
        <li class="mb-2"><i class="bi bi-list-check text-violet me-2"></i>Savollar: variantli, yozma, dasturlash</li><li><i class="bi bi-shield-check text-violet me-2"></i>Natija kompaniyaga yuboriladi</li></ul>
      ${!u ? html`<a class="btn btn-violet w-100 mb-2" href="#/login?next=${encodeURIComponent('/jobs/' + j.id)}">Testni boshlash uchun kiring</a><a class="btn btn-light-soft w-100" href="#/register">Ro'yxatdan o'tish</a>`
        : u.role === 'candidate' ? html`<button class="btn btn-violet w-100 btn-lg" id="start"><i class="bi bi-play-fill"></i> Testni boshlash</button>`
        : html`<div class="alert alert-warning small mb-0">Testni faqat nomzod hisobi topshira oladi.</div>`}</div></div></div></div>`);
  animateBars(ctx.root);
  const btn = ctx.root.querySelector('#start');
  const start = () => withBusy(btn, async () => {
    try { const r = await api.post('/candidate/attempts', { job_id: j.id }); navigate('/test/' + r.id); } catch (e) { toast(e.message, 'error'); }
  });
  if (btn) { btn.onclick = start; }
}

