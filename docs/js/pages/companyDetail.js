import { api } from '../api.js';
import { html, logo, empty } from '../ui.js';
import { jobCard } from '../components/cards.js';

export default async function (ctx) {
  const c = await api.get('/public/companies/' + ctx.params.id).catch(() => null);
  if (!c) return ctx.render(html`<div class="container py-5">${empty('bi-building-x', 'Kompaniya topilmadi', 'Kompaniya mavjud emas yoki hali tasdiqlanmagan.')}<div class="text-center"><a class="btn btn-primary" href="#/companies">Kompaniyalar ro'yxati</a></div></div>`);
  const jobs = c.jobs.map((j) => ({ ...j, company_name: c.name, company_logo: c.logo, company_id: c.id }));
  ctx.render(html`<section class="company-hero"><div class="container"><a href="#/companies" class="text-white-50 small"><i class="bi bi-arrow-left"></i> Kompaniyalar</a>
    <div class="d-flex flex-wrap gap-4 align-items-center mt-3">${logo(c.name, c.logo, 'lg')}<div><h1 class="mb-2">${c.name}</h1>
      <div class="d-flex flex-wrap gap-3 opacity-75"><span><i class="bi bi-tag me-1"></i>${c.industry || '—'}</span><span><i class="bi bi-geo-alt me-1"></i>${c.city || '—'}</span>${c.size ? html`<span><i class="bi bi-people me-1"></i>${c.size} xodim</span>` : ''}
      ${c.website ? html`<a class="text-white" href="${c.website}" target="_blank" rel="noopener noreferrer"><i class="bi bi-link-45deg"></i> Veb-sayt</a>` : ''}</div></div></div></div></section>
  <div class="container pb-5 page-enter"><div class="row g-4">
    <div class="col-lg-4"><div class="card-sp card-pad"><div class="card-title-sm">Kompaniya haqida</div><p class="text-muted mb-0">${c.description || "Ma'lumot kiritilmagan"}</p></div></div>
    <div class="col-lg-8"><h4 class="mb-3">Ochiq ish o'rinlari <span class="chip chip-violet">${jobs.length}</span></h4>
      ${jobs.length ? html`<div class="row g-3">${jobs.map((j) => html`<div class="col-md-6">${jobCard(j)}</div>`)}</div>` : empty('bi-briefcase', "Hozircha vakansiya yo'q", "Yaqin orada yangi ish o'rinlari qo'shiladi.")}</div></div></div>`);
}

