import { api } from '../api.js?v=10';
import { html, skeletonCards, toast, withBusy, fmtDateTime, verdictBadge, empty } from '../ui.js';
import { dash, pageHead } from '../components/layout.js?v=10';

export default async function (ctx) {
  ctx.render(dash('company', html`${pageHead('Imtihon markazi', "O'quv markazi va akademiyalar uchun maxsus kodli yopiq guruh imtihonlari")}${skeletonCards(2)}`));

  let data = { exam_center_active: true, sessions: [], jobs: [] };
  async function load() {
    try { data = await api.get('/company/exams'); } catch (e) { return toast(e.message, 'error'); }
    draw();
  }

  function draw() {
    if (!ctx.isCurrent()) return;
    ctx.render(dash('company', html`
      ${pageHead(
        "🏫 Imtihon Markazi (O'quv markazlari uchun)",
        "Guruh o'quvchilari uchun maxsus kirish kodli (EXAM-XXXX) himoyalangan imtihon sessiyalarini yarating va natijalarni CSV (Excel) shaklida yuklab oling",
        html`<a href="#/exam" class="btn btn-light-soft"><i class="bi bi-key-fill me-1"></i>O'quvchi sifatida kod terish</a>`
      )}

      <!-- Yangi Guruh Imtihoni Yaratish -->
      <div class="card-sp card-pad mb-4" style="border-left:5px solid #7c3aed;">
        <h5 class="fw-bold text-navy mb-2"><i class="bi bi-plus-circle-fill text-violet me-2"></i>Yangi Guruh Imtihon Sessiyasini Yaratish</h5>
        <form id="new-exam" class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label small fw-bold">Guruh / Imtihon nomi *</label>
            <input class="form-control" name="title" required placeholder="Masalan: Frontend Guruh-15 Yakuniy Imtihoni">
          </div>
          <div class="col-md-4">
            <label class="form-label small fw-bold">Yo'nalish va savollar bazasi *</label>
            <select class="form-select" name="job_id">
              ${data.jobs.map((j) => html`<option value="${j.id}">${j.title}</option>`)}
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-bold">Vaqt (daqiqa)</label>
            <input type="number" class="form-control" name="duration_min" value="25" min="5" max="180">
          </div>
          <div class="col-md-2">
            <button class="btn btn-primary w-100 fw-bold" type="submit"><i class="bi bi-lightning-fill me-1"></i>Kod yaratish</button>
          </div>
        </form>
      </div>

      <!-- Mavjud Imtihon Sessiyalari -->
      ${data.sessions.length ? data.sessions.map((s) => html`
        <div class="card-sp card-pad mb-4">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 pb-3 mb-3 border-bottom">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge bg-violet text-white font-monospace fs-6 px-3 py-2"><i class="bi bi-key-fill me-1"></i>KOD: ${s.code}</span>
                <span class="badge-soft approved">Faol sessiya</span>
              </div>
              <h4 class="fw-bold mb-0 mt-2">${s.title}</h4>
              <div class="small text-muted">${s.job_title} · Vaqt: ${s.duration_min} daq · Topshirganlar: <b>${s.participants.length} nafar</b></div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-primary btn-sm fw-bold" data-copy="${s.code}">
                <i class="bi bi-clipboard-check me-1"></i>Kodni nusxalash (${s.code})
              </button>
              <button class="btn btn-primary btn-sm fw-bold" data-csv="${s.id}" data-code="${s.code}">
                <i class="bi bi-file-earmark-spreadsheet me-1"></i>Natijalarni yuklab olish (CSV)
              </button>
            </div>
          </div>

          ${s.participants.length ? html`
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead><tr><th>#</th><th>O'quvchi</th><th>Sertifikat ID</th><th>Ball</th><th>Anti-Cheat Holati</th><th>Xulosa</th><th>Vaqt</th></tr></thead>
                <tbody>
                  ${s.participants.map((p, i) => html`<tr>
                    <td class="fw-bold">${i + 1}</td>
                    <td><div class="fw-semibold">${p.name}</div><div class="small text-muted">${p.email}</div></td>
                    <td><a href="#/verify/${p.cert_id}" class="font-monospace small fw-bold">${p.cert_id}</a></td>
                    <td><span class="fs-5 fw-bold">${p.total_score}</span><span class="text-muted small">/100</span></td>
                    <td>
                      ${p.cheated
                        ? html`<span class="badge bg-danger"><i class="bi bi-shield-x me-1"></i>Qoidabuzarlik (Bloklangan)</span>`
                        : html`<span class="badge bg-success-subtle text-success"><i class="bi bi-shield-check me-1"></i>Himoya toza</span>`}
                    </td>
                    <td>${verdictBadge(p.verdict)}</td>
                    <td class="small text-muted">${fmtDateTime(p.finished_at)}</td>
                  </tr>`)}
                </tbody>
              </table>
            </div>
          ` : html`<div class="text-muted small py-2">Hozircha o'quvchilar ushbu kod bilan imtihon topshirmagan. O'quvchilarga <b>${s.code}</b> kodini bering — ular <b>#/exam</b> sahifasida kodni terib imtihonni boshlaydi.</div>`}
        </div>
      `) : empty('bi-journal-check', 'Imtihon sessiyalari yo\'q', 'Yuqoridagi forma orqali guruhingiz uchun birinchi imtihon kodini yarating.')}
    `));

    const f = ctx.root.querySelector('#new-exam');
    f.onsubmit = (e) => {
      e.preventDefault();
      withBusy(f.querySelector('[type=submit]'), async () => {
        try {
          const r = await api.post('/company/exams', {
            title: f.title.value,
            job_id: f.job_id.value,
            duration_min: f.duration_min.value
          });
          toast(`Yangi imtihon yaratildi! Kirish kodi: ${r.code}`, 'success');
          load();
        } catch (err) { toast(err.message, 'error'); }
      });
    };

    ctx.root.querySelectorAll('[data-copy]').forEach((b) => {
      b.onclick = () => {
        navigator.clipboard?.writeText(b.dataset.copy);
        toast(`Imtihon kodi nusxalandi: ${b.dataset.copy}`, 'info');
      };
    });

    ctx.root.querySelectorAll('[data-csv]').forEach((b) => {
      b.onclick = async () => {
        try {
          await api.download(`/company/exams/${b.dataset.csv}/csv`, `skillprove-imtihon-${b.dataset.code}.csv`);
          toast('CSV hisobot yuklab olindi!', 'success');
        } catch (err) { toast(err.message, 'error'); }
      };
    });
  }

  load();
}
