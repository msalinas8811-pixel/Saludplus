/* SaludPlus v23 · asistente de salud con IA
   El navegador solo habla con TU servidor (backend/). La clave del proveedor de IA vive únicamente en ese servidor. */
'use strict';

const AI_URL_KEY = 'saludplus_ai_server_url';
let chatMode = 'general';
let chatBusy = false;
let attached = null; // { label, resultId?, file?: File } · resultado elegido para que la IA lo lea
const chatHistory = []; // solo en memoria: las conversaciones no se guardan en el dispositivo

const RED_FLAGS = [
  /dolor (fuerte |intenso )?(de|en el) pecho/i, /presi[oó]n en el pecho/i, /no (puedo|logro) respirar/i, /falta de aire (repentina|severa)/i,
  /desmay/i, /perd[ií] el conocimiento/i, /convulsi/i, /(cara|boca) (ca[ií]da|torcida)/i, /(no|dificultad para) (puedo )?hablar/i,
  /debilidad (repentina|en un lado)/i, /sangrado (abundante|que no para)/i, /pensamientos? de (hacerme da[ñn]o|suicid)/i, /quiero morir/i, /sobredosis/i, /envenen/i,
  /chest pain/i, /can'?t breathe/i, /trouble breathing/i, /stroke/i, /seizure/i, /overdose/i, /suicid/i
];
const CHIPS = {
  general: ['¿Qué significa una presión de 130/85?', '¿Cómo me preparo para medir la presión en casa?', '¿Qué preguntas debo llevar a mi consulta?', '¿Qué alimentos ayudan a controlar la glucosa?'],
  result: ['Explícame este resultado en palabras sencillas', '¿Qué valores están fuera de rango?', '¿Qué preguntas llevo a mi médico sobre este resultado?', '¿Qué hábitos podrían ayudar a mejorar estos valores?'],
  personal: ['¿Cómo han estado mis mediciones últimamente?', '¿Hay algo en mis registros que deba comentar con mi médico?', 'Ayúdame a preparar mi próxima consulta', '¿Cómo va mi consumo de agua?']
};

const aiBase = () => (localStorage.getItem(AI_URL_KEY) || '').trim().replace(/\/$/, '');

function renderMarkdown(text) {
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,;:]|$)/g, '$1<em>$2</em>');
  const out = []; let list = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  String(text).replace(/\r/g, '').split('\n').forEach(raw => {
    const line = raw.trim();
    let m;
    if (!line) { close(); return; }
    if ((m = line.match(/^[-*•]\s+(.*)/))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push(`<li>${inline(m[1])}</li>`); return; }
    if ((m = line.match(/^\d+[.)]\s+(.*)/))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push(`<li>${inline(m[1])}</li>`); return; }
    close();
    out.push(`<p>${inline(line.replace(/^#{1,4}\s+/, ''))}</p>`);
  });
  close();
  return out.join('');
}

function chatAdd(role, text, opts = {}) {
  const log = $('chatLog'), el = document.createElement('div');
  el.className = `msg ${role}${opts.error ? ' error' : ''}`;
  const avatar = role === 'assistant' ? '<img src="saludplus-logo.svg" alt="" aria-hidden="true">' : '';
  el.innerHTML = `${avatar}<div class="bubble">${role === 'assistant' && !opts.plain ? renderMarkdown(text) : (opts.html || esc(text))}</div>`;
  log.appendChild(el);
  el.scrollIntoView({ block: 'end', behavior: 'smooth' });
  return el;
}
function chatWelcome() {
  $('chatLog').innerHTML = '';
  chatAdd('assistant', t('Hola. Puedo ayudarte a entender información general de salud y a preparar preguntas para tu profesional sanitario. No diagnostico ni indico tratamientos.'));
  renderChips();
}
function renderChips() {
  $('chips').innerHTML = (attached ? CHIPS.result : CHIPS[chatMode]).map(q => `<button type="button">${esc(t(q))}</button>`).join('');
  $('chips').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { $('chatInput').value = b.textContent; sendAiMessage(); }));
}
function chatRefreshLanguage() { if (!chatHistory.length) chatWelcome(); else renderChips(); }

function setMode(mode) {
  chatMode = mode;
  document.querySelectorAll('#modeSeg button').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  $('consentBox').hidden = mode !== 'personal';
  if (!chatHistory.length) renderChips();
}

function compactHealthContext(includeProfile, includeExams) {
  const take = (arr, n) => Array.isArray(arr) ? arr.slice(-n).map(x => ({ date: x.date, time: x.time, value: x.value, ls: x.ls, ld: x.ld, rs: x.rs, rd: x.rd, when: x.when, ml: x.ml })) : [];
  const ctx = {
    bloodPressure: take([...data.bp].sort(byDateAsc), 20), glucose: take([...data.glucose].sort(byDateAsc), 20),
    pulse: take(data.pulse, 20), weight: take(data.weight, 20), waterLogs: take(data.water?.logs, 30),
    waterGoal: data.water?.goal,
    medications: (data.meds || []).slice(0, 20).map(m => ({ name: m.name, dose: m.dose, time: m.time })),
    visits: (data.visits || []).slice(0, 10).map(v => ({ date: v.date, nextDate: v.nextDate, reason: v.specialty }))
  };
  if (includeProfile) {
    const p = data.patient || {};
    ctx.profile = { conditions: p.conditions || '', medAllergies: p.medAllergies || '', otherAllergies: p.otherAllergies || '' };
  }
  if (includeExams) {
    ctx.exams = {
      scheduled: (data.examPlans || []).slice(0, 30).map(p => ({ name: p.name, category: p.cat, everyMonths: p.months, last: p.lastDate, next: p.nextDate })),
      results: [...(data.examResults || [])].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 20).map(r => ({ name: r.name, date: r.date, overall: r.status, items: resultEntries(r).map(entryText).join('; ').slice(0, 450), summary: r.summary }))
    };
  }
  return ctx;
}


/* ---------- Resultado de examen adjunto ---------- */
function refreshExamPick() {
  const sel = $('chatExamPick'), keep = sel.value;
  const rs = [...(data.examResults || [])].filter(r => (r.files && r.files.length) || r.text || r.summary).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  sel.innerHTML = `<option value="">${esc(t('Leer un resultado de examen…'))}</option>` + rs.map(r => `<option value="${r.id}">${esc(r.name)} · ${esc(fmtDate(r.date))}</option>`).join('');
  sel.value = rs.some(r => r.id === keep) ? keep : '';
}
function setAttached(a) {
  attached = a;
  $('attachInfo').hidden = !a;
  $('attachName').textContent = a ? a.label : '';
  $('attachConsent').checked = false;
  if (!a) { $('chatExamPick').value = ''; }
  if (!chatHistory.length) renderChips();
}
function chatSelectResult(id) {
  refreshExamPick();
  const r = (data.examResults || []).find(x => x.id === id); if (!r) return;
  $('chatExamPick').value = id;
  setAttached({ label: `${r.name} · ${fmtDate(r.date)}`, resultId: id });
  chatClearHistory();
  setTimeout(() => $('attachBox').scrollIntoView({ block: 'center', behavior: 'smooth' }), 100);
}
function chatClearHistory() { chatHistory.length = 0; chatWelcome(); }

/* Convierte lo adjunto en el paquete que recibe el servidor. */
async function buildAttachments() {
  if (!attached) return null;
  const items = [], notes = [];
  if (attached.file) items.push(await prepareAiFile(attached.file, attached.file.name));
  if (attached.resultId) {
    const r = (data.examResults || []).find(x => x.id === attached.resultId);
    if (r) {
      notes.push(examResultNotes(r));
      if (r.text) items.push({ type: 'text', name: 'texto del resultado', text: r.text });
      for (const f of (r.files || []).slice(0, 3)) {
        const blob = await FileStore.get(f.id);
        if (blob) items.push(await prepareAiFile(blob, f.name));
      }
    }
  }
  return { items, notes: notes.join('\n') };
}

function setBusy(on) {
  chatBusy = on;
  const btn = document.querySelector('#chatForm button[type="submit"]'); if (btn) btn.disabled = on;
}

async function sendAiMessage() {
  if (chatBusy) return;
  const input = $('chatInput'), q = input.value.trim();
  if (!q) return;
  if (chatMode === 'personal' && !$('personalConsent').checked) {
    chatAdd('assistant', t('Para usar «Con mis registros», primero marca la autorización. No se ha enviado ningún dato.'), { error: true });
    $('consentBox').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (attached && !$('attachConsent').checked) {
    chatAdd('assistant', t('Marca la autorización para enviar el resultado a la IA. No se ha enviado nada.'), { error: true });
    $('attachInfo').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const base = aiBase();
  chatAdd('user', attached ? `${q}\n📎 ${attached.label}` : q); input.value = ''; autoGrow();
  if (RED_FLAGS.some(r => r.test(q))) {
    chatAdd('assistant', '', { plain: true, html: `<div class="alert-red"><svg class="i"><use href="#i-alert"/></svg><span>${esc(t('Lo que describes puede ser una urgencia. Llama ahora al número de emergencias de tu país o acude al servicio de urgencias más cercano. No esperes una respuesta de este chat.'))}</span></div>` });
  }
  if (!base) {
    chatAdd('assistant', t('Falta conectar el servidor de IA. Abre «Conexión con el servidor de IA», más abajo, y pega su dirección.'), { error: true });
    $('aiSettings').open = true; return;
  }
  setBusy(true);
  const pending = chatAdd('assistant', '', { plain: true, html: '<span class="typing" aria-label="Escribiendo"><i></i><i></i><i></i></span>' });
  try {
    const payload = { mode: chatMode, lang: currentLang, question: q, history: chatHistory.slice(-8) };
    if (chatMode === 'personal') payload.healthContext = compactHealthContext($('includeProfile').checked, $('includeExams').checked);
    const pack = await buildAttachments();
    if (pack && (pack.items.length || pack.notes)) { payload.attachments = pack.items; payload.examNotes = pack.notes; }
    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), pack && pack.items.length ? 100000 : 45000);
    let res;
    try { res = await fetch(base + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal }); }
    finally { clearTimeout(timer); }
    let body = {}; try { body = await res.json(); } catch (e) { /* respuesta sin JSON */ }
    if (!res.ok) throw new Error(body.error || `${t('El servidor respondió con código')} ${res.status}`);
    if (!body.answer) throw new Error(t('El servidor no devolvió una respuesta.'));
    chatHistory.push({ role: 'user', content: q }, { role: 'assistant', content: body.answer });
    pending.querySelector('.bubble').innerHTML = renderMarkdown(body.answer);
  } catch (err) {
    pending.classList.add('error');
    const msg = err.name === 'AbortError' ? t('El servidor tardó demasiado en responder. Inténtalo de nuevo.') : err.message;
    pending.querySelector('.bubble').textContent = `${t('No se pudo obtener respuesta')}: ${msg}`;
    // Si el servidor estaba dormido (hosting gratuito), la primera consulta suele fallar.
  } finally { setBusy(false); pending.scrollIntoView({ block: 'end', behavior: 'smooth' }); }
}

function autoGrow() { const i = $('chatInput'); i.style.height = 'auto'; i.style.height = Math.min(i.scrollHeight, 140) + 'px'; }

async function testServer() {
  const status = $('aiServerStatus'), dot = $('aiDot'), u = aiBase();
  if (!u) { status.textContent = t('Escribe primero la dirección del servidor.'); dot.className = 'dot'; return; }
  status.textContent = t('Probando… si el servidor estaba dormido puede tardar hasta un minuto.'); dot.className = 'dot';
  try {
    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 60000);
    const r = await fetch(u + '/health', { signal: ctrl.signal }); clearTimeout(timer);
    const j = await r.json();
    if (r.ok && j.ok && j.configured) { status.textContent = t('Conexión correcta. El servidor tiene la clave de IA configurada.'); dot.className = 'dot on'; }
    else if (r.ok && j.ok) { status.textContent = t('El servidor responde, pero aún no tiene configurada la clave de IA (OPENAI_API_KEY).'); dot.className = 'dot off'; }
    else { status.textContent = t('El servidor respondió, pero no confirmó disponibilidad.'); dot.className = 'dot off'; }
  } catch (e) { status.textContent = t('No se pudo conectar. Revisa la dirección, que el servicio esté activo y la configuración CORS.'); dot.className = 'dot off'; }
}

function chatOnShow() {
  refreshExamPick();
  if (!$('chatLog').children.length) chatWelcome();
  if (!aiBase()) $('aiSettings').open = true;
  setTimeout(() => $('chatInput').focus({ preventScroll: true }), 150);
}

document.addEventListener('DOMContentLoaded', () => {
  $('aiServerUrl').value = aiBase();
  $('aiDot').className = 'dot';
  document.querySelectorAll('#modeSeg button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $('chatForm').addEventListener('submit', e => { e.preventDefault(); sendAiMessage(); });
  $('chatInput').addEventListener('input', autoGrow);
  $('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } });
  $('chatClear').addEventListener('click', () => { setAttached(null); chatClearHistory(); });
  $('chatExamPick').addEventListener('change', e => { const r = (data.examResults || []).find(x => x.id === e.target.value); if (!r) { setAttached(null); return; } setAttached({ label: `${r.name} · ${fmtDate(r.date)}`, resultId: r.id }); });
  $('chatAttachBtn').addEventListener('click', () => $('chatFile').click());
  $('chatFile').addEventListener('change', e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    if (!/pdf/i.test(f.type) && !/\.pdf$/i.test(f.name) && !/^image\//i.test(f.type)) { toast(t('Formato no admitido. Usa PDF o imagen.')); return; }
    if (f.size > 8 * 1024 * 1024) { toast(t('Cada archivo debe pesar menos de 8 MB.')); return; }
    $('chatExamPick').value = ''; setAttached({ label: f.name, file: f }); chatClearHistory();
  });
  $('attachClear').addEventListener('click', () => setAttached(null));
  $('saveAiServerBtn').addEventListener('click', () => {
    const u = $('aiServerUrl').value.trim().replace(/\/$/, '');
    if (u && !/^https:\/\//i.test(u)) { $('aiServerStatus').textContent = t('La dirección debe comenzar con https://'); return; }
    try { localStorage.setItem(AI_URL_KEY, u); } catch (e) { /* sin almacenamiento */ }
    $('aiServerStatus').textContent = u ? t('Dirección guardada en este dispositivo.') : t('Dirección eliminada.');
  });
  $('testAiServerBtn').addEventListener('click', testServer);
});
