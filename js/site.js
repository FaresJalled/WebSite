/*
 * Site behaviour for faresjalled.org, in plain JavaScript (no jQuery or
 * Bootstrap JS needed). Settings live in js/config.js.
 */
(function () {
  'use strict';

  var cfg = window.SITE_CONFIG || {};
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  // localStorage can throw (private mode, blocked storage), so wrap it
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) {
      try { if (v === null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch (e) { /* ignore */ }
    }
  };

  /* ---------- Mobile menu ---------- */
  var toggler = $('.navbar-toggler');
  var menu = $('#navbarSupportedContent');
  if (toggler && menu) {
    var setMenu = function (open) {
      menu.classList.toggle('show', open);
      toggler.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    toggler.addEventListener('click', function () { setMenu(!menu.classList.contains('show')); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  /* ---------- Highlight the menu item of the section on screen ---------- */
  var navLinks = $$('#sideNav .nav-link[href^="#"]');
  var targets = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  function updateActiveLink() {
    var line = window.innerHeight * 0.3, current = -1;
    targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line) current = i; });
    if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 2) current = targets.length - 1;
    navLinks.forEach(function (a, i) { a.classList.toggle('active', i === Math.max(current, 0)); });
  }
  if (navLinks.length) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; updateActiveLink(); });
    }, { passive: true });
    updateActiveLink();
  }

  /* ---------- Language bars fill when scrolled into view ---------- */
  var languages = document.getElementById('languages');
  if (languages && 'IntersectionObserver' in window) {
    languages.classList.add('bars-pending');
    var barObserver = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      window.requestAnimationFrame(function () { languages.classList.remove('bars-pending'); });
      barObserver.disconnect();
    }, { threshold: 0.2 });
    barObserver.observe(languages);
  }

  /* ---------- Click-to-load embeds (Spotify, ...) ----------
     Third-party players are only loaded when the visitor asks for them:
     faster page, and no cookies from Spotify until then. */
  $$('[data-embed-src]').forEach(function (box) {
    var button = $('button', box);
    if (!button) return;
    button.addEventListener('click', function () {
      var frame = document.createElement('iframe');
      frame.src = box.getAttribute('data-embed-src');
      frame.title = box.getAttribute('data-embed-title') || '';
      frame.width = '100%';
      frame.height = box.getAttribute('data-embed-height') || '352';
      frame.style.border = '0';
      frame.style.borderRadius = '12px';
      frame.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture');
      frame.setAttribute('allowfullscreen', '');
      box.replaceWith(frame);
    });
  });

  /* ---------- Visitor counter + visit e-mails (Supabase / PostgreSQL) ----------
     Each page view calls the database function record_visit(), which stores
     the visit, e-mails the owner for a new visitor and returns the totals.
     No cookies and nothing stored on the visitor's device. */
  var params = new URLSearchParams(window.location.search);
  if (params.get('owner') === 'on') store.set('fj-owner', '1');
  if (params.get('owner') === 'off') store.set('fj-owner', null);
  var isOwner = store.get('fj-owner') === '1';
  var isBot = navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|preview/i.test(navigator.userAgent);
  var sbUrl = (cfg.supabaseUrl || '').trim().replace(/\/+$/, '');
  var sbKey = (cfg.supabaseKey || '').trim();

  if (sbUrl && sbKey && window.fetch) {
    var headers = { 'apikey': sbKey, 'Content-Type': 'application/json' };
    if (/^eyJ/.test(sbKey)) headers.Authorization = 'Bearer ' + sbKey; // older "anon" keys
    var record = !isOwner && !isBot;
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* ignore */ }
    fetch(sbUrl + '/rest/v1/rpc/' + (record ? 'record_visit' : 'visit_stats'), {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(record ? {
        p_page: window.location.pathname + window.location.hash,
        p_referrer: (document.referrer || '').split('?')[0],
        p_language: navigator.language || '',
        p_timezone: tz,
        p_screen: window.screen.width + 'x' + window.screen.height
      } : {})
    })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (stats) {
        var n = Number(stats && stats.visitors);
        if (!n) return;
        var text = n.toLocaleString('en-US');
        $$('[data-visitor-count]').forEach(function (el) { el.textContent = text; });
        $$('[data-visitor-word]').forEach(function (el) { el.textContent = n === 1 ? 'visitor' : 'visitors'; });
        $$('[data-visitor-bar]').forEach(function (el) { el.classList.add('is-ready'); });
      })
      .catch(function () { /* database not set up yet: keep the counter hidden */ });
  }

  /* ---------- Contact link (external form, so no e-mail address on the site) ---------- */
  if (cfg.contactUrl) {
    $$('[data-contact-link]').forEach(function (a) { a.href = cfg.contactUrl; });
  }

  /* ---------- Tipping ---------- */
  var price = Number(cfg.teaPriceEUR) || 3;
  if (cfg.kofi) {
    $$('[data-kofi-link]').forEach(function (a) { a.href = 'https://ko-fi.com/' + encodeURIComponent(cfg.kofi); });
  }
  var paypalBox = $('[data-paypal]');
  if (paypalBox && cfg.paypalMe) {
    var amounts = $('[data-paypal-amounts]', paypalBox);
    [1, 3, 5].forEach(function (n) {
      var a = document.createElement('a');
      var euros = n * price;
      a.className = 'tea-amount';
      a.href = 'https://paypal.me/' + encodeURIComponent(cfg.paypalMe) + '/' + euros + 'EUR';
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = '🍵 ×' + n + ' · ' + euros + ' €';
      amounts.appendChild(a);
    });
    paypalBox.hidden = false;
  }

  /* ---------- Share button ---------- */
  $$('[data-share]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var url = 'https://' + window.location.hostname + '/';
      var done = function (msg) {
        var label = btn.textContent;
        btn.textContent = msg;
        setTimeout(function () { btn.textContent = label; }, 2500);
      };
      if (navigator.share) {
        navigator.share({ title: document.title, url: url }).catch(function () { /* cancelled */ });
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () { done('Link copied ✓'); }, function () { done(url); });
      } else {
        done(url);
      }
    });
  });

  /* ---------- Library page: search box ---------- */
  var search = $('#book-search');
  if (search) {
    var books = $$('.book');
    var groups = $$('.book-category');
    var empty = $('#book-search-empty');
    search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase();
      books.forEach(function (b) { b.hidden = q && b.textContent.toLowerCase().indexOf(q) === -1; });
      groups.forEach(function (g) { g.hidden = !$$('.book', g).some(function (b) { return !b.hidden; }); });
      if (empty) empty.hidden = groups.some(function (g) { return !g.hidden; });
    });
  }

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
