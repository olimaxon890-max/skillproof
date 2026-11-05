// Kod bajarish sandbox'i.
// 1-usul (tavsiya): Docker — tarmoqsiz, xotira/CPU cheklangan, faqat o'qish rejimidagi konteyner.
// 2-usul (zaxira): Node.js Permission Model — alohida jarayon, fayl tizimi (faqat vaqtinchalik papka o'qish),
//   tarmoq, child_process va worker taqiqlangan, vaqt va xotira cheklovi bor.
// Foydalanuvchi kodi hech qachon asosiy server jarayonida bajarilmaydi.
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const TIMEOUT_MS = Number(process.env.SANDBOX_TIMEOUT_MS || 4000);
const MAX_OUT = 20000;
const MAX_CODE = 20000;

let dockerOk = null;
const hasDocker = () => {
  if (process.env.SANDBOX_MODE === 'node') return false;
  if (dockerOk === null) {
    try { dockerOk = spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], { timeout: 4000 }).status === 0; } catch { dockerOk = false; }
  }
  return dockerOk;
};

const RUNNER_JS = `
'use strict';
const nonce = process.argv[2]; const dir = process.argv[3];
process.argv.length = 2;
const fs = require('fs');
const out = process.stdout.write.bind(process.stdout);
const code = fs.readFileSync(dir + '/solution.js', 'utf8');
const tests = JSON.parse(fs.readFileSync(dir + '/tests.json', 'utf8'));
const logs = [];
const fmt = (a) => a.map((x) => typeof x === 'string' ? x : (() => { try { return JSON.stringify(x); } catch { return String(x); } })()).join(' ');
console.log = (...a) => { if (logs.join('\\n').length < 4000) logs.push(fmt(a)); };
console.error = console.warn = console.info = console.log;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const results = [];
let fn;
try { fn = new Function(code + '\\n;return typeof solve === "function" ? solve : undefined;')(); }
catch (e) { out('\\n' + nonce + JSON.stringify({ fatal: String(e && e.message || e), logs }) + '\\n'); process.exit(0); }
if (!fn && tests.length === 1 && tests[0].play) { out('\\n' + nonce + JSON.stringify({ results: [], play: true, logs }) + '\\n'); process.exit(0); }
if (!fn) { out('\\n' + nonce + JSON.stringify({ fatal: "solve nomli funksiya topilmadi. 'function solve(...) {...}' yozing.", logs }) + '\\n'); process.exit(0); }
for (const t of tests) {
  try {
    const r = fn(...JSON.parse(JSON.stringify(t.args)));
    results.push({ ok: eq(r, t.expected), got: r === undefined ? 'undefined' : r });
  } catch (e) { results.push({ ok: false, error: String(e && e.message || e) }); }
}
out('\\n' + nonce + JSON.stringify({ results, logs }) + '\\n');
process.exit(0);
`;

const RUNNER_PY = `
import sys, json
nonce = sys.argv[1]
code = open('/work/solution.py').read()
tests = json.load(open('/work/tests.json'))
ns = {}
res = []
try:
    exec(code, ns)
    fn = ns.get('solve')
    if not callable(fn):
        if tests and tests[0].get('play'):
            print('\\n' + nonce + json.dumps({'results': [], 'play': True, 'logs': []})); sys.exit(0)
        raise Exception("solve nomli funksiya topilmadi")
except Exception as e:
    print('\\n' + nonce + json.dumps({'fatal': str(e), 'logs': []})); sys.exit(0)
for t in tests:
    try:
        r = fn(*t['args'])
        res.append({'ok': r == t['expected'], 'got': r})
    except Exception as e:
        res.append({'ok': False, 'error': str(e)})
print('\\n' + nonce + json.dumps({'results': res, 'logs': []}, default=str))
`;

function info() {
  const docker = hasDocker();
  return { mode: docker ? 'docker' : 'node-permission', languages: docker ? ['javascript', 'python'] : ['javascript'] };
}

function execute(cmd, args, timeout) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, env: { PATH: process.env.PATH } });
    let out = '', err = '', killed = false;
    const timer = setTimeout(() => { killed = true; p.kill('SIGKILL'); }, timeout);
    p.stdout.on('data', (d) => { if (out.length < MAX_OUT * 3) out += d; });
    p.stderr.on('data', (d) => { if (err.length < MAX_OUT) err += d; });
    p.on('error', (e) => { clearTimeout(timer); resolve({ out, err: String(e.message), killed }); });
    p.on('close', () => { clearTimeout(timer); resolve({ out, err, killed }); });
  });
}

/**
 * @param {{code:string, language:string, tests:Array<{args:any[],expected:any,hidden?:boolean}>}} opts
 * Qaytaradi: { ok, passed, total, cases:[...], logs, error, mode }
 */
async function runTests({ code, language = 'javascript', tests }) {
  const lang = language === 'python' ? 'python' : 'javascript';
  const mode = hasDocker() ? 'docker' : 'node-permission';
  if (typeof code !== 'string' || !code.trim()) return { ok: false, error: "Kod bo'sh", passed: 0, total: tests.length, cases: [], mode };
  if (code.length > MAX_CODE) return { ok: false, error: 'Kod juda uzun', passed: 0, total: tests.length, cases: [], mode };
  if (lang === 'python' && mode !== 'docker') return { ok: false, error: "Python faqat Docker sandbox yoqilganda ishlaydi", passed: 0, total: tests.length, cases: [], mode };

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sp-'));
  const nonce = 'SP_' + crypto.randomBytes(12).toString('hex');
  try {
    fs.writeFileSync(path.join(dir, 'solution.' + (lang === 'python' ? 'py' : 'js'), ), code);
    fs.writeFileSync(path.join(dir, 'tests.json'), JSON.stringify(tests.map(({ args, expected, play }) => ({ args, expected, play }))));
    fs.writeFileSync(path.join(dir, lang === 'python' ? 'runner.py' : 'runner.js'), lang === 'python' ? RUNNER_PY : RUNNER_JS);

    let res;
    if (mode === 'docker') {
      const base = ['run', '--rm', '--network', 'none', '--memory', '96m', '--cpus', '0.5', '--pids-limit', '64', '--read-only',
        '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '-v', `${dir}:/work:ro`];
      const args = lang === 'python'
        ? [...base, 'python:3.12-alpine', 'python', '/work/runner.py', nonce]
        : [...base, 'node:22-alpine', 'node', '/work/runner.js', nonce, '/work'];
      res = await execute('docker', args, TIMEOUT_MS + 8000);
    } else {
      const d = dir.replace(/\\/g, '/');
      res = await execute(process.execPath, ['--permission', `--allow-fs-read=${dir}`, '--max-old-space-size=64', '--stack-size=900',
        path.join(dir, 'runner.js'), nonce, d], TIMEOUT_MS);
    }
    if (res.killed) return { ok: false, error: 'Vaqt tugadi: kod juda sekin ishlayapti yoki cheksiz tsikl mavjud', passed: 0, total: tests.length, cases: [], mode };
    const idx = res.out.lastIndexOf(nonce);
    if (idx < 0) {
      const msg = (res.err || res.out || 'Noma\'lum xato').split('\n').filter((l) => l.trim() && !l.includes('node:internal')).slice(0, 4).join('\n');
      return { ok: false, error: 'Bajarishda xatolik: ' + msg.slice(0, 600), passed: 0, total: tests.length, cases: [], mode };
    }
    const data = JSON.parse(res.out.slice(idx + nonce.length));
    if (data.fatal) return { ok: false, error: data.fatal, logs: data.logs, passed: 0, total: tests.length, cases: [], mode };
    if (data.play) return { ok: true, play: true, passed: 0, total: 0, cases: [], logs: (data.logs && data.logs.length) ? data.logs : res.out.slice(0, idx).trim().split('\n').filter(Boolean), mode };
    const cases = tests.map((t, i) => {
      const r = data.results[i] || { ok: false };
      return t.hidden
        ? { index: i + 1, hidden: true, ok: r.ok }
        : { index: i + 1, ok: r.ok, args: t.args, expected: t.expected, got: r.got, error: r.error };
    });
    const passed = cases.filter((c) => c.ok).length;
    return { ok: passed === tests.length, passed, total: tests.length, cases, logs: data.logs || [], mode };
  } catch (e) {
    return { ok: false, error: 'Sandbox xatosi: ' + e.message, passed: 0, total: tests.length, cases: [], mode };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

module.exports = { runTests, info };
