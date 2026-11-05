// Kategoriyalar (kasblar) va texnologiyalar boshqaruvi
import { api } from '../api.js';
import { html, skeletonCards, toast, modal, confirmDialog, withBusy, empty } from '../ui.js';
import { dash, pageHead } from '../components/layout.js';

export default async function (ctx) {
  ctx.render(dash('admin', html`${pageHead('Kategoriya va texnologiyalar')}${skeletonCards(2, 'col-md-6')}`));
  let cats = [], techs = [], activeCat = '';
  async function load() {
    try { [cats, techs] = await Promise.all([api.get('/public/categories'), api.get('/public/technologies')]); } catch (e) { return toast(e.message, 'error'); }
    draw();
  }
  function draw() {
    if (!ctx.isCurrent()) return;
    const list = techs.filter((t) => !activeCat || String(t.category_id) === String(activeCat));
    ctx.render(dash('admin', html`${pageHead('Kategoriya va texnologiyalar', "Kasblar va test texnologiyalari ro'yxatini boshqaring. Yangi kasblar (marketing, moliya...) shu yerdan qo'shiladi.")}
      <div class="row g-4"><div class="col-lg-5"><div class="card-sp card-pad"><div class="d-flex justify-content-between mb-3"><div class="card-title-sm mb-0">Kategoriyalar (kasblar)</div><button class="btn btn-sm btn-primary" id="addC"><i class="bi bi-plus"></i> Qo'shish</button></div>
        ${cats.map((c) => html`<div class="d-flex align-items-center gap-2 p-2 rounded-3 ${String(activeCat) === String(c.id) ? 'bg-light' : ''}"><i class="bi ${c.icon} text-violet fs-5"></i><a href="#" class="flex-grow-1 fw-semibold text-reset" data-pick="${c.id}">${c.name}</a>
          <span class="chip">${techs.filter((t) => t.category_id === c.id).length} tex.</span><button class="btn btn-sm btn-light-soft" data-ec="${c.id}"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-light-soft text-danger" data-dc="${c.id}"><i class="bi bi-trash"></i></button></div>`)}</div></div>
      <div class="col-lg-7"><div class="card-sp card-pad"><div class="d-flex justify-content-between mb-3 flex-wrap gap-2"><div class="card-title-sm mb-0">Texnologiyalar <span class="chip chip-violet">${list.length}</span></div>
        <div class="d-flex gap-2"><button class="btn btn-sm btn-light-soft ${activeCat ? '' : 'd-none'}" data-pick="">Filtrni tozalash</button><button class="btn btn-sm btn-primary" id="addT"><i class="bi bi-plus"></i> Texnologiya qo'shish</button></div></div>
        ${list.length ? html`<div class="d-flex flex-wrap gap-2">${list.map((t) => html`<span class="chip py-2 px-3">${t.name}<small class="text-muted ms-1">${t.category || ''}</small><a href="#" class="ms-2 text-muted" data-et="${t.id}"><i class="bi bi-pencil"></i></a><a href="#" class="ms-1 text-danger" data-dt="${t.id}"><i class="bi bi-x-lg"></i></a></span>`)}</div>` : empty('bi-tags', "Texnologiya yo'q", '')}</div></div></div>`));
    const $$ = (s) => ctx.root.querySelectorAll(s);
    $$('[data-pick]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); activeCat = a.dataset.pick; draw(); }));
    ctx.root.querySelector('#addC').onclick = () => catForm();
    ctx.root.querySelector('#addT').onclick = () => techForm();
    $$('[data-ec]').forEach((b) => (b.onclick = () => catForm(cats.find((c) => c.id === +b.dataset.ec))));
    $$('[data-et]').forEach((b) => (b.onclick = (e) => { e.preventDefault(); techForm(techs.find((t) => t.id === +b.dataset.et)); }));
    $$('[data-dc]').forEach((b) => (b.onclick = async () => { if (await confirmDialog("Kategoriya o'chirilsinmi? Unga tegishli ish o'rinlari kategoriyasiz qoladi.", "O'chirish", true)) { await api.del('/admin/categories/' + b.dataset.dc); toast("Kategoriya o'chirildi"); load(); } }));
    $$('[data-dt]').forEach((b) => (b.onclick = async (e) => { e.preventDefault(); if (await confirmDialog("Texnologiya o'chirilsa, unga bog'liq savollar va talablar ham o'chadi. Davom etasizmi?", "O'chirish", true)) { await api.del('/admin/technologies/' + b.dataset.dt); toast("Texnologiya o'chirildi"); load(); } }));
  }
  function catForm(c) {
    const m = modal({ title: c ? 'Kategoriyani tahrirlash' : "Yangi kategoriya", body: html`<div class="mb-3"><label class="form-label">Nomi *</label><input class="form-control" id="n" value="${c?.name || ''}" maxlength="120" placeholder="Masalan: Marketing"></div>
      <div class="mb-3"><label class="form-label">Ikonka (Bootstrap Icons klassi)</label><input class="form-control" id="i" value="${c?.icon || 'bi-briefcase'}" placeholder="bi-megaphone"></div>`,
      footer: html`<button class="btn btn-light-soft" data-bs-dismiss="modal">Bekor qilish</button><button class="btn btn-primary" id="ok">Saqlash</button>` });
    m.el.querySelector('#ok').onclick = (e) => withBusy(e.currentTarget, async () => { try { const b = { name: m.el.querySelector('#n').value, icon: m.el.querySelector('#i').value }; c ? await api.put('/admin/categories/' + c.id, b) : await api.post('/admin/categories', b); toast('Saqlandi'); m.close(); load(); } catch (er) { toast(er.message, 'error'); } });
  }
  function techForm(t) {
    const m = modal({ title: t ? 'Texnologiyani tahrirlash' : 'Yangi texnologiya', body: html`<div class="mb-3"><label class="form-label">Nomi *</label><input class="form-control" id="n" value="${t?.name || ''}" maxlength="120"></div>
      <div class="mb-3"><label class="form-label">Kategoriya</label><select class="form-select" id="c"><option value="">—</option>${cats.map((c) => html`<option value="${c.id}" ${(t?.category_id ?? activeCat) == c.id ? 'selected' : ''}>${c.name}</option>`)}</select></div>`,
      footer: html`<button class="btn btn-light-soft" data-bs-dismiss="modal">Bekor qilish</button><button class="btn btn-primary" id="ok">Saqlash</button>` });
    m.el.querySelector('#ok').onclick = (e) => withBusy(e.currentTarget, async () => { try { const b = { name: m.el.querySelector('#n').value, category_id: m.el.querySelector('#c').value }; t ? await api.put('/admin/technologies/' + t.id, b) : await api.post('/admin/technologies', b); toast('Saqlandi'); m.close(); load(); } catch (er) { toast(er.message, 'error'); } });
  }
  load();
}

