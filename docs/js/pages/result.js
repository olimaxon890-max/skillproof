import { api } from '../api.js?v=10';
import { html, raw, toast, fmtDateTime, fmtDate, empty, QTYPE, withBusy } from '../ui.js';
import { resultView, afterResult } from '../components/resultView.js';
import { renderQrSvg } from './verify.js?v=10';

export default async function (ctx) {
  let r;
  try { r = await api.get('/candidate/attempts/' + ctx.params.id); } catch (e) { return ctx.render(html`<div class="container py-5">${empty('bi-x-circle', 'Natija topilmadi', e.message)}<div class="text-center"><a class="btn btn-primary" href="#/candidate">Panelga qaytish</a></div></div>`); }
  if (r.status !== 'done') return (location.hash = '#/test/' + ctx.params.id);

  const certId = r.cert_id || ('SP-2026-' + String(r.id).padStart(4, '0'));
  const passed = r.total_score >= 50 && !(r.summary || '').includes('TEST BLOKLANDI');
  const unlocked = !!(r.cert_unlocked || r.is_pro);

  ctx.render(html`<div class="container py-5 page-enter">
    <div class="page-head"><div><a href="#/candidate/history" class="small text-muted"><i class="bi bi-arrow-left"></i> Testlar tarixi</a><h1 class="mt-1">Test natijalari ${r.is_pro ? html`<span class="badge bg-warning text-dark fs-6 ms-2">⭐ PRO</span>` : ''}</h1>
      <p>${r.job.title} · ${r.job.company_name} · ${fmtDateTime(r.finished_at)}</p></div>
      <div class="d-flex gap-2 flex-wrap">
        <a class="btn btn-outline-primary" href="#/verify/${certId}"><i class="bi bi-qr-code-scan me-1"></i>Sertifikatni tekshirish (${certId})</a>
        <button class="btn btn-primary" id="pdf"><i class="bi bi-file-earmark-pdf me-1"></i>PDF yuklab olish</button>
        <a class="btn btn-light-soft" href="#/jobs/${r.job.id}">Qayta topshirish</a>
      </div></div>

    ${resultView(r, html`<div class="card-sp card-pad mb-4"><div class="row g-3 text-center">
      <div class="col-6 col-md-3"><div class="text-muted small">Minimal ball</div><div class="fs-4 fw-bold">${r.job.min_score}</div></div>
      <div class="col-6 col-md-3"><div class="text-muted small">Sizning ballingiz</div><div class="fs-4 fw-bold ${r.total_score >= r.job.min_score ? 'text-success' : 'text-warning'}">${Math.round(r.total_score)}</div></div>
      <div class="col-6 col-md-3"><div class="text-muted small">To'g'ri / noto'g'ri</div><div class="fs-4 fw-bold">${r.correct} / ${r.wrong}</div></div>
      <div class="col-6 col-md-3"><div class="text-muted small">Kompaniya qarori</div><div class="fs-6 fw-bold mt-2">${{ pending: 'Kutilmoqda', hired: 'Qabul qilindi', rejected: 'Rad etildi' }[r.decision]}</div></div></div></div>`)}

    <!-- 1-YO'L: RASMIY QR-SERTIFIKAT VA BATAFSIL TAHLIL -->
    ${passed ? html`
      <div class="card-sp p-4 p-lg-5 mt-4 position-relative overflow-hidden" style="border:2px solid ${unlocked ? '#10b981' : '#7c3aed'};background:linear-gradient(135deg,#ffffff 0%,#f5f3ff 60%,#ecfdf5 100%);">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <span class="badge ${unlocked ? 'bg-success' : 'bg-violet'} text-white px-3 py-2 rounded-pill mb-2">
              <i class="bi ${unlocked ? 'bi-patch-check-fill' : 'bi-award-fill'} me-1"></i>
              ${unlocked ? 'RASMIY QR-SERTIFIKAT FAOLLASHTIRILGAN' : 'RASMIY QR-SERTIFIKAT VA EKSPERT TAHLILI'}
            </span>
            <h3 class="fw-bold text-navy mb-1">${r.candidate_name || 'Nomzod'} — Malaka Sertifikati</h3>
            <p class="text-muted mb-2">${r.job.title} (${r.job.company_name}) · Umumiy ko'rsatkich: <b>${Math.round(r.total_score)}/100 ball</b></p>
            <div class="small">
              <b>Sertifikat ID:</b> <span class="font-monospace fw-bold text-violet">${certId}</span> &nbsp;|&nbsp;
              <b>Tekshiruv manzili:</b> <a href="#/verify/${certId}" class="fw-bold">skillprove.uz/#/verify/${certId}</a>
            </div>
          </div>
          <div class="text-center">
            ${raw(renderQrSvg(`https://skillprove.uz/#/verify/${certId}`, 104))}
            <div class="font-monospace small fw-bold text-navy mt-1">${certId}</div>
          </div>
        </div>

        <hr class="my-4">

        <h5 class="fw-bold text-navy mb-3"><i class="bi bi-graph-up-arrow text-violet me-2"></i>Texnologiyalar bo'yicha Batafsil Ekspert Tahlili</h5>
        ${unlocked ? html`
          <div class="row g-3">
            ${(r.deep_analysis || []).map((d) => html`
              <div class="col-md-6">
                <div class="p-3 rounded-3 bg-white border h-100">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="fw-bold text-navy fs-6">${d.tech}</span>
                    <span class="badge ${d.score >= 75 ? 'bg-success' : 'bg-warning text-dark'}">${d.score}% · ${d.level}</span>
                  </div>
                  <div class="small mb-2"><i class="bi bi-check-circle-fill text-success me-1"></i><b>Kuchli tomon:</b> ${d.strength_detail}</div>
                  <div class="small mb-2"><i class="bi bi-exclamation-circle-fill text-warning me-1"></i><b>Rivojlantirish kerak:</b> ${d.gap_detail}</div>
                  <div class="small text-muted"><i class="bi bi-book-half text-violet me-1"></i><b>Tavsiya:</b> ${d.recommended_study}</div>
                </div>
              </div>
            `)}
          </div>
        ` : html`
          <div class="p-4 rounded-4 bg-white border text-center">
            <i class="bi bi-lock-fill fs-2 text-violet"></i>
            <h6 class="fw-bold mt-2">Chuqur texnik diagnostika va QR-sertifikatni to'liq faollashtirish</h6>
            <p class="small text-muted mb-3">Har bir texnologiya bo'yicha kuchli va oqsagan mavzular tahlili, o'rganish rejasi hamda QR-sertifikatni ochish uchun buyurtma bering (yoki ⭐ PRO obunani yoqing).</p>
            <div class="d-flex justify-content-center gap-2 flex-wrap">
              <button class="btn btn-primary fw-bold" id="order-cert"><i class="bi bi-award-fill me-1"></i>Sertifikat + Tahlil buyurtma qilish (25 000 so'm)</button>
              <a href="#/pricing" class="btn btn-violet fw-bold"><i class="bi bi-gem me-1"></i>⭐ PRO obuna (Barcha sertifikatlar bepul)</a>
            </div>
            <div id="cert-order-box" class="alert alert-success mt-3 mb-0 d-none text-start small"></div>
          </div>
        `}
      </div>
    ` : ''}

    <div class="card-sp card-pad mt-4"><div class="card-title-sm">Savollar bo'yicha natija</div><div class="table-responsive"><table class="table mb-0"><thead><tr><th>#</th><th>Savol</th><th>Texnologiya</th><th>Tur</th><th class="text-end">Natija</th></tr></thead><tbody>
      ${r.review.map((q, i) => html`<tr><td>${i + 1}</td><td>${q.text}</td><td><span class="chip">${q.tech || '—'}</span></td><td class="small text-muted">${QTYPE[q.type]}</td>
        <td class="text-end">${q.score >= 0.6 ? html`<span class="text-success fw-bold"><i class="bi bi-check-circle-fill"></i> To'g'ri</span>` : q.score > 0 ? html`<span class="text-warning fw-bold"><i class="bi bi-dash-circle-fill"></i> Qisman (${Math.round(q.score * 100)}%)</span>` : html`<span class="text-danger fw-bold"><i class="bi bi-x-circle-fill"></i> Noto'g'ri</span>`}</td></tr>`)}</tbody></table></div>
      <div class="small text-muted mt-3"><i class="bi bi-shield-lock me-1"></i>Imtihon savollarining to'g'ri javoblari savollar banki xavfsizligini ta'minlash maqsadida oshkor etilmaydi; buning o'rniga yuqorida texnologiyalar bo'yicha chuqur tahlil taqdim etiladi.</div></div></div>`);

  afterResult(ctx.root, r);
  ctx.root.querySelector('#pdf').onclick = async () => { try { await api.download(`/candidate/attempts/${r.id}/pdf`, `skillprove-sertifikat-${certId}.pdf`); toast('PDF tayyor'); } catch (e) { toast(e.message, 'error'); } };

  const ordBtn = ctx.root.querySelector('#order-cert');
  if (ordBtn) {
    ordBtn.onclick = () => withBusy(ordBtn, async () => {
      try {
        const ord = await api.post('/orders', {
          plan_key: 'cert',
          plan_title: `🏅 Rasmiy QR-Sertifikat (${certId}) + Batafsil Tahlil`,
          amount: "25 000 so'm",
          attempt_id: r.id
        });
        const box = ctx.root.querySelector('#cert-order-box');
        box.innerHTML = `<b>✔ Buyurtma qabul qilindi!</b> Sizning buyurtma kodingiz: <span class="badge bg-dark font-monospace">${ord.code}</span>. To'lov chekini ushbu kod bilan yuboring — Super Admin <b>To'lovlar (#/admin/payments)</b> bo'limidan faollashtirishi bilan tahlil qulfdan ochiladi.`;
        box.classList.remove('d-none');
        toast(`Buyurtma ${ord.code} yaratildi!`, 'success');
      } catch (e) { toast(e.message, 'error'); }
    });
  }
}
