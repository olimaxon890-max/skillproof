// SkillProve loyihasini bevosita GitHub API orqali repozitoriyga yuklash va
// GitHub Pages (skillprove.uz) domenini avtomatik yoqish skripti
const fs = require('fs');
const path = require('path');
const https = require('https');

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

function ghOnce(token, method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? Buffer.from(JSON.stringify(body), 'utf8') : null;
    const req = https.request(
      {
        hostname: 'api.github.com',
        port: 443,
        path: urlPath,
        method,
        family: 4,
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'SkillProve-Deployer',
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': payload.length } : {}),
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let data = {};
          try { data = JSON.parse(text); } catch {}
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data });
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Request timeout')));
    if (payload) req.write(payload);
    req.end();
  });
}

async function gh(token, method, urlPath, body) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await ghOnce(token, method, urlPath, body);
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
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
  fs.writeFileSync(path.join(docsDir, 'CNAME'), 'skillprove.uz\n');

  const me = await gh(token, 'GET', '/user');
  if (!me.ok) { console.error('Xato:', me.data.message); process.exit(1); }
  const owner = me.data.login;
  console.log(`✔ GitHub foydalanuvchisi: ${owner}`);

  let repo = await gh(token, 'GET', `/repos/${owner}/${repoName}`);
  if (!repo.ok) {
    repo = await gh(token, 'POST', '/user/repos', {
      name: repoName,
      description: 'SkillProve — Zamonaviy bilimni tekshirish va ishga qabul qilish platformasi',
      homepage: 'https://skillprove.uz',
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
  // 8 tadan parallel yuklash
  for (let i = 0; i < files.length; i += 8) {
    const batch = files.slice(i, i + 8);
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
    message: 'Deploy SkillProve platform & connect skillprove.uz custom domain',
    tree: newTree.data.sha,
    parents: baseSha ? [baseSha] : [],
  });
  await gh(token, 'PATCH', `/repos/${owner}/${repoName}/git/refs/heads/${branch}`, {
    sha: commit.data.sha,
    force: true,
  });

  const pg = await gh(token, 'POST', `/repos/${owner}/${repoName}/pages`, {
    cname: 'skillprove.uz',
    source: { branch, path: '/docs' },
  });
  if (!pg.ok && pg.status === 409) {
    const putRes = await gh(token, 'PUT', `/repos/${owner}/${repoName}/pages`, {
      cname: 'skillprove.uz',
      source: { branch, path: '/docs' },
    });
    console.log('Pages PUT status:', putRes.status, putRes.data);
  }

  console.log('\n============================================================');
  console.log('🎉 MUVAFFAQIYATLI YUKLANDI!');
  console.log(`📦 GitHub Repozitoriy: https://github.com/${owner}/${repoName}`);
  console.log(`🌐 Rasmiy Sayt Domeni: http://skillprove.uz`);
  console.log('============================================================\n');
}

main().catch((e) => {
  console.error('Xatolik:', e.message);
  process.exit(1);
});
