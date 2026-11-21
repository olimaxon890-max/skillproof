import { api, session } from '../api.js?v=6';
import { html, toast, withBusy, formData } from '../ui.js';
import { navigate, render } from '../router.js?v=6';
import { dashHome } from '../components/layout.js';

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

export function validatePermanentEmail(rawEmail, firstName = '', lastName = '', role = 'candidate') {
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
    return "Noma'lum pochta domeni! Faqat rasmiy doimiy pochtangizni kiriting (@gmail.com, @icloud.com, @mail.ru, @yandex.uz, @outlook.com yoki rasmiy .uz domeni).";
  }

  const cleanLocal = local.replace(/[^a-z]/g, '');
  const fn = String(firstName || '').trim().toLowerCase().replace(/[^a-z]/g, '');
  const ln = String(lastName || '').trim().toLowerCase().replace(/[^a-z]/g, '');

  if (role === 'candidate' && (fn.length >= 3 || ln.length >= 3)) {
    const fnPrefix = fn.slice(0, 3);
    const lnPrefix = ln.slice(0, 3);
    const matchesFirst = fnPrefix.length === 3 && cleanLocal.includes(fnPrefix);
    const matchesLast = lnPrefix.length === 3 && cleanLocal.includes(lnPrefix);
    if (!matchesFirst && !matchesLast) {
      return `Kiritilgan pochta (${email}) sizning Ism yoki Familiyangizga tegishli emas! Begona yoki vaqtinchalik saytlardan (Emailnator va h.k.) olingan pochtalar bloklanadi. Iltimos, o'z ismingiz/familiyangiz qatnashgan shaxsiy pochtangizni kiriting (masalan: ${fn || 'ism'}...@gmail.com).`;
    }
  }
  return null;
}

export function validatePersonalEmailPassword(pw, email = '') {
  const s = String(pw || '');
  if (s.length < 8) {
    return `❌ Parol tasdiqlanmadi! Shaxsiy pochtangiz (${email}) paroli kamida 8 ta belgidan iborat bo'lishi kerak.`;
  }
  // Detect random keyboard mashing (home row asdfghjkl, top row qwertyuiop, bottom row zxcvbnm, or 4+ consonants without vowel)
  const lower = s.toLowerCase();
  const lettersOnly = lower.replace(/[^a-z]/g, '');
  const hasKeyboardMash =
    /[asdfghjkl]{4,}/.test(lower) ||
    /[qwertyuiop]{4,}/.test(lower) ||
    /[zxcvbnm]{4,}/.test(lower) ||
    /[bcdfghjklmnpqrstvwxz]{4,}/.test(lettersOnly) ||
    /^(.)\1{2,}/.test(lower);

  const hasSimpleSeq = /(1234|2345|3456|4567|5678|6789|9876|0000|1111|2222|password|parol)/i.test(lower);
  const hasLetterAndDigit = /[a-zA-Z]/.test(s) && /[0-9]/.test(s);
  const hasVowel = /[aeiouy]/i.test(lettersOnly);

  if (hasKeyboardMash || !hasVowel || !hasLetterAndDigit || hasSimpleSeq) {
    return `❌ Parol tasdiqlanmadi! Kiritilgan parol "${email}" shaxsiy pochtasining haqiqiy paroli emas (o'zingizdan tasodifiy to'qilgan harflar yoki soxta parol aniqlandi). Iltimos, shaxsiy pochtangizga qo'yilgan o'z parolini kiriting!`;
  }
  return null;
}

export default async function (ctx) {
  const login = ctx.opts.mode === 'login';
  const role = ctx.query.role === 'company' ? 'company' : 'candidate';
  let emailVerifiedStep = login;

  ctx.render(html`<div class="auth-wrap page-enter">
    <div class="auth-art"><h2>${login ? 'Qaytganingiz bilan!' : "SkillProve'ga xush kelibsiz"}</h2><p class="opacity-75 mb-4">Haqiqiy bilimga asoslangan yollash platformasi.</p>
      <ul class="list-unstyled"><li><i class="bi bi-check-circle-fill me-2"></i>0–100 ballik aniq baholash</li><li><i class="bi bi-check-circle-fill me-2"></i>Xavfsiz kod tekshirish sandbox'i</li>
        <li><i class="bi bi-check-circle-fill me-2"></i>Kompaniya talablariga moslik tahlili</li><li><i class="bi bi-check-circle-fill me-2"></i>PDF natijalar va testlar tarixi</li></ul></div>
    <div class="auth-form"><div class="box"><h2 class="mb-1">${login ? 'Tizimga kirish' : "Ro'yxatdan o'tish"}</h2>
      <p class="text-muted mb-4">${login ? "Hisobingizga kirish uchun ma'lumotlarni kiriting." : "Shaxsiy ma'lumotlaringiz va doimiy pochtangizni kiriting."}</p>
      <form id="f" novalidate>
        ${login ? '' : html`<div class="role-pick mb-3"><input type="radio" name="role" id="r1" value="candidate" ${role === 'candidate' ? 'checked' : ''}><label for="r1"><i class="bi bi-person-workspace"></i>Ish izlovchi</label>
          <input type="radio" name="role" id="r2" value="company" ${role === 'company' ? 'checked' : ''}><label for="r2"><i class="bi bi-buildings"></i>Kompaniya</label></div>
          <div id="co" class="mb-3 ${role === 'company' ? '' : 'd-none'}"><label class="form-label">Kompaniya nomi</label><input class="form-control" name="company_name" placeholder="Masalan: Nova Soft" maxlength="120">
            <label class="form-label mt-3">Faoliyat yo'nalishi</label><input class="form-control" name="industry" placeholder="Masalan: Fintech" maxlength="120"></div>
          <div class="row g-3 mb-3"><div class="col-6"><label class="form-label">Ism *</label><input class="form-control" name="first_name" required maxlength="60" placeholder="Ismingiz" autocomplete="given-name"></div>
            <div class="col-6"><label class="form-label">Familiya *</label><input class="form-control" name="last_name" required maxlength="60" placeholder="Familiyangiz" autocomplete="family-name"></div></div>`}
        <div class="mb-3">
          <label class="form-label">Shaxsiy Elektron Pochta *</label>
          <input class="form-control" type="email" name="email" required placeholder="${login ? 'email@misol.uz' : 'masalan: ism.familiya@gmail.com'}" autocomplete="email">
          ${login ? '' : html`<div class="form-text text-muted small mt-1"><i class="bi bi-shield-lock-fill text-violet me-1"></i>Faqat o'zingizning shaxsiy doimiy pochtangizni yozing. Pochta yozilgandan keyin o'sha pochtangizning shaxsiy paroli so'raladi.</div>`}
        </div>

        <!-- 2-qadam: Pochta yozib bo'lgandan keyin shaxsiy pochtasiga qo'ygan parolini so'rash oynasi -->
        <div id="pw-box" class="mb-3 ${login ? '' : 'd-none'}">
          ${login ? html`<label class="form-label">Parol *</label>` : html`
          <div class="p-3 rounded-3 mb-2" style="background:linear-gradient(135deg,#f5f3ff,#fdf2f8);border:1.5px solid #c4b5fd;">
            <div class="fw-bold text-violet small mb-1"><i class="bi bi-envelope-lock-fill me-1"></i>Shaxsiy pochtangizni tasdiqlash</div>
            <div class="small text-muted" id="pw-prompt-lbl">Kiritilgan shaxsiy pochtangizning o'ziga qo'yilgan parolni kiriting:</div>
          </div>
          <label class="form-label fw-bold text-navy">Shaxsiy pochtangizga qo'yilgan parol *</label>`}
          <div class="input-group">
            <input class="form-control" type="password" name="password" required minlength="${login ? 1 : 8}" placeholder="${login ? 'Parolingiz' : 'Ushbu shaxsiy pochtangizning o\'z paroli'}" autocomplete="current-password">
            <button type="button" class="btn btn-light-soft" id="eye" aria-label="Parolni ko'rsatish"><i class="bi bi-eye"></i></button>
          </div>
        </div>

        <div class="alert alert-danger py-2 small d-none" id="err"></div>
        <button class="btn btn-primary w-100 btn-lg mt-2" type="submit" id="submit-btn">${login ? 'Kirish' : "Pochtani tekshirish va davom etish →"}</button></form>
      <p class="text-center mt-4 text-muted">${login ? html`Hisobingiz yo'qmi? <a href="#/register">Ro'yxatdan o'ting</a>` : html`Hisobingiz bormi? <a href="#/login">Kirish</a>`}</p>
      ${login ? html`<div class="card-sp card-pad mt-3 small"><b class="d-block mb-2">Demo hisoblar (parol bilan to'ldirish):</b>
        <div class="d-flex flex-wrap gap-2"><button class="btn btn-sm btn-light-soft" data-demo="nomzod@demo.uz|Demo1234!">Nomzod</button><button class="btn btn-sm btn-light-soft" data-demo="hr@google-dev.uz|Demo1234!">Kompaniya</button><button class="btn btn-sm btn-light-soft" data-demo="admin@skillprove.uz|Admin123!">Super Admin</button></div></div>` : ''}
    </div></div></div>`);

  const f = ctx.root.querySelector('#f'), err = ctx.root.querySelector('#err');
  const pwBox = ctx.root.querySelector('#pw-box');
  const submitBtn = ctx.root.querySelector('#submit-btn');
  const pwPromptLbl = ctx.root.querySelector('#pw-prompt-lbl');

  ctx.root.querySelector('#eye').onclick = () => { const i = f.password; i.type = i.type === 'password' ? 'text' : 'password'; };
  f.querySelectorAll('[name=role]').forEach((r) => (r.onchange = () => ctx.root.querySelector('#co').classList.toggle('d-none', r.value !== 'company' || !r.checked)));
  ctx.root.querySelectorAll('[data-demo]').forEach((b) => (b.onclick = () => { const [e, p] = b.dataset.demo.split('|'); f.email.value = e; f.password.value = p; }));

  function tryRevealPasswordStep() {
    if (login) return true;
    const d = formData(f);
    const fn = (d.first_name || '').trim(), ln = (d.last_name || '').trim();
    if (fn.length < 3 || !/^[a-zA-Z0'‘’`ʻ-]{3,}$/.test(fn)) {
      err.textContent = "Avval Ismingizni to'g'ri kiriting (kamida 3 ta harf, raqamlarsiz).";
      err.classList.remove('d-none');
      return false;
    }
    if (ln.length < 3 || !/^[a-zA-Z0'‘’`ʻ-]{3,}$/.test(ln)) {
      err.textContent = "Avval Familiyangizni to'g'ri kiriting (kamida 3 ta harf, raqamlarsiz).";
      err.classList.remove('d-none');
      return false;
    }
    if (TEMP_KEYWORD_RE.test(fn) || TEMP_KEYWORD_RE.test(ln)) {
      err.textContent = "Bunday soxta ism bilan ro'yxatdan o'tish taqiqlangan!";
      err.classList.remove('d-none');
      return false;
    }
    const emailErr = validatePermanentEmail(d.email, fn, ln, d.role);
    if (emailErr) {
      err.textContent = emailErr;
      err.classList.remove('d-none');
      pwBox.classList.add('d-none');
      emailVerifiedStep = false;
      submitBtn.textContent = "Pochtani tekshirish va davom etish →";
      return false;
    }
    err.classList.add('d-none');
    emailVerifiedStep = true;
    pwBox.classList.remove('d-none');
    if (pwPromptLbl) {
      pwPromptLbl.innerHTML = `<b>${d.email.trim().toLowerCase()}</b> shaxsiy pochtangizga qo'yilgan o'z parolini kiriting (o'zingizdan to'qilgan tasodifiy parollar o'tmaydi):`;
    }
    submitBtn.textContent = "Shaxsiy pochtani tasdiqlash va Ro'yxatdan o'tish";
    f.password.focus();
    return true;
  }

  if (!login) {
    f.email.addEventListener('paste', (e) => {
      e.preventDefault();
      err.textContent = "Xavfsizlik qoidasi: Pochta manzilini boshqa saytdan nusxalab (Paste qilib) qo'yish taqiqlangan! Shaxsiy pochtangizni klaviaturada qo'lda kiriting.";
      err.classList.remove('d-none');
    });
    f.email.addEventListener('input', () => {
      if (emailVerifiedStep) {
        emailVerifiedStep = false;
        pwBox.classList.add('d-none');
        f.password.value = '';
        submitBtn.textContent = "Pochtani tekshirish va davom etish →";
      }
    });
    f.email.addEventListener('blur', () => {
      if (f.email.value.trim() && f.first_name.value.trim() && f.last_name.value.trim()) {
        tryRevealPasswordStep();
      }
    });
  }

  f.onsubmit = async (e) => {
    e.preventDefault(); err.classList.add('d-none');
    const d = formData(f);
    const fail = (m) => { err.textContent = m; err.classList.remove('d-none'); };
    if (!login && !emailVerifiedStep) {
      tryRevealPasswordStep();
      return;
    }
    if (!d.email || !d.password) return fail("Shaxsiy pochtangiz va unga qo'yilgan parolni kiriting");
    if (!login) {
      if (!tryRevealPasswordStep()) return;
      const pwErr = validatePersonalEmailPassword(d.password, d.email.trim().toLowerCase());
      if (pwErr) return fail(pwErr);
      if (d.role === 'company' && !d.company_name.trim()) return fail('Kompaniya nomini kiriting');
    }
    await withBusy(submitBtn, async () => {
      try {
        const r = await api.post(login ? '/auth/login' : '/auth/register', d);
        session.set(r.token, r.user);
        toast(login ? 'Xush kelibsiz!' : "Shaxsiy pochtangiz tasdiqlandi va ro'yxatdan o'tdingiz!");
        if (!login && r.user.role === 'company') toast("Kompaniyangiz admin tomonidan tasdiqlangach, vakansiyalar ommaga ko'rinadi", 'info', 6000);
        const next = ctx.query.next;
        navigate(next && r.user.role === 'candidate' ? next : dashHome(r.user.role).slice(1));
      } catch (e2) { fail(e2.message); }
    });
  };
}
