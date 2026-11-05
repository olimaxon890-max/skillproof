import { api } from '../api.js';
import { html, raw, toast, QTYPE, confirmDialog, esc, empty } from '../ui.js';
import { navigate } from '../router.js';
import { codeBox, bindCodeBox } from '../components/codeEditor.js';

export default async function (ctx) {
  const id = ctx.params.id;
  let t;
  try { t = await api.get('/candidate/attempts/' + id); } catch (e) { return ctx.render(html`<div class="container py-5">${empty('bi-x-circle', 'Test topilmadi', e.message)}<div class="text-center"><a class="btn btn-primary" href="#/candidate">Panelga qaytish</a></div></div>`); }
  if (t.status === 'done') return navigate('/result/' + id);
  const sbx = await api.get('/public/sandbox').catch(() => ({ languages: ['javascript'], mode: '' }));

  const qs = t.questions;
  const skew = new Date(t.serverNow).getTime() - Date.now();
  const deadline = new Date(t.deadline).getTime() - skew;
  let cur = 0, finishing = false;
  const answered = (q) => q.response != null && String(q.response).trim() !== '';

  ctx.render(html`<div class="exam-top" style="top:0"><div class="container d-flex align-items-center gap-3 flex-wrap">
      <div class="me-auto"><div class="fw-bold text-navy">${t.job.title}</div><div class="small text-muted">${t.job.company_name} · ${qs.length} ta savol</div></div>
      <span class="small text-muted d-none d-md-inline" id="prog"></span><div class="timer" id="timer"><i class="bi bi-stopwatch me-1"></i><span>--:--</span></div>
      <button class="btn btn-primary" id="finish"><i class="bi bi-flag-fill me-1"></i>Testni yakunlash</button></div></div>
    <div class="container py-4 page-enter"><div class="row g-4"><div class="col-lg-3 order-lg-2"><div class="card-sp card-pad position-sticky" style="top:90px"><div class="card-title-sm">Savollar</div><div class="d-flex flex-wrap gap-2" id="dots"></div>
      <hr><div class="small text-muted"><span class="chip me-1">Javob berilgan</span> <span class="q-dot answered d-inline-grid" style="width:14px;height:14px"></span></div></div></div>
      <div class="col-lg-9"><div id="q"></div></div></div></div>`);
  const $ = (s) => ctx.root.querySelector(s);
  const timers = [];

  // ---- Taymer ----
  const tick = () => {
    const left = Math.max(0, deadline - Date.now());
    const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
    $('#timer span').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    $('#timer').classList.toggle('low', left < 60000);
    if (left <= 0 && !finishing) { toast('Vaqt tugadi! Test avtomatik yakunlanmoqda', 'warning'); finish(true); }
  };
  tick(); const iv = setInterval(tick, 1000); ctx.cleanup(() => clearInterval(iv));

  const saveTimers = {};
  const save = async (q, value) => {
    q.response = value;
    try { await api.post(`/candidate/attempts/${id}/answer`, { question_id: q.id, response: value }); } catch (e) { toast(e.message, 'error'); }
    drawDots();
  };

  function drawDots() {
    $('#dots').innerHTML = qs.map((q, i) => `<div class="q-dot ${answered(q) ? 'answered' : ''} ${i === cur ? 'current' : ''}" data-i="${i}">${i + 1}</div>`).join('');
    $('#dots').querySelectorAll('[data-i]').forEach((d) => (d.onclick = () => go(+d.dataset.i)));
    $('#prog').textContent = `${qs.filter(answered).length}/${qs.length} javob berildi`;
  }

  function go(i) { cur = Math.max(0, Math.min(qs.length - 1, i)); draw(); }

  function draw() {
    const q = qs[cur];
    const body = {
      choice: () => q.options.map((o, i) => `<label class="option-card ${q.response === String(i) ? 'selected' : ''}"><input type="radio" name="o" value="${i}" ${q.response === String(i) ? 'checked' : ''}><span>${esc(o)}</span></label>`).join(''),
      get debug() { return this.choice; },
      truefalse: () => [['true', "To'g'ri"], ['false', "Noto'g'ri"]].map(([v, l]) => `<label class="option-card ${q.response === v ? 'selected' : ''}"><input type="radio" name="o" value="${v}" ${q.response === v ? 'checked' : ''}><span>${l}</span></label>`).join(''),
      short: () => `<textarea class="form-control" id="txt" rows="5" placeholder="Javobingizni shu yerga yozing..." maxlength="3000">${esc(q.response || '')}</textarea><div class="form-text">Javob kalit tushunchalar asosida baholanadi.</div>`,
      get scenario() { return this.short; },
      code: () => '',
    }[q.type]();
    $('#q').innerHTML = html`<div class="card-sp card-pad"><div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2"><div><span class="chip chip-violet me-1">${q.tech || 'Umumiy'}</span><span class="chip">${QTYPE[q.type]}</span></div>
      <span class="small text-muted">Savol ${cur + 1}/${qs.length} · ${q.points} ball</span></div>
      <h4 class="mb-3" style="line-height:1.4">${q.text}</h4>${q.code ? html`<pre class="q-code mb-3">${q.code}</pre>` : ''}
      ${q.type === 'code' ? html`<div class="row g-3 mb-3"><div class="col-12"><div class="small text-muted mb-2"><b>Ochiq test case'lar:</b> ${q.publicTests.map((x, i) => html`<code class="me-2">solve(${x.args.map((a) => JSON.stringify(a)).join(', ')}) → ${JSON.stringify(x.expected)}</code>`)}
        ${q.hiddenTests ? html`<span class="chip">+${q.hiddenTests} yashirin</span>` : ''}</div></div></div>${codeBox({ id: 'cb', languages: sbx.languages, language: q.language, code: q.response || q.starter, runLabel: 'Ishga tushirish' })}
        <div class="small text-muted mt-2"><i class="bi bi-info-circle me-1"></i>“Javobni yuborish” barcha (shu jumladan yashirin) test case'lar bo'yicha baholaydi. Ctrl+Enter — ishga tushirish.</div>` : raw(body)}
      <div class="d-flex justify-content-between mt-4"><button class="btn btn-light-soft" id="prev" ${cur === 0 ? 'disabled' : ''}><i class="bi bi-arrow-left"></i> Oldingi</button>
        ${cur < qs.length - 1 ? html`<button class="btn btn-primary" id="next">Keyingi <i class="bi bi-arrow-right"></i></button>` : html`<button class="btn btn-violet" id="last"><i class="bi bi-flag-fill"></i> Yakunlash</button>`}</div></div>`.s;
    drawDots();
    $('#prev').onclick = () => go(cur - 1);
    const nx = $('#next'); if (nx) nx.onclick = () => go(cur + 1);
    const ls = $('#last'); if (ls) ls.onclick = () => finish(false);
    ctx.root.querySelectorAll('input[name=o]').forEach((r) => (r.onchange = () => { ctx.root.querySelectorAll('.option-card').forEach((c) => c.classList.remove('selected')); r.closest('.option-card').classList.add('selected'); save(q, r.value); }));
    const txt = $('#txt');
    if (txt) { txt.oninput = () => { q.response = txt.value; clearTimeout(saveTimers[q.id]); saveTimers[q.id] = setTimeout(() => save(q, txt.value), 700); }; txt.onblur = () => save(q, txt.value); }
    if (q.type === 'code') {
      bindCodeBox($('#cb'), {
        starter: q.starter,
        onChange: (v) => { q.response = v; clearTimeout(saveTimers[q.id]); saveTimers[q.id] = setTimeout(() => save(q, v), 1200); },
        onRun: (code, language) => api.post(`/candidate/attempts/${id}/run`, { question_id: q.id, code, language }),
        onSubmit: async (code, language) => { await save(q, code); const r = await api.post(`/candidate/attempts/${id}/submit-code`, { question_id: q.id, code, language }); toast(`Kod yuborildi: ${r.passed}/${r.total} test o'tdi`, r.passed === r.total ? 'success' : 'warning'); return r; },
      });
    }
  }

  async function finish(force) {
    if (finishing) return;
    if (!force) {
      const left = qs.length - qs.filter(answered).length;
      if (!(await confirmDialog(left ? `${left} ta savolga javob berilmagan. Baribir yakunlaysizmi?` : 'Testni yakunlab, natijani ko\'rishni xohlaysizmi?', 'Yakunlash'))) return;
    }
    finishing = true;
    Object.values(saveTimers).forEach(clearTimeout);
    try {
      const q = qs[cur];
      if (q.type !== 'code' && ctx.root.querySelector('#txt')) await save(q, ctx.root.querySelector('#txt').value);
      await api.post(`/candidate/attempts/${id}/finish`);
      toast('Test yakunlandi! Natijalar tayyor', 'success');
      navigate('/result/' + id);
    } catch (e) { finishing = false; toast(e.message, 'error'); }
  }
  $('#finish').onclick = () => finish(false);
  window.onbeforeunload = () => (finishing ? null : "Test davom etmoqda. Sahifadan chiqsangiz ham vaqt hisoblanaveradi.");
  ctx.cleanup(() => { window.onbeforeunload = null; });
  draw();
}

