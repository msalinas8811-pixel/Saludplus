/* Corazón latiendo + onda ECG en los encabezados */
(function () {
  'use strict';
  var N = 0;
  function heart(id) { return '<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8fa6"/><stop offset=".55" stop-color="#ff3d6a"/><stop offset="1" stop-color="#d11a47"/></linearGradient></defs><path class="hl-body" d="M24 42S6 31 6 18.5A9.5 9.5 0 0124 13a9.5 9.5 0 0118 5.5C42 31 24 42 24 42z" fill="url(#'+id+')"/><path d="M13 17.5a5 5 0 013.8-4" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.6" stroke-linecap="round"/></svg>'; }
  var ECG = '<svg class="hl-ecg" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true"><path class="hl-base" d="M0 22H70l8-3 6 3h22l6 4 6-18 8 30 7-16h18l8-3 6 3H400" /><path class="hl-run" d="M0 22H70l8-3 6 3h22l6 4 6-18 8 30 7-16h18l8-3 6 3H400" pathLength="400"/></svg>';
  function add(sel) {
    var el = document.querySelector(sel); if (!el || el.querySelector('.hl-wrap')) return;
    el.classList.add('hl-host');
    var w = document.createElement('span'); w.className = 'hl-wrap'; w.setAttribute('aria-hidden', 'true');
    w.innerHTML = '<i class="hl-ring"></i><i class="hl-ring r2"></i><span class="hl-heart">' + heart('hlg' + (++N)) + '</span>';
    el.appendChild(w);
    var e = document.createElement('span'); e.className = 'hl-line'; e.setAttribute('aria-hidden', 'true'); e.innerHTML = ECG; el.appendChild(e);
  }
  function init() { ['#inicio .hello', '#presion .page-head', '#glucosa .page-head', '#examenes .exam-hero', '#consultas .visits-heading', '#agua .water-heading', '#medicamentos .med-hero', '#reportes .page-head', '#examrep .page-head', '#asistente .page-head'].forEach(add); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
