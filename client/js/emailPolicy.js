// Email siyosati: doimiy shaxsiy pochta talabi + Gmail "hiyla"lariga qarshi qo'shimcha qoidalar.
// Asosiy ro'yxatlar (qora ro'yxat, ruxsat etilgan domenlar) pages/auth.js dagi validatePermanentEmail da turadi.
import { validatePermanentEmail } from './pages/auth.js';

const GMAIL = new Set(['gmail.com', 'googlemail.com']);

export function validateEmail(raw) {
  const email = String(raw || '').trim().toLowerCase();
  const base = validatePermanentEmail(email);
  if (base) return base;
  const [local, domain] = email.split('@');
  if (local.includes('+')) return "Email ichida «+» belgisi bo'lishi mumkin emas. Oddiy, asosiy pochta manzilingizni kiriting.";
  if (GMAIL.has(domain) && (local.match(/\./g) || []).length > 1) {
    return "Gmail manzilida ko'pi bilan 1 ta nuqta bo'lishi mumkin. Oddiy, asosiy pochta manzilingizni kiriting.";
  }
  return null;
}

// Gmail uchun: nuqtalar olib tashlanadi, googlemail.com -> gmail.com.
// Shu tufayli o'.lim.axon@gmail.com va olimaxon@googlemail.com bitta hisob hisoblanadi.
export function canonicalEmail(raw) {
  const email = String(raw || '').trim().toLowerCase();
  const [local = '', domain = ''] = email.split('@');
  if (!GMAIL.has(domain)) return email;
  return local.split('+')[0].replace(/\./g, '') + '@gmail.com';
}
