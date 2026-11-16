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
  let cur = 0, finishing = false, proctorActive = false;
  const answered = (q) => q.response != null && String(q.response).trim() !== '';

  ctx.render(html`
    <!-- CHSB Start Gate Overlay -->
    <div id="chsb-gate" style="position:fixed;inset:0;z-index:9999;background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#311042 100%);color:#fff;display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="max-width:580px;width:100%;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.2);border-radius:24px;padding:32px;backdrop-filter:blur(16px);box-shadow:0 24px 60px rgba(0,0,0,0.45);">
        <div class="d-flex align-items-center gap-3 mb-3">
          <div style="width:54px;height:54px;border-radius:16px;background:rgba(244,63,94,0.2);border:1px solid #f43f5e;display:grid;place-items:center;font-size:26px;color:#fb7185;">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <div>
            <span class="badge bg-danger mb-1">CHSB ANTI-CHEAT REJIMI</span>
            <h3 class="mb-0 text-white fw-bold">Himoyalangan Imtihon Tizimi</h3>
          </div>
        </div>
        <p class="text-white-50 small mb-3">
          Ushbu sinov umumta'lim CHSB va xalqaro proktoring standartlari asosida qat'iy nazorat ostida o'tkaziladi:
        </p>
        <ul class="list-unstyled small mb-4" style="line-height:1.75;color:#e2e8f0;">
          <li class="mb-2"><i class="bi bi-fullscreen text-warning me-2"></i><b>1. To'liq ekran (Fullscreen):</b> Test boshlanganda ekran to'liq qulflanadi.</li>
          <li class="mb-2"><i class="bi bi-slash-circle text-danger me-2"></i><b>2. Nusxalash taqiqlangan:</b> Savollarni belgilash, nusxalash (Copy) va o'ng tugmani bosish bloklangan.</li>
          <li class="mb-2"><i class="bi bi-exclamation-triangle-fill text-danger me-2"></i><b>3. Boshqa joyga o'tish = Avtomatik Bloklash:</b> Agar test vaqtida boshqa brauzer oynasiga, tabga, Telegram/Google'ga o'tsangiz yoki to'liq ekrandan chiqsangiz — <b>TEST DARHOL BLOKLANADI va 0 ball bilan yakunlanadi!</b></li>
        </ul>
        <div class="d-flex gap-2">
          <button class="btn btn-danger btn-lg flex-grow-1 fw-bold" id="start-chsb">
            <i class="bi bi-shield-check me-2"></i>Tushundim, To'liq Ekranda Boshlash
          </button>
          <a href="#/candidate" class="btn btn-outline-light btn-lg">Orqaga</a>
        </div>
      </div>
    </div>

    <!-- CHSB Blocked Lock Screen (Hidden until violation) -->
    <div id="chsb-locked" class="d-none" style="position:fixed;inset:0;z-index:10000;background:linear-gradient(135deg,#450a0a 0%,#7f1d1d 50%,#1e1b4b 100%);color:#fff;display:flex;align-items:center;justify-content:center;padding:20px;text-align:center;">
      <div style="max-width:540px;width:100%;background:rgba(0,0,0,0.45);border:2px solid #f43f5e;border-radius:24px;padding:36px;">
        <div style="font-size:64px;color:#fb7185;line-height:1;" class="mb-3"><i class="bi bi-shield-x"></i></div>
        <span class="badge bg-danger px-3 py-2 mb-2">QOIDABUZARLIK ANIQLANDI</span>
        <h2 class="text-white fw-bold mb-2">TEST BLOKLANDI!</h2>
        <p class="text-white-50 mb-3" id="chsb-reason">
          Siz imtihon vaqtida test oynasidan chiqdingiz (boshqa sahifa yoki dasturga o'tish aniqlandi).
        </p>
        <div class="alert alert-danger bg-danger bg-opacity-25 border-danger text-white small mb-4">
          CHSB / Anti-Cheat qoidalariga binoan ushbu urinish <b>0 ball (Mos emas)</b> bilan majburiy yakunlandi.
        </div>
        <button class="btn btn-light btn-lg fw-bold w-100" id="locked-go-result">
          Natijalar sahifasiga o'tish
        </button>
      </div>
    </div>

    <div class="exam-top" style="top:0"><div class="container d-flex align-items-center gap-3 flex-wrap">
      <div class="me-auto"><div class="fw-bold text-navy">${t.job.title}</div><div class="small text-muted">${t.job.company_name} · ${qs.length} ta savol</div></div>
      <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1"><i class="bi bi-shield-lock-fill me-1"></i>CHSB Anti-Cheat: Faol</span>
      <span class="small text-muted d-none d-md-inline" id="prog"></span><div class="timer" id="timer"><i class="bi bi-stopwatch me-1"></i><span>--:--</span></div>
      <button class="btn btn-primary" id="finish"><i class="bi bi-flag-fill me-1"></i>Testni yakunlash</button></div></div>
    <div class="container py-4 page-enter" id="exam-body" style="user-select:none;-webkit-user-select:none;filter:blur(10px);pointer-events:none;"><div class="row g-4"><div class="col-lg-3 order-lg-2"><div class="card-sp card-pad position-sticky" style="top:90px"><div class="card-title-sm">Savollar</div><div class="d-flex flex-wrap gap-2" id="dots"></div>
      <hr><div class="small text-muted"><span class="chip me-1">Javob berilgan</span> <span class="q-dot answered d-inline-grid" style="width:14px;height:14px"></span></div></div></div>
      <div class="col-lg-9"><div id="q"></div></div></div></div>`);

  const $ = (s) => ctx.root.querySelector(s);

  // Start CHSB Fullscreen Exam
  $('#start-chsb').onclick = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {}
    $('#chsb-gate').classList.add('d-none');
    const eb = $('#exam-body');
    eb.style.filter = 'none';
    eb.style.pointerEvents = 'auto';
    setTimeout(() => { proctorActive = true; }, 450);
  };

  // Block test immediately on violation
  async function lockAndBlockTest(reason) {
    if (finishing || !proctorActive) return;
    proctorActive = false;
    finishing = true;
    Object.values(saveTimers).forEach(clearTimeout);
    const lockEl = $('#chsb-locked');
    if (lockEl) {
      $('#chsb-reason').textContent = reason;
      lockEl.classList.remove('d-none');
      $('#locked-go-result').onclick = () => {
        if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
        navigate('/result/' + id);
      };
    }
    try {
      await api.post(`/candidate/attempts/${id}/finish`, { cheated: true, reason });
    } catch {}
    setTimeout(() => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      navigate('/result/' + id);
    }, 4500);
  }

  // Event listeners for Anti-Cheat
  const onVisChange = () => {
    if (proctorActive && document.visibilityState === 'hidden') {
      lockAndBlockTest("Imtihon vaqtida boshqa brauzer tabiga yoki sahifaga o'tish aniqlandi!");
    }
  };
  const onWinBlur = () => {
    if (proctorActive) {
      lockAndBlockTest("Imtihon oynasidan chiqib boshqa dastur yoki oynaga o'tish aniqlandi!");
    }
  };
  const onFsChange = () => {
    if (proctorActive && !document.fullscreenElement) {
      lockAndBlockTest("To'liq ekran (Fullscreen) imtihon rejimidan chiqish aniqlandi!");
    }
  };
  const onCopyBlock = (e) => {
    if (!proctorActive) return;
    if (e.target && e.target.closest && e.target.closest('.code-box')) return;
    e.preventDefault();
    toast("Imtihon vaqtida savollarni nusxalash taqiqlangan!", "warning");
  };
  const onContextBlock = (e) => {
    if (!proctorActive) return;
    e.preventDefault();
  };
  const onKeyBlock = (e) => {
    if (!proctorActive) return;
    const k = (e.key || '').toLowerCase();
    if (
      e.key === 'F12' ||
      e.key === 'PrintScreen' ||
      (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(k)) ||
      (e.ctrlKey && ['u', 's', 'p'].includes(k)) ||
      (e.ctrlKey && k === 'c' && !(e.target && e.target.closest && e.target.closest('.code-box')))
    ) {
      e.preventDefault();
      toast("Imtihon vaqtida bu tugmalar bloklangan!", "warning");
    }
  };

  document.addEventListener('visibilitychange', onVisChange);
  window.addEventListener('blur', onWinBlur);
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('copy', onCopyBlock);
  document.addEventListener('cut', onCopyBlock);
  document.addEventListener('contextmenu', onContextBlock);
  document.addEventListener('keydown', onKeyBlock);

  // ---- Taymer ----
  const tick = () => {
    const left = Math.max(0, deadline - Date.now());
    const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
    $('#timer span').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    $('#timer').classList.toggle('low', left < 60000);
    if (left <= 0 && !finishing) { toast('Vaqt tugadi! Test avtomatik yakunlanmoqda', 'warning'); finish(true); }
  };
  tick(); const iv = setInterval(tick, 1000);

  const saveTimers = {};
  const save = async (q, value) => {
    if (finishing) return;
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
      <h4 class="mb-3" style="line-height:1.4;user-select:none;-webkit-user-select:none;">${q.text}</h4>${q.code ? html`<pre class="q-code mb-3" style="user-select:none;-webkit-user-select:none;">${q.code}</pre>` : ''}
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
    const wasProctored = proctorActive;
    proctorActive = false;
    if (!force) {
      const left = qs.length - qs.filter(answered).length;
      if (!(await confirmDialog(left ? `${left} ta savolga javob berilmagan. Baribir yakunlaysizmi?` : 'Testni yakunlab, natijani ko\'rishni xohlaysizmi?', 'Yakunlash'))) {
        proctorActive = wasProctored;
        return;
      }
    }
    finishing = true;
    Object.values(saveTimers).forEach(clearTimeout);
    try {
      const q = qs[cur];
      if (q.type !== 'code' && ctx.root.querySelector('#txt')) await save(q, ctx.root.querySelector('#txt').value);
      await api.post(`/candidate/attempts/${id}/finish`);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      toast('Test yakunlandi! Natijalar tayyor', 'success');
      navigate('/result/' + id);
    } catch (e) { finishing = false; proctorActive = wasProctored; toast(e.message, 'error'); }
  }
  $('#finish').onclick = () => finish(false);
  window.onbeforeunload = () => (finishing ? null : "Test davom etmoqda. Sahifadan chiqsangiz test bloklanadi!");
  ctx.cleanup(() => {
    clearInterval(iv);
    proctorActive = false;
    window.onbeforeunload = null;
    document.removeEventListener('visibilitychange', onVisChange);
    window.removeEventListener('blur', onWinBlur);
    document.removeEventListener('fullscreenchange', onFsChange);
    document.removeEventListener('copy', onCopyBlock);
    document.removeEventListener('cut', onCopyBlock);
    document.removeEventListener('contextmenu', onContextBlock);
    document.removeEventListener('keydown', onKeyBlock);
  });
  draw();
}
