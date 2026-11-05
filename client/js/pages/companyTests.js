// Test yaratish sahifasi: kompaniya o'z savollari va dasturlash topshiriqlarini qo'shadi
import { api } from '../api.js';
import { html, raw, skeletonCards, toast, withBusy, confirmDialog, empty, QTYPE, esc } from '../ui.js';
import { dash, pageHead } from '../components/layout.js';

export default async function (ctx) {
  ctx.render(dash('company', html`${pageHead('Test yaratish')}${skeletonCards(2, 'col-md-6')}`));
  const [techs, jobs] = await Promise.all([api.get('/public/technologies'), api.get('/company/jobs')]).catch((e) => { toast(e.message, 'error'); return []; });
  if (!techs) return;
  let list = [], editing = null, filter = '';

  async function load() { list = await api.get('/company/questions'); drawList(); }

  ctx.render(dash('company', html`${pageHead('Test yaratish', "O'z savollaringiz va dasturlash topshiriqlaringizni qo'shing. Ular lavozim testlariga avtomatik kiradi.")}
    <div class="row g-4"><div class="col-xl-6"><div class="card-sp card-pad"><div class="d-flex justify-content-between"><div class="card-title-sm" id="ftitle">Yangi savol</div><button class="btn btn-sm btn-light-soft d-none" id="cancel">Bekor qilish</button></div>
      <form id="qf" class="row g-3">
        <div class="col-md-6"><label class="form-label">Texnologiya *</label><select class="form-select" name="technology_id" required><option value="">Tanlang...</option>${techs.map((t) => html`<option value="${t.id}">${t.name}</option>`)}</select></div>
        <div class="col-md-6"><label class="form-label">Savol turi *</label><select class="form-select" name="type">${Object.entries(QTYPE).map(([k, v]) => html`<option value="${k}">${v}</option>`)}</select></div>
        <div class="col-md-8"><label class="form-label">Lavozim (ixtiyoriy)</label><select class="form-select" name="job_id"><option value="">Texnologiya bo'yicha umumiy</option>${jobs.map((j) => html`<option value="${j.id}">${j.title} — majburiy kiradi</option>`)}</select></div>
        <div class="col-md-4"><label class="form-label">Ball</label><input type="number" class="form-control" name="points" min="1" max="10" value="1"></div>
        <div class="col-12"><label class="form-label">Savol matni *</label><textarea class="form-control" name="text" rows="2" maxlength="3000" required></textarea></div>
        <div class="col-12 d-none" id="codeSnip"><label class="form-label">Kod parchasi (xatoli kod)</label><textarea class="form-control font-monospace" name="code" rows="4"></textarea></div>
        <div class="col-12" id="dyn"></div>
        <div class="col-12 d-flex justify-content-end"><button class="btn btn-primary" type="submit"><i class="bi bi-check2 me-1"></i><span id="sbtn">Savolni saqlash</span></button></div></form></div></div>
    <div class="col-xl-6"><div class="card-sp card-pad"><div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2"><div class="card-title-sm mb-0">Mening savollarim <span class="chip" id="cnt"></span></div>
      <select class="form-select form-select-sm" style="width:auto" id="flt"><option value="">Barcha turlar</option>${Object.entries(QTYPE).map(([k, v]) => html`<option value="${k}">${v}</option>`)}</select></div><div id="list"></div></div></div></div>`));

  const $ = (s) => ctx.root.querySelector(s);
  const f = $('#qf');

  // ---- Savol turiga qarab dinamik maydonlar ----
  function dyn(type, q = null) {
    const opt = q?.options || ['', '', '', ''];
    let h = '';
    if (type === 'choice' || type === 'debug') h = html`<label class="form-label">Variantlar (to'g'ri javobni belgilang) *</label>${[0, 1, 2, 3].map((i) => html`<div class="input-group mb-2"><div class="input-group-text"><input class="form-check-input mt-0" type="radio" name="ans" value="${i}" ${String(q?.answer) === String(i) ? 'checked' : ''}></div><input class="form-control" data-opt placeholder="Variant ${i + 1}" value="${opt[i] || ''}"></div>`)}`;
    else if (type === 'truefalse') h = html`<label class="form-label">To'g'ri javob *</label><div class="d-flex gap-3"><label><input type="radio" name="ans" value="true" ${q?.answer === 'true' ? 'checked' : ''}> To'g'ri</label><label><input type="radio" name="ans" value="false" ${q?.answer === 'false' ? 'checked' : ''}> Noto'g'ri</label></div>`;
    else if (type === 'short' || type === 'scenario') h = html`<label class="form-label">Kalit so'zlar (har qatorga bittadan) *</label><textarea class="form-control" id="kw" rows="4" placeholder="Masalan:\nfunksiya\ntashqi|ota|lexical">${q ? JSON.parse(q.answer || '[]').join('\n') : ''}</textarea><div class="form-text">Sinonimlar “|” bilan ajratiladi. Ball topilgan kalit so'zlar ulushiga qarab beriladi.</div>`;
    else if (type === 'code') h = html`<div class="alert alert-info py-2 small">Nomzod <code>function solve(...)</code> yozadi. Kod xavfsiz sandbox'da test case'lar bilan tekshiriladi.</div>
      <label class="form-label">Boshlang'ich kod</label><textarea class="form-control font-monospace mb-3" id="starter" rows="3">${q?.starter || 'function solve(a, b) {\n  \n}'}</textarea>
      <label class="form-label">Test case'lar *</label><div id="tests"></div><button type="button" class="btn btn-sm btn-light-soft mt-1" id="addT"><i class="bi bi-plus"></i> Test case qo'shish</button>`;
    $('#dyn').innerHTML = h.toString();
    $('#codeSnip').classList.toggle('d-none', type !== 'debug');
    if (type === 'code') {
      const add = (t = { args: [], expected: '', hidden: false }) => { const d = document.createElement('div'); d.className = 'input-group input-group-sm mb-2';
        d.innerHTML = `<input class="form-control font-monospace" data-a placeholder='Argumentlar JSON: [2, 3]'><input class="form-control font-monospace" data-e placeholder='Kutilgan: 5'><div class="input-group-text" title="Yashirin test"><input type="checkbox" class="form-check-input mt-0" data-h>&nbsp;yashirin</div><button type="button" class="btn btn-outline-danger" data-x><i class="bi bi-x"></i></button>`;
        d.querySelector('[data-a]').value = JSON.stringify(t.args); d.querySelector('[data-e]').value = t.expected === '' ? '' : JSON.stringify(t.expected); d.querySelector('[data-h]').checked = !!t.hidden;
        d.querySelector('[data-x]').onclick = () => d.remove(); $('#tests').appendChild(d); };
      (q?.tests?.length ? q.tests : [{ args: [1, 2], expected: 3 }, { args: [5, 5], expected: 10, hidden: true }]).forEach(add);
      $('#addT').onclick = () => add();
    }
  }
  f.type.onchange = () => dyn(f.type.value);
  dyn('choice');

  function collect() {
    const type = f.type.value;
    const body = { technology_id: +f.technology_id.value, type, job_id: f.job_id.value || null, points: +f.points.value, text: f.text.value, code: f.code.value, language: 'javascript' };
    if (type === 'choice' || type === 'debug') { body.options = [...ctx.root.querySelectorAll('[data-opt]')].map((i) => i.value.trim()); body.answer = ctx.root.querySelector('[name=ans]:checked')?.value ?? ''; body.options = body.options.map((o) => o); }
    else if (type === 'truefalse') body.answer = ctx.root.querySelector('[name=ans]:checked')?.value ?? '';
    else if (type === 'short' || type === 'scenario') body.answer = $('#kw').value.split('\n').map((s) => s.trim()).filter(Boolean);
    else if (type === 'code') {
      body.starter = $('#starter').value;
      body.tests = [...ctx.root.querySelectorAll('#tests > div')].map((d) => {
        try { return { args: JSON.parse(d.querySelector('[data-a]').value || '[]'), expected: JSON.parse(d.querySelector('[data-e]').value), hidden: d.querySelector('[data-h]').checked }; }
        catch { throw new Error("Test case'dagi JSON noto'g'ri. Masalan argumentlar: [2, 3], kutilgan: 5 yoki \"matn\""); }
      });
    }
    return body;
  }

  function reset() { editing = null; f.reset(); dyn('choice'); $('#ftitle').textContent = 'Yangi savol'; $('#cancel').classList.add('d-none'); $('#sbtn').textContent = 'Savolni saqlash'; }
  $('#cancel').onclick = reset;
  f.onsubmit = (e) => { e.preventDefault(); withBusy(f.querySelector('[type=submit]'), async () => {
    try {
      const body = collect();
      if (body.type === 'choice' || body.type === 'debug') { body.options = body.options.filter(Boolean).length === body.options.length ? body.options : body.options; }
      editing ? await api.put('/company/questions/' + editing, body) : await api.post('/company/questions', body);
      toast(editing ? 'Savol yangilandi' : "Savol qo'shildi"); reset(); await load();
    } catch (er) { toast(er.message, 'error'); } }); };

  function edit(q) {
    editing = q.id; $('#ftitle').textContent = `Savolni tahrirlash #${q.id}`; $('#cancel').classList.remove('d-none'); $('#sbtn').textContent = 'Yangilash';
    f.technology_id.value = q.technology_id; f.type.value = q.type; f.job_id.value = q.job_id || ''; f.points.value = q.points; f.text.value = q.text; f.code.value = q.code || '';
    dyn(q.type, q); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function drawList() {
    const rows = list.filter((q) => !filter || q.type === filter);
    $('#cnt').textContent = rows.length;
    $('#list').innerHTML = rows.length ? html`<div style="max-height:720px;overflow:auto">${rows.map((q) => html`<div class="p-3 border rounded-3 mb-2"><div class="d-flex justify-content-between gap-2"><div><span class="chip chip-violet me-1">${q.tech}</span><span class="chip">${QTYPE[q.type]}</span>
      ${q.job_title ? html`<span class="chip">${q.job_title}</span>` : ''}</div><div class="text-nowrap"><button class="btn btn-sm btn-light-soft" data-e="${q.id}"><i class="bi bi-pencil"></i></button> <button class="btn btn-sm btn-light-soft text-danger" data-d="${q.id}"><i class="bi bi-trash"></i></button></div></div>
      <div class="mt-2 fw-semibold small">${q.text}</div></div>`)}</div>`.s : empty('bi-patch-question', "Savollar yo'q", "Chap tomondagi forma orqali birinchi savolni qo'shing.").s;
    $('#list').querySelectorAll('[data-e]').forEach((b) => (b.onclick = () => edit(list.find((q) => q.id === +b.dataset.e))));
    $('#list').querySelectorAll('[data-d]').forEach((b) => (b.onclick = async () => { if (await confirmDialog("Savol o'chirilsinmi?", "O'chirish", true)) { try { await api.del('/company/questions/' + b.dataset.d); toast("Savol o'chirildi"); load(); } catch (e) { toast(e.message, 'error'); } } }));
  }
  $('#flt').onchange = (e) => { filter = e.target.value; drawList(); };
  load();
}

