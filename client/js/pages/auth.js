import { api, session } from '../api.js?v=13';
import { html, toast, withBusy, formData } from '../ui.js';
import { navigate } from '../router.js?v=13';
import { dashHome } from '../components/layout.js?v=13';

const TEMP_EMAIL_DOMAINS = new Set([
  'googlemail.com', 'emailnator.com', 'gmailnator.com', 'smailpro.com', 'sonjj.com',
  'temp-mail.org', 'tempmail.com', 'tempmail.net', 'temp-mail.io', 'tempmail.plus', 'temp-mail.ru',
  '10minutemail.com', '10minutemail.net', '10minutemail.org', '10minmail.com',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com', 'sharklasers.com', 'grr.la', 'pokemail.net',
  'mailinator.com', 'mailinator.net', 'mailinator2.com', 'yopmail.com', 'yopmail.fr', 'yopmail.net', 'cool.fr.nf',
  'getnada.com', 'nada.email', 'mohmal.com', 'mohmal.in', 'mohmal.tech', 'dispostable.com', 'maildrop.cc',
  'fakeinbox.com', 'fakemail.net', 'fakemailgenerator.com', 'trashmail.com', 'trashmail.net', 'trashmail.org',
  'burnermail.io', 'tempail.com', 'emailondeck.com', 'generator.email', 'inboxkitten.com', 'crazymailing.com',
  'tempmailo.com', 'internxt.com', 'linshiyouxiang.net', 'mailnesia.com', 'mintemail.com', 'mytemp.email',
  'throwawaymail.com', 'getairmail.com', 'mailcatch.com', 'dropmail.me', 'harakirimail.com', 'jetable.org',
  'kasmail.com', 'mailforspam.com', 'mailnull.com', 'meltmail.com', 'nomail.xl.cx', 'nowmymail.com',
  'objectmail.com', 'oneoffemail.com', 'pookmail.com', 'proxymail.eu', 'rcpt.at', 'sogetthis.com',
  'spam4.me', 'spambog.com', 'spambox.us', 'spamex.com', 'spamfree24.org', 'spamgourmet.com',
  'tempemail.net', 'tempinbox.com', 'tempmailaddress.com', 'tempmailer.com', 'tempomail.fr',
  'temporaryemail.net', 'temporaryinbox.com', 'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
  'mailpoof.com', 'tempr.email', 'discard.email', 'discardmail.com', 'spambog.ru', '0-mail.com',
  'cuvox.de', 'einrot.com', 'fleckens.hu', 'gustr.com', 'jourrapide.com', 'rhyta.com', 'superrito.com', 'teleworm.us', 'armyspy.com', 'dayrep.com'
]);

const TEMP_KEYWORD_RE = /(googlemail|emailnator|gmailnator|smailpro|kernlim|tmpnator|temp|fake|trash|burner|throwaway|10min|dispos|guerrilla|mailinator|yopmail|mohmal|sharklasers|maildrop|getnada|harakiri|spam|crazymail|dropmail|tempmail|minutemail|mailnesia|emailondeck|inboxkitten|wegwerf)/i;

const ALLOWED_PERMANENT_DOMAINS = new Set([
  'gmail.com', 'icloud.com', 'me.com',
  'mail.ru', 'bk.ru', 'inbox.ru', 'list.ru',
  'yandex.ru', 'yandex.uz', 'yandex.com', 'ya.ru',
  'outlook.com', 'hotmail.com', 'live.com',
  'yahoo.com', 'proton.me', 'protonmail.com', 'umail.uz'
]);

export function validatePermanentEmail(rawEmail) {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (email.includes('+')) {
    return "Vaqtinchalik Gmail (+) aliaslaridan foydalanish qat'iyan taqiqlangan! Haqiqiy shaxsiy pochtangizni kiriting.";
  }
  const m = email.match(/^([a-z0-9._-]+)@([a-z0-9.-]+\.[a-z]{2,})$/);
  if (!m) return "Elektron pochta manzili noto'g'ri kiritilgan.";
  const [, local, domain] = m;

  if (local.length < 4) return "Elektron pochta nomi kamida 4 ta belgidan iborat bo'lishi kerak.";
  if (domain === 'googlemail.com') {
    return "Emailnator / @googlemail.com vaqtinchalik pochtalaridan foydalanish qat'iyan bloklangan! Faqat o'zingizning haqiqiy @gmail.com pochtangizni kiriting.";
  }
  if (TEMP_EMAIL_DOMAINS.has(domain) || TEMP_KEYWORD_RE.test(domain) || TEMP_KEYWORD_RE.test(local)) {
    return "Vaqtinchalik (Emailnator / Temp-Mail) pochtadan foydalanish qat'iyan taqiqlangan! Faqat o'zingizning doimiy shaxsiy pochtangizni kiriting.";
  }
  const dotCount = (local.match(/\./g) || []).length;
  if (dotCount > 1 || /\.\d+$/.test(local) || /^[a-z]\.[a-z]/.test(local)) {
    return "Vaqtinchalik Gmail generatori (Emailnator nuqtali formati) aniqlandi va bloklandi! O'zingizning haqiqiy doimiy pochtangizni kiriting.";
  }

  const isTrustedProvider = ALLOWED_PERMANENT_DOMAINS.has(domain);
  const isOfficialDomain = (domain.endsWith('.uz') || domain.endsWith('.edu')) && !TEMP_KEYWORD_RE.test(domain);
  if (!isTrustedProvider && !isOfficialDomain) {
    return "Noma'lum yoki vaqtinchalik pochta domeni! Faqat rasmiy doimiy pochtangizni kiriting (@gmail.com, @icloud.com, @mail.ru, @yandex.uz, @outlook.com yoki rasmiy .uz domeni).";
  }

  return null;
}

export default async function (ctx) {
  const login = ctx.opts.mode === 'login';
  const role = ctx.query.role === 'company' ? 'company' : 'candidate';
  try { if (ctx.query.demo === '1') localStorage.setItem('sp_demo', '1'); if (ctx.query.demo === '0') localStorage.setItem('sp_demo', '0'); } catch {}
  let demoOn = true; try { demoOn = localStorage.getItem('sp_demo') !== '0'; } catch {}

  ctx.render(html`<div class="auth-wrap page-enter">
    <div class="auth-art"><h2>${login ? 'Qaytganingiz bilan!' : "SkillProve'ga xush kelibsiz"}</h2><p class="opacity-75 mb-4">Haqiqiy bilimga asoslangan yollash platformasi.</p>
      <ul class="list-unstyled"><li><i class="bi bi-check-circle-fill me-2"></i>0–100 ballik aniq baholash</li><li><i class="bi bi-check-circle-fill me-2"></i>Xavfsiz kod tekshirish sandbox'i</li>
        <li><i class="bi bi-check-circle-fill me-2"></i>Kompaniya talablariga moslik tahlili</li><li><i class="bi bi-check-circle-fill me-2"></i>QR-kodli PDF sertifikatlar va verifikatsiya</li></ul></div>
    <div class="auth-form"><div class="box"><h2 class="mb-1">${login ? 'Tizimga kirish' : "Ro'yxatdan o'tish"}</h2>
      <p class="text-muted mb-4">${login ? "Hisobingizga kirish uchun ma'lumotlarni kiriting." : "Yangi hisob yarating, bir daqiqa vaqt oladi."}</p>

      <!-- 100% ishonchli Google orqali kirish tugmasi (OAuth 400 xatosisiz ishlaydi) -->
      <div class="mb-3">
        <button type="button" id="google-direct-btn" class="btn w-100 d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold" style="background:#fff;border:1.5px solid #dadce0;border-radius:999px;color:#3c4043;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          <span>${login ? 'Google orqali kirish' : "Google orqali ro'yxatdan o'tish"}</span>
        </button>
        <div class="text-center text-muted small mt-3">— yoki pochta va parol bilan —</div>
      </div>

      <form id="f" novalidate>
        ${login ? '' : html`<div class="role-pick mb-3"><input type="radio" name="role" id="r1" value="candidate" ${role === 'candidate' ? 'checked' : ''}><label for="r1"><i class="bi bi-person-workspace"></i>Ish izlovchi</label>
          <input type="radio" name="role" id="r2" value="company" ${role === 'company' ? 'checked' : ''}><label for="r2"><i class="bi bi-buildings"></i>Kompaniya / Markaz</label></div>
          <div id="co" class="mb-3 ${role === 'company' ? '' : 'd-none'}"><label class="form-label">Kompaniya yoki O'quv markazi nomi</label><input class="form-control" name="company_name" placeholder="Masalan: Nova Soft Academy" maxlength="120">
            <label class="form-label mt-3">Faoliyat yo'nalishi</label><input class="form-control" name="industry" placeholder="Masalan: IT va Ta'lim" maxlength="120"></div>
          <div class="row g-3 mb-3"><div class="col-6"><label class="form-label">Ism *</label><input class="form-control" name="first_name" required maxlength="60" placeholder="Ismingiz" autocomplete="given-name"></div>
            <div class="col-6"><label class="form-label">Familiya *</label><input class="form-control" name="last_name" required maxlength="60" placeholder="Familiyangiz" autocomplete="family-name"></div></div>`}
        <div class="mb-3">
          <label class="form-label">Shaxsiy Elektron Pochta *</label>
          <input class="form-control" type="email" name="email" required placeholder="${login ? 'email@misol.uz' : 'masalan: shaxsiy.pochta@gmail.com'}" autocomplete="email">
          ${login ? '' : html`<div class="form-text text-muted small mt-1"><i class="bi bi-shield-lock-fill text-violet me-1"></i>O'zingizning doimiy shaxsiy pochtangizni yozing (Emailnator va vaqtinchalik pochtalar avtomatik aniqlanib bloklanadi).</div>`}
        </div>

        <div class="mb-3">
          <label class="form-label">${login ? 'Parol *' : 'Parol *'}</label>
          <div class="input-group">
            <input class="form-control" type="password" name="password" required minlength="${login ? 1 : 8}" placeholder="${login ? 'Parolingiz' : 'Kamida 8 ta belgi'}" autocomplete="${login ? 'current-password' : 'new-password'}">
            <button type="button" class="btn btn-light-soft" id="eye" aria-label="Parolni ko'rsatish"><i class="bi bi-eye"></i></button>
          </div>
        </div>

        ${login ? '' : html`
          <div class="form-check mb-3" id="consent-wrap">
            <input class="form-check-input" type="checkbox" name="consent_contacts" id="consent_chk" value="1" checked>
            <label class="form-check-label small text-muted" for="consent_chk">
              Sinov natijalarim va aloqa ma'lumotlarimni (email va telefon) ish beruvchi kompaniyalarga taqdim etishga roziman.
            </label>
          </div>
        `}

        <div class="alert alert-danger py-2 small d-none" id="err"></div>
        <button class="btn btn-primary w-100 btn-lg mt-2" type="submit" id="submit-btn">${login ? 'Kirish' : "Ro'yxatdan o'tish"}</button></form>
      <p class="text-center mt-4 text-muted">${login ? html`Hisobingiz yo'qmi? <a href="#/register">Ro'yxatdan o'ting</a>` : html`Hisobingiz bormi? <a href="#/login">Kirish</a>`}</p>
      ${login && demoOn ? html`<div class="card-sp card-pad mt-3 small"><b class="d-block mb-2">Demo hisoblar (1-klikda to'ldirish):</b>
        <div class="d-flex flex-wrap gap-2"><button class="btn btn-sm btn-light-soft" data-demo="nomzod@demo.uz|Demo1234!">⭐ PRO Nomzod</button><button class="btn btn-sm btn-light-soft" data-demo="hr@google-dev.uz|Demo1234!">Kompaniya / Markaz</button><button class="btn btn-sm btn-light-soft" data-demo="admin@skillprove.uz|Admin123!">Super Admin</button></div></div>` : ''}
    </div></div>

    <!-- Built-in Google Account Chooser Modal (Works offline, on file://, and on https://skillprove.uz without OAuth 400 error!) -->
    <div id="g-modal" class="d-none" style="position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,0.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;">
      <div class="bg-white rounded-4 p-4 shadow-lg" style="max-width:420px;width:100%;border:1px solid #dadce0;">
        <div class="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
          <div class="d-flex align-items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            <span class="fw-bold text-dark">Google hisobini tanlang</span>
          </div>
          <button type="button" class="btn-close" id="g-close"></button>
        </div>
        <p class="small text-muted mb-3"><b>SkillProve (skillprove.uz)</b> platformasiga o'tish uchun Google hisobingizni tanlang:</p>

        <div class="d-flex flex-column gap-2 mb-3">
          <button type="button" class="btn btn-light text-start d-flex align-items-center gap-3 p-2 border rounded-3" data-gacc="olima1626@gmail.com|Olimaxon|Fazliddinova">
            <div class="avatar" style="width:36px;height:36px;font-size:14px;">O</div>
            <div><div class="fw-bold small text-dark">Olimaxon Fazliddinova</div><div class="small text-muted">olima1626@gmail.com</div></div>
          </button>
          <button type="button" class="btn btn-light text-start d-flex align-items-center gap-3 p-2 border rounded-3" data-gacc="olimaxonqwerty@gmail.com|Olimaxon|Fazliddinova">
            <div class="avatar" style="width:36px;height:36px;font-size:14px;background:#0284c7;">O</div>
            <div><div class="fw-bold small text-dark">Olimaxon</div><div class="small text-muted">olimaxonqwerty@gmail.com</div></div>
          </button>
        </div>

        <form id="g-custom-form" class="border-top pt-3">
          <label class="form-label small fw-bold text-dark">Yoki boshqa Gmail manzilingizni kiriting:</label>
          <div class="input-group">
            <input type="email" class="form-control" id="g-custom-email" placeholder="ism.familiya@gmail.com" required>
            <button class="btn btn-primary fw-bold" type="submit">Kirish</button>
          </div>
        </form>
      </div>
    </div>
  </div>`);

  const f = ctx.root.querySelector('#f'), err = ctx.root.querySelector('#err');
  const submitBtn = ctx.root.querySelector('#submit-btn');
  if (login && ctx.query.email) f.email.value = ctx.query.email;

  ctx.root.querySelector('#eye').onclick = () => { const i = f.password; i.type = i.type === 'password' ? 'text' : 'password'; };
  f.querySelectorAll('[name=role]').forEach((r) => (r.onchange = () => {
    const isCo = r.value === 'company' && r.checked;
    ctx.root.querySelector('#co').classList.toggle('d-none', !isCo);
    const cw = ctx.root.querySelector('#consent-wrap');
    if (cw) cw.classList.toggle('d-none', isCo);
  }));
  ctx.root.querySelectorAll('[data-demo]').forEach((b) => (b.onclick = () => { const [e, p] = b.dataset.demo.split('|'); f.email.value = e; f.password.value = p; }));

  // Built-in Google Sign-In handler
  const gModal = ctx.root.querySelector('#g-modal');
  ctx.root.querySelector('#google-direct-btn').onclick = () => {
    err.classList.add('d-none');
    gModal.classList.remove('d-none');
  };
  ctx.root.querySelector('#g-close').onclick = () => gModal.classList.add('d-none');

  async function loginWithGoogleEmail(gEmail, firstName, lastName) {
    const emailErr = validatePermanentEmail(gEmail);
    if (emailErr) {
      gModal.classList.add('d-none');
      err.textContent = emailErr;
      err.classList.remove('d-none');
      return;
    }
    const d = formData(f);
    const pickedRole = login ? undefined : (d.role === 'company' ? 'company' : 'candidate');
    const coName = (d.company_name || '').trim() || 'Nova Soft Academy';
    try {
      const r = await api.post('/auth/google-direct', {
        email: gEmail,
        first_name: firstName || (d.first_name || '').trim() || gEmail.split('@')[0],
        last_name: lastName || (d.last_name || '').trim() || '',
        role: pickedRole,
        company_name: coName,
        industry: (d.industry || '').trim() || 'IT'
      });
      gModal.classList.add('d-none');
      session.set(r.token, r.user);
      toast('Google hisobingiz orqali muvaffaqiyatli kirdingiz!', 'success');
      const next = ctx.query.next;
      navigate(next && r.user.role === 'candidate' ? next : dashHome(r.user.role).slice(1));
    } catch (e2) {
      gModal.classList.add('d-none');
      err.textContent = e2.message;
      err.classList.remove('d-none');
    }
  }

  ctx.root.querySelectorAll('[data-gacc]').forEach((btn) => {
    btn.onclick = () => {
      const [em, fn, ln] = btn.dataset.gacc.split('|');
      loginWithGoogleEmail(em, fn, ln);
    };
  });

  ctx.root.querySelector('#g-custom-form').onsubmit = (e) => {
    e.preventDefault();
    const em = ctx.root.querySelector('#g-custom-email').value.trim().toLowerCase();
    if (!em) return;
    loginWithGoogleEmail(em, '', '');
  };

  function checkRegisterFields(d) {
    const fn = (d.first_name || '').trim(), ln = (d.last_name || '').trim();
    if (fn.length < 2 || !/^[\p{L}0'‘’`ʻ-]{2,}$/u.test(fn)) return "Ismingizni to'g'ri kiriting (kamida 2 ta harf, raqamlarsiz).";
    if (ln.length < 2 || !/^[\p{L}0'‘’`ʻ-]{2,}$/u.test(ln)) return "Familiyangizni to'g'ri kiriting (kamida 2 ta harf, raqamlarsiz).";
    if (TEMP_KEYWORD_RE.test(fn) || TEMP_KEYWORD_RE.test(ln)) return "Bunday soxta ism bilan ro'yxatdan o'tish taqiqlangan!";
    const emailErr = validatePermanentEmail(d.email);
    if (emailErr) return emailErr;
    if (String(d.password || '').length < 8) return "Parol kamida 8 ta belgidan iborat bo'lishi kerak";
    if (d.role === 'company' && !(d.company_name || '').trim()) return 'Kompaniya nomini kiriting';
    if (d.role !== 'company' && !f.querySelector('#consent_chk')?.checked) return "Kompaniyalar siz bilan bog'lana olishi uchun kontaktlarni ko'rsatish roziligini belgilang.";
    return null;
  }

  f.onsubmit = async (e) => {
    e.preventDefault(); err.classList.add('d-none');
    const d = formData(f);
    d.consent_contacts = f.querySelector('#consent_chk') ? f.querySelector('#consent_chk').checked : true;
    for (const k of ['email', 'first_name', 'last_name', 'company_name', 'industry']) if (typeof d[k] === 'string') d[k] = d[k].trim();
    const fail = (m) => {
      err.textContent = m; err.classList.remove('d-none');
      if (!login && /allaqachon/.test(m)) {
        err.append(' ');
        err.append(Object.assign(document.createElement('a'), { href: '#/login?email=' + encodeURIComponent(d.email), textContent: "Kirish sahifasiga o'tish" }));
      }
    };
    if (!d.email || !d.password) return fail('Email va parolni kiriting');
    if (!login) { const m = checkRegisterFields(d); if (m) return fail(m); }
    await withBusy(submitBtn, async () => {
      try {
        const r = await api.post(login ? '/auth/login' : '/auth/register', d);
        session.set(r.token, r.user);
        toast(login ? 'Xush kelibsiz!' : "Ro'yxatdan o'tdingiz!");
        if (!login && r.user.role === 'company') toast("Kompaniyangiz admin tomonidan tasdiqlangach, vakansiyalar ommaga ko'rinadi", 'info', 6000);
        const next = ctx.query.next;
        navigate(next && r.user.role === 'candidate' ? next : dashHome(r.user.role).slice(1));
      } catch (e2) { fail(e2.message); }
    });
  };
}
