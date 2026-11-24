import { api, session } from '../api.js?v=10';
import { html, toast, withBusy, fmtDateTime } from '../ui.js';
import { PAYMENT_CARD_NUMBER, PAYMENT_CARD_HOLDER, CONTACT_TELEGRAM } from '../config.js';

const CARD_STORAGE_KEY = 'sp_owner_visa_card';

function getCardConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(CARD_STORAGE_KEY) || 'null');
    if (saved && saved.number) return saved;
  } catch {}
  if (PAYMENT_CARD_NUMBER) return { number: PAYMENT_CARD_NUMBER, holder: PAYMENT_CARD_HOLDER, telegram: CONTACT_TELEGRAM };
  return { number: "Karta Admin panelda ulanadi", holder: PAYMENT_CARD_HOLDER || 'OLIMAXON (SKILLPROVE.UZ)', telegram: CONTACT_TELEGRAM || 'https://t.me/skillprove_uz' };
}

export default async function (ctx) {
  const user = session.user;
  const card = getCardConfig();
  const myOrders = await api.get('/orders/my').catch(() => []);

  ctx.render(html`<div class="container py-4 page-enter">
    <!-- Hero Banner -->
    <div class="p-4 p-lg-5 rounded-4 mb-4 text-white position-relative overflow-hidden" style="background:linear-gradient(135deg,#1e1b4b 0%,#4f46e5 45%,#7c3aed 75%,#db2777 100%);box-shadow:0 20px 45px rgba(124,58,237,0.22);">
      <div class="row align-items-center g-4">
        <div class="col-lg-8">
          <span class="badge bg-warning text-dark fw-bold px-3 py-2 rounded-pill mb-3">
            <i class="bi bi-gem me-1"></i>SKILLPROVE MONETIZATSIYA VA BIZNES TARIFLAR
          </span>
          <h1 class="display-6 fw-bold text-white mb-2">Bilimingizni rasmiy QR-sertifikat va PRO karyeraga aylantiring!</h1>
          <p class="opacity-90 mb-0" style="font-size:1.05rem;">
            Nomzodlar uchun QR-sertifikatlar va intervyuga tayyorgarlik bazasi, o'quv markazlari uchun yopiq imtihon markazi hamda IT-kompaniyalar uchun saralangan dasturchilar kontaktlari.
          </p>
        </div>
        <div class="col-lg-4 text-lg-end">
          <div class="p-3 rounded-4 text-start" style="background:rgba(255,255,255,0.13);border:1px solid rgba(255,255,255,0.28);backdrop-filter:blur(12px);">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="small fw-bold text-warning"><i class="bi bi-credit-card-2-front-fill me-1"></i>TO'LOV TIZIMI</span>
              <span class="badge bg-light text-dark fw-bold">VISA / HUMO</span>
            </div>
            <div class="fs-6 fw-bold font-monospace mb-1">${card.number}</div>
            <div class="small opacity-75">${card.holder}</div>
          </div>
        </div>
      </div>
    </div>

    ${myOrders.length ? html`
      <div class="card-sp card-pad mb-4 border-primary">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <h6 class="fw-bold mb-0 text-navy"><i class="bi bi-receipt-cutoff text-violet me-2"></i>Mening buyurtmalarim</h6>
          ${user?.role === 'admin' ? html`<a href="#/admin/payments" class="btn btn-sm btn-primary">Admin To'lovlar paneliga o'tish</a>` : ''}
        </div>
        <div class="table-responsive">
          <table class="table table-sm align-middle mb-0">
            <thead><tr><th>Buyurtma kodi</th><th>Tarif</th><th>Summa</th><th>Sana</th><th>Holat</th></tr></thead>
            <tbody>
              ${myOrders.map((o) => html`<tr>
                <td><span class="badge bg-dark font-monospace">${o.code}</span></td>
                <td class="fw-semibold">${o.plan_title}</td>
                <td>${o.amount}</td>
                <td class="small text-muted">${fmtDateTime(o.created_at)}</td>
                <td>${o.status === 'active' ? html`<span class="badge-soft approved">Faol (30 kun)</span>` : html`<span class="badge-soft pending">Admin tasdig'i kutilmoqda</span>`}</td>
              </tr>`)}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    <!-- 1- va 4-YO'L: NOMZODLAR VA O'QUVCHILAR UCHUN TARIFLAR -->
    <div class="mb-5">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <span class="chip chip-violet">1- va 4-yo'nalish • B2C Tariflar</span>
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
                <li class="text-muted"><i class="bi bi-lock-fill me-2"></i>Rasmiy QR-kodli Sertifikat va chuqur tahlil</li>
                <li class="text-muted"><i class="bi bi-lock-fill me-2"></i>⭐ PRO nishoni va Intervyuga tayyorgarlik bazasi</li>
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
                <span class="badge bg-info text-dark fw-bold">1-YO'L • SERTIFIKAT</span>
                <span class="small text-muted">Bir martalik</span>
              </div>
              <h4 class="fw-bold">Rasmiy QR-Sertifikat + Tahlil</h4>
              <div class="display-6 fw-bold text-navy my-2">25 000 <span class="fs-6 fw-normal text-muted">so'm</span></div>
              <p class="small text-muted">Rezyume (CV), ish joyi yoki o'quv markaziga taqdim etish uchun rasmiy tasdiqlangan hujjat.</p>
              <hr>
              <ul class="list-unstyled small" style="line-height:2;">
                <li><i class="bi bi-check-circle-fill text-info me-2"></i><b>Maxsus ID (SP-2026-XXXX) va QR-kodli Sertifikat</b></li>
                <li><i class="bi bi-check-circle-fill text-info me-2"></i><b>skillprove.uz/#/verify/ID</b> orqali rasmiy tekshiruv</li>
                <li><i class="bi bi-check-circle-fill text-info me-2"></i><b>Batafsil texnik tahlil:</b> texnologiyalar kesimida kuchli va oqsagan mavzular diagnostikasi</li>
                <li><i class="bi bi-check-circle-fill text-info me-2"></i>Shaxsiy o'quv adabiyotlari tavsiyasi</li>
              </ul>
            </div>
            <button class="btn btn-primary w-100 mt-3 fw-bold" data-pay="🏅 Rasmiy QR-Sertifikat va Batafsil Tahlil|25 000 so'm|cert">
              <i class="bi bi-award-fill me-1"></i>Buyurtma berish (25 000 so'm)
            </button>
          </div>
        </div>

        <!-- 3. PRO Nomzod Obunasi (4-yo'l) -->
        <div class="col-lg-4">
          <div class="card-sp card-pad h-100 d-flex flex-column justify-content-between position-relative" style="border:2.5px solid #7c3aed;background:linear-gradient(180deg,#ffffff 0%,#f5f3ff 100%);">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-violet text-white fw-bold">4-YO'L • PRO NOMZOD</span>
                <span class="small text-violet fw-bold">30 kunlik obuna</span>
              </div>
              <h4 class="fw-bold">⭐ PRO Nomzod</h4>
              <div class="display-6 fw-bold text-violet my-2">49 000 <span class="fs-6 fw-normal text-muted">so'm / oy</span></div>
              <p class="small text-muted">IT-kompaniyalarga tezroq ishga kirish va texnik suhbatlarga tayyorlanish uchun to'liq paket.</p>
              <hr>
              <ul class="list-unstyled small" style="line-height:2;">
                <li><i class="bi bi-star-fill text-warning me-2"></i><b>Barcha QR-Sertifikatlar va Tahlillar bepul</b></li>
                <li><i class="bi bi-star-fill text-warning me-2"></i>Profilda va kompaniyalar ro'yxatida <b>«⭐ PRO»</b> nishoni</li>
                <li><i class="bi bi-star-fill text-warning me-2"></i><b>«Intervyuga tayyorgarlik» (#/candidate/prep)</b> bo'limidagi barcha texnik savollar va kod yechimlari</li>
                <li><i class="bi bi-star-fill text-warning me-2"></i>Cheksiz Code Sandbox mashqlari</li>
              </ul>
            </div>
            <button class="btn btn-violet w-100 mt-3 fw-bold" data-pay="⭐ PRO Nomzod Oylik Obunasi|49 000 so'm|pro">
              <i class="bi bi-rocket-takeoff-fill me-1"></i>PRO Buyurtma berish (49 000 so'm)
            </button>
          </div>
        </div>
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
                <span class="badge bg-violet text-white">2-YO'L • O'QUV MARKAZLARI UCHUN</span>
                <span class="fw-bold text-violet fs-5">350 000 so'm / oy</span>
              </div>
              <h4 class="fw-bold">🏫 «Imtihon Markazi» Paketi (#/company/exams)</h4>
              <p class="small text-muted">
                O'quv markazingiz guruhlari uchun maxsus kirish kodli (EXAM-XXXX) yopiq imtihon sessiyalarini o'tkazish tizimi:
              </p>
              <ul class="list-unstyled small" style="line-height:1.95;">
                <li><i class="bi bi-check2-square text-violet me-2"></i><b>Yopiq Imtihon Sessiyalari:</b> guruh uchun maxsus kod yaratish, o'quvchilar <code>#/exam</code> orqali kiradi</li>
                <li><i class="bi bi-check2-square text-violet me-2"></i><b>Anti-Cheat Nazorati:</b> imtihon vaqtida boshqa oynaga/tabga o'tilsa test avtomatik bloklanadi</li>
                <li><i class="bi bi-check2-square text-violet me-2"></i><b>Guruh Reytingi va CSV (Excel):</b> barcha o'quvchilar natijalarini bir tugmada yuklab olish</li>
              </ul>
            </div>
            <button class="btn btn-violet w-100 mt-2 fw-bold" data-pay="🏫 O'quv Markazi Imtihon Markazi Obunasi|350 000 so'm|b2b-edu">
              <i class="bi bi-building-check me-1"></i>Imtihon markazini ulash (350 000 so'm)
            </button>
          </div>
        </div>

        <!-- 5-yo'l: IT-Kompaniyalar HR Recruiting -->
        <div class="col-lg-6">
          <div class="card-sp card-pad h-100 d-flex flex-column justify-content-between" style="border-left:6px solid #10b981;">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-success text-white">5-YO'L • IT-KOMPANIYALAR UCHUN (HR-TECH)</span>
                <span class="fw-bold text-success fs-5">190 000 so'm / oy</span>
              </div>
              <h4 class="fw-bold">💼 «HR-Recruiting & Nomzod Kontaktlari» Paketi</h4>
              <p class="small text-muted">
                Amaliy sinov va Code Sandbox'da bilimi tasdiqlangan nomzodlarning yopiq aloqa ma'lumotlarini (rozilik asosida) ochish:
              </p>
              <ul class="list-unstyled small" style="line-height:1.95;">
                <li><i class="bi bi-check2-square text-success me-2"></i><b>Yopiq kontaktlarni ochish:</b> nomzodlarning yashirilgan <b>Email va Telefon</b> raqamlarini 30 kunga to'liq ochish</li>
                <li><i class="bi bi-check2-square text-success me-2"></i>Nomzodlarning yozgan dasturiy kodlari va yechimlarini ko'rish</li>
                <li><i class="bi bi-check2-square text-success me-2"></i>Nomzodlarni taqqoslash va to'liq CSV hisobot yuklab olish</li>
              </ul>
            </div>
            <button class="btn btn-success w-100 mt-2 fw-bold text-white" data-pay="💼 HR-Recruiting & TOP Kontaktlar Paketi|190 000 so'm|b2b-hr">
              <i class="bi bi-person-check-fill me-1"></i>HR-Paketga buyurtma berish (190 000 so'm)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 6-YO'L: GRANTLAR, STARTAP INVESTITSIYALAR VA HAMKORLIK (Informational only) -->
    <div class="card-sp card-pad mb-4" style="background:linear-gradient(135deg,#0f172a,#1e1b4b);color:#fff;">
      <div class="row align-items-center g-4">
        <div class="col-lg-8">
          <span class="badge bg-warning text-dark fw-bold mb-2">6-YO'NALISH • STARTAP VA GRANT SALOHIYATI</span>
          <h3 class="text-white fw-bold mb-2">🌱 Startap Ekotizimi, Grantlar va Ta'lim Hamkorligi</h3>
          <p class="text-white-50 small mb-3">
            SkillProve (skillprove.uz) — O'zbekistonda raqamli ta'lim sifatini oshirish va yoshlarni adolatli (meritokratiya asosida) ish bilan ta'minlashga qaratilgan ijtimoiy-texnologik platforma. Loyiha <b>Raqamli Avlod Qizlari</b>, <b>IT Park (Tumaris.Tech)</b> va <b>Yoshlar Ventures</b> dasturlari uchun ishlab chiqilgan.
          </p>
          <div class="d-flex flex-wrap gap-2">
            <span class="badge bg-light bg-opacity-10 border border-light border-opacity-25 px-3 py-2">📈 B2C + B2B Gibrid Biznes-Model</span>
            <span class="badge bg-light bg-opacity-10 border border-light border-opacity-25 px-3 py-2">🛡️ QR-Verifikatsiya va Anti-Cheat</span>
            <span class="badge bg-light bg-opacity-10 border border-light border-opacity-25 px-3 py-2">💻 Avtomatlashtirilgan Code Sandbox</span>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="p-3 rounded-4" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);">
            <div class="small text-warning fw-bold mb-1">Hamkorlik va takliflar uchun:</div>
            <div class="fw-bold mb-1"><i class="bi bi-envelope-fill me-2"></i>info@skillprove.uz</div>
            <div class="small text-white-50"><i class="bi bi-globe me-2"></i>https://skillprove.uz</div>
          </div>
        </div>
      </div>
    </div>

    <!-- BUYURTMA RASMIYLASHTIRISH MODALI -->
    <div id="pay-modal" class="d-none" style="position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,0.72);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;">
      <div class="bg-white rounded-4 p-4 shadow-lg" style="max-width:500px;width:100%;border:2px solid #7c3aed;">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <span class="badge bg-violet text-white mb-1">BUYURTMA RASMIYLASHTIRISH</span>
            <h5 class="fw-bold mb-0 text-navy" id="pm-title">Xizmatni tanlash</h5>
          </div>
          <button type="button" class="btn-close" id="pm-close"></button>
        </div>

        <!-- Step 1: Create Order -->
        <div id="pm-step1">
          <p class="small text-muted mb-3">Buyurtma yaratilgach, sizga maxsus <b>Buyurtma kodi (masalan, SP-1044)</b> beriladi. To'lov tasdiqlangach Admin panel orqali xizmat 30 kunga yoqiladi.</p>
          <form id="pm-form">
            <div class="mb-3">
              <label class="form-label small fw-bold">Ism-familiya yoki Kompaniya / Telefon *</label>
              <input class="form-control" id="pm-contact" required placeholder="Masalan: Jasur Karimov (+998 90 123 45 67)" value="${user ? `${user.first_name || ''} ${user.last_name || ''} (${user.email})`.trim() : ''}">
            </div>
            <button type="submit" class="btn btn-primary w-100 btn-lg fw-bold" id="pm-submit">
              <i class="bi bi-receipt me-2"></i>Buyurtma kodini olish
            </button>
          </form>
        </div>

        <!-- Step 2: Order Created with Code -->
        <div id="pm-step2" class="d-none">
          <div class="alert alert-success py-2 small mb-3">
            <i class="bi bi-check-circle-fill me-1"></i>Buyurtmangiz tizimga kiritildi! Admin panelda <b>To'lovlar</b> bo'limiga tushdi.
          </div>
          <div class="p-3 rounded-4 text-white mb-3" style="background:linear-gradient(135deg,#1e1b4b 0%,#4f46e5 55%,#db2777 100%);">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="small opacity-75">Sizning buyurtma kodingiz:</span>
              <span class="badge bg-warning text-dark font-monospace fs-6" id="pm-code">SP-1044</span>
            </div>
            <div class="small opacity-75">To'lov kartasi (Visa / Humo):</div>
            <div class="fs-6 fw-bold font-monospace mb-1">${card.number}</div>
            <div class="d-flex justify-content-between align-items-center small">
              <span>${card.holder}</span>
              <span class="fw-bold text-warning" id="pm-amount">49 000 so'm</span>
            </div>
          </div>
          <ol class="small ps-3 mb-3" style="line-height:1.75;">
            <li>To'lovni amalga oshirib, chekni va <b id="pm-code-inline">SP-1044</b> kodini Telegram orqali yuboring.</li>
            <li>Administrator <b>To'lovlar (#/admin/payments)</b> sahifasida <b>«Faollashtirish»</b> tugmasini bosishi bilan huquqingiz 30 kunga yoqiladi.</li>
          </ol>
          <div class="d-flex gap-2">
            <a class="btn btn-primary flex-grow-1 fw-bold" href="${card.telegram || 'https://t.me/skillprove_uz'}" target="_blank" rel="noopener"><i class="bi bi-telegram me-1"></i>Telegramga yuborish</a>
            <button type="button" class="btn btn-light-soft" id="pm-done">Yopish</button>
          </div>
        </div>
      </div>
    </div>
  </div>`);

  const $ = (s) => ctx.root.querySelector(s);
  let currentPlan = { title: '', amount: '', key: '' };

  ctx.root.querySelectorAll('[data-pay]').forEach((btn) => {
    btn.onclick = () => {
      const [title, amount, key] = btn.dataset.pay.split('|');
      currentPlan = { title, amount, key };
      $('#pm-title').textContent = `${title} (${amount})`;
      $('#pm-amount').textContent = amount;
      $('#pm-step1').classList.remove('d-none');
      $('#pm-step2').classList.add('d-none');
      $('#pay-modal').classList.remove('d-none');
    };
  });

  const closeModal = async () => {
    $('#pay-modal').classList.add('d-none');
    (await import('../router.js?v=10')).render();
  };
  $('#pm-close').onclick = () => $('#pay-modal').classList.add('d-none');
  $('#pm-done').onclick = closeModal;

  $('#pm-form').onsubmit = (e) => {
    e.preventDefault();
    const contact = $('#pm-contact').value.trim();
    if (!contact) return toast('Aloqa ma\'lumotingizni kiriting', 'warning');
    withBusy($('#pm-submit'), async () => {
      try {
        const ord = await api.post('/orders', {
          plan_key: currentPlan.key,
          plan_title: currentPlan.title,
          amount: currentPlan.amount,
          contact
        });
        $('#pm-code').textContent = ord.code;
        $('#pm-code-inline').textContent = ord.code;
        $('#pm-step1').classList.add('d-none');
        $('#pm-step2').classList.remove('d-none');
        toast(`Buyurtma ${ord.code} yaratildi!`, 'success');
      } catch (err) { toast(err.message, 'error'); }
    });
  };
}
