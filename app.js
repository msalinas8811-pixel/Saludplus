/* SaludPlus v22 · lógica principal
   Los datos usan la misma clave de almacenamiento que las versiones anteriores, así que no se pierden al actualizar. */
'use strict';

const KEY = 'salud360_pwa_v1';
const emptyData = () => ({ bp: [], glucose: [], pulse: [], weight: [], meds: [], visits: [], patient: {}, examPlans: [], examResults: [], water: { goal: 2000, interval: 60, logs: [] } });
let data = loadData();

function loadData() {
  try {
    const x = { ...emptyData(), ...JSON.parse(localStorage.getItem(KEY) || '{}') };
    x.patient = x.patient || {};
    ['bp', 'glucose', 'pulse', 'weight', 'meds', 'visits'].forEach(k => { x[k] = Array.isArray(x[k]) ? x[k] : []; });
    x.examPlans = Array.isArray(x.examPlans) ? x.examPlans : []; x.examResults = Array.isArray(x.examResults) ? x.examResults : [];
    x.water = { ...emptyData().water, ...(x.water || {}) };
    x.water.logs = Array.isArray(x.water.logs) ? x.water.logs : [];
    return x;
  } catch (e) { return emptyData(); }
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
  catch (e) { toast(t('No se pudo guardar: el almacenamiento del dispositivo está lleno. Exporta un respaldo y borra archivos adjuntos grandes.')); return false; }
}
function save() { persist(); render(); }

/* ---------- Utilidades ---------- */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isoDateLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => isoDateLocal(new Date());
const nowTime = () => new Date().toTimeString().slice(0, 5);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
const fmtDate = (d) => { if (!d) return t('Sin fecha'); const [y, m, day] = d.split('-'); return `${day}/${m}/${y}`; };
const average = (a) => a.length ? a.reduce((s, v) => s + Number(v), 0) / a.length : null;
const num = (v) => Number(v);
const validBP = (x) => [x.ls, x.ld, x.rs, x.rd].every(v => v !== '' && v !== null && v !== undefined && Number.isFinite(num(v)) && num(v) > 0);
const pam = (s, d) => (num(s) + 2 * num(d)) / 3;
const byDateDesc = (a, b) => ((b.date || '') + (b.time || '')).localeCompare((a.date || '') + (a.time || ''));
const byDateAsc = (a, b) => ((a.date || '') + (a.time || '')).localeCompare((b.date || '') + (b.time || ''));
const locale = () => (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'en-US' : 'es-SV';

function toast(msg) {
  const old = document.querySelector('.toast'); if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}
function askConfirm(msg, okLabel) {
  return new Promise(resolve => {
    const dlg = document.createElement('dialog');
    dlg.className = 'confirm';
    dlg.innerHTML = `<p>${esc(msg)}</p><div class="form-actions" style="justify-content:flex-end"><button class="btn ghost" value="no">${esc(t('Cancelar'))}</button><button class="btn danger" value="yes">${esc(okLabel || t('Confirmar'))}</button></div>`;
    dlg.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      dlg.close(b.value);
    });
    dlg.addEventListener('close', () => { const ok = dlg.returnValue === 'yes'; dlg.remove(); resolve(ok); });
    document.body.appendChild(dlg);
    if (dlg.showModal) dlg.showModal(); else { dlg.setAttribute('open', ''); }
  });
}

/* ---------- Navegación ---------- */
const NAV = [
  { id: 'inicio', label: 'Hoy', icon: 'home', views: ['inicio'] },
  { id: 'controles', label: 'Controles', icon: 'activity', views: ['presion', 'glucosa', 'agua', 'graficas'] },
  { id: 'misalud', label: 'Mi salud', icon: 'heart', views: ['medicamentos', 'consultas', 'examenes', 'paciente'] },
  { id: 'asistente', label: 'Asistente', icon: 'chat', views: ['asistente'] },
  { id: 'reportes', label: 'Reportes', icon: 'file', views: ['reportes', 'examrep', 'respaldo'] }
];
const SUBLABEL = { presion: 'Presión', glucosa: 'Glucosa', agua: 'Agua', graficas: 'Evolución', medicamentos: 'Medicinas', consultas: 'Consultas', examenes: 'Exámenes', paciente: 'Perfil', reportes: 'Reportes', examrep: 'Exámenes', respaldo: 'Respaldo', inicio: 'Hoy', asistente: 'Asistente' };
let currentView = 'inicio';
const groupOf = (view) => NAV.find(g => g.views.includes(view)) || NAV[0];

function buildNav() {
  const mk = (g, side) => `<button type="button" class="${side ? '' : 'tab'}" data-group="${g.id}"><span class="${side ? '' : 'ico'}"><svg class="i"><use href="#i-${g.icon}"/></svg></span><span data-i18n>${g.label}</span></button>`;
  document.querySelector('[data-nav="side"]').innerHTML = NAV.map(g => mk(g, true)).join('');
  document.querySelector('[data-nav="tab"]').innerHTML = NAV.map(g => mk(g, false)).join('');
  document.querySelectorAll('[data-group]').forEach(b => b.addEventListener('click', () => {
    const g = NAV.find(x => x.id === b.dataset.group);
    showView(groupOf(currentView).id === g.id ? currentView : g.views[0]);
  }));
}
function showView(id) {
  if (!$(id)) id = 'inicio';
  currentView = id;
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === id));
  const g = groupOf(id);
  document.querySelectorAll('[data-group]').forEach(b => b.classList.toggle('active', b.dataset.group === g.id));
  const sub = $('subnav');
  if (g.views.length > 1) {
    sub.hidden = false;
    sub.innerHTML = g.views.map(v => `<button type="button" data-sub="${v}" class="${v === id ? 'active' : ''}" data-i18n>${SUBLABEL[v]}</button>`).join('');
    sub.querySelectorAll('button').forEach(b => b.addEventListener('click', () => showView(b.dataset.sub)));
  } else { sub.hidden = true; sub.innerHTML = ''; }
  if (id === 'medicamentos') refreshPrescriptionOptions();
  if (id === 'graficas') renderCharts();
  if (id === 'examenes') renderExams();
  if (id === 'examrep') renderExamReport();
  if (id === 'asistente' && typeof chatOnShow === 'function') chatOnShow();
  if (typeof applyLanguage === 'function') applyLanguage(currentLang);
  window.scrollTo({ top: 0 });
  try { history.replaceState(null, '', '#' + id); } catch (e) { /* sin historial */ }
}
window.showView = showView;

/* ---------- Clasificación orientativa de presión (AHA, adultos) ---------- */
function classifyBP(s, d) {
  if (s == null || d == null || !Number.isFinite(s) || !Number.isFinite(d)) return null;
  if (s >= 180 || d >= 120) return { key: 'red', label: 'Muy alta: rango de crisis', advice: 'Si una lectura alcanza 180 sistólica o 120 diastólica, repite tras al menos 1 minuto. Si se mantiene, busca atención médica urgente; con síntomas graves, llama a emergencias.' };
  if (s >= 140 || d >= 90) return { key: 'red', label: 'Alta · etapa 2', advice: 'Promedio en rango alto. Consulta con un profesional sanitario para interpretarlo.' };
  if (s >= 130 || d >= 80) return { key: 'orange', label: 'Alta · etapa 1', advice: 'Promedio en rango de hipertensión etapa 1. Confirma las mediciones y consulta con un profesional.' };
  if (s >= 120 && s < 130 && d < 80) return { key: 'yellow', label: 'Elevada', advice: 'Promedio por encima del rango normal. Sigue midiendo correctamente y coméntalo en tu consulta.' };
  return { key: 'green', label: 'Normal', advice: 'Promedio dentro del rango normal para adultos.' };
}

/* ---------- Barra vertical tipo tensiómetro ---------- */
const GAUGE = {
  sys: { title: 'SIS', min: 80, max: 200, seg: [[80, 120, 'green'], [120, 130, 'yellow'], [130, 140, 'orange'], [140, 180, 'red'], [180, 200, 'crisis']], ticks: [120, 130, 140, 180] },
  dia: { title: 'DIA', min: 40, max: 130, seg: [[40, 80, 'green'], [80, 90, 'orange'], [90, 120, 'red'], [120, 130, 'crisis']], ticks: [80, 90, 120] }
};
function gaugeBar(kind, value) {
  const g = GAUGE[kind], span = g.max - g.min, pct = v => ((Math.min(g.max, Math.max(g.min, v)) - g.min) / span * 100);
  const segs = g.seg.map(([a, b, c]) => `<i class="gs g-${c}" style="height:${(b - a) / span * 100}%"></i>`).reverse().join('');
  const ticks = g.ticks.map(v => `<span class="gt" style="bottom:${pct(v)}%">${v}</span>`).join('');
  let mark = '', badge = '';
  if (Number.isFinite(value)) {
    const hit = g.seg.find(([a, b]) => value < b) || g.seg[g.seg.length - 1];
    mark = `<div class="gmark" style="bottom:${pct(value)}%"></div>`; badge = `<b class="gv g-${hit[2]}">${Math.round(value)}</b>`;
  }
  return `<div class="gcol"><span class="gtitle">${esc(t(g.title))}${badge}</span><div class="gwrap"><div class="gticks">${ticks}</div><div class="gbar">${segs}${mark}</div></div></div>`;
}
function bpGauge(s, d) {
  const has = Number.isFinite(s) && Number.isFinite(d), c = has ? classifyBP(s, d) : null;
  const label = c ? `${t('Presión arterial')} ${Math.round(s)}/${Math.round(d)} mmHg: ${t(c.label)}` : t('Sin registros');
  const lg = [['green', 'Normal'], ['yellow', 'Elevada'], ['orange', 'Etapa 1'], ['red', 'Etapa 2'], ['crisis', 'Crisis']].map(([k, l]) => `<span><i class="gs g-${k}"></i>${esc(t(l))}</span>`).join('');
  return `<div class="bpgauge${has ? '' : ' off'}" role="img" aria-label="${esc(label)}"><div class="gcols">${gaugeBar('sys', has ? s : NaN)}${gaugeBar('dia', has ? d : NaN)}</div><div class="glegend">${lg}</div></div>`;
}

function setBPStatus(cardId, statusId, adviceId, s, d) {
  const card = $(cardId), badge = $(statusId), advice = $(adviceId);
  ['green', 'yellow', 'orange', 'red'].forEach(k => card.classList.remove('bp-card-' + k));
  if (s == null || d == null) { badge.hidden = true; return; }
  const c = classifyBP(s, d);
  card.classList.add('bp-card-' + c.key);
  badge.hidden = false; badge.className = 'bp-status bp-' + c.key; badge.textContent = t(c.label);
  if (advice) advice.textContent = t(c.advice);
}

/* ---------- Listas ---------- */
const empty = (text) => `<div class="empty">${esc(t(text))}</div>`;
const listItem = (title, sub, buttons = '') => `<div class="item"><div style="min-width:0;flex:1"><strong>${title}</strong><p>${sub}</p></div><div class="actions">${buttons}</div></div>`;
const removeBtn = (type, id) => `<button class="btn danger small" type="button" onclick="removeItem('${type}','${id}')">${esc(t('Eliminar'))}</button>`;
async function removeItem(type, id) {
  if (!await askConfirm(t('¿Eliminar este registro?'), t('Eliminar'))) return;
  data[type] = data[type].filter(x => x.id !== id); save();
}
window.removeItem = removeItem;

/* ---------- Gráficas ---------- */
function svgLineChart(seriesList, labels) {
  const all = seriesList.flatMap(s => s.values.map(v => Number(v.value)).filter(Number.isFinite));
  if (!all.length) return `<div class="empty">${esc(t('No hay registros en este período.'))}</div>`;
  const w = 640, h = 250, L = 46, R = 16, T = 18, B = 38, iw = w - L - R, ih = h - T - B;
  const min = Math.min(...all), max = Math.max(...all), pad = (max - min) * .12 || 1, lo = min - pad, hi = max + pad;
  const x = i => L + (labels.length < 2 ? iw / 2 : i * iw / (labels.length - 1));
  const y = v => T + (hi - v) * ih / (hi - lo);
  let g = `<svg class="chart-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(t('Gráfica de controles de salud'))}">`;
  for (let j = 0; j < 4; j++) {
    const yy = T + j * ih / 3, val = hi - j * (hi - lo) / 3;
    g += `<line x1="${L}" y1="${yy}" x2="${w - R}" y2="${yy}"/><text x="${L - 7}" y="${yy + 4}" text-anchor="end" font-size="11">${val.toFixed(val >= 100 ? 0 : 1)}</text>`;
  }
  seriesList.forEach(ser => {
    const pts = ser.values.map(v => `${x(v.i)},${y(Number(v.value))}`).join(' ');
    if (ser.values.length > 1) g += `<polyline points="${pts}" fill="none" style="stroke:${ser.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    ser.values.forEach(v => { g += `<circle cx="${x(v.i)}" cy="${y(Number(v.value))}" r="4" style="fill:${ser.color}"/>`; });
  });
  [0, Math.floor((labels.length - 1) / 2), labels.length - 1].filter((v, i, a) => a.indexOf(v) === i).forEach(i => {
    if (labels[i]) g += `<text x="${x(i)}" y="${h - 12}" text-anchor="middle" font-size="11">${esc(labels[i])}</text>`;
  });
  return g + '</svg>';
}
function renderCharts() {
  const type = $('chartType')?.value || 'bp', start = $('chartStart')?.value || '', end = $('chartEnd')?.value || '';
  const within = x => (!start || x.date >= start) && (!end || x.date <= end);
  const single = (arr, name, color) => {
    const items = (arr || []).filter(within).sort(byDateAsc);
    return { items, series: [{ name, color, values: items.map((x, i) => ({ i, value: +(x.value ?? x.glucose), date: x.date })).filter(v => Number.isFinite(v.value) && v.value > 0) }] };
  };
  let title = '', items = [], series = [];
  if (type === 'bp') {
    title = 'Presión arterial (mmHg)';
    items = data.bp.filter(within).sort(byDateAsc);
    const avgOf = (x, a, b) => { const vals = [x[a], x[b]].map(Number).filter(v => Number.isFinite(v) && v > 0); return vals.length ? vals.reduce((p, q) => p + q, 0) / vals.length : NaN; };
    series = [
      { name: 'Sistólica (promedio de brazos)', color: 'var(--brand)', values: items.map((x, i) => ({ i, value: avgOf(x, 'ls', 'rs') })).filter(v => Number.isFinite(v.value)) },
      { name: 'Diastólica (promedio de brazos)', color: 'var(--leaf)', values: items.map((x, i) => ({ i, value: avgOf(x, 'ld', 'rd') })).filter(v => Number.isFinite(v.value)) }
    ];
  } else if (type === 'glucose') { title = 'Glucosa (mg/dL)'; ({ items, series } = single(data.glucose, 'Glucosa', 'var(--brand)')); }
  else if (type === 'pulse') { title = 'Pulso (latidos/min)'; ({ items, series } = single(data.pulse, 'Pulso', 'var(--brand)')); }
  else if (type === 'weight') { title = 'Peso (kg)'; ({ items, series } = single(data.weight, 'Peso', 'var(--brand)')); }
  else {
    title = 'Consumo de agua (ml/día)';
    const sums = {}; (data.water?.logs || []).filter(within).forEach(x => { sums[x.date] = (sums[x.date] || 0) + (+x.ml || 0); });
    items = Object.keys(sums).sort().map(date => ({ date, value: sums[date] }));
    series = [{ name: 'Agua', color: 'var(--teal)', values: items.map((x, i) => ({ i, value: x.value })) }];
  }
  const labels = items.map(x => (x.date || '').slice(5));
  $('chartTitle').textContent = t(title);
  $('chartSummary').textContent = `${items.length} ${t('registro(s) en el período seleccionado.')}`;
  $('chartArea').innerHTML = svgLineChart(series, labels);
  $('chartLegend').innerHTML = series.map(s => `<span><i class="legend-dot" style="background:${s.color}"></i>${esc(t(s.name))}</span>`).join('');
}

/* ---------- Render principal ---------- */
function render() {
  const bp = [...data.bp].sort(byDateDesc);
  const gl = [...data.glucose].sort(byDateDesc);
  const name = (data.patient?.name || '').trim().split(/\s+/)[0];
  const h = new Date().getHours();
  const hello = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  $('homeGreeting').textContent = name ? `${t(hello)}, ${name}` : t(hello);
  $('todayLabel').textContent = new Date().toLocaleDateString(locale(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  $('homeBP').textContent = bp.length ? `${bp[0].ls}/${bp[0].ld}` : '—';
  $('homeBPSub').textContent = bp.length ? `${fmtDate(bp[0].date)} · ${bp[0].time || ''} · ${t('Derecho')} ${bp[0].rs}/${bp[0].rd}` : t('Sin registros');
  $('homeGlucose').innerHTML = gl.length ? `${esc(gl[0].value)} <small>mg/dL</small>` : '—';
  $('homeGlucoseSub').textContent = gl.length ? `${fmtDate(gl[0].date)} · ${t(gl[0].when || '')}` : t('Sin registros');
  $('homeMeds').textContent = data.meds.length;
  $('homeVisits').textContent = data.visits.length;

  const recent = bp.filter(validBP).slice(0, 7);
  const ss = recent.flatMap(x => [num(x.ls), num(x.rs)]), dd = recent.flatMap(x => [num(x.ld), num(x.rd)]);
  const avgS = ss.length ? average(ss) : null, avgD = dd.length ? average(dd) : null;
  const avgText = ss.length ? `${Math.round(avgS)}/${Math.round(avgD)} mmHg` : '—';
  $('avgBP').textContent = avgText;
  $('avgBPSub').textContent = ss.length ? `${recent.length} ${t('mediciones recientes incluidas; clasificación orientativa para adultos.')}` : t('Se calcula con las mediciones guardadas.');
  setBPStatus('avgBPCard', 'avgBPStatus', null, avgS, avgD);
  $('homeGauge').innerHTML = bpGauge(avgS, avgD); $('bpGauge').innerHTML = bpGauge(avgS, avgD);
  $('bpCombinedAvg').textContent = avgText;
  $('bpAverageAdvice').textContent = ss.length ? t('Clasificación orientativa para adultos; no sustituye una valoración clínica.') : t('Registra mediciones para ver la clasificación orientativa.');
  setBPStatus('bpAverageCard', 'bpAverageStatus', 'bpAverageAdvice', avgS, avgD);
  $('bpSysAvg').textContent = ss.length ? Math.round(avgS) + ' mmHg' : '—';
  $('bpDiaAvg').textContent = dd.length ? Math.round(avgD) + ' mmHg' : '—';
  const pams = recent.flatMap(x => [pam(x.ls, x.ld), pam(x.rs, x.rd)]).filter(Number.isFinite);
  const pamText = pams.length ? average(pams).toFixed(1) + ' mmHg' : '—';
  $('bpPamAvg').textContent = pamText; $('homePamAvg').textContent = pamText;
  $('bpDiff').textContent = recent.length ? Math.round(average(recent.map(x => Math.abs(num(x.ls) - num(x.rs))))) + ' mmHg' : '—';
  $('bpCount').textContent = `${bp.length} ${t('registros')}`;

  $('bpList').innerHTML = bp.length ? bp.map(x => listItem(
    `${fmtDate(x.date)} · ${esc(x.time)} · ${t('Toma')} ${esc(x.take)}`,
    `${t('Izquierdo')} ${x.ls}/${x.ld} · ${t('pulso')} ${x.lp || '—'} | ${t('Derecho')} ${x.rs}/${x.rd} · ${t('pulso')} ${x.rp || '—'}\n${t('PAM aprox.')}: ${Math.round(pam(x.ls, x.ld))} / ${Math.round(pam(x.rs, x.rd))} · ${t('Dif. sistólica')}: ${Math.abs(+x.ls - +x.rs)} mmHg${x.notes ? '\n' + esc(x.notes) : ''}`,
    removeBtn('bp', x.id))).join('') : empty('Aún no hay mediciones.');

  $('glucoseAvg').textContent = gl.length ? `${t('Promedio de registros')}: ${Math.round(average(gl.map(x => +x.value)))} mg/dL` : `${t('Promedio')}: —`;
  $('glucoseList').innerHTML = gl.length ? gl.map(x => listItem(`${esc(x.value)} mg/dL · ${fmtDate(x.date)} ${esc(x.time)}`, `${esc(t(x.when || ''))}${x.notes ? '\n' + esc(x.notes) : ''}`, removeBtn('glucose', x.id))).join('') : empty('Aún no hay mediciones.');

  $('medList').innerHTML = data.meds.length ? data.meds.map(x => {
    const taken = (x.taken || []).some(k => k.date === today());
    return listItem(`${esc(x.name)} · ${esc(x.dose)}`,
      `${t('Recordatorio')}: ${esc(x.time)} · ${t('Desde')} ${fmtDate(x.start)}${x.end ? ' ' + t('hasta') + ' ' + fmtDate(x.end) : ''}${x.instructions ? '\n' + esc(x.instructions) : ''}${x.prescription ? '\n' + t('Receta vinculada') + ': ' + esc(data.visits.find(v => v.id === x.prescription)?.fileName || t('consulta')) : ''}${taken ? '\n✓ ' + t('Tomada hoy') : ''}`,
      `<button class="btn secondary small" type="button" onclick="medTaken('${x.id}')">${esc(t('Marcar tomada hoy'))}</button>${removeBtn('meds', x.id)}`);
  }).join('') : empty('No hay medicamentos registrados.');

  $('visitList').innerHTML = data.visits.length ? [...data.visits].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(x => listItem(
    `${esc(x.doctor || t('Consulta médica'))} · ${fmtDate(x.date)}`,
    `${esc(x.specialty || t('Especialidad no indicada'))}${x.nextDate ? '\n' + t('Próxima cita') + ': ' + fmtDate(x.nextDate) : ''}${x.notes ? '\n' + esc(x.notes) : ''}${x.fileName ? '\n' + t('Archivo') + ': ' + esc(x.fileName) : ''}`,
    `${x.fileData ? `<button class="btn secondary small" type="button" onclick="openAttachment('${x.id}')">${esc(t('Ver archivo'))}</button>` : ''}${removeBtn('visits', x.id)}`)).join('') : empty('No hay consultas registradas.');

  $('backupStats').textContent = `${data.bp.length} ${t('mediciones de presión')} · ${data.glucose.length} ${t('registros de glucosa')} · ${data.meds.length} ${t('medicamentos')} · ${data.visits.length} ${t('consultas')} · ${(data.examPlans || []).length} ${t('exámenes programados')} · ${(data.examResults || []).length} ${t('resultados')}`;
  renderPatient(); renderWater(); renderAlarms(); renderHome(); renderExams();
  refreshPrescriptionOptions();
  if (currentView === 'graficas') renderCharts();
  if (currentView === 'examrep') renderExamReport();
  if (typeof applyLanguage === 'function') applyLanguage(currentLang);
}

function renderHome() {
  const p = data.patient || {};
  const put = (id, value, fallback) => { const e = $(id); if (e) e.textContent = (value && String(value).trim()) ? String(value) : t(fallback); };
  put('homePatientName', p.name, 'No registrado'); put('homeBloodType', p.blood, 'No registrado');
  put('homeMedAllergies', p.medAllergies, 'No registradas'); put('homeOtherAllergies', p.otherAllergies, 'No registradas');
  put('homeEmergency', [p.emergencyName, p.emergencyPhone].filter(Boolean).join(' · '), 'No registrado');
  const call = $('homeEmergencyCall'), digits = String(p.emergencyPhone || '').replace(/[^\d+]/g, '');
  call.classList.toggle('hidden', !digits); if (digits) call.href = 'tel:' + digits;

  const pm = $('homePeriodMessage'); if (pm && !pm.dataset.set) pm.textContent = t('Selecciona el periodo y pulsa Actualizar promedios.');
  const start = $('homeAvgStart'), end = $('homeAvgEnd');
  if (start && !start.value) { const d = new Date(); d.setDate(d.getDate() - 6); start.value = isoDateLocal(d); }
  if (end && !end.value) end.value = today();

  const bps = [...data.bp].sort(byDateDesc);
  $('homePressureTable').innerHTML = bps.length ? bps.slice(0, 12).map(x => {
    const lOk = num(x.ls) > 0 && num(x.ld) > 0, rOk = num(x.rs) > 0 && num(x.rd) > 0;
    const ps = [lOk ? pam(x.ls, x.ld) : null, rOk ? pam(x.rs, x.rd) : null].filter(v => v !== null);
    return `<tr><td>${esc(fmtDate(x.date))}</td><td>${esc(x.time || '—')}</td><td>${lOk ? num(x.ls) + '/' + num(x.ld) : '—'}</td><td>${rOk ? num(x.rs) + '/' + num(x.rd) : '—'}</td><td>${ps.length ? average(ps).toFixed(1) : '—'}</td></tr>`;
  }).join('') : `<tr><td colspan="5">${esc(t('Sin mediciones registradas.'))}</td></tr>`;

  $('homeMedicationSchedule').innerHTML = data.meds.length ? data.meds.map(m => listItem(esc(m.name || t('Medicamento')), `${t('Dosis')}: ${esc(m.dose || t('No indicada'))} · ${t('Hora')}: ${esc(m.time || t('No indicada'))}${m.instructions ? ' · ' + esc(m.instructions) : ''}`)).join('') : empty('No hay medicamentos registrados.');

  const visits = data.visits, td = today();
  const upcoming = visits.filter(v => (v.nextDate && v.nextDate >= td) || (!v.nextDate && v.date >= td)).sort((a, b) => (a.nextDate || a.date || '').localeCompare(b.nextDate || b.date || ''));
  const completed = visits.filter(v => v.date && v.date < td).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const line = v => listItem(esc(fmtDate(v.nextDate && v.nextDate >= td ? v.nextDate : v.date)), `${esc(v.doctor || t('Consulta médica'))} · ${esc(v.specialty || '')}${v.notes ? ' · ' + esc(v.notes) : ''}`);
  $('upcomingVisits').innerHTML = upcoming.length ? upcoming.slice(0, 3).map(line).join('') : empty('No hay citas futuras registradas.');
  $('homeUpcomingAppointments').innerHTML = upcoming.length ? upcoming.map(line).join('') : empty('No hay próximas citas registradas.');
  $('homeCompletedAppointments').innerHTML = completed.length ? completed.slice(0, 8).map(v => listItem(esc(fmtDate(v.date)), `${esc(v.doctor || t('Consulta médica'))} · ${esc(v.specialty || '')}${v.notes ? ' · ' + esc(v.notes) : ''}`)).join('') : empty('No hay citas anteriores registradas.');
  renderNextDose();
}

function activeMeds() { const d = today(); return data.meds.filter(m => m.time && (!m.start || m.start <= d) && (!m.end || m.end >= d)); }
function nextDose() {
  const d = today(), now = nowTime();
  const pending = activeMeds().filter(m => !(m.taken || []).some(k => k.date === d)).sort((a, b) => a.time.localeCompare(b.time));
  const overdue = pending.find(m => m.time < now);
  if (overdue) return { med: overdue, state: 'overdue' };
  const soon = pending.find(m => m.time >= now);
  if (soon) return { med: soon, state: 'today' };
  const all = activeMeds().sort((a, b) => a.time.localeCompare(b.time));
  return all.length ? { med: all[0], state: 'tomorrow' } : null;
}
function renderNextDose() {
  const n = nextDose(), title = $('nextDoseTitle'), sub = $('nextDoseSub'), btn = $('nextDoseBtn');
  if (!n) { title.textContent = '—'; sub.textContent = t('No hay medicamentos con horario activo.'); btn.classList.add('hidden'); return; }
  title.textContent = `${n.med.name} · ${n.med.dose}`;
  sub.textContent = n.state === 'overdue' ? `${t('Pendiente desde las')} ${n.med.time}` : n.state === 'today' ? `${t('Hoy a las')} ${n.med.time}` : `${t('Mañana a las')} ${n.med.time} · ${t('las tomas de hoy están registradas')}`;
  btn.classList.toggle('hidden', n.state === 'tomorrow'); btn.dataset.id = n.med.id;
}

function calculateHomePeriodAverages() {
  const start = $('homeAvgStart')?.value, end = $('homeAvgEnd')?.value, msg = $('homePeriodMessage'); msg.dataset.set = '1';
  if (!start || !end) { msg.textContent = t('Selecciona una fecha inicial y final.'); return; }
  if (start > end) { msg.textContent = t('La fecha inicial no puede ser posterior a la fecha final.'); return; }
  const rows = data.bp.filter(x => x.date >= start && x.date <= end);
  const values = rows.flatMap(x => {
    const a = [];
    if (num(x.ls) > 0 && num(x.ld) > 0) a.push({ s: num(x.ls), d: num(x.ld), p: pam(x.ls, x.ld) });
    if (num(x.rs) > 0 && num(x.rd) > 0) a.push({ s: num(x.rs), d: num(x.rd), p: pam(x.rs, x.rd) });
    return a;
  });
  $('homePeriodBP').textContent = values.length ? `${Math.round(average(values.map(v => v.s)))}/${Math.round(average(values.map(v => v.d)))} mmHg` : '—';
  $('homePeriodPAM').textContent = values.length ? average(values.map(v => v.p)).toFixed(1) + ' mmHg' : '—';
  $('homePeriodCount').textContent = String(rows.length);
  msg.textContent = values.length ? `${t('Periodo')} ${fmtDate(start)} ${t('a')} ${fmtDate(end)}. ${t('Se incluyeron')} ${values.length} ${t('lecturas válidas de')} ${rows.length} ${t('registros.')}` : t('No hay lecturas completas en el periodo seleccionado.');
}

function refreshPrescriptionOptions() {
  const s = $('medPrescription'); if (!s) return;
  const old = s.value;
  s.innerHTML = `<option value="">${esc(t('Sin receta vinculada'))}</option>` + data.visits.map(v => `<option value="${v.id}">${esc(fmtDate(v.date) + ' · ' + (v.doctor || t('Consulta')) + (v.fileName ? ' · ' + v.fileName : ''))}</option>`).join('');
  if ([...s.options].some(o => o.value === old)) s.value = old;
}

/* ---------- Formularios ---------- */
function setDefaults() {
  document.querySelectorAll('input[type=date]:not([name="birthDate"]):not([name="end"]):not([name="nextDate"])').forEach(x => { if (!x.value && !['chartStart', 'chartEnd'].includes(x.id)) x.value = today(); });
  document.querySelectorAll('input[type=time]').forEach(x => { if (!x.value) x.value = nowTime(); });
}
function bindForms() {
  $('bpForm').addEventListener('submit', e => {
    e.preventDefault(); const f = new FormData(e.target);
    data.bp.push({ id: uid(), date: f.get('date'), time: f.get('time'), take: f.get('take'), notes: f.get('notes'), ls: +f.get('ls'), ld: +f.get('ld'), lp: f.get('lp') ? +f.get('lp') : null, rs: +f.get('rs'), rd: +f.get('rd'), rp: f.get('rp') ? +f.get('rp') : null });
    e.target.reset(); setDefaults(); save(); toast(t('Medición guardada.'));
  });
  $('glucoseForm').addEventListener('submit', e => {
    e.preventDefault(); const f = new FormData(e.target);
    data.glucose.push({ id: uid(), date: f.get('date'), time: f.get('time'), value: +f.get('value'), when: f.get('when'), notes: f.get('notes') });
    e.target.reset(); setDefaults(); save(); toast(t('Medición guardada.'));
  });
  $('medForm').addEventListener('submit', e => {
    e.preventDefault(); const f = new FormData(e.target);
    data.meds.push({ id: uid(), name: f.get('name'), dose: f.get('dose'), time: f.get('time'), start: f.get('start'), end: f.get('end'), prescription: f.get('prescription'), instructions: f.get('instructions'), taken: [] });
    e.target.reset(); setDefaults(); save(); toast(t('Medicamento guardado.'));
  });
  $('visitForm').addEventListener('submit', async e => {
    e.preventDefault(); const form = e.target, f = new FormData(form), file = f.get('file');
    let fileData = null, fileName = '';
    if (file && file.size) {
      if (file.size > 8 * 1024 * 1024) { toast(t('El archivo supera 8 MB. Elige un archivo más pequeño.')); return; }
      fileData = await toDataURL(file); fileName = file.name;
    }
    data.visits.push({ id: uid(), date: f.get('date'), nextDate: f.get('nextDate'), doctor: f.get('doctor'), specialty: f.get('specialty'), notes: f.get('notes'), fileData, fileName });
    form.reset(); setDefaults(); save(); toast(t('Consulta guardada.'));
  });
  $('extraControlForm').addEventListener('submit', e => {
    e.preventDefault(); const f = e.currentTarget, v = Object.fromEntries(new FormData(f));
    const target = v.type === 'pulse' ? 'pulse' : 'weight';
    data[target].push({ id: uid(), value: +v.value, date: v.date, time: v.time, note: v.note || '' });
    save(); f.reset(); f.elements.date.value = today(); f.elements.time.value = nowTime();
    $('chartType').value = target; renderCharts(); toast(t('Control guardado en este dispositivo.'));
  });
  $('patientForm').addEventListener('submit', e => {
    e.preventDefault(); const f = new FormData(e.target); data.patient = {};
    for (const [k, v] of f.entries()) data.patient[k] = String(v).trim();
    save(); toast(t('Datos del paciente guardados en este dispositivo.'));
  });
  $('patientClear').addEventListener('click', async () => {
    if (await askConfirm(t('¿Limpiar los campos del formulario? Los datos guardados no se borran hasta que guardes el formulario vacío.'), t('Limpiar'))) $('patientForm').reset();
  });
  $('drawChartBtn').addEventListener('click', renderCharts);
  $('chartType').addEventListener('change', renderCharts);
  $('chartStart').addEventListener('change', renderCharts);
  $('chartEnd').addEventListener('change', renderCharts);
  $('chartAllDatesBtn').addEventListener('click', () => { $('chartStart').value = ''; $('chartEnd').value = ''; renderCharts(); });
  $('homeUpdateAverages').addEventListener('click', calculateHomePeriodAverages);
  $('nextDoseBtn').addEventListener('click', e => medTaken(e.currentTarget.dataset.id));
}
function toDataURL(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }

function openAttachment(visitId) {
  const v = data.visits.find(x => x.id === visitId); if (!v?.fileData) return;
  try {
    const [head, b64] = v.fileData.split(',');
    const mime = (head.match(/data:(.*?);/) || [])[1] || 'application/octet-stream';
    const bin = atob(b64), arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([arr], { type: mime }));
    const w = window.open(url, '_blank');
    if (!w) { toast(t('Permite ventanas emergentes para ver el adjunto.')); return; }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) { toast(t('No se pudo abrir el archivo.')); }
}
window.openAttachment = openAttachment;
function medTaken(mid) {
  const m = data.meds.find(x => x.id === mid); if (!m) return;
  m.taken = m.taken || [];
  if (m.taken.some(k => k.date === today())) { toast(t('Ya registraste esta toma hoy.')); return; }
  m.taken.push({ date: today(), time: nowTime() }); save(); toast(t('Toma registrada en el historial.'));
}
window.medTaken = medTaken;

/* ---------- Paciente y agua ---------- */
function renderPatient() {
  const f = $('patientForm'), p = data.patient || {};
  Object.keys(p).forEach(k => { if (f.elements[k] && document.activeElement !== f.elements[k]) f.elements[k].value = p[k] || ''; });
}
function renderWater() {
  const w = data.water || (data.water = { goal: 2000, interval: 60, logs: [] }), day = today();
  const logs = w.logs.filter(x => x.date === day), sum = logs.reduce((a, x) => a + (+x.ml || 0), 0);
  const goal = +w.goal || 2000, pct = Math.min(100, Math.round(sum / goal * 100));
  $('waterBig').textContent = sum + ' ml';
  $('waterGoalText').textContent = `${t('Meta diaria')}: ${goal} ml · ${pct}%`;
  $('waterSummary').textContent = `${sum} / ${goal} ml`;
  $('ringPct').textContent = pct + '%';
  $('ringFg').style.strokeDashoffset = String(289 - 289 * pct / 100);
  ['waterBar', 'waterBar2'].forEach(id => { const e = $(id); if (e) e.style.width = pct + '%'; });
  const f = $('waterSettings');
  if (document.activeElement?.form !== f) { f.elements.goal.value = goal; f.elements.interval.value = String(w.interval || 60); }
  $('waterHistory').innerHTML = logs.length ? [...logs].reverse().map(x => listItem(`${x.ml} ml`, `${esc(x.time)} · ${esc(x.date)}`, `<button class="btn ghost small" type="button" onclick="removeWater('${x.id}')">${esc(t('Eliminar'))}</button>`)).join('') : empty('Todavía no has registrado agua hoy.');
}
function addWater(ml) { data.water.logs.push({ id: uid(), date: today(), time: nowTime(), ml: +ml }); save(); toast(`+${ml} ml`); }
function removeWater(wid) { data.water.logs = data.water.logs.filter(x => x.id !== wid); save(); }
window.removeWater = removeWater;
function renderAlarms() {
  const box = $('alarmStatus');
  if (box && box.classList.contains('goodnote') && !box.dataset.custom) box.textContent = t('Los recordatorios se revisan mientras esta página está abierta.');
  $('alarmList').innerHTML = data.meds.length ? data.meds.map(m => listItem(esc(m.name), `${t('Hora programada')}: ${esc(m.time || t('sin hora'))} · ${t('Dosis')}: ${esc(m.dose || t('ver receta'))}`)).join('') : empty('Agrega medicamentos y sus horarios en la sección Medicinas.');
}
function fireReminder(title, body, key) {
  const k = 'saludplus_alarm_' + key;
  try { if (localStorage.getItem(k) === today()) return; localStorage.setItem(k, today()); } catch (e) { /* sin almacenamiento */ }
  try { if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body, icon: 'icon-192.png' }); } catch (e) { /* no soportado */ }
  const box = $('alarmStatus'); if (box) { box.className = 'notice'; box.dataset.custom = '1'; box.textContent = title + ': ' + body; }
  toast(title);
  try { if (navigator.vibrate) navigator.vibrate([180, 80, 180]); } catch (e) { /* sin vibración */ }
}
function checkReminders() {
  if (document.visibilityState !== 'visible') return;
  const now = nowTime(), day = today();
  data.meds.forEach(m => { if (m.time === now && (!m.start || m.start <= day) && (!m.end || m.end >= day)) fireReminder(t('Recordatorio de medicamento'), `${m.name} · ${m.dose}. ${t('Sigue la indicación de tu receta.')}`, 'med_' + m.id + '_' + now); });
  const w = data.water || {};
  if (w.interval && now !== '00:00') {
    const [hh, mm] = now.split(':').map(Number), mins = hh * 60 + mm;
    if (mins % (+w.interval) === 0) {
      const last = (w.logs || []).filter(x => x.date === day).slice(-1)[0];
      if (!last || mins - (+last.time.split(':')[0] * 60 + +last.time.split(':')[1]) >= +w.interval) fireReminder(t('Hora de hidratarte'), t('Si no tienes restricción de líquidos, considera registrar agua.'), 'water_' + now);
    }
  }
}
function bindWaterAndAlarms() {
  document.querySelectorAll('[data-water]').forEach(b => b.addEventListener('click', () => addWater(b.dataset.water)));
  $('waterUndo').addEventListener('click', () => {
    const a = data.water.logs.filter(x => x.date === today());
    if (a.length) { const last = a[a.length - 1]; data.water.logs = data.water.logs.filter(x => x.id !== last.id); save(); } else toast(t('No hay tomas para deshacer hoy.'));
  });
  $('waterSettings').addEventListener('submit', e => {
    e.preventDefault(); const f = new FormData(e.target);
    data.water.goal = Math.max(250, Math.min(10000, +f.get('goal') || 2000)); data.water.interval = +f.get('interval') || 60;
    save(); toast(t('Meta de agua y recordatorio guardados.'));
  });
  $('enableNotifications').addEventListener('click', async () => {
    if (!('Notification' in window)) { toast(t('Este navegador no admite notificaciones web.')); return; }
    try { const p = await Notification.requestPermission(); $('alarmStatus').dataset.custom = '1'; $('alarmStatus').textContent = p === 'granted' ? t('Notificaciones autorizadas. Recuerda que el navegador debe seguir activo.') : t('Permiso de notificaciones no concedido.'); }
    catch (e) { toast(t('No fue posible solicitar el permiso de notificaciones.')); }
  });
  $('testAlarm').addEventListener('click', () => {
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification('SaludPlus', { body: t('Las notificaciones están autorizadas.') }); } catch (e) { /* no soportado */ }
    const a = $('alarmStatus'); a.dataset.custom = '1'; a.className = 'notice'; a.textContent = t('Prueba de alarma: si no aparece una notificación del sistema, revisa los permisos del navegador.');
    toast(t('Prueba de alarma'));
  });
  setInterval(checkReminders, 15000);
}

/* ---------- Reportes ---------- */
function reportRange(period, ref) {
  const d = new Date(`${ref || today()}T12:00:00`); let start, end;
  if (period === 'week') { end = new Date(d); start = new Date(d); start.setDate(start.getDate() - 6); }
  else { start = new Date(d.getFullYear(), d.getMonth(), 1, 12); end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12); }
  return { start: isoDateLocal(start), end: isoDateLocal(end) };
}
const withinRange = (x, r) => x.date >= r.start && x.date <= r.end;
const BP_HEAD = ['Fecha', 'Hora', 'Izquierdo', 'Derecho', 'PAM izq./der.', 'Pulso izq./der.', 'Notas'];
function calculateHealthReport(startDate, endDate, label) {
  if (!startDate || !endDate) { toast(t('Selecciona una fecha inicial y una fecha final.')); return false; }
  if (startDate > endDate) { toast(t('La fecha inicial no puede ser posterior a la fecha final.')); return false; }
  const r = { start: startDate, end: endDate };
  const bps = data.bp.filter(x => withinRange(x, r)).sort(byDateAsc), gls = data.glucose.filter(x => withinRange(x, r)).sort(byDateAsc);
  const vb = bps.filter(validBP);
  const avgSys = average(vb.flatMap(x => [num(x.ls), num(x.rs)])), avgDia = average(vb.flatMap(x => [num(x.ld), num(x.rd)]));
  const avgPam = average(vb.flatMap(x => [pam(x.ls, x.ld), pam(x.rs, x.rd)]));
  const validG = gls.filter(x => Number.isFinite(num(x.value)) && num(x.value) > 0), avgG = average(validG.map(x => num(x.value)));
  const L = [average(vb.map(x => num(x.ls))), average(vb.map(x => num(x.ld)))], R = [average(vb.map(x => num(x.rs))), average(vb.map(x => num(x.rd)))];
  const bpTxt = (a, b) => a == null ? '—' : Math.round(a) + '/' + Math.round(b) + ' mmHg';
  const kpi = (l, v) => `<div class="kpi"><span>${esc(t(l))}</span><strong>${v}</strong></div>`;
  let out = `<div class="card report-block range-summary"><h3>${esc(t(label))}: ${fmtDate(r.start)} ${t('al')} ${fmtDate(r.end)}</h3><div class="kpis">
   ${kpi('Tomas válidas de presión', vb.length)}${kpi('Promedio general sistólica/diastólica', bpTxt(avgSys, avgDia))}${kpi('PAM promedio estimada', avgPam == null ? '—' : avgPam.toFixed(1) + ' mmHg')}
   ${kpi('Promedio brazo izquierdo', bpTxt(...L))}${kpi('Promedio brazo derecho', bpTxt(...R))}${kpi('Promedio de glucosa', avgG == null ? '—' : Math.round(avgG) + ' mg/dL')}${kpi('Registros de glucosa', validG.length)}
   </div><p class="fine" style="margin-top:10px">${esc(t('PAM = (sistólica + 2 × diastólica) / 3. Los resultados son descriptivos, no un diagnóstico.'))}</p></div>`;
  out += `<div class="card report-block"><h3>${esc(t('Detalle de presión arterial'))}</h3>`;
  out += vb.length ? `<div class="tablewrap"><table class="report-table"><thead><tr>${BP_HEAD.map(h => `<th>${esc(t(h))}</th>`).join('')}</tr></thead><tbody>${vb.map(x => `<tr><td>${fmtDate(x.date)}</td><td>${esc(x.time || '—')}</td><td>${num(x.ls)}/${num(x.ld)}</td><td>${num(x.rs)}/${num(x.rd)}</td><td>${pam(x.ls, x.ld).toFixed(1)} / ${pam(x.rs, x.rd).toFixed(1)}</td><td>${x.lp || '—'} / ${x.rp || '—'}</td><td>${esc(x.notes || '')}</td></tr>`).join('')}</tbody></table></div>` : empty('No hay mediciones completas de presión en el periodo seleccionado.');
  out += `</div><div class="card report-block"><h3>${esc(t('Detalle de glucosa'))}</h3>`;
  out += validG.length ? `<div class="tablewrap"><table class="report-table"><thead><tr>${['Fecha', 'Hora', 'Resultado', 'Momento', 'Notas'].map(h => `<th>${esc(t(h))}</th>`).join('')}</tr></thead><tbody>${validG.map(x => `<tr><td>${fmtDate(x.date)}</td><td>${esc(x.time || '—')}</td><td>${num(x.value)} mg/dL</td><td>${esc(t(x.when || '—'))}</td><td>${esc(x.notes || '')}</td></tr>`).join('')}</tbody></table></div>` : empty('No hay registros de glucosa válidos en el periodo.');
  out += '</div>';
  $('reportOutput').innerHTML = out;
  window.currentHealthReport = { period: 'custom', label, range: r, bps: vb, gls: validG, avgSys, avgDia, avgPam, avgG };
  window.regenReport = () => calculateHealthReport(startDate, endDate, label);
  return true;
}
function reportHtml() {
  const period = $('reportPeriod').value, r = reportRange(period, $('reportDate').value || today());
  return calculateHealthReport(r.start, r.end, period === 'week' ? 'Reporte de últimos 7 días' : 'Reporte del mes calendario');
}
function calculateDateAverages() { return calculateHealthReport($('averageStartDate').value, $('averageEndDate').value, 'Promedios por periodo seleccionado'); }

function csvCell(v) { return `"${String(v ?? '').replace(/"/g, '""')}"`; }
function downloadFile(name, text, type) {
  const blob = new Blob([text], { type }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
function exportReportCSV() {
  if (!window.currentHealthReport && !reportHtml()) return;
  const q = window.currentHealthReport; if (!q) return;
  const rows = [['SaludPlus', q.label, `${q.range.start} a ${q.range.end}`], [], ['PRESIÓN ARTERIAL', 'Fecha', 'Hora', 'Sistólica izquierda', 'Diastólica izquierda', 'Pulso izquierdo', 'Sistólica derecha', 'Diastólica derecha', 'Pulso derecho', 'Notas']];
  q.bps.forEach(x => rows.push(['Presión', x.date, x.time, x.ls, x.ld, x.lp || '', x.rs, x.rd, x.rp || '', x.notes || '']));
  rows.push([], ['GLUCOSA', 'Fecha', 'Hora', 'mg/dL', 'Momento', 'Notas']);
  q.gls.forEach(x => rows.push(['Glucosa', x.date, x.time, x.value, x.when, x.notes || '']));
  downloadFile(`saludplus-reporte-${q.period}-${q.range.start}-${q.range.end}.csv`, '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8;');
}

function clinicalReportHtml() {
  const p = data.patient || {}, escv = v => esc(v || t('No registrado'));
  const vb = data.bp.filter(validBP);
  const avgBP = average(vb.flatMap(x => [num(x.ls), num(x.rs)])), avgDia = average(vb.flatMap(x => [num(x.ld), num(x.rd)])), avgPam = average(vb.flatMap(x => [pam(x.ls, x.ld), pam(x.rs, x.rd)]));
  const gl = data.glucose.filter(x => Number.isFinite(num(x.value))).sort(byDateDesc), bp = [...vb].sort(byDateDesc);
  const meds = data.meds, visits = [...data.visits].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const upcoming = visits.filter(v => v.nextDate && v.nextDate >= today());
  const water = data.water || { goal: 2000, logs: [] }, wl = water.logs || [], todayWater = wl.filter(x => x.date === today()).reduce((s, x) => s + (num(x.ml) || 0), 0);
  const section = (title, body) => `<div class="card report-block"><h3>${esc(t(title))}</h3>${body}</div>`;
  const rows = pairs => `<div class="tablewrap"><table><tbody>${pairs.map(([k, v]) => `<tr><th>${esc(t(k))}</th><td style="white-space:normal">${escv(v)}</td></tr>`).join('')}</tbody></table></div>`;
  const tbl = (head, body) => `<div class="tablewrap"><table class="report-table"><thead><tr>${head.map(h => `<th>${esc(t(h))}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
  const kp = (l, v) => `<div class="kpi"><span>${esc(t(l))}</span><strong>${v}</strong></div>`;
  const s1 = section('1. Identificación y contacto', rows([['Nombre completo', p.name], ['Fecha de nacimiento', p.birthDate ? fmtDate(p.birthDate) : ''], ['Sexo', p.sex], ['Teléfono', p.phone], ['Correo', p.email], ['Contacto de emergencia', p.emergencyName], ['Teléfono de emergencia', p.emergencyPhone], ['Grupo sanguíneo', p.blood]]));
  const s2 = section('2. Antecedentes y seguridad médica', rows([['Padecimientos / antecedentes', p.conditions], ['Alergias a medicamentos', p.medAllergies], ['Otras alergias', p.otherAllergies], ['Medicamentos e indicaciones anotados por el paciente', p.currentMeds], ['Notas médicas importantes', p.medicalNotes]]));
  const s3 = section('3. Medicamentos registrados', meds.length ? tbl(['Medicamento', 'Dosis', 'Hora', 'Inicio', 'Fin', 'Indicaciones'], meds.map(m => `<tr><td>${esc(m.name)}</td><td>${esc(m.dose)}</td><td>${esc(m.time)}</td><td>${esc(m.start ? fmtDate(m.start) : '—')}</td><td>${esc(m.end ? fmtDate(m.end) : '—')}</td><td>${esc(m.instructions || '—')}</td></tr>`).join('')) : `<p>${esc(t('No hay medicamentos registrados.'))}</p>`);
  const s4 = section('4. Presión arterial · resumen y registros', `<div class="kpis">${kp('Registros válidos', vb.length)}${kp('Promedio sistólica', avgBP == null ? '—' : Math.round(avgBP) + ' mmHg')}${kp('Promedio diastólica', avgDia == null ? '—' : Math.round(avgDia) + ' mmHg')}${kp('PAM media aprox.', avgPam == null ? '—' : avgPam.toFixed(1) + ' mmHg')}</div>` + (bp.length ? tbl(BP_HEAD, bp.map(x => `<tr><td>${esc(fmtDate(x.date))}</td><td>${esc(x.time || '—')}</td><td>${esc(x.ls)}/${esc(x.ld)}</td><td>${esc(x.rs)}/${esc(x.rd)}</td><td>${Math.round(pam(x.ls, x.ld))} / ${Math.round(pam(x.rs, x.rd))}</td><td>${esc(x.lp || '—')} / ${esc(x.rp || '—')}</td><td>${esc(x.notes || '—')}</td></tr>`).join('')) : `<p>${esc(t('No hay mediciones de presión registradas.'))}</p>`));
  const s5 = section('5. Glucosa · historial completo', `<p><strong>${esc(t('Promedio de los registros'))}:</strong> ${gl.length ? Math.round(average(gl.map(x => num(x.value)))) + ' mg/dL' : '—'} · <strong>${esc(t('Total'))}:</strong> ${gl.length}</p>` + (gl.length ? tbl(['Fecha', 'Hora', 'Glucosa', 'Momento', 'Notas'], gl.map(x => `<tr><td>${esc(fmtDate(x.date))}</td><td>${esc(x.time || '—')}</td><td>${esc(x.value)} mg/dL</td><td>${esc(t(x.when || '—'))}</td><td>${esc(x.notes || '—')}</td></tr>`).join('')) : `<p>${esc(t('No hay registros de glucosa.'))}</p>`));
  const s6 = section('6. Consultas y próximas citas', `<p><strong>${esc(t('Citas futuras registradas'))}:</strong> ${upcoming.length}</p>` + (visits.length ? tbl(['Fecha', 'Próxima cita', 'Profesional', 'Especialidad', 'Motivo / notas', 'Archivo'], visits.map(v => `<tr><td>${esc(v.date ? fmtDate(v.date) : '—')}</td><td>${esc(v.nextDate ? fmtDate(v.nextDate) : '—')}</td><td>${esc(v.doctor || '—')}</td><td>${esc(v.specialty || '—')}</td><td>${esc(v.notes || '—')}</td><td>${esc(v.fileName || '—')}</td></tr>`).join('')) : `<p>${esc(t('No hay consultas registradas.'))}</p>`));
  const s7 = section('7. Hidratación', `<p><strong>${esc(t('Meta diaria configurada'))}:</strong> ${num(water.goal) || 2000} ml</p><p><strong>${esc(t('Consumo anotado hoy'))} (${fmtDate(today())}):</strong> ${todayWater} ml</p><p><strong>${esc(t('Registros totales de agua'))}:</strong> ${wl.length}</p>`);
  $('reportOutput').innerHTML = `<div class="card report-block"><h2>${esc(t('Reporte clínico personal'))}</h2><p><strong>${esc(t('Generado'))}:</strong> ${esc(new Date().toLocaleString(locale()))}</p><p class="muted">${esc(t('Documento compilado a partir de la información guardada en este dispositivo. Los campos no completados se muestran como “No registrado”.'))}</p></div>${s1}${s2}${s3}${s4}${s5}${s6}${s7}${examReportSection(section, tbl)}<p class="notice">${esc(t('Este documento organiza datos introducidos por el usuario; no es una valoración médica ni sustituye el expediente oficial o el criterio de un profesional sanitario. Verifica los datos antes de compartirlo.'))}</p>`;
  window.regenReport = clinicalReportHtml;
  window.currentHealthReport = { period: 'clinical', label: 'Reporte clínico personal', range: { start: 'todos', end: today() }, bps: vb, gls: gl, avgSys: avgBP, avgDia, avgPam, avgG: gl.length ? average(gl.map(x => num(x.value))) : null };
}
function bindReports() {
  $('generateReportBtn').addEventListener('click', reportHtml);
  $('clinicalReportBtn').addEventListener('click', () => { clinicalReportHtml(); $('reportOutput').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('calculateDateAveragesBtn').addEventListener('click', calculateDateAverages);
  $('reportPeriod').addEventListener('change', reportHtml);
  $('reportDate').addEventListener('change', reportHtml);
  $('exportReportBtn').addEventListener('click', exportReportCSV);
  $('printReportBtn').addEventListener('click', () => { if (!window.currentHealthReport && !reportHtml()) return; window.print(); });
  const end = $('averageEndDate'), start = $('averageStartDate'), ref = $('reportDate');
  if (!end.value) end.value = today();
  if (!start.value) { const d = new Date(); d.setDate(d.getDate() - 6); start.value = isoDateLocal(d); }
  if (!ref.value) ref.value = today();
}

/* ---------- Respaldo ---------- */
function bindBackup() {
  $('exportBtn').addEventListener('click', () => {
    downloadFile(`saludplus-backup-${today()}.json`, JSON.stringify({ app: 'SaludPlus', version: 2, exportedAt: new Date().toISOString(), data }, null, 2), 'application/json');
    toast(t('Respaldo creado.'));
  });
  $('importBtn').addEventListener('click', () => {
    const file = $('importFile').files[0];
    if (!file) { toast(t('Selecciona un archivo de respaldo.')); return; }
    const r = new FileReader();
    r.onload = async () => {
      try {
        const incoming = JSON.parse(r.result).data;
        if (!incoming || !Array.isArray(incoming.bp) || !Array.isArray(incoming.glucose) || !Array.isArray(incoming.meds) || !Array.isArray(incoming.visits)) throw new Error('formato');
        if (!await askConfirm(t('Esto reemplazará todos los datos actuales. ¿Deseas continuar?'), t('Restaurar'))) return;
        data = { ...emptyData(), ...incoming }; data.water = { ...emptyData().water, ...(incoming.water || {}) }; data.water.logs = data.water.logs || []; examsNormalize();
        save(); toast(t('Respaldo restaurado.'));
      } catch (err) { toast(t('No se pudo restaurar: el archivo no parece un respaldo válido.')); }
    };
    r.readAsText(file);
  });
  $('clearBtn').addEventListener('click', async () => {
    if (await askConfirm(t('¿Seguro que quieres borrar permanentemente todos los datos guardados en este navegador?'), t('Borrar todo'))) { for (const r of (data.examResults || [])) for (const f of (r.files || [])) await FileStore.del(f.id); data = emptyData(); save(); toast(t('Datos borrados.')); }
  });
}

/* ---------- Arranque ---------- */
function init() {
  buildNav(); bindForms(); bindWaterAndAlarms(); bindReports(); bindBackup(); bindExams(); bindExamReport();
  const d = new Date(); $('chartStart').value = ''; $('chartEnd').value = '';
  setDefaults();
  const f = $('extraControlForm'); f.elements.date.value = today(); f.elements.time.value = nowTime();
  document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => { applyLanguage(b.dataset.lang); render(); if (window.regenReport) window.regenReport(); if (typeof chatRefreshLanguage === 'function') chatRefreshLanguage(); }));
  const hash = (location.hash || '').replace('#', '');
  render(); showView($(hash) && document.querySelector('.view#' + hash) ? hash : 'inicio');
  reportHtml();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') render(); });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
}
document.addEventListener('DOMContentLoaded', init);
