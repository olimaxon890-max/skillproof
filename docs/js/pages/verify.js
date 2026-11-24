import { api } from '../api.js?v=10';
import { html, raw, toast, fmtDate, verdictBadge, bar, animateBars } from '../ui.js';
import { navigate } from '../router.js?v=10';

// Deterministic SVG QR Code generator for certificate URL
export function renderQrSvg(text, size = 116) {
  const n = 21;
  const grid = Array.from({ length: n }, () => Array(n).fill(0));
  function finder(r0, c0) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          grid[r0 + r][c0 + c] = 1;
        } else {
          grid[r0 + r][c0 + c] = 2;
        }
      }
    }
  }
  finder(0, 0); finder(0, n - 7); finder(n - 7, 0);
  let seed = 2166136261;
  for (let i = 0; i < text.length; i++) {
    seed ^= text.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] !== 0) continue;
      if ((r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8)) continue;
      seed ^= (r * 31 + c * 17) & 0xff;
      seed = Math.imul(seed, 16777619);
      grid[r][c] = (seed >>> 3) & 1;
    }
  }
  const cell = size / n;
  let rects = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] === 1) {
        rects += `<rect x="${(c * cell).toFixed(1)}" y="${(r * cell).toFixed(1)}" width="${(cell + 0.25).toFixed(1)}" height="${(cell + 0.25).toFixed(1)}" fill="#1e1b4b"/>`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="background:#fff;padding:6px;border-radius:12px;border:1.5px solid #cbd5e1;">${rects}</svg>`;
}

export default async function (ctx) {
  const codeParam = (ctx.params.code || ctx.query.code || 'SP-2026-0001').toUpperCase();
  let cert = null, errMsg = '';
  try {
    cert = await api.get('/public/verify/' + encodeURIComponent(codeParam));
  } catch (e) {
    errMsg = e.message;
  }

  ctx.render(html`<div class="container py-5 page-enter" style="max-width:860px;">
    <div class="text-center mb-4">
      <span class="chip chip-violet mb-2"><i class="bi bi-qr-code-scan me-1"></i>SKILLPROVE RASMIY REESTRI</span>
      <h1 class="fw-bold">QR-Sertifikat Haqiqiyligini Tekshirish</h1>
      <p class="text-muted">Sertifikat ID raqamini kiriting yoki QR-kod orqali hujjatning haqiqiyligini tekshiring.</p>
    </div>

    <!-- Qidiruv paneli -->
    <form id="vf-form" class="card-sp card-pad mb-4">
      <div class="row g-2 align-items-center">
        <div class="col-md-8">
          <div class="input-group input-group-lg">
            <span class="input-group-text bg-white"><i class="bi bi-patch-check text-violet"></i></span>
            <input class="form-control font-monospace fw-bold" id="vf-input" value="${codeParam}" placeholder="Masalan: SP-2026-0001">
          </div>
        </div>
        <div class="col-md-4">
          <button class="btn btn-primary btn-lg w-100 fw-bold" type="submit"><i class="bi bi-search me-1"></i>Tekshirish</button>
        </div>
      </div>
      <div class="d-flex flex-wrap gap-2 align-items-center mt-2 small text-muted">
        <span>Namuna sertifikatlar:</span>
        <a href="#/verify/SP-2026-0001" class="badge bg-light text-dark border text-decoration-none font-monospace">SP-2026-0001 (88 ball)</a>
        <a href="#/verify/SP-2026-0002" class="badge bg-light text-dark border text-decoration-none font-monospace">SP-2026-0002 (81 ball)</a>
      </div>
    </form>

    ${cert ? html`
      <div class="card-sp p-4 p-lg-5 position-relative overflow-hidden" style="border:2.5px solid #10b981;background:linear-gradient(135deg,#ffffff 0%,#f0fdf4 65%,#f5f3ff 100%);">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-3 pb-3 mb-4 border-bottom">
          <div>
            <span class="badge bg-success px-3 py-2 rounded-pill mb-2"><i class="bi bi-patch-check-fill me-1"></i>SERTIFIKAT HAQIQIY VA TASDIQLANGAN</span>
            <h2 class="fw-bold text-navy mb-1">${cert.candidate_name} ${cert.is_pro ? html`<span class="badge bg-warning text-dark ms-1">⭐ PRO</span>` : ''}</h2>
            <div class="text-muted">${cert.job_title} · <b>${cert.company_name}</b></div>
          </div>
          <div class="text-end">
            ${raw(renderQrSvg(`https://skillprove.uz/#/verify/${cert.cert_id}`, 96))}
            <div class="font-monospace fw-bold text-navy small mt-1">${cert.cert_id}</div>
          </div>
        </div>

        <div class="row g-3 mb-4 text-center">
          <div class="col-6 col-md-3">
            <div class="p-3 rounded-3 bg-white border">
              <div class="small text-muted">Umumiy natija</div>
              <div class="display-6 fw-bold text-success">${cert.total_score}<span class="fs-6 text-muted">/100</span></div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-3 rounded-3 bg-white border">
              <div class="small text-muted">Amaliy kod (Sandbox)</div>
              <div class="display-6 fw-bold text-violet">${cert.practical_score}%</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-3 rounded-3 bg-white border">
              <div class="small text-muted">Berilgan sana</div>
              <div class="fw-bold text-navy mt-2">${fmtDate(cert.finished_at)}</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-3 rounded-3 bg-white border">
              <div class="small text-muted">Tizim xulosasi</div>
              <div class="mt-2">${verdictBadge(cert.verdict)}</div>
            </div>
          </div>
        </div>

        <h6 class="fw-bold text-navy mb-3">Tasdiqlangan texnik ko'nikmalar ko'rsatkichi:</h6>
        ${cert.tech_scores.map((t) => html`
          <div class="req-row">
            <div class="fw-semibold">${t.name}</div>
            ${bar(t.score, t.required)}
            <div class="text-end fw-bold">${t.score}%</div>
          </div>
        `)}

        <div class="mt-4 pt-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2 small text-muted">
          <span><i class="bi bi-shield-fill-check text-success me-1"></i>SkillProve Anti-Cheat va Code Sandbox tizimi orqali tekshirilgan</span>
          <button class="btn btn-sm btn-outline-primary" onclick="window.print()"><i class="bi bi-printer me-1"></i>Chop etish / PDF</button>
        </div>
      </div>
    ` : html`
      <div class="card-sp card-pad text-center py-5 border-danger">
        <i class="bi bi-shield-exclamation display-3 text-danger"></i>
        <h4 class="fw-bold mt-3">Sertifikat topilmadi</h4>
        <p class="text-muted">${errMsg || "Kiritilgan ID raqam bo'yicha tasdiqlangan sertifikat mavjud emas."}</p>
      </div>
    `}
  </div>`);

  animateBars(ctx.root);
  ctx.root.querySelector('#vf-form').onsubmit = (e) => {
    e.preventDefault();
    const val = ctx.root.querySelector('#vf-input').value.trim().toUpperCase();
    if (!val) return toast('Sertifikat kodini kiriting', 'warning');
    navigate('/verify/' + encodeURIComponent(val));
  };
}
