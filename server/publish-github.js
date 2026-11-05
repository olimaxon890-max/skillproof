// SkillProof loyihasini bevosita GitHub API orqali repozitoriyga yuklash va
// GitHub Pages (*.github.io) bepul domenini avtomatik yoqish skripti
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const IGNORE = new Set(['node_modules', 'data', '.git', '.env', 'docs', 'vendor', '.github']);

function walk(dir, base = '') {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(ent.name)) continue;
    const rel = base ? `${base}/${ent.name}` : ent.name;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(full, rel));
    else out.push({ rel, full });
  }
  return out;
}

async function gh(token, method, url, body) {
  const res = await fetch(`https://api.github.com${url}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'SkillProof-Deployer',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  const token = process.env.GITHUB_TOKEN || process.argv[2];
  const repoName = process.env.GITHUB_REPO || process.argv[3] || 'skillproof';
  if (!token) process.exit(1);

  const docsDir = path.join(root, 'docs');
  fs.rmSync(docsDir, { recursive: true, force: true });
  fs.cpSync(path.join(root, 'client'), docsDir, { recursive: true, force: true });
  fs.rmSync(path.join(docsDir, 'vendor'), { recursive: true, force: true });
  // docs/index.html da CDN linklariga almashtiramiz — tez va yengil!
  let idx = fs.readFileSync(path.join(docsDir, 'index.html'), 'utf8');
  idx = idx
    .replace('vendor/bootstrap-icons/bootstrap-icons.min.css', 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css')
    .replace('vendor/bootstrap/js/bootstrap.bundle.min.js', 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js')
    .replace('vendor/chartjs/chart.umd.js', 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.js');
  fs.writeFileSync(path.join(docsDir, 'index.html'), idx);
  fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');

  const me = await gh(token, 'GET', '/user');
  if (!me.ok) { console.error('Xato:', me.data.message); process.exit(1); }
  const owner = me.data.login;
  console.log(`✔ GitHub foydalanuvchisi: ${owner}`);

  let repo = await gh(token, 'GET', `/repos/${owner}/${repoName}`);
  if (!repo.ok) {
    repo = await gh(token, 'POST', '/user/repos', {
      name: repoName,
      description: 'SkillProof — Zamonaviy bilimni tekshirish va ishga qabul qilish platformasi',
      homepage: `https://${owner}.github.io/${repoName}/`,
      private: false,
      auto_init: true,
    });
    await new Promise((r) => setTimeout(r, 2000));
  }

  const branch = repo.data.default_branch || 'main';
  const ref = await gh(token, 'GET', `/repos/${owner}/${repoName}/git/ref/heads/${branch}`);
  const baseSha = ref.ok ? ref.data.object.sha : null;

  const files = [...walk(root), ...walk(docsDir, 'docs')];
  console.log(`→ ${files.length} ta fayl parallel yuklanmoqda...`);

  const tree = [];
  // 10 tadan parallel yuklash
  for (let i = 0; i < files.length; i += 10) {
    const batch = files.slice(i, i + 10);
    const res = await Promise.all(
      batch.map(async (f) => {
        const content = fs.readFileSync(f.full).toString('base64');
        const blob = await gh(token, 'POST', `/repos/${owner}/${repoName}/git/blobs`, { content, encoding: 'base64' });
        if (!blob.ok) throw new Error(`${f.rel}: ${blob.data.message}`);
        return { path: f.rel, mode: '100644', type: 'blob', sha: blob.data.sha };
      })
    );
    tree.push(...res);
  }

  const newTree = await gh(token, 'POST', `/repos/${owner}/${repoName}/git/trees`, { tree });
  const commit = await gh(token, 'POST', `/repos/${owner}/${repoName}/git/commits`, {
    message: 'Deploy SkillProof full-stack platform & GitHub Pages',
    tree: newTree.data.sha,
    parents: baseSha ? [baseSha] : [],
  });
  await gh(token, 'PATCH', `/repos/${owner}/${repoName}/git/refs/heads/${branch}`, {
    sha: commit.data.sha,
    force: true,
  });

  const pg = await gh(token, 'POST', `/repos/${owner}/${repoName}/pages`, {
    source: { branch, path: '/docs' },
  });
  if (!pg.ok && pg.status === 409) {
    await gh(token, 'PUT', `/repos/${owner}/${repoName}/pages`, {
      source: { branch, path: '/docs' },
    });
  }

  console.log('\n============================================================');
  console.log('🎉 MUVAFFAQIYATLI YUKLANDI!');
  console.log(`📦 GitHub Repozitoriy: https://github.com/${owner}/${repoName}`);
  console.log(`🌐 Bepul Sayt Silkasi (Domen): https://${owner}.github.io/${repoName}/`);
  console.log('============================================================\n');
}

main().catch((e) => {
  console.error('Xatolik:', e.message);
  process.exit(1);
});
