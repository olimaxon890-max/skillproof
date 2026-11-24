import { api, session } from '../api.js?v=10';
import { html, toast, withBusy } from '../ui.js';
import { navigate } from '../router.js?v=10';

export default async function (ctx) {
  const preCode = ctx.query.code || 'EXAM-2026';

  ctx.render(html`<div class="container py-5 page-enter" style="max-width:560px;">
    <div class="card-sp card-pad p-4 p-lg-5 text-center">
      <div class="mx-auto mb-3 d-grid" style="width:64px;height:64px;border-radius:20px;place-items:center;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-size:28px;">
        <i class="bi bi-key-fill"></i>
      </div>
      <span class="chip chip-violet mb-2">O'QUV MARKAZI IMTIHON TIZIMI</span>
      <h2 class="fw-bold text-navy mb-2">Imtihon Kodi Bilan Kirish</h2>
      <p class="text-muted small mb-4">
        O'quv markazingiz yoki ustozingiz bergan maxsus imtihon kodini (masalan: <b>EXAM-2026</b>) kiriting va himoyalangan imtihonni boshlang.
      </p>

      <form id="join-form">
        <div class="mb-3">
          <input class="form-control form-control-lg text-center font-monospace fw-bold fs-4" id="exam-code" value="${preCode}" placeholder="EXAM-2026" required maxlength="20">
        </div>
        <button class="btn btn-primary btn-lg w-100 fw-bold" type="submit">
          <i class="bi bi-play-circle-fill me-2"></i>Imtihonni Boshlash
        </button>
      </form>

      <div class="mt-3 small text-muted">
        <i class="bi bi-shield-lock-fill text-violet me-1"></i>Imtihon to'liq ekranli Anti-Cheat nazorati ostida o'tkaziladi.
      </div>
    </div>
  </div>`);

  const f = ctx.root.querySelector('#join-form');
  f.onsubmit = (e) => {
    e.preventDefault();
    if (!session.user) {
      toast('Imtihon topshirish uchun avval Nomzod sifatida tizimga kiring', 'warning');
      return navigate('/login?next=/exam');
    }
    const code = ctx.root.querySelector('#exam-code').value.trim().toUpperCase();
    withBusy(f.querySelector('[type=submit]'), async () => {
      try {
        const r = await api.post('/candidate/join-exam', { code });
        toast(`"${r.session_title}" imtihoni boshlandi!`, 'success');
        navigate('/test/' + r.id);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  };
}
