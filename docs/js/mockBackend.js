// GitHub Pages (statik hosting) uchun to'liq LocalStorage + In-Browser API emulatori.
// Node.js backend mavjud bo'lmaganda (masalan *.github.io da) avtomatik ishga tushadi!

const DB_KEY = 'sp_static_db_v3';

const VERDICTS = {
  full: "Talablarga to'liq mos",
  interview: 'Suhbatga tavsiya etiladi',
  review: "Qo'shimcha tekshiruv talab etiladi",
  no: 'Hozircha talabga mos emas',
};

function initDb() {
  try {
    const curU = JSON.parse(localStorage.getItem('sp_user') || 'null');
    if (curU && /googlemail|kernlim|emailnator/i.test(curU.email || '')) {
      localStorage.removeItem('sp_token');
      localStorage.removeItem('sp_user');
    }
  } catch {}
  const saved = localStorage.getItem(DB_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.users)) {
        parsed.users = parsed.users.filter((x) => !/googlemail|kernlim|emailnator/i.test(x.email || ''));
      }
      return parsed;
    } catch {}
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
    { id: 1, name: 'Google Developer Team', slug: 'google-developer-team', industry: 'Axborot texnologiyalari', city: 'Toshkent / Mountain View', size: '100 000+', logo: '', status: 'approved', website: 'https://google.com', description: "Dunyoning eng yirik texnologik kompaniyasining zamonaviy veb, bulutli va sun'iy intellekt mahsulotlari ustida ishlovchi xalqaro muhandislar jamoasi.", created_at: new Date().toISOString() },
    { id: 2, name: 'Microsoft', slug: 'microsoft', industry: 'Bulutli xizmatlar va DevOps', city: 'Redmond / Masofaviy', size: '220 000+', logo: '', status: 'approved', website: 'https://microsoft.com', description: "Microsoft — Azure bulutli platformasi, Windows, Office 365, GitHub va korporativ dasturiy yechimlar bo'yicha dunyo yetakchisi.", created_at: new Date().toISOString() },
    { id: 3, name: 'Amazon Web Services (AWS)', slug: 'amazon-aws', industry: 'Bulutli xizmatlar va DevOps', city: 'Sietl / Masofaviy', size: '100 000+', logo: '', status: 'approved', website: 'https://aws.amazon.com', description: "Amazon va AWS — dunyodagi eng katta bulutli infratuzilma va elektron tijorat ekotizimi. Yuqori masshtab va ishonchlilik.", created_at: new Date().toISOString() },
    { id: 4, name: 'Meta (Facebook)', slug: 'meta', industry: 'Dizayn va kreativ', city: 'Menlo Park / London', size: '67 000+', logo: '', status: 'approved', website: 'https://meta.com', description: "Meta — React, React Native va PyTorch texnologiyalarini yaratgan kompaniya. Instagram, WhatsApp va Facebook platformalari muallifi.", created_at: new Date().toISOString() },
    { id: 5, name: 'Apple', slug: 'apple', industry: 'Mobil ilovalar', city: 'Kupertino / Masofaviy', size: '160 000+', logo: '', status: 'approved', website: 'https://apple.com', description: "Apple — iPhone, iPad, Mac va iOS ekotizimi orqali mukammal dizayn hamda yuqori xavfsizlik standartlarini belgilovchi global brend.", created_at: new Date().toISOString() },
    { id: 6, name: 'EPAM Systems', slug: 'epam-systems', industry: 'Axborot texnologiyalari', city: 'Toshkent / Xalqaro', size: '50 000+', logo: '', status: 'approved', website: 'https://epam.com', description: "EPAM Systems — Fortune 500 ro'yxatidagi kompaniyalar uchun dasturiy injiniring va raqamli transformatsiya xizmatlarini ko'rsatuvchi global IT gigant.", created_at: new Date().toISOString() },
    { id: 7, name: 'Uzum (Uzum Market & Uzum Bank)', slug: 'uzum', industry: 'Fintech', city: 'Toshkent', size: '10 000+', logo: '', status: 'approved', website: 'https://uzum.com', description: "Uzum — O'zbekistonning birinchi 'unicorn' texnologik ekotizimi: Uzum Market, Uzum Bank, Uzum Nasiya va Uzum Tezkor xizmatlarini birlashtiradi.", created_at: new Date().toISOString() },
    { id: 8, name: 'Click', slug: 'click-uz', industry: 'Fintech', city: 'Toshkent', size: '800+', logo: '', status: 'approved', website: 'https://click.uz', description: "Click — O'zbekistondagi yetakchi mobil banking va onlayn to'lov super-ilovasi. 15 milliondan ortiq faol foydalanuvchiga ega.", created_at: new Date().toISOString() },
    { id: 9, name: 'Payme (TBC Group)', slug: 'payme', industry: 'Fintech', city: 'Toshkent', size: '600+', logo: '', status: 'approved', website: 'https://payme.uz', description: "Payme va TBC Group — zamonaviy raqamli moliya xizmatlari, lahzalik o'tkazmalar va onlayn kreditlash bo'yicha xalqaro fintech guruhi.", created_at: new Date().toISOString() },
    { id: 10, name: 'Yandex Go Tech', slug: 'yandex-go', industry: 'Mobil ilovalar', city: 'Toshkent / Xalqaro', size: '25 000+', logo: '', status: 'approved', website: 'https://yandex.uz', description: "Yandex Go — taksi, yetkazib berish, geoservislar va sun'iy intellekt algoritmlari ustida ishlovchi yirik texnologik kompaniya.", created_at: new Date().toISOString() },
    { id: 11, name: 'Adobe & Figma Studio', slug: 'adobe-figma', industry: 'Dizayn va kreativ', city: 'San-Fransisko / Masofaviy', size: '30 000+', logo: '', status: 'approved', website: 'https://figma.com', description: "Adobe va Figma — dunyodagi barcha dizaynerlar, UI/UX mutaxassislari va kreativ jamoalar uchun asosiy dizayn ekotizimi.", created_at: new Date().toISOString() },
    { id: 12, name: 'Nova Soft', slug: 'nova-soft', industry: 'Axborot texnologiyalari', city: 'Samarqand', size: '50-100', logo: '', status: 'approved', website: '', description: "Buyurtma asosida dasturiy mahsulotlar yaratuvchi autsorsing kompaniya. Yosh va tashabbuskor jamoa.", created_at: new Date().toISOString() },
    { id: 13, name: 'Yangi Startap', slug: 'yangi-startap', industry: 'Startap', city: 'Toshkent', size: '10', logo: '', status: 'pending', website: '', description: 'Tasdiqlashni kutayotgan demo kompaniya', created_at: new Date().toISOString() },
  ];
  const jobs = [
    { id: 1, company_id: 1, title: 'Frontend Developer (React / TypeScript)', category_id: 1, salary: '$3500 - $5500', employment: "To'liq stavka", min_score: 75, duration_min: 25, questions_per_tech: 3, status: 'open', description: "Yuqori yuklamali global veb-ilovalarni React va TypeScript asosida ishlab chiqish.", requirements: [{ id: tMap.HTML5, name: 'HTML5', min_score: 70 }, { id: tMap.CSS3, name: 'CSS3', min_score: 75 }, { id: tMap.JavaScript, name: 'JavaScript', min_score: 80 }, { id: tMap.React, name: 'React', min_score: 75 }] },
    { id: 2, company_id: 1, title: 'Backend Developer (Node.js)', category_id: 2, salary: '$4000 - $6500', employment: "To'liq stavka", min_score: 70, duration_min: 25, questions_per_tech: 3, status: 'open', description: "Node.js va PostgreSQL asosida masshtablanuvchi mikroservis va REST API'lar yaratish.", requirements: [{ id: tMap['Node.js'], name: 'Node.js', min_score: 75 }, { id: tMap.SQL, name: 'SQL', min_score: 70 }, { id: tMap['REST API'], name: 'REST API', min_score: 70 }] },
    { id: 3, company_id: 2, title: '.NET / C# Backend Engineer', category_id: 2, salary: '$4000 - $6000', employment: "To'liq stavka", min_score: 75, duration_min: 30, questions_per_tech: 3, status: 'open', description: "Azure bulutli servislari va korporativ tizimlar uchun C# / .NET xizmatlarini yaratish.", requirements: [{ id: tMap['C#'], name: 'C#', min_score: 80 }, { id: tMap.SQL, name: 'SQL', min_score: 75 }, { id: tMap['REST API'], name: 'REST API', min_score: 75 }] },
    { id: 4, company_id: 2, title: 'Cloud DevOps Engineer (Azure / Kubernetes)', category_id: 5, salary: '$4200 - $6500', employment: "To'liq stavka", min_score: 75, duration_min: 30, questions_per_tech: 3, status: 'open', description: "Global bulutli klasterlar, Docker, Kubernetes va CI/CD konveyerlarini avtomatlashtirish.", requirements: [{ id: tMap.Docker, name: 'Docker', min_score: 75 }, { id: tMap.Linux, name: 'Linux', min_score: 70 }, { id: tMap.Git, name: 'Git', min_score: 70 }] },
    { id: 5, company_id: 3, title: 'AWS Solutions & DevOps Architect', category_id: 5, salary: '$4500 - $7000', employment: "To'liq stavka", min_score: 80, duration_min: 30, questions_per_tech: 3, status: 'open', description: "AWS (EC2, S3, Lambda), Docker va Kubernetes asosida nosozlikka chidamli arxitektura qurish.", requirements: [{ id: tMap.Docker, name: 'Docker', min_score: 75 }, { id: tMap.Linux, name: 'Linux', min_score: 75 }, { id: tMap.Git, name: 'Git', min_score: 70 }] },
    { id: 6, company_id: 4, title: 'Senior React & UI Engineer', category_id: 1, salary: '$4500 - $7000', employment: "To'liq stavka", min_score: 80, duration_min: 25, questions_per_tech: 3, status: 'open', description: "Milliardlab foydalanuvchilar uchun tezkor va zamonaviy React interfeyslarini yaratish.", requirements: [{ id: tMap.JavaScript, name: 'JavaScript', min_score: 85 }, { id: tMap.React, name: 'React', min_score: 85 }, { id: tMap.CSS3, name: 'CSS3', min_score: 75 }] },
    { id: 7, company_id: 5, title: 'Senior Product UI/UX Designer', category_id: 6, salary: '$4000 - $6200', employment: "To'liq stavka", min_score: 80, duration_min: 25, questions_per_tech: 3, status: 'open', description: "Inson va qurilma o'rtasidagi eng qulay, intuitiv interfeys hamda dizayn tizimlarini yaratish.", requirements: [{ id: tMap.Figma, name: 'Figma', min_score: 80 }, { id: tMap['UX Research'], name: 'UX Research', min_score: 75 }] },
    { id: 8, company_id: 6, title: 'Full Stack JavaScript Engineer', category_id: 3, salary: '$2200 - $3800', employment: "To'liq stavka", min_score: 70, duration_min: 30, questions_per_tech: 3, status: 'open', description: "Xalqaro mijozlar uchun React va Node.js asosida end-to-end korporativ tizimlarni yaratish.", requirements: [{ id: tMap.JavaScript, name: 'JavaScript', min_score: 75 }, { id: tMap.React, name: 'React', min_score: 75 }, { id: tMap['Node.js'], name: 'Node.js', min_score: 75 }] },
    { id: 9, company_id: 7, title: 'Senior Go / Python Backend Developer', category_id: 2, salary: '$2500 - $4500', employment: "To'liq stavka", min_score: 75, duration_min: 25, questions_per_tech: 3, status: 'open', description: "Millionlab foydalanuvchilarga xizmat ko'rsatuvchi Uzum marketpleys va fintech mikroservislarini yaratish.", requirements: [{ id: tMap.Python, name: 'Python', min_score: 75 }, { id: tMap.SQL, name: 'SQL', min_score: 75 }, { id: tMap['REST API'], name: 'REST API', min_score: 75 }] },
    { id: 10, company_id: 8, title: 'Flutter Mobile Developer', category_id: 4, salary: '$1800 - $3200', employment: "To'liq stavka", min_score: 70, duration_min: 25, questions_per_tech: 3, status: 'open', description: "Click SuperApp ichidagi mini-ilovalar va yangi moliyaviy xizmatlarni Flutter/Dart'da yaratish.", requirements: [{ id: tMap.Flutter, name: 'Flutter', min_score: 75 }, { id: tMap.Git, name: 'Git', min_score: 65 }] },
    { id: 11, company_id: 9, title: 'Node.js & MongoDB Backend Engineer', category_id: 2, salary: '$2200 - $3800', employment: "To'liq stavka", min_score: 75, duration_min: 25, questions_per_tech: 3, status: 'open', description: "Payme to'lov ekotizimi uchun xavfsiz, tezkor va uzluksiz ishlovchi Node.js servislarini yozish.", requirements: [{ id: tMap['Node.js'], name: 'Node.js', min_score: 80 }, { id: tMap.JavaScript, name: 'JavaScript', min_score: 75 }, { id: tMap['REST API'], name: 'REST API', min_score: 75 }] },
    { id: 12, company_id: 10, title: 'Frontend Developer (Vue.js / React)', category_id: 1, salary: '$2500 - $4200', employment: "To'liq stavka", min_score: 75, duration_min: 25, questions_per_tech: 3, status: 'open', description: "Geolokatsiya va real-vaqt rejimida ishlovchi murakkab veb-panellarni yaratish.", requirements: [{ id: tMap.JavaScript, name: 'JavaScript', min_score: 80 }, { id: tMap.React, name: 'React', min_score: 70 }, { id: tMap.HTML5, name: 'HTML5', min_score: 70 }] },
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
    { id: 1, email: 'admin@skillprove.uz', pass: 'Admin123!', role: 'admin', first_name: 'Super', last_name: 'Admin', status: 'active', company_id: null, created_at: new Date().toISOString() },
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
    const loginEmail = String(body.email || '').trim().toLowerCase();
    if (/googlemail|kernlim|emailnator/i.test(loginEmail)) {
      throw new Error("Vaqtinchalik (Emailnator / @googlemail.com) pochtalar bloklangan!");
    }
    const found = db.users.find((x) => x.email.toLowerCase() === loginEmail && x.pass === body.password);
    if (!found) throw new Error("Email yoki parol noto'g'ri");
    if (found.status === 'blocked') throw new Error('Hisobingiz bloklangan');
    return { token: 'mock-jwt-' + found.id, user: found };
  }
  if (method === 'POST' && path === '/auth/register') {
    const rawEmail = String(body.email || '').trim().toLowerCase();
    if (rawEmail.includes('+')) {
      throw new Error("Vaqtinchalik Gmail (+) aliaslaridan foydalanish qat'iyan taqiqlangan!");
    }
    const mEmail = rawEmail.match(/^([a-z0-9._-]+)@([a-z0-9.-]+\.[a-z]{2,})$/);
    if (!mEmail) throw new Error("Elektron pochta manzili noto'g'ri kiritilgan.");
    const [, localPart, domainPart] = mEmail;
    const tempRe = /(googlemail|emailnator|gmailnator|smailpro|kernlim|tmpnator|temp|fake|trash|burner|throwaway|10min|dispos|guerrilla|mailinator|yopmail|mohmal|sharklasers|maildrop|getnada|harakiri|spam|crazymail|dropmail|tempmail|minutemail|mailnesia|emailondeck|inboxkitten|wegwerf)/i;
    const allowedDomains = new Set(['gmail.com', 'icloud.com', 'me.com', 'mail.ru', 'bk.ru', 'inbox.ru', 'list.ru', 'yandex.ru', 'yandex.uz', 'yandex.com', 'ya.ru', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com', 'proton.me', 'protonmail.com', 'umail.uz']);
    if (domainPart === 'googlemail.com') {
      throw new Error("Emailnator / @googlemail.com vaqtinchalik pochtalaridan foydalanish qat'iyan bloklangan!");
    }
    const dotCount = (localPart.match(/\./g) || []).length;
    if (dotCount > 1 || /\.\d+$/.test(localPart) || /^[a-z]\.[a-z]/.test(localPart)) {
      throw new Error("Vaqtinchalik Gmail generatori (Emailnator nuqtali formati) aniqlandi va bloklandi!");
    }
    if (localPart.length < 4 || tempRe.test(domainPart) || tempRe.test(localPart) || (!allowedDomains.has(domainPart) && !domainPart.endsWith('.uz') && !domainPart.endsWith('.edu'))) {
      throw new Error("Vaqtinchalik (Emailnator / Temp-Mail) pochtadan foydalanish qat'iyan taqiqlangan! Faqat doimiy shaxsiy pochtangizni kiriting.");
    }
    if ((body.role || 'candidate') === 'candidate') {
      const fn = String(body.first_name || '').trim();
      const ln = String(body.last_name || '').trim();
      if (fn.length < 2) throw new Error("Ismingizni kiriting.");
      if (ln.length < 2) throw new Error("Familiyangizni kiriting.");
    }
    const pw = String(body.password || '');
    const pwLow = pw.toLowerCase();
    const pwLetters = pwLow.replace(/[^a-z]/g, '');
    const isMash = /[asdfghjkl]{4,}/.test(pwLow) || /[qwertyuiop]{4,}/.test(pwLow) || /[zxcvbnm]{4,}/.test(pwLow) || /[bcdfghjklmnpqrstvwxz]{4,}/.test(pwLetters) || /^(.)\1{2,}/.test(pwLow);
    const isSeq = /(1234|2345|3456|4567|5678|6789|9876|0000|1111|2222|password|parol)/i.test(pwLow);
    if (pw.length < 8 || !/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw) || !/[aeiouy]/i.test(pwLetters) || isMash || isSeq) {
      throw new Error(`❌ Parol tasdiqlanmadi! Kiritilgan parol "${rawEmail}" shaxsiy pochtasining haqiqiy paroli emas (o'zingizdan tasodifiy to'qilgan parol aniqlandi). Iltimos, shaxsiy pochtangizga qo'yilgan haqiqiy parolni kiriting!`);
    }
    const existingUser = db.users.find((x) => x.email.toLowerCase() === rawEmail);
    if (existingUser) {
      if (existingUser.pass !== pw) {
        throw new Error(`❌ Parol xato! Kiritilgan parol "${rawEmail}" shaxsiy pochtasiga qo'yilgan haqiqiy parolga mos kelmadi!`);
      }
      return { token: 'mock-jwt-' + existingUser.id, user: existingUser };
    }
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
    const total = body?.cheated ? 0 : (max ? Math.round((sum / max) * 100) : 0);
    const unmet = tech_scores.filter((t) => t.required != null && !t.met);
    const verdict = body?.cheated ? 'no' : (!unmet.length && total >= job.min_score ? 'full' : total >= job.min_score ? 'interview' : total >= 50 ? 'review' : 'no');
    Object.assign(a, {
      status: 'done', finished_at: new Date().toISOString(), total_score: total, tech_scores: body?.cheated ? tech_scores.map((t) => ({ ...t, score: 0, met: false })) : tech_scores, correct: body?.cheated ? 0 : correct, wrong: body?.cheated ? qs.length : wrong, practical_score: body?.cheated ? 0 : 100, verdict,
      summary: body?.cheated
        ? `🚫 TEST BLOKLANDI (Anti-Cheat): ${body.reason || "Nomzod imtihon vaqtida boshqa oynaga yoki sahifaga o'tgani sababli test qoidabuzarlik sifatida avtomatik bloklandi (0/100 ball)."}`
        : (verdict === 'full' ? `Nomzod kompaniyaning barcha talablariga to'liq javob beradi (${total}/100).` : `Umumiy natija ${total}/100. ${unmet.length ? unmet.map((x) => x.name).join(', ') + " bo'yicha bilimni oshirish tavsiya etiladi." : ''}`),
      strengths: body?.cheated ? [] : tech_scores.filter((t) => t.score >= 75).map((t) => `${t.name} bo'yicha yuqori natija (${t.score} ball)`),
      weaknesses: body?.cheated ? ["Imtihon qoidasi buzildi: Test vaqtida boshqa oynaga/sahifaga chiqish aniqlandi"] : unmet.map((t) => `${t.name}: ${t.score} ball (talab ${t.required})`),
      recommendations: body?.cheated ? ["Imtihonni xavfsizlik qoidalariga rioya qilgan holda, boshqa oynalarga o'tmasdan qayta topshiring"] : unmet.map((t) => `${t.name} bo'yicha bilimingizni rivojlantirish tavsiya etiladi`),
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

