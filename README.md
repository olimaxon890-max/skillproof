# SkillProof — Zamonaviy bilimni tekshirish va ishga qabul qilish platformasi

**SkillProof** — bu nomzodlarning CV/Resume'dagi so'zlariga emas, balki haqiqiy amaliy va nazariy bilimlariga asoslanib baholovchi ko'p kompaniyali (**Multi-Tenant**) SaaS platformasi. Saytning barcha interfeyslari, test savollari, baholash xulosalari va hisobotlari to'liq **o'zbek tilida** ishlab chiqilgan.

---

## 1. Loyiha arxitekturasi va papkalar strukturasi

```
skillproof/
├── package.json                 # Loyiha konfiguratsiyasi va skriptlar
├── README.md                    # Qo'llanma va hujjatlar
├── data/
│   └── skillproof.db            # SQLite ma'lumotlar bazasi (avtomatik yaratiladi)
├── server/
│   ├── index.js                 # Express server, xavfsizlik (Helmet, Rate-Limit) va statik marshrutlar
│   ├── db.js                    # SQLite (node:sqlite) jadvallari va tranzaksiya yordamchilari
│   ├── middleware.js            # JWT autentifikatsiya, RBAC rollar va Multi-Tenant izolyatsiyasi
│   ├── scoring.js               # 0–100 baholash algoritmi, talablar bilan solishtirish va xulosa generatori
│   ├── sandbox.js               # Xavfsiz kod bajarish sandbox'i (Docker yoki Node Permission Model)
│   ├── pdf.js                   # PDFKit yordamida natija sertifikati/hisobotini generatsiya qilish
│   ├── seed.js                  # Demo ma'lumotlar: 9 kasb, 38 texnologiya, 65+ savol, 6 kompaniya
│   ├── selftest.js              # Barcha API, xavfsizlik va sandbox funksiyalarini avtomatik tekshirish
│   └── routes/
│       ├── auth.js              # Ro'yxatdan o'tish, tizimga kirish, sessiya (/api/auth)
│       ├── public.js            # Ommaviy kompaniyalar, vakansiyalar, statistika (/api/public)
│       ├── candidate.js         # Nomzod paneli, test topshirish, sandbox, PDF (/api/candidate)
│       ├── company.js           # Kompaniya paneli, vakansiyalar, savollar, qarorlar (/api/company)
│       └── admin.js             # Super Admin paneli, tasdiqlash/bloklash, katalog (/api/admin)
└── client/
    ├── index.html               # SPA asosiy sahifasi
    ├── css/
    │   └── main.css             # Kompilyatsiya qilingan SCSS uslublar (Bootstrap 5 + Custom SaaS UI)
    ├── scss/
    │   ├── main.scss            # Asosiy SCSS kirish fayli
    │   ├── _variables.scss      # Ranglar (to'q ko'k #14235c, binafsha #7c3aed, yashil, sariq)
    │   ├── _base.scss           # Tipografiya, tugmalar, formalar
    │   ├── _layout.scss         # Navbar, Footer, Dashboard sidebar
    │   ├── _components.scss     # Kartalar, ball halqasi, skeleton loading, toast xabarlar
    │   ├── _pages.scss          # Hero, autentifikatsiya, natija bannerlari
    │   └── _editor.scss         # Qorong'u mavzuli maxsus Code Editor uslublari
    └── js/
        ├── app.js               # Ilova boshlanishi
        ├── router.js            # Hash-router, rol tekshiruvi
        ├── api.js               # Fetch API mijozi (JWT va fayl yuklab olish bilan)
        ├── ui.js                # XSS-xavfsiz html shablonlar, Chart.js, Modal, Toast
        ├── components/
        │   ├── layout.js        # Navbar, Footer, Dashboard qobig'i
        │   ├── cards.js         # Kompaniya va vakansiya kartalari
        │   ├── codeEditor.js    # Maxsus Code Editor (qator raqamlari, Tab, Ctrl+Enter, konsol)
        │   └── resultView.js    # 0–100 natija, radar diagramma, kuchli/zaif tomonlar
        └── pages/
            ├── home.js          # Bosh sahifa (Hero, Qanday ishlaydi, Nega SkillProof, FAQ va b.)
            ├── companies.js     # Kompaniyalar ro'yxati va qidiruv
            ├── companyDetail.js # Kompaniya haqida batafsil sahifa
            ├── jobs.js          # Ish o'rinlari sahifasi va filtrlar
            ├── jobDetail.js     # Lavozim talablari va testni boshlash
            ├── auth.js          # Kirish va Ro'yxatdan o'tish (Nomzod / Kompaniya)
            ├── candidateDashboard.js # Nomzod dashboard
            ├── candidateHistory.js   # Oldingi testlar tarixi
            ├── candidateProfile.js   # Nomzod shaxsiy profili
            ├── test.js          # Test topshirish sahifasi (taymer, 6 xil savol turi, Code Editor)
            ├── result.js        # Test natijalari sahifasi va PDF yuklab olish
            ├── editor.js        # Mustaqil Dasturlash muharriri (mashq rejimi)
            ├── companyDashboard.js   # Kompaniya dashboard va analitika
            ├── companyJobs.js   # Kompaniya ish o'rinlarini yaratish va boshqarish
            ├── companyTests.js  # Kompaniya test savollari va kod masalalarini yaratish
            ├── companyCandidates.js  # Nomzodlarni saralash, solishtirish va CSV yuklab olish
            ├── companyCandidate.js   # Nomzod natijasi va ishga qabul qilish / rad etish qarori
            ├── companySettings.js    # Kompaniya profili va logotip sozlamalari
            ├── adminDashboard.js     # Super Admin umumiy statistika va faoliyat jurnali
            ├── adminCompanies.js     # Kompaniyalarni tasdiqlash va bloklash
            ├── adminUsers.js         # Foydalanuvchilarni boshqarish
            └── adminCatalog.js       # Kasblar (kategoriyalar) va texnologiyalarni boshqarish
```

---

## 2. Loyihani ishga tushirish

### Talablar
- **Node.js** `v22.5+` (yoki `v24+` / `v26+` — ichki `node:sqlite` va `--permission` sandbox rejimi uchun)
- Ixtiyoriy: **Docker** (agar o'rnatilgan bo'lsa, sandbox avtomatik ravishda Docker konteyneridan foydalanadi va Python tilini ham qo'llab-quvvatlaydi)

### Qadamlar

```bash
# 1. Loyiha papkasiga o'tish
cd skillproof

# 2. Paketlarni o'rnatish
npm install

# 3. (Ixtiyoriy) Boshlang'ich demo ma'lumotlarni qayta yuklash
npm run seed

# 4. (Ixtiyoriy) SCSS uslublarini qayta yig'ish
npm run build:css

# 5. Avtomatik tizim testlarini ishga tushirish
npm test

# 6. Serverni ishga tushirish
npm start
```

Server ishga tushgach brauzerda oching: **http://localhost:3000**

---

## 3. Demo hisoblar (Kirish sahifasida bir tugma bilan to'ldiriladi)

| Rol | Email | Parol | Imkoniyatlar |
| :--- | :--- | :--- | :--- |
| **Ish izlovchi (Nomzod)** | `nomzod@demo.uz` | `Demo1234!` | Kompaniya va lavozim tanlash, test va kod topshirish, 0–100 tahlil, PDF yuklab olish |
| **Kompaniya (Google Developer Team)** | `hr@google-dev.uz` | `Demo1234!` | Vakansiya va minimal ball belgilash, savollar qo'shish, nomzodlarni solishtirish, qabul/rad etish |
| **Kompaniya (Nova Soft)** | `hr@nova-soft.uz` | `Demo1234!` | Multi-tenant izolyatsiyasini tekshirish uchun ikkinchi mustaqil kompaniya |
| **Super Admin** | `admin@skillproof.uz` | `Admin123!` | Kompaniyalarni tasdiqlash/bloklash, foydalanuvchilar, kasb va texnologiyalar katalogi |

---

## 4. Xavfsizlik va Sandbox arxitekturasi

- **JWT va RBAC**: Har bir himoyalangan so'rovda token va foydalanuvchining bazadagi joriy holati (`active` / `blocked`) tekshiriladi.
- **Multi-Tenant izolyatsiya**: Kompaniya xodimi faqat o'zining `company_id` identifikatoriga tegishli vakansiyalar, savollar va nomzod natijalarini ko'ra oladi.
- **Test javoblarini himoyalash**: Test davomida mijozga (`client`) to'g'ri javoblar va yashirin test case'lar yuborilmaydi.
- **Izolyatsiyalangan Code Sandbox (`server/sandbox.js`)**:
  1. **Docker rejimi** (agar Docker mavjud bo'lsa): `--network none --read-only --memory 96m --cpus 0.5 --pids-limit 64 --cap-drop ALL`.
  2. **Node.js Permission Model rejimi** (Docker bo'lmaganda avtomatik): alohida child process `--permission --allow-fs-read=<temp_dir> --max-old-space-size=64` bayroqlari bilan ishga tushiriladi — fayl tizimiga yozish, begona fayllarni o'qish, tarmoq (`fetch`/`http`), `child_process` va `worker_threads` to'liq bloklangan hamda 4 soniyalik qat'iy taymer o'rnatilgan.
