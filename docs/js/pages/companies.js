import { api } from '../api.js';
import { html, skeletonCards, empty, debounce } from '../ui.js';
import { companyCard } from '../components/cards.js';

export default async function (ctx) {
  const industries = ['', 'Axborot texnologiyalari', 'Fintech', 'Dizayn va kreativ', 'Mobil ilovalar', 'Bulutli xizmatlar va DevOps'];
  ctx.render(html`<div class="container py-5 page-enter">
    <div class="section-head mb-4 text-start mx-0"><span class="eyebrow">Kompaniyalar</span><h2>Hamkor kompaniyalar</h2><p>Orzuingizdagi kompaniyani toping va ochiq vakansiyalarini ko'ring.</p></div>
    <div class="card-sp filter-bar mb-4"><div class="input-group" style="max-width:420px;flex:1"><span class="input-group-text bg-white"><i class="bi bi-search"></i></span><input id="q" class="form-control" placeholder="Kompaniya nomi yoki tavsif bo'yicha qidirish..." value="${ctx.query.q || ''}"></div>
      <select id="ind" class="form-select" style="max-width:260px">${industries.map((i) => html`<option value="${i}">${i || 'Barcha sohalar'}</option>`)}</select>
      <span class="ms-auto text-muted small" id="count"></span></div>
    <div id="list">${skeletonCards(6)}</div></div>`);
  const $ = (s) => ctx.root.querySelector(s);
  const load = async () => {
    const q = $('#q').value, industry = $('#ind').value;
    $('#list').innerHTML = skeletonCards(3).s;
    try {
      const rows = await api.get(`/public/companies?q=${encodeURIComponent(q)}&industry=${encodeURIComponent(industry)}`);
      if (!ctx.isCurrent()) return;
      $('#count').textContent = `${rows.length} ta kompaniya`;
      $('#list').innerHTML = rows.length ? html`<div class="row g-4">${rows.map((c) => html`<div class="col-md-6 col-lg-4">${companyCard(c)}</div>`)}</div>`.s : empty('bi-search', 'Kompaniya topilmadi', "Qidiruv shartlarini o'zgartirib ko'ring.").s;
    } catch (e) { $('#list').innerHTML = empty('bi-wifi-off', 'Yuklab bo\'lmadi', e.message).s; }
  };
  $('#q').addEventListener('input', debounce(load));
  $('#ind').addEventListener('change', load);
  load();
}

