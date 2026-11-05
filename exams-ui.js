/* SaludPlus v74 · Exámenes según el diseño del usuario */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function el(h) { var t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild; }
  var P = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  var IC = {
    plus: '<path d="M12 5v14M5 12h14"/>', cal: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>', doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 13h5M10 17h5"/>',
    clip: '<path d="M20 11l-8 8a5 5 0 01-7-7l9-9a3.5 3.5 0 015 5l-9 9a2 2 0 01-3-3l8-8"/>', flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3"/>',
    check: '<rect x="5" y="4" width="14" height="17" rx="3"/><path d="M9 3h6v3H9zM9 13l2.2 2.2L15.5 11"/>', search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>', grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>', dots: '<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>', heart: '<path d="M12 20s-8-4.7-8-10.5A4.5 4.5 0 0112 7a4.5 4.5 0 018 2.5C20 15.3 12 20 12 20z"/><path d="M6 12h3l1.5-3 3 6 1.5-3h3"/>',
    img: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4 4 3 3-2 4 3"/>', alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>'
  };
  function svg(n) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" ' + P + '>' + IC[n] + '</svg>'; }
  var MAP = { openResultDialog: ['plus'], openPlanDialog: ['edit'], removeExamPlan: ['trash'], askAboutResult: ['spark'], readSavedResult: ['doc'], addFilesToResult: ['clip'], removeExamResult: ['trash'] };
  function kind(name) {
    var n = (name || '').toLowerCase();
    if (/sangre|hemat|biometr|hemogl|glucos|colesterol|l[ií]pid|triglic|orina/.test(n) && !/perfil l/.test(n)) return ['t-blood', 'drop'];
    if (/cardi|electro|ecg|coraz|presi/.test(n)) return ['t-heart', 'heart'];
    if (/imagen|rayos|rx|ultra|tomo|resonan|radio|mamo/.test(n)) return ['t-img', 'img'];
    return ['t-lab', 'flask'];
  }
  function decorate() {
    $$('#examenes .actions button').forEach(function (b) {
      if (b.dataset.ic) return; var oc = b.getAttribute('onclick') || '', k = Object.keys(MAP).filter(function (x) { return oc.indexOf(x) === 0; })[0]; if (!k) return;
      b.dataset.ic = '1'; var del = /^remove/.test(k); b.classList.add('ab', del ? 'ab-del' : 'ab-' + k); b.innerHTML = svg(MAP[k][0]) + '<span>' + b.textContent.trim() + '</span>';
    });
    $$('#examResultList .exam-result-item').forEach(function (it) {
      if (it.dataset.rico) return; it.dataset.rico = '1';
      var k = kind(($('strong', it) || {}).textContent);
      it.insertBefore(el('<i class="rico ' + k[0] + '">' + svg(k[1]) + '</i>'), it.firstChild);
      var m = el('<button type="button" class="ex-more" aria-label="Más opciones" aria-expanded="false">⋯</button>');
      m.addEventListener('click', function () { var o = it.classList.toggle('open'); m.setAttribute('aria-expanded', o); });
      it.appendChild(m);
    });
  }
  function build() {
    var v = $('#examenes'); if (!v || v.dataset.ui) return; v.dataset.ui = '1'; v.classList.add('ex-ui');
    var hero = $('.exam-hero', v), stats = $('#examSummary'), search = $('.exam-search-row', v), cats = $('.exam-category-row', v), recent = $('.exam-recent-heading', v), rlist = $('#examResultList'), prim = $('#newResultBtn'), more = $('.exam-more-options', v), notice = $('.notice.info', v);
    var hi = $('.exam-hero-icon', hero); if (hi) hi.innerHTML = svg('doc');
    var sp = $('.exam-search > span', search); if (sp) { sp.className = 'ex-search-ic'; sp.innerHTML = svg('search'); }
    var fb = $('#examClearSearch'); if (fb) fb.innerHTML = svg('x');
    var cm = { all: ['grid', 'c-all'], lab: ['flask', 'c-lab'], image: ['img', 'c-img'], cardio: ['heart', 'c-heart'], other: ['dots', 'c-more'] };
    $$('.exam-category', cats).forEach(function (b) { var m = cm[b.dataset.examFilter]; if (m && !$('.cic', b)) b.insertAdjacentHTML('afterbegin', '<i class="cic ' + m[1] + '">' + svg(m[0]) + '</i>'); });
    var sheet = el('<div class="ex-sheet"></div>'); hero.insertAdjacentElement('afterend', sheet);
    var att = el('<div class="ex-att" id="exAtt" hidden></div>');
    sheet.appendChild(stats); sheet.appendChild(search); sheet.appendChild(cats);
    var rh = el('<div class="ex-rh"><h3>Exámenes recientes</h3><button type="button" class="ex-all">Ver todos ›</button></div>');
    $('.ex-all', rh).addEventListener('click', function () { var i = $('#examSearchInput'); if (i) { i.value = ''; i.dispatchEvent(new Event('input')); } var b = $('[data-exam-filter=all]'); if (b) b.click(); });
    var cnt = $('#examResultCount'); if (cnt) { cnt.hidden = true; rh.appendChild(cnt); } recent.remove(); sheet.appendChild(rh); sheet.appendChild(rlist);
    prim.className = ''; prim.innerHTML = '<span class="plus">' + svg('plus') + '</span><span>Registrar nuevo examen</span>'; sheet.appendChild(prim);
    var plan = el('<button type="button" id="exNewPlan">' + svg('cal') + '<span>Programar un control</span></button>');
    plan.addEventListener('click', function () { var b = $('#newPlanBtn'); if (b) b.click(); }); sheet.appendChild(plan);
    var plans = el('<section class="ex-plans" id="exPlans" hidden><h3>Controles programados</h3></section>'); plans.appendChild($('#examPlanList')); sheet.appendChild(att); sheet.appendChild(plans);
    var nb = $('#newPlanBtn'); if (nb) nb.hidden = true;
    var sum = $('summary', more); if (sum) sum.textContent = 'Grupos sugeridos y evolución de valores';
    sheet.insertAdjacentElement('afterend', more);
    if (notice) { notice.className = 'ex-note'; notice.innerHTML = '<b>Tu privacidad</b>' + notice.innerHTML; more.insertAdjacentElement('afterend', notice); }
  }
  function refresh() {
    var v = $('#examenes'); if (!v || !v.dataset.ui) return;
    var n = $$('#examPlanList > .item').length, pl = $('#exPlans'); if (pl) pl.hidden = !n;
    var er = $('#examResultList .empty:not(.exam-filter-empty)'); if (er && !er.dataset.x) { er.dataset.x = 1; er.innerHTML = '<b>Todavía no hay resultados</b><span>Toca “Registrar nuevo examen” para guardar el primero.</span>'; }
    var att = $('#exAtt'), list = []; try { if (typeof examAttention === 'function') list = examAttention(); } catch (e) {}
    if (att) {
      if (list.length) { var p = list[0].p, s = list[0].s; att.hidden = false; att.className = 'ex-att ' + (s.key === 'red' ? 'red' : 'orange');
        att.innerHTML = '<i class="ico">' + svg('alert') + '</i><div><b>' + (s.label || 'Atención') + ': ' + String(p.name).replace(/</g, '&lt;') + '</b><span>' + (s.sub || '') + '</span></div><button type="button" class="ex-go" onclick="openResultDialog(\'' + p.id + '\')">Registrar</button>'; }
      else att.hidden = true;
    }
    var set = function (s, n) { $$(s).forEach(function (x) { if (!x.dataset.i) { x.dataset.i = 1; x.innerHTML = svg(n); } }); };
    set('#examenes .exam-stat-icon.lab', 'flask'); set('#examenes .exam-stat-icon.result', 'check'); set('#examenes .exam-stat-icon.files', 'doc');
    decorate();
  }
  function init() { build(); refresh(); ['#examSummary', '#examPlanList', '#examResultList'].forEach(function (s) { var n = $(s); if (n && window.MutationObserver) new MutationObserver(refresh).observe(n, { childList: true, subtree: true }); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
