// Ma'lumotlar bazasi (SQLite, Node.js ichki `node:sqlite` moduli) va yordamchi funksiyalar
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'skillproof.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, icon TEXT DEFAULT 'bi-code-slash', description TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS technologies (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL);
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT UNIQUE, logo TEXT DEFAULT '', description TEXT DEFAULT '',
  industry TEXT DEFAULT '', website TEXT DEFAULT '', city TEXT DEFAULT '', size TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL,
  first_name TEXT DEFAULT '', last_name TEXT DEFAULT '', phone TEXT DEFAULT '', city TEXT DEFAULT '',
  direction TEXT DEFAULT '', bio TEXT DEFAULT '', skills TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'active',
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL, category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL, description TEXT DEFAULT '',
  salary TEXT DEFAULT '', employment TEXT DEFAULT 'To''liq stavka', min_score INTEGER DEFAULT 70, duration_min INTEGER DEFAULT 30,
  questions_per_tech INTEGER DEFAULT 4, status TEXT DEFAULT 'open', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS job_requirements (
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE, technology_id INTEGER NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
  min_score INTEGER NOT NULL DEFAULT 60, PRIMARY KEY (job_id, technology_id));
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY, company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE, job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  technology_id INTEGER REFERENCES technologies(id) ON DELETE CASCADE, type TEXT NOT NULL, text TEXT NOT NULL, code TEXT DEFAULT '',
  options TEXT DEFAULT '[]', answer TEXT DEFAULT '', explanation TEXT DEFAULT '', language TEXT DEFAULT 'javascript',
  starter TEXT DEFAULT '', tests TEXT DEFAULT '[]', points INTEGER DEFAULT 1, difficulty TEXT DEFAULT 'o''rta', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL, status TEXT DEFAULT 'in_progress', question_ids TEXT DEFAULT '[]',
  started_at TEXT DEFAULT CURRENT_TIMESTAMP, deadline TEXT, finished_at TEXT,
  total_score REAL DEFAULT 0, tech_scores TEXT DEFAULT '[]', correct INTEGER DEFAULT 0, wrong INTEGER DEFAULT 0, practical_score REAL,
  verdict TEXT DEFAULT '', summary TEXT DEFAULT '', strengths TEXT DEFAULT '[]', weaknesses TEXT DEFAULT '[]', recommendations TEXT DEFAULT '[]',
  decision TEXT DEFAULT 'pending', human_score INTEGER, company_note TEXT DEFAULT '', decided_at TEXT);
CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY, attempt_id INTEGER NOT NULL REFERENCES attempts(id) ON DELETE CASCADE, question_id INTEGER NOT NULL,
  response TEXT DEFAULT '', score REAL DEFAULT 0, detail TEXT DEFAULT '', UNIQUE(attempt_id, question_id));
CREATE TABLE IF NOT EXISTS activity (id INTEGER PRIMARY KEY, user_id INTEGER, action TEXT, details TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_attempts_company ON attempts(company_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
`);

const all = (sql, ...p) => db.prepare(sql).all(...p);
const get = (sql, ...p) => db.prepare(sql).get(...p);
const run = (sql, ...p) => {
  const r = db.prepare(sql).run(...p);
  return { id: Number(r.lastInsertRowid), changes: Number(r.changes) };
};
const tx = (fn) => {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
};
const log = (userId, action, details = '') => run('INSERT INTO activity (user_id, action, details) VALUES (?,?,?)', userId || null, action, details);
const j = (s, d = null) => { try { return JSON.parse(s); } catch { return d; } };

module.exports = { db, all, get, run, tx, log, j };

