import { api } from '../api.js?v=10';
import { html, skeletonCards, toast, withBusy, fmtDateTime, empty } from '../ui.js';
import { dash, pageHead, statCard } from '../components/layout.js?v=10';

const CARD_STORAGE_KEY = 'sp_owner_visa_card';

function getCardConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(CARD_STORAGE_KEY) || 'null');
    if (saved) return saved;
  } catch {}
  return { number: '', holder: 'OLIMAXON (SKILLPROVE.UZ)', telegram: 'https://t.me/skillprove_uz' };
}

export default async function (ctx) {
  ctx.render(dash('admin', html`${pageHead("To'lovlar va Buyurtmalar", "Foydalanuvchilar va kompaniyalar buyurtmalarini tasdiqlash hamda 30 kunga faollashtirish")}${skeletonCards(3)}`));

  let orders = [];
  async function load() {
    try { orders = await api.get('/admin/orders'); } catch (e) { return toast(e.message, 'error'); }
    draw();
  }

  function draw() {
    if (!ctx.isCurrent()) return;
    const card = getCardConfig();
    const pending = orders.filter((o) => o.status === 'pending').length;
    const active = orders.filter((o) => o.status === 'active').length;

    ctx.render(dash('admin', html`
      ${pageHead("To'lovlar va Buyurtmalar", "Kelib tushgan to'lov cheklarini tekshirib, PRO, Sertifikat yoki HR-Recruiting huquqini 1-klikda faollashtiring")}

      <div class="row g-3 mb-4">
        <div class="col-md-4">${statCard('bi-receipt', 'navy', orders.length, 'Jami buyurtmalar')}</div>
        <div class="col-md-4">${statCard('bi-hourglass-split', 'yellow', pending, 'Tasdiq kutilmoqda')}</div>
        <div class="col-md-4">${statCard('bi-check2-circle', 'green', active, 'Faollashtirilgan (30 kun)')}</div>
      </div>

      <!-- Visa / Humo Karta Sozlamasi -->
      <div class="card-sp card-pad mb-4" style="background:linear-gradient(135deg,#f5f3ff,#fdf2f8);border:1.5px solid #c4b5fd;">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <div>
            <span class="badge bg-violet text-white mb-1"><i class="bi bi-credit-card-2-front me-1"></i>TO'LOV REKVIZITLARI SOZLAMASI</span>
            <h5 class="fw-bold mb-0 text-navy">Qabul qiluvchi Visa / Humo karta va Telegram</h5>
          </div>
          <span class="small text-muted">Faqat 16 xonali karta raqami yoziladi (CVV/muddat hech qachon yozilmaydi)</span>
        </div>
        <form id="card-form" class="row g-2 mt-1">
          <div class="col-md-4">
            <label class="form-label small fw-bold">16 xonali Visa / Humo karta raqami</label>
            <input class="form-control" id="c-num" placeholder="Masalan: 4278 1234 5678 9012" value="${card.number || ''}">
          </div>
          <div class="col-md-4">
            <label class="form-label small fw-bold">Karta egasining Ism-Familiyasi</label>
            <input class="form-control" id="c-holder" placeholder="OLIMAXON (SKILLPROVE.UZ)" value="${card.holder || ''}">
          </div>
          <div class="col-md-4">
            <label class="form-label small fw-bold">Chek yuboriladigan Telegram manzil</label>
            <div class="input-group">
              <input class="form-control" id="c-tg" placeholder="https://t.me/username" value="${card.telegram || ''}">
              <button class="btn btn-primary fw-bold" type="submit"><i class="bi bi-check2 me-1"></i>Saqlash</button>
            </div>
          </div>
        </form>
      </div>

      <!-- Buyurtmalar Jadvali -->
      <div class="card-sp">
        ${orders.length ? html`<div class="table-responsive"><table class="table table-hover align-middle mb-0">
          <thead><tr><th>Buyurtma kodi</th><th>Xizmat / Tarif</th><th>Mijoz / Kompaniya</th><th>Summa</th><th>Sana</th><th>Holat</th><th class="text-end">Amal</th></tr></thead>
          <tbody>
            ${orders.map((o) => html`<tr>
              <td><span class="badge bg-dark font-monospace fs-6">${o.code}</span></td>
              <td class="fw-bold">${o.plan_title}</td>
              <td class="small">${o.contact}</td>
              <td class="fw-bold text-navy">${o.amount}</td>
              <td class="small text-muted">${fmtDateTime(o.created_at)}</td>
              <td>
                ${o.status === 'active'
                  ? html`<span class="badge-soft approved"><i class="bi bi-check-circle-fill me-1"></i>Faol (30 kun)</span>`
                  : o.status === 'rejected'
                  ? html`<span class="badge-soft blocked">Rad etilgan</span>`
                  : html`<span class="badge-soft pending"><i class="bi bi-clock-history me-1"></i>Tasdiq kutilmoqda</span>`}
              </td>
              <td class="text-end">
                ${o.status === 'pending' ? html`
                  <button class="btn btn-sm btn-success fw-bold me-1" data-act="${o.id}"><i class="bi bi-check-lg me-1"></i>Faollashtirish</button>
                  <button class="btn btn-sm btn-outline-danger" data-rej="${o.id}"><i class="bi bi-x-lg"></i></button>
                ` : html`<span class="small text-muted">${o.activated_at ? fmtDateTime(o.activated_at) : '—'}</span>`}
              </td>
            </tr>`)}
          </tbody>
        </table></div>` : empty('bi-receipt', 'Buyurtmalar yo\'q', 'Foydalanuvchilar tarif tanlaganda buyurtmalar shu yerda paydo bo\'ladi.')}
      </div>
    `));

    const $ = (s) => ctx.root.querySelector(s);
    $('#card-form').onsubmit = (e) => {
      e.preventDefault();
      localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify({
        number: $('#c-num').value.trim(),
        holder: $('#c-holder').value.trim() || 'OLIMAXON (SKILLPROVE.UZ)',
        telegram: $('#c-tg').value.trim() || 'https://t.me/skillprove_uz'
      }));
      toast("To'lov kartasi va Telegram manzili saqlandi!", 'success');
    };

    ctx.root.querySelectorAll('[data-act]').forEach((b) => {
      b.onclick = () => withBusy(b, async () => {
        try {
          const r = await api.post(`/admin/orders/${b.dataset.act}/activate`);
          toast(`Buyurtma ${r.order.code} 30 kunga muvaffaqiyatli faollashtirildi!`, 'success');
          load();
        } catch (e) { toast(e.message, 'error'); }
      });
    });

    ctx.root.querySelectorAll('[data-rej]').forEach((b) => {
      b.onclick = () => withBusy(b, async () => {
        try {
          await api.post(`/admin/orders/${b.dataset.rej}/reject`);
          toast('Buyurtma bekor qilindi', 'info');
          load();
        } catch (e) { toast(e.message, 'error'); }
      });
    });
  }

  load();
}
