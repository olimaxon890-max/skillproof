// Autentifikatsiya: ro'yxatdan o'tish, kirish, joriy foydalanuvchi
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { get, run, tx, log } = require('../db');
const { sign, auth, wrap } = require('../middleware');

const emailRe = /^([a-z0-9._-]+)@([a-z0-9.-]+\.[a-z]{2,})$/i;
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
  'mailpoof.com', 'tempr.email', 'discard.email', 'discardmail.com', 'spambog.ru', '0-mail.com'
]);
const TEMP_KEYWORD_RE = /(googlemail|emailnator|gmailnator|smailpro|kernlim|tmpnator|temp|fake|trash|burner|throwaway|10min|dispos|guerrilla|mailinator|yopmail|mohmal|sharklasers|maildrop|getnada|harakiri|spam|crazymail|dropmail|tempmail|minutemail|mailnesia|emailondeck|inboxkitten|wegwerf)/i;
const ALLOWED_PERMANENT_DOMAINS = new Set([
  'gmail.com', 'icloud.com', 'me.com',
  'mail.ru', 'bk.ru', 'inbox.ru', 'list.ru',
  'yandex.ru', 'yandex.uz', 'yandex.com', 'ya.ru',
  'outlook.com', 'hotmail.com', 'live.com',
  'yahoo.com', 'proton.me', 'protonmail.com', 'umail.uz'
]);

function checkPermanentEmail(rawEmail, firstName = '', lastName = '', role = 'candidate') {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (email.includes('+')) return "Vaqtinchalik Gmail (+) aliaslaridan foydalanish taqiqlangan";
  const m = email.match(emailRe);
  if (!m) return "Email manzili noto'g'ri";
  const [, local, domain] = m;
  if (local.length < 4) return "Email nomi kamida 4 ta belgidan iborat bo'lishi kerak";
  if (domain === 'googlemail.com') return "Emailnator / @googlemail.com vaqtinchalik pochtalaridan foydalanish bloklangan";
  const dotCount = (local.match(/\./g) || []).length;
  if (dotCount > 1 || /\.\d+$/.test(local) || /^[a-z]\.[a-z]/.test(local)) {
    return "Vaqtinchalik Gmail generatori (Emailnator nuqtali formati) aniqlandi va bloklandi";
  }
  if (TEMP_EMAIL_DOMAINS.has(domain) || TEMP_KEYWORD_RE.test(domain) || TEMP_KEYWORD_RE.test(local)) {
    return "Vaqtinchalik (Emailnator / Temp-Mail) pochtadan foydalanish qat'iyan taqiqlangan!";
  }
  const isTrusted = ALLOWED_PERMANENT_DOMAINS.has(domain);
  const isOfficial = (domain.endsWith('.uz') || domain.endsWith('.edu')) && !TEMP_KEYWORD_RE.test(domain);
  if (!isTrusted && !isOfficial) {
    return "Faqat doimiy rasmiy pochtadan foydalanish mumkin (@gmail.com, @icloud.com, @mail.ru, @yandex.uz, @outlook.com yoki rasmiy .uz domeni).";
  }
  return null;
}

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'kompaniya';
const publicUser = (u) => ({ id: u.id, email: u.email, role: u.role, first_name: u.first_name, last_name: u.last_name, company_id: u.company_id });

router.post('/register', wrap((req, res) => {
  const { email, password, role = 'candidate', first_name = '', last_name = '', company_name, industry = '' } = req.body || {};
  const emailErr = checkPermanentEmail(email, first_name, last_name, role);
  if (emailErr) return res.status(400).json({ error: emailErr });
  const pw = String(password || '');
  const pwLow = pw.toLowerCase();
  const pwLetters = pwLow.replace(/[^a-z]/g, '');
  const isMash = /[asdfghjkl]{4,}/.test(pwLow) || /[qwertyuiop]{4,}/.test(pwLow) || /[zxcvbnm]{4,}/.test(pwLow) || /[bcdfghjklmnpqrstvwxz]{4,}/.test(pwLetters) || /^(.)\1{2,}/.test(pwLow);
  const isSeq = /(1234|2345|3456|4567|5678|6789|9876|0000|1111|2222|password|parol)/i.test(pwLow);
  if (pw.length < 8 || !/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw) || !/[aeiouy]/i.test(pwLetters) || isMash || isSeq) {
    return res.status(400).json({ error: `Parol tasdiqlanmadi! Kiritilgan parol "${email}" shaxsiy pochtasining haqiqiy paroli emas. Shaxsiy pochtangizga qo'yilgan o'z parolini kiriting!` });
  }
  if (!password || password.length < 8) return res.status(400).json({ error: "Parol kamida 8 ta belgidan iborat bo'lishi kerak" });
  if (!['candidate', 'company'].includes(role)) return res.status(400).json({ error: "Noto'g'ri rol" });
  if (!first_name.trim()) return res.status(400).json({ error: 'Ismingizni kiriting' });
  if (role === 'company' && !(company_name || '').trim()) return res.status(400).json({ error: 'Kompaniya nomini kiriting' });
  const existing = get('SELECT * FROM users WHERE email=?', email.toLowerCase());
  if (existing) {
    if (!bcrypt.compareSync(String(password), existing.password_hash)) {
      return res.status(400).json({ error: `Parol xato! Kiritilgan parol "${email}" shaxsiy pochtasiga qo'yilgan haqiqiy parolga mos kelmadi!` });
    }
    return res.json({ token: sign(existing), user: publicUser(existing) });
  }

  const hash = bcrypt.hashSync(password, 10);
  const user = tx(() => {
    let companyId = null;
    if (role === 'company') {
      let slug = slugify(company_name), n = 1;
      while (get('SELECT id FROM companies WHERE slug=?', slug)) slug = slugify(company_name) + '-' + ++n;
      companyId = run('INSERT INTO companies (name, slug, industry, status) VALUES (?,?,?,?)', company_name.trim(), slug, industry, 'pending').id;
    }
    const id = run('INSERT INTO users (email, password_hash, role, first_name, last_name, company_id) VALUES (?,?,?,?,?,?)',
      email.toLowerCase(), hash, role, first_name.trim(), last_name.trim(), companyId).id;
    log(id, 'register', role === 'company' ? `Kompaniya: ${company_name}` : 'Nomzod');
    return get('SELECT * FROM users WHERE id=?', id);
  });
  res.status(201).json({ token: sign(user), user: publicUser(user) });
}));

router.post('/login', wrap((req, res) => {
  const { email = '', password = '' } = req.body || {};
  const u = get('SELECT * FROM users WHERE email=?', String(email).toLowerCase());
  if (!u || !bcrypt.compareSync(String(password), u.password_hash)) return res.status(401).json({ error: "Email yoki parol noto'g'ri" });
  if (u.status === 'blocked') return res.status(403).json({ error: 'Hisobingiz bloklangan' });
  log(u.id, 'login');
  res.json({ token: sign(u), user: publicUser(u) });
}));

router.get('/me', auth, wrap((req, res) => {
  const u = get('SELECT * FROM users WHERE id=?', req.user.id);
  const company = u.company_id ? get('SELECT id, name, status, logo FROM companies WHERE id=?', u.company_id) : null;
  res.json({ user: publicUser(u), company });
}));

module.exports = router;

