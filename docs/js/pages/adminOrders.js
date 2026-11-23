import { api } from '../api.js';
import { html, skeletonCards, toast, statusBadge, fmtDateTime, empty } from '../ui.js';
import { dash, pageHead } from '../components/layout.js';

const NAMES = { hr_vip: 'HR-Recruiting VIP (30 kun)', pro: 'PRO Nomzod (30 kun)' };

export default async function (ctx) {
  ctx.render(dash('admin', html`${pageHead("To'lovlar")}${skeletonCards(3)}`));
  let rows = [];
  async function load() { try { rows = await api.get('/billing/admin/orders'); } catch (e) { return toast(e.message, 'error'); } draw(); }
  function draw() {
    if (!ctx.isCurrent()) return;
    ctx.render(dash('admin', html`${pageHead("To'lovlar", "Buyurtmalar. To'lov kartaga tushganini tekshirib, «Faollashtirish» ni bosing")}
      <div class="card-sp">${rows.length ? html`<div class="table-responsive"><table class="table table-hover mb-0"><thead><tr><th>Kod</th><th>Foydalanuvchi</th><th>Xizmat</th><th>Summa</th><th>Sana</th><th>Holat</th><th></th></tr></thead><tbody>
        ${rows.map((o) => html`<tr><td class="font-monospace fw-bold">${o.code}</td><td class="small">${o.email}</td><td>${NAMES[o.product] || o.product}</td><td>${Number(o.amount).toLocaleString('ru-RU')} so'm</td><td class="small">${fmtDateTime(o.created_at)}</td>
          <td>${o.status === 'active' ? html`<span class="badge text-bg-success">Faol</span>` : html`<span class="badge text-bg-warning">Kutilmoqda</span>`}</td>
          <td class="text-end">${o.status === 'pending' ? html`<button class="btn btn-sm btn-success" data-a="${o.id}"><i class="bi bi-check-lg"></i> Faollashtirish</button>` : ''}</td></tr>`)}</tbody></table></div>` : empty('bi-receipt', "Buyurtmalar yo'q", '')}</div>`));
    ctx.root.querySelectorAll('[data-a]').forEach((b) => (b.onclick = async () => {
      try { await api.put(`/billing/admin/orders/${b.dataset.a}/activate`, {}); toast('Faollashtirildi'); load(); } catch (e) { toast(e.message, 'error'); }
    }));
  }
  load();
}
