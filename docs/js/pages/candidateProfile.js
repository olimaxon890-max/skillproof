import { api, session } from '../api.js';
import { html, skeletonCards, toast, withBusy, formData } from '../ui.js';
import { dash, pageHead } from '../components/layout.js';

export default async function (ctx) {
  ctx.render(dash('candidate', html`${pageHead('Mening profilim')}${skeletonCards(2, 'col-md-6')}`));
  const [p, cats] = await Promise.all([api.get('/candidate/profile'), api.get('/public/categories')]).catch((e) => { toast(e.message, 'error'); return []; });
  if (!p || !ctx.isCurrent()) return;
  ctx.render(dash('candidate', html`${pageHead('Mening profilim', "Shaxsiy ma'lumotlar va yo'nalishingiz")}
    <form id="f" class="row g-4"><div class="col-lg-4"><div class="card-sp card-pad text-center"><div class="avatar mx-auto mb-3" style="width:88px;height:88px;font-size:1.8rem">${((p.first_name || '?')[0] + (p.last_name?.[0] || '')).toUpperCase()}</div>
      <h4 class="mb-0">${p.first_name} ${p.last_name}</h4><div class="text-muted small mb-3">${p.email}</div><span class="chip chip-violet">${p.direction || "Yo'nalish tanlanmagan"}</span>
      <div class="small text-muted mt-3">Ro'yxatdan o'tgan: ${new Date(p.created_at).toLocaleDateString('uz-UZ')}</div></div></div>
    <div class="col-lg-8"><div class="card-sp card-pad"><div class="row g-3">
      <div class="col-md-6"><label class="form-label">Ism</label><input class="form-control" name="first_name" value="${p.first_name}" required maxlength="60"></div>
      <div class="col-md-6"><label class="form-label">Familiya</label><input class="form-control" name="last_name" value="${p.last_name}" maxlength="60"></div>
      <div class="col-md-6"><label class="form-label">Telefon</label><input class="form-control" name="phone" value="${p.phone}" placeholder="+998 90 123 45 67" maxlength="30"></div>
      <div class="col-md-6"><label class="form-label">Shahar</label><input class="form-control" name="city" value="${p.city}" maxlength="100"></div>
      <div class="col-12"><label class="form-label">Yo'nalish</label><select class="form-select" name="direction"><option value="">Tanlang...</option>${cats.map((c) => html`<option ${c.name === p.direction ? 'selected' : ''}>${c.name}</option>`)}</select></div>
      <div class="col-12"><label class="form-label">Ko'nikmalar (vergul bilan)</label><input class="form-control" name="skills" value="${p.skills}" placeholder="HTML5, CSS3, JavaScript" maxlength="400"></div>
      <div class="col-12"><label class="form-label">O'zim haqimda</label><textarea class="form-control" name="bio" rows="4" maxlength="1000">${p.bio}</textarea></div>
      <div class="col-12 text-end"><button class="btn btn-primary" type="submit"><i class="bi bi-check2 me-1"></i>Saqlash</button></div></div></div></div></form>`));
  const f = ctx.root.querySelector('#f');
  f.onsubmit = (e) => { e.preventDefault(); withBusy(f.querySelector('[type=submit]'), async () => {
    try { await api.put('/candidate/profile', formData(f)); const u = session.user; session.set(session.token, { ...u, first_name: f.first_name.value, last_name: f.last_name.value }); toast("Profil saqlandi"); ctx.render(html``); (await import('../router.js')).render(); }
    catch (er) { toast(er.message, 'error'); } }); };
}

