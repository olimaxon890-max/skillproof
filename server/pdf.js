// PDF hisobot generatsiyasi (pdfkit)
const PDFDocument = require('pdfkit');
const { VERDICTS } = require('./scoring');

// Standart shrift faqat ASCII/Latin-1 ni qo'llaydi: o'zbek apostroflarini oddiy apostrofga almashtiramiz
const t = (s) => String(s ?? '').replace(/[ʻʼ’‘`´]/g, "'").replace(/[^\x00-\xFF]/g, '?');

function attemptPdf(res, { attempt, job, company, user, techScores, strengths, weaknesses, recommendations }) {
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="skillproof-natija-${attempt.id}.pdf"`);
  doc.pipe(res);
  const navy = '#14235c', violet = '#6d3cf0', gray = '#667085';

  doc.rect(0, 0, 595, 110).fill(navy);
  doc.fillColor('#fff').fontSize(24).font('Helvetica-Bold').text('SkillProof', 48, 34);
  doc.fontSize(11).font('Helvetica').text('Bilim tekshiruvi natijalari hisoboti', 48, 66);
  doc.fontSize(10).text(new Date(attempt.finished_at || Date.now()).toLocaleString('uz-UZ'), 400, 40, { width: 147, align: 'right' });

  doc.fillColor(navy).fontSize(16).font('Helvetica-Bold').text(t(`${user.first_name} ${user.last_name}`), 48, 130);
  doc.fillColor(gray).fontSize(10).font('Helvetica').text(t(`${user.email}${user.phone ? ' | ' + user.phone : ''}`));
  doc.moveDown(0.6).fillColor('#000').fontSize(11).text(t(`Kompaniya: ${company.name}`)).text(t(`Lavozim: ${job.title}`)).text(t(`Minimal ball: ${job.min_score}`));

  doc.roundedRect(400, 125, 147, 70, 10).fill(violet);
  doc.fillColor('#fff').fontSize(30).font('Helvetica-Bold').text(String(Math.round(attempt.total_score)), 400, 137, { width: 147, align: 'center' });
  doc.fontSize(9).font('Helvetica').text('Umumiy ball / 100', 400, 177, { width: 147, align: 'center' });

  doc.fillColor(navy).fontSize(13).font('Helvetica-Bold').text(t(`Xulosa: ${VERDICTS[attempt.verdict] || ''}`), 48, 215);
  doc.fillColor('#000').fontSize(10.5).font('Helvetica').text(t(attempt.summary), { width: 499 });
  doc.moveDown().fontSize(10).text(`To'g'ri javoblar: ${attempt.correct}   Noto'g'ri javoblar: ${attempt.wrong}   Amaliy topshiriqlar: ${attempt.practical_score == null ? '-' : attempt.practical_score + '%'}`);

  doc.moveDown(1).fillColor(navy).fontSize(13).font('Helvetica-Bold').text('Texnologiyalar bo\'yicha ball');
  doc.moveDown(0.4);
  techScores.forEach((s) => {
    const y = doc.y;
    doc.fillColor('#000').fontSize(10).font('Helvetica').text(t(s.name), 48, y, { width: 110 });
    doc.roundedRect(165, y + 2, 250, 9, 4).fill('#e8ebf3');
    doc.roundedRect(165, y + 2, Math.max(4, 2.5 * s.score), 9, 4).fill(s.met === false ? '#f5a524' : '#12b76a');
    doc.fillColor('#000').text(`${s.score}${s.required != null ? ' / talab ' + s.required : ''}`, 425, y, { width: 120 });
    doc.y = y + 20;
  });

  const list = (title, items, color) => {
    if (!items.length) return;
    doc.moveDown(0.6).fillColor(color).fontSize(12).font('Helvetica-Bold').text(title);
    doc.fillColor('#000').fontSize(10).font('Helvetica');
    items.forEach((i) => doc.text('- ' + t(i), { width: 499 }));
  };
  list('Kuchli tomonlari', strengths, '#12b76a');
  list('Kamchiliklari', weaknesses, '#dc6803');
  list('Rivojlantirish tavsiyalari', recommendations, violet);
  if (attempt.decision && attempt.decision !== 'pending') {
    doc.moveDown().fillColor(navy).fontSize(12).font('Helvetica-Bold').text(`Kompaniya qarori: ${attempt.decision === 'hired' ? 'Ishga qabul qilindi' : 'Rad etildi'}`);
    if (attempt.human_score != null) doc.font('Helvetica').fontSize(10).fillColor('#000').text(`Mutaxassis bahosi: ${attempt.human_score}/100`);
  }
  doc.end();
}

module.exports = { attemptPdf };

