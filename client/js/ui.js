// UI yordamchilari: xavfsiz HTML shablon, toast, skeleton, diagramma, modal
class Safe { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Safe(s);
const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => MAP[c]);
const val = (v) => (v instanceof Safe ? v.s : Array.isArray(v) ? v.map(val).join('') : v === false || v == null ? '' : esc(v));
/** Tagged template: barcha qiymatlar avtomatik escape qilinadi (XSS himoyasi) */
export const html = (strings, ...vals) => new Safe(strings.reduce((a, s, i) => a + s + (i < vals.length ? val(vals[i]) : ''), ''));

export const VERDICT = {
  full: ["Talablarga to'liq mos", 'bi-patch-check-fill'],
  interview: ['Suhbatga tavsiya etiladi', 'bi-chat-dots-fill'],
  review: ["Qo'shimcha tekshiruv talab etiladi", 'bi-search'],
  no: ['Hozircha talabga mos emas', 'bi-x-octagon-fill'],
};
export const DECISION = { pending: 'Kutilmoqda', hired: 'Qabul qilindi', rejected: 'Rad etildi' };
export const STATUS = { pending: 'Tasdiq kutilmoqda', approved: 'Tasdiqlangan', blocked: 'Bloklangan', active: 'Faol' };
export const ROLE = { candidate: 'Nomzod', company: 'Kompaniya', admin: 'Super Admin' };
export const QTYPE = { choice: 'Variantli', truefalse: "To'g'ri/Noto'g'ri", short: 'Qisqa javob', debug: 'Xatoni topish', scenario: 'Vaziyat', code: 'Dasturlash' };

export const verdictBadge = (v) => (v && VERDICT[v] ? html`<span class="badge-soft ${v}"><i class="bi ${VERDICT[v][1]} me-1"></i>${VERDICT[v][0]}</span>` : html`<span class="badge-soft pending">—</span>`);
export const statusBadge = (s, map = STATUS) => html`<span class="badge-soft ${s}">${map[s] || s}</span>`;

const COLORS = ['#4285f4', '#7c3aed', '#12b76a', '#0ea5e9', '#f59e0b', '#ef4444', '#14235c', '#db2777'];
export const colorFor = (s) => COLORS[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
export const initials = (s) => String(s || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
export const logo = (name, src, size = '') => (src
  ? html`<div class="logo ${size}"><img src="${src}" alt="${name}"></div>`
  : html`<div class="logo ${size}" style="background:linear-gradient(135deg,${colorFor(name)},${colorFor(name + 'x')})">${initials(name)}</div>`);
export const avatar = (f, l) => html`<div class="avatar">${initials(`${f} ${l}`)}</div>`;

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const scoreColor = (s, req) => (req != null ? (s >= req ? 'ok' : 'warn') : s >= 70 ? 'ok' : s >= 50 ? '' : 'warn');

export const bar = (score, required = null) => html`<div class="progress-sp"><div class="bar ${scoreColor(score, required)}" data-w="${score}"></div>${required != null ? html`<div class="mark" style="left:${required}%" title="Talab: ${required}"></div>` : ''}</div>`;
export function animateBars(root) { requestAnimationFrame(() => requestAnimationFrame(() => root.querySelectorAll('.bar[data-w]').forEach((b) => (b.style.width = b.dataset.w + '%')))); }

// ---- Skeleton ----
export const skeletonCards = (n = 3, cols = 'col-md-6 col-lg-4') => html`<div class="row g-4">${Array.from({ length: n }, () => html`<div class="${cols}"><div class="card-sp card-pad">
  <div class="d-flex gap-3 mb-3"><div class="skeleton circle"></div><div class="flex-grow-1"><div class="skeleton title"></div><div class="skeleton line w-75"></div></div></div>
  <div class="skeleton line"></div><div class="skeleton line w-50"></div></div></div>`)}</div>`;
export const skeletonPage = () => html`<div class="py-4">${skeletonCards(3)}<div class="skeleton block mt-4"></div></div>`;
export const empty = (icon, title, text = '') => html`<div class="empty"><i class="bi ${icon}"></i><h5>${title}</h5><p>${text}</p></div>`;

// ---- Toast ----
export function toast(message, type = 'success', ms = 3800) {
  const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
  const el = document.createElement('div');
  el.className = `sp-toast ${type}`;
  el.innerHTML = `<i class="bi ${icons[type] || icons.info}"></i><div class="flex-grow-1 small fw-semibold"></div>`;
  el.lastChild.textContent = message;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, ms);
}

// ---- Diagrammalar (Chart.js) ----
const charts = [];
export function destroyCharts() { while (charts.length) charts.pop().destroy(); }
export function chart(canvas, config) {
  if (!canvas || !window.Chart) return null;
  Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
  Chart.defaults.color = '#667085';
  const c = new Chart(canvas, { ...config, options: { responsive: true, maintainAspectRatio: false, ...(config.options || {}) } });
  charts.push(c);
  return c;
}
export const PALETTE = ['#14235c', '#7c3aed', '#12b76a', '#f5a524', '#0ea5e9', '#e5484d', '#db2777', '#64748b'];

// ---- Modal ----
export function modal({ title, body, size = '', footer = '' }) {
  const el = document.createElement('div');
  el.className = 'modal fade';
  el.tabIndex = -1;
  el.innerHTML = `<div class="modal-dialog modal-dialog-centered ${size}"><div class="modal-content">
    <div class="modal-header border-0 pb-0"><h5 class="modal-title"></h5><button class="btn-close" data-bs-dismiss="modal" aria-label="Yopish"></button></div>
    <div class="modal-body"></div>${footer ? '<div class="modal-footer border-0"></div>' : ''}</div></div>`;
  el.querySelector('.modal-title').textContent = title;
  el.querySelector('.modal-body').innerHTML = body.toString();
  if (footer) el.querySelector('.modal-footer').innerHTML = footer.toString();
  document.body.appendChild(el);
  const m = new bootstrap.Modal(el);
  el.addEventListener('hidden.bs.modal', () => { m.dispose(); el.remove(); });
  m.show();
  return { el, close: () => m.hide() };
}
export function confirmDialog(message, okText = 'Ha, tasdiqlayman', danger = false) {
  return new Promise((resolve) => {
    let done = false;
    const m = modal({ title: 'Tasdiqlang', body: html`<p class="mb-0">${message}</p>`, footer: html`<button class="btn btn-light-soft" data-bs-dismiss="modal">Bekor qilish</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="ok">${okText}</button>` });
    m.el.querySelector('#ok').onclick = () => { done = true; resolve(true); m.close(); };
    m.el.addEventListener('hidden.bs.modal', () => !done && resolve(false));
  });
}

/** Tugmani yuklanish holatiga o'tkazib, async amalni bajaradi */
export async function withBusy(btn, fn) {
  if (!btn) return fn();
  const old = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Kuting...';
  try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = old; }
}
export const formData = (form) => Object.fromEntries(new FormData(form));
export const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

