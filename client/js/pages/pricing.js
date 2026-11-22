import { session } from '../api.js?v=8';
import { html, toast } from '../ui.js';

const CARD_STORAGE_KEY = 'sp_owner_visa_card';
const ORDERS_STORAGE_KEY = 'sp_monetization_orders';

function getCardConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(CARD_STORAGE_KEY) || 'null');
    if (saved && saved.number) return saved;
  } catch {}
  return {
    type: 'VISA / HUMO',
    number: '4278 •••• •••• •••• (Karta qo\'shilmoqda)',
    holder: 'OLIMAXON (SKILLPROVE.UZ)',
    bank: 'O\'zbekiston (UZS / USD Multivalyuta)'
  };
}

export default async function (ctx) {
  const user = session.user;
  const isAdmin = user?.role === 'admin';
  const card = getCardConfig();
  const isPro = localStorage.getItem('sp_pro_active_' + (user?.id || 'guest')) === '1';

  const OLYMPIADS = [
    {
      id: 'olymp-js',
      badge: '🔥 YAQINLASHMOQDA • SHANBA 18:00',
      title: 'Frontend va JavaScript Respublika Onlayn Olimpiadasi',
      fee: '20 000 so\'m',
      prize: '1 500 000 so\'m + 1-darajali QR-Diplom',
      participants: 84,
      maxParticipants: 120,
      techs: ['HTML5', 'CSS3', 'JavaScript', 'Algorithm'],
      color: '#4f46e5'
    },
    {
      id: 'olymp-py',
      badge: '⚡ QABUL OCHIQ • YAKSHANBA 17:00',
      title: 'Python va Algoritmik Masalalar Haftalik Turniri',
      fee: '20 000 so\'m',
      prize: '1 200 000 so\'m + Oltin Sertifikat',
      participants: 67,
      maxParticipants: 100,
      techs: ['Python', 'Data Structures', 'SQL'],
      color: '#0284c7'
    },
    {
      id: 'olymp-girls',
      badge: '🌸 MAXSUS TURNIR • JUMA 16:00',
      title: 'Raqamli Avlod Qizlari: Web & STEAM Chempionati',
      fee: '15 000 so\'m',
      prize: '1 000 000 so\'m + VIP Mentorlik va Sertifikat',
      participants: 92,
      maxParticipants: 100,
      techs: ['Web Design', 'JavaScript', 'Ijodiy Kodlash'],
      color: '#db2777'
    }
  ];

  ctx.render(html`<div class="container py-4 page-enter">
    <!-- Hero Banner -->
    <div class="p-4 p-lg-5 rounded-4 mb-4 text-white position-relative overflow-hidden" style="background:linear-gradient(135deg,#1e1b4b 0%,#4f46e5 45%,#7c3aed 75%,#db2777 100%);box-shadow:0 20px 45px rgba(124,58,237,0.22);">
      <div class="row align-items-center g-4">
        <div class="col-lg-8">
          <span class="badge bg-warning text-dark fw-bold px-3 py-2 rounded-pill mb-3">
            <i class="bi bi-gem me-1"></i>SKILLPROVE MONETIZATSIYA VA IMKONIYATLAR EKOTIZIMI
          </span>
          <h1 class="display-6 fw-bold text-white mb-2">Bilimingizni rasmiy sertifikat, olimpiada sovrinlari va PRO karyeraga aylantiring!</h1>
          <p class="opacity-90 mb-0" style="font-size:1.05rem;">
            O'quvchilar uchun rasmiy QR-sertifikatlar va sovrinli olimpiadalar, o'quv markazlari uchun Anti-Cheat imtihon tizimi hamda IT-kompaniyalar uchun saralangan dasturchilar bazasi.
          </p>
        </div>
        <div class="col-lg-4 text-lg-end">
          <div class="p-3 rounded-4 text-start" style="background:rgba(255,255,255,0.13);border:1px solid rgba(255,255,255,0.28);backdrop-filter:blur(12px);">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="small fw-bold text-warning"><i class="bi bi-credit-card-2-front-fill me-1"></i>RASMIY TO'LOV KARTASI</span>
              <span class="badge bg-light text-dark fw-bold">VISA / HUMO</span>
            </div>
            <div class="fs-6 fw-bold font-monospace mb-1" id="card-num-display">${card.number}</div>
            <div class="small opacity-75">${card.holder}</div>
            ${isPro ? html`<div class="mt-2 badge bg-success w-100 py-2"><i class="bi bi-patch-check-fill me-1"></i>Sizda PRO status faol!</div>` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- Admin yoki Ega uchun Visa Karta Sozlamasi -->
    <div class="card-sp card-pad mb-4 border-primary" style="background:linear-gradient(135deg,#f5f3ff,#fdf2f8);">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <span class="badge bg-violet text-white mb-1"><i class="bi bi-credit-card me-1"></i>SHAXSIY VISA KARTA BOSHQARUVI</span>
          <h5 class="mb-1 fw-bold text-navy">Visa kartangiz qo'lingizga tekkanda raqamini shu yerdan kiritasiz</h5>
          <p class="small text-muted mb-0">Kiritilgan 16 xonali Visa / Humo karta raqami barcha to'lov oynalarida avtomatik chiqadi.</p>
        </div>
        <button class="btn btn-outline-primary btn-sm fw-bold" id="toggle-card-cfg">
          <i class="bi bi-gear-fill me-1"></i>Visa karta raqamini sozlash
        </button>
      </div>
      <form id="card-cfg-form" class="row g-2 mt-3 d-none">
        <div class="col-md-5">
          <input class="form-control" id="cfg-num" placeholder="Masalan: 4278 1234 5678 9012" value="${card.number}">
        </div>
        <div class="col-md-4">
          <input class="form-control" id="cfg-holder" placeholder="Karta egasi (Ism Familiya)" value="${card.holder}">
        </div>
        <div class="col-md-3">
          <button class="btn btn-primary w-100" type="submit"><i class="bi bi-check2-circle me-1"></i>Saqlash</button>
        </div>
      </form>
    </div>

    <!-- 1- va 4-YO'L: NOMZODLAR VA O'QUVCHILAR UCHUN TARIFLAR -->
    <div class="mb-5">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <span class="chip chip-violet">1- va 4-yo'nalish • B2C Monetizatsiya</span>
          <h3 class="fw-bold mt-1 mb-0">O'quvchilar va Nomzodlar uchun Xizmatlar</h3>
        </div>
      </div>

      <div class="row g-4">
        <!-- 1. Bepul Start -->
        <div class="col-lg-4">
          <div class="card-sp card-pad h-100 d-flex flex-column justify-content-between">
            <div>
              <span class="chip mb-2">Boshlang'ich</span>
              <h4 class="fw-bold">Start (Bepul)</h4>
              <div class="display-6 fw-bold text-navy my-2">0 so'm</div>
              <p class="small text-muted">Platforma bilan tanishish va o'z bilimini dastlabki sinovdan o'tkazish uchun.</p>
              <hr>
              <ul class="list-unstyled small" style="line-height:2;">
                <li><i class="bi bi-check-circle-fill text-success me-2"></i>Ochiq vakansiyalar bo'yicha test topshirish</li>
                <li><i class="bi bi-check-circle-fill text-success me-2"></i>Umumiy ball va foiz ko'rsatkichini ko'rish</li>
                <li><i class="bi bi-check-circle-fill text-success me-2"></i>Anti-Cheat himoyalangan imtihon muhiti</li>
                <li class="text-muted"><i class="bi bi-lock-fill me-2"></i>Rasmiy QR-kodli PDF Sertifikat yuklab olish</li>
                <li class="text-muted"><i class="bi bi-lock-fill me-2"></i>Xatolar tahlili va yopiq intervyu savollari</li>
              </ul>
            </div>
            <a href="#/jobs" class="btn btn-light-soft w-100 mt-3">Testlarni ko'rish</a>
          </div>
        </div>

        <!-- 2. Pullik QR-Sertifikat va Ekspert Tahlili (1-yo'l) -->
        <div class="col-lg-4">
          <div class="card-sp card-pad h-100 d-flex flex-column justify-content-between" style="border:2px solid #0ea5e9;">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-info text-dark fw-bold">1-YO'L • ENG OMMABOP</span>
                <span class="small text-muted">Bir martalik</span>
              </div>
              <h4 class="fw-bold">Rasmiy QR-Sertifikat + Tahlil</h4>
              <div class="display-6 fw-bold text-navy my-2">25 000 <span class="fs-6 fw-normal text-muted">so'm</span></div>
              <p class="small text-muted">Rezyume (CV), ish joyi yoki o'quv markaziga taqdim etish uchun rasmiy tasdiqlangan hujjat.</p>
              <hr>
              <ul class="list-unstyled small" style="line-height:2;">
                <li><i class="bi bi-check-circle-fill text-info me-2"></i><b>Maxsus ID va QR-kodli PDF Sertifikat</b></li>
                <li><i class="bi bi-check-circle-fill text-info me-2"></i><b>Batafsil xatolar tahlili:</b> har bir savolning to'g'ri javobi va kod yechimi</li>
                <li><i class="bi bi-check-circle-fill text-info me-2"></i>Texnologiyalar kesimida Radar-diagramma</li>
                <li><i class="bi bi-check-circle-fill text-info me-2"></i>Ish beruvchilar tekshirishi uchun onlayn verifikatsiya</li>
              </ul>
            </div>
            <button class="btn btn-primary w-100 mt-3" data-pay="Rasmiy QR-Sertifikat va Batafsil Tahlil|25 000 so'm|cert">
              <i class="bi bi-award-fill me-1"></i>Sertifikatni faollashtirish (25 000 so'm)
            </button>
          </div>
        </div>

        <!-- 3. PRO Nomzod Obunasi (4-yo'l) -->
        <div class="col-lg-4">
          <div class="card-sp card-pad h-100 d-flex flex-column justify-content-between position-relative" style="border:2.5px solid #7c3aed;background:linear-gradient(180deg,#ffffff 0%,#f5f3ff 100%);">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-violet text-white fw-bold">4-YO'L • KARYERA TEZLATKICHI</span>
                <span class="small text-violet fw-bold">Oylik obuna</span>
              </div>
              <h4 class="fw-bold">⭐ PRO Nomzod</h4>
              <div class="display-6 fw-bold text-violet my-2">49 000 <span class="fs-6 fw-normal text-muted">so'm / oy</span></div>
              <p class="small text-muted">IT-kompaniyalarga tezroq ishga kirish va cheksiz amaliy mashq qilish uchun to'liq paket.</p>
              <hr>
              <ul class="list-unstyled small" style="line-height:2;">
                <li><i class="bi bi-star-fill text-warning me-2"></i><b>Barcha PDF QR-Sertifikatlar bepul</b></li>
                <li><i class="bi bi-star-fill text-warning me-2"></i><b>«⭐ Verified PRO»</b> nishoni — kompaniyalar ro'yxatida 1-o'rinda chiqish</li>
                <li><i class="bi bi-star-fill text-warning me-2"></i>Real IT-kompaniyalarda tushadigan <b>yopiq intervyu savollari va kod masalalari bazasi</b></li>
                <li><i class="bi bi-star-fill text-warning me-2"></i>Cheksiz Code Sandbox va AI tavsiyalar</li>
              </ul>
            </div>
            <button class="btn btn-violet w-100 mt-3 fw-bold" data-pay="⭐ PRO Nomzod Oylik Obunasi|49 000 so'm|pro">
              <i class="bi bi-rocket-takeoff-fill me-1"></i>PRO Obunani Yoqish (49 000 so'm)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 3-YO'L: HAFTALIK PULLIK ONLAYN OLIMPIADALAR VA TURNIRLAR -->
    <div class="mb-5">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <span class="chip chip-violet">3-yo'nalish • Turnir va Olimpiadalar</span>
          <h3 class="fw-bold mt-1 mb-0">🏆 Sovrinli Haftalik Onlayn Olimpiadalar</h3>
          <p class="text-muted small mb-0">Badal to'lab qatnashing, Anti-Cheat tizimida halol bellashing va pul mukofotlari hamda 1-darajali Diplom yutib oling!</p>
        </div>
      </div>

      <div class="row g-4">
        ${OLYMPIADS.map((o) => html`
        <div class="col-lg-4">
          <div class="card-sp card-pad h-100 d-flex flex-column justify-content-between" style="border-top:5px solid ${o.color}">
            <div>
              <span class="badge rounded-pill mb-2" style="background:${o.color};color:#fff;">${o.badge}</span>
              <h5 class="fw-bold mb-2">${o.title}</h5>
              <div class="p-3 rounded-3 mb-3" style="background:#f8fafc;border:1px solid #e2e8f0;">
                <div class="d-flex justify-content-between small mb-1">
                  <span class="text-muted">🎁 Sovrin jamg'armasi:</span>
                  <b class="text-success">${o.prize}</b>
                </div>
                <div class="d-flex justify-content-between small mb-1">
                  <span class="text-muted">🎟️ Qatnashish badali:</span>
                  <b class="text-navy">${o.fee}</b>
                </div>
                <div class="d-flex justify-content-between small">
                  <span class="text-muted">👥 Ro'yxatdan o'tdi:</span>
                  <b>${o.participants} / ${o.maxParticipants} ishtirokchi</b>
                </div>
              </div>
              <div class="d-flex flex-wrap gap-1 mb-3">
                ${o.techs.map((t) => html`<span class="chip">${t}</span>`)}
              </div>
            </div>
            <button class="btn btn-primary w-100 fw-bold" data-pay="Olimpiada: ${o.title}|${o.fee}|${o.id}">
              <i class="bi bi-trophy-fill me-1"></i>Olimpiadaga yozilish (${o.fee})
            </button>
          </div>
        </div>`)}
      </div>
    </div>

    <!-- 2- va 5-YO'L: O'QUV MARKAZLARI VA IT-KOMPANIYALAR UCHUN (B2B) -->
    <div class="mb-5">
      <div class="mb-3">
        <span class="chip chip-violet">2- va 5-yo'nalish • B2B Korporativ Tariflar</span>
        <h3 class="fw-bold mt-1 mb-0">🏢 O'quv Markazlari va IT-Kompaniyalar uchun</h3>
      </div>

      <div class="row g-4">
        <!-- 2-yo'l: O'quv markazlari -->
        <div class="col-lg-6">
          <div class="card-sp card-pad h-100 d-flex flex-column justify-content-between" style="border-left:6px solid #7c3aed;">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-violet text-white">2-YO'L • O'QUV MARKAZLARI UCHUN (B2B SaaS)</span>
                <span class="fw-bold text-violet fs-5">350 000 so'm / oy</span>
              </div>
              <h4 class="fw-bold">🏫 «Anti-Cheat Imtihon Markazi» Paketi</h4>
              <p class="small text-muted">
                O'quv markazingiz yoki maktab/kurslaringiz o'quvchilaridan ko'chirishlarsiz, to'liq avtomatlashtirilgan kompyuter imtihonlarini olish tizimi:
              </p>
              <ul class="list-unstyled small" style="line-height:1.95;">
                <li><i class="bi bi-check2-square text-violet me-2"></i><b>Maxsus O'quv Markazi Kabineti:</b> o'z fanlaringiz va test/kod savollaringizni kiritish</li>
                <li><i class="bi bi-check2-square text-violet me-2"></i><b>Qattiq Anti-Cheat Nazorati:</b> o'quvchi boshqa oynaga o'tsa test avtomatik bloklanadi</li>
                <li><i class="bi bi-check2-square text-violet me-2"></i><b>500 nafargacha o'quvchi</b> imtihoni, guruhlar reytingi va tayyor PDF sertifikatlar</li>
              </ul>
            </div>
            <button class="btn btn-violet w-100 mt-2 fw-bold" data-pay="O'quv Markazi B2B Anti-Cheat Obunasi|350 000 so'm|b2b-edu">
              <i class="bi bi-building-check me-1"></i>O'quv markazini ulash (350 000 so'm / oy)
            </button>
          </div>
        </div>

        <!-- 5-yo'l: IT-Kompaniyalar HR Recruiting -->
        <div class="col-lg-6">
          <div class="card-sp card-pad h-100 d-flex flex-column justify-content-between" style="border-left:6px solid #10b981;">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-success text-white">5-YO'L • IT-KOMPANIYALAR UCHUN (HR-TECH)</span>
                <span class="fw-bold text-success fs-5">190 000 so'm / paket</span>
              </div>
              <h4 class="fw-bold">💼 «HR-Recruiting & VIP Vakansiya» Paketi</h4>
              <p class="small text-muted">
                Yuzlab quruq rezyumelarni o'qib vaqt yo'qotmang — amaliy sinov va Code Sandbox'da bilimi isbotlangan TOP dasturchilarni 1 kunda ishga oling:
              </p>
              <ul class="list-unstyled small" style="line-height:1.95;">
                <li><i class="bi bi-check2-square text-success me-2"></i><b>85+ ball to'plagan TOP nomzodlarning</b> to'g'ridan-to'g'ri telefon raqami va Telegram kontaktlarini ochish</li>
                <li><i class="bi bi-check2-square text-success me-2"></i>Nomzodlarning yozgan dasturiy kodlari va xatolar tahlilini to'liq ko'rish</li>
                <li><i class="bi bi-check2-square text-success me-2"></i><b>VIP Vakansiya:</b> e'loningizni Bosh sahifa va tavsiyalarda 1-o'ringa chiqarish</li>
              </ul>
            </div>
            <button class="btn btn-success w-100 mt-2 fw-bold text-white" data-pay="HR-Recruiting va VIP Vakansiya Paketi|190 000 so'm|b2b-hr">
              <i class="bi bi-person-check-fill me-1"></i>HR-Paketni faollashtirish (190 000 so'm)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 6-YO'L: GRANTLAR, STARTAP INVESTITSIYALAR VA HAMKORLIK -->
    <div class="card-sp card-pad mb-4" style="background:linear-gradient(135deg,#0f172a,#1e1b4b);color:#fff;">
      <div class="row align-items-center g-4">
        <div class="col-lg-8">
          <span class="badge bg-warning text-dark fw-bold mb-2">6-YO'L • GRANTLAR VA STARTAP EKOTIZIMI</span>
          <h3 class="text-white fw-bold mb-2">🌱 Grantlar, Venchur Fondlar va Ta'lim Hamkorligi</h3>
          <p class="text-white-50 small mb-3">
            SkillProve (skillprove.uz) — O'zbekistonda raqamli ta'lim sifatini oshirish va yoshlarni adolatli (meritokratiya asosida) ish bilan ta'minlashga qaratilgan ijtimoiy-texnologik startap. Loyiha <b>Raqamli Avlod Qizlari</b>, <b>IT Park (Tumaris.Tech)</b>, <b>Yoshlar Ventures</b> va xalqaro ta'lim grantlari uchun to'liq tayyor!
          </p>
          <div class="d-flex flex-wrap gap-2">
            <span class="badge bg-light bg-opacity-10 border border-light border-opacity-25 px-3 py-2">📈 Yuqori Masshtablilik (Scalable SaaS)</span>
            <span class="badge bg-light bg-opacity-10 border border-light border-opacity-25 px-3 py-2">💳 Visa / Humo / Click / Payme Tayyor</span>
            <span class="badge bg-light bg-opacity-10 border border-light border-opacity-25 px-3 py-2">🛡️ 100% Avtomatlashtirilgan Baholash</span>
          </div>
        </div>
        <div class="col-lg-4 text-lg-end">
          <button class="btn btn-warning btn-lg fw-bold text-dark w-100" data-pay="Startap Hamkorlik va Grant Qo'llab-quvvatlash|Ixtiyoriy / Shartnoma asosida|grant">
            <i class="bi bi-handshake me-2"></i>Hamkorlik / Grant Taklifi
          </button>
        </div>
      </div>
    </div>

    <!-- VISA / HUMO / CLICK / PAYME TO'LOV MODALI -->
    <div id="pay-modal" class="d-none" style="position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,0.72);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;">
      <div class="bg-white rounded-4 p-4 shadow-lg" style="max-width:480px;width:100%;border:2px solid #7c3aed;">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <span class="badge bg-violet text-white mb-1">XAVFSIZ TO'LOV OYNASI</span>
            <h5 class="fw-bold mb-0 text-navy" id="pm-title">Xizmatni faollashtirish</h5>
          </div>
          <button type="button" class="btn-close" id="pm-close"></button>
        </div>

        <!-- Visual VISA Card -->
        <div class="p-3 rounded-4 text-white mb-3" style="background:linear-gradient(135deg,#1e1b4b 0%,#4f46e5 55%,#db2777 100%);box-shadow:0 12px 28px rgba(79,70,229,0.28);">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="small opacity-75">To'lov qabul qiluvchi karta:</span>
            <span class="fw-bold">VISA / HUMO</span>
          </div>
          <div class="fs-5 fw-bold font-monospace mb-2" id="pm-card-num">${card.number}</div>
          <div class="d-flex justify-content-between align-items-center small">
            <span id="pm-card-holder">${card.holder}</span>
            <span class="badge bg-warning text-dark fw-bold" id="pm-amount">25 000 so'm</span>
          </div>
        </div>

        <form id="pm-form">
          <div class="mb-2">
            <label class="form-label small fw-bold">To'lov usulini tanlang:</label>
            <div class="d-flex gap-2">
              <label class="border rounded-3 p-2 flex-fill text-center small fw-bold" style="cursor:pointer;"><input type="radio" name="pm_method" value="Visa / Humo P2P" checked class="me-1">💳 Visa / Humo</label>
              <label class="border rounded-3 p-2 flex-fill text-center small fw-bold" style="cursor:pointer;"><input type="radio" name="pm_method" value="Click" class="me-1">🔵 Click</label>
              <label class="border rounded-3 p-2 flex-fill text-center small fw-bold" style="cursor:pointer;"><input type="radio" name="pm_method" value="Payme" class="me-1">🟢 Payme</label>
            </div>
          </div>
          <div class="mb-2">
            <label class="form-label small fw-bold">Ism-familiyangiz va Telegram / Telefon raqamingiz *</label>
            <input class="form-control" id="pm-contact" required placeholder="Masalan: Jasur Karimov (+998 90 123 45 67)" value="${user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : ''}">
          </div>
          <div class="mb-3">
            <label class="form-label small fw-bold">To'lov cheki raqami yoki izoh (ixtiyoriy)</label>
            <input class="form-control" id="pm-note" placeholder="Karta qo'shilgach chek ID kiritiladi">
          </div>
          <button type="submit" class="btn btn-primary w-100 btn-lg fw-bold">
            <i class="bi bi-shield-check me-2"></i>Tasdiqlash va Faollashtirish
          </button>
        </form>
      </div>
    </div>
  </div>`);

  const $ = (s) => ctx.root.querySelector(s);

  // Visa Card Configuration toggle & save
  $('#toggle-card-cfg').onclick = () => $('#card-cfg-form').classList.toggle('d-none');
  $('#card-cfg-form').onsubmit = (e) => {
    e.preventDefault();
    const num = $('#cfg-num').value.trim();
    const holder = $('#cfg-holder').value.trim() || 'OLIMAXON (SKILLPROVE.UZ)';
    if (!num) return toast('Karta raqamini kiriting', 'warning');
    localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify({ type: 'VISA / HUMO', number: num, holder }));
    $('#card-num-display').textContent = num;
    $('#pm-card-num').textContent = num;
    $('#pm-card-holder').textContent = holder;
    $('#card-cfg-form').classList.add('d-none');
    toast('Shaxsiy Visa / Humo karta raqamingiz muvaffaqiyatli saqlandi!', 'success');
  };

  // Payment Modal handling
  let activePlanKey = '';
  ctx.root.querySelectorAll('[data-pay]').forEach((btn) => {
    btn.onclick = () => {
      const [title, amount, key] = btn.dataset.pay.split('|');
      activePlanKey = key;
      $('#pm-title').textContent = title;
      $('#pm-amount').textContent = amount;
      $('#pay-modal').classList.remove('d-none');
    };
  });

  $('#pm-close').onclick = () => $('#pay-modal').classList.add('d-none');

  $('#pm-form').onsubmit = (e) => {
    e.preventDefault();
    const contact = $('#pm-contact').value.trim();
    if (!contact) return toast('Aloqa raqamingizni kiriting', 'warning');
    const orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
    orders.push({
      id: Date.now(),
      plan: $('#pm-title').textContent,
      amount: $('#pm-amount').textContent,
      contact,
      note: $('#pm-note').value.trim(),
      created_at: new Date().toISOString()
    });
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    if (activePlanKey === 'pro' || activePlanKey === 'cert') {
      localStorage.setItem('sp_pro_active_' + (user?.id || 'guest'), '1');
    }
    $('#pay-modal').classList.add('d-none');
    toast('So\'rovingiz qabul qilindi va xizmat faollashtirildi!', 'success');
  };
}
