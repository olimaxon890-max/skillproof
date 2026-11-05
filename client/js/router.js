// Hash asosidagi router: sahifalarni dinamik yuklaydi, rollarni tekshiradi
import { session, api } from './api.js';
import { renderNav, renderFooter, dashHome } from './components/layout.js';
import { skeletonPage, toast, destroyCharts, html } from './ui.js';

const ROUTES = [
  ['/', 'home', null, { full: true }],
  ['/companies', 'companies'], ['/companies/:id', 'companyDetail'], ['/jobs', 'jobs'], ['/jobs/:id', 'jobDetail'],
  ['/login', 'auth', null, { mode: 'login' }], ['/register', 'auth', null, { mode: 'register' }],
  ['/editor', 'editor', ['candidate']],
  ['/candidate', 'candidateDashboard', ['candidate']], ['/candidate/history', 'candidateHistory', ['candidate']], ['/candidate/profile', 'candidateProfile', ['candidate']],
  ['/test/:id', 'test', ['candidate'], { bare: true }], ['/result/:id', 'result', ['candidate']],
  ['/company', 'companyDashboard', ['company']], ['/company/jobs', 'companyJobs', ['company']], ['/company/tests', 'companyTests', ['company']],
  ['/company/candidates', 'companyCandidates', ['company']], ['/company/candidates/:id', 'companyCandidate', ['company']], ['/company/settings', 'companySettings', ['company']],
  ['/admin', 'adminDashboard', ['admin']], ['/admin/companies', 'adminCompanies', ['admin']], ['/admin/users', 'adminUsers', ['admin']], ['/admin/catalog', 'adminCatalog', ['admin']],
].map(([path, page, roles, opts = {}]) => ({ path, page, roles, opts, re: new RegExp('^' + path.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$') }));

const cleanups = [];
let token = 0;

export const navigate = (path) => { location.hash = '#' + path; };

function parse() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  return { path: path.replace(/\/+$/, '') || '/', query: Object.fromEntries(new URLSearchParams(qs || '')) };
}

export async function render() {
  const my = ++token;
  cleanups.splice(0).forEach((f) => { try { f(); } catch {} });
  destroyCharts();
  const { path, query } = parse();
  const route = ROUTES.find((r) => r.re.test(path));
  const view = document.getElementById('view');
  const nav = document.getElementById('nav'), footer = document.getElementById('footer');

  if (!route) {
    nav.innerHTML = renderNav(); footer.innerHTML = renderFooter();
    view.innerHTML = html`<div class="container py-5 text-center page-enter"><h1 class="display-1 fw-800 text-violet">404</h1><h3>Sahifa topilmadi</h3><p class="text-muted">Siz izlagan sahifa mavjud emas yoki ko'chirilgan.</p><a href="#/" class="btn btn-primary">Bosh sahifaga qaytish</a></div>`.s;
    return;
  }
  const user = session.user;
  if (route.roles) {
    if (!user || !session.token) { toast('Davom etish uchun tizimga kiring', 'warning'); return navigate('/login?next=' + encodeURIComponent(path)); }
    if (!route.roles.includes(user.role)) { toast("Bu sahifaga kirish huquqingiz yo'q", 'error'); return navigate(dashHome(user.role).slice(1)); }
  }
  if (route.opts.mode && user && session.token) return navigate(dashHome(user.role).slice(1));

  nav.innerHTML = route.opts.bare ? '' : renderNav();
  footer.innerHTML = route.opts.bare ? '' : renderFooter();
  view.innerHTML = `<div class="container">${skeletonPage()}</div>`;
  window.scrollTo(0, 0);

  const ctx = {
    params: route.re.exec(path).groups || {}, query, opts: route.opts, root: view, path,
    render: (safe) => { if (my === token) view.innerHTML = safe.toString(); },
    isCurrent: () => my === token,
    cleanup: (f) => cleanups.push(f),
  };
  try {
    const mod = await import(`./pages/${route.page}.js`);
    await mod.default(ctx);
  } catch (e) {
    console.error(e);
    if (my !== token) return;
    view.innerHTML = html`<div class="container py-5 text-center"><i class="bi bi-exclamation-octagon display-3 text-warning"></i><h3 class="mt-3">Xatolik yuz berdi</h3><p class="text-muted">${e.message}</p><button class="btn btn-primary" onclick="location.reload()">Qayta yuklash</button></div>`.s;
  }
}

export function logout() {
  session.clear();
  toast('Tizimdan chiqdingiz', 'info');
  navigate('/');
  render();
}

