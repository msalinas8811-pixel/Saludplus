/* Guía de presión arterial: medir bien, interpretar una lectura, hábitos y cuándo pedir ayuda. Informativa, no diagnostica. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var TABS = [['medir', '🩺', 'Medir'], ['lectura', '📈', 'Mi lectura'], ['mejorar', '💪', 'Mejorar'], ['ayuda', '🚨', 'Ayuda']];
  var STEPS = [
    ['☕', 'Sin café, ejercicio ni tabaco', 'Espera al menos 30 minutos antes de medir.'],
    ['🚻', 'Ve al baño primero', 'La vejiga llena puede subir la lectura.'],
    ['🪑', 'Siéntate con la espalda apoyada', 'Pies planos en el suelo y piernas sin cruzar.'],
    ['💪', 'Brazo apoyado a la altura del corazón', 'Sobre una mesa, con la palma hacia arriba y sin ropa apretada.'],
    ['⌚', 'Brazalete bien puesto', 'Sobre la piel, 2 a 3 cm arriba del pliegue del codo y del tamaño correcto.'],
    ['🤫', 'Quieto y en silencio', 'No hables, no mires el celular y respira tranquilo mientras mide.'],
    ['🔁', 'Mide dos veces', 'Espera 1 minuto entre mediciones y anota las dos.']
  ];
  var HABITS = [
    ['🧂', 'Comí con poca sal', 'Menos de 1 cucharadita (5 g) de sal al día, contando la de los alimentos procesados.'],
    ['🥗', 'Comí frutas y verduras', 'Llena la mitad del plato con verduras y suma fruta. La dieta DASH ayuda a bajar la presión.'],
    ['🚶', 'Me moví 30 minutos', 'Caminar a paso rápido la mayoría de los días. La meta es 150 minutos por semana.'],
    ['💧', 'Tomé suficiente agua', 'Prefiere agua y evita bebidas azucaradas y energéticas.'],
    ['😴', 'Dormí 7 a 8 horas', 'Dormir mal sube la presión. Acuéstate a la misma hora.'],
    ['🧘', 'Descansé unos minutos', 'Respira lento 5 minutos: inhala 4 segundos, exhala 6.'],
    ['💊', 'Tomé mis medicinas como indicó el médico', 'No las cambies ni las suspendas por tu cuenta.']
  ];
  var TIPS = [
    ['🧂', 'Reduce la sal', 'Cocina con hierbas, limón y ajo. Revisa las etiquetas: embutidos, sopas instantáneas, salsas y snacks suelen traer mucho sodio.'],
    ['⚖️', 'Cuida tu peso', 'Bajar aunque sea unos kilos si hay sobrepeso suele bajar la presión. Hazlo de forma gradual.'],
    ['🚭', 'No fumes', 'El tabaco sube la presión al momento y daña las arterias. Pide ayuda para dejarlo.'],
    ['🍷', 'Modera el alcohol', 'Cuanto menos, mejor. Si tomas, que sea poco y no a diario.'],
    ['🍌', 'Come alimentos con potasio', 'Banano, frijoles, papa con cáscara y vegetales de hoja ayudan. Si tienes problemas de riñón, consulta antes.'],
    ['📓', 'Mide en casa y anota', 'Mide a la misma hora, por la mañana y por la noche, 7 días seguidos antes de tu cita. SaludPlus lo organiza en Reportes.']
  ];

  var VID = [
    ['Antes: sin café, ejercicio ni tabaco', 'Espera 30 minutos. Todo eso sube la presión por un rato y falsea la lectura.'],
    ['Ve al baño primero', 'Con la vejiga llena, la lectura sale más alta de lo real.'],
    ['Siéntate bien', 'Espalda apoyada, pies planos en el piso y piernas sin cruzar. Descansa 5 minutos.'],
    ['Brazo a la altura del corazón', 'Apóyalo sobre una mesa, con la palma hacia arriba y sin ropa apretada.'],
    ['Coloca el brazalete', 'Sobre la piel, 2 a 3 cm arriba del pliegue del codo. Ni flojo ni muy apretado.'],
    ['Quieto y en silencio', 'No hables ni uses el celular. Respira tranquilo mientras mide.'],
    ['Mide dos veces', 'Espera 1 minuto entre mediciones y anota las dos lecturas.']
  ];
  function vidSvg() {
    var X = function (n) { return ' class="gdv-sc gdv-s' + n + '"'; };
    return '<svg viewBox="0 0 320 200" role="img" aria-label="Animación de cómo medir la presión arterial">' +
      '<defs><linearGradient id="gdvbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf3ff"/><stop offset="1" stop-color="#cfe3fb"/></linearGradient></defs>' +
      '<rect width="320" height="200" rx="18" fill="url(#gdvbg)"/>' +
      '<rect x="0" y="184" width="320" height="16" fill="#b9d2f3"/>' +
      /* silla */
      '<rect x="64" y="80" width="7" height="64" rx="3" fill="#9aa9c9"/><rect x="66" y="137" width="70" height="7" rx="3" fill="#9aa9c9"/><rect x="72" y="144" width="6" height="40" fill="#9aa9c9"/><rect x="126" y="144" width="6" height="40" fill="#9aa9c9"/>' +
      /* mesa */
      '<rect x="184" y="118" width="128" height="8" rx="3" fill="#c9a27a"/><rect x="194" y="126" width="7" height="58" fill="#b08d68"/><rect x="298" y="126" width="7" height="58" fill="#b08d68"/>' +
      /* persona */
      '<rect x="86" y="136" width="62" height="13" rx="6" fill="#2c5fc7"/><rect x="141" y="142" width="12" height="40" rx="5" fill="#2c5fc7"/><rect x="141" y="180" width="26" height="6" rx="3" fill="#1d3a73"/>' +
      '<g class="gdv-torso"><rect x="78" y="82" width="36" height="58" rx="14" fill="#4f8be0"/></g>' +
      '<circle cx="97" cy="62" r="17" fill="#f2c9a0"/><path d="M80 58a17 17 0 0 1 34-3c-8 2-20 2-34 3z" fill="#4a3a30"/><circle cx="105" cy="63" r="1.8" fill="#4a3a30"/>' +
      '<path d="M104 98L150 113" stroke="#4f8be0" stroke-width="13" stroke-linecap="round"/>' +
      '<g class="gdv-arm"><rect x="146" y="107" width="76" height="11" rx="5.5" fill="#f2c9a0"/></g>' +
      '<path d="M99 100c-4-5-11-1-7 5l7 7 7-7c4-6-3-10-7-5z" fill="#e8445f" class="gdv-heart"/>' +
      /* brazalete y tubo */
      '<g class="gdv-cuff"><rect x="124" y="97" width="22" height="20" rx="5" transform="rotate(18 135 107)" fill="#2a56e8"/><rect x="128" y="101" width="14" height="4" rx="2" transform="rotate(18 135 107)" fill="#8fb4ff"/></g>' +
      '<path d="M142 99C168 80 202 80 226 100" fill="none" stroke="#2a56e8" stroke-width="3" stroke-linecap="round"/>' +
      /* tensiómetro */
      '<rect x="226" y="92" width="48" height="26" rx="6" fill="#fff" stroke="#2a56e8" stroke-width="2"/>' +
      '<text x="250" y="109" text-anchor="middle" font-size="11" font-weight="800" fill="#0b1f4d" class="gdv-dsp0">--/--</text>' +
      '<text x="250" y="109" text-anchor="middle" font-size="11" font-weight="800" fill="#12805a" class="gdv-dsp1">118/76</text>' +
      /* escena 1 */
      '<g' + X(1) + '><text x="196" y="62" font-size="30" text-anchor="middle">☕</text><text x="236" y="62" font-size="30" text-anchor="middle">🏃</text><text x="276" y="62" font-size="30" text-anchor="middle">🚬</text>' +
        '<g stroke="#d62d46" stroke-width="3.5" fill="none" stroke-linecap="round" class="gdv-no"><circle cx="196" cy="52" r="19"/><path d="M183 65L209 39"/><circle cx="236" cy="52" r="19"/><path d="M223 65L249 39"/><circle cx="276" cy="52" r="19"/><path d="M263 65L289 39"/></g>' +
        '<rect x="204" y="76" width="72" height="22" rx="11" fill="#2a56e8"/><text x="240" y="91" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">30 min antes</text></g>' +
      /* escena 2 */
      '<g' + X(2) + '><g class="gdv-bounce"><text x="240" y="66" font-size="44" text-anchor="middle">🚻</text></g><rect x="200" y="74" width="80" height="22" rx="11" fill="#2a56e8"/><text x="240" y="89" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">Antes de medir</text></g>' +
      /* escena 3 */
      '<g' + X(3) + '><g class="gdv-pop"><circle cx="58" cy="108" r="11" fill="#22a86b"/><path d="M52 108l4 4 7-8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g><g class="gdv-pop gdv-d2"><circle cx="172" cy="176" r="11" fill="#22a86b"/><path d="M166 176l4 4 7-8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>' +
        '<text x="40" y="146" font-size="10" font-weight="800" fill="#12805a" text-anchor="middle">Espalda</text><text x="176" y="158" font-size="10" font-weight="800" fill="#12805a" text-anchor="middle">Pies planos</text></g>' +
      /* escena 4 */
      '<g' + X(4) + '><path d="M108 108H224" stroke="#e8445f" stroke-width="2.5" stroke-dasharray="6 5" fill="none" class="gdv-dash"/><rect x="196" y="76" width="112" height="22" rx="11" fill="#e8445f"/><text x="252" y="91" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">Altura del corazón</text></g>' +
      /* escena 5 */
      '<g' + X(5) + '><g class="gdv-bracket"><path d="M124 86V80H152V86" stroke="#2a56e8" stroke-width="2.5" fill="none" stroke-linecap="round"/></g><rect x="106" y="56" width="92" height="22" rx="11" fill="#2a56e8"/><text x="152" y="71" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">2–3 cm del codo</text></g>' +
      /* escena 6 */
      '<g' + X(6) + '><text x="132" y="44" font-size="26" class="gdv-bounce">🤫</text><text x="236" y="62" font-size="30" text-anchor="middle">📵</text><path d="M60 40q8 6 0 12M70 34q12 12 0 24" stroke="#4f8be0" stroke-width="2.5" fill="none" stroke-linecap="round" class="gdv-wave"/></g>' +
      /* escena 7 */
      '<g' + X(7) + '><rect x="190" y="30" width="56" height="22" rx="11" fill="#22a86b"/><text x="218" y="45" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">1.ª lectura</text><rect x="252" y="30" width="56" height="22" rx="11" fill="#2a56e8" class="gdv-second"/><text x="280" y="45" text-anchor="middle" font-size="10" font-weight="800" fill="#fff" class="gdv-second">2.ª lectura</text><text x="250" y="68" text-anchor="middle" font-size="10" font-weight="800" fill="#31456f">espera 1 minuto</text></g>' +
      '</svg>';
  }
  var ZONES = [
    { k: 'low', c: '#4a8bd8', t: 'Más baja de lo habitual', d: 'Una presión baja es común en algunas personas. Si tienes mareo, visión borrosa o desmayos, consulta a tu médico.' },
    { k: 'normal', c: '#22a86b', t: 'Normal', d: 'Muy bien. Mantén tus hábitos y sigue midiendo de vez en cuando.' },
    { k: 'elev', c: '#d6a900', t: 'Elevada', d: 'Está un poco alta. Cuida la sal, muévete y vuelve a medir en los próximos días.' },
    { k: 's1', c: '#ee8a1c', t: 'Hipertensión etapa 1', d: 'Si se repite en varias mediciones, coméntalo con tu médico. Lleva tu registro de 7 días.' },
    { k: 's2', c: '#e0452f', t: 'Hipertensión etapa 2', d: 'Pide una cita pronto. Si ya tomas medicinas, no las cambies sin consultar.' },
    { k: 'crisis', c: '#b3122a', t: 'Lectura muy alta', d: 'Descansa 5 minutos y mide otra vez. Si sigue así o tienes dolor de pecho, falta de aire, dolor de cabeza fuerte, visión borrosa o debilidad, busca atención urgente.' }
  ];
  function zone(s, d) {
    if (s > 180 || d > 120) return ZONES[5];
    if (s >= 140 || d >= 90) return ZONES[4];
    if (s >= 130 || d >= 80) return ZONES[3];
    if (s >= 120) return ZONES[2];
    if (s < 90 || d < 60) return ZONES[0];
    return ZONES[1];
  }
  var iso = function (d) { var z = function (n) { return ('0' + n).slice(-2); }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); };
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  var timer = { left: 300, run: false, id: null };

  function html() {
    var steps = STEPS.map(function (s, i) { return '<button type="button" class="gd-step" data-i="' + i + '" aria-pressed="false"><span class="gd-ck" aria-hidden="true"></span><span class="gd-emoji" aria-hidden="true">' + s[0] + '</span><span class="gd-tx"><b>' + s[1] + '</b><small>' + s[2] + '</small></span></button>'; }).join('');
    var habits = HABITS.map(function (s, i) { return '<button type="button" class="gd-step gd-habit" data-h="' + i + '" aria-pressed="false"><span class="gd-ck" aria-hidden="true"></span><span class="gd-emoji" aria-hidden="true">' + s[0] + '</span><span class="gd-tx"><b>' + s[1] + '</b><small>' + s[2] + '</small></span></button>'; }).join('');
    var tips = TIPS.map(function (s) { return '<details class="gd-tip"><summary><span class="gd-emoji" aria-hidden="true">' + s[0] + '</span><b>' + s[1] + '</b><i aria-hidden="true">›</i></summary><p>' + s[2] + '</p></details>'; }).join('');
    return '' +
      '<div class="gd-panel" data-p="medir">' +
        '<div class="gd-card gd-video"><h3>🎬 Mira cómo se mide</h3><div class="gdv" id="gdv" data-s="1">' + vidSvg() + '</div>' +
          '<div class="gdv-bar"><i id="gdvBar"></i></div>' +
          '<div class="gdv-cap"><b id="gdvTitle"></b><span id="gdvText"></span></div>' +
          '<div class="gdv-ctl"><button type="button" class="gd-btn ghost" id="gdvPrev" aria-label="Paso anterior">‹</button><button type="button" class="gd-btn" id="gdvPlay">Pausar</button><button type="button" class="gd-btn ghost" id="gdvNext" aria-label="Paso siguiente">›</button></div>' +
          '<div class="gdv-dots" id="gdvDots"></div></div>' +
        '<div class="gd-card gd-timer"><h3>1 · Descansa 5 minutos</h3><p class="gd-sub">Antes de medir, quédate sentado y tranquilo. Usa el reloj.</p>' +
          '<div class="gd-time" id="gdTime" aria-live="off">5:00</div><div class="gd-bar"><i id="gdTimeBar"></i></div>' +
          '<div class="gd-row"><button type="button" class="gd-btn" id="gdStart">Empezar reposo</button><button type="button" class="gd-btn ghost" id="gdReset" aria-label="Reiniciar reloj">Reiniciar</button></div>' +
          '<p class="gd-done" id="gdTimeDone" hidden>✅ ¡Listo! Ya puedes medir.</p></div>' +
        '<div class="gd-card"><h3>2 · Prepárate</h3><div class="gd-prog"><span id="gdProgTx">0 de ' + STEPS.length + ' listos</span><div class="gd-bar"><i id="gdProgBar"></i></div></div><div class="gd-list">' + steps + '</div>' +
          '<div class="gd-ready" id="gdReady" hidden><b>¡Todo listo! 🎉</b><span>Mide dos veces y anota las lecturas.</span><button type="button" class="gd-btn" onclick="showView(\'presion\')">Registrar mi medición</button></div></div>' +
      '</div>' +
      '<div class="gd-panel" data-p="lectura" hidden>' +
        '<div class="gd-card"><h3>¿Cómo está mi lectura?</h3><p class="gd-sub">Escribe tus números y mira en qué zona caen.</p>' +
          '<div class="gd-inputs"><label>Sistólica (alta)<input id="gdSys" type="number" inputmode="numeric" min="50" max="260" placeholder="120"></label><label>Diastólica (baja)<input id="gdDia" type="number" inputmode="numeric" min="30" max="160" placeholder="80"></label></div>' +
          '<button type="button" class="gd-btn ghost" id="gdLast">Usar mi última medición</button>' +
          '<div class="gd-scale" aria-hidden="true"><span style="background:#4a8bd8"></span><span style="background:#22a86b"></span><span style="background:#d6a900"></span><span style="background:#ee8a1c"></span><span style="background:#e0452f"></span><span style="background:#b3122a"></span><em id="gdDot"></em></div>' +
          '<div class="gd-result" id="gdResult"><b>Escribe tus dos números</b><span>Por ejemplo 120 y 80.</span></div>' +
          '<p class="gd-fine">Es información general. Una sola lectura no da un diagnóstico: lo importante es el promedio de varios días. Solo tu médico puede interpretarla.</p></div>' +
        '<div class="gd-card"><h3>Las zonas, de un vistazo</h3><div class="gd-legend">' +
          '<div><i style="background:#22a86b"></i><b>Normal</b><span>menos de 120 y 80</span></div>' +
          '<div><i style="background:#d6a900"></i><b>Elevada</b><span>120–129 y menos de 80</span></div>' +
          '<div><i style="background:#ee8a1c"></i><b>Etapa 1</b><span>130–139 u 80–89</span></div>' +
          '<div><i style="background:#e0452f"></i><b>Etapa 2</b><span>140 o más, o 90 o más</span></div>' +
          '<div><i style="background:#b3122a"></i><b>Muy alta</b><span>más de 180 o más de 120</span></div></div></div>' +
      '</div>' +
      '<div class="gd-panel" data-p="mejorar" hidden>' +
        '<div class="gd-card"><h3>Mis hábitos de hoy</h3><div class="gd-prog"><span id="gdHabTx">0 de ' + HABITS.length + '</span><div class="gd-bar"><i id="gdHabBar"></i></div></div><div class="gd-list">' + habits + '</div><p class="gd-msg" id="gdHabMsg"></p></div>' +
        '<div class="gd-card"><h3>Consejos que ayudan</h3><div class="gd-tips">' + tips + '</div></div>' +
      '</div>' +
      '<div class="gd-panel" data-p="ayuda" hidden>' +
        '<div class="gd-alert red"><b>🚑 Busca atención urgente</b><p>Si tu presión es muy alta (más de 180/120) <u>y</u> tienes dolor de pecho, falta de aire, dolor de cabeza fuerte, visión borrosa, confusión, dificultad para hablar o debilidad en un lado del cuerpo.</p></div>' +
        '<div class="gd-alert amber"><b>📞 Llama a tu médico pronto</b><p>Si varias lecturas seguidas pasan de 130/80, o una pasa de 180/120 sin síntomas (descansa 5 minutos y repite primero). También si sientes mareos o desmayos con la presión baja.</p></div>' +
        '<div class="gd-alert blue"><b>🗓️ Para tu próxima cita</b><p>Lleva tu registro de 7 días y la lista de tus medicinas. SaludPlus lo arma por ti.</p><div class="gd-row"><button type="button" class="gd-btn" onclick="showView(\'reportes\')">Ver mis reportes</button><button type="button" class="gd-btn ghost" onclick="showView(\'presion\')">Ir a Presión</button></div></div>' +
        '<p class="gd-fine">Esta guía es educativa y no reemplaza la valoración de un profesional de la salud. No cambies ni suspendas medicinas por tu cuenta.</p>' +
      '</div>';
  }

  function fmt(s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function drawTimer() {
    $('gdTime').textContent = fmt(timer.left);
    $('gdTimeBar').style.width = ((300 - timer.left) / 300 * 100) + '%';
    $('gdStart').textContent = timer.run ? 'Pausar' : (timer.left < 300 && timer.left > 0 ? 'Continuar' : 'Empezar reposo');
    $('gdTimeDone').hidden = timer.left > 0;
  }
  function tick() {
    if (timer.left > 0) timer.left--;
    if (timer.left === 0) { timer.run = false; clearInterval(timer.id); try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) { } }
    drawTimer();
  }
  function stepsProgress() {
    var on = document.querySelectorAll('#guia .gd-step:not(.gd-habit)[aria-pressed="true"]').length;
    $('gdProgTx').textContent = on + ' de ' + STEPS.length + ' listos';
    $('gdProgBar').style.width = (on / STEPS.length * 100) + '%';
    $('gdReady').hidden = on < STEPS.length;
  }
  function habitsProgress() {
    var k = 'sp_guia_habits', d = iso(new Date()), st = store(k) || {}; if (st.date !== d) st = { date: d, done: [] };
    document.querySelectorAll('#guia .gd-habit').forEach(function (b) { b.setAttribute('aria-pressed', st.done.indexOf(+b.dataset.h) >= 0); });
    var n = st.done.length;
    $('gdHabTx').textContent = n + ' de ' + HABITS.length;
    $('gdHabBar').style.width = (n / HABITS.length * 100) + '%';
    $('gdHabMsg').textContent = n === HABITS.length ? '🎉 ¡Día completo! Tu corazón te lo agradece.' : n >= 4 ? '¡Vas muy bien, sigue así!' : n > 0 ? 'Buen comienzo. Cada hábito suma.' : 'Marca lo que ya hiciste hoy.';
    return st;
  }
  function reading() {
    var s = parseInt($('gdSys').value, 10), d = parseInt($('gdDia').value, 10), r = $('gdResult'), dot = $('gdDot');
    if (!(s >= 50 && s <= 260 && d >= 30 && d <= 160)) { r.style.setProperty('--zc', '#4a5f8a'); r.innerHTML = '<b>Escribe tus dos números</b><span>Por ejemplo 120 y 80.</span>'; dot.style.display = 'none'; return; }
    var z = zone(s, d); r.style.setProperty('--zc', z.c);
    r.innerHTML = '<b>' + z.t + '</b><span>' + z.d + '</span>';
    var pct = (ZONES.indexOf(z) + 0.5) / 6 * 100; dot.style.display = 'block'; dot.style.left = 'calc(' + pct + '% - 9px)'; dot.style.borderColor = z.c;
  }
  function lastReading() {
    try {
      var rows = ((typeof data !== 'undefined' && data.bp) || []).filter(function (x) { return x.ls && x.ld; }).sort(function (a, b) { return (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')); });
      if (!rows.length) return false;
      var x = rows[0], l = +x.ls, r = +x.rs || 0, useR = r > l;
      $('gdSys').value = useR ? x.rs : x.ls; $('gdDia').value = useR ? x.rd : x.ld; reading(); return true;
    } catch (e) { return false; }
  }
  function show(name) {
    document.querySelectorAll('#gdTabs button').forEach(function (b) { var on = b.dataset.t === name; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    document.querySelectorAll('#gdPanels .gd-panel').forEach(function (p) { p.hidden = p.dataset.p !== name; });
    store('sp_guia_tab', name);
  }

  var vid = { n: 1, playing: true, t: 0, id: null };
  var SCENE_MS = 4500;
  function vidDraw() {
    var box = $('gdv'); if (!box) return;
    box.dataset.s = vid.n;
    $('gdvTitle').textContent = vid.n + '. ' + VID[vid.n - 1][0];
    $('gdvText').textContent = VID[vid.n - 1][1];
    $('gdvPlay').textContent = vid.playing ? 'Pausar' : 'Reproducir';
    box.classList.toggle('paused', !vid.playing);
    document.querySelectorAll('#gdvDots button').forEach(function (b, i) { b.classList.toggle('on', i === vid.n - 1); });
  }
  function vidGo(n) { vid.n = ((n - 1 + VID.length) % VID.length) + 1; vid.t = 0; $('gdvBar').style.width = '0%'; vidDraw(); }
  function vidTick() {
    var box = $('gdv'); if (!box || !vid.playing || !box.offsetParent) return;
    vid.t += 100; $('gdvBar').style.width = Math.min(100, vid.t / SCENE_MS * 100) + '%';
    if (vid.t >= SCENE_MS) vidGo(vid.n + 1);
  }
  function vidInit() {
    $('gdvDots').innerHTML = VID.map(function (v, i) { return '<button type="button" aria-label="Paso ' + (i + 1) + '"></button>'; }).join('');
    $('gdvDots').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; vidGo(Array.prototype.indexOf.call(b.parentNode.children, b) + 1); });
    $('gdvPrev').addEventListener('click', function () { vidGo(vid.n - 1); });
    $('gdvNext').addEventListener('click', function () { vidGo(vid.n + 1); });
    $('gdvPlay').addEventListener('click', function () { vid.playing = !vid.playing; vidDraw(); });
    try { if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) vid.playing = false; } catch (e) { }
    vidDraw(); clearInterval(vid.id); vid.id = setInterval(vidTick, 100);
  }
  function build() {
    var sec = $('guia'); if (!sec || sec.dataset.built) return; sec.dataset.built = '1';
    $('gdTabs').innerHTML = TABS.map(function (t) { return '<button type="button" role="tab" data-t="' + t[0] + '"><span aria-hidden="true">' + t[1] + '</span>' + t[2] + '</button>'; }).join('');
    $('gdPanels').innerHTML = html();
    $('gdTabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) show(b.dataset.t); });
    $('gdStart').addEventListener('click', function () {
      if (timer.left === 0) timer.left = 300;
      timer.run = !timer.run; clearInterval(timer.id); if (timer.run) timer.id = setInterval(tick, 1000); drawTimer();
    });
    $('gdReset').addEventListener('click', function () { timer.run = false; clearInterval(timer.id); timer.left = 300; drawTimer(); });
    $('gdPanels').addEventListener('click', function (e) {
      var b = e.target.closest('.gd-step'); if (!b) return;
      if (b.classList.contains('gd-habit')) {
        var st = habitsProgress(), i = +b.dataset.h, k = st.done.indexOf(i); if (k >= 0) st.done.splice(k, 1); else st.done.push(i); store('sp_guia_habits', st); habitsProgress();
      } else { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); stepsProgress(); }
    });
    $('gdSys').addEventListener('input', reading); $('gdDia').addEventListener('input', reading);
    $('gdLast').addEventListener('click', function () { if (!lastReading()) { $('gdResult').innerHTML = '<b>Aún no tienes mediciones</b><span>Registra una en Presión y vuelve aquí.</span>'; } });
    vidInit(); drawTimer(); stepsProgress(); habitsProgress(); reading();
    show(store('sp_guia_tab') || 'medir');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
