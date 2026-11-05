import { api } from '../api.js';
import { html, toast, fmtDateTime, empty, QTYPE, skeletonPage } from '../ui.js';
import { resultView, afterResult } from '../components/resultView.js';

export default async function (ctx) {
  let r;
  try { r = await api.get('/candidate/attempts/' + ctx.params.id); } catch (e) { return ctx.render(html`<div class="container py-5">${empty('bi-x-circle', 'Natija topilmadi', e.message)}<div class="text-center"><a class="btn btn-primary" href="#/candidate">Panelga qaytish</a></div></div>`); }
  if (r.status !== 'done') return (location.hash = '#/test/' + ctx.params.id);
  ctx.render(html`<div class="container py-5 page-enter">
    <div class="page-head"><div><a href="#/candidate/history" class="small text-muted"><i class="bi bi-arrow-left"></i> Testlar tarixi</a><h1 class="mt-1">Test natijalari</h1>
      <p>${r.job.title} · ${r.job.company_name} · ${fmtDateTime(r.finished_at)}</p></div>
      <div class="d-flex gap-2 flex-wrap"><button class="btn btn-primary" id="pdf"><i class="bi bi-file-earmark-pdf me-1"></i>PDF yuklab olish</button><a class="btn btn-light-soft" href="#/jobs/${r.job.id}">Qayta topshirish</a></div></div>
    ${resultView(r, html`<div class="card-sp card-pad mb-4"><div class="row g-3 text-center">
      <div class="col-6 col-md-3"><div class="text-muted small">Minimal ball</div><div class="fs-4 fw-bold">${r.job.min_score}</div></div>
      <div class="col-6 col-md-3"><div class="text-muted small">Sizning ballingiz</div><div class="fs-4 fw-bold ${r.total_score >= r.job.min_score ? 'text-success' : 'text-warning'}">${Math.round(r.total_score)}</div></div>
      <div class="col-6 col-md-3"><div class="text-muted small">To'g'ri / noto'g'ri</div><div class="fs-4 fw-bold">${r.correct} / ${r.wrong}</div></div>
      <div class="col-6 col-md-3"><div class="text-muted small">Kompaniya qarori</div><div class="fs-6 fw-bold mt-2">${{ pending: 'Kutilmoqda', hired: 'Qabul qilindi', rejected: 'Rad etildi' }[r.decision]}</div></div></div></div>`)}
    <div class="card-sp card-pad mt-4"><div class="card-title-sm">Savollar bo'yicha natija</div><div class="table-responsive"><table class="table mb-0"><thead><tr><th>#</th><th>Savol</th><th>Texnologiya</th><th>Tur</th><th class="text-end">Natija</th></tr></thead><tbody>
      ${r.review.map((q, i) => html`<tr><td>${i + 1}</td><td>${q.text}</td><td><span class="chip">${q.tech || '—'}</span></td><td class="small text-muted">${QTYPE[q.type]}</td>
        <td class="text-end">${q.score >= 0.6 ? html`<span class="text-success fw-bold"><i class="bi bi-check-circle-fill"></i> To'g'ri</span>` : q.score > 0 ? html`<span class="text-warning fw-bold"><i class="bi bi-dash-circle-fill"></i> Qisman (${Math.round(q.score * 100)}%)</span>` : html`<span class="text-danger fw-bold"><i class="bi bi-x-circle-fill"></i> Noto'g'ri</span>`}</td></tr>`)}</tbody></table></div>
      <div class="small text-muted mt-3"><i class="bi bi-shield-lock me-1"></i>Test savollarining to'g'ri javoblari himoya maqsadida ko'rsatilmaydi.</div></div></div>`);
  afterResult(ctx.root, r);
  ctx.root.querySelector('#pdf').onclick = async () => { try { await api.download(`/candidate/attempts/${r.id}/pdf`, `skillproof-natija-${r.id}.pdf`); toast('PDF yuklab olindi'); } catch (e) { toast(e.message, 'error'); } };
}

