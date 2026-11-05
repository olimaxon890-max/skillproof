import { api } from '../api.js';
import { html, skeletonCards, toast, modal, chart, PALETTE, fmtDate, verdictBadge, avatar, empty, statusBadge, DECISION, VERDICT } from '../ui.js';
import { dash, pageHead } from '../components/layout.js';

export default async function (ctx) {
  ctx.render(dash('company', html`${pageHead('Nomzodlar')}${skeletonCards(3)}`));
  const jobs = await api.get('/company/jobs').catch(() => []);
  let jobId = ctx.query.job || '', rows = [], sort = 'score', verdict = '', sel = new Set();

  async function load() {
    try { rows = await api.get('/company/candidates' + (jobId ? '?job_id=' + jobId : '')); } catch (e) { return toast(e.message, 'error'); }
    sel.clear(); draw();
  }

  function view() {
    let r = rows.filter((x) => !verdict || x.verdict === verdict);
    if (sort === 'score') r = [...r].sort((a, b) => b.total_score - a.total_score);
    if (sort === 'date') r = [...r].sort((a, b) => String(b.finished_at).localeCompare(a.finished_at));
    if (sort === 'name') r = [...r].sort((a, b) => a.first_name.localeCompare(b.first_name));
    return r;
  }

  function draw() {
    if (!ctx.isCurrent()) return;
    const r = view();
    ctx.render(dash('company', html`${pageHead('Nomzodlar', "Test topshirgan nomzodlarni saralang, solishtiring va qaror qabul qiling", html`<button class="btn btn-light-soft" id="cmp"><i class="bi bi-bar-chart-steps me-1"></i>Solishtirish (<span id="sc">${sel.size}</span>)</button><button class="btn btn-primary" id="csv"><i class="bi bi-download me-1"></i>Hisobot (CSV)</button>`)}
      <div class="card-sp filter-bar mb-3"><select class="form-select" style="max-width:240px" id="job"><option value="">Barcha lavozimlar</option>${jobs.map((j) => html`<option value="${j.id}" ${String(j.id) === String(jobId) ? 'selected' : ''}>${j.title}</option>`)}</select>
        <select class="form-select" style="max-width:260px" id="vf"><option value="">Barcha xulosalar</option>${Object.entries(VERDICT).map(([k, v]) => html`<option value="${k}" ${k === verdict ? 'selected' : ''}>${v[0]}</option>`)}</select>
        <select class="form-select" style="max-width:200px" id="sort"><option value="score" ${sort === 'score' ? 'selected' : ''}>Ball bo'yicha (yuqori)</option><option value="date" ${sort === 'date' ? 'selected' : ''}>Sana bo'yicha</option><option value="name" ${sort === 'name' ? 'selected' : ''}>Ism bo'yicha</option></select>
        <span class="ms-auto small text-muted">${r.length} ta nomzod</span></div>
      <div class="card-sp">${r.length ? html`<div class="table-responsive"><table class="table table-hover mb-0"><thead><tr><th style="width:36px"></th><th>#</th><th>Nomzod</th><th>Lavozim</th><th>Ball</th><th>Texnologiyalar</th><th>Xulosa</th><th>Qaror</th><th></th></tr></thead><tbody>
        ${r.map((c, i) => html`<tr><td><input type="checkbox" class="form-check-input" data-s="${c.id}" ${sel.has(c.id) ? 'checked' : ''}></td><td class="fw-bold text-muted">${sort === 'score' && !verdict ? (i < 3 ? html`<i class="bi bi-trophy-fill" style="color:${['#f5a524', '#98a2b3', '#b9772f'][i]}"></i>` : i + 1) : i + 1}</td>
          <td><div class="d-flex align-items-center gap-2">${avatar(c.first_name, c.last_name)}<div><div class="fw-semibold">${c.first_name} ${c.last_name}</div><small class="text-muted">${c.email}</small></div></div></td>
          <td class="small">${c.job_title}<div class="text-muted">${fmtDate(c.finished_at)}</div></td><td><span class="fs-5 fw-bold">${Math.round(c.total_score)}</span></td>
          <td class="small" style="min-width:150px">${c.tech_scores.slice(0, 4).map((t) => html`<span class="chip me-1 mb-1" style="${t.met === false ? 'background:#fff2d9;color:#93570a' : ''}">${t.name} ${t.score}</span>`)}</td>
          <td>${verdictBadge(c.verdict)}</td><td>${statusBadge(c.decision, DECISION)}${c.human_score != null ? html`<div class="small text-muted mt-1">Baho: ${c.human_score}</div>` : ''}</td>
          <td class="text-end"><a class="btn btn-sm btn-primary" href="#/company/candidates/${c.id}">Ko'rish</a></td></tr>`)}</tbody></table></div>`
        : empty('bi-people', "Nomzodlar topilmadi", "Nomzodlar test topshirgach, natijalari shu yerda paydo bo'ladi.")}</div>`));
    const $ = (s) => ctx.root.querySelector(s);
    $('#job').onchange = (e) => { jobId = e.target.value; load(); };
    $('#vf').onchange = (e) => { verdict = e.target.value; draw(); };
    $('#sort').onchange = (e) => { sort = e.target.value; draw(); };
    ctx.root.querySelectorAll('[data-s]').forEach((c) => (c.onchange = () => { c.checked ? sel.add(+c.dataset.s) : sel.delete(+c.dataset.s); $('#sc').textContent = sel.size; }));
    $('#csv').onclick = async () => { try { await api.download('/company/candidates.csv' + (jobId ? '?job_id=' + jobId : ''), 'skillproof-nomzodlar.csv'); toast('Hisobot yuklab olindi'); } catch (e) { toast(e.message, 'error'); } };
    $('#cmp').onclick = compare;
  }

  function compare() {
    const picked = rows.filter((x) => sel.has(x.id));
    if (picked.length < 2) return toast('Solishtirish uchun kamida 2 ta nomzodni belgilang', 'warning');
    if (picked.length > 6) return toast('Eng ko\'pi bilan 6 ta nomzodni solishtirish mumkin', 'warning');
    const techs = [...new Set(picked.flatMap((p) => p.tech_scores.map((t) => t.name)))];
    const m = modal({ title: 'Nomzodlarni solishtirish', size: 'modal-xl modal-dialog-scrollable', body: html`<div class="row g-4"><div class="col-lg-6"><div class="chart-box"><canvas id="cc"></canvas></div></div>
      <div class="col-lg-6"><div class="table-responsive"><table class="table table-sm"><thead><tr><th>Texnologiya</th>${picked.map((p) => html`<th>${p.first_name}</th>`)}</tr></thead><tbody>
        <tr class="fw-bold"><td>Umumiy ball</td>${picked.map((p) => html`<td>${Math.round(p.total_score)}</td>`)}</tr>
        ${techs.map((t) => html`<tr><td>${t}</td>${picked.map((p) => { const s = p.tech_scores.find((x) => x.name === t); return html`<td class="${s?.met === false ? 'text-warning fw-bold' : ''}">${s ? s.score : '—'}</td>`; })}</tr>`)}
        <tr><td>Amaliy %</td>${picked.map((p) => html`<td>${p.practical_score ?? '—'}</td>`)}</tr><tr><td>Xulosa</td>${picked.map((p) => html`<td class="small">${VERDICT[p.verdict][0]}</td>`)}</tr></tbody></table></div></div></div>` });
    m.el.addEventListener('shown.bs.modal', () => chart(m.el.querySelector('#cc'), { type: 'bar', data: { labels: techs, datasets: picked.map((p, i) => ({ label: `${p.first_name} ${p.last_name}`, data: techs.map((t) => p.tech_scores.find((x) => x.name === t)?.score ?? 0), backgroundColor: PALETTE[i % PALETTE.length], borderRadius: 6 })) }, options: { scales: { y: { min: 0, max: 100 } }, plugins: { legend: { position: 'bottom' } } } }));
  }
  draw();
  if (jobId) load();
  else { rows = await api.get('/company/candidates').catch(() => []); draw(); }
}

