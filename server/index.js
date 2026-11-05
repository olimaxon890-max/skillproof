// SkillProof server kirish nuqtasi
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { get } = require('./db');

const app = express();
const root = path.join(__dirname, '..');

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '600kb' }));

app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false, message: { error: "Juda ko'p urinish. Keyinroq qayta urinib ko'ring" } }));
app.use('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, limit: 50, message: { error: "Juda ko'p urinish. Keyinroq qayta urinib ko'ring" } }));
app.use('/api/candidate/attempts/:id/run', rateLimit({ windowMs: 60 * 1000, limit: 30, message: { error: "Kodni juda tez-tez ishga tushiryapsiz. Biroz kuting" } }));
app.use('/api/candidate/attempts/:id/submit-code', rateLimit({ windowMs: 60 * 1000, limit: 30, message: { error: "Juda ko'p yuborish. Biroz kuting" } }));
app.use('/api/candidate/playground', rateLimit({ windowMs: 60 * 1000, limit: 30, message: { error: "Kodni juda tez-tez ishga tushiryapsiz. Biroz kuting" } }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/public', require('./routes/public'));
app.use('/api/candidate', require('./routes/candidate'));
app.use('/api/company', require('./routes/company'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', (req, res) => res.status(404).json({ error: 'API manzili topilmadi' }));

app.use('/vendor/bootstrap', express.static(path.join(root, 'node_modules/bootstrap/dist')));
app.use('/vendor/bootstrap-icons', express.static(path.join(root, 'node_modules/bootstrap-icons/font')));
app.use('/vendor/chartjs', express.static(path.join(root, 'node_modules/chart.js/dist')));
app.use(express.static(path.join(root, 'client')));
app.get('*', (req, res) => res.sendFile(path.join(root, 'client/index.html')));

app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Ma\'lumot hajmi juda katta' });
  res.status(500).json({ error: 'Server xatosi. Keyinroq qayta urinib ko\'ring' });
});

// Bo'sh baza bo'lsa demo ma'lumotlar yuklanadi
if (!get('SELECT id FROM users LIMIT 1')) require('./seed').seed();

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`SkillProof ishga tushdi: http://localhost:${PORT}`));
}
module.exports = app;

