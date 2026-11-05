import { api } from '../api.js';
import { html, skeletonCards, empty, debounce } from '../ui.js';
import { jobCard } from '../components/cards.js';

export default async function (ctx) {
  const cats = await api.get('/public/categories').catch(() => []);
  ctx.render(html`<div class="container py-5 page-enter">
    <div class="section-head mb-4 text-start mx-0"><span class="eyebrow">Vakansiyalar</span><h2>Ish o'rinlari</h2><p>Lavozimni tanlang va bilimingizni sinab ko'ring.</p></div>
    <div class="card-sp filter-bar mb-4"><div class="input-group" style="max-width:420px;flex:1"><span class="input-group-text bg-white"><i class="bi bi-search"></i></span><input id="q" class="form-control" placeholder="Lavozim yoki kompaniya nomi..."></div>
      <select id="cat" class="form-select" style="max-width:260px"><option value="">Barcha yo'nalishlar</option>${cats.map((c) => html`<option value="${c.id}" ${String(c.id) === ctx.query.category ? 'selected' : ''}>${c.name}</option>`)}</select>
      <span class="ms-auto text-muted small" id="count"></span></div>
    <div id="list">${skeletonCards(6)}</div></div>`);
  const $ = (s) => ctx.root.querySelector(s);
  const load = async () => {
    $('#list').innerHTML = skeletonCards(3).s;
    try {
      const rows = await api.get(`/public/jobs?q=${encodeURIComponent($('#q').value)}&category=${$('#cat').value}`);
      if (!ctx.isCurrent()) return;
      $('#count').textContent = `${rows.length} ta vakansiya`;
      $('#list').innerHTML = rows.length ? html`<div class="row g-4">${rows.map((j) => html`<div class="col-md-6 col-lg-4">${jobCard(j)}</div>`)}</div>`.s : empty('bi-briefcase', "Ish o'rni topilmadi", "Boshqa yo'nalish yoki kalit so'z bilan urinib ko'ring.").s;
    } catch (e) { $('#list').innerHTML = empty('bi-wifi-off', "Yuklab bo'lmadi", e.message).s; }
  };
  $('#q').addEventListener('input', debounce(load));
  $('#cat').addEventListener('change', load);
  load();
}

