import { api } from '../api.js';
import { html, skeletonCards, toast, confirmDialog, logo, statusBadge, fmtDate, empty, debounce } from '../ui.js';
import { dash, pageHead } from '../components/layout.js';

export default async function (ctx) {
  ctx.render(dash('admin', html`${pageHead('Kompaniyalar')}${skeletonCards(3)}`));
  let rows = [], flt = '', q = '';
  async function load() { try { rows = await api.get('/admin/companies'); } catch (e) { return toast(e.message, 'error'); } draw(); }
  function draw() {
    if (!ctx.isCurrent()) return;
    const r = rows.filter((c) => (!flt || c.status === flt) && c.name.toLowerCase().includes(q.toLowerCase()));
    ctx.render(dash('admin', html`${pageHead('Kompaniyalar', 'Kompaniyalarni tasdiqlash, bloklash va nazorat qilish')}
      <div class="card-sp filter-bar mb-3"><input class="form-control" style="max-width:280px" id="q" placeholder="Kompaniya qidirish..." value="${q}"><div class="nav nav-pills nav-pills-sp gap-1">
        ${[['', 'Barchasi'], ['pending', 'Kutilmoqda'], ['approved', 'Tasdiqlangan'], ['blocked', 'Bloklangan']].map(([k, l]) => html`<button class="nav-link ${flt === k ? 'active' : ''}" data-f="${k}">${l}</button>`)}</div></div>
      <div class="card-sp">${r.length ? html`<div class="table-responsive"><table class="table table-hover mb-0"><thead><tr><th>Kompaniya</th><th>Egasi</th><th>Soha</th><th>Ish o'rinlari</th><th>Testlar</th><th>Sana</th><th>Holat</th><th></th></tr></thead><tbody>
        ${r.map((c) => html`<tr><td><div class="d-flex align-items-center gap-2">${logo(c.name, c.logo, 'sm')}<b>${c.name}</b></div></td><td class="small">${c.owner_email}</td><td class="small">${c.industry || '—'}</td><td>${c.jobs}</td><td>${c.tests}</td><td class="small text-muted">${fmtDate(c.created_at)}</td><td>${statusBadge(c.status)}</td>
          <td class="text-end text-nowrap">${c.status !== 'approved' ? html`<button class="btn btn-sm btn-success" data-s="${c.id}|approved"><i class="bi bi-check-lg"></i> Tasdiqlash</button>` : ''}
            ${c.status !== 'blocked' ? html`<button class="btn btn-sm btn-outline-danger" data-s="${c.id}|blocked"><i class="bi bi-slash-circle"></i> Bloklash</button>` : html`<button class="btn btn-sm btn-light-soft" data-s="${c.id}|pending">Blokdan chiqarish</button>`}</td></tr>`)}</tbody></table></div>`
        : empty('bi-buildings', 'Kompaniya topilmadi', '')}</div>`));
    const $ = (s) => ctx.root.querySelector(s);
    $('#q').oninput = debounce((e) => { q = e.target.value; draw(); $('#q').focus(); $('#q').setSelectionRange(q.length, q.length); }, 250);
    ctx.root.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { flt = b.dataset.f; draw(); }));
    ctx.root.querySelectorAll('[data-s]').forEach((b) => (b.onclick = async () => {
      const [id, st] = b.dataset.s.split('|');
      if (st === 'blocked' && !(await confirmDialog('Kompaniya bloklansa, uning vakansiyalari yashiriladi va xodimlari tizimga kira olmaydi. Davom etasizmi?', 'Bloklash', true))) return;
      try { await api.put(`/admin/companies/${id}/status`, { status: st }); toast({ approved: 'Kompaniya tasdiqlandi', blocked: 'Kompaniya bloklandi', pending: 'Blok olib tashlandi' }[st]); load(); } catch (e) { toast(e.message, 'error'); }
    }));
  }
  load();
}

