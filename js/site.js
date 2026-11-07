/*
 * Site behaviour for faresjalled.org, in plain JavaScript (no jQuery or
 * Bootstrap JS needed). Settings live in js/config.js.
 * Everything here is an extra: without JavaScript the page still shows all its content.
 */
(function () {
  'use strict';

  var cfg = window.SITE_CONFIG || {};
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  // localStorage can throw (private mode, blocked storage), so wrap it
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) {
      try { if (v === null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch (e) { /* ignore */ }
    }
  };
  document.documentElement.classList.add('js');

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

  /* ---------- News ticker on top: a second copy of the items makes the loop seamless ---------- */
  var ticker = $('[data-ticker]');
  if (ticker && !reduceMotion) {
    $$('.ticker-item', ticker).forEach(function (item) {
      var copy = item.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      $$('a, button', copy).forEach(function (el) { el.setAttribute('tabindex', '-1'); });
      ticker.appendChild(copy);
    });
    // constant reading speed (about 45 px per second), whatever the text length
    var setTickerSpeed = function () {
      ticker.style.animationDuration = Math.max(20, ticker.scrollWidth / 2 / 45) + 's';
    };
    setTickerSpeed();
    window.addEventListener('resize', setTickerSpeed);
    ticker.classList.add('is-moving');
  }

  /* ---------- Typing text under the name ---------- */
  var typed = $('.typed[data-typed]');
  if (typed) {
    var phrases = [];
    try { phrases = JSON.parse(typed.getAttribute('data-typed')); } catch (e) { phrases = []; }
    if (phrases.length > 1) {
      var p = 0, pos = typed.textContent.length, deleting = true;
      var step = function () {
        var word = phrases[p];
        if (reduceMotion) {                       // no typing: just change the phrase every few seconds
          p = (p + 1) % phrases.length;
          typed.textContent = phrases[p];
          return setTimeout(step, 3500);
        }
        if (deleting) {
          pos--;
          typed.textContent = word.slice(0, pos);
          if (pos <= 0) { deleting = false; p = (p + 1) % phrases.length; return setTimeout(step, 350); }
          return setTimeout(step, 35);
        }
        word = phrases[p];
        pos++;
        typed.textContent = word.slice(0, pos);
        if (pos >= word.length) { deleting = true; return setTimeout(step, 2200); }
        return setTimeout(step, 70);
      };
      setTimeout(step, 2500);
    }
  }

  /* ---------- Gentle fade-in of sections' content while scrolling ---------- */
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealItems = $$('.resume-item, .path, .book-card, .res-card, .help-card, .group-photo, .skill-logos, .lang-bars, .fa-ul > li, .moroccan-teapot-container');
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    revealItems.forEach(function (el) {
      // items already on screen at load time are shown at once
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add('reveal');
      revealObserver.observe(el);
    });
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

  /* ---------- Visitor counter ----------
     Abacus (default): each browser is counted once ("hit"), later visits only read the number ("get").
     Supabase (optional): anonymous one-day hash in your own database, see the setup folder.
     Your own visits: open the site once with ?owner=on (and ?owner=off to undo). */
  var params = new URLSearchParams(window.location.search);
  if (params.get('owner') === 'on') store.set('fj-owner', '1');
  if (params.get('owner') === 'off') store.set('fj-owner', null);
  var isOwner = store.get('fj-owner') === '1';
  var isBot = navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|preview/i.test(navigator.userAgent);
  var sbUrl = (cfg.supabaseUrl || '').trim().replace(/\/+$/, '');
  var sbKey = (cfg.supabaseKey || '').trim();
  var counterCfg = cfg.counter || {};

  function showVisitors(n) {
    n = Number(n);
    if (!n || n < 1) return;
    $$('[data-visitor-word]').forEach(function (el) { el.textContent = n === 1 ? 'visitor' : 'visitors'; });
    $$('[data-visitor-bar]').forEach(function (el) { el.classList.add('is-ready'); });
    var els = $$('[data-visitor-count]');
    var format = function (v) { return Math.round(v).toLocaleString('en-US'); };
    if (reduceMotion || n < 10) { els.forEach(function (el) { el.textContent = format(n); }); return; }
    var start = null, duration = 1400;              // count up from 0
    var frame = function (now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      els.forEach(function (el) { el.textContent = format(n * eased); });
      if (t < 1) window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);
  }

  if (window.fetch && sbUrl && sbKey) {
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
      .then(function (stats) { showVisitors(stats && stats.visitors); })
      .catch(function () { /* database not set up: keep the counter hidden */ });
  } else if (window.fetch && counterCfg.service === 'abacus' && counterCfg.namespace && counterCfg.key) {
    var counted = store.get('fj-counted') === '1';
    var countNow = !isOwner && !isBot && !counted;
    var api = 'https://abacus.jasoncameron.dev/' + (countNow ? 'hit/' : 'get/') +
              encodeURIComponent(counterCfg.namespace) + '/' + encodeURIComponent(counterCfg.key);
    fetch(api, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        if (countNow) store.set('fj-counted', '1');
        showVisitors(data && data.value);
      })
      .catch(function () { /* service not reachable: keep the counter hidden */ });
  }

  /* ---------- Contact form (the e-mail address is never shown on the page) ---------- */
  var dialog = $('#contact-dialog');
  var form = $('#contact-form');
  var status = $('#contact-status');
  var sendBtn = $('#contact-send');
  var openedAt = 0;
  function endpoint() {
    var id = (cfg.formsubmitId || '').trim();
    if (!id && cfg.formsubmitKey) {
      try { id = window.atob(cfg.formsubmitKey).split('').reverse().join(''); } catch (e) { id = ''; }
    }
    return id ? 'https://formsubmit.co/ajax/' + encodeURIComponent(id) : '';
  }
  function setStatus(text, kind) {
    status.textContent = text;
    status.className = 'contact-status' + (kind ? ' is-' + kind : '');
  }
  function openContact(e) {
    if (e) e.preventDefault();
    if (!dialog || !form) return;
    if (!endpoint() && cfg.contactUrl) { window.open(cfg.contactUrl, '_blank', 'noopener'); return; }
    openedAt = Date.now();
    setStatus('', '');
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');                      // very old browsers
    }
    var first = $('#cf-name', form);
    if (first) setTimeout(function () { first.focus(); }, 50);
  }
  function closeContact() {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close(); else dialog.removeAttribute('open');
  }
  $$('[data-contact-open]').forEach(function (btn) { btn.addEventListener('click', openContact); });
  $$('[data-contact-close]').forEach(function (btn) { btn.addEventListener('click', closeContact); });
  if (dialog) {
    dialog.addEventListener('click', function (e) { if (e.target === dialog) closeContact(); });   // click outside the box
  }
  if (form) {
    form.addEventListener('input', function () {        // typing again clears an old error
      if (status.classList.contains('is-error')) setStatus('', '');
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;                         // (form.name would be the form's own name)
      var data = {
        name: f.namedItem('name').value.trim(),
        email: f.namedItem('email').value.trim(),
        topic: f.namedItem('topic').value,
        message: f.namedItem('message').value.trim()
      };
      if (f.namedItem('_honey').value) { setStatus('Thank you! Your message was sent.', 'ok'); return; }   // a bot: pretend success
      if (!data.name || !data.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        setStatus('Please fill in your name, a valid e-mail address and your message.', 'error');
        return;
      }
      if (Date.now() - openedAt < 3000) {                     // filled in faster than a person can type
        setStatus('That was very fast. Please check your message and press Send again.', 'error');
        openedAt = 0;
        return;
      }
      var url = endpoint();
      if (!url || !window.fetch) {
        setStatus('The form is not available right now. Please message me on LinkedIn instead.', 'error');
        return;
      }
      sendBtn.disabled = true;
      setStatus('Sending…', '');
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          topic: data.topic,
          message: data.message,
          _subject: 'faresjalled.org: ' + data.topic + ' from ' + data.name,
          _replyto: data.email,
          _template: 'table',
          _captcha: 'false',
          _honey: ''
        })
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          var ok = res.ok && String(res.body.success) !== 'false';
          if (!ok) throw new Error(res.body.message || 'not sent');
          form.reset();
          setStatus('Thank you! Your message was sent. I will answer you by e-mail.', 'ok');
        })
        .catch(function () {
          setStatus('Sorry, the message could not be sent. Please try again later or message me on LinkedIn.', 'error');
        })
        .then(function () { sendBtn.disabled = false; });
    });
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
        var label = btn.innerHTML;
        btn.textContent = msg;
        setTimeout(function () { btn.innerHTML = label; }, 2500);
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

  /* ---------- IT library: topic tabs, search, "show all", links to a book ---------- */
  var shelf = $('#book-shelf');
  if (shelf) {
    var cards = $$('.book-card', shelf);
    var tabs = $$('.library-tab');
    var search = $('#book-search');
    var empty = $('#book-search-empty');
    var moreBtn = $('[data-library-more]');
    var tools = $('[data-library-tools]');
    var FIRST = 9;                                   // books shown in "All" before "Show all" (3 full rows)
    var state = { cat: 'all', q: '', expanded: false };
    if (tools) tools.hidden = false;

    var render = function () {
      var shown = 0, matches = 0;
      cards.forEach(function (card) {
        var inCat = state.cat === 'all' || card.getAttribute('data-cat') === state.cat;
        var inQuery = !state.q || card.textContent.toLowerCase().indexOf(state.q) !== -1;
        var match = inCat && inQuery;
        if (match) matches++;
        var limited = state.cat === 'all' && !state.q && !state.expanded && matches > FIRST;
        card.hidden = !match || limited;
        if (!card.hidden) shown++;
      });
      if (empty) empty.hidden = matches > 0;
      if (moreBtn) moreBtn.hidden = !(state.cat === 'all' && !state.q && !state.expanded && matches > FIRST);
      tabs.forEach(function (t) {
        var active = t.getAttribute('data-cat') === state.cat;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    };
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        state.cat = tab.getAttribute('data-cat');
        state.expanded = false;
        render();
      });
    });
    if (search) {
      search.addEventListener('input', function () {
        state.q = search.value.trim().toLowerCase();
        if (state.q) state.cat = 'all';
        render();
      });
    }
    if (moreBtn) moreBtn.addEventListener('click', function () { state.expanded = true; render(); });

    // a link to a book (#linux, from a learning path or an old library link): show and highlight it
    var showBook = function (id, scroll) {
      var card = id && document.getElementById(id);
      if (!card || !card.classList.contains('book-card')) return false;
      state.cat = card.getAttribute('data-cat');
      state.q = '';
      if (search) search.value = '';
      render();
      cards.forEach(function (c) { c.classList.remove('is-target'); });
      card.classList.add('is-target');
      if (scroll) card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      return true;
    };
    $$('[data-book-link]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (showBook(a.getAttribute('href').slice(1), true)) {
          e.preventDefault();
          if (window.history && window.history.replaceState) window.history.replaceState(null, '', a.getAttribute('href'));
        }
      });
    });
    render();
    if (window.location.hash) showBook(decodeURIComponent(window.location.hash.slice(1)), true);
    window.addEventListener('hashchange', function () { showBook(decodeURIComponent(window.location.hash.slice(1)), true); });
  }

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
