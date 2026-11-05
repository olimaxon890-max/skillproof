// Demo ma'lumotlar: kategoriyalar, texnologiyalar, kompaniyalar, ish o'rinlari, savollar, nomzodlar
const bcrypt = require('bcryptjs');
const { db, all, get, run, tx } = require('./db');

const CATEGORIES = {
  'Frontend dasturchi': ['bi-window-stack', ['HTML5', 'CSS3', 'SCSS', 'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Bootstrap', 'Responsive Design']],
  'Backend dasturchi': ['bi-hdd-network', ['Node.js', 'Python', 'Java', 'PHP', 'C#', 'SQL', 'PostgreSQL', 'MongoDB', 'REST API']],
  'Full Stack dasturchi': ['bi-layers', ['Ma\'lumotlar bazasi', 'API', 'Dasturiy arxitektura']],
  'Mobile dasturchi': ['bi-phone', ['Flutter', 'Dart', 'Kotlin', 'Swift', 'React Native']],
  'DevOps muhandisi': ['bi-cloud-check', ['Docker', 'Kubernetes', 'Linux', 'AWS', 'CI/CD', 'Git']],
  'UI/UX dizayner': ['bi-palette', ['Figma', 'UX Research', 'Wireframe', 'Prototyping', 'Design System']],
  'Marketing': ['bi-megaphone', []],
  'Buxgalteriya va moliya': ['bi-calculator', []],
  'Menejment': ['bi-kanban', []],
};

const cat = {}, tech = {};
const T = (name) => tech[name] ?? (() => { throw new Error('Texnologiya yo\'q: ' + name); })();

// ---- Savol yaratuvchi yordamchilar ----
const Q = [];
const C = (t, text, options, a, difficulty = "o'rta") => Q.push({ t, type: 'choice', text, options, answer: String(a), difficulty });
const TF = (t, text, a) => Q.push({ t, type: 'truefalse', text, answer: String(a), difficulty: 'oson' });
const S = (t, text, kw, difficulty = "o'rta") => Q.push({ t, type: 'short', text, answer: JSON.stringify(kw), difficulty });
const D = (t, text, code, options, a) => Q.push({ t, type: 'debug', text, code, options, answer: String(a), difficulty: "o'rta" });
const SC = (t, text, kw) => Q.push({ t, type: 'scenario', text, answer: JSON.stringify(kw), difficulty: 'qiyin', points: 2 });
const K = (t, text, starter, tests, points = 3) => Q.push({ t, type: 'code', text, starter, tests: JSON.stringify(tests), language: 'javascript', difficulty: "o'rta", points });

function questions() {
  // HTML5
  C('HTML5', "Sahifada eng muhim sarlavhani belgilash uchun qaysi teg ishlatiladi?", ['<head>', '<h1>', '<title>', '<header>'], 1, 'oson');
  C('HTML5', "Qaysi teg semantik hisoblanadi?", ['<div>', '<span>', '<article>', '<b>'], 2);
  TF('HTML5', "<img> tegida alt atributi qulaylik (accessibility) uchun muhim.", true);
  D('HTML5', "Quyidagi kodda qanday xato bor?", '<ul>\n  <li>Bir</li>\n  <p>Ikki</p>\n</ul>', ["<ul> ichida to'g'ridan-to'g'ri <p> bo'lmasligi kerak", "<li> yopilmagan", "<ul> noto'g'ri teg", "Xato yo'q"], 0);
  C('HTML5', "Forma maydonini majburiy qilish uchun qaysi atribut ishlatiladi?", ['mandatory', 'required', 'validate', 'must'], 1, 'oson');
  // CSS3
  C('CSS3', "Flexbox'da elementlarni asosiy o'q bo'ylab markazlash xususiyati qaysi?", ['align-items', 'justify-content', 'place-self', 'flex-wrap'], 1);
  C('CSS3', "Qaysi selektor eng yuqori ustuvorlikka ega?", ['.class', 'tag', '#id', '*'], 2);
  TF('CSS3', "position: absolute element eng yaqin position berilgan ota-elementga nisbatan joylashadi.", true);
  S('CSS3', "CSS'da box model nimalardan iborat?", ['content', 'padding', 'border', 'margin']);
  C('CSS3', "CSS Grid'da 3 ta teng ustun yaratish uchun qaysi yozuv to'g'ri?", ['grid-template-columns: repeat(3, 1fr)', 'grid-columns: 3', 'display: columns(3)', 'grid-template: 3'], 0);
  // SCSS
  C('SCSS', "SCSS'da o'zgaruvchi qanday e'lon qilinadi?", ['@color: red', '$color: red', '--color = red', 'var color: red'], 1, 'oson');
  TF('SCSS', "SCSS'da @mixin yordamida takrorlanuvchi uslublarni qayta ishlatish mumkin.", true);
  // JavaScript
  C('JavaScript', "typeof null natijasi nima?", ["'null'", "'object'", "'undefined'", "'number'"], 1);
  C('JavaScript', "Qaysi usul massiv elementlarini yangi massivga o'zgartiradi?", ['forEach', 'map', 'push', 'splice'], 1, 'oson');
  TF('JavaScript', "const bilan e'lon qilingan obyektning xossalarini o'zgartirish mumkin.", true);
  S('JavaScript', "Closure (yopilma) nima? Qisqacha tushuntiring.", ['funksiya', 'tashqi|ota|lexical|leksik', "o'zgaruvchi"]);
  D('JavaScript', "Quyidagi kod nima chiqaradi va nima uchun xato?", 'for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}', ["0 1 2 chiqadi", "3 3 3 chiqadi, chunki var funksiya doirasida", "Xato beradi", "Hech narsa chiqmaydi"], 1);
  C('JavaScript', "Promise.all qachon rad etiladi (reject)?", ["Hech qachon", "Birinchi promise rad etilganda", "Barcha promise'lar rad etilganda", "Oxirgi promise rad etilganda"], 1, 'qiyin');
  K('JavaScript', "solve(s) funksiyasini yozing: berilgan satrni teskari aylantirib qaytaring.", "function solve(s) {\n  // kodingizni shu yerda yozing\n  \n}", [
    { args: ['salom'], expected: 'molas' }, { args: [''], expected: '' }, { args: ['a'], expected: 'a', hidden: true }, { args: ['SkillProof'], expected: 'foorPllikS', hidden: true }], 2);
  K('JavaScript', "solve(arr) funksiyasini yozing: massivdagi juft sonlar yig'indisini qaytaring.", "function solve(arr) {\n  \n}", [
    { args: [[1, 2, 3, 4]], expected: 6 }, { args: [[]], expected: 0 }, { args: [[7, 9]], expected: 0, hidden: true }, { args: [[2, 4, 6, 8, 10]], expected: 30, hidden: true }], 3);
  K('JavaScript', "solve(nums, target) funksiyasini yozing: yig'indisi target ga teng bo'lgan ikkita element indekslarini [i, j] (i<j) ko'rinishida qaytaring.", "function solve(nums, target) {\n  \n}", [
    { args: [[2, 7, 11, 15], 9], expected: [0, 1] }, { args: [[3, 2, 4], 6], expected: [1, 2] }, { args: [[1, 5, 3, 7], 10], expected: [2, 3], hidden: true }], 4);
  // TypeScript
  C('TypeScript', "TypeScript'da qiymati noma'lum bo'lgan xavfsiz tur qaysi?", ['any', 'unknown', 'void', 'never'], 1, 'qiyin');
  TF('TypeScript', "interface va type alias bir xil ishlarni bajarishi mumkin, lekin faqat interface kengaytiriladi (extends).", false);
  C('TypeScript', "Qaysi yozuv ixtiyoriy xossani bildiradi?", ['name!: string', 'name?: string', 'name: string?', 'optional name: string'], 1);
  // React
  C('React', "Komponent holatini funksional komponentda saqlash uchun qaysi hook ishlatiladi?", ['useEffect', 'useState', 'useRef', 'useMemo'], 1, 'oson');
  C('React', "useEffect ga bo'sh bog'liqliklar massivi [] berilsa, u qachon ishlaydi?", ['Har renderda', 'Faqat birinchi renderdan keyin', 'Hech qachon', 'Faqat unmount paytida'], 1);
  TF('React', "React'da ro'yxat elementlariga key berish samaradorlik uchun muhim.", true);
  S('React', "Virtual DOM nima va nima uchun kerak?", ['DOM', 'taqqos|farq|diff', 'tez|samarali|optimal']);
  D('React', "Bu komponentda nima noto'g'ri?", 'function Counter() {\n  let count = 0;\n  return <button onClick={() => count++}>{count}</button>;\n}', ["Holat useState bilan saqlanmagan, UI yangilanmaydi", "onClick noto'g'ri yozilgan", "Komponent nomi kichik harf bilan", "Xato yo'q"], 0);
  // Vue.js, Bootstrap, Responsive
  C('Vue.js', "Vue 3 da reaktiv qiymat yaratish uchun qaysi funksiya ishlatiladi?", ['ref', 'state', 'observable', 'reactiveValue'], 0);
  TF('Vue.js', "v-for direktivasi ro'yxatni render qilish uchun ishlatiladi.", true);
  C('Bootstrap', "Bootstrap 5 grid tizimida har bir qator (row) nechta ustunga bo'linadi?", ['6', '10', '12', '16'], 2, 'oson');
  C('Bootstrap', "Mobil qurilmalarda yashiriladigan klass qaysi?", ['d-none d-md-block', 'hidden-xs', 'mobile-hide', 'd-sm-hide'], 0);
  C('Responsive Design', "Mobil qurilmalar uchun viewport meta tegi nima qiladi?", ["Sahifa kengligini qurilma kengligiga moslaydi", "Sahifani aylantiradi", "Rasmni siqadi", "Shriftni o'zgartiradi"], 0, 'oson');
  S('Responsive Design', "Media query nima uchun ishlatiladi?", ['ekran|qurilma|kenglik', 'uslub|css', 'moslash|responsiv']);
  // Node.js
  C('Node.js', "Node.js qanday modelga asoslangan?", ['Ko\'p oqimli bloklovchi', 'Bir oqimli, hodisalarga asoslangan, bloklanmaydigan I/O', 'Faqat sinxron', 'Faqat brauzerda ishlaydi'], 1);
  C('Node.js', "Express'da middleware nima?", ["So'rov va javob orasida ishlaydigan funksiya", "Ma'lumotlar bazasi drayveri", "Shablon dvigateli", "Test kutubxonasi"], 0);
  TF('Node.js', "process.env orqali muhit o'zgaruvchilariga murojaat qilinadi.", true);
  S('Node.js', "Event Loop nima? Qisqacha yozing.", ['bir oqim|single|thread', 'navbat|queue|callback', 'asinxron|async|bloklan']);
  K('Node.js', "solve(arr) funksiyasini yozing: massivdagi takrorlanmas elementlarni dastlabki tartibda qaytaring.", "function solve(arr) {\n  \n}", [
    { args: [[1, 2, 2, 3, 1]], expected: [1, 2, 3] }, { args: [[]], expected: [] }, { args: [['a', 'b', 'a']], expected: ['a', 'b'], hidden: true }], 3);
  // Python, Java, PHP, C#
  C('Python', "Python'da ro'yxat (list) va kortej (tuple) o'rtasidagi asosiy farq nima?", ["Tuple o'zgartirilmaydi (immutable)", "List tezroq", "Tuple faqat sonlarni saqlaydi", "Farq yo'q"], 0);
  C('Python', "Quyidagilardan qaysi biri lug'at (dict) yaratadi?", ['{"a": 1}', '["a", 1]', '("a", 1)', '<a=1>'], 0, 'oson');
  TF('Python', "Python'da bo'sh joylar (indentation) sintaksis ahamiyatiga ega.", true);
  C('Java', "Java'da barcha sinflarning ota sinfi qaysi?", ['Base', 'Object', 'Main', 'Class'], 1);
  TF('Java', "Java kodi bayt-kodga kompilyatsiya qilinib, JVM'da bajariladi.", true);
  C('PHP', "PHP'da o'zgaruvchi qaysi belgi bilan boshlanadi?", ['@', '$', '#', '&'], 1, 'oson');
  C('C#', "C# qaysi platforma asosida ishlaydi?", ['.NET', 'JVM', 'Node.js', 'LLVM'], 0, 'oson');
  // SQL, PostgreSQL, MongoDB, REST API
  C('SQL', "Ikki jadvalni bog'lash uchun qaysi kalit so'z ishlatiladi?", ['MERGE', 'JOIN', 'LINK', 'UNION ALL'], 1, 'oson');
  C('SQL', "Guruhlangan natijalarni filtrlash uchun qaysi kalit so'z ishlatiladi?", ['WHERE', 'HAVING', 'FILTER', 'LIMIT'], 1);
  TF('SQL', "PRIMARY KEY qiymatlari takrorlanishi mumkin.", false);
  S('SQL', "INNER JOIN va LEFT JOIN o'rtasidagi farqni yozing.", ['mos|ikkala|umumiy', 'chap|left', "null|bo'sh|qolgan"]);
  C('PostgreSQL', "PostgreSQL'da avtomatik oshuvchi identifikator uchun qaysi tur ishlatiladi?", ['SERIAL', 'AUTO', 'COUNTER', 'INCREMENT'], 0);
  TF('PostgreSQL', "PostgreSQL JSONB turini qo'llab-quvvatlaydi.", true);
  C('MongoDB', "MongoDB ma'lumotlarni qanday ko'rinishda saqlaydi?", ['Jadvallar', 'BSON hujjatlar', 'CSV fayllar', 'Grafik tugunlar'], 1, 'oson');
  TF('MongoDB', "MongoDB'da kolleksiyadagi hujjatlar har xil tuzilishga ega bo'lishi mumkin.", true);
  C('REST API', "Mavjud resursni qisman yangilash uchun qaysi HTTP metodi mos?", ['GET', 'POST', 'PATCH', 'OPTIONS'], 2);
  C('REST API', "Muvaffaqiyatli yaratilgan resurs uchun qaysi status kod qaytariladi?", ['200', '201', '301', '404'], 1, 'oson');
  S('REST API', "REST API'da stateless tamoyili nimani anglatadi?", ["so'rov|request", "holat|session|state", "server"]);
  SC('REST API', "API'ga bir soniyada minglab so'rov kelmoqda va server sekinlashdi. Qanday choralar ko'rasiz?", ['rate|limit|cheklov', 'cache|kesh', 'balans|load|masshtab|scale']);
  // Full stack
  C("Ma'lumotlar bazasi", "Ma'lumotlar bazasida indeks nima uchun ishlatiladi?", ["Qidiruvni tezlashtirish uchun", "Ma'lumotni shifrlash uchun", "Zaxira nusxa uchun", "Jadvalni o'chirish uchun"], 0);
  C('API', "API autentifikatsiyasida JWT nimani anglatadi?", ['JSON Web Token', 'Java Web Tool', 'JS Work Trace', 'JSON Wire Transfer'], 0, 'oson');
  C('Dasturiy arxitektura', "MVC arxitekturasida 'C' nimani bildiradi?", ['Component', 'Controller', 'Cache', 'Client'], 1, 'oson');
  SC('Dasturiy arxitektura', "Monolit ilovani mikroservislarga bo'lish kerakmi? Qaysi hollarda foydali va qanday xavflari bor?", ['masshtab|scale', 'murakkab|xavf|qiyin', 'jamoa|team|mustaqil']);
  // Mobile
  C('Flutter', "Flutter'da UI qurish uchun asosiy birlik nima?", ['Widget', 'Fragment', 'Activity', 'View'], 0, 'oson');
  C('Flutter', "StatefulWidget va StatelessWidget farqi nima?", ["Stateful o'z holatini o'zgartira oladi", "Stateless tezroq chizadi", "Farq yo'q", "Stateful faqat iOS uchun"], 0);
  C('Dart', "Dart'da null bo'la olmaydigan o'zgaruvchi qanday e'lon qilinadi?", ['String? a', 'String a', 'nullable String a', 'String! a'], 1);
  C('Kotlin', "Kotlin'da o'zgarmas o'zgaruvchi qaysi kalit so'z bilan e'lon qilinadi?", ['var', 'val', 'let', 'const var'], 1, 'oson');
  C('Swift', "Swift'da ixtiyoriy (optional) tur qanday belgilanadi?", ['Int?', 'Int!!', 'Int*', 'optional Int'], 0, 'oson');
  C('React Native', "React Native kodi nimaga kompilyatsiya qilinadi/ishlaydi?", ["Native UI komponentlari bilan JavaScript orqali", "Faqat WebView ichida", "Faqat Android'da", "Faqat C++ da"], 0);
  // DevOps
  C('Docker', "Docker image va container o'rtasidagi farq nima?", ["Image — shablon, container — uning ishlayotgan nusxasi", "Ikkalasi bir xil", "Container — fayl turi", "Image — tarmoq"], 0);
  C('Docker', "Konteyner portini tashqariga ochish uchun qaysi flag ishlatiladi?", ['-v', '-p', '-e', '-d'], 1);
  TF('Docker', "Dockerfile'dagi har bir buyruq yangi qatlam (layer) yaratishi mumkin.", true);
  C('Kubernetes', "Kubernetes'da eng kichik joylashtirish birligi nima?", ['Node', 'Pod', 'Service', 'Namespace'], 1);
  C('Kubernetes', "Ilovaga barqaror tarmoq manzili beradigan resurs qaysi?", ['Service', 'ConfigMap', 'Secret', 'Volume'], 0, 'qiyin');
  C('Linux', "Katalogdagi fayllar ro'yxatini ko'rsatuvchi buyruq qaysi?", ['ls', 'cd', 'rm', 'cat'], 0, 'oson');
  C('Linux', "Faylga ijro huquqini berish buyrug'i qaysi?", ['chmod +x fayl', 'chown fayl', 'exec fayl', 'perm +x fayl'], 0);
  C('AWS', "AWS'da obyektlarni saqlash xizmati qaysi?", ['EC2', 'S3', 'RDS', 'Lambda'], 1, 'oson');
  C('AWS', "Serverless kod bajarish xizmati qaysi?", ['Lambda', 'S3', 'VPC', 'IAM'], 0);
  C('CI/CD', "CI nimani anglatadi?", ['Continuous Integration', 'Code Inspection', 'Cloud Infrastructure', 'Central Index'], 0, 'oson');
  S('CI/CD', "CI/CD pipeline'ning odatiy bosqichlarini sanang.", ['build|yig', 'test', 'deploy|joylash']);
  C('Git', "Yangi branch yaratib unga o'tish buyrug'i qaysi?", ['git branch -d x', 'git checkout -b x', 'git merge x', 'git new x'], 1);
  C('Git', "git rebase va git merge o'rtasidagi asosiy farq nima?", ["Rebase tarixni chiziqli qiladi, merge birlashtiruvchi commit yaratadi", "Farq yo'q", "Merge faqat lokalda ishlaydi", "Rebase fayllarni o'chiradi"], 0, 'qiyin');
  TF('Git', "git pull = git fetch + git merge.", true);
  // Dizayn
  C('Figma', "Figma'da qayta ishlatiladigan UI elementlari nima deb ataladi?", ['Components', 'Frames', 'Layers', 'Plugins'], 0, 'oson');
  C('Figma', "Figma'da elementlarni avtomatik moslashuvchan joylashtirish xususiyati qaysi?", ['Auto Layout', 'Smart Grid', 'Flex Pro', 'Autosize'], 0);
  S('UX Research', "Foydalanuvchi intervyusi (user interview) nima uchun o'tkaziladi?", ['ehtiyoj|muammo', 'foydalanuvchi', 'tushun|aniqla|o\'rgan']);
  C('UX Research', "Qaysi usul miqdoriy (quantitative) tadqiqot hisoblanadi?", ['So\'rovnoma (ko\'p respondent bilan)', 'Chuqur intervyu', 'Kuzatuv', 'Fokus-guruh'], 0);
  C('Wireframe', "Wireframe nima?", ["Sahifaning soddalashtirilgan tuzilma maketi", "Yakuniy dizayn", "Kod", "Animatsiya"], 0, 'oson');
  C('Prototyping', "Prototip qaysi maqsadda yaratiladi?", ["Foydalanuvchi oqimini real ishlatishdan oldin sinash", "Serverni sinash", "Ma'lumotlar bazasini loyihalash", "Hisob-kitob"], 0);
  C('Design System', "Design System'ning asosiy maqsadi nima?", ["Mahsulotda izchil va qayta ishlatiladigan dizayn yaratish", "Faqat ranglar tanlash", "Kod yozish", "Reklama qilish"], 0);
  SC('Design System', "Jamoada dizaynerlar va dasturchilar turli uslubdagi tugmalar ishlatmoqda. Muammoni qanday hal qilasiz?", ['komponent|component', 'yagona|standart|izchil', 'hujjat|guideline|token']);
}

function seedCatalog() {
  for (const [name, [icon, techs]] of Object.entries(CATEGORIES)) {
    cat[name] = run('INSERT INTO categories (name, icon) VALUES (?,?)', name, icon).id;
    techs.forEach((t) => { tech[t] = run('INSERT INTO technologies (name, category_id) VALUES (?,?)', t, cat[name]).id; });
  }
  questions();
  for (const q of Q) {
    run(`INSERT INTO questions (technology_id, type, text, code, options, answer, language, starter, tests, points, difficulty) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      T(q.t), q.type, q.text, q.code || '', JSON.stringify(q.options || []), q.answer ?? '', q.language || 'javascript', q.starter || '', q.tests || '[]', q.points || 1, q.difficulty);
  }
}

const COMPANIES = [
  { name: 'Google Developer Team', slug: 'google-developer-team', industry: 'Axborot texnologiyalari', city: 'Toshkent', size: '200+', color: '4285f4',
    description: "Demo kompaniya: zamonaviy veb va mobil mahsulotlar ustida ishlovchi xalqaro dasturchilar jamoasi. Biz bilimga asoslangan yollashga ishonamiz.", website: 'https://example.com',
    jobs: [
      { title: 'Frontend Developer', cat: 'Frontend dasturchi', min: 75, dur: 25, salary: '$1500 - $2500', desc: "React asosidagi katta veb-ilovalarni yaratish va qo'llab-quvvatlash.",
        reqs: { HTML5: 70, CSS3: 75, JavaScript: 80, React: 75 } },
      { title: 'Backend Developer (Node.js)', cat: 'Backend dasturchi', min: 70, dur: 25, salary: '$1800 - $3000', desc: "Node.js va PostgreSQL asosida masshtablanuvchi REST API'lar yaratish.",
        reqs: { 'Node.js': 75, SQL: 70, 'REST API': 70, JavaScript: 70 } }] },
  { name: 'Nova Soft', slug: 'nova-soft', industry: 'Dasturiy ta\'minot ishlab chiqish', city: 'Samarqand', size: '50-100', color: '7c3aed',
    description: "Nova Soft — buyurtma asosida dasturiy mahsulotlar yaratuvchi autsorsing kompaniya. Yosh va tashabbuskor jamoa.",
    jobs: [{ title: 'Full Stack Developer', cat: 'Full Stack dasturchi', min: 70, dur: 30, salary: '$1200 - $2200', desc: "Frontend va backend qismlarini yaxlit ishlab chiqish.",
      reqs: { HTML5: 65, JavaScript: 75, React: 65, 'Node.js': 65, "Ma'lumotlar bazasi": 60 } },
    { title: 'Junior Frontend Developer', cat: 'Frontend dasturchi', min: 55, dur: 20, salary: '$500 - $900', desc: "Tajribasiz dasturchilar uchun o'sish imkoniyati.", reqs: { HTML5: 55, CSS3: 55, JavaScript: 55 } }] },
  { name: 'PayFlow', slug: 'payflow', industry: 'Fintech', city: 'Toshkent', size: '100-200', color: '12b76a',
    description: "PayFlow — to'lov tizimlari va moliyaviy texnologiyalar yaratuvchi tez rivojlanayotgan kompaniya.",
    jobs: [{ title: 'Python Backend Developer', cat: 'Backend dasturchi', min: 75, dur: 25, salary: '$2000 - $3500', desc: "To'lov tizimlari uchun xavfsiz va tezkor servislar yaratish.",
      reqs: { Python: 75, SQL: 75, PostgreSQL: 70, 'REST API': 75 } }] },
  { name: 'CloudWave', slug: 'cloudwave', industry: 'Bulutli xizmatlar va DevOps', city: 'Toshkent', size: '20-50', color: '0ea5e9',
    description: "CloudWave — bulutli infratuzilma va avtomatlashtirish bo'yicha mutaxassis jamoa.",
    jobs: [{ title: 'DevOps Engineer', cat: 'DevOps muhandisi', min: 70, dur: 30, salary: '$2000 - $3500', desc: "CI/CD jarayonlari, Docker va Kubernetes klasterlarini boshqarish.",
      reqs: { Docker: 75, Kubernetes: 65, Linux: 70, 'CI/CD': 70, Git: 70 } }] },
  { name: 'Pixel Studio', slug: 'pixel-studio', industry: 'Dizayn va kreativ', city: 'Buxoro', size: '10-20', color: 'f59e0b',
    description: "Pixel Studio — mahsulot dizayni va foydalanuvchi tajribasi bo'yicha ixtisoslashgan studiya.",
    jobs: [{ title: 'UI/UX Designer', cat: 'UI/UX dizayner', min: 70, dur: 20, salary: '$900 - $1800', desc: "Veb va mobil ilovalar uchun foydalanuvchi interfeyslarini loyihalash.",
      reqs: { Figma: 75, 'UX Research': 65, Wireframe: 65, 'Design System': 60 } }] },
  { name: 'Bazaar Mobile', slug: 'bazaar-mobile', industry: 'Mobil ilovalar', city: 'Namangan', size: '30-60', color: 'ef4444',
    description: "Bazaar Mobile — onlayn savdo uchun mobil ilovalar yaratadi. Flutter bo'yicha kuchli jamoa.",
    jobs: [{ title: 'Flutter Developer', cat: 'Mobile dasturchi', min: 70, dur: 25, salary: '$1200 - $2400', desc: "Android va iOS uchun yagona kod bazasida ilovalar yaratish.",
      reqs: { Flutter: 75, Dart: 70, Git: 60 } }] },
];

const CANDIDATES = [
  ['Aziz', 'Karimov', 0.92], ['Malika', 'Yusupova', 0.85], ['Jasur', 'Toshmatov', 0.7], ['Dilnoza', 'Rahimova', 0.78],
  ['Sardor', 'Aliyev', 0.55], ['Nodira', 'Qodirova', 0.88], ['Bekzod', 'Ismoilov', 0.4], ['Madina', 'Sodiqova', 0.65],
];

function seed() {
  const finish = require('./routes/candidate').finish;
  const build = require('./routes/candidate').buildQuestionSet;
  tx(() => {
    seedCatalog();
    const adminHash = bcrypt.hashSync('Admin123!', 10), demoHash = bcrypt.hashSync('Demo1234!', 10);
    run("INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES ('admin@skillproof.uz', ?, 'admin', 'Super', 'Admin')", adminHash);
    const jobIds = [];
    COMPANIES.forEach((c, i) => {
      const cid = run('INSERT INTO companies (name, slug, industry, city, size, description, website, status) VALUES (?,?,?,?,?,?,?,?)',
        c.name, c.slug, c.industry, c.city, c.size, c.description, c.website || '', 'approved').id;
      run('UPDATE companies SET logo=? WHERE id=?', '', cid);
      run("INSERT INTO users (email, password_hash, role, first_name, last_name, company_id) VALUES (?,?,'company','HR','Menejer',?)", i === 0 ? 'hr@google-dev.uz' : `hr@${c.slug}.uz`, demoHash, cid);
      c.jobs.forEach((j) => {
        const jid = run('INSERT INTO jobs (company_id, title, category_id, description, salary, min_score, duration_min, questions_per_tech) VALUES (?,?,?,?,?,?,?,?)',
          cid, j.title, cat[j.cat], j.desc, j.salary, j.min, j.dur, 4).id;
        Object.entries(j.reqs).forEach(([t, m]) => run('INSERT INTO job_requirements (job_id, technology_id, min_score) VALUES (?,?,?)', jid, T(t), m));
        jobIds.push(jid);
      });
    });
    // Kutilayotgan (tasdiqlanmagan) kompaniya
    const pend = run("INSERT INTO companies (name, slug, industry, city, description, status) VALUES ('Yangi Startap', 'yangi-startap', 'Startap', 'Toshkent', 'Tasdiqlashni kutayotgan demo kompaniya', 'pending')").id;
    run("INSERT INTO users (email, password_hash, role, first_name, last_name, company_id) VALUES ('hr@yangi-startap.uz', ?, 'company', 'Yangi', 'Startap', ?)", demoHash, pend);

    run("INSERT INTO users (email, password_hash, role, first_name, last_name, phone, city, direction, bio, skills) VALUES ('nomzod@demo.uz', ?, 'candidate', 'Demo', 'Nomzod', '+998901234567', 'Toshkent', 'Frontend dasturchi', 'Frontend yo''nalishida o''sishni xohlovchi dasturchi.', 'HTML5, CSS3, JavaScript')", demoHash);
    CANDIDATES.forEach(([f, l, skill], i) => {
      const uid = run("INSERT INTO users (email, password_hash, role, first_name, last_name, phone, city, direction) VALUES (?,?,'candidate',?,?,?,?,?)",
        `${f.toLowerCase()}@demo.uz`, demoHash, f, l, `+99890${1000000 + i * 1111}`, 'Toshkent', 'Frontend dasturchi').id;
      // Demo natijalar: Frontend va Backend lavozimlariga topshirilgan testlar
      [jobIds[0], jobIds[1]].forEach((jid, k) => {
        if (k === 1 && i % 2) return;
        const job = get('SELECT * FROM jobs WHERE id=?', jid);
        const ids = build(job);
        const aid = run('INSERT INTO attempts (user_id, job_id, company_id, question_ids, deadline) VALUES (?,?,?,?,?)',
          uid, jid, job.company_id, JSON.stringify(ids), new Date().toISOString()).id;
        ids.forEach((qid) => {
          const sc = Math.random() < skill + (k ? -0.05 : 0) ? 1 : (Math.random() < 0.2 ? 0.5 : 0);
          run('INSERT INTO answers (attempt_id, question_id, response, score) VALUES (?,?,?,?)', aid, qid, '', sc);
        });
        finish(aid);
        const day = new Date(Date.now() - (i * 1.5 + k) * 86400000).toISOString();
        run('UPDATE attempts SET finished_at=?, started_at=? WHERE id=?', day, day, aid);
      });
    });
    run("INSERT INTO activity (user_id, action, details) VALUES (NULL, 'seed', 'Demo ma''lumotlar yuklandi')");
  });
  console.log("Demo ma'lumotlar yuklandi. Kirish ma'lumotlari README faylida.");
}

if (require.main === module) {
  if (process.argv.includes('--reset')) {
    ['activity', 'answers', 'attempts', 'questions', 'job_requirements', 'jobs', 'users', 'companies', 'technologies', 'categories']
      .forEach((t) => db.exec(`DELETE FROM ${t}`));
    db.exec("DELETE FROM sqlite_sequence");
  }
  seed();
}

module.exports = { seed };

