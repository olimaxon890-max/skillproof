// Umumiy maket: navigatsiya, footer va dashboard qobig'i
import { html, raw } from '../ui.js';
import { session } from '../api.js';

const DASH_HOME = { candidate: '#/candidate', company: '#/company', admin: '#/admin' };
export const dashHome = (role) => DASH_HOME[role] || '#/';

const SIDE = {
  candidate: [
    ['#/candidate', 'bi-grid-1x2-fill', 'Bosh panel'], ['#/companies', 'bi-buildings', 'Kompaniyalar'], ['#/jobs', 'bi-briefcase', "Ish o'rinlari"],
    ['#/candidate/history', 'bi-clock-history', 'Testlar tarixi'], ['#/editor', 'bi-terminal', 'Dasturlash muharriri'], ['#/candidate/profile', 'bi-person-circle', 'Mening profilim'],
  ],
  company: [
    ['#/company', 'bi-grid-1x2-fill', 'Bosh panel'], ['#/company/jobs', 'bi-briefcase', "Ish o'rinlari"], ['#/company/tests', 'bi-patch-question', 'Test yaratish'],
    ['#/company/candidates', 'bi-people', 'Nomzodlar'], ['#/company/settings', 'bi-gear', 'Kompaniya sozlamalari'],
  ],
  admin: [
    ['#/admin', 'bi-speedometer2', 'Umumiy statistika'], ['#/admin/companies', 'bi-buildings', 'Kompaniyalar'], ['#/admin/users', 'bi-people', 'Foydalanuvchilar'], ['#/admin/catalog', 'bi-tags', 'Kategoriya va texnologiyalar'],
  ],
};

export function renderNav() {
  const hash = location.hash || '#/';
  const u = session.user;
  const link = (h, t) => html`<li class="nav-item"><a class="nav-link ${hash === h || (h !== '#/' && hash.startsWith(h)) ? 'active' : ''}" href="${h}">${t}</a></li>`;
  const initials = u ? ((u.first_name || u.email)[0] + (u.last_name?.[0] || '')).toUpperCase() : '';
  return html`<nav class="navbar navbar-expand-lg sp-nav"><div class="container">
    <a class="navbar-brand brand" href="#/"><span class="brand-mark"><i class="bi bi-shield-check"></i></span>SkillProof</a>
    <button class="navbar-toggler border-0" data-bs-toggle="collapse" data-bs-target="#navMenu" aria-label="Menyu"><i class="bi bi-list fs-2"></i></button>
    <div class="collapse navbar-collapse" id="navMenu">
      <ul class="navbar-nav mx-auto gap-lg-1">${link('#/', 'Bosh sahifa')}${link('#/companies', 'Kompaniyalar')}${link('#/jobs', "Ish o'rinlari")}${link('#/editor', 'Dasturlash muharriri')}</ul>
      <div class="d-flex gap-2 align-items-center mt-3 mt-lg-0">${u ? html`
        <a class="btn btn-light-soft btn-sm d-flex align-items-center gap-2" href="${dashHome(u.role)}"><span class="avatar" style="width:28px;height:28px;font-size:.7rem">${initials}</span>Mening panelim</a>
        <button class="btn btn-sm btn-outline-secondary" data-action="logout" title="Chiqish"><i class="bi bi-box-arrow-right"></i> Chiqish</button>` : html`
        <a class="btn btn-light-soft" href="#/login">Kirish</a><a class="btn btn-primary" href="#/register">Ro'yxatdan o'tish</a>`}</div>
    </div></div></nav>`;
}

export function renderFooter() {
  return html`<footer class="sp-footer"><div class="container"><div class="row g-4">
    <div class="col-lg-4"><div class="brand d-flex align-items-center gap-2 fs-4 fw-bold mb-3"><span class="brand-mark" style="width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,#14235c,#7c3aed);display:grid;place-items:center;color:#fff"><i class="bi bi-shield-check"></i></span>SkillProof</div>
      <p class="pe-lg-5">CV emas, bilim muhim. SkillProof nomzodlarning haqiqiy bilimini tekshiradi va kompaniyalarga to'g'ri mutaxassisni topishga yordam beradi.</p></div>
    <div class="col-6 col-lg-2"><h6>Platforma</h6><a href="#/companies">Kompaniyalar</a><a href="#/jobs">Ish o'rinlari</a><a href="#/editor">Dasturlash muharriri</a></div>
    <div class="col-6 col-lg-3"><h6>Hisob</h6><a href="#/login">Kirish</a><a href="#/register">Nomzod sifatida</a><a href="#/register?role=company">Kompaniya sifatida</a></div>
    <div class="col-lg-3"><h6>Aloqa</h6><span class="d-block py-1"><i class="bi bi-envelope me-2"></i>info@skillproof.uz</span><span class="d-block py-1"><i class="bi bi-geo-alt me-2"></i>Toshkent, O'zbekiston</span></div>
  </div><hr class="border-secondary my-4"><div class="small text-center">© ${new Date().getFullYear()} SkillProof. Barcha huquqlar himoyalangan.</div></div></footer>`;
}

/** Dashboard qobig'i: chap menyu + kontent */
export function dash(role, content) {
  const hash = location.hash.split('?')[0];
  const u = session.user;
  const best = SIDE[role].filter(([h]) => hash === h || hash.startsWith(h + '/')).sort((a, b) => b[0].length - a[0].length)[0];
  return html`<div class="dash"><aside class="dash-side">
    <div class="side-user d-flex align-items-center gap-2 px-2 pb-3 mb-2 border-bottom"><div class="avatar">${((u?.first_name || '?')[0] + (u?.last_name?.[0] || '')).toUpperCase()}</div>
      <div class="overflow-hidden"><div class="fw-bold text-truncate">${u?.first_name} ${u?.last_name}</div><div class="small text-muted text-truncate">${u?.email}</div></div></div>
    <div class="side-title">Menyu</div>
    ${SIDE[role].map(([h, i, t]) => html`<a class="side-link ${best && best[0] === h ? 'active' : ''}" href="${h}"><i class="bi ${i}"></i>${t}</a>`)}
    <div class="side-title mt-3">Hisob</div>
    <a class="side-link" href="#/" ><i class="bi bi-house"></i>Bosh sahifa</a>
    <a class="side-link" href="#" data-action="logout"><i class="bi bi-box-arrow-right"></i>Chiqish</a>
  </aside><section class="dash-main page-enter">${content}</section></div>`;
}

export const pageHead = (title, sub = '', actions = '') => html`<div class="page-head"><div><h1>${title}</h1>${sub ? html`<p>${sub}</p>` : ''}</div><div class="d-flex gap-2 flex-wrap">${actions}</div></div>`;
export const statCard = (icon, color, value, label) => html`<div class="card-sp stat-card"><div class="icon i-${color}"><i class="bi ${icon}"></i></div><div><div class="val">${value}</div><div class="lbl">${label}</div></div></div>`;
export { raw };

