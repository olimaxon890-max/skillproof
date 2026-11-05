// API mijozi: Node.js backend mavjud bo'lsa u bilan ishlaydi,
// aks holda (masalan GitHub Pages *.github.io da) avtomatik ravishda
// brauzer ichidagi to'liq funksional mockBackend ga ulanadi!
const KEY = 'sp_token', UKEY = 'sp_user';

export const session = {
  get token() { return localStorage.getItem(KEY); },
  get user() { try { return JSON.parse(localStorage.getItem(UKEY)); } catch { return null; } },
  set(token, user) { localStorage.setItem(KEY, token); localStorage.setItem(UKEY, JSON.stringify(user)); },
  clear() { localStorage.removeItem(KEY); localStorage.removeItem(UKEY); },
};

let useMock = location.hostname.endsWith('github.io') ? true : null;

async function callMock(method, path, body) {
  const { handleMock } = await import('./mockBackend.js');
  return handleMock(method, path, body, session.user);
}

async function request(method, path, body, raw = false) {
  if (useMock === true) return callMock(method, path, body);

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (session.token) headers.Authorization = 'Bearer ' + session.token;
  let res;
  try {
    res = await fetch('/api' + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    const ct = res.headers.get('content-type') || '';
    if (res.status === 404 && !ct.includes('application/json') && useMock === null) {
      useMock = true;
      return callMock(method, path, body);
    }
    useMock = false;
  } catch {
    if (useMock === null) {
      useMock = true;
      return callMock(method, path, body);
    }
    throw new Error("Serverga ulanib bo'lmadi. Internet yoki serverni tekshiring");
  }
  if (raw && res.ok) return res;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && session.token) { session.clear(); location.hash = '#/login'; }
    const err = new Error(data.error || 'Xatolik yuz berdi');
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
    if (useMock) {
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
