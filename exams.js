/* SaludPlus v23 · control de exámenes
   - Controles programados (rutina, por padecimiento o por indicación médica) con fecha del próximo examen.
   - Resultados con archivo PDF/imagen. Los archivos se guardan en este dispositivo (IndexedDB), no en el servidor.
   - La IA solo recibe un resultado cuando la persona lo elige y lo autoriza en el chat. */
'use strict';

const EXAM_CATS = { rutina: 'Exámenes rutinarios', padecimiento: 'Por padecimiento', indicacion: 'Exámenes por receta médica' };
const EXAM_STATUS = { normal: 'Normal', altered: 'Alterado', review: 'Pendiente de revisión' };
const EXAM_FREQ = [[0, 'Una sola vez'], [1, 'Cada mes'], [3, 'Cada 3 meses'], [6, 'Cada 6 meses'], [12, 'Cada año'], [24, 'Cada 2 años']];
/* Catálogo de exámenes por categoría: [nombre, unidad habitual, rango normal orientativo para adultos].
   Los rangos cambian según laboratorio, edad y sexo: el paciente puede escribir el que trae su informe. */
const EXAM_CATALOG = [
  { cat: "Hematología", items: [["Hemograma completo", "", ""], ["Hemoglobina", "g/dL", {"m": "13.5–17.5", "f": "12.0–15.5"}], ["Hematocrito", "%", {"m": "41–53", "f": "36–46"}], ["Leucocitos (glóbulos blancos)", "/µL", "4500–11000"], ["Plaquetas", "/µL", "150000–450000"], ["Velocidad de sedimentación (VSG)", "mm/h", {"m": "0–15", "f": "0–20"}], ["Grupo sanguíneo y Rh", "", ""]] },
  { cat: "Glucosa y diabetes", items: [["Glucosa en ayunas", "mg/dL", "70–99"], ["Glucosa 2 horas después de comer", "mg/dL", "<140"], ["Hemoglobina glicosilada (HbA1c)", "%", "<5.7"], ["Insulina", "µUI/mL", "2–25"], ["Microalbuminuria", "mg/L", "<20"], ["Curva de tolerancia a la glucosa", "mg/dL", "<140"]] },
  { cat: "Colesterol y lípidos", items: [["Colesterol total", "mg/dL", "<200"], ["Colesterol HDL", "mg/dL", {"m": ">40", "f": ">50"}], ["Colesterol LDL", "mg/dL", "<100"], ["Triglicéridos", "mg/dL", "<150"]] },
  { cat: "Riñón y electrolitos", items: [["Creatinina", "mg/dL", {"m": "0.74–1.35", "f": "0.59–1.04"}], ["Urea", "mg/dL", "15–45"], ["Nitrógeno ureico (BUN)", "mg/dL", "7–20"], ["Ácido úrico", "mg/dL", {"m": "3.4–7.0", "f": "2.4–6.0"}], ["Tasa de filtración glomerular", "mL/min/1.73 m²", ">90"], ["Sodio", "mEq/L", "135–145"], ["Potasio", "mEq/L", "3.5–5.0"], ["Cloro", "mEq/L", "98–107"], ["Calcio", "mg/dL", "8.6–10.2"]] },
  { cat: "Hígado", items: [["TGO / AST", "U/L", "10–40"], ["TGP / ALT", "U/L", "7–55"], ["Fosfatasa alcalina", "U/L", "44–147"], ["GGT", "U/L", {"m": "8–61", "f": "5–36"}], ["Bilirrubina total", "mg/dL", "0.1–1.2"], ["Albúmina", "g/dL", "3.5–5.0"], ["Proteínas totales", "g/dL", "6.0–8.3"]] },
  { cat: "Tiroides", items: [["TSH", "µUI/mL", "0.4–4.0"], ["T4 libre", "ng/dL", "0.8–1.8"], ["T3 total", "ng/dL", "80–200"]] },
  { cat: "Vitaminas y hierro", items: [["Vitamina D (25-OH)", "ng/mL", "30–100"], ["Vitamina B12", "pg/mL", "200–900"], ["Ácido fólico", "ng/mL", "3–17"], ["Hierro sérico", "µg/dL", {"m": "65–175", "f": "50–170"}], ["Ferritina", "ng/mL", {"m": "24–336", "f": "11–307"}]] },
  { cat: "Orina y heces", items: [["Examen general de orina", "", "Sin alteraciones"], ["Urocultivo", "", "Sin crecimiento"], ["Examen de heces", "", "Sin parásitos"], ["Sangre oculta en heces", "", "Negativo"]] },
  { cat: "Inflamación y próstata", items: [["Proteína C reactiva (PCR)", "mg/L", "<5"], ["Antígeno prostático (PSA)", "ng/mL", "<4"]] },
  { cat: "Corazón y pulmón", items: [["Electrocardiograma", "", "Sin alteraciones"], ["Ecocardiograma", "", "Sin alteraciones"], ["Prueba de esfuerzo", "", "Negativa"], ["Radiografía de tórax", "", "Sin hallazgos"], ["Espirometría", "", "Sin alteraciones"]] },
  { cat: "Imágenes y otros", items: [["Ecografía abdominal", "", "Sin hallazgos"], ["Mamografía", "", "Sin hallazgos"], ["Papanicolaou", "", "Negativo"], ["Densitometría ósea", "", "Normal"], ["Examen de la vista / fondo de ojo", "", "Sin alteraciones"]] }
];
const CAT_INFO = new Map(EXAM_CATALOG.flatMap(g => g.items.map(([n, u, r]) => [n.toLowerCase(), { unit: u, ref: r }])));
const unitFor = (name) => CAT_INFO.get(String(name || '').trim().toLowerCase())?.unit || '';
function refFor(name) {
  const r = CAT_INFO.get(String(name || '').trim().toLowerCase())?.ref; if (!r) return '';
  if (typeof r === 'string') return t(r);
  const sex = data.patient?.sex;
  return sex === 'Masculino' ? r.m : sex === 'Femenino' ? r.f : `♂ ${r.m} · ♀ ${r.f}`;
}
/* Lee el rango del inicio del texto: «70–99», «<200», «>40». Devuelve null si no es numérico. */
function parseRange(text) {
  const n = '(-?\\d+(?:[.,]\\d+)?)', f = s => Number(String(s).replace(',', '.'));
  let m = String(text || '').match(new RegExp('^\\s*' + n + '\\s*[–-]\\s*' + n));
  if (m) return { lo: f(m[1]), hi: f(m[2]) };
  if ((m = String(text || '').match(new RegExp('^\\s*[<≤]\\s*' + n)))) return { hi: f(m[1]) };
  if ((m = String(text || '').match(new RegExp('^\\s*[>≥]\\s*' + n)))) return { lo: f(m[1]) };
  return null;
}
const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
function judge(value, ref) {
  const v = numVal(value), r = parseRange(ref);
  if (v !== null && r) {
    if (r.lo !== undefined && v < r.lo) return 'low';
    if (r.hi !== undefined && v > r.hi) return 'high';
    return 'ok';
  }
  if (v !== null) return null;
  const x = fold(value); if (!x) return null;       // resultados en texto: «Negativo», «Sin alteraciones»…
  if (/^(normal|negativ|sin (alteracion|hallazgo|crecimiento|parasit)|no (se )?(observ|evidenc|hay|alterad|anormal)|dentro de|ausen)/.test(x)) return 'tok';
  if (/(positiv|anormal|alterad|elevad|aumentad|disminuid|patolog|sospech|hallazgo|lesion|crecimiento|presen)/.test(x)) return 'tbad';
  return null;
}
/* Cada grupo tiene su lista de exámenes. Son sugerencias generales: el médico decide qué incluir. */
const EXAM_TEMPLATES = [
  { name: 'Exámenes rutinarios', cat: 'rutina', months: 12, fasting: true, items: ['Hemograma completo', 'Glucosa en ayunas', 'Colesterol total', 'Triglicéridos', 'Colesterol HDL', 'Colesterol LDL', 'Creatinina', 'Examen general de orina', 'TSH'] },
  { name: 'Exámenes por receta médica', cat: 'indicacion', months: 0, items: [] },
  { name: 'Control de diabetes', cat: 'padecimiento', months: 3, condition: 'Diabetes', items: ['Hemoglobina glicosilada (HbA1c)', 'Glucosa en ayunas', 'Creatinina', 'Microalbuminuria', 'Colesterol LDL'] },
  { name: 'Control de hipertensión', cat: 'padecimiento', months: 6, condition: 'Hipertensión', items: ['Creatinina', 'Sodio', 'Potasio', 'Colesterol total', 'Examen general de orina', 'Electrocardiograma'] },
  { name: 'Control de tiroides', cat: 'padecimiento', months: 12, condition: 'Tiroides', items: ['TSH', 'T4 libre'] },
  { name: 'Grupo en blanco', cat: 'rutina', months: 12, items: [] }
];
const MAX_EXAM_FILE = 8 * 1024 * 1024;

/* ---------- Fechas ---------- */
const parseYMD = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
function addMonths(ymd, n) {
  const d = parseYMD(ymd), day = d.getDate();
  const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
  r.setDate(Math.min(day, new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate()));
  return isoDateLocal(r);
}
function daysUntil(ymd) { const a = parseYMD(today()), b = parseYMD(ymd); return Math.round((b - a) / 864e5); }
function planStatus(p) {
  if (!p.nextDate) return { key: 'none', label: 'Sin fecha', sub: t(p.lastDate ? 'Completado' : 'Sin fecha programada') };
  const n = daysUntil(p.nextDate);
  if (n < 0) return { key: 'red', label: 'Vencido', sub: `${t('Vencido hace')} ${-n} ${t(-n === 1 ? 'día' : 'días')}`, n };
  if (n === 0) return { key: 'orange', label: 'Hoy', sub: t('Es hoy'), n };
  if (n <= 30) return { key: 'orange', label: 'Próximo', sub: `${t('En')} ${n} ${t(n === 1 ? 'día' : 'días')}`, n };
  return { key: 'green', label: 'Al día', sub: `${t('En')} ${n} ${t('días')}`, n };
}
const freqLabel = (m) => (EXAM_FREQ.find(f => f[0] === Number(m)) || EXAM_FREQ[0])[1];

function examsNormalize() {
  data.examPlans = Array.isArray(data.examPlans) ? data.examPlans : [];
  data.examResults = Array.isArray(data.examResults) ? data.examResults : [];
}

/* ---------- Archivos en el dispositivo (IndexedDB, con copia en memoria si no hay acceso) ---------- */
const FileStore = (() => {
  let dbp = null; const mem = new Map();
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    try { const r = indexedDB.open('saludplus_files', 1); r.onupgradeneeded = () => r.result.createObjectStore('files'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }
    catch (e) { rej(e); }
  }));
  const run = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const trx = db.transaction('files', mode); const q = fn(trx.objectStore('files')); trx.oncomplete = () => res(q && q.result); trx.onerror = () => rej(trx.error); trx.onabort = () => rej(trx.error); }); };
  return {
    async put(id, blob) { mem.set(id, blob); try { await run('readwrite', s => s.put(blob, id)); return true; } catch (e) { return false; } },
    async get(id) { try { const b = await run('readonly', s => s.get(id)); if (b) return b; } catch (e) { /* usa memoria */ } return mem.get(id) || null; },
    async del(id) { mem.delete(id); try { await run('readwrite', s => s.delete(id)); } catch (e) { /* nada */ } }
  };
})();

const isPdf = (f) => /pdf/i.test(f.type || '') || /\.pdf$/i.test(f.name || '');
const isImg = (f) => /^image\//i.test(f.type || '');
const fmtSize = (b) => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';

/* Prepara un archivo para enviarlo a la IA: PDF tal cual (base64); imagen reducida a JPEG. */
const blobToB64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
async function prepareAiFile(blob, name) {
  if (isPdf({ type: blob.type, name })) {
    if (blob.size > 6 * 1024 * 1024) throw new Error(t('El PDF pesa más de 6 MB. Pega el texto del resultado o sube una versión más ligera.'));
    return { type: 'pdf', name, data: await blobToB64(blob) };
  }
  if (isImg(blob)) {
    const bmp = await createImageBitmap(blob), k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    const jpg = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.85));
    return { type: 'image', name, data: await blobToB64(jpg) };
  }
  throw new Error(t('Formato no admitido. Usa PDF o imagen.'));
}
window.prepareAiFile = prepareAiFile;

async function openExamFile(id, name) {
  const blob = await FileStore.get(id);
  if (!blob) { toast(t('Este archivo no está disponible en este dispositivo (por ejemplo, tras restaurar un respaldo).')); return; }
  if (window.SP_ARTIFACT && !isImg(blob)) { toast(t('La vista previa de PDF solo está en la app instalada.')); return; }
  if (isImg(blob) && typeof window.showImageDialog === 'function') { window.showImageDialog(URL.createObjectURL(blob), name); return; }
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.download = ''; if (isPdf({ type: blob.type, name })) a.removeAttribute('download');
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
}
window.openExamFile = openExamFile;

/* ---------- Lógica ---------- */
function latestResultFor(plan) {
  return data.examResults.filter(r => r.planId === plan.id).sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0] || null;
}
function examAttention() {
  const items = data.examPlans.map(p => ({ p, s: planStatus(p) })).filter(x => x.s.key === 'red' || x.s.key === 'orange');
  return items.sort((a, b) => (a.s.n ?? 0) - (b.s.n ?? 0));
}
function applyResultToPlan(res) {
  const plan = data.examPlans.find(p => p.id === res.planId); if (!plan) return;
  if (!plan.lastDate || res.date >= plan.lastDate) {
    plan.lastDate = res.date;
    plan.nextDate = Number(plan.months) > 0 ? addMonths(res.date, Number(plan.months)) : '';
  }
}

/* ---------- Resultados por examen ---------- */
function resultEntries(r) {
  if (Array.isArray(r.entries)) return r.entries;
  return (r.value !== '' && r.value != null) ? [{ name: r.name, value: r.value, unit: r.unit || '', status: '' }] : []; // resultados de la versión anterior
}
const entryText = (en) => `${en.name}: ${en.value || '—'}${en.unit ? ' ' + en.unit : ''}${en.ref ? ` [rango normal: ${en.ref}]` : ''}${en.status ? ` (${EXAM_STATUS[en.status] || ''})` : ''}`;
function examResultNotes(r) {
  const es = resultEntries(r);
  return `Grupo/examen: ${r.name}; fecha: ${r.date}; laboratorio: ${r.lab || '—'}; clasificación general indicada: ${EXAM_STATUS[r.status] || '—'}${es.length ? '; resultados anotados por el paciente: ' + es.map(entryText).join(' | ') : ''}${r.summary ? '; observaciones: ' + r.summary : ''}`;
}
const numVal = (v) => { const n = Number(String(v).replace(',', '.').trim()); return String(v).trim() !== '' && Number.isFinite(n) ? n : null; };

/* ---------- Render ---------- */
const statusPill = (key, text) => `<span class="bp-status bp-${key === 'none' ? 'green' : key}" style="${key === 'none' ? 'background:var(--surface-2);color:var(--muted)' : ''}">${esc(t(text))}</span>`;
const resPill = (k) => statusPill(k === 'altered' ? 'red' : k === 'review' ? 'yellow' : 'green', EXAM_STATUS[k] || EXAM_STATUS.review);

function renderExams() {
  examsNormalize();
  const att = examAttention();
  const home = $('homeExams');
  if (home) {
    if (!data.examPlans.length) home.innerHTML = `<div class="muted" style="font-size:13px">${esc(t('Crea tus grupos de exámenes para recibir avisos.'))}</div>`;
    else if (!att.length) home.innerHTML = `<div class="value" style="font-size:20px">${esc(t('Todo al día'))}</div><div class="muted" style="font-size:13px">${esc(t('No tienes exámenes vencidos ni próximos en 30 días.'))}</div>`;
    else home.innerHTML = att.slice(0, 3).map(({ p, s }) => `<div class="examrow"><div style="min-width:0"><strong>${esc(p.name)}</strong><div class="muted" style="font-size:12.5px">${esc(fmtDate(p.nextDate))} · ${esc(s.sub)}</div></div>${statusPill(s.key, s.label)}</div>`).join('');
  }
  const list = $('examPlanList'); if (!list) return;
  const counts = { red: 0, orange: 0, green: 0 };
  data.examPlans.forEach(p => { const k = planStatus(p).key; if (counts[k] !== undefined) counts[k]++; });
  $('examSummary').innerHTML = `<div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="kpi"><span>${esc(t('Vencidos'))}</span><strong style="color:var(--bad)">${counts.red}</strong></div><div class="kpi"><span>${esc(t('Próximos (30 días)'))}</span><strong style="color:var(--orange)">${counts.orange}</strong></div><div class="kpi"><span>${esc(t('Al día'))}</span><strong style="color:var(--ok)">${counts.green}</strong></div></div>`;

  const order = { red: 0, orange: 1, green: 2, none: 3 };
  const sorted = [...data.examPlans].sort((a, b) => order[planStatus(a).key] - order[planStatus(b).key] || (a.nextDate || '9').localeCompare(b.nextDate || '9'));
  list.innerHTML = sorted.length ? sorted.map(p => {
    const s = planStatus(p), last = latestResultFor(p), items = Array.isArray(p.items) ? p.items : [];
    const sub = [`${t(EXAM_CATS[p.cat] || EXAM_CATS.rutina)} · ${t(freqLabel(p.months))}`, p.condition ? `${t('Relacionado con')}: ${esc(p.condition)}` : '', p.nextDate ? `${t('Próximo')}: ${fmtDate(p.nextDate)} (${s.sub})` : s.sub, last ? `${t('Último resultado')}: ${fmtDate(last.date)}` : '', p.fasting ? t('Requiere ayuno') : '', p.notes ? esc(p.notes) : ''].filter(Boolean).join('\n');
    const chips = items.length ? `<div class="chipline">${items.map(n => `<span class="filechip" style="padding:3px 10px">${esc(t(n))}</span>`).join('')}</div>` : `<p class="fine" style="margin-top:6px">${esc(t('Este grupo aún no tiene exámenes en su lista. Pulsa Editar para agregarlos.'))}</p>`;
    return `<div class="item"><div style="min-width:0;flex:1"><strong>${esc(p.name)} ${statusPill(s.key, s.label)}</strong><p>${sub}</p>${chips}</div><div class="actions"><button class="btn secondary small" type="button" onclick="openResultDialog('${p.id}')">${esc(t('Registrar resultado'))}</button><button class="btn ghost small" type="button" onclick="openPlanDialog('${p.id}')">${esc(t('Editar'))}</button><button class="btn danger small" type="button" onclick="removeExamPlan('${p.id}')">${esc(t('Eliminar'))}</button></div></div>`;
  }).join('') : `<div class="empty">${esc(t('Aún no tienes grupos de exámenes. Usa un grupo sugerido o crea el tuyo.'))}</div>`;

  const results = [...data.examResults].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  $('examResultCount').textContent = `${results.length} ${t('resultados')}`;
  $('examResultList').innerHTML = results.length ? results.map(r => {
    const files = (r.files || []).map(f => `<button class="btn ghost small" type="button" onclick="openExamFile('${f.id}','${esc(f.name).replace(/'/g, '')}')">${esc(f.name.length > 22 ? f.name.slice(0, 20) + '…' : f.name)} · ${fmtSize(f.size)}</button>`).join('');
    const es = resultEntries(r);
    const lines = es.length ? `<ul class="entrylist">${es.map(en => `<li class="${en.status === 'altered' ? 'alt' : en.status === 'normal' ? 'nor' : ''}">${esc(t(en.name))}: <strong>${esc(en.value || '—')}${en.unit ? ' ' + esc(en.unit) : ''}</strong>${en.status ? ` · ${esc(t(EXAM_STATUS[en.status]))}` : ''}${en.ref ? ` <small>· ${esc(t('Rango normal'))}: ${esc(en.ref)}</small>` : ''}</li>`).join('')}</ul>` : '';
    const sub = [`${fmtDate(r.date)}${r.lab ? ' · ' + esc(r.lab) : ''}`, r.summary ? esc(r.summary) : ''].filter(Boolean).join('\n');
    const canAsk = (r.files && r.files.length) || r.text || r.summary || es.length;
    return `<div class="item"><div style="min-width:0;flex:1"><strong>${esc(r.name)} ${resPill(r.status)}</strong><p>${sub}</p>${lines}${files ? `<div class="chipline">${files}</div>` : ''}</div><div class="actions">${canAsk ? `<button class="btn secondary small" type="button" onclick="askAboutResult('${r.id}')">${esc(t('Preguntar a la IA'))}</button>` : ''}${(r.files && r.files.length) || r.text ? `<button class="btn secondary small" type="button" onclick="readSavedResult('${r.id}')">${esc(t('Leer informe con IA'))}</button>` : ''}<button class="btn ghost small" type="button" onclick="addFilesToResult('${r.id}')">${esc(t('Agregar archivo'))}</button><button class="btn danger small" type="button" onclick="removeExamResult('${r.id}')">${esc(t('Eliminar'))}</button></div></div>`;
  }).join('') : `<div class="empty">${esc(t('Aún no hay resultados guardados.'))}</div>`;

  renderExamTrend();
}

function renderExamTrend() {
  const sel = $('examTrendSel'); if (!sel) return;
  const groups = {};
  data.examResults.forEach(r => resultEntries(r).forEach(en => { const v = numVal(en.value); if (v !== null) (groups[en.name.trim()] ||= []).push({ date: r.date, v, unit: en.unit }); }));
  const names = Object.keys(groups).filter(n => groups[n].length >= 2);
  const keep = sel.value;
  sel.innerHTML = names.map(n => `<option value="${esc(n)}">${esc(t(n))}</option>`).join('');
  if (names.includes(keep)) sel.value = keep;
  $('examTrendCard').hidden = !names.length;
  if (!names.length) return;
  const rows = groups[sel.value].sort((a, b) => a.date.localeCompare(b.date));
  $('examTrendChart').innerHTML = svgLineChart([{ color: 'var(--brand)', values: rows.map((r, i) => ({ i, value: r.v })) }], rows.map(r => fmtDate(r.date)));
  $('examTrendUnit').textContent = rows[rows.length - 1].unit ? `${t('Unidad')}: ${rows[rows.length - 1].unit}` : '';
}

function renderExamTemplates() {
  $('examTemplates').innerHTML = EXAM_TEMPLATES.map((x, i) => `<button type="button" class="chipbtn" data-tpl="${i}">${esc(t(x.name))}<small>${esc(t(freqLabel(x.months)))}${x.items.length ? ' · ' + x.items.length + ' ' + esc(t('exámenes')) : ''}</small></button>`).join('');
  $('examTemplates').querySelectorAll('button').forEach(b => b.addEventListener('click', () => openPlanDialog(null, EXAM_TEMPLATES[+b.dataset.tpl])));
}

/* ---------- Diálogos ---------- */
function openSheet(id) { const d = $(id); if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
function closeSheet(id) { const d = $(id); if (d.close) d.close(); else d.removeAttribute('open'); }

let planItems = [];
function syncCatalog() {
  const have = new Set(planItems.map(n => n.toLowerCase()));
  document.querySelectorAll('#examCatalog input[type=checkbox]').forEach(c => { c.checked = have.has(c.value.toLowerCase()); });
  document.querySelectorAll('#examCatalog details').forEach(d => {
    const boxes = [...d.querySelectorAll('input[type=checkbox]')], n = boxes.filter(c => c.checked).length;
    d.querySelector('.catcount').textContent = n ? `${n}/${boxes.length}` : String(boxes.length);
    d.classList.toggle('has', n > 0);
  });
}
function renderPlanItems() {
  $('planItemsCount').textContent = planItems.length ? `${planItems.length} ${t('seleccionados')}` : t('Ninguno seleccionado todavía');
  $('planItems').innerHTML = planItems.map((n, i) => `<span class="filechip">${esc(t(n))}<button type="button" aria-label="${esc(t('Quitar'))}" data-rm="${i}">×</button></span>`).join('');
  $('planItems').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { planItems.splice(+b.dataset.rm, 1); renderPlanItems(); }));
  syncCatalog();
}
function addPlanItem(n) { n = n.trim().slice(0, 80); if (n && !planItems.some(x => x.toLowerCase() === n.toLowerCase())) planItems.push(n); }
function addPlanItemsFromInput() {
  const inp = $('planItemInput');
  inp.value.split(/[,\n;]+/).forEach(addPlanItem);
  inp.value = ''; renderPlanItems();
}
function renderCatalog() {
  $('examCatalog').innerHTML = EXAM_CATALOG.map((g, gi) => `<details class="catcat" data-g="${gi}"><summary><span>${esc(t(g.cat))}</span><span class="catcount"></span></summary><div class="catbody"><button type="button" class="btn ghost small" data-all="${gi}">${esc(t('Marcar / quitar todos'))}</button><div class="catgrid">${g.items.map(([n, u]) => `<label class="catitem" data-n="${esc((n + ' ' + t(n)).toLowerCase())}"><input type="checkbox" value="${esc(n)}"><span>${esc(t(n))}${u ? `<small>${esc(u)}</small>` : ''}</span></label>`).join('')}</div></div></details>`).join('');
  $('examCatalog').addEventListener('change', e => {
    const c = e.target.closest('input[type=checkbox]'); if (!c) return;
    if (c.checked) addPlanItem(c.value); else planItems = planItems.filter(x => x.toLowerCase() !== c.value.toLowerCase());
    renderPlanItems();
  });
  $('examCatalog').addEventListener('click', e => {
    const b = e.target.closest('[data-all]'); if (!b) return;
    const names = EXAM_CATALOG[+b.dataset.all].items.map(x => x[0]), all = names.every(n => planItems.some(x => x.toLowerCase() === n.toLowerCase()));
    if (all) planItems = planItems.filter(x => !names.some(n => n.toLowerCase() === x.toLowerCase())); else names.forEach(addPlanItem);
    renderPlanItems();
  });
  $('catSearch').addEventListener('input', () => {
    const q = $('catSearch').value.trim().toLowerCase();
    document.querySelectorAll('#examCatalog .catitem').forEach(l => { l.hidden = !!q && !l.dataset.n.includes(q); });
    document.querySelectorAll('#examCatalog details').forEach(d => { const any = [...d.querySelectorAll('.catitem')].some(l => !l.hidden); d.hidden = !any; if (q && any) d.open = true; });
  });
}
function openPlanDialog(id, tpl) {
  examsNormalize();
  const f = $('planForm'), p = id ? data.examPlans.find(x => x.id === id) : null, src = p || tpl || {};
  f.reset();
  f.elements.id.value = p ? p.id : '';
  f.elements.name.value = src.name ? (p ? src.name : t(src.name)) : '';
  f.elements.cat.value = src.cat || 'rutina';
  f.elements.months.value = String(src.months ?? 12);
  f.elements.condition.value = src.condition ? (p ? src.condition : t(src.condition)) : '';
  f.elements.nextDate.value = p ? (p.nextDate || '') : (Number(src.months) > 0 ? addMonths(today(), 1) : '');
  f.elements.fasting.checked = !!src.fasting;
  f.elements.notes.value = src.notes ? (p ? src.notes : t(src.notes)) : '';
  planItems = [...(src.items || [])];
  $('planItemInput').value = ''; $('catSearch').value = ''; $('catSearch').dispatchEvent(new Event('input')); renderPlanItems();
  $('planDialogTitle').textContent = t(p ? 'Editar grupo de exámenes' : 'Nuevo grupo de exámenes');
  openSheet('planDialog');
}
function savePlan(e) {
  e.preventDefault(); examsNormalize();
  if ($('planItemInput').value.trim()) addPlanItemsFromInput();
  const f = e.currentTarget.elements, name = f.name.value.trim(); if (!name) return;
  const rec = { name, cat: f.cat.value, months: Number(f.months.value), condition: f.condition.value.trim(), nextDate: f.nextDate.value, fasting: f.fasting.checked, notes: f.notes.value.trim(), items: [...planItems] };
  if (f.id.value) Object.assign(data.examPlans.find(x => x.id === f.id.value) || {}, rec);
  else data.examPlans.push({ id: uid(), lastDate: '', ...rec });
  closeSheet('planDialog'); save(); toast(t('Grupo guardado en este dispositivo.'));
}
async function removeExamPlan(id) {
  if (!await askConfirm(t('¿Eliminar este grupo de exámenes? Los resultados ya guardados se conservan.'), t('Eliminar'))) return;
  data.examPlans = data.examPlans.filter(p => p.id !== id);
  data.examResults.forEach(r => { if (r.planId === id) r.planId = ''; });
  save();
}
async function removeExamResult(id) {
  if (!await askConfirm(t('¿Eliminar este resultado y sus archivos adjuntos de este dispositivo?'), t('Eliminar'))) return;
  const r = data.examResults.find(x => x.id === id);
  for (const f of (r?.files || [])) await FileStore.del(f.id);
  data.examResults = data.examResults.filter(x => x.id !== id);
  data.examPlans.forEach(p => { const l = latestResultFor(p); if (r && p.id === r.planId) { p.lastDate = l ? l.date : ''; if (l && Number(p.months) > 0) p.nextDate = addMonths(l.date, Number(p.months)); } });
  save();
}

let pendingFiles = [];
const rowHtml = (name, locked) => `<div class="resrow"><div class="rname">${locked ? `<strong>${esc(t(name))}</strong><input type="hidden" data-f="name" value="${esc(name)}">` : `<input data-f="name" list="examNames" value="${esc(name)}" maxlength="80" placeholder="${esc(t('Nombre del examen'))}" aria-label="${esc(t('Nombre del examen'))}"><button type="button" class="rdel" aria-label="${esc(t('Quitar'))}">×</button>`}</div><input data-f="value" maxlength="60" placeholder="${esc(t('Resultado'))}" aria-label="${esc(t('Resultado'))}" autocomplete="off"><input data-f="unit" maxlength="14" value="${esc(unitFor(name))}" placeholder="${esc(t('Unidad'))}" aria-label="${esc(t('Unidad'))}"><select data-f="status" aria-label="${esc(t('Estado'))}"><option value="">—</option><option value="normal">${esc(t('Normal'))}</option><option value="altered">${esc(t('Alterado'))}</option></select><div class="rref"><label>${esc(t('Rango normal'))}</label><input data-f="ref" maxlength="40" value="${esc(refFor(name))}" placeholder="${esc(t('Ej. 70–99'))}" aria-label="${esc(t('Rango normal'))}"><span class="rflag" aria-live="polite"></span></div></div>`;
/* Compara el resultado con el rango y, si el estado no se ha elegido a mano, lo sugiere. */
function updateRow(row) {
  const g = k => row.querySelector(`[data-f="${k}"]`), st = g('status'), flag = row.querySelector('.rflag');
  const j = judge(g('value').value, g('ref').value);
  const good = j === 'ok' || j === 'tok';
  flag.className = 'rflag' + (j ? (good ? ' ok' : ' bad') : '');
  flag.textContent = { ok: t('Dentro del rango'), low: t('Por debajo del rango'), high: t('Por encima del rango'), tok: t('Dentro de lo esperado'), tbad: t('Revisar con tu médico') }[j] || '';
  if (st.dataset.manual !== '1') { st.value = j ? (good ? 'normal' : 'altered') : ''; }
  row.classList.toggle('ok', st.value === 'normal'); row.classList.toggle('bad', st.value === 'altered');
}
function bindRowDelete(root) { root.querySelectorAll('.rdel').forEach(b => { b.onclick = () => b.closest('.resrow').remove(); }); }
function refreshResultRows() {
  const f = $('resultForm'), p = data.examPlans.find(x => x.id === f.elements.planId.value);
  $('resultNameField').hidden = !!p;
  const items = p ? (Array.isArray(p.items) && p.items.length ? p.items : []) : [];
  $('resultGroupTitle').textContent = p ? p.name : t('Examen sin grupo');
  $('resultGroupCount').textContent = items.length ? `${items.length} ${t('exámenes')}` : '';
  $('resultRows').innerHTML = items.length ? items.map(n => rowHtml(n, true)).join('') : rowHtml(p && !items.length ? p.name : '', false);
  bindRowDelete($('resultRows'));
}
function openResultDialog(planId) {
  examsNormalize();
  const f = $('resultForm'); f.reset(); pendingFiles = []; renderPendingFiles();
  f.elements.planId.innerHTML = `<option value="">${esc(t('Examen sin grupo'))}</option>` + data.examPlans.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  f.elements.planId.value = planId || '';
  f.elements.date.value = today();
  refreshResultRows();
  $('resultErr').textContent = '';
  openSheet('resultDialog');
}
function renderPendingFiles() {
  $('pendingFiles').innerHTML = pendingFiles.map((f, i) => `<span class="filechip">${esc(f.name)} · ${fmtSize(f.size)}<button type="button" aria-label="${esc(t('Quitar'))}" data-rm="${i}">×</button></span>`).join('');
  $('pendingFiles').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { pendingFiles.splice(+b.dataset.rm, 1); renderPendingFiles(); }));
}
function pickResultFiles(list) {
  const err = $('resultErr'); err.textContent = '';
  for (const f of list) {
    if (!isPdf(f) && !isImg(f)) { err.textContent = t('Formato no admitido. Usa PDF o imagen.'); continue; }
    if (f.size > MAX_EXAM_FILE) { err.textContent = t('Cada archivo debe pesar menos de 8 MB.'); continue; }
    if (pendingFiles.length >= 4) { err.textContent = t('Máximo 4 archivos por resultado.'); break; }
    pendingFiles.push(f);
  }
  renderPendingFiles();
}
function collectEntries() {
  return [...$('resultRows').querySelectorAll('.resrow')].map(r => {
    const g = k => (r.querySelector(`[data-f="${k}"]`)?.value || '').trim();
    return { name: g('name'), value: g('value'), unit: g('unit'), status: g('status'), ref: g('ref') };
  }).filter(x => x.name && (x.value || x.status));
}
async function saveResult(e) {
  e.preventDefault(); examsNormalize();
  const f = e.currentTarget.elements, plan = data.examPlans.find(x => x.id === f.planId.value);
  const name = plan ? plan.name : f.name.value.trim();
  const entries = collectEntries();
  if (!name) { $('resultErr').textContent = t('Escribe el nombre del examen o elige un grupo.'); return; }
  if (!f.date.value) return;
  const btn = e.submitter; if (btn) btn.disabled = true;
  const files = []; let stored = true;
  for (const file of pendingFiles) {
    const id = uid(); const ok = await FileStore.put(id, file); stored = stored && ok;
    files.push({ id, name: file.name, type: file.type || (isPdf(file) ? 'application/pdf' : 'image/jpeg'), size: file.size });
  }
  const status = entries.some(x => x.status === 'altered') ? 'altered' : (entries.length && entries.every(x => x.status === 'normal')) ? 'normal' : 'review';
  const res = { id: uid(), planId: plan ? plan.id : '', name, date: f.date.value, lab: f.lab.value.trim(), status, entries, summary: f.summary.value.trim(), text: f.text.value.trim().slice(0, 8000), files };
  data.examResults.push(res); applyResultToPlan(res);
  closeSheet('resultDialog'); if (btn) btn.disabled = false;
  save(); toast(stored ? t('Resultado guardado en este dispositivo.') : t('Resultado guardado, pero el navegador no permitió guardar el archivo de forma permanente.'));
}

/* Agrega más soporte (informe del laboratorio) a un resultado ya guardado. */
let addFilesTarget = null;
function addFilesToResult(id) { addFilesTarget = id; $('resultAddFile').click(); }
async function onAddFiles(list) {
  const r = data.examResults.find(x => x.id === addFilesTarget); addFilesTarget = null; if (!r) return;
  r.files = r.files || []; let added = 0, bad = false;
  for (const f of list) {
    if ((!isPdf(f) && !isImg(f)) || f.size > MAX_EXAM_FILE || r.files.length >= 4) { bad = true; continue; }
    const id = uid(); await FileStore.put(id, f);
    r.files.push({ id, name: f.name, type: f.type || (isPdf(f) ? 'application/pdf' : 'image/jpeg'), size: f.size }); added++;
  }
  save(); toast(added ? t('Archivo agregado al resultado.') : t('No se agregó ningún archivo.')); if (bad && added) toast(t('Algunos archivos no se agregaron (formato, tamaño o máximo de 4).'));
}
function askAboutResult(id) {
  showView('asistente');
  if (typeof chatSelectResult === 'function') chatSelectResult(id);
}

/* ---------- Informe: sección 8 ---------- */
/* ---------- Leer el informe del laboratorio con IA y revisarlo en pantalla ---------- */
const statusFor = (value, ref) => { const j = judge(value, ref); return j ? ((j === 'ok' || j === 'tok') ? 'normal' : 'altered') : ''; };
const JFLAG = { ok: 'Dentro del rango', low: 'Por debajo del rango', high: 'Por encima del rango', tok: 'Dentro de lo esperado', tbad: 'Revisar con tu médico' };
let readCtx = null; // { target: 'form' | id del resultado, files: [{blob,name}], text, items, lab, date, busy }

/* Envía el informe a tu servidor de IA y devuelve { readable, lab, date, items:[{name,value,unit,ref}] }. */
async function aiExtract(files, text) {
  const useFb = !!(window.SP_AI && window.SP_AI.configured());
  const base = typeof aiBase === 'function' ? aiBase() : '';
  if (!base && !useFb) throw new Error(t('Falta conectar el servidor de IA. Abre «Conexión con el servidor de IA», en el Asistente, y pega su dirección.'));
  const items = [];
  for (const f of files) items.push(await prepareAiFile(f.blob, f.name));
  if (text) items.push({ type: 'text', name: 'texto del resultado', text });
  if (!items.length) throw new Error(t('Adjunta primero un PDF, una foto o pega el texto del informe.'));
  const known = EXAM_CATALOG.flatMap(g => g.items.map(x => x[0]));
  if (useFb) return SP_AI.extract(items, known);
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 110000);
  let res;
  try { res = await fetch(base + '/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attachments: items, known }), signal: ctrl.signal }); }
  catch (e) { throw new Error(e.name === 'AbortError' ? t('El servidor tardó demasiado en responder. Inténtalo de nuevo.') : t('No se pudo conectar con el servidor de IA.')); }
  finally { clearTimeout(timer); }
  let body = {}; try { body = await res.json(); } catch (e) { /* sin JSON */ }
  if (!res.ok) throw new Error(body.error || `${t('El servidor respondió con código')} ${res.status}`);
  return body;
}

function readDialogShow(state, msg) {
  $('readConsentBox').hidden = state !== 'consent';
  $('readBusy').hidden = state !== 'busy';
  $('readResult').hidden = state !== 'done';
  $('readGo').hidden = state !== 'consent';
  $('readApply').hidden = state !== 'done';
  $('readErr').textContent = msg || '';
  $('readGo').disabled = false;
}
function openReadDialog(ctx) {
  readCtx = ctx;
  const names = ctx.files.map(f => `<span class="filechip" style="padding:3px 10px">${esc(f.name)}</span>`).join('') + (ctx.text ? `<span class="filechip" style="padding:3px 10px">${esc(t('Texto del resultado'))}</span>` : '');
  $('readSources').innerHTML = names;
  $('readConsent').checked = false;
  readDialogShow('consent');
  openSheet('readDialog');
}
function readFromForm() {
  const f = $('resultForm').elements;
  if (!pendingFiles.length && !f.text.value.trim()) { $('resultErr').textContent = t('Adjunta primero un PDF, una foto o pega el texto del informe.'); return; }
  $('resultErr').textContent = '';
  openReadDialog({ target: 'form', files: pendingFiles.map(x => ({ blob: x, name: x.name })), text: f.text.value.trim() });
}
async function readSavedResult(id) {
  const r = data.examResults.find(x => x.id === id); if (!r) return;
  const files = [];
  for (const f of (r.files || []).slice(0, 4)) { const blob = await FileStore.get(f.id); if (blob) files.push({ blob, name: f.name }); }
  if (!files.length && !r.text) { toast(t('No se encontró el archivo en este dispositivo. Vuelve a agregarlo.')); return; }
  openReadDialog({ target: id, files, text: r.text || '' });
}
async function runRead() {
  if (!readCtx || readCtx.busy) return;
  if (!$('readConsent').checked) { $('readErr').textContent = t('Marca la autorización para enviar el informe a la IA. No se ha enviado nada.'); return; }
  readCtx.busy = true; readDialogShow('busy');
  try {
    const out = await aiExtract(readCtx.files, readCtx.text);
    readCtx.items = (out.items || []).map(x => {
      const ref = x.ref || refFor(x.name), unit = x.unit || unitFor(x.name);
      return { name: x.name, value: x.value, unit, ref, refFromLab: !!x.ref, on: true };
    });
    readCtx.lab = out.lab || ''; readCtx.date = out.date || '';
    if (!out.readable || !readCtx.items.length) { readDialogShow('consent', t('No se pudieron leer resultados en este archivo. Prueba con un PDF con texto o una foto más nítida.')); }
    else { renderReadResult(); readDialogShow('done'); }
  } catch (e) { readDialogShow('consent', e.message || t('No se pudo leer el informe.')); }
  finally { readCtx.busy = false; }
}
function renderReadResult() {
  const c = readCtx, its = c.items;
  const bad = its.filter(x => statusFor(x.value, x.ref) === 'altered').length, ok = its.filter(x => statusFor(x.value, x.ref) === 'normal').length;
  $('readMeta').innerHTML = `<div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="kpi"><span>${esc(t('Leídos'))}</span><strong>${its.length}</strong></div><div class="kpi"><span>${esc(t('Normales'))}</span><strong style="color:var(--ok)">${ok}</strong></div><div class="kpi"><span>${esc(t('Alterados'))}</span><strong style="color:var(--bad)">${bad}</strong></div></div>` +
    ((c.lab || c.date) ? `<p class="fine" style="margin:8px 0 0">${c.lab ? esc(t('Laboratorio')) + ': <strong>' + esc(c.lab) + '</strong>' : ''}${c.lab && c.date ? ' · ' : ''}${c.date ? esc(t('Fecha del informe')) + ': <strong>' + esc(fmtDate(c.date)) + '</strong>' : ''}</p>` : '');
  $('readList').innerHTML = its.map((x, i) => {
    const j = judge(x.value, x.ref), st = statusFor(x.value, x.ref);
    return `<label class="readrow ${st === 'altered' ? 'bad' : st === 'normal' ? 'ok' : ''}"><input type="checkbox" data-i="${i}" ${x.on ? 'checked' : ''} aria-label="${esc(x.name)}"><span class="rd-main"><strong>${esc(t(x.name))}</strong><span class="rd-val">${esc(x.value)}${x.unit ? ' ' + esc(x.unit) : ''}</span></span><span class="rd-sub">${x.ref ? esc(t('Rango normal')) + ': ' + esc(x.ref) + (x.refFromLab ? ' · ' + esc(t('del informe')) : '') : esc(t('Sin rango de referencia'))}</span>${j ? `<span class="rflag ${st === 'normal' ? 'ok' : 'bad'}">${esc(t(JFLAG[j]))}</span>` : `<span class="rflag">${esc(t('Pendiente de revisión'))}</span>`}</label>`;
  }).join('');
  $('readList').querySelectorAll('input[type=checkbox]').forEach(cb => cb.addEventListener('change', () => { readCtx.items[+cb.dataset.i].on = cb.checked; $('readApply').disabled = !readCtx.items.some(x => x.on); }));
  $('readApply').disabled = !its.some(x => x.on);
}
const sameName = (a, b) => { a = fold(a); b = fold(b); return a === b || (Math.min(a.length, b.length) >= 4 && (a.includes(b) || b.includes(a))); };
function applyReadToForm(items, c) {
  const f = $('resultForm').elements, box = $('resultRows');
  let rows = [...box.querySelectorAll('.resrow')];
  const nameOf = r => r.querySelector('[data-f="name"]').value;
  for (const it of items) {
    let row = rows.find(r => fold(nameOf(r)) === fold(it.name)) || rows.find(r => nameOf(r).trim() && sameName(nameOf(r), it.name));
    if (!row) row = rows.find(r => !nameOf(r).trim() && !r.querySelector('[data-f="value"]').value);
    if (row && !row.querySelector('[data-f="name"]').value.trim()) row.querySelector('[data-f="name"]').value = it.name;
    if (!row) { box.insertAdjacentHTML('beforeend', rowHtml(it.name, false)); bindRowDelete(box); row = box.lastElementChild; rows.push(row); }
    const g = k => row.querySelector(`[data-f="${k}"]`);
    g('value').value = it.value; g('unit').value = it.unit || ''; g('ref').value = it.ref || ''; g('status').dataset.manual = ''; updateRow(row);
  }
  if (c.date) f.date.value = c.date;
  if (c.lab && !f.lab.value.trim()) f.lab.value = c.lab;
}
function applyReadToResult(r, items, c) {
  const es = resultEntries(r).map(x => ({ ...x }));
  for (const it of items) {
    const en = es.find(x => sameName(x.name, it.name)), status = statusFor(it.value, it.ref);
    if (en) Object.assign(en, { value: it.value, unit: it.unit || en.unit || '', ref: it.ref || en.ref || '', status });
    else es.push({ name: it.name, value: it.value, unit: it.unit || '', ref: it.ref || '', status });
  }
  r.entries = es;
  r.status = es.some(x => x.status === 'altered') ? 'altered' : (es.length && es.every(x => x.status === 'normal')) ? 'normal' : 'review';
  if (c.lab && !r.lab) r.lab = c.lab;
  save(); renderExams();
}
function applyRead() {
  const c = readCtx; if (!c || !c.items) return;
  const items = c.items.filter(x => x.on); if (!items.length) return;
  if (c.target === 'form') { applyReadToForm(items, c); toast(t('Lectura aplicada. Revisa los valores y guarda el resultado.')); }
  else { const r = data.examResults.find(x => x.id === c.target); if (r) { applyReadToResult(r, items, c); toast(t('Lectura guardada en el resultado.')); } }
  closeSheet('readDialog'); readCtx = null;
}

function examReportSection(section, tbl) {
  examsNormalize();
  const plans = [...data.examPlans].sort((a, b) => (a.nextDate || '9').localeCompare(b.nextDate || '9'));
  const res = [...data.examResults].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const p = plans.length ? tbl(['Grupo', 'Exámenes incluidos', 'Frecuencia', 'Último', 'Próximo', 'Estado'], plans.map(x => `<tr><td>${esc(x.name)}<br><small>${esc(t(EXAM_CATS[x.cat] || ''))}</small></td><td>${esc((x.items || []).join(', ') || '—')}</td><td>${esc(t(freqLabel(x.months)))}</td><td>${esc(x.lastDate ? fmtDate(x.lastDate) : '—')}</td><td>${esc(x.nextDate ? fmtDate(x.nextDate) : '—')}</td><td>${esc(t(planStatus(x).label))}</td></tr>`).join('')) : `<p>${esc(t('No hay exámenes programados.'))}</p>`;
  const r = res.length ? tbl(['Fecha', 'Grupo', 'Laboratorio', 'Resultados', 'Estado', 'Observaciones'], res.map(x => `<tr><td>${esc(fmtDate(x.date))}</td><td>${esc(x.name)}</td><td>${esc(x.lab || '—')}</td><td>${esc(resultEntries(x).map(entryText).join('; ') || '—')}</td><td>${esc(t(EXAM_STATUS[x.status] || ''))}</td><td>${esc(x.summary || '—')}</td></tr>`).join('')) : `<p>${esc(t('No hay resultados guardados.'))}</p>`;
  return section('8. Control de exámenes', p + `<h4 style="margin:14px 0 6px">${esc(t('Resultados'))}</h4>` + r);
}

function bindExams() {
  renderExamTemplates(); renderCatalog();
  $('examNames').innerHTML = EXAM_CATALOG.flatMap(g => g.items.map(x => `<option value="${esc(x[0])}">`)).join('');
  $('resultRows').addEventListener('change', e => {
    const row = e.target.closest('.resrow'); if (!row) return;
    if (e.target.matches('[data-f="status"]')) { e.target.dataset.manual = e.target.value ? '1' : ''; row.classList.toggle('ok', e.target.value === 'normal'); row.classList.toggle('bad', e.target.value === 'altered'); return; }
    if (e.target.matches('[data-f="name"]')) { const u = row.querySelector('[data-f="unit"]'), r = row.querySelector('[data-f="ref"]'); if (!u.value) u.value = unitFor(e.target.value); if (!r.value) r.value = refFor(e.target.value); updateRow(row); }
  });
  $('resultRows').addEventListener('input', e => { const row = e.target.closest('.resrow'); if (row && e.target.matches('[data-f="value"],[data-f="ref"]')) updateRow(row); });
  $('newPlanBtn').addEventListener('click', () => openPlanDialog(null));
  $('newResultBtn').addEventListener('click', () => openResultDialog(''));
  $('planForm').addEventListener('submit', savePlan);
  $('resultForm').addEventListener('submit', saveResult);
  $('planItemAdd').addEventListener('click', addPlanItemsFromInput);
  $('planItemInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addPlanItemsFromInput(); } });
  $('resultForm').elements.planId.addEventListener('change', refreshResultRows);
  $('addResultRow').addEventListener('click', () => { $('resultRows').insertAdjacentHTML('beforeend', rowHtml('', false)); bindRowDelete($('resultRows')); $('resultRows').lastElementChild.querySelector('[data-f="name"]').focus(); });
  $('resultAddFile').addEventListener('change', e => { const l = [...e.target.files]; e.target.value = ''; onAddFiles(l); });
  $('resultFile').addEventListener('change', e => { pickResultFiles([...e.target.files]); e.target.value = ''; });
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeSheet(b.dataset.close)));
  $('examTrendSel').addEventListener('change', renderExamTrend);
  $('readFormBtn').addEventListener('click', readFromForm);
  $('readGo').addEventListener('click', runRead);
  $('readApply').addEventListener('click', applyRead);
}
Object.assign(window, { addFilesToResult, openPlanDialog, openResultDialog, removeExamPlan, removeExamResult, askAboutResult, readSavedResult });
