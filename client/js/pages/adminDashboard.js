import { api } from '../api.js';
import { html, skeletonCards, toast, chart, PALETTE, fmtDateTime } from '../ui.js';
import { dash, pageHead, statCard } from '../components/layout.js';

const ACTIONS = { register: "Ro'yxatdan o'tish", login: 'Tizimga kirish', test_start: 'Test boshlandi', test_finish: 'Test yakunlandi', job_create: "Ish o'rni yaratildi", decision: 'Nomzod bo\'yicha qaror',
  company_status: "Kompaniya holati o'zgardi", user_status: "Foydalanuvchi holati o'zgardi", seed: 'Tizim' };

export default async function (ctx) {
  ctx.render(dash('admin', html`${pageHead('Umumiy statistika')}${skeletonCards(4, 'col-md-6 col-xl-3')}`));
  let s;
  try { s = await api.get('/admin/stats'); } catch (e) { return toast(e.message, 'error'); }
  if (!ctx.isCurrent()) return;
  ctx.render(dash('admin', html`${pageHead('Umumiy statistika', 'Platformadagi barcha faoliyat nazorati', html`<a class="btn btn-primary" href="#/admin/companies">${s.pending ? html`<span class="badge bg-warning text-dark me-1">${s.pending}</span>` : ''}Kompaniyalarni tasdiqlash</a>`)}
    <div class="row g-4 mb-4">
      <div class="col-md-6 col-xl-3">${statCard('bi-people', 'navy', s.users, 'Nomzodlar')}</div><div class="col-md-6 col-xl-3">${statCard('bi-buildings', 'violet', s.companies, 'Kompaniyalar')}</div>
      <div class="col-md-6 col-xl-3">${statCard('bi-briefcase', 'green', s.jobs, "Ish o'rinlari")}</div><div class="col-md-6 col-xl-3">${statCard('bi-clipboard-check', 'yellow', s.tests, 'Topshirilgan testlar')}</div>
      <div class="col-md-6 col-xl-3">${statCard('bi-hourglass-split', 'yellow', s.pending, 'Tasdiq kutayotganlar')}</div><div class="col-md-6 col-xl-3">${statCard('bi-slash-circle', 'navy', s.blocked, 'Bloklangan kompaniyalar')}</div>
      <div class="col-md-6 col-xl-3">${statCard('bi-patch-question', 'violet', s.questions, 'Savollar bazasi')}</div><div class="col-md-6 col-xl-3">${statCard('bi-speedometer2', 'green', s.avgScore, "O'rtacha ball")}</div></div>
    <div class="row g-4 mb-4"><div class="col-lg-5"><div class="card-sp card-pad h-100"><div class="card-title-sm">Vakansiyalar yo'nalishlar bo'yicha</div><div class="chart-box"><canvas id="c1"></canvas></div></div></div>
      <div class="col-lg-7"><div class="card-sp card-pad h-100"><div class="card-title-sm">Oxirgi 14 kun: ro'yxatdan o'tganlar va testlar</div><div class="chart-box"><canvas id="c2"></canvas></div></div></div></div>
    <div class="card-sp card-pad"><div class="card-title-sm">So'nggi faoliyat</div><div class="table-responsive"><table class="table table-sm mb-0"><tbody>${s.activity.map((a) => html`<tr><td class="small text-muted" style="width:150px">${fmtDateTime(a.created_at)}</td><td class="fw-semibold">${ACTIONS[a.action] || a.action}</td><td class="small">${a.details}</td><td class="small text-muted">${a.email || 'tizim'}</td></tr>`)}</tbody></table></div></div>`));
  const $ = (q) => ctx.root.querySelector(q);
  const cats = s.byCategory.filter((c) => c.n > 0);
  chart($('#c1'), { type: 'doughnut', data: { labels: cats.map((c) => c.name), datasets: [{ data: cats.map((c) => c.n), backgroundColor: PALETTE, borderWidth: 0 }] }, options: { cutout: '60%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } } } });
  const days = [...new Set([...s.days, ...s.attemptsByDay].map((d) => d.day))].sort();
  const val = (arr, d) => arr.find((x) => x.day === d)?.n || 0;
  chart($('#c2'), { type: 'line', data: { labels: days.map((d) => d.slice(5)), datasets: [
    { label: "Yangi foydalanuvchilar", data: days.map((d) => val(s.days, d)), borderColor: '#14235c', tension: .4 },
    { label: 'Testlar', data: days.map((d) => val(s.attemptsByDay, d)), borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,.1)', fill: true, tension: .4 }] }, options: { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }, plugins: { legend: { position: 'bottom' } } } });
}

