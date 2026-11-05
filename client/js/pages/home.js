import { api, session } from '../api.js';
import { html, logo, skeletonCards } from '../ui.js';
import { dashHome } from '../components/layout.js';

const STEPS = [
  ['bi-person-plus', "Ro'yxatdan o'ting", "Nomzod sifatida profil yarating va o'z yo'nalishingizni tanlang."],
  ['bi-buildings', 'Kompaniya va lavozim tanlang', "Qiziqqan kompaniyani toping va ochiq vakansiyalardan birini tanlang."],
  ['bi-pencil-square', 'Bilimingizni sinang', "Lavozimga mos test va amaliy dasturlash topshiriqlarini bajaring."],
  ['bi-graph-up-arrow', 'Natijani oling', "0-100 ball, kuchli tomonlar va kompaniya talablariga moslik darajasini ko'ring."],
];
const WHY = [
  ['bi-shield-lock', 'Haqiqiy bilim', "Resume'dagi so'zlar emas, test va kod natijalari gapiradi."],
  ['bi-cpu', 'Xavfsiz sandbox', "Dasturlash topshiriqlari izolyatsiyalangan muhitda avtomatik tekshiriladi."],
  ['bi-bullseye', 'Talablarga moslik', "Natija har bir texnologiya bo'yicha kompaniya talablari bilan taqqoslanadi."],
  ['bi-bar-chart-line', 'Aniq tahlil', "Kuchli va zaif tomonlar hamda rivojlanish bo'yicha tavsiyalar."],
  ['bi-people', 'Adolatli tanlov', "Qaror test natijasi, talablar va inson bahosi asosida qabul qilinadi."],
  ['bi-file-earmark-pdf', 'PDF hisobot', "Natijalaringizni PDF ko'rinishida yuklab oling va ulashing."],
];
const TESTI = [
  ['Aziz Karimov', 'Frontend dasturchi', "CV yuborib javob kutish o'rniga bilimimni to'g'ridan-to'g'ri isbotladim. Bir haftada suhbatga taklif qilishdi!"],
  ['Dilnoza Rahimova', 'HR menejer', "Nomzodlarni ball bo'yicha solishtirish vaqtimizni ikki barobar tejadi. Endi suhbatga faqat mos odamlar keladi."],
  ['Jasur Toshmatov', 'Backend dasturchi', "Natijadan zaif tomonlarimni bildim va aynan o'sha mavzularni o'rgandim. Ikkinchi urinishda 85 ball oldim."],
];
const FAQ = [
  ["SkillProof'dan foydalanish pullikmi?", "Nomzodlar uchun platforma butunlay bepul. Kompaniyalar asosiy imkoniyatlardan bepul foydalanishi mumkin."],
  ['Test natijalari qanday hisoblanadi?', "Har bir savol uchun ball beriladi, texnologiyalar bo'yicha o'rtacha hisoblanadi va umumiy bilim darajasi 0 dan 100 gacha ko'rsatiladi."],
  ['Dasturlash topshiriqlari qayerda tekshiriladi?', "Kodingiz serverning asosiy jarayonidan alohida, resurslari cheklangan va tarmoqsiz sandbox muhitida ishga tushiriladi."],
  ['Testni qayta topshirish mumkinmi?', "Ha, har bir urinish tarixda saqlanadi. Kompaniya eng so'nggi va eng yaxshi natijalarni ko'radi."],
  ["Kompaniya meni avtomatik ishga qabul qiladimi?", "Yo'q. Yakuniy qaror kompaniya talablari, test natijasi va mutaxassisning shaxsiy bahosiga asoslanadi."],
];

export default async function (ctx) {
  const u = session.user;
  ctx.render(html`
  <section class="hero"><div class="container z"><div class="row align-items-center g-5">
    <div class="col-lg-7 page-enter">
      <span class="hero-badge mb-4"><i class="bi bi-stars"></i> Bilimga asoslangan yollash platformasi</span>
      <h1 class="mb-3">CV emas, bilimingiz bilan o'zingizni isbotlang!</h1>
      <p class="lead mb-4">Orzuingizdagi kompaniyani tanlang, bilimlaringizni sinovdan o'tkazing va haqiqiy imkoniyatlarga ega bo'ling.</p>
      <div class="d-flex flex-wrap gap-3">
        <a href="${u ? '#/jobs' : '#/register'}" class="btn btn-hero btn-lg"><i class="bi bi-lightning-charge-fill me-1"></i>Bilimimni sinab ko'rish</a>
        <a href="#/companies" class="btn btn-ghost btn-lg">Kompaniyalarni ko'rish</a>
        <a href="#/register?role=company" class="btn btn-ghost btn-lg">Kompaniya sifatida qo'shilish</a></div>
      <div class="d-flex gap-4 mt-5 small opacity-75 flex-wrap"><span><i class="bi bi-check2-circle me-1"></i>Bepul ro'yxatdan o'tish</span><span><i class="bi bi-check2-circle me-1"></i>Xavfsiz sandbox</span><span><i class="bi bi-check2-circle me-1"></i>Real vakansiyalar</span></div></div>
    <div class="col-lg-5 d-none d-lg-block"><div class="hero-card">
      <div class="d-flex justify-content-between align-items-center mb-3"><div><h6 class="mb-0">Frontend Developer</h6><small class="text-muted">Google Developer Team</small></div><span class="badge-soft interview">Suhbatga tavsiya</span></div>
      <div class="d-flex align-items-center gap-4 mb-3"><div class="score-ring" style="--v:82;width:110px;height:110px"><span style="font-size:1.9rem">82</span></div>
        <div class="flex-grow-1">${[['HTML', 90, 70], ['CSS', 85, 75], ['JavaScript', 82, 80], ['React', 65, 75]].map(([n, s, r]) => html`<div class="d-flex justify-content-between small fw-semibold"><span>${n}</span><span class="${s >= r ? 'text-success' : 'text-warning'}">${s}/${r}</span></div><div class="progress-sp mb-2" style="height:6px"><div class="bar ${s >= r ? 'ok' : 'warn'}" style="width:${s}%"></div></div>`)}</div></div>
      <div class="small text-muted p-2 rounded-3" style="background:#f6f7fb"><i class="bi bi-lightbulb text-warning me-1"></i>React bo'yicha bilimni rivojlantirish tavsiya etiladi.</div></div></div>
  </div></div></section>

  <section class="section"><div class="container">
    <div class="section-head"><span class="eyebrow">Jarayon</span><h2>Platforma qanday ishlaydi?</h2><p>To'rt oddiy qadamda bilimingizni isbotlang va orzuingizdagi ishga bir qadam yaqinlashing.</p></div>
    <div class="row g-4">${STEPS.map(([i, t, d], n) => html`<div class="col-md-6 col-lg-3"><div class="card-sp hover step-card"><span class="num">0${n + 1}</span><div class="icon"><i class="bi ${i}"></i></div><h5>${t}</h5><p class="text-muted mb-0">${d}</p></div></div>`)}</div>
  </div></section>

  <section class="section alt"><div class="container">
    <div class="section-head"><span class="eyebrow">Afzalliklar</span><h2>Nega SkillProof?</h2><p>Nomzodlar ham, kompaniyalar ham uchun adolatli va shaffof baholash tizimi.</p></div>
    <div class="row g-2">${WHY.map(([i, t, d]) => html`<div class="col-md-6 col-lg-4"><div class="feature"><div class="icon"><i class="bi ${i}"></i></div><div><h6 class="fw-bold text-navy mb-1">${t}</h6><p class="text-muted small mb-0">${d}</p></div></div></div>`)}</div>
  </div></section>

  <section class="section"><div class="container">
    <div class="section-head"><span class="eyebrow">Hamkorlar</span><h2>Hamkor kompaniyalar</h2><p>Bizga ishongan kompaniyalar bilimga asoslangan yollashni tanladi.</p></div>
    <div id="partners" class="d-flex flex-wrap justify-content-center gap-3"><div class="skeleton" style="width:200px;height:64px"></div><div class="skeleton" style="width:200px;height:64px"></div><div class="skeleton" style="width:200px;height:64px"></div></div>
    <div class="text-center mt-4"><a class="btn btn-light-soft" href="#/companies">Barcha kompaniyalar <i class="bi bi-arrow-right"></i></a></div>
  </div></section>

  <section class="section alt"><div class="container">
    <div class="section-head"><span class="eyebrow">Yo'nalishlar</span><h2>Mashhur ish yo'nalishlari</h2><p>O'zingizga mos kasbni tanlang va mos vakansiyalarni ko'ring.</p></div>
    <div id="cats">${skeletonCards(4, 'col-6 col-lg-3')}</div>
  </div></section>

  <section class="section"><div class="container"><div class="stats-band"><div class="row g-4 text-center" id="stats">
    ${['Kompaniyalar', "Ochiq ish o'rinlari", 'Nomzodlar', 'Topshirilgan testlar'].map((l) => html`<div class="col-6 col-lg-3"><div class="num">—</div><div class="lbl">${l}</div></div>`)}</div></div></div></section>

  <section class="section alt"><div class="container">
    <div class="section-head"><span class="eyebrow">Fikrlar</span><h2>Foydalanuvchilar fikrlari</h2></div>
    <div class="row g-4">${TESTI.map(([n, r, t]) => html`<div class="col-md-4"><div class="card-sp hover testi"><div class="stars mb-2">${'★★★★★'}</div><p>“${t}”</p>
      <div class="d-flex align-items-center gap-2 mt-3">${logo(n, '', 'sm')}<div><div class="fw-bold">${n}</div><div class="small text-muted">${r}</div></div></div></div></div>`)}</div>
  </div></section>

  <section class="section"><div class="container" style="max-width:820px">
    <div class="section-head"><span class="eyebrow">FAQ</span><h2>Savol-javoblar</h2></div>
    <div class="accordion accordion-sp" id="faq">${FAQ.map(([q, a], i) => html`<div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button ${i ? 'collapsed' : ''}" data-bs-toggle="collapse" data-bs-target="#f${i}">${q}</button></h2>
      <div id="f${i}" class="accordion-collapse collapse ${i ? '' : 'show'}" data-bs-parent="#faq"><div class="accordion-body text-muted">${a}</div></div></div>`)}</div>
  </div></section>

  <section class="section pt-0"><div class="container"><div class="bg-gradient-brand rounded-5 p-5 text-center">
    <h2 class="text-white">Bilimingizni isbotlashga tayyormisiz?</h2><p class="opacity-75 mb-4">Bir necha daqiqada ro'yxatdan o'ting va birinchi testingizni boshlang.</p>
    <a href="${u ? dashHome(u.role) : '#/register'}" class="btn btn-hero btn-lg" style="background:#fff;color:#14235c">${u ? 'Panelga o\'tish' : "Hoziroq boshlash"}</a></div></div></section>`);

  const [stats, cats, companies] = await Promise.all([api.get('/public/stats'), api.get('/public/categories'), api.get('/public/companies')]).catch(() => [null, [], []]);
  if (!ctx.isCurrent()) return;
  const $ = (s) => ctx.root.querySelector(s);
  if (stats) $('#stats').innerHTML = [['companies', 'Kompaniyalar'], ['jobs', "Ochiq ish o'rinlari"], ['candidates', 'Nomzodlar'], ['tests', 'Topshirilgan testlar']]
    .map(([k, l]) => `<div class="col-6 col-lg-3"><div class="num" data-count="${stats[k]}">0</div><div class="lbl">${l}</div></div>`).join('');
  ctx.root.querySelectorAll('[data-count]').forEach((el) => {
    const to = +el.dataset.count; const t0 = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString('uz-UZ') + (p === 1 ? '+' : ''); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  $('#cats').innerHTML = html`<div class="row g-4">${cats.slice(0, 8).map((c) => html`<div class="col-6 col-lg-3"><a class="card-sp hover cat-card" href="#/jobs?category=${c.id}"><div class="icon"><i class="bi ${c.icon}"></i></div><h6>${c.name}</h6><small class="text-muted">${c.jobs} ta vakansiya</small></a></div>`)}</div>`.s;
  $('#partners').innerHTML = html`${companies.map((c) => html`<a class="partner" href="#/companies/${c.id}">${logo(c.name, c.logo, 'sm')}${c.name}</a>`)}`.s;
}

