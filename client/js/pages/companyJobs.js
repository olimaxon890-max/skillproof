import { api } from '../api.js';
import { html, skeletonCards, toast, modal, withBusy, confirmDialog, empty, statusBadge, esc } from '../ui.js';
import { dash, pageHead } from '../components/layout.js';

export default async function (ctx) {
  ctx.render(dash('company', html`${pageHead("Ish o'rinlari")}${skeletonCards(3)}`));
  const [cats, techs] = await Promise.all([api.get('/public/categories'), api.get('/public/technologies')]).catch((e) => { toast(e.message, 'error'); return []; });
  if (!cats) return;

  async function load() {
    let jobs;
    try { jobs = await api.get('/company/jobs'); } catch (e) { return toast(e.message, 'error'); }
    if (!ctx.isCurrent()) return;
    ctx.render(dash('company', html`${pageHead("Ish o'rinlari", "Vakansiyalar, talablar va minimal ballarni boshqaring", html`<button class="btn btn-primary" id="new"><i class="bi bi-plus-lg me-1"></i>Yangi ish o'rni</button>`)}
      ${jobs.length ? html`<div class="row g-4">${jobs.map((j) => html`<div class="col-lg-6"><div class="card-sp card-pad h-100"><div class="d-flex justify-content-between align-items-start gap-2 mb-2"><div><h5 class="mb-1">${j.title}</h5><span class="chip chip-violet">${j.category || 'Kategoriyasiz'}</span></div>
        <span class="badge-soft ${j.status === 'open' ? 'active' : 'pending'}">${j.status === 'open' ? 'Ochiq' : 'Yopiq'}</span></div>
        <div class="d-flex flex-wrap gap-1 my-2">${j.requirements.map((r) => html`<span class="chip">${r.name} <b>${r.min_score}+</b></span>`)}</div>
        <div class="d-flex flex-wrap gap-3 small text-muted mb-3"><span><i class="bi bi-bullseye me-1"></i>Min. ${j.min_score}</span><span><i class="bi bi-stopwatch me-1"></i>${j.duration_min} daq.</span><span><i class="bi bi-people me-1"></i>${j.candidates} nomzod</span></div>
        <div class="d-flex gap-2"><a class="btn btn-sm btn-light-soft" href="#/company/candidates?job=${j.id}"><i class="bi bi-people"></i> Nomzodlar</a><button class="btn btn-sm btn-light-soft" data-edit="${j.id}"><i class="bi bi-pencil"></i> Tahrirlash</button>
          <button class="btn btn-sm btn-light-soft text-danger ms-auto" data-del="${j.id}"><i class="bi bi-trash"></i></button></div></div></div>`)}</div>`
        : empty('bi-briefcase', "Hali ish o'rni yo'q", "“Yangi ish o'rni” tugmasi orqali birinchi vakansiyani yarating.")}`));
    ctx.root.querySelector('#new').onclick = () => form(null);
    ctx.root.querySelectorAll('[data-edit]').forEach((b) => (b.onclick = () => form(jobs.find((j) => j.id === +b.dataset.edit))));
    ctx.root.querySelectorAll('[data-del]').forEach((b) => (b.onclick = async () => {
      if (await confirmDialog("Ish o'rni va unga tegishli nomzod natijalari o'chiriladi. Davom etasizmi?", "Ha, o'chirish", true)) {
        try { await api.del('/company/jobs/' + b.dataset.del); toast("Ish o'rni o'chirildi"); load(); } catch (e) { toast(e.message, 'error'); }
      }
    }));
  }

  function form(job) {
    const sel = new Map((job?.requirements || []).map((r) => [r.id, r.min_score]));
    const groups = cats.map((c) => [c.name, techs.filter((t) => t.category_id === c.id)]).filter(([, l]) => l.length);
    const m = modal({ title: job ? "Ish o'rnini tahrirlash" : "Yangi ish o'rni", size: 'modal-lg modal-dialog-scrollable', body: html`<form id="jf" class="row g-3">
      <div class="col-md-8"><label class="form-label">Lavozim nomi *</label><input class="form-control" name="title" value="${job?.title || ''}" required maxlength="150" placeholder="Masalan: Frontend Developer"></div>
      <div class="col-md-4"><label class="form-label">Holati</label><select class="form-select" name="status"><option value="open" ${job?.status !== 'closed' ? 'selected' : ''}>Ochiq</option><option value="closed" ${job?.status === 'closed' ? 'selected' : ''}>Yopiq</option></select></div>
      <div class="col-md-6"><label class="form-label">Yo'nalish</label><select class="form-select" name="category_id"><option value="">Tanlang...</option>${cats.map((c) => html`<option value="${c.id}" ${job?.category_id === c.id ? 'selected' : ''}>${c.name}</option>`)}</select></div>
      <div class="col-md-6"><label class="form-label">Maosh</label><input class="form-control" name="salary" value="${job?.salary || ''}" placeholder="$1000 - $2000"></div>
      <div class="col-12"><label class="form-label">Tavsif</label><textarea class="form-control" rows="3" name="description" maxlength="4000">${job?.description || ''}</textarea></div>
      <div class="col-md-4"><label class="form-label">Minimal umumiy ball</label><input type="number" min="0" max="100" class="form-control" name="min_score" value="${job?.min_score ?? 70}"></div>
      <div class="col-md-4"><label class="form-label">Test davomiyligi (daqiqa)</label><input type="number" min="5" max="240" class="form-control" name="duration_min" value="${job?.duration_min ?? 30}"></div>
      <div class="col-md-4"><label class="form-label">Har texnologiyadan savollar</label><input type="number" min="1" max="15" class="form-control" name="questions_per_tech" value="${job?.questions_per_tech ?? 4}"></div>
      <div class="col-12"><label class="form-label">Kerakli texnologiyalar va minimal ballar *</label><div class="border rounded-3 p-3" style="max-height:260px;overflow:auto">
        ${groups.map(([g, list]) => html`<div class="small fw-bold text-muted mb-2">${g}</div><div class="row g-2 mb-3">${list.map((t) => html`<div class="col-md-6"><div class="d-flex align-items-center gap-2 p-2 rounded-3 border">
          <input class="form-check-input mt-0" type="checkbox" data-t="${t.id}" id="t${t.id}" ${sel.has(t.id) ? 'checked' : ''}><label for="t${t.id}" class="flex-grow-1 small fw-semibold">${t.name}</label>
          <input type="number" min="0" max="100" class="form-control form-control-sm" style="width:72px" data-s="${t.id}" value="${sel.get(t.id) ?? 70}" ${sel.has(t.id) ? '' : 'disabled'}></div></div>`)}</div>`)}</div></div>
      <div class="alert alert-warning py-2 small d-none" id="err"></div></form>`, footer: html`<button class="btn btn-light-soft" data-bs-dismiss="modal">Bekor qilish</button><button class="btn btn-primary" id="save">Saqlash</button>` });
    const f = m.el.querySelector('#jf');
    f.querySelectorAll('[data-t]').forEach((c) => (c.onchange = () => (f.querySelector(`[data-s="${c.dataset.t}"]`).disabled = !c.checked)));
    m.el.querySelector('#save').onclick = (e) => withBusy(e.currentTarget, async () => {
      const requirements = [...f.querySelectorAll('[data-t]:checked')].map((c) => ({ technology_id: +c.dataset.t, min_score: +f.querySelector(`[data-s="${c.dataset.t}"]`).value }));
      const body = Object.fromEntries(new FormData(f)); body.requirements = requirements;
      if (!body.title.trim()) return err('Lavozim nomini kiriting');
      if (!requirements.length) return err('Kamida bitta texnologiya tanlang');
      try { job ? await api.put('/company/jobs/' + job.id, body) : await api.post('/company/jobs', body); toast("Ish o'rni saqlandi"); m.close(); load(); } catch (er) { err(er.message); }
    });
    const err = (t) => { const a = m.el.querySelector('#err'); a.textContent = t; a.classList.remove('d-none'); };
  }
  load();
}

