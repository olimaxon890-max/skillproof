// Mustaqil dasturlash muharriri (mashq rejimi) — kod xavfsiz sandbox'da bajariladi
import { api } from '../api.js';
import { html } from '../ui.js';
import { dash, pageHead } from '../components/layout.js';
import { codeBox, bindCodeBox } from '../components/codeEditor.js';

const SNIPPETS = {
  javascript: `// Kodni yozing va "Ishga tushirish" tugmasini bosing (Ctrl+Enter)
const sonlar = [3, 8, 1, 9, 4];
const yigindi = sonlar.reduce((a, b) => a + b, 0);
console.log("Yig'indi:", yigindi);
console.log("Eng katta:", Math.max(...sonlar));
`,
  python: `# Python faqat Docker sandbox yoqilganda ishlaydi
print("Salom, SkillProof!")
`,
};

export default async function (ctx) {
  const sbx = await api.get('/public/sandbox').catch(() => ({ languages: ['javascript'], mode: 'node-permission' }));
  ctx.render(dash('candidate', html`${pageHead('Dasturlash muharriri', 'Kodingizni xavfsiz sandbox muhitida sinab ko\'ring', html`<span class="chip chip-violet"><i class="bi bi-shield-lock"></i> Sandbox: ${sbx.mode === 'docker' ? 'Docker' : 'Node.js Permission Model'}</span>`)}
    ${codeBox({ id: 'cb', languages: sbx.languages, code: SNIPPETS.javascript, showSubmit: false })}
    <div class="row g-3 mt-3"><div class="col-md-4"><div class="card-sp card-pad small"><b>Cheklovlar</b><div class="text-muted">Bajarilish vaqti ~4 soniya, xotira 64–96 MB, tarmoq va fayl tizimiga kirish taqiqlangan.</div></div></div>
      <div class="col-md-8"><div class="card-sp card-pad small"><b>Maslahat</b><div class="text-muted">Testlardagi kabi <code>function solve(...)</code> yozing va natijani <code>console.log</code> bilan tekshiring. Test savollarida kod avtomatik baholanadi.</div></div></div></div>`));
  const box = ctx.root.querySelector('#cb');
  const ed = bindCodeBox(box, { starter: SNIPPETS.javascript, onRun: (code, language) => api.post('/candidate/playground', { code, language }) });
  box.querySelector('.cb-lang').onchange = (e) => ed.setCode(SNIPPETS[e.target.value] || '');
}

