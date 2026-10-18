/* SaludPlus v23 · pantalla «Exámenes» en Reportes + PDF
   El PDF se genera dentro de la app (sin librerías externas ni servidor): funciona sin conexión. */
'use strict';

/* ---------- Generador mínimo de PDF (A4, Helvetica) ---------- */
const PDF_W = { r: [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 761, 556, 600, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 600, 611, 600, 600, 222, 222, 333, 333, 350, 556, 1000, 333, 1000, 500, 333, 944, 600, 500, 667, 278, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 556, 537, 278, 333, 333, 365, 556, 834, 834, 834, 611, 667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278, 556, 556, 556, 556, 556, 556, 556, 584, 611, 556, 556, 556, 556, 500, 556, 500], b: [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 761, 556, 600, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 600, 611, 600, 600, 278, 278, 500, 500, 350, 556, 1000, 333, 1000, 556, 333, 944, 600, 500, 667, 278, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 611, 556, 278, 333, 333, 365, 556, 834, 834, 834, 611, 722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278, 611, 611, 611, 611, 611, 611, 611, 584, 611, 611, 611, 611, 611, 556, 611, 556] };
const PDF_BRAND = [0.03, 0.47, 0.79], PDF_INK = [0.05, 0.17, 0.24], PDF_MUTED = [0.33, 0.44, 0.51], PDF_OK = [0.12, 0.48, 0.27], PDF_BAD = [0.71, 0.14, 0.09], PDF_LINE = [0.85, 0.9, 0.93], PDF_SOFT = [0.93, 0.96, 0.98];
const WIN = { '–': 0x96, '—': 0x97, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '€': 0x80 };
function pdfClean(s) {
  return String(s ?? '').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/[♂]/g, () => (currentLang === 'en' ? 'M' : 'H')).replace(/[♀]/g, () => (currentLang === 'en' ? 'F' : 'M')).replace(/[✓✔]/g, 'OK').replace(/\s+/g, ' ').trim();
}
const pdfCode = (ch) => { const c = ch.charCodeAt(0); if (WIN[ch]) return WIN[ch]; return c < 256 ? c : 63; };
const pdfTw = (s, size, bold) => { let w = 0; for (const ch of s) { const c = pdfCode(ch); w += (PDF_W[bold ? 'b' : 'r'][c - 32] ?? 556); } return w * size / 1000; };
const pdfEsc = (s) => { let o = ''; for (const ch of s) { const c = pdfCode(ch); const x = String.fromCharCode(c); o += (x === '(' || x === ')' || x === '\\') ? '\\' + x : (c < 32 ? ' ' : x); } return o; };
function pdfWrap(s, w, size, bold) {
  const words = pdfClean(s).split(' '), lines = []; let cur = '';
  for (let word of words) {
    while (pdfTw(word, size, bold) > w) { let k = word.length; while (k > 1 && pdfTw(word.slice(0, k), size, bold) > w) k--; if (cur) { lines.push(cur); cur = ''; } lines.push(word.slice(0, k)); word = word.slice(k); }
    const t2 = cur ? cur + ' ' + word : word;
    if (pdfTw(t2, size, bold) <= w) cur = t2; else { if (cur) lines.push(cur); cur = word; }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}
function newPdf(title) {
  const W = 595.28, H = 841.89, pages = [], images = [];
  let cur = null;
  const col = (c, stroke) => `${c[0].toFixed(3)} ${c[1].toFixed(3)} ${c[2].toFixed(3)} ${stroke ? 'RG' : 'rg'}`;
  const api = {
    W, H, pages,
    page() { cur = []; cur.imgs = new Set(); pages.push(cur); return pages.length; },
    addImage(bytes, w, h) { images.push({ bytes, w, h }); return images.length - 1; },
    image(x, y, w, h, k) { cur.imgs.add(k); cur.push(`q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${(H - y - h).toFixed(2)} cm /Im${k} Do Q`); },
    text(x, y, s, o = {}) { const size = o.size || 10, str = pdfClean(s); if (!str) return; let xx = x; const w = pdfTw(str, size, o.bold); if (o.align === 'right') xx = x - w; else if (o.align === 'center') xx = x - w / 2; cur.push(`BT ${col(o.color || PDF_INK)} /${o.bold ? 'F2' : 'F1'} ${size} Tf ${xx.toFixed(2)} ${(H - y).toFixed(2)} Td (${pdfEsc(str)}) Tj ET`); },
    rect(x, y, w, h, c) { cur.push(`${col(c)} ${x.toFixed(2)} ${(H - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`); },
    line(x1, y1, x2, y2, c = PDF_LINE, lw = 0.6) { cur.push(`${col(c, true)} ${lw} w ${x1.toFixed(2)} ${(H - y1).toFixed(2)} m ${x2.toFixed(2)} ${(H - y2).toFixed(2)} l S`); },
    build() {
      const n = pages.length, objs = [], imgBase = 5 + 2 * n;
      objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
      objs[2] = `<< /Type /Pages /Kids [${pages.map((_, i) => `${5 + i * 2} 0 R`).join(' ')}] /Count ${n} >>`;
      objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
      objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
      pages.forEach((cmds, i) => {
        const body = cmds.join('\n');
        objs[5 + i * 2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>${cmds.imgs.size ? ` /XObject << ${[...cmds.imgs].map(k => `/Im${k} ${imgBase + k} 0 R`).join(' ')} >>` : ''} >> /Contents ${6 + i * 2} 0 R >>`;
        objs[6 + i * 2] = `<< /Length ${body.length} >>\nstream\n${body}\nendstream`;
      });
      images.forEach((im, k) => { let bin = ''; for (let i = 0; i < im.bytes.length; i += 8192) bin += String.fromCharCode.apply(null, im.bytes.subarray(i, i + 8192)); objs[imgBase + k] = `<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bin.length} >>\nstream\n${bin}\nendstream`; });
      const info = objs.length; objs[info] = `<< /Title (${pdfEsc(pdfClean(title))}) /Producer (SaludPlus) /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}Z) >>`;
      let out = '%PDF-1.4\n', off = [];
      for (let i = 1; i < objs.length; i++) { off[i] = out.length; out += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
      const xref = out.length;
      out += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + off.slice(1).map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF`;
      const bytes = new Uint8Array(out.length); for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
      return new Blob([bytes], { type: 'application/pdf' });
    }
  };
  return api;
}

/* ---------- Datos del informe ---------- */
function examReportFilter() {
  examsNormalize();
  const g = $('repExamGroup')?.value || '', per = $('repExamPeriod')?.value || 'all';
  let from = '';
  if (per !== 'all') { const d = new Date(); d.setMonth(d.getMonth() - Number(per)); from = isoDateLocal(d); }
  return [...data.examResults].filter(r => (!g || r.planId === g || (g === '_none' && !r.planId)) && (!from || r.date >= from)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}
const entryFlag = (en) => en.status === 'altered' ? 'bad' : en.status === 'normal' ? 'ok' : '';
function examReportStats(rs) {
  const all = rs.flatMap(r => resultEntries(r));
  return { results: rs.length, values: all.length, altered: all.filter(e => e.status === 'altered').length, overdue: data.examPlans.filter(p => planStatus(p).key === 'red').length };
}

/* ---------- Pantalla ---------- */
function renderExamReport() {
  const box = $('repExamOut'); if (!box) return;
  const sel = $('repExamGroup'), keep = sel.value;
  sel.innerHTML = `<option value="">${esc(t('Todos los grupos'))}</option>` + data.examPlans.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('') + (data.examResults.some(r => !r.planId) ? `<option value="_none">${esc(t('Exámenes sin grupo'))}</option>` : '');
  sel.value = [...sel.options].some(o => o.value === keep) ? keep : '';
  const rs = examReportFilter(), st = examReportStats(rs), p = data.patient || {};
  const kp = (l, v, c) => `<div class="kpi"><span>${esc(t(l))}</span><strong${c ? ` style="color:var(--${c})"` : ''}>${v}</strong></div>`;
  let h = `<div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))">${kp('Resultados', st.results)}${kp('Valores fuera de rango', st.altered, st.altered ? 'bad' : 'ok')}${kp('Grupos vencidos', st.overdue, st.overdue ? 'bad' : 'ok')}</div>`;
  if (p.name) h += `<p class="muted" style="font-size:13px;margin-top:10px">${esc(p.name)}${p.birthDate ? ' · ' + esc(fmtDate(p.birthDate)) : ''}${p.sex ? ' · ' + esc(p.sex) : ''}</p>`;
  h += rs.length ? rs.map(r => {
    const es = resultEntries(r);
    const rows = es.length ? `<div class="repentries">${es.map(en => `<div class="repentry ${entryFlag(en)}"><div class="rl"><strong>${esc(t(en.name))}</strong><small>${esc(t('Rango normal'))}: ${esc(en.ref || '—')}</small></div><div class="rr"><b>${esc(en.value || '—')}${en.unit ? ' <span>' + esc(en.unit) + '</span>' : ''}</b>${en.status ? `<span class="bp-status bp-${en.status === 'altered' ? 'red' : 'green'}">${esc(t(EXAM_STATUS[en.status]))}</span>` : ''}</div></div>`).join('')}</div>` : `<p class="muted" style="font-size:13px">${esc(t('Sin valores anotados.'))}</p>`;
    const files = (r.files || []).length ? `<p class="fine">${esc(t('Archivos adjuntos'))}: ${esc(r.files.map(f => f.name).join(', '))}</p>` : '';
    return `<div class="card report-block"><div class="row between wrap" style="gap:8px"><h3 style="margin:0">${esc(r.name)}</h3>${resPill(r.status)}</div><p class="muted" style="font-size:13px;margin:4px 0 10px">${esc(fmtDate(r.date))}${r.lab ? ' · ' + esc(r.lab) : ''}</p>${rows}${r.summary ? `<p style="font-size:13px;margin-top:8px"><strong>${esc(t('Observaciones'))}:</strong> ${esc(r.summary)}</p>` : ''}${files}</div>`;
  }).join('') : `<div class="empty">${esc(t('No hay resultados para este filtro.'))}</div>`;
  box.innerHTML = h;
}

/* ---------- PDF ---------- */
async function imageToJpeg(blob, max = 1400) {
  const bmp = await createImageBitmap(blob), k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(bmp.width * k)); cv.height = Math.max(1, Math.round(bmp.height * k));
  const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(bmp, 0, 0, cv.width, cv.height);
  const out = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.82));
  return { bytes: new Uint8Array(await out.arrayBuffer()), w: cv.width, h: cv.height };
}
async function buildExamPdf() {
  const rs = examReportFilter(), st = examReportStats(rs), p = data.patient || {};
  const pdf = newPdf(`${t('Resultados de exámenes')} · SaludPlus`);
  const M = 40, CW = pdf.W - 2 * M, BOTTOM = pdf.H - 52;
  const cols = [M, M + 190, M + 292, M + 396]; // examen · resultado · rango · estado
  let y = 0;
  const header = () => {
    pdf.page(); pdf.rect(0, 0, pdf.W, 8, PDF_BRAND);
    pdf.text(M, 40, 'SaludPlus', { size: 20, bold: true, color: PDF_BRAND });
    pdf.text(pdf.W - M, 38, t('Resultados de exámenes'), { size: 12, bold: true, align: 'right' });
    pdf.text(pdf.W - M, 52, `${t('Generado')}: ${new Date().toLocaleDateString(locale(), { year: 'numeric', month: 'long', day: 'numeric' })}`, { size: 9, color: PDF_MUTED, align: 'right' });
    pdf.line(M, 64, pdf.W - M, 64, PDF_LINE, 1); y = 80;
  };
  header();
  const patient = [p.name, p.birthDate ? `${t('Nacimiento')}: ${fmtDate(p.birthDate)}` : '', p.sex || '', p.blood ? `${t('Tipo de sangre')}: ${p.blood}` : ''].filter(Boolean).join('  ·  ');
  if (patient) { pdf.text(M, y, patient, { size: 10, bold: true }); y += 16; }
  const gname = $('repExamGroup')?.selectedOptions[0]?.textContent || '', per = $('repExamPeriod')?.selectedOptions[0]?.textContent || '';
  pdf.text(M, y, `${gname} · ${per}`, { size: 9, color: PDF_MUTED }); y += 14;
  pdf.rect(M, y, CW, 34, PDF_SOFT);
  [[t('Resultados'), st.results, PDF_INK], [t('Valores anotados'), st.values, PDF_INK], [t('Valores fuera de rango'), st.altered, st.altered ? PDF_BAD : PDF_OK], [t('Grupos vencidos'), st.overdue, st.overdue ? PDF_BAD : PDF_OK]].forEach(([l, v, c], i) => {
    const x = M + 10 + i * (CW / 4); pdf.text(x, y + 13, l, { size: 8, color: PDF_MUTED }); pdf.text(x, y + 28, String(v), { size: 13, bold: true, color: c });
  });
  y += 52;
  if (!rs.length) pdf.text(M, y, t('No hay resultados para este filtro.'), { size: 11, color: PDF_MUTED });
  rs.forEach(r => {
    const es = resultEntries(r);
    if (y + 70 > BOTTOM) { header(); }
    pdf.rect(M, y, CW, 24, PDF_SOFT);
    pdf.text(M + 8, y + 16, r.name, { size: 11, bold: true, color: PDF_BRAND });
    const stTxt = t(EXAM_STATUS[r.status] || ''), stCol = r.status === 'altered' ? PDF_BAD : r.status === 'normal' ? PDF_OK : PDF_MUTED;
    pdf.text(M + CW - 8, y + 16, stTxt, { size: 9, bold: true, color: stCol, align: 'right' });
    y += 36;
    pdf.text(M + 2, y, `${fmtDate(r.date)}${r.lab ? '  ·  ' + r.lab : ''}`, { size: 9, color: PDF_MUTED }); y += 14;
    if (es.length) {
      const head = () => { [t('Examen'), t('Resultado'), t('Rango normal'), t('Estado')].forEach((h, i) => pdf.text(cols[i] + 2, y, h, { size: 8, bold: true, color: PDF_MUTED })); y += 4; pdf.line(M, y, M + CW, y, PDF_LINE, 0.8); y += 12; };
      head();
      es.forEach(en => {
        const nameL = pdfWrap(t(en.name), 180, 9.5, false), refL = pdfWrap(en.ref || '—', 96, 9, false), valL = pdfWrap(`${en.value || '—'}${en.unit ? ' ' + en.unit : ''}`, 98, 9.5, true);
        const nl = Math.max(nameL.length, refL.length, valL.length), rh = nl * 11.5 + 5;
        if (y + rh > BOTTOM) { header(); head(); }
        const bad = en.status === 'altered';
        nameL.forEach((l, i) => pdf.text(cols[0] + 2, y + i * 11.5, l, { size: 9.5 }));
        valL.forEach((l, i) => pdf.text(cols[1] + 2, y + i * 11.5, l, { size: 9.5, bold: true, color: bad ? PDF_BAD : PDF_INK }));
        refL.forEach((l, i) => pdf.text(cols[2] + 2, y + i * 11.5, l, { size: 9, color: PDF_MUTED }));
        pdf.text(cols[3] + 2, y, en.status ? t(EXAM_STATUS[en.status]) : '—', { size: 9, bold: true, color: bad ? PDF_BAD : en.status === 'normal' ? PDF_OK : PDF_MUTED });
        y += rh; pdf.line(M, y - 7, M + CW, y - 7, PDF_LINE, 0.4);
      });
    } else { pdf.text(M + 2, y, t('Sin valores anotados.'), { size: 9.5, color: PDF_MUTED }); y += 14; }
    y += 4;
    if (r.summary) { pdfWrap(`${t('Observaciones')}: ${r.summary}`, CW - 4, 9.5, false).forEach(l => { if (y > BOTTOM) header(); pdf.text(M + 2, y, l, { size: 9.5 }); y += 12; }); }
    if ((r.files || []).some(f => /pdf/i.test(f.type || f.name))) { pdfWrap(t('Los PDF adjuntos se conservan en la app y no se incluyen en este documento.'), CW - 4, 8, false).forEach(l => { if (y > BOTTOM) header(); pdf.text(M + 2, y, l, { size: 8, color: PDF_MUTED }); y += 10; }); }
    if ((r.files || []).length) { pdfWrap(`${t('Archivos adjuntos')}: ${r.files.map(f => f.name).join(', ')}`, CW - 4, 8.5, false).forEach(l => { if (y > BOTTOM) header(); pdf.text(M + 2, y, l, { size: 8.5, color: PDF_MUTED }); y += 11; }); }
    y += 14;
  });
  // Anexos: las fotos adjuntas de los resultados (los PDF no se pueden unir sin librería)
  for (const r of rs) {
    for (const f of (r.files || [])) {
      if (!/^image\//i.test(f.type || '')) continue;
      const blob = await FileStore.get(f.id); if (!blob) continue;
      let im; try { im = await imageToJpeg(blob); } catch (e) { continue; }
      header();
      pdf.text(M, y, `${t('Anexo')}: ${r.name} · ${fmtDate(r.date)}`, { size: 11, bold: true, color: PDF_BRAND }); y += 14;
      pdf.text(M, y, f.name, { size: 9, color: PDF_MUTED }); y += 12;
      const maxW = CW, maxH = BOTTOM - y - 8, k = Math.min(maxW / im.w, maxH / im.h), w = im.w * k, h = im.h * k;
      pdf.image(M + (maxW - w) / 2, y, w, h, pdf.addImage(im.bytes, im.w, im.h));
    }
  }
  return { pdf };
}
function finishPdf(pdf) {
  const n = pdf.pages.length, foot = pdfWrap(t('Documento generado con SaludPlus a partir de datos escritos por el paciente. Los rangos son orientativos y no sustituyen el informe del laboratorio ni la valoración de un profesional de la salud.'), pdf.W - 160, 7.5, false);
  for (let i = 0; i < n; i++) {
    const cmds = pdf.pages[i], c = PDF_MUTED, H = pdf.H;
    cmds.push(`${PDF_LINE.map(v => v.toFixed(3)).join(' ')} RG 0.6 w 40 46 m ${(pdf.W - 40).toFixed(2)} 46 l S`);
    foot.forEach((l, k) => cmds.push(`BT ${c.map(v => v.toFixed(3)).join(' ')} rg /F1 7.5 Tf 40 ${(34 - k * 9).toFixed(2)} Td (${pdfEsc(l)}) Tj ET`));
    const pg = `${t('Página')} ${i + 1} / ${n}`;
    cmds.push(`BT ${c.map(v => v.toFixed(3)).join(' ')} rg /F1 8 Tf ${(pdf.W - 40 - pdfTw(pg, 8, false)).toFixed(2)} 34 Td (${pdfEsc(pg)}) Tj ET`);
  }
  return pdf.build();
}
async function savePdfBlob(name, blob) {
  if (window.SP_ARTIFACT) {
    const dl = await claude.use('downloads').catch(() => null);
    if (!dl) { toast(t('La descarga no está disponible en esta vista.')); return; }
    try { await dl.save({ filename: name, data: blob }); } catch (e) { if (!e || e.code !== 'declined') toast(t('No se pudo guardar el archivo.')); }
    return;
  }
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
}
async function downloadExamPdf() {
  if (!examReportFilter().length) { toast(t('No hay resultados para este filtro.')); return; }
  const { pdf } = await buildExamPdf();
  const blob = finishPdf(pdf);
  window.__lastExamPdf = blob;
  await savePdfBlob(`saludplus-examenes-${today()}.pdf`, blob);
  toast(t('PDF creado.'));
}

function bindExamReport() {
  $('repExamGroup').addEventListener('change', renderExamReport);
  $('repExamPeriod').addEventListener('change', renderExamReport);
  $('repExamPdfBtn').addEventListener('click', downloadExamPdf);
  if (window.SP_ARTIFACT) $('repExamPrintBtn').hidden = true;
  else $('repExamPrintBtn').addEventListener('click', () => { renderExamReport(); window.print(); });
}
