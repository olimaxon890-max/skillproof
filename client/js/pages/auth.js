import { api, session } from '../api.js';
import { html, toast, withBusy, formData } from '../ui.js';
import { navigate, render } from '../router.js';
import { dashHome } from '../components/layout.js';

export default async function (ctx) {
  const login = ctx.opts.mode === 'login';
  const role = ctx.query.role === 'company' ? 'company' : 'candidate';
  ctx.render(html`<div class="auth-wrap page-enter">
    <div class="auth-art"><h2>${login ? 'Qaytganingiz bilan!' : "SkillProof'ga xush kelibsiz"}</h2><p class="opacity-75 mb-4">Haqiqiy bilimga asoslangan yollash platformasi.</p>
      <ul class="list-unstyled"><li><i class="bi bi-check-circle-fill me-2"></i>0–100 ballik aniq baholash</li><li><i class="bi bi-check-circle-fill me-2"></i>Xavfsiz kod tekshirish sandbox'i</li>
        <li><i class="bi bi-check-circle-fill me-2"></i>Kompaniya talablariga moslik tahlili</li><li><i class="bi bi-check-circle-fill me-2"></i>PDF natijalar va testlar tarixi</li></ul></div>
    <div class="auth-form"><div class="box"><h2 class="mb-1">${login ? 'Tizimga kirish' : "Ro'yxatdan o'tish"}</h2>
      <p class="text-muted mb-4">${login ? "Hisobingizga kirish uchun ma'lumotlarni kiriting." : "Yangi hisob yarating — bir daqiqa vaqt oladi."}</p>
      <form id="f" novalidate>
        ${login ? '' : html`<div class="role-pick mb-3"><input type="radio" name="role" id="r1" value="candidate" ${role === 'candidate' ? 'checked' : ''}><label for="r1"><i class="bi bi-person-workspace"></i>Ish izlovchi</label>
          <input type="radio" name="role" id="r2" value="company" ${role === 'company' ? 'checked' : ''}><label for="r2"><i class="bi bi-buildings"></i>Kompaniya</label></div>
          <div id="co" class="mb-3 ${role === 'company' ? '' : 'd-none'}"><label class="form-label">Kompaniya nomi</label><input class="form-control" name="company_name" placeholder="Masalan: Nova Soft" maxlength="120">
            <label class="form-label mt-3">Faoliyat yo'nalishi</label><input class="form-control" name="industry" placeholder="Masalan: Fintech" maxlength="120"></div>
          <div class="row g-3 mb-3"><div class="col-6"><label class="form-label">Ism</label><input class="form-control" name="first_name" required maxlength="60" autocomplete="given-name"></div>
            <div class="col-6"><label class="form-label">Familiya</label><input class="form-control" name="last_name" maxlength="60" autocomplete="family-name"></div></div>`}
        <div class="mb-3"><label class="form-label">Email</label><input class="form-control" type="email" name="email" required placeholder="email@misol.uz" autocomplete="email"></div>
        <div class="mb-3"><label class="form-label">Parol</label><div class="input-group"><input class="form-control" type="password" name="password" required minlength="${login ? 1 : 8}" placeholder="${login ? 'Parolingiz' : 'Kamida 8 ta belgi'}" autocomplete="${login ? 'current-password' : 'new-password'}"><button type="button" class="btn btn-light-soft" id="eye" aria-label="Parolni ko'rsatish"><i class="bi bi-eye"></i></button></div></div>
        <div class="alert alert-danger py-2 small d-none" id="err"></div>
        <button class="btn btn-primary w-100 btn-lg mt-2" type="submit">${login ? 'Kirish' : "Ro'yxatdan o'tish"}</button></form>
      <p class="text-center mt-4 text-muted">${login ? html`Hisobingiz yo'qmi? <a href="#/register">Ro'yxatdan o'ting</a>` : html`Hisobingiz bormi? <a href="#/login">Kirish</a>`}</p>
      ${login ? html`<div class="card-sp card-pad mt-3 small"><b class="d-block mb-2">Demo hisoblar (parol bilan to'ldirish):</b>
        <div class="d-flex flex-wrap gap-2"><button class="btn btn-sm btn-light-soft" data-demo="nomzod@demo.uz|Demo1234!">Nomzod</button><button class="btn btn-sm btn-light-soft" data-demo="hr@google-dev.uz|Demo1234!">Kompaniya</button><button class="btn btn-sm btn-light-soft" data-demo="admin@skillproof.uz|Admin123!">Super Admin</button></div></div>` : ''}
    </div></div></div>`);
  const f = ctx.root.querySelector('#f'), err = ctx.root.querySelector('#err');
  ctx.root.querySelector('#eye').onclick = () => { const i = f.password; i.type = i.type === 'password' ? 'text' : 'password'; };
  f.querySelectorAll('[name=role]').forEach((r) => (r.onchange = () => ctx.root.querySelector('#co').classList.toggle('d-none', r.value !== 'company' || !r.checked)));
  ctx.root.querySelectorAll('[data-demo]').forEach((b) => (b.onclick = () => { const [e, p] = b.dataset.demo.split('|'); f.email.value = e; f.password.value = p; }));
  f.onsubmit = async (e) => {
    e.preventDefault(); err.classList.add('d-none');
    const d = formData(f);
    const fail = (m) => { err.textContent = m; err.classList.remove('d-none'); };
    if (!d.email || !d.password) return fail('Email va parolni kiriting');
    if (!login) {
      if (!d.first_name.trim()) return fail('Ismingizni kiriting');
      if (d.password.length < 8) return fail("Parol kamida 8 ta belgidan iborat bo'lishi kerak");
      if (d.role === 'company' && !d.company_name.trim()) return fail('Kompaniya nomini kiriting');
    }
    await withBusy(f.querySelector('[type=submit]'), async () => {
      try {
        const r = await api.post(login ? '/auth/login' : '/auth/register', d);
        session.set(r.token, r.user);
        toast(login ? 'Xush kelibsiz!' : "Muvaffaqiyatli ro'yxatdan o'tdingiz!");
        if (!login && r.user.role === 'company') toast("Kompaniyangiz admin tomonidan tasdiqlangach, vakansiyalar ommaga ko'rinadi", 'info', 6000);
        const next = ctx.query.next;
        navigate(next && r.user.role === 'candidate' ? next : dashHome(r.user.role).slice(1));
      } catch (e2) { fail(e2.message); }
    });
  };
}

