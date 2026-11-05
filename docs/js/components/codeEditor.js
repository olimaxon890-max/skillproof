// Kod muharriri komponenti (test sahifasi va mustaqil muharrir uchun)
import { html, esc } from '../ui.js';

const LANG_LABEL = { javascript: 'JavaScript (Node.js)', python: 'Python 3' };

export function codeBox({ id = 'cb', languages = ['javascript'], language = 'javascript', code = '', showSubmit = true, runLabel = 'Ishga tushirish' }) {
  return html`<div class="code-box" id="${id}">
    <div class="code-bar"><span class="dots"><span></span><span></span><span></span></span>
      <select class="cb-lang" aria-label="Dasturlash tili">${languages.map((l) => html`<option value="${l}" ${l === language ? 'selected' : ''}>${LANG_LABEL[l] || l}</option>`)}</select>
      <span class="small text-secondary ms-1 d-none d-md-inline"><i class="bi bi-shield-lock me-1"></i>Xavfsiz sandbox</span>
      <div class="ms-auto d-flex gap-2"><button class="btn btn-sm btn-outline-light cb-reset" title="Boshlang'ich holatga qaytarish"><i class="bi bi-arrow-counterclockwise"></i></button>
        <button class="btn btn-sm btn-success cb-run"><i class="bi bi-play-fill"></i> ${runLabel}</button>
        ${showSubmit ? html`<button class="btn btn-sm btn-violet cb-submit"><i class="bi bi-send-fill"></i> Javobni yuborish</button>` : ''}</div></div>
    <div class="code-wrap"><div class="code-gutter">1</div><textarea class="code-area" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Kod yozish oynasi">${code}</textarea></div>
    <div class="console"><span class="t-dim">Natija shu yerda ko'rinadi. “${runLabel}” tugmasini bosing.</span></div></div>`;
}

export function bindCodeBox(root, { starter = '', onRun, onSubmit, onChange }) {
  const ta = root.querySelector('.code-area'), gut = root.querySelector('.code-gutter'), con = root.querySelector('.console');
  const lines = () => { gut.textContent = Array.from({ length: ta.value.split('\n').length }, (_, i) => i + 1).join('\n'); gut.scrollTop = ta.scrollTop; };
  ta.addEventListener('input', () => { lines(); onChange?.(ta.value); });
  ta.addEventListener('scroll', () => (gut.scrollTop = ta.scrollTop));
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
    if (e.key === 'Enter') { // avtomatik chekinish
      const s = ta.selectionStart, before = ta.value.slice(0, s), indent = (before.split('\n').pop().match(/^\s*/) || [''])[0] + (/[{(\[]\s*$/.test(before) ? '  ' : '');
      e.preventDefault(); ta.setRangeText('\n' + indent, s, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input'));
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
  });
  lines();
  const busy = (btn, on, label) => { btn.disabled = on; if (label) btn.dataset.l ??= btn.innerHTML; btn.innerHTML = on ? '<span class="spinner-border spinner-border-sm"></span> Bajarilmoqda' : btn.dataset.l || btn.innerHTML; };
  const run = async () => { const b = root.querySelector('.cb-run'); busy(b, true, 1); con.innerHTML = '<span class="t-dim">Sandbox\'da bajarilmoqda...</span>'; try { showResult(await onRun(ta.value, lang())); } catch (e) { con.innerHTML = `<span class="t-bad">${esc(e.message)}</span>`; } finally { busy(b, false); } };
  const lang = () => root.querySelector('.cb-lang').value;
  root.querySelector('.cb-run').onclick = run;
  const sub = root.querySelector('.cb-submit');
  if (sub) sub.onclick = async () => { busy(sub, true, 1); con.innerHTML = '<span class="t-dim">Barcha test case\'lar tekshirilmoqda...</span>'; try { showResult(await onSubmit(ta.value, lang()), true); } catch (e) { con.innerHTML = `<span class="t-bad">${esc(e.message)}</span>`; } finally { busy(sub, false); } };
  root.querySelector('.cb-reset').onclick = () => { if (confirm("Kod boshlang'ich holatga qaytarilsinmi?")) { ta.value = starter; lines(); onChange?.(ta.value); } };

  function showResult(r, submitted) {
    let out = '';
    if (r.error) out += `<div class="t-bad"><i class="bi bi-bug"></i> Xato: ${esc(r.error)}</div>`;
    if (r.cases?.length) {
      out += `<div class="${r.passed === r.total ? 't-ok' : 't-warn'} fw-bold mb-2">${r.passed}/${r.total} test case muvaffaqiyatli ${submitted ? '(yuborildi)' : ''}</div>`;
      out += r.cases.map((c) => c.hidden
        ? `<div class="case-row"><span class="${c.ok ? 't-ok' : 't-bad'}">${c.ok ? '✔' : '✘'}</span><span class="t-dim">Yashirin test #${c.index}</span></div>`
        : `<div class="case-row"><span class="${c.ok ? 't-ok' : 't-bad'}">${c.ok ? '✔' : '✘'}</span><div>Test #${c.index}: <span class="t-dim">kirish</span> ${esc(JSON.stringify(c.args))} <span class="t-dim">kutilgan</span> ${esc(JSON.stringify(c.expected))}
          ${c.ok ? '' : `<span class="t-dim">olingan</span> <span class="t-bad">${esc(c.error ? 'Xato: ' + c.error : JSON.stringify(c.got))}</span>`}</div></div>`).join('');
    }
    if (r.logs?.length) out += `<div class="mt-2 t-dim">console.log:</div><div>${esc(r.logs.join('\n'))}</div>`;
    if (r.play && !r.logs?.length && !r.error) out += '<span class="t-dim">Kod xatosiz bajarildi (chiqish yo\'q).</span>';
    con.innerHTML = out || '<span class="t-dim">Natija yo\'q</span>';
  }
  return { getCode: () => ta.value, setCode: (v) => { ta.value = v; lines(); }, getLang: lang };
}

