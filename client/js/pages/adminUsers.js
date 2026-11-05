import { api, session } from '../api.js';
import { html, skeletonCards, toast, confirmDialog, statusBadge, fmtDate, empty, avatar, ROLE, debounce } from '../ui.js';
import { dash, pageHead } from '../components/layout.js';

export default async function (ctx) {
  ctx.render(dash('admin', html`${pageHead('Foydalanuvchilar')}${skeletonCards(3)}`));
  let rows = [], role = '', q = '';
  async function load() { try { rows = await api.get('/admin/users'); } catch (e) { return toast(e.message, 'error'); } draw(); }
  function draw() {
    if (!ctx.isCurrent()) return;
    const r = rows.filter((u) => (!role || u.role === role) && `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q.toLowerCase()));
    ctx.render(dash('admin', html`${pageHead('Foydalanuvchilar', `Jami ${rows.length} ta foydalanuvchi`)}
      <div class="card-sp filter-bar mb-3"><input class="form-control" style="max-width:280px" id="q" placeholder="Ism yoki email..." value="${q}"><div class="nav nav-pills nav-pills-sp gap-1">
        ${[['', 'Barchasi'], ['candidate', 'Nomzodlar'], ['company', 'Kompaniya xodimlari'], ['admin', 'Adminlar']].map(([k, l]) => html`<button class="nav-link ${role === k ? 'active' : ''}" data-f="${k}">${l}</button>`)}</div></div>
      <div class="card-sp">${r.length ? html`<div class="table-responsive"><table class="table table-hover mb-0"><thead><tr><th>Foydalanuvchi</th><th>Rol</th><th>Kompaniya</th><th>Ro'yxatdan o'tgan</th><th>Holat</th><th></th></tr></thead><tbody>
        ${r.map((u) => html`<tr><td><div class="d-flex align-items-center gap-2">${avatar(u.first_name, u.last_name)}<div><div class="fw-semibold">${u.first_name} ${u.last_name}</div><small class="text-muted">${u.email}</small></div></div></td>
          <td><span class="chip ${u.role === 'admin' ? 'chip-violet' : ''}">${ROLE[u.role]}</span></td><td class="small">${u.company_name || '—'}</td><td class="small text-muted">${fmtDate(u.created_at)}</td><td>${statusBadge(u.status)}</td>
          <td class="text-end">${u.role === 'admin' ? '' : u.status === 'active' ? html`<button class="btn btn-sm btn-outline-danger" data-b="${u.id}|blocked">Bloklash</button>` : html`<button class="btn btn-sm btn-light-soft" data-b="${u.id}|active">Faollashtirish</button>`}</td></tr>`)}</tbody></table></div>` : empty('bi-people', 'Foydalanuvchi topilmadi', '')}</div>`));
    const $ = (s) => ctx.root.querySelector(s);
    $('#q').oninput = debounce((e) => { q = e.target.value; draw(); $('#q').focus(); $('#q').setSelectionRange(q.length, q.length); }, 250);
    ctx.root.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { role = b.dataset.f; draw(); }));
    ctx.root.querySelectorAll('[data-b]').forEach((b) => (b.onclick = async () => {
      const [id, st] = b.dataset.b.split('|');
      if (st === 'blocked' && !(await confirmDialog('Foydalanuvchi bloklansa, tizimga kira olmaydi. Davom etasizmi?', 'Bloklash', true))) return;
      try { await api.put(`/admin/users/${id}/status`, { status: st }); toast(st === 'blocked' ? 'Foydalanuvchi bloklandi' : 'Foydalanuvchi faollashtirildi'); load(); } catch (e) { toast(e.message, 'error'); }
    }));
  }
  load();
}

