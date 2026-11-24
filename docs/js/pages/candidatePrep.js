import { api, session } from '../api.js?v=10';
import { html } from '../ui.js';
import { dash, pageHead } from '../components/layout.js?v=10';

const PREP_BANK = [
  {
    tech: 'JavaScript',
    level: "O'rta / Yuqori",
    free: true,
    q: "Event Loop, Microtasks va Macrotasks qanday ishlaydi?",
    a: "JavaScript bir oqimli (single-threaded) tildir. Call Stack bo'shaganda, Event Loop avval barcha Microtask navbatini (Promise.then, queueMicrotask, MutationObserver) to'liq bajaradi va shundan keyingina bitta Macrotask (setTimeout, setInterval, I/O) ni ishga tushiradi.",
    code: "console.log('1');\nsetTimeout(() => console.log('2 (Macrotask)'), 0);\nPromise.resolve().then(() => console.log('3 (Microtask)'));\nconsole.log('4');\n// Natija: 1, 4, 3, 2"
  },
  {
    tech: 'JavaScript',
    level: "O'rta",
    free: true,
    q: "Closure (Yopilish) nima va amaliyotda qayerda ishlatiladi?",
    a: "Closure — ichki funksiyaning tashqi (ota) funksiya o'zgaruvchilariga, hatto tashqi funksiya o'z ishini yakunlagandan keyin ham murojaat qila olish qobiliyatidir. U ma'lumotlarni inkapsulyatsiya qilish (private state), memoizatsiya va debounce funksiyalarida keng qo'llaniladi.",
    code: "function createCounter() {\n  let count = 0;\n  return () => ++count;\n}\nconst next = createCounter();\nconsole.log(next(), next()); // 1, 2"
  },
  {
    tech: 'React',
    level: "O'rta",
    free: false,
    q: "React'da useMemo va useCallback o'rtasidagi farq nima va qachon ishlatish kerak?",
    a: "useMemo hisob-kitob natijasini (qiymatni) keshlaydi, useCallback esa funksiyaning o'ziga bo'lgan havolani (reference) keshlaydi. Ularni React.memo bilan o'ralgan bola komponentlarga prop uzatishda yoki og'ir massiv filtratsiyalarida keraksiz re-renderlarning oldini olish uchun ishlatish kerak.",
    code: "const filtered = useMemo(() => items.filter(x => x.active), [items]);\nconst onSelect = useCallback((id) => setSelected(id), []);"
  },
  {
    tech: 'React',
    level: "Yuqori",
    free: false,
    q: "Virtual DOM va Reconciliation (Fiber) algoritmi qanday ishlaydi?",
    a: "Holat (state) o'zgarganda React yangi Virtual DOM daraxtini quradi va uni oldingi daraxt bilan O(n) murakkablikdagi Diffing algoritmi orqali solishtiradi. Element turi o'zgarsa daraxt qayta quriladi; ro'yxatlarda esa 'key' atributi orqali qaysi element ko'chirilgani yoki o'zgargani aniqlanadi.",
    code: "// Har doim barqaror ID ni key sifatida bering (index emas):\n{users.map(u => <UserRow key={u.id} user={u} />)}"
  },
  {
    tech: 'HTML5 & CSS3',
    level: "O'rta",
    free: false,
    q: "Critical Rendering Path va Reflow (Layout) vs Repaint farqi nimada?",
    a: "Reflow — elementlarning o'lchami yoki joylashuvi (width, height, top, font-size) o'zgarganda brauzer butun sahifa geometriyasini qayta hisoblashidir (eng qimmat operatsiya). Repaint esa faqat rang yoki soya o'zgarganda yuz beradi. Animatsiyalarda Reflow chaqirmaslik uchun 'transform' va 'opacity' ishlatiladi.",
    code: "/* Yomon (Reflow chaqiradi): */\n.box { left: 100px; }\n/* Yaxshi (GPU Composite qatlamida ishlaydi): */\n.box { transform: translate3d(100px, 0, 0); }"
  },
  {
    tech: 'Node.js & SQL',
    level: "Yuqori",
    free: false,
    q: "SQL Injection nima va ma'lumotlar bazasi indekslari (B-Tree Index) qanday tezlik beradi?",
    a: "SQL Injection — foydalanuvchi kiritgan matnni to'g'ridan-to'g'ri SQL so'roviga qo'shish oqibatida bazani buzish xavfidir. Himoya uchun har doim Parameterized Queries (?) ishlatiladi. B-Tree indeks esa jadvaldagi qidiruvni O(N) to'liq skanerlashdan O(log N) binar qidiruv tezligiga olib chiqadi.",
    code: "// Xavfsiz Parameterized Query:\nconst user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);"
  },
  {
    tech: 'Algoritmlar',
    level: "O'rta",
    free: false,
    q: "Two Sum / Ikki ko'rsatkich (Hash Map vs Brute Force) vaqt murakkabligini tushuntiring.",
    a: "Ichma-ich ikki sikl (Brute Force) O(n²) vaqt oladi. Hash Map (Map obyekti) yordamida har bir elementning qo'shimchasini (target - nums[i]) saqlab borsak, masalani bir marta aylanishda — O(n) vaqt va O(n) xotira bilan yechamiz.",
    code: "function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    if (seen.has(need)) return [seen.get(need), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}"
  }
];

export default async function (ctx) {
  const p = await api.get('/candidate/profile').catch(() => session.user || {});
  const isPro = !!(p?.is_pro || session.user?.is_pro);
  let activeTech = 'Barchasi';

  function draw() {
    if (!ctx.isCurrent()) return;
    const techs = ['Barchasi', ...new Set(PREP_BANK.map((x) => x.tech))];
    const list = PREP_BANK.filter((x) => activeTech === 'Barchasi' || x.tech === activeTech);

    ctx.render(dash('candidate', html`
      ${pageHead(
        "Intervyuga tayyorgarlik",
        "Texnik suhbat va amaliy sinovlarga tayyorlanish uchun tanlangan savollar, arxitektura tushuntirishlari va kod namunalari",
        isPro
          ? html`<span class="badge bg-warning text-dark px-3 py-2 fs-6"><i class="bi bi-star-fill me-1"></i>⭐ PRO Faol — Barcha savollar ochiq</span>`
          : html`<a href="#/pricing" class="btn btn-violet fw-bold"><i class="bi bi-gem me-1"></i>⭐ PRO yoqish (49 000 so'm/oy)</a>`
      )}

      <div class="d-flex flex-wrap gap-2 mb-4">
        ${techs.map((t) => html`
          <button class="btn btn-sm ${activeTech === t ? 'btn-primary' : 'btn-light-soft'} fw-bold" data-t="${t}">${t}</button>
        `)}
      </div>

      <div class="d-flex flex-column gap-3">
        ${list.map((item, idx) => {
          const unlocked = isPro || item.free;
          return html`
            <div class="card-sp card-pad" style="${unlocked ? '' : 'border:1.5px dashed #c4b5fd;background:#faf8ff;'}">
              <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                <div>
                  <span class="chip chip-violet me-1">${item.tech}</span>
                  <span class="chip">${item.level}</span>
                </div>
                ${unlocked
                  ? html`<span class="badge bg-success-subtle text-success"><i class="bi bi-unlock-fill me-1"></i>Ochiq</span>`
                  : html`<span class="badge bg-warning text-dark"><i class="bi bi-lock-fill me-1"></i>⭐ PRO uchun</span>`}
              </div>
              <h5 class="fw-bold text-navy mb-2">${idx + 1}. ${item.q}</h5>
              ${unlocked ? html`
                <p class="text-muted mb-2" style="line-height:1.65;">${item.a}</p>
                <pre class="q-code mb-0">${item.code}</pre>
              ` : html`
                <div class="p-3 rounded-3 bg-white border d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <span class="small text-muted"><i class="bi bi-lock-fill text-violet me-1"></i>Batafsil tushuntirish va kod namunasini ko'rish uchun <b>⭐ PRO Nomzod</b> tarifini faollashtiring.</span>
                  <a href="#/pricing" class="btn btn-sm btn-violet fw-bold">⭐ PRO bilan ochish</a>
                </div>
              `}
            </div>
          `;
        })}
      </div>
    `));

    ctx.root.querySelectorAll('[data-t]').forEach((b) => {
      b.onclick = () => { activeTech = b.dataset.t; draw(); };
    });
  }

  draw();
}
