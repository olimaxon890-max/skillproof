import { api } from '../api.js';
import { html, skeletonCards, toast, withBusy, fmtDateTime, avatar, statusBadge, DECISION, QTYPE, empty, esc } from '../ui.js';
import { dash, pageHead } from '../components/layout.js';
import { resultView, afterResult } from '../components/resultView.js';

export default async function (ctx) {
  ctx.render(dash('company', html`${pageHead('Nomzod natijasi')}${skeletonCards(2, 'col-md-6')}`));
  let a;
  try { a = await api.get('/company/attempts/' + ctx.params.id); } catch (e) { return ctx.render(dash('company', empty('bi-x-circle', 'Natija topilmadi', e.message))); }
  if (!ctx.isCurrent()) return;
  const u = a.user;
  const view = { ...a, total_score: a.total_score, tech_scores: a.tech_scores };
  ctx.render(dash('company', html`<a href="#/company/candidates" class="small text-muted"><i class="bi bi-arrow-left"></i> Nomzodlar</a>
    <div class="page-head mt-2"><div class="d-flex align-items-center gap-3">${avatar(u.first_name, u.last_name)}<div><h1>${u.first_name} ${u.last_name}</h1><p>${a.job.title} · ${fmtDateTime(a.finished_at)}</p></div></div>
      <button class="btn btn-primary" id="pdf"><i class="bi bi-file-earmark-pdf me-1"></i>PDF hisobot</button></div>
    <div class="row g-4 mb-4"><div class="col-lg-8"><div class="card-sp card-pad h-100"><div class="card-title-sm">Aloqa va profil</div><div class="row g-2 small">
      <div class="col-md-6"><i class="bi bi-envelope me-2 text-violet"></i><a href="mailto:${u.email}">${u.email}</a></div><div class="col-md-6"><i class="bi bi-telephone me-2 text-violet"></i>${u.phone || '—'}</div>
      <div class="col-md-6"><i class="bi bi-geo-alt me-2 text-violet"></i>${u.city || '—'}</div><div class="col-md-6"><i class="bi bi-tag me-2 text-violet"></i>${u.direction || '—'}</div>
      <div class="col-12"><i class="bi bi-code-square me-2 text-violet"></i>${u.skills || '—'}</div><div class="col-12 text-muted">${u.bio || ''}</div></div></div></div>
    <div class="col-lg-4"><div class="card-sp card-pad h-100"><div class="card-title-sm">Yakuniy qaror</div>
      <div class="mb-3">${statusBadge(a.decision, DECISION)}</div>
      <form id="df"><label class="form-label">Mutaxassis bahosi (0–100)</label><input type="number" min="0" max="100" class="form-control mb-2" name="human_score" value="${a.human_score ?? ''}" placeholder="Suhbatdan keyingi baho">
        <label class="form-label">Izoh</label><textarea class="form-control mb-3" name="note" rows="2" maxlength="1000">${a.company_note || ''}</textarea>
        <div class="d-flex gap-2"><button type="button" class="btn btn-success flex-grow-1" data-d="hired"><i class="bi bi-check-lg"></i> Qabul qilish</button><button type="button" class="btn btn-outline-danger flex-grow-1" data-d="rejected"><i class="bi bi-x-lg"></i> Rad etish</button></div></form>
      <div class="form-text mt-2">Qaror test natijasi, talablar va sizning shaxsiy bahongizga asoslanadi.</div></div></div></div>
    ${resultView(view)}
    <div class="card-sp card-pad mt-4"><div class="card-title-sm">Savollar bo'yicha natija</div><div class="table-responsive"><table class="table mb-0"><thead><tr><th>#</th><th>Savol</th><th>Texnologiya</th><th>Tur</th><th class="text-end">Ball</th></tr></thead><tbody>
      ${a.review.map((q, i) => html`<tr><td>${i + 1}</td><td>${q.text}${q.response && q.type !== 'code' ? html`<div class="small text-muted mt-1">Javob: ${q.response}</div>` : ''}${q.type === 'code' && q.response ? html`<details class="mt-1"><summary class="small text-violet cursor-pointer">Yuborilgan kod</summary><pre class="q-code mt-2 mb-0">${q.response}</pre></details>` : ''}</td>
        <td><span class="chip">${q.tech || '—'}</span></td><td class="small">${QTYPE[q.type]}</td><td class="text-end fw-bold ${q.score >= 0.6 ? 'text-success' : q.score > 0 ? 'text-warning' : 'text-danger'}">${Math.round(q.score * 100)}%</td></tr>`)}</tbody></table></div></div>`));
  afterResult(ctx.root, view);
  const f = ctx.root.querySelector('#df');
  ctx.root.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => withBusy(b, async () => {
    try { await api.post(`/company/attempts/${a.id}/decision`, { decision: b.dataset.d, human_score: f.human_score.value, note: f.note.value });
      toast(b.dataset.d === 'hired' ? 'Nomzod ishga qabul qilindi' : 'Nomzod rad etildi', b.dataset.d === 'hired' ? 'success' : 'info'); (await import('../router.js')).render(); } catch (e) { toast(e.message, 'error'); } })));
  ctx.root.querySelector('#pdf').onclick = async () => { try { await api.download(`/company/attempts/${a.id}/pdf`, `nomzod-${a.id}.pdf`); toast('PDF yuklab olindi'); } catch (e) { toast(e.message, 'error'); } };
}

