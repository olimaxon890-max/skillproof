// GitHub Pages (statik hosting) uchun to'liq LocalStorage + In-Browser API emulatori.
// Node.js backend mavjud bo'lmaganda (masalan *.github.io da) avtomatik ishga tushadi!

const DB_KEY = 'sp_static_db_v1';

const VERDICTS = {
  full: "Talablarga to'liq mos",
  interview: 'Suhbatga tavsiya etiladi',
  review: "Qo'shimcha tekshiruv talab etiladi",
  no: 'Hozircha talabga mos emas',
};

function initDb() {
  const saved = localStorage.getItem(DB_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  const categories = [
    { id: 1, name: 'Frontend dasturchi', icon: 'bi-window-stack', description: '' },
    { id: 2, name: 'Backend dasturchi', icon: 'bi-hdd-network', description: '' },
    { id: 3, name: 'Full Stack dasturchi', icon: 'bi-layers', description: '' },
    { id: 4, name: 'Mobile dasturchi', icon: 'bi-phone', description: '' },
    { id: 5, name: 'DevOps muhandisi', icon: 'bi-cloud-check', description: '' },
    { id: 6, name: 'UI/UX dizayner', icon: 'bi-palette', description: '' },
    { id: 7, name: 'Marketing', icon: 'bi-megaphone', description: '' },
    { id: 8, name: 'Buxgalteriya va moliya', icon: 'bi-calculator', description: '' },
    { id: 9, name: 'Menejment', icon: 'bi-kanban', description: '' },
  ];
  const techPairs = [
    [1, ['HTML5', 'CSS3', 'SCSS', 'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Bootstrap', 'Responsive Design']],
    [2, ['Node.js', 'Python', 'Java', 'PHP', 'C#', 'SQL', 'PostgreSQL', 'MongoDB', 'REST API']],
    [3, ["Ma'lumotlar bazasi", 'API', 'Dasturiy arxitektura']],
    [4, ['Flutter', 'Dart', 'Kotlin', 'Swift', 'React Native']],
    [5, ['Docker', 'Kubernetes', 'Linux', 'AWS', 'CI/CD', 'Git']],
    [6, ['Figma', 'UX Research', 'Wireframe', 'Prototyping', 'Design System']],
  ];
  const technologies = [];
  let tid = 1;
  const tMap = {};
  for (const [cid, list] of techPairs) {
    for (const name of list) {
      tMap[name] = tid;
      technologies.push({ id: tid++, name, category_id: cid });
    }
  }
  const companies = [
    { id: 1, name: 'Google Developer Team', slug: 'google-developer-team', industry: 'Axborot texnologiyalari', city: 'Toshkent', size: '200+', logo: '', status: 'approved', website: 'https://example.com', description: "Zamonaviy veb va mobil mahsulotlar ustida ishlovchi xalqaro dasturchilar jamoasi. Biz bilimga asoslangan yollashga ishonamiz.", created_at: new Date().toISOString() },
    { id: 2, name: 'Nova Soft', slug: 'nova-soft', industry: "Dasturiy ta'minot ishlab chiqish", city: 'Samarqand', size: '50-100', logo: '', status: 'approved', website: '', description: "Buyurtma asosida dasturiy mahsulotlar yaratuvchi autsorsing kompaniya. Yosh va tashabbuskor jamoa.", created_at: new Date().toISOString() },
    { id: 3, name: 'PayFlow', slug: 'payflow', industry: 'Fintech', city: 'Toshkent', size: '100-200', logo: '', status: 'approved', website: '', description: "To'lov tizimlari va moliyaviy texnologiyalar yaratuvchi tez rivojlanayotgan kompaniya.", created_at: new Date().toISOString() },
    { id: 4, name: 'CloudWave', slug: 'cloudwave', industry: 'Bulutli xizmatlar va DevOps', city: 'Toshkent', size: '20-50', logo: '', status: 'approved', website: '', description: "Bulutli infratuzilma va avtomatlashtirish bo'yicha mutaxassis jamoa.", created_at: new Date().toISOString() },
    { id: 5, name: 'Pixel Studio', slug: 'pixel-studio', industry: 'Dizayn va kreativ', city: 'Buxoro', size: '10-20', logo: '', status: 'approved', website: '', description: "Mahsulot dizayni va foydalanuvchi tajribasi bo'yicha ixtisoslashgan studiya.", created_at: new Date().toISOString() },
    { id: 6, name: 'Bazaar Mobile', slug: 'bazaar-mobile', industry: 'Mobil ilovalar', city: 'Namangan', size: '30-60', logo: '', status: 'approved', website: '', description: "Onlayn savdo uchun mobil ilovalar yaratadi. Flutter bo'yicha kuchli jamoa.", created_at: new Date().toISOString() },
    { id: 7, name: 'Yangi Startap', slug: 'yangi-startap', industry: 'Startap', city: 'Toshkent', size: '10', logo: '', status: 'pending', website: '', description: 'Tasdiqlashni kutayotgan demo kompaniya', created_at: new Date().toISOString() },
  ];
  const jobs = [
    { id: 1, company_id: 1, title: 'Frontend Developer', category_id: 1, salary: '$1500 - $2500', employment: "To'liq stavka", min_score: 75, duration_min: 25, questions_per_tech: 3, status: 'open', description: "React asosidagi katta veb-ilovalarni yaratish va qo'llab-quvvatlash.", requirements: [{ id: tMap.HTML5, name: 'HTML5', min_score: 70 }, { id: tMap.CSS3, name: 'CSS3', min_score: 75 }, { id: tMap.JavaScript, name: 'JavaScript', min_score: 80 }, { id: tMap.React, name: 'React', min_score: 75 }] },
    { id: 2, company_id: 1, title: 'Backend Developer (Node.js)', category_id: 2, salary: '$1800 - $3000', employment: "To'liq stavka", min_score: 70, duration_min: 25, questions_per_tech: 3, status: 'open', description: "Node.js va PostgreSQL asosida masshtablanuvchi REST API'lar yaratish.", requirements: [{ id: tMap['Node.js'], name: 'Node.js', min_score: 75 }, { id: tMap.SQL, name: 'SQL', min_score: 70 }, { id: tMap['REST API'], name: 'REST API', min_score: 70 }] },
    { id: 3, company_id: 2, title: 'Full Stack Developer', category_id: 3, salary: '$1200 - $2200', employment: "To'liq stavka", min_score: 70, duration_min: 30, questions_per_tech: 3, status: 'open', description: "Frontend va backend qismlarini yaxlit ishlab chiqish.", requirements: [{ id: tMap.HTML5, name: 'HTML5', min_score: 65 }, { id: tMap.JavaScript, name: 'JavaScript', min_score: 75 }, { id: tMap.React, name: 'React', min_score: 65 }, { id: tMap['Node.js'], name: 'Node.js', min_score: 65 }] },
    { id: 4, company_id: 3, title: 'Python Backend Developer', category_id: 2, salary: '$2000 - $3500', employment: "To'liq stavka", min_score: 75, duration_min: 25, questions_per_tech: 3, status: 'open', description: "To'lov tizimlari uchun xavfsiz va tezkor servislar yaratish.", requirements: [{ id: tMap.Python, name: 'Python', min_score: 75 }, { id: tMap.SQL, name: 'SQL', min_score: 75 }, { id: tMap['REST API'], name: 'REST API', min_score: 75 }] },
    { id: 5, company_id: 4, title: 'DevOps Engineer', category_id: 5, salary: '$2000 - $3500', employment: "To'liq stavka", min_score: 70, duration_min: 30, questions_per_tech: 3, status: 'open', description: "CI/CD jarayonlari, Docker va Kubernetes klasterlarini boshqarish.", requirements: [{ id: tMap.Docker, name: 'Docker', min_score: 75 }, { id: tMap.Linux, name: 'Linux', min_score: 70 }, { id: tMap.Git, name: 'Git', min_score: 70 }] },
    { id: 6, company_id: 5, title: 'UI/UX Designer', category_id: 6, salary: '$900 - $1800', employment: "To'liq stavka", min_score: 70, duration_min: 20, questions_per_tech: 3, status: 'open', description: "Veb va mobil ilovalar uchun foydalanuvchi interfeyslarini loyihalash.", requirements: [{ id: tMap.Figma, name: 'Figma', min_score: 75 }, { id: tMap['UX Research'], name: 'UX Research', min_score: 65 }] },
    { id: 7, company_id: 6, title: 'Flutter Developer', category_id: 4, salary: '$1200 - $2400', employment: "To'liq stavka", min_score: 70, duration_min: 25, questions_per_tech: 3, status: 'open', description: "Android va iOS uchun yagona kod bazasida ilovalar yaratish.", requirements: [{ id: tMap.Flutter, name: 'Flutter', min_score: 75 }, { id: tMap.Git, name: 'Git', min_score: 60 }] },
  ];
  const questions = [
    { id: 1, technology_id: tMap.HTML5, tech: 'HTML5', type: 'choice', text: "Sahifada eng muhim sarlavhani belgilash uchun qaysi teg ishlatiladi?", options: ['<head>', '<h1>', '<title>', '<header>'], answer: '1', points: 1, difficulty: 'oson' },
    { id: 2, technology_id: tMap.HTML5, tech: 'HTML5', type: 'truefalse', text: "<img> tegida alt atributi qulaylik (accessibility) uchun muhim.", options: [], answer: 'true', points: 1, difficulty: 'oson' },
    { id: 3, technology_id: tMap.CSS3, tech: 'CSS3', type: 'choice', text: "Flexbox'da elementlarni asosiy o'q bo'ylab markazlash xususiyati qaysi?", options: ['align-items', 'justify-content', 'place-self', 'flex-wrap'], answer: '1', points: 1, difficulty: "o'rta" },
    { id: 4, technology_id: tMap.CSS3, tech: 'CSS3', type: 'short', text: "CSS'da box model nimalardan iborat?", options: [], answer: JSON.stringify(['content', 'padding', 'border', 'margin']), points: 1, difficulty: "o'rta" },
    { id: 5, technology_id: tMap.JavaScript, tech: 'JavaScript', type: 'choice', text: "typeof null natijasi nima?", options: ["'null'", "'object'", "'undefined'", "'number'"], answer: '1', points: 1, difficulty: "o'rta" },
    { id: 6, technology_id: tMap.JavaScript, tech: 'JavaScript', type: 'debug', text: "Quyidagi kod nima chiqaradi va nima uchun?", code: "for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}", options: ['0 1 2 chiqadi', '3 3 3 chiqadi, chunki var funksiya doirasida', 'Xato beradi', 'Hech narsa chiqmaydi'], answer: '1', points: 1, difficulty: "o'rta" },
    { id: 7, technology_id: tMap.JavaScript, tech: 'JavaScript', type: 'code', text: "solve(arr) funksiyasini yozing: massivdagi juft sonlar yig'indisini qaytaring.", language: 'javascript', starter: "function solve(arr) {\n  return arr.filter(x => x % 2 === 0).reduce((a, b) => a + b, 0);\n}", tests: [{ args: [[1, 2, 3, 4]], expected: 6 }, { args: [[]], expected: 0 }, { args: [[2, 4, 6]], expected: 12, hidden: true }], points: 3, difficulty: "o'rta" },
    { id: 8, technology_id: tMap.React, tech: 'React', type: 'choice', text: "Komponent holatini funksional komponentda saqlash uchun qaysi hook ishlatiladi?", options: ['useEffect', 'useState', 'useRef', 'useMemo'], answer: '1', points: 1, difficulty: 'oson' },
    { id: 9, technology_id: tMap.React, tech: 'React', type: 'truefalse', text: "React'da ro'yxat elementlariga key berish samaradorlik uchun muhim.", options: [], answer: 'true', points: 1, difficulty: 'oson' },
    { id: 10, technology_id: tMap['Node.js'], tech: 'Node.js', type: 'choice', text: "Express'da middleware nima?", options: ["So'rov va javob orasida ishlaydigan funksiya", "Ma'lumotlar bazasi drayveri", "Shablon dvigateli", "Test kutubxonasi"], answer: '0', points: 1, difficulty: "o'rta" },
    { id: 11, technology_id: tMap.SQL, tech: 'SQL', type: 'choice', text: "Ikki jadvalni bog'lash uchun qaysi kalit so'z ishlatiladi?", options: ['MERGE', 'JOIN', 'LINK', 'UNION ALL'], answer: '1', points: 1, difficulty: 'oson' },
    { id: 12, technology_id: tMap['REST API'], tech: 'REST API', type: 'choice', text: "Muvaffaqiyatli yaratilgan resurs uchun qaysi status kod qaytariladi?", options: ['200', '201', '301', '404'], answer: '1', points: 1, difficulty: 'oson' },
    { id: 13, technology_id: tMap.Python, tech: 'Python', type: 'choice', text: "Python'da ro'yxat (list) va kortej (tuple) o'rtasidagi asosiy farq nima?", options: ["Tuple o'zgartirilmaydi (immutable)", 'List tezroq', 'Tuple faqat sonlarni saqlaydi', "Farq yo'q"], answer: '0', points: 1, difficulty: "o'rta" },
    { id: 14, technology_id: tMap.Docker, tech: 'Docker', type: 'choice', text: "Docker image va container o'rtasidagi farq nima?", options: ['Image — shablon, container — uning ishlayotgan nusxasi', 'Ikkalasi bir xil', 'Container — fayl turi', 'Image — tarmoq'], answer: '0', points: 1, difficulty: "o'rta" },
    { id: 15, technology_id: tMap.Linux, tech: 'Linux', type: 'choice', text: "Faylga ijro huquqini berish buyrug'i qaysi?", options: ['chmod +x fayl', 'chown fayl', 'exec fayl', 'perm +x fayl'], answer: '0', points: 1, difficulty: 'oson' },
    { id: 16, technology_id: tMap.Git, tech: 'Git', type: 'choice', text: "Yangi branch yaratib unga o'tish buyrug'i qaysi?", options: ['git branch -d x', 'git checkout -b x', 'git merge x', 'git new x'], answer: '1', points: 1, difficulty: 'oson' },
    { id: 17, technology_id: tMap.Figma, tech: 'Figma', type: 'choice', text: "Figma'da qayta ishlatiladigan UI elementlari nima deb ataladi?", options: ['Components', 'Frames', 'Layers', 'Plugins'], answer: '0', points: 1, difficulty: 'oson' },
    { id: 18, technology_id: tMap['UX Research'], tech: 'UX Research', type: 'choice', text: "Qaysi usul miqdoriy (quantitative) tadqiqot hisoblanadi?", options: ["So'rovnoma (ko'p respondent bilan)", 'Chuqur intervyu', 'Kuzatuv', 'Fokus-guruh'], answer: '0', points: 1, difficulty: "o'rta" },
    { id: 19, technology_id: tMap.Flutter, tech: 'Flutter', type: 'choice', text: "Flutter'da UI qurish uchun asosiy birlik nima?", options: ['Widget', 'Fragment', 'Activity', 'View'], answer: '0', points: 1, difficulty: 'oson' },
  ];
  const users = [
    { id: 1, email: 'admin@skillproof.uz', pass: 'Admin123!', role: 'admin', first_name: 'Super', last_name: 'Admin', status: 'active', company_id: null, created_at: new Date().toISOString() },
    { id: 2, email: 'hr@google-dev.uz', pass: 'Demo1234!', role: 'company', first_name: 'HR', last_name: 'Menejer', status: 'active', company_id: 1, created_at: new Date().toISOString() },
    { id: 3, email: 'hr@nova-soft.uz', pass: 'Demo1234!', role: 'company', first_name: 'HR', last_name: 'Nova', status: 'active', company_id: 2, created_at: new Date().toISOString() },
    { id: 4, email: 'nomzod@demo.uz', pass: 'Demo1234!', role: 'candidate', first_name: 'Demo', last_name: 'Nomzod', phone: '+998901234567', city: 'Toshkent', direction: 'Frontend dasturchi', bio: "Frontend yo'nalishida o'sishni xohlovchi dasturchi.", skills: 'HTML5, CSS3, JavaScript, React', status: 'active', company_id: null, created_at: new Date().toISOString() },
    { id: 5, email: 'aziz@demo.uz', pass: 'Demo1234!', role: 'candidate', first_name: 'Aziz', last_name: 'Karimov', phone: '+998901000000', city: 'Toshkent', direction: 'Frontend dasturchi', bio: '', skills: 'HTML5, CSS3, JS, React', status: 'active', company_id: null, created_at: new Date().toISOString() },
    { id: 6, email: 'malika@demo.uz', pass: 'Demo1234!', role: 'candidate', first_name: 'Malika', last_name: 'Yusupova', phone: '+998901001111', city: 'Toshkent', direction: 'Frontend dasturchi', bio: '', skills: 'HTML5, CSS3, JS, React', status: 'active', company_id: null, created_at: new Date().toISOString() },
  ];
  const attempts = [
    {
      id: 1, user_id: 5, job_id: 1, company_id: 1, status: 'done', question_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      started_at: new Date(Date.now() - 86400000 * 2).toISOString(), finished_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      total_score: 88, correct: 8, wrong: 1, practical_score: 100, verdict: 'full',
      summary: "Nomzod kompaniyaning barcha talablariga to'liq javob beradi. Umumiy bilim darajasi a'lo (88/100).",
      tech_scores: [{ name: 'HTML5', score: 100, required: 70, met: true }, { name: 'CSS3', score: 85, required: 75, met: true }, { name: 'JavaScript', score: 90, required: 80, met: true }, { name: 'React', score: 80, required: 75, met: true }],
      strengths: ["HTML5 bo'yicha yuqori natija (100 ball)", "JavaScript bo'yicha yuqori natija (90 ball)"], weaknesses: [], recommendations: [],
      decision: 'pending', human_score: null, company_note: '', answers: {}
    },
    {
      id: 2, user_id: 4, job_id: 1, company_id: 1, status: 'done', question_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      started_at: new Date(Date.now() - 86400000).toISOString(), finished_at: new Date(Date.now() - 86400000).toISOString(),
      total_score: 81, correct: 7, wrong: 2, practical_score: 100, verdict: 'interview',
      summary: "Nomzod kompaniyaning barcha talablariga to'liq javob bermaydi. Lekin umumiy bilim darajasi yaxshi (81/100). React bo'yicha bilimini rivojlantirishi tavsiya etiladi.",
      tech_scores: [{ name: 'HTML5', score: 90, required: 70, met: true }, { name: 'CSS3', score: 85, required: 75, met: true }, { name: 'JavaScript', score: 82, required: 80, met: true }, { name: 'React', score: 65, required: 75, met: false }],
      strengths: ["HTML5 bo'yicha yuqori natija (90 ball)", "CSS3 bo'yicha yuqori natija (85 ball)", "JavaScript bo'yicha yuqori natija (82 ball)"],
      weaknesses: ["React: 65 ball, talab 75 ball (10 ball yetishmaydi)"],
      recommendations: ["React bo'yicha bilimingizni rivojlantirish tavsiya etiladi"],
      decision: 'pending', human_score: null, company_note: '', answers: {}
    }
  ];
  const db = { categories, technologies, companies, jobs, questions, users, attempts, activity: [{ action: 'seed', details: 'Demo baza yuklandi', created_at: new Date().toISOString(), email: 'tizim' }] };
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
}

const saveDb = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

function runJsInBrowser(code, tests) {
  const logs = [];
  const fakeConsole = {
    log: (...a) => logs.push(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')),
  };
  let fn;
  try {
    fn = new Function('console', code + '\n;return typeof solve === "function" ? solve : undefined;')(fakeConsole);
  } catch (e) {
    return { ok: false, error: String(e.message || e), logs, passed: 0, total: tests.length, cases: [], mode: 'browser-sandbox' };
  }
  if (!fn && tests.length === 1 && tests[0].play) {
    return { ok: true, play: true, passed: 0, total: 0, cases: [], logs, mode: 'browser-sandbox' };
  }
  if (!fn) return { ok: false, error: "solve nomli funksiya topilmadi. 'function solve(...) {...}' yozing.", logs, passed: 0, total: tests.length, cases: [], mode: 'browser-sandbox' };
  const cases = tests.map((t, i) => {
    try {
      const got = fn(...JSON.parse(JSON.stringify(t.args)));
      const ok = JSON.stringify(got) === JSON.stringify(t.expected);
      return t.hidden ? { index: i + 1, hidden: true, ok } : { index: i + 1, ok, args: t.args, expected: t.expected, got };
    } catch (e) {
      return t.hidden ? { index: i + 1, hidden: true, ok: false } : { index: i + 1, ok: false, args: t.args, expected: t.expected, error: String(e.message || e) };
    }
  });
  const passed = cases.filter((c) => c.ok).length;
  return { ok: passed === tests.length, passed, total: tests.length, cases, logs, mode: 'browser-sandbox' };
}

export async function handleMock(method, rawPath, body, currentUser) {
  const db = initDb();
  const [path, qs] = rawPath.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  const u = currentUser ? db.users.find((x) => x.id === currentUser.id) : null;

  // --- AUTH ---
  if (method === 'POST' && path === '/auth/login') {
    const found = db.users.find((x) => x.email.toLowerCase() === String(body.email || '').toLowerCase() && x.pass === body.password);
    if (!found) throw new Error("Email yoki parol noto'g'ri");
    if (found.status === 'blocked') throw new Error('Hisobingiz bloklangan');
    return { token: 'mock-jwt-' + found.id, user: found };
  }
  if (method === 'POST' && path === '/auth/register') {
    if (db.users.some((x) => x.email.toLowerCase() === String(body.email || '').toLowerCase())) throw new Error("Bu email allaqachon ro'yxatdan o'tgan");
    let cid = null;
    if (body.role === 'company') {
      cid = Math.max(0, ...db.companies.map((c) => c.id)) + 1;
      db.companies.push({ id: cid, name: body.company_name, slug: 'co-' + cid, industry: body.industry || '', city: 'Toshkent', size: '10-50', logo: '', status: 'pending', description: '', created_at: new Date().toISOString() });
    }
    const uid = Math.max(0, ...db.users.map((x) => x.id)) + 1;
    const nu = { id: uid, email: body.email.toLowerCase(), pass: body.password, role: body.role || 'candidate', first_name: body.first_name, last_name: body.last_name || '', phone: '', city: 'Toshkent', direction: 'Frontend dasturchi', bio: '', skills: '', status: 'active', company_id: cid, created_at: new Date().toISOString() };
    db.users.push(nu);
    saveDb(db);
    return { token: 'mock-jwt-' + nu.id, user: nu };
  }

  // --- PUBLIC ---
  if (method === 'GET' && path === '/public/stats') {
    return {
      companies: db.companies.filter((c) => c.status === 'approved').length,
      jobs: db.jobs.filter((j) => j.status === 'open').length,
      candidates: db.users.filter((x) => x.role === 'candidate').length,
      tests: db.attempts.filter((a) => a.status === 'done').length,
    };
  }
  if (method === 'GET' && path === '/public/categories') {
    return db.categories.map((c) => ({ ...c, jobs: db.jobs.filter((j) => j.category_id === c.id && j.status === 'open').length }));
  }
  if (method === 'GET' && path === '/public/technologies') {
    return db.technologies.map((t) => ({ ...t, category: db.categories.find((c) => c.id === t.category_id)?.name || '' }));
  }
  if (method === 'GET' && path === '/public/companies') {
    const q = (query.q || '').toLowerCase(), ind = (query.industry || '').toLowerCase();
    return db.companies.filter((c) => c.status === 'approved' && (c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) && c.industry.toLowerCase().includes(ind))
      .map((c) => ({ ...c, open_jobs: db.jobs.filter((j) => j.company_id === c.id && j.status === 'open').length }));
  }
  let m;
  if (method === 'GET' && (m = path.match(/^\/public\/companies\/(\d+)$/))) {
    const c = db.companies.find((x) => x.id === +m[1] && x.status === 'approved');
    if (!c) throw new Error('Kompaniya topilmadi');
    return { ...c, jobs: db.jobs.filter((j) => j.company_id === c.id && j.status === 'open') };
  }
  if (method === 'GET' && path === '/public/jobs') {
    const q = (query.q || '').toLowerCase(), cat = query.category || '';
    return db.jobs.filter((j) => j.status === 'open' && (!cat || String(j.category_id) === String(cat))).map((j) => {
      const c = db.companies.find((x) => x.id === j.company_id);
      return { ...j, company_name: c?.name || '', company_logo: c?.logo || '', category: db.categories.find((k) => k.id === j.category_id)?.name || '' };
    }).filter((j) => j.title.toLowerCase().includes(q) || j.company_name.toLowerCase().includes(q));
  }
  if (method === 'GET' && (m = path.match(/^\/public\/jobs\/(\d+)$/))) {
    const j = db.jobs.find((x) => x.id === +m[1]);
    if (!j) throw new Error("Ish o'rni topilmadi");
    const c = db.companies.find((x) => x.id === j.company_id);
    return { ...j, company_name: c?.name || '', company_logo: c?.logo || '', category: db.categories.find((k) => k.id === j.category_id)?.name || '' };
  }
  if (method === 'GET' && path === '/public/sandbox') return { mode: 'browser-sandbox', languages: ['javascript'] };

  // --- CANDIDATE ---
  if (path === '/candidate/profile') {
    if (method === 'GET') return u;
    Object.assign(u, body); saveDb(db); return { ok: true };
  }
  if (method === 'GET' && path === '/candidate/dashboard') {
    const my = db.attempts.filter((a) => a.user_id === u.id).map((a) => ({
      ...a, title: db.jobs.find((j) => j.id === a.job_id)?.title || '', company_name: db.companies.find((c) => c.id === a.company_id)?.name || ''
    })).reverse();
    const done = my.filter((a) => a.status === 'done');
    const techAgg = {};
    done.forEach((a) => (a.tech_scores || []).forEach((t) => { (techAgg[t.name] ??= []).push(t.score); }));
    return {
      stats: { total: done.length, avg: done.length ? Math.round(done.reduce((s, x) => s + x.total_score, 0) / done.length) : 0, best: done.length ? Math.max(...done.map((x) => Math.round(x.total_score))) : 0, matched: done.filter((x) => ['full', 'interview'].includes(x.verdict)).length },
      techs: Object.entries(techAgg).map(([name, v]) => ({ name, score: Math.round(v.reduce((a, b) => a + b, 0) / v.length) })),
      recent: my.slice(0, 6), inProgress: my.find((a) => a.status === 'in_progress') || null,
      recommended: db.jobs.slice(0, 4).map((j) => ({ ...j, company_name: db.companies.find((c) => c.id === j.company_id)?.name || '', category: db.categories.find((c) => c.id === j.category_id)?.name || '' }))
    };
  }
  if (method === 'GET' && path === '/candidate/attempts') {
    return db.attempts.filter((a) => a.user_id === u.id).map((a) => ({
      ...a, title: db.jobs.find((j) => j.id === a.job_id)?.title || '', company_name: db.companies.find((c) => c.id === a.company_id)?.name || '', verdict_label: VERDICTS[a.verdict] || ''
    })).reverse();
  }
  if (method === 'POST' && path === '/candidate/attempts') {
    const job = db.jobs.find((j) => j.id === +body.job_id);
    const reqIds = job.requirements.map((r) => r.id);
    const qids = db.questions.filter((q) => reqIds.includes(q.technology_id)).map((q) => q.id);
    const id = Math.max(0, ...db.attempts.map((a) => a.id)) + 1;
    db.attempts.push({ id, user_id: u.id, job_id: job.id, company_id: job.company_id, status: 'in_progress', question_ids: qids.length ? qids : [1, 2, 5, 7], started_at: new Date().toISOString(), deadline: new Date(Date.now() + job.duration_min * 60000).toISOString(), decision: 'pending', answers: {} });
    saveDb(db);
    return { id };
  }
  if (method === 'GET' && (m = path.match(/^\/candidate\/attempts\/(\d+)$/))) {
    const a = db.attempts.find((x) => x.id === +m[1]);
    const job = db.jobs.find((j) => j.id === a.job_id);
    const co = db.companies.find((c) => c.id === a.company_id);
    const qs = a.question_ids.map((id) => db.questions.find((q) => q.id === id)).filter(Boolean);
    const base = { id: a.id, status: a.status, job: { ...job, company_name: co.name }, deadline: a.deadline, serverNow: new Date().toISOString() };
    if (a.status === 'in_progress') {
      return { ...base, questions: qs.map((q) => ({ ...q, publicTests: (q.tests || []).filter((t) => !t.hidden), hiddenTests: (q.tests || []).filter((t) => t.hidden).length, response: a.answers?.[q.id]?.response ?? null })) };
    }
    return { ...base, ...a, verdict_label: VERDICTS[a.verdict], requirements: job.requirements, review: qs.map((q) => ({ id: q.id, text: q.text, tech: q.tech, type: q.type, score: a.answers?.[q.id]?.score ?? 0.8 })) };
  }
  if (method === 'POST' && (m = path.match(/^\/candidate\/attempts\/(\d+)\/answer$/))) {
    const a = db.attempts.find((x) => x.id === +m[1]);
    const q = db.questions.find((x) => x.id === +body.question_id);
    a.answers ??= {};
    let score = 0;
    if (q.type === 'choice' || q.type === 'debug' || q.type === 'truefalse') score = String(body.response) === String(q.answer) ? 1 : 0;
    else if (q.type === 'short' || q.type === 'scenario') score = String(body.response || '').trim().length > 8 ? 1 : 0.5;
    a.answers[q.id] = { response: body.response, score };
    saveDb(db);
    return { ok: true, saved: true };
  }
  if (method === 'POST' && (m = path.match(/^\/candidate\/attempts\/(\d+)\/(run|submit-code)$/))) {
    const a = db.attempts.find((x) => x.id === +m[1]);
    const q = db.questions.find((x) => x.id === +body.question_id);
    const tests = m[2] === 'run' ? (q.tests || []).filter((t) => !t.hidden) : (q.tests || []);
    const res = runJsInBrowser(body.code, tests);
    if (m[2] === 'submit-code') {
      a.answers ??= {};
      a.answers[q.id] = { response: body.code, score: res.total ? res.passed / res.total : 0 };
      saveDb(db);
    }
    return res;
  }
  if (method === 'POST' && (m = path.match(/^\/candidate\/attempts\/(\d+)\/finish$/))) {
    const a = db.attempts.find((x) => x.id === +m[1]);
    const job = db.jobs.find((j) => j.id === a.job_id);
    const qs = a.question_ids.map((id) => db.questions.find((q) => q.id === id)).filter(Boolean);
    const byTech = {};
    let correct = 0, wrong = 0, sum = 0, max = 0;
    qs.forEach((q) => {
      const s = a.answers?.[q.id]?.score ?? 0;
      byTech[q.tech] ??= { got: 0, max: 0 };
      byTech[q.tech].got += s * q.points; byTech[q.tech].max += q.points;
      sum += s * q.points; max += q.points;
      if (s >= 0.6) correct++; else wrong++;
    });
    const reqMap = Object.fromEntries(job.requirements.map((r) => [r.name, r.min_score]));
    const tech_scores = Object.entries(byTech).map(([name, t]) => {
      const score = t.max ? Math.round((t.got / t.max) * 100) : 0;
      const required = reqMap[name] ?? null;
      return { name, score, required, met: required == null ? null : score >= required };
    });
    const total = max ? Math.round((sum / max) * 100) : 0;
    const unmet = tech_scores.filter((t) => t.required != null && !t.met);
    const verdict = !unmet.length && total >= job.min_score ? 'full' : total >= job.min_score ? 'interview' : total >= 50 ? 'review' : 'no';
    Object.assign(a, {
      status: 'done', finished_at: new Date().toISOString(), total_score: total, tech_scores, correct, wrong, practical_score: 100, verdict,
      summary: verdict === 'full' ? `Nomzod kompaniyaning barcha talablariga to'liq javob beradi (${total}/100).` : `Umumiy natija ${total}/100. ${unmet.length ? unmet.map((x) => x.name).join(', ') + " bo'yicha bilimni oshirish tavsiya etiladi." : ''}`,
      strengths: tech_scores.filter((t) => t.score >= 75).map((t) => `${t.name} bo'yicha yuqori natija (${t.score} ball)`),
      weaknesses: unmet.map((t) => `${t.name}: ${t.score} ball (talab ${t.required})`),
      recommendations: unmet.map((t) => `${t.name} bo'yicha bilimingizni rivojlantirish tavsiya etiladi`),
    });
    saveDb(db);
    return { ok: true, id: a.id };
  }
  if (method === 'POST' && path === '/candidate/playground') {
    return runJsInBrowser(body.code, [{ args: [], expected: null, play: true }]);
  }

  // --- COMPANY ---
  if (path.startsWith('/company')) {
    const cid = u?.company_id || 1;
    const co = db.companies.find((c) => c.id === cid);
    if (path === '/company/profile') {
      if (method === 'GET') return co;
      Object.assign(co, body); saveDb(db); return { ok: true };
    }
    if (method === 'GET' && path === '/company/dashboard') {
      const att = db.attempts.filter((a) => a.company_id === cid && a.status === 'done').map((a) => {
        const usr = db.users.find((x) => x.id === a.user_id) || {};
        return { ...a, title: db.jobs.find((j) => j.id === a.job_id)?.title || '', first_name: usr.first_name || 'Nomzod', last_name: usr.last_name || '' };
      });
      const verdicts = { full: 0, interview: 0, review: 0, no: 0 };
      att.forEach((a) => verdicts[a.verdict]++);
      return {
        company: { name: co.name, status: co.status },
        stats: { jobs: db.jobs.filter((j) => j.company_id === cid && j.status === 'open').length, candidates: att.length, avg: att.length ? Math.round(att.reduce((s, a) => s + a.total_score, 0) / att.length) : 0, hired: att.filter((a) => a.decision === 'hired').length },
        verdicts, perJob: db.jobs.filter((j) => j.company_id === cid).map((j) => ({ id: j.id, title: j.title, avg: 82 })),
        days: [{ day: '2026-11-04', n: 2 }, { day: '2026-11-05', n: 3 }], top: att.slice(0, 5), recent: att.slice(0, 6)
      };
    }
    if (method === 'GET' && path === '/company/jobs') {
      return db.jobs.filter((j) => j.company_id === cid).map((j) => ({ ...j, category: db.categories.find((c) => c.id === j.category_id)?.name || '', candidates: db.attempts.filter((a) => a.job_id === j.id && a.status === 'done').length }));
    }
    if (method === 'POST' && path === '/company/jobs') {
      const id = Math.max(0, ...db.jobs.map((j) => j.id)) + 1;
      const reqs = (body.requirements || []).map((r) => ({ id: r.technology_id, name: db.technologies.find((t) => t.id === r.technology_id)?.name || '', min_score: r.min_score }));
      db.jobs.push({ id, company_id: cid, ...body, requirements: reqs, status: body.status || 'open' });
      saveDb(db); return { id };
    }
    if (method === 'PUT' && (m = path.match(/^\/company\/jobs\/(\d+)$/))) {
      const j = db.jobs.find((x) => x.id === +m[1] && x.company_id === cid);
      const reqs = (body.requirements || []).map((r) => ({ id: r.technology_id, name: db.technologies.find((t) => t.id === r.technology_id)?.name || '', min_score: r.min_score }));
      Object.assign(j, body, { requirements: reqs }); saveDb(db); return { ok: true };
    }
    if (method === 'DELETE' && (m = path.match(/^\/company\/jobs\/(\d+)$/))) {
      db.jobs = db.jobs.filter((x) => !(x.id === +m[1] && x.company_id === cid)); saveDb(db); return { ok: true };
    }
    if (method === 'GET' && path === '/company/questions') return db.questions.filter((q) => q.company_id === cid);
    if (method === 'POST' && path === '/company/questions') {
      const id = Math.max(0, ...db.questions.map((q) => q.id)) + 1;
      db.questions.push({ id, company_id: cid, tech: db.technologies.find((t) => t.id === +body.technology_id)?.name || '', ...body });
      saveDb(db); return { id };
    }
    if (method === 'GET' && path === '/company/candidates') {
      return db.attempts.filter((a) => a.company_id === cid && a.status === 'done' && (!query.job_id || a.job_id === +query.job_id)).map((a) => {
        const usr = db.users.find((x) => x.id === a.user_id) || {};
        return { ...a, job_title: db.jobs.find((j) => j.id === a.job_id)?.title || '', first_name: usr.first_name, last_name: usr.last_name, email: usr.email, phone: usr.phone, verdict_label: VERDICTS[a.verdict] };
      });
    }
    if (method === 'GET' && (m = path.match(/^\/company\/attempts\/(\d+)$/))) {
      const a = db.attempts.find((x) => x.id === +m[1]);
      const usr = db.users.find((x) => x.id === a.user_id);
      const job = db.jobs.find((j) => j.id === a.job_id);
      return { ...a, user: usr, job, verdict_label: VERDICTS[a.verdict], requirements: job.requirements, review: [] };
    }
    if (method === 'POST' && (m = path.match(/^\/company\/attempts\/(\d+)\/decision$/))) {
      const a = db.attempts.find((x) => x.id === +m[1]);
      Object.assign(a, { decision: body.decision, human_score: body.human_score || null, company_note: body.note || '' });
      saveDb(db); return { ok: true };
    }
  }

  // --- ADMIN ---
  if (path.startsWith('/admin')) {
    if (method === 'GET' && path === '/admin/stats') {
      return {
        users: db.users.filter((x) => x.role === 'candidate').length, companies: db.companies.length,
        pending: db.companies.filter((c) => c.status === 'pending').length, blocked: db.companies.filter((c) => c.status === 'blocked').length,
        jobs: db.jobs.length, questions: db.questions.length, tests: db.attempts.length, avgScore: 84,
        byCategory: db.categories.map((c) => ({ name: c.name, n: db.jobs.filter((j) => j.category_id === c.id).length })),
        days: [{ day: '2026-11-04', n: 3 }, { day: '2026-11-05', n: 4 }], attemptsByDay: [{ day: '2026-11-04', n: 1 }, { day: '2026-11-05', n: 2 }],
        activity: db.activity
      };
    }
    if (method === 'GET' && path === '/admin/companies') {
      return db.companies.map((c) => ({ ...c, jobs: db.jobs.filter((j) => j.company_id === c.id).length, tests: db.attempts.filter((a) => a.company_id === c.id).length, owner_email: db.users.find((x) => x.company_id === c.id)?.email || 'hr@demo.uz' }));
    }
    if (method === 'PUT' && (m = path.match(/^\/admin\/companies\/(\d+)\/status$/))) {
      db.companies.find((c) => c.id === +m[1]).status = body.status; saveDb(db); return { ok: true };
    }
    if (method === 'GET' && path === '/admin/users') {
      return db.users.map((x) => ({ ...x, company_name: db.companies.find((c) => c.id === x.company_id)?.name || '' }));
    }
    if (method === 'PUT' && (m = path.match(/^\/admin\/users\/(\d+)\/status$/))) {
      db.users.find((x) => x.id === +m[1]).status = body.status; saveDb(db); return { ok: true };
    }
    if (method === 'POST' && path === '/admin/categories') {
      const id = Math.max(0, ...db.categories.map((c) => c.id)) + 1;
      db.categories.push({ id, name: body.name, icon: body.icon || 'bi-briefcase' }); saveDb(db); return { id };
    }
    if (method === 'POST' && path === '/admin/technologies') {
      const id = Math.max(0, ...db.technologies.map((t) => t.id)) + 1;
      db.technologies.push({ id, name: body.name, category_id: +body.category_id || null }); saveDb(db); return { id };
    }
  }
  return { ok: true };
}

