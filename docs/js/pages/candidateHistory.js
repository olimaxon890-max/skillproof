import { api } from '../api.js';
import { html, skeletonCards, verdictBadge, fmtDateTime, empty, toast, DECISION, statusBadge } from '../ui.js';
import { dash, pageHead } from '../components/layout.js';

export default async function (ctx) {
  ctx.render(dash('candidate', html`${pageHead('Testlar tarixi', 'Barcha urinishlaringiz')}${skeletonCards(3)}`));
  let rows;
  try { rows = await api.get('/candidate/attempts'); } catch (e) { return toast(e.message, 'error'); }
  if (!ctx.isCurrent()) return;
  ctx.render(dash('candidate', html`${pageHead('Testlar tarixi', 'Barcha urinishlaringiz va natijalari')}
    <div class="card-sp">${rows.length ? html`<div class="table-responsive"><table class="table table-hover mb-0"><thead><tr><th>Lavozim</th><th>Kompaniya</th><th>Sana</th><th>Ball</th><th>Xulosa</th><th>Kompaniya qarori</th><th></th></tr></thead><tbody>
      ${rows.map((a) => html`<tr><td class="fw-semibold">${a.title}</td><td>${a.company_name}</td><td class="small text-muted">${fmtDateTime(a.finished_at || a.started_at)}</td>
        <td>${a.status === 'done' ? html`<b>${Math.round(a.total_score)}</b>/100` : '—'}</td><td>${a.status === 'done' ? verdictBadge(a.verdict) : html`<span class="badge-soft pending">Davom etmoqda</span>`}</td>
        <td>${statusBadge(a.decision, DECISION)}</td>
        <td class="text-end text-nowrap">${a.status === 'done' ? html`<a class="btn btn-sm btn-light-soft" href="#/result/${a.id}">Natija</a> <button class="btn btn-sm btn-light-soft" data-pdf="${a.id}" title="PDF yuklab olish"><i class="bi bi-file-earmark-pdf"></i></button>`
          : html`<a class="btn btn-sm btn-primary" href="#/test/${a.id}">Davom ettirish</a>`}</td></tr>`)}</tbody></table></div>`
      : empty('bi-clipboard-x', "Hali test topshirmagansiz", "Vakansiyani tanlab, birinchi testingizni boshlang.")}</div>`));
  ctx.root.querySelectorAll('[data-pdf]').forEach((b) => (b.onclick = async () => {
    try { await api.download(`/candidate/attempts/${b.dataset.pdf}/pdf`, `skillproof-natija-${b.dataset.pdf}.pdf`); toast('PDF yuklab olindi'); } catch (e) { toast(e.message, 'error'); }
  }));
}

