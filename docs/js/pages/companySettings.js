import { api } from '../api.js';
import { html, skeletonCards, toast, withBusy, formData, logo } from '../ui.js';
import { dash, pageHead } from '../components/layout.js';

export default async function (ctx) {
  ctx.render(dash('company', html`${pageHead('Kompaniya sozlamalari')}${skeletonCards(2, 'col-md-6')}`));
  let c;
  try { c = await api.get('/company/profile'); } catch (e) { return toast(e.message, 'error'); }
  if (!ctx.isCurrent()) return;
  let logoData = c.logo || '';
  ctx.render(dash('company', html`${pageHead('Kompaniya sozlamalari', "Kompaniya profili ommaviy sahifada ko'rinadi")}
    ${c.status !== 'approved' ? html`<div class="alert alert-warning">Holat: <b>${c.status === 'pending' ? 'Tasdiqlanish kutilmoqda' : 'Bloklangan'}</b></div>` : ''}
    <form id="f" class="row g-4"><div class="col-lg-4"><div class="card-sp card-pad text-center"><div id="lg" class="d-flex justify-content-center mb-3"></div><div class="fw-bold fs-5">${c.name}</div>
      <label class="btn btn-light-soft btn-sm mt-3"><i class="bi bi-upload me-1"></i>Logotip yuklash<input type="file" id="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden></label>
      <button type="button" class="btn btn-sm btn-link text-danger d-block mx-auto" id="rm">Olib tashlash</button><div class="form-text">PNG, JPG yoki SVG, 250 KB gacha</div></div></div>
    <div class="col-lg-8"><div class="card-sp card-pad"><div class="row g-3">
      <div class="col-md-6"><label class="form-label">Kompaniya nomi *</label><input class="form-control" name="name" value="${c.name}" required maxlength="120"></div>
      <div class="col-md-6"><label class="form-label">Faoliyat yo'nalishi</label><input class="form-control" name="industry" value="${c.industry}" maxlength="120"></div>
      <div class="col-md-4"><label class="form-label">Shahar</label><input class="form-control" name="city" value="${c.city}"></div>
      <div class="col-md-4"><label class="form-label">Xodimlar soni</label><input class="form-control" name="size" value="${c.size}" placeholder="50-100"></div>
      <div class="col-md-4"><label class="form-label">Veb-sayt</label><input class="form-control" name="website" value="${c.website}" placeholder="https://"></div>
      <div class="col-12"><label class="form-label">Kompaniya haqida</label><textarea class="form-control" rows="5" name="description" maxlength="2000">${c.description}</textarea></div>
      <div class="col-12 text-end"><button class="btn btn-primary" type="submit"><i class="bi bi-check2 me-1"></i>Saqlash</button></div></div></div></div></form>`));
  const f = ctx.root.querySelector('#f'), lg = ctx.root.querySelector('#lg');
  const paint = () => (lg.innerHTML = logo(f.name.value || c.name, logoData, 'lg').toString());
  paint(); f.name.oninput = paint;
  ctx.root.querySelector('#file').onchange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 250 * 1024) return toast('Fayl hajmi 250 KB dan oshmasligi kerak', 'error');
    const r = new FileReader(); r.onload = () => { logoData = r.result; paint(); }; r.readAsDataURL(file);
  };
  ctx.root.querySelector('#rm').onclick = () => { logoData = ''; paint(); };
  f.onsubmit = (e) => { e.preventDefault(); withBusy(f.querySelector('[type=submit]'), async () => {
    try { await api.put('/company/profile', { ...formData(f), logo: logoData }); toast('Sozlamalar saqlandi'); } catch (er) { toast(er.message, 'error'); } }); };
}

