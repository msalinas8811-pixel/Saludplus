/* Reportes: orden lógico (periodo -> reporte -> descargas) conservando los ids que usa app.js */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function build() {
    var sec = $('reportes'); if (!sec || sec.classList.contains('rp-ui')) return;
    var stack = sec.querySelector('.stack'), old = stack && stack.querySelector('.card'); if (!old) return;
    var period = $('reportPeriod'), refDate = $('reportDate'), s = $('averageStartDate'), e2 = $('averageEndDate');
    if (!period || !refDate || !s || !e2) return;
    sec.classList.add('rp-ui');
    var fine = old.querySelector('p.fine');
    var gen = $('generateReportBtn'), calc = $('calculateDateAveragesBtn');

    /* 1. periodo */
    var c1 = el('div', 'rp-card');
    c1.appendChild(el('h3', 'rp-title', '<span class="rp-n">1</span>Elige el periodo'));
    var chips = el('div', 'rp-chips');
    var defs = [['week', '📅', 'Últimos 7 días'], ['month', '🗓️', 'Mes'], ['custom', '✏️', 'Entre fechas']];
    defs.forEach(function (d) {
      var b = el('button', 'rp-chip', '<span aria-hidden="true">' + d[1] + '</span>' + d[2]); b.type = 'button'; b.dataset.p = d[0]; chips.appendChild(b);
    });
    c1.appendChild(chips);
    var ref = el('div', 'rp-ref'); var f = refDate.closest('.field'); f.querySelector('label').textContent = 'Fecha de referencia'; ref.appendChild(f);
    c1.appendChild(ref);
    var range = el('div', 'rp-range');
    var grid = el('div', 'rp-dates'); grid.appendChild(s.closest('.field')); grid.appendChild(e2.closest('.field'));
    range.appendChild(grid); calc.classList.remove('secondary', 'ghost'); range.appendChild(calc);
    c1.appendChild(range);

    /* 2. reporte */
    var c2 = el('div', 'rp-card');
    c2.appendChild(el('h3', 'rp-title', '<span class="rp-n">2</span>Reporte y descargas'));
    var acts = el('div', 'rp-actions');
    function tile(btn, ico, sub, primary) {
      btn.removeAttribute('data-i18n'); btn.className = 'rp-tile' + (primary ? ' primary' : ''); var txt = btn.textContent;
      btn.innerHTML = '<span class="rp-ico" aria-hidden="true">' + ico + '</span><span class="rp-tx"><b>' + txt + '</b><small>' + sub + '</small></span><span class="rp-go" aria-hidden="true">›</span>';
      acts.appendChild(btn);
    }
    tile($('clinicalReportBtn'), '🩺', 'Todo tu historial para el médico', true);
    tile($('printReportBtn'), '🖨️', 'Imprimir o guardar en PDF');
    tile($('exportReportBtn'), '📊', 'Abrir en Excel (CSV)');
    var ex = el('button', 'rp-tile'); ex.type = 'button'; ex.id = 'rpGoExams'; ex.innerHTML = '<span class="rp-ico" aria-hidden="true">🧪</span><span class="rp-tx"><b>Resultados de exámenes</b><small>Ver o descargar en PDF</small></span><span class="rp-go" aria-hidden="true">›</span>';
    ex.addEventListener('click', function () { if (window.showView) showView('examrep'); });
    acts.appendChild(ex);
    c2.appendChild(acts);

    /* ocultos pero vivos */
    var hid = el('div', 'rp-hidden'); hid.hidden = true; hid.appendChild(period.closest('.field')); hid.appendChild(gen); old.parentNode.insertBefore(hid, old);
    stack.insertBefore(c1, old); stack.insertBefore(c2, old);
    old.hidden = true;
    var out = $('reportOutput'); out.parentNode.insertBefore(el('h3', 'rp-out-title', 'Resultado'), out);
    if (fine) { var fn = el('p', 'rp-fine'); fn.textContent = fine.textContent; var n = stack.querySelector('.notice'); stack.insertBefore(fn, n); }

    function setMode(m) {
      chips.querySelectorAll('.rp-chip').forEach(function (b) { b.classList.toggle('on', b.dataset.p === m); b.setAttribute('aria-pressed', b.dataset.p === m); });
      c1.dataset.mode = m;
      if (m === 'week' || m === 'month') { period.value = m; period.dispatchEvent(new Event('change', { bubbles: true })); }
      else { if (!s.value || !e2.value) { var d = new Date(), z = function (n) { return ('0' + n).slice(-2); }, iso = function (x) { return x.getFullYear() + '-' + z(x.getMonth() + 1) + '-' + z(x.getDate()); }; var a = new Date(d); a.setDate(a.getDate() - 29); if (!s.value) s.value = iso(a); if (!e2.value) e2.value = iso(d); } calc.click(); }
    }
    chips.addEventListener('click', function (ev) { var b = ev.target.closest('.rp-chip'); if (b) setMode(b.dataset.p); });
    setMode('week');
  }
  function init() { build(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
