// GitHub Pages (statik hosting) uchun build skripti:
// node_modules dan kerakli vendor fayllarni client/vendor ichiga nusxalaydi
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const copies = [
  ['node_modules/bootstrap/dist', 'client/vendor/bootstrap'],
  ['node_modules/bootstrap-icons/font', 'client/vendor/bootstrap-icons'],
  ['node_modules/chart.js/dist', 'client/vendor/chartjs'],
];

for (const [src, dst] of copies) {
  const s = path.join(root, src);
  const d = path.join(root, dst);
  if (fs.existsSync(s)) {
    fs.cpSync(s, d, { recursive: true, force: true });
  }
}
fs.writeFileSync(path.join(root, 'client/.nojekyll'), '');
console.log('Static vendor files copied to client/vendor for GitHub Pages.');

