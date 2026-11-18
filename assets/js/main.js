/* LABMISE — site behaviour. No dependencies, no tracking. */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Nav: sticky state + mobile menu ---------- */
  var nav = $('.nav');
  var toggle = $('.nav__toggle');
  var links = $('#nav-links');

  function onScroll() {
    nav.classList.toggle('is-stuck', window.scrollY > 12);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setMenu(open) {
    links.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) nav.classList.add('is-stuck'); else onScroll();
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  /* ---------- Nav: highlight the section in view ---------- */
  var navAnchors = $$('.nav__links a[href^="#"]');
  var sectionFor = {};
  navAnchors.forEach(function (a) {
    var sec = $(a.getAttribute('href'));
    if (sec) sectionFor[sec.id] = a;
  });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navAnchors.forEach(function (a) { a.classList.remove('is-active'); });
        var a = sectionFor[entry.target.id];
        if (a) a.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Tabs (automations) ---------- */
  $$('[data-tabs]').forEach(function (root) {
    var tabs = $$('[role="tab"]', root);
    var list = $('[role="tablist"]', root);

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      // keep the chosen chip visible in the horizontal scroller on small screens
      if (list.scrollWidth > list.clientWidth) {
        list.scrollTo({ left: tab.offsetLeft - list.offsetLeft - 16, behavior: 'smooth' });
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
  });

  /* ---------- Sources: open the list when a reference is followed ---------- */
  var sources = $('.sources');
  function openSourcesFor(hash) {
    if (sources && /^#src-\d+$/.test(hash)) sources.open = true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#src-"]');
    if (a) openSourcesFor(a.getAttribute('href'));
  });
  $$('a[href="#sources"]').forEach(function (a) {
    a.addEventListener('click', function () { if (sources) sources.open = true; });
  });
  openSourcesFor(window.location.hash);
  if (window.location.hash === '#sources' && sources) sources.open = true;

  /* ---------- Calculator ---------- */
  var calc = $('#calc');
  if (calc) {
    var people = $('#c-people'), rate = $('#c-rate'), mins = $('#c-min'), days = $('#c-days');
    var minsOut = $('#c-min-out'), hoursEl = $('#c-hours'), valueEl = $('#c-value'), formula = $('#c-formula');
    var int = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
    var gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
    var gbpRate = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 2 });

    var num = function (el, min, max) {
      var v = parseFloat(el.value);
      if (!isFinite(v)) v = 0;
      return Math.min(max, Math.max(min, v));
    };

    var update = function () {
      var p = num(people, 0, 100000), r = num(rate, 0, 10000), m = num(mins, 5, 90), d = num(days, 0, 366);
      var hours = p * m * d / 60;
      var value = hours * r;
      minsOut.textContent = m;
      mins.style.setProperty('--fill', ((m - 5) / (90 - 5) * 100) + '%');
      hoursEl.textContent = int.format(hours);
      valueEl.textContent = gbp.format(value);
      formula.textContent = int.format(p) + (p === 1 ? ' person' : ' people') + ' × ' + m + ' min × ' + int.format(d) +
        ' days ÷ 60 = ' + int.format(hours) + ' hours × ' + gbpRate.format(r);
    };
    calc.addEventListener('input', update);
    calc.addEventListener('submit', function (e) { e.preventDefault(); });
    update();
  }

  /* ---------- Contact form: compose an email, store nothing ---------- */
  var form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var to = form.getAttribute('action').replace(/^mailto:/, '');
      var name = $('#f-name').value.trim();
      var company = $('#f-company').value.trim();
      var email = $('#f-email').value.trim();
      var message = $('#f-message').value.trim();
      var subject = 'Automation enquiry' + (company ? ' — ' + company : '');
      var body = message + '\n\n—\n' + name + (company ? '\n' + company : '') + '\n' + email;
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      $('#form-note').textContent = 'Your email app should now be open with the message ready. If nothing happened, write to ' + to + ' directly.';
    });
  }

  /* ---------- Footer year ---------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
