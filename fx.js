/* SaludPlus v71 · efectos vivos: fondo animado, datos en tarjetas, indicador de pestañas, destellos */
(function () {
  'use strict';
  var root = document.documentElement;
  var off = function () { return root.getAttribute('data-motion') === 'off'; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var LS = 'salud360_pwa_v1';
  function data() { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) { return {}; } }
  var tr = function (s) { return (typeof t === 'function') ? t(s) : s; };

  /* 1. Fondo: auroras y partículas */
  function background() {
    if ($('.fx-bg')) return;
    var bg = document.createElement('div'); bg.className = 'fx-bg'; bg.setAttribute('aria-hidden', 'true');
    var h = '<i class="blob b1"></i><i class="blob b2"></i><i class="blob b3"></i>';
    for (var i = 0; i < 16; i++) {
      var s = 3 + Math.random() * 6, l = Math.random() * 100, d = 12 + Math.random() * 16, dl = -Math.random() * 24;
      h += '<i class="spark" style="left:' + l.toFixed(1) + '%;--s:' + s.toFixed(1) + 'px;--d:' + d.toFixed(1) + 's;animation-delay:' + dl.toFixed(1) + 's"></i>';
    }
    bg.innerHTML = h; document.body.insertBefore(bg, document.body.firstChild);
  }

  /* 2. Línea de latido bajo el encabezado */
  function ecgRun() {
    var bar = $('.appbar'); if (!bar || $('.ecg-run', bar)) return;
    var seg = 'l30 0 l8 -3 l8 3 l30 0 l6 -4 l8 30 l10 -52 l8 36 l8 -10 l40 0 ';
    var d = 'M0 18 ' + seg + seg + seg + seg + seg + seg;
    bar.insertAdjacentHTML('beforeend', '<svg class="ecg-run" viewBox="0 0 900 36" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '"/></svg>');
  }

  /* 3. Datos vivos en las tarjetas del inicio */
  function fmtDay(s) { try { return new Date(s + 'T00:00:00').toLocaleDateString(window.currentLang === 'en' ? 'en-US' : 'es', { day: 'numeric', month: 'short' }); } catch (e) { return s; } }
  function tiles() {
    var d = data(), today = new Date().toISOString().slice(0, 10);
    var by = function (a, b) { return (a.date + (a.time || '')) < (b.date + (b.time || '')) ? -1 : 1; };
    var bp = (d.bp || []).slice().sort(by).pop(), gl = (d.glucose || []).slice().sort(by).pop();
    var goal = (d.water && d.water.goal) || 2000;
    var ml = ((d.water && d.water.logs) || []).filter(function (l) { return l.date === today; }).reduce(function (a, l) { return a + (+l.ml || 0); }, 0);
    var next = (d.visits || []).map(function (v) { return v.nextDate; }).filter(function (x) { return x && x >= today; }).sort()[0];
    var map = {
      bp: bp ? ((bp.ls != null ? bp.ls : bp.rs) + '/' + (bp.ld != null ? bp.ld : bp.rd)) : tr('Registrar hoy'),
      glucose: gl ? (gl.value + ' mg/dL') : tr('Registrar hoy'),
      water: (ml / 1000).toFixed(1).replace(/\.0$/, '') + ' / ' + (goal / 1000).toFixed(1).replace(/\.0$/, '') + ' L',
      meds: (d.meds || []).length ? (d.meds.length + ' ' + tr(d.meds.length === 1 ? 'medicina' : 'medicinas')) : tr('Sin medicinas'),
      visits: next ? (tr('Próxima') + ' ' + fmtDay(next)) : tr('Sin citas'),
      profile: (d.patient && d.patient.name) ? tr('Perfil completo') : tr('Completar perfil'),
      exams: ((d.examResults || []).length) + ' ' + tr('resultados')
    };
    Object.keys(map).forEach(function (k) {
      var card = $('.shortcut-' + k); if (!card) return;
      var el = $('.tile-live', card);
      if (!el) { el = document.createElement('span'); el.className = 'tile-live'; $('.shortcut-label', card).insertAdjacentElement('afterend', el); }
      if (el.textContent !== map[k]) { el.textContent = map[k]; if (!off()) { el.classList.remove('flip'); void el.offsetWidth; el.classList.add('flip'); } }
      if (k === 'water') {
        var bar = $('.tile-bar', card);
        if (!bar) { bar = document.createElement('i'); bar.className = 'tile-bar'; bar.innerHTML = '<b></b>'; el.insertAdjacentElement('afterend', bar); }
        bar.firstChild.style.transform = 'scaleX(' + Math.min(1, ml / goal).toFixed(3) + ')';
      }
    });
  }

  /* 4. Indicador deslizante de la barra inferior */
  function glow() {
    var bar = $('.tabbar'); if (!bar) return;
    var g = $('.tab-glow', bar); if (!g) { g = document.createElement('i'); g.className = 'tab-glow'; bar.appendChild(g); }
    var a = $('.tab.active', bar); if (!a) { g.style.opacity = 0; return; }
    g.style.opacity = 1;
    g.style.transform = 'translateX(' + (a.offsetLeft + a.offsetWidth / 2 - 22) + 'px)';
  }

  /* 5. Onda al tocar */
  var RIP = '.btn,.shortcut-card,.premium-save,.premium-clear,.glucose-register-btn,.water-add-grid button,.med-add-main,.visit-add-main,.exam-primary-action,.exam-category,.round-btn,.back-home-btn,.comfort-switch';
  document.addEventListener('pointerdown', function (e) {
    if (off()) return;
    var b = e.target.closest && e.target.closest(RIP); if (!b) return;
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 1.6;
    var x = document.createElement('span'); x.className = 'rip';
    x.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
    b.classList.add('has-rip'); b.appendChild(x); setTimeout(function () { x.remove(); }, 650);
  }, { passive: true });

  /* 6. Inclinación 3D en tarjetas (solo con ratón) */
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || off()) return;
    var c = e.target.closest && e.target.closest('.shortcut-card'); if (!c) return;
    var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    c.style.setProperty('--ry', (x * 10).toFixed(1) + 'deg'); c.style.setProperty('--rx', (-y * 10).toFixed(1) + 'deg');
  }, { passive: true });
  document.addEventListener('pointerout', function (e) { var c = e.target.closest && e.target.closest('.shortcut-card'); if (c) { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); } }, { passive: true });

  /* 7. Números que cuentan */
  function countUp(el) {
    if (off() || el.dataset.cu) return; el.dataset.cu = '1';
    var n = parseInt(el.textContent, 10); if (!isFinite(n) || n <= 0) return;
    var t0 = performance.now(), D = 800;
    (function step(now) { var p = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(n * e); if (p < 1) requestAnimationFrame(step); })(t0);
  }
  function watchCounts() {
    var ex = document.getElementById('examSummary'); if (!ex || !window.MutationObserver) return;
    var run = function () { ex.querySelectorAll('strong').forEach(countUp); };
    new MutationObserver(run).observe(ex, { childList: true }); run();
  }

  /* 8. Destellos al guardar */
  function burst() {
    if (off()) return;
    var n = 14, cx = window.innerWidth / 2, cy = window.innerHeight - 140;
    for (var i = 0; i < n; i++) {
      var s = document.createElement('i'); s.className = 'burst';
      var a = (Math.PI * 2 * i) / n + Math.random() * .4, r = 50 + Math.random() * 70;
      s.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;--dx:' + (Math.cos(a) * r).toFixed(0) + 'px;--dy:' + (Math.sin(a) * r - 30).toFixed(0) + 'px;--c:' + ['#38d6ff', '#7fe9c3', '#ffd24a', '#ff8fb2', '#b79bff'][i % 5];
      document.body.appendChild(s); setTimeout(function (x) { return function () { x.remove(); }; }(s), 900);
    }
  }
  function hookToast() {
    if (typeof window.toast !== 'function' || window.toast.__fx) return;
    var o = window.toast;
    window.toast = function (m) { var r = o.apply(this, arguments); if (/guardad|registrad|agregad|saved|added/i.test(String(m))) burst(); return r; };
    window.toast.__fx = 1;
  }
  function hookSave() {
    if (typeof window.save !== 'function' || window.save.__fx) return;
    var o = window.save;
    window.save = function () { var r = o.apply(this, arguments); setTimeout(function () { tiles(); }, 30); return r; };
    window.save.__fx = 1;
  }
  function hookNav() {
    if (typeof window.showView !== 'function' || window.showView.__fx) return;
    var o = window.showView;
    window.showView = function (id) { var r = o.apply(this, arguments); glow(); if (id === 'inicio') { tiles(); replay(); } return r; };
    window.showView.__fx = 1;
  }
  function replay() { /* reinicia la entrada de las tarjetas al volver al inicio */
    if (off()) return;
    root.classList.remove('js-intro'); void root.offsetWidth; root.classList.add('js-intro');
    clearTimeout(replay.t); replay.t = setTimeout(function () { root.classList.remove('js-intro'); }, 900);
  }

  function init() {
    background(); ecgRun(); tiles(); glow(); watchCounts(); hookToast(); hookSave();
    setTimeout(function () { hookNav(); glow(); tiles(); }, 60);
    window.addEventListener('resize', glow); window.addEventListener('load', function () { glow(); tiles(); });
    setInterval(tiles, 60000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
