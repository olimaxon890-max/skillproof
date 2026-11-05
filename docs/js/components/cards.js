// Qayta ishlatiladigan kartalar
import { html, logo } from '../ui.js';

export const jobCard = (j) => html`<div class="card-sp hover job-card">
  <div class="d-flex gap-3 align-items-center">${logo(j.company_name, j.company_logo, 'sm')}
    <div class="overflow-hidden"><a class="fw-bold text-navy d-block text-truncate" href="#/jobs/${j.id}">${j.title}</a><a class="small text-muted" href="#/companies/${j.company_id}">${j.company_name}</a></div></div>
  <div class="d-flex flex-wrap gap-1">${(j.requirements || []).slice(0, 5).map((r) => html`<span class="chip">${r.name} <b>${r.min_score}+</b></span>`)}</div>
  <div class="d-flex flex-wrap gap-3 small text-muted"><span><i class="bi bi-cash-stack me-1"></i>${j.salary || 'Kelishiladi'}</span><span><i class="bi bi-stopwatch me-1"></i>${j.duration_min} daqiqa</span><span><i class="bi bi-bullseye me-1"></i>Min. ${j.min_score} ball</span></div>
  <div class="mt-auto d-flex gap-2"><a class="btn btn-primary btn-sm flex-grow-1" href="#/jobs/${j.id}">Batafsil</a>
    <a class="btn btn-violet btn-sm" href="#/jobs/${j.id}?start=1"><i class="bi bi-play-fill"></i> Testni boshlash</a></div></div>`;

export const companyCard = (c) => html`<div class="card-sp hover card-pad h-100 d-flex flex-column gap-3">
  <div class="d-flex gap-3 align-items-center">${logo(c.name, c.logo)}<div class="overflow-hidden"><a href="#/companies/${c.id}" class="fw-bold fs-5 text-navy d-block text-truncate">${c.name}</a>
    <div class="small text-muted"><i class="bi bi-geo-alt me-1"></i>${c.city || '—'}</div></div></div>
  <p class="text-muted small mb-0" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${c.description || "Ma'lumot kiritilmagan"}</p>
  <div class="d-flex justify-content-between align-items-center mt-auto"><span class="chip chip-violet">${c.industry || 'Soha'}</span>
    <span class="small fw-semibold ${c.open_jobs ? 'text-success' : 'text-muted'}"><i class="bi bi-briefcase me-1"></i>${c.open_jobs} ta vakansiya</span></div>
  <a href="#/companies/${c.id}" class="btn btn-light-soft btn-sm">Kompaniyani ko'rish <i class="bi bi-arrow-right"></i></a></div>`;

