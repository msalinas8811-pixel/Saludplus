/* SaludPlus v68 · comodidad y detalles de interfaz */
(function () {
  'use strict';
  var KEY = 'sp_comfort_v68';
  var root = document.documentElement;
  var st = { text: 'm', contrast: 'normal', motion: 'on' };
  try { var s = JSON.parse(localStorage.getItem(KEY) || '{}'); for (var k in s) st[k] = s[k]; } catch (e) {}
  if (!localStorage.getItem(KEY) && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) st.motion = 'off';

  function apply() {
    if (st.text === 'm') root.removeAttribute('data-text'); else root.setAttribute('data-text', st.text);
    if (st.contrast === 'high') root.setAttribute('data-contrast', 'high'); else root.removeAttribute('data-contrast');
    if (st.motion === 'off') root.setAttribute('data-motion', 'off'); else root.removeAttribute('data-motion');
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
  }
  apply();

  var tr = function (s) { return (typeof t === 'function') ? t(s) : s; };

  var SVG_PROFILE = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';
  var SVG_DROP = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 6.2 6 10.5A6 6 0 0 1 6 13.5C6 9.2 12 3 12 3z"/><path d="M9.5 14.5a2.7 2.7 0 0 0 2.5 2"/></svg>';

  function polishHome() {
    var w = document.querySelector('.shortcut-water .shortcut-icon');
    if (w && !w.querySelector('svg')) w.innerHTML = SVG_DROP;
    var p = document.querySelector('.shortcut-profile .shortcut-icon');
    if (p && !p.querySelector('svg')) p.innerHTML = SVG_PROFILE;
    document.querySelectorAll('.shortcut-card').forEach(function (c, i) { c.style.setProperty('--i', i); });
  }


  var IC = {
    drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 6.2 6 10.5A6 6 0 0 1 6 13.5C6 9.2 12 3 12 3z"/></svg>',
    glass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12l-1.5 16h-9z"/><path d="M7 10h10"/></svg>',
    bottle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2h4v3l2 3v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8l2-3z"/><path d="M8 13h8"/></svg>',
    pill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-40 12 12)"/><path d="M8.5 8.5l7 7"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };
  function swap(sel, name, only) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.querySelector('svg')) return;
      var key = name;
      if (typeof name === 'function') key = name(el);
      el.innerHTML = IC[key];
    });
  }
  function polishIcons() {
    swap('.water-drop-mark,.water-mascot,.water-ring-inner>span', 'drop');
    swap('.water-add-grid>button>span', function (e) { return e.textContent.indexOf('🧴') > -1 ? 'bottle' : 'glass'; });
    swap('.water-benefit-grid>div>span', 'check');
    swap('.med-pill-icon', 'pill'); swap('.med-next>span', 'bell');
    swap('.visits-heading-icon', 'cal'); swap('.exam-hero-icon', 'file');
  }
  function addEcg() {
    var ECG = '<svg class="ecg" viewBox="0 0 120 40" aria-hidden="true"><path pathLength="1" d="M0 22H32l6-1 6-14 8 30 7-16h6l5 1h50"/></svg>';
    document.querySelectorAll('.view>.page-head,.water-heading,.med-hero,.visits-heading,.exam-hero').forEach(function (h) {
      if (!h.querySelector('.ecg')) h.insertAdjacentHTML('beforeend', ECG);
    });
  }


  var ART = window.SP_ART || {};
  function hydrate(root) {
    (root || document).querySelectorAll('[data-art]').forEach(function (el) {
      if (el.dataset.done) return; var a = ART[el.dataset.art]; if (a) { el.innerHTML = a; el.dataset.done = '1'; }
    });
  }
  function setAvatar() {
    var host = document.getElementById('homeAvatar'); if (!host) return;
    var photo = '';
    try { var d = JSON.parse(localStorage.getItem('salud360_pwa_v1') || '{}'); photo = (d.patient && d.patient.photo) || ''; } catch (e) {}
    if (photo) { if (host.dataset.src !== photo) { host.innerHTML = '<img alt="">'; host.firstChild.src = photo; host.dataset.src = photo; } }
    else if (!host.firstChild) host.innerHTML = ART.profile || '';
  }
  function bellDot() {
    var c = document.querySelector('.notice-count'), d = document.querySelector('#bellBtn .dot');
    if (d) d.hidden = !(c && !c.hidden && c.textContent.trim());
  }
  function wireHeader() {
    var m = document.getElementById('brandMark'); if (m && !m.firstChild) m.innerHTML = ART.mark;
    hydrate();
    var o = document.getElementById('cfOpen'); if (o) o.addEventListener('click', openSheet);
    document.querySelectorAll('.back-home-btn').forEach(function (b) {
      if (b.dataset.done) return; b.dataset.done = '1';
      b.setAttribute('aria-label', 'Volver a Inicio');
      b.innerHTML = '<span class="bk">' + ART.back + '</span><span class="bk-t" data-i18n>Inicio</span>';
    });
    setAvatar(); bellDot();
    var ex = document.getElementById('examSummary');
    var iconMap = { 'plans': 'flask', 'results': 'check', 'files': 'file' };
    function exIcons() {
      document.querySelectorAll('#examSummary .exam-stat-card').forEach(function (c) {
        var i = c.querySelector('.exam-stat-icon'); if (!i || i.dataset.done) return;
        var k = c.dataset.examStat; i.innerHTML = ART[iconMap[k] || 'file']; i.dataset.done = '1';
      });
      document.querySelectorAll('#examResultList .exam-result-item').forEach(function (r) {
        if (r.querySelector('.ex-ico')) return;
        var s = document.createElement('span'); s.className = 'ex-ico'; s.innerHTML = ART.flask; r.insertBefore(s, r.firstChild);
      });
    }
    if (ex && window.MutationObserver) {
      var mo = new MutationObserver(exIcons);
      mo.observe(ex, { childList: true });
      var rl = document.getElementById('examResultList'); if (rl) mo.observe(rl, { childList: true });
    }
    exIcons();
    var cm = { all: 'grid', lab: 'flask', image: 'image', cardio: 'heart', other: 'dots', files: 'file' };
    document.querySelectorAll('.exam-category').forEach(function (b) {
      if (b.querySelector('.cat-ico')) return;
      var sp = document.createElement('span'); sp.className = 'cat-ico'; sp.innerHTML = ART[cm[b.dataset.examFilter] || 'dots']; b.insertBefore(sp, b.firstChild);
    });
    var se = document.querySelector('.exam-search>span'); if (se) se.innerHTML = ART.search;
    var fb = document.getElementById('examClearSearch'); if (fb) fb.innerHTML = ART.filter;
  }


  function spark(vals, color) {
    var w = 300, h = 74, pad = 8, mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
    if (mx === mn) { mx += 10; mn -= 10; }
    var pts = vals.map(function (v, i) { return [pad + i * (w - 2 * pad) / Math.max(vals.length - 1, 1), pad + (h - 2 * pad) * (1 - (v - mn) / (mx - mn))]; });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
    var area = d + 'L' + pts[pts.length - 1][0] + ' ' + h + 'L' + pts[0][0] + ' ' + h + 'Z';
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" class="spark"><path d="' + area + '" fill="' + color + '" opacity=".22"/><path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' + pts.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#fff" stroke="' + color + '" stroke-width="2"/>'; }).join('') + '</svg>';
  }
  function fmt(d) { try { var x = new Date(d + 'T00:00:00'); return x.toLocaleDateString(window.currentLang === 'en' ? 'en-US' : 'es', { day: 'numeric', month: 'short' }); } catch (e) { return d; } }
  function renderHistory() {
    var card = document.getElementById('patientSummaryCard'); if (!card) return;
    var host = document.getElementById('healthHistory');
    if (!host) { host = document.createElement('section'); host.id = 'healthHistory'; host.className = 'health-history'; card.parentNode.insertBefore(host, card); }
    var d = {}; try { d = JSON.parse(localStorage.getItem('salud360_pwa_v1') || '{}'); } catch (e) {}
    var by = function (a, b) { return (a.date + (a.time || '')) < (b.date + (b.time || '')) ? -1 : 1; };
    var bp = (d.bp || []).slice().sort(by).map(function (r) { return { d: r.date, t: r.time, s: r.ls != null ? r.ls : r.rs, a: r.ld != null ? r.ld : r.rd }; }).filter(function (r) { return r.s != null; }).slice(-7);
    var gl = (d.glucose || []).slice().sort(by).slice(-7);
    var out = '<h2 class="hh-title">' + tr('Historial de salud') + '</h2>';
    function block(cls, icon, title, last, unit, ok, label, vals, color, dates) {
      return '<article class="hh-card ' + cls + '"><div class="hh-top"><span class="hh-ico">' + icon + '</span><div><strong>' + title + '</strong><small>' + last + '</small></div><span class="hh-pill ' + (ok ? 'ok' : 'warn') + '">' + label + '</span></div><div class="hh-val">' + unit + '</div>' + spark(vals, color) + '<div class="hh-dates"><span>' + dates[0] + '</span><span>' + dates[1] + '</span></div></article>';
    }
    if (bp.length) { var l = bp[bp.length - 1]; var ok = l.s < 130 && (l.a == null || l.a < 85);
      out += block('bp', ART.heart, tr('Presión arterial'), fmt(l.d) + (l.t ? ' · ' + l.t : ''), l.s + (l.a != null ? ' / ' + l.a : '') + ' <small>mmHg</small>', ok, ok ? tr('Normal') : tr('Revisar'), bp.map(function (r) { return r.s; }), '#35e0c8', [fmt(bp[0].d), fmt(l.d)]); }
    if (gl.length) { var g = gl[gl.length - 1]; var okg = g.value >= 70 && g.value <= 140;
      out += block('glu', ART.drop, tr('Glucosa'), fmt(g.date) + (g.time ? ' · ' + g.time : ''), g.value + ' <small>mg/dL</small>', okg, okg ? tr('Normal') : tr('Revisar'), gl.map(function (r) { return +r.value; }), '#c58bff', [fmt(gl[0].date), fmt(g.date)]); }
    if (!bp.length && !gl.length) out += '<p class="hh-empty">' + tr('Cuando registres presión o glucosa, verás aquí su evolución.') + '</p>';
    host.innerHTML = out;
  }

  function addComfortButton() {
    var bar = document.querySelector('.appbar');
    if (!bar || bar.querySelector('.comfort-btn')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'comfort-btn';
    b.setAttribute('aria-label', tr('Ajustes de lectura: tamaño de letra y contraste'));
    b.innerHTML = '<span aria-hidden="true" style="font-size:1.1rem">A<small style="font-size:.75em">A</small></span><span>' + tr('Letra') + '</span>';
    var lp = bar.querySelector('.langpick');
    bar.insertBefore(b, lp || null);
    b.addEventListener('click', openSheet);
  }

  var ov, sheet, lastFocus;
  function build() {
    if (sheet) return;
    ov = document.createElement('div'); ov.className = 'comfort-overlay';
    sheet = document.createElement('div'); sheet.className = 'comfort-sheet';
    sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'cfTitle');
    sheet.innerHTML =
      '<h2 id="cfTitle">' + tr('Lectura cómoda') + '</h2>' +
      '<p class="muted">' + tr('Ajusta la pantalla a tu vista. Se guarda en este dispositivo.') + '</p>' +
      '<div class="comfort-group"><b>' + tr('Tamaño de letra') + '</b><div class="seg" id="cfText">' +
        '<button type="button" data-v="m" class="s1">A</button>' +
        '<button type="button" data-v="l" class="s2">A</button>' +
        '<button type="button" data-v="xl" class="s3">A</button></div></div>' +
      '<div class="comfort-group">' +
        '<button type="button" class="comfort-switch" id="cfContrast"><span>' + tr('Contraste alto') + '</span><i></i></button>' +
        '<button type="button" class="comfort-switch" id="cfMotion"><span>' + tr('Reducir animaciones') + '</span><i></i></button></div>' +
      '<button type="button" class="btn comfort-close" id="cfClose">' + tr('Listo') + '</button>';
    var lp = document.getElementById('appLang');
    if (lp) { var g = document.createElement('div'); g.className = 'comfort-group'; g.innerHTML = '<b>' + tr('Idioma') + ' / Language</b>'; g.appendChild(lp); sheet.insertBefore(g, sheet.querySelector('#cfClose')); }
    document.body.appendChild(ov); document.body.appendChild(sheet);
    ov.addEventListener('click', closeSheet);
    sheet.querySelector('#cfClose').addEventListener('click', closeSheet);
    sheet.querySelectorAll('#cfText button').forEach(function (x) {
      x.addEventListener('click', function () { st.text = x.dataset.v; apply(); sync(); });
    });
    sheet.querySelector('#cfContrast').addEventListener('click', function () { st.contrast = st.contrast === 'high' ? 'normal' : 'high'; apply(); sync(); });
    sheet.querySelector('#cfMotion').addEventListener('click', function () { st.motion = st.motion === 'off' ? 'on' : 'off'; apply(); sync(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet.classList.contains('open')) closeSheet(); });
  }
  function sync() {
    sheet.querySelectorAll('#cfText button').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.v === st.text)); });
    var c = sheet.querySelector('#cfContrast'), m = sheet.querySelector('#cfMotion');
    c.setAttribute('aria-pressed', String(st.contrast === 'high')); c.querySelector('i').textContent = st.contrast === 'high' ? tr('Sí') : tr('No');
    m.setAttribute('aria-pressed', String(st.motion === 'off')); m.querySelector('i').textContent = st.motion === 'off' ? tr('Sí') : tr('No');
  }
  function openSheet() {
    build(); sync(); lastFocus = document.activeElement;
    ov.classList.add('open'); sheet.classList.add('open');
    var f = sheet.querySelector('#cfText button[aria-pressed="true"]') || sheet.querySelector('button'); if (f) f.focus();
  }
  function closeSheet() {
    ov.classList.remove('open'); sheet.classList.remove('open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function init() {
    polishHome(); polishIcons(); addEcg(); wireHeader();
    // Entrada de las tarjetas de inicio: solo la primera vez que se abre la app
    root.classList.add('js-intro');
    setTimeout(function () { root.classList.remove('js-intro'); }, 900);
    // Al cambiar de pantalla, volver arriba para no quedar a media página
    if (typeof window.showView === 'function') {
      var orig = window.showView;
      window.showView = function (id) { var r = orig.apply(this, arguments); window.scrollTo(0, 0); setAvatar(); bellDot(); if (id === 'paciente') renderHistory(); return r; };
    }
    window.addEventListener('load', function () { window.scrollTo(0, 0); setTimeout(function () { window.scrollTo(0, 0); }, 120); });
    // Agregar i18n si existe el diccionario
    if (typeof EN === 'object' && EN) {
      var add = { 'Letra': 'Text', 'Lectura cómoda': 'Easy reading', 'Ajusta la pantalla a tu vista. Se guarda en este dispositivo.': 'Adjust the screen to your eyesight. Saved on this device.', 'Tamaño de letra': 'Text size', 'Contraste alto': 'High contrast', 'Reducir animaciones': 'Reduce animations', 'Listo': 'Done', 'Sí': 'Yes', 'No': 'No', 'Ajustes de lectura: tamaño de letra y contraste': 'Reading settings: text size and contrast', 'Idioma': 'Language', 'Historial de salud': 'Health history', 'Normal': 'Normal', 'Revisar': 'Review', 'Cuando registres presión o glucosa, verás aquí su evolución.': 'Once you log pressure or glucose, their trend appears here.', 'Inicio': 'Home' };
      for (var k in add) if (!(k in EN)) EN[k] = add[k];
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
