// API mijozi: Node.js backend mavjud bo'lsa u bilan ishlaydi,
// aks holda (masalan GitHub Pages *.github.io da) avtomatik ravishda
// brauzer ichidagi to'liq funksional mockBackend ga ulanadi!
const KEY = 'sp_token', UKEY = 'sp_user';

export const session = {
  get token() { return localStorage.getItem(KEY); },
  get user() {
    try {
      const u = JSON.parse(localStorage.getItem(UKEY));
      if (u && /googlemail|kernlim|emailnator/i.test(u.email || '')) {
        localStorage.removeItem(KEY);
        localStorage.removeItem(UKEY);
        return null;
      }
      return u;
    } catch { return null; }
  },
  set(token, user) { localStorage.setItem(KEY, token); localStorage.setItem(UKEY, JSON.stringify(user)); },
  clear() { localStorage.removeItem(KEY); localStorage.removeItem(UKEY); },
};

// Backend rejimi bir marta aniqlanadi va keyin o'zgarmaydi ('server' yoki 'mock').
// Eski kodda har bir javob rejimni o'zgartirib yuborar edi, shuning uchun ba'zan
// so'rovlar noto'g'ri joyga ketib "Xatolik yuz berdi" chiqar edi.
let mode = location.hostname.endsWith('github.io') ? 'mock' : null;
let detecting = null;
function detect() {
  if (mode) return Promise.resolve(mode);
  detecting ||= (async () => {
    if (location.protocol === 'file:') return (mode = 'mock');
    let r;
    try { r = await fetch('/api/public/stats', { headers: { Accept: 'application/json' }, cache: 'no-store' }); }
    catch { detecting = null; throw new Error("Serverga ulanib bo'lmadi. Internet yoki serverni tekshiring"); }
    const ct = r.headers.get('content-type') || '';
    // Statik hosting (GitHub Pages) API ga HTML 404/405 qaytaradi -> brauzer ichidagi baza
    mode = ct.includes('application/json') || r.status >= 500 ? 'server' : 'mock';
    return mode;
  })();
  return detecting;
}

async function callMock(method, path, body) {
  const { handleMock } = await import('./mockBackend.js?v=7');
  try {
    return await handleMock(method, path, body, session.user);
  } catch (e) {
    if (e.status === 401 && session.token) { session.clear(); location.hash = '#/login'; }
    throw e;
  }
}

async function request(method, path, body, raw = false) {
  if ((await detect()) === 'mock') return callMock(method, path, body);

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (session.token) headers.Authorization = 'Bearer ' + session.token;
  let res;
  // Hosting uyg'onayotganda (502/503/504) so'rov serverga yetmagan bo'ladi, shuning uchun 2 marta qayta uriniladi
  for (let attempt = 0; ; attempt++) {
    try {
      res = await fetch('/api' + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    } catch {
      throw new Error("Serverga ulanib bo'lmadi. Internet yoki serverni tekshiring");
    }
    if ([502, 503, 504].includes(res.status) && attempt < 2) { await new Promise((r) => setTimeout(r, 1500 * (attempt + 1))); continue; }
    break;
  }
  if (raw && res.ok) return res;
  const text = await res.text().catch(() => '');
  let data = {};
  try { data = JSON.parse(text); } catch {}
  if (!res.ok) {
    if (res.status === 401 && session.token) { session.clear(); location.hash = '#/login'; }
    if (data.error === undefined) console.error('API xatosi', method, path, res.status, text.slice(0, 300));
    const fallback = res.status === 429 ? "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring"
      : res.status === 413 ? "Yuborilayotgan ma'lumot juda katta"
      : res.status >= 500 ? `Server vaqtincha ishlamayapti (HTTP ${res.status}). Birozdan keyin qayta urinib ko'ring`
      : `So'rov rad etildi (HTTP ${res.status}). Sahifani yangilab qayta urinib ko'ring`;
    const err = new Error(data.error || fallback);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b = {}) => request('POST', p, b),
  put: (p, b = {}) => request('PUT', p, b),
  del: (p) => request('DELETE', p),
  async download(path, filename) {
    if ((await detect()) === 'mock') {
      window.print();
      return;
    }
    const res = await request('GET', path, undefined, true);
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },
};
