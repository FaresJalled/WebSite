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
  // sections get "in-view" when they scroll in: the title emoji pops and the underline grows
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        sectionObserver.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    $$('.resume-section').forEach(function (sec) { sectionObserver.observe(sec); });
  } else {
    document.documentElement.classList.add('no-observer');
  }

  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealItems = $$('.resume-item, .path, .book-card, .res-card, .help-card, .group-photo, .skill-logos > li, .lang-bars, .fa-ul > li, .moroccan-teapot-container, .stat-card, .reaction, .pool, .fun-fact');
    // items of one list appear one after the other (a small delay each, see --i in css/custom.css)
    revealItems.forEach(function (el) {
      var siblings = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.setProperty('--i', Math.min(siblings, 12));
    });
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
    animateNumber($$('[data-visitor-count]'), n);   // count up from 0
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
    abacusStats();
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

  /* ---------- Counting service (Abacus) ---------- */
  // (a function, not a variable: it is already called while the page loads, before this line runs)
  function abacus(action, key) {                     // action: 'hit' (+1 and read) or 'get' (read)
    var ns = encodeURIComponent(counterCfg.namespace || 'faresjalled-org');
    return fetch('https://abacus.jasoncameron.dev/' + action + '/' + ns + '/' + encodeURIComponent(key), { cache: 'no-store' })
      .then(function (r) {
        if (r.status === 404) return { value: 0 };    // nobody counted yet (e.g. first visitor of the day)
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function (d) { return Number(d && d.value) || 0; });
  }

  // "today", "this month" and "this year" follow the date in Berlin, the same for every visitor
  function berlinDate() {
    var d = new Date();
    try {
      var s = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    } catch (e) { /* old browser */ }
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function animateNumber(els, n) {
    var format = function (v) { return Math.round(v).toLocaleString('en-US'); };
    if (reduceMotion || n < 10) { els.forEach(function (el) { el.textContent = format(n); }); return; }
    var start = null, duration = 1600;
    var frame = function (now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      els.forEach(function (el) { el.textContent = format(n * eased); });
      if (t < 1) window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);
  }

  /* ---------- Visitor statistics: today, this month, this year, total ----------
     Each browser is counted once per day, once per month, once per year and once in total
     (a small note in the browser's storage remembers it). Your own visits (?owner=on) and bots only read. */
  function abacusStats() {
    var date = berlinDate();                          // e.g. 2026-11-07
    var base = counterCfg.key;
    var periods = [
      { name: 'total', key: base,                         flag: 'fj-counted', mark: '1' },
      { name: 'year',  key: base + '-y' + date.slice(0, 4), flag: 'fj-count-y', mark: date.slice(0, 4) },
      { name: 'month', key: base + '-m' + date.slice(0, 7), flag: 'fj-count-m', mark: date.slice(0, 7) },
      { name: 'day',   key: base + '-d' + date,            flag: 'fj-count-d', mark: date }
    ];
    var readOnly = isOwner || isBot;
    Promise.all(periods.map(function (p) {
      var hit = !readOnly && store.get(p.flag) !== p.mark;
      return abacus(hit ? 'hit' : 'get', p.key).then(function (n) {
        if (hit) store.set(p.flag, p.mark);
        return [p.name, n];
      }, function () { return [p.name, null]; });
    })).then(function (list) {
      var v = {};
      list.forEach(function (x) { v[x[0]] = x[1]; });
      if (v.total === null) { notifyVisit(null); return; }   // service not reachable: counters stay hidden
      showVisitors(v.total);
      var y = Number(date.slice(0, 4)), m = Number(date.slice(5, 7));
      var monthName = 'this month';
      try { monthName = new Date(Date.UTC(y, m - 1, 15)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }) + ' ' + y; } catch (e) { /* keep */ }
      $$('[data-stat-month-name]').forEach(function (el) { el.textContent = monthName; });
      $$('[data-stat-year-name]').forEach(function (el) { el.textContent = String(y); });
      var grid = $('[data-stats]');
      if (grid) grid.hidden = false;
      ['day', 'month', 'year', 'total'].forEach(function (name) {
        animateNumber($$('[data-stat="' + name + '"]'), v[name] || 0);
      });
      notifyVisit({ day: v.day, month: v.month, year: v.year, total: v.total });
    });
  }
  if (!(window.fetch && counterCfg.service === 'abacus' && counterCfg.namespace && counterCfg.key)) {
    setTimeout(function () { notifyVisit(null); }, 1500);   // no counter: still send the visit e-mail
  }

  /* ---------- Likes: emoji reactions, one of each per browser ---------- */
  var REACTIONS = ['love', 'clap', 'wow', 'rocket'];
  var REACT_EMOJI = { love: '❤️', clap: '👏', wow: '🤩', rocket: '🚀' };
  var reactCounts = {};
  function showReactions() {
    var total = 0;
    REACTIONS.forEach(function (r) {
      var n = reactCounts[r] || 0;
      total += n;
      $$('[data-react-count="' + r + '"]').forEach(function (el) { el.textContent = n ? n.toLocaleString('en-US') : ''; });
      var mine = store.get('fj-react-' + r) === '1';
      $$('[data-react="' + r + '"]').forEach(function (b) {
        b.classList.toggle('is-reacted', mine);
        b.classList.toggle('is-liked', mine);
        b.setAttribute('aria-pressed', mine ? 'true' : 'false');
      });
    });
    $$('[data-stat="likes"]').forEach(function (el) { el.textContent = total.toLocaleString('en-US'); });
  }
  if (window.fetch && counterCfg.service === 'abacus') {
    Promise.all(REACTIONS.map(function (r) {
      return abacus('get', 'react-' + r).then(function (n) { reactCounts[r] = n; }, function () { /* keep 0 */ });
    })).then(showReactions);
  } else {
    showReactions();
  }
  function burst(x, y, emoji) {                       // a little firework of emojis
    if (reduceMotion) return;
    var extra = ['✨', '⭐', '💚', emoji];
    for (var i = 0; i < 16; i++) {
      var s = document.createElement('span');
      var angle = Math.random() * 2 * Math.PI, dist = 60 + Math.random() * 130;
      s.className = 'burst';
      s.textContent = i % 3 === 0 ? extra[i % extra.length] : emoji;
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      s.style.setProperty('--dx', Math.round(Math.cos(angle) * dist) + 'px');
      s.style.setProperty('--dy', Math.round(Math.sin(angle) * dist - 70) + 'px');
      s.style.setProperty('--rot', Math.round(Math.random() * 120 - 60) + 'deg');
      document.body.appendChild(s);
      setTimeout(function (el) { el.remove(); }.bind(null, s), 1200);
    }
  }
  $$('[data-react]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var r = btn.getAttribute('data-react');
      var rect = btn.getBoundingClientRect();
      var thanks = $('[data-react-thanks]');
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2, REACT_EMOJI[r]);
      btn.classList.remove('is-popping');
      void btn.offsetWidth;                            // restart the pop animation
      btn.classList.add('is-popping');
      if (store.get('fj-react-' + r) === '1') {
        if (thanks) thanks.textContent = 'You already reacted with ' + REACT_EMOJI[r] + ', thank you!';
        return;
      }
      store.set('fj-react-' + r, '1');
      reactCounts[r] = (reactCounts[r] || 0) + 1;      // show it at once
      showReactions();
      if (thanks) thanks.textContent = 'Thank you for the ' + REACT_EMOJI[r] + ' !';
      if (window.fetch && counterCfg.service === 'abacus') {
        abacus('hit', 'react-' + r).then(function (n) { reactCounts[r] = n; showReactions(); }, function () { /* keep */ });
      }
    });
  });

  /* ---------- E-mail to the owner for each new visitor (at most one per visitor and day) ----------
     Sent through the contact-form service. Contains the visitor's IP address, the approximate place
     (from the IP, via GeoJS), internet provider, operating system, browser, device and screen.
     Not sent for your own visits (?owner=on), bots, or browsers with "Do Not Track" / "Global Privacy Control". */
  function describeDevice(ua, hints) {
    var os = 'unknown', browser = 'unknown', m;
    if (/Windows NT 10\.0/.test(ua)) os = 'Windows 10 or 11';
    else if ((m = ua.match(/Windows NT ([\d.]+)/))) os = 'Windows NT ' + m[1];
    else if ((m = ua.match(/Android ([\d.]+)/))) os = 'Android ' + m[1];
    else if ((m = ua.match(/(iPhone|iPad|iPod).*? OS ([\d_]+)/))) os = (m[1] === 'iPad' ? 'iPadOS ' : 'iOS ') + m[2].replace(/_/g, '.');
    else if ((m = ua.match(/Mac OS X ([\d_.]+)/))) os = 'macOS ' + m[1].replace(/_/g, '.');
    else if (/CrOS/.test(ua)) os = 'ChromeOS';
    else if (/Linux/.test(ua)) os = 'Linux' + (/Ubuntu/.test(ua) ? ' (Ubuntu)' : '');
    if (hints && hints.platformVersion) {
      if (hints.platform === 'Windows') os = parseInt(hints.platformVersion, 10) >= 13 ? 'Windows 11' : 'Windows 10';
      else if (hints.platform === 'macOS') os = 'macOS ' + hints.platformVersion;
      else if (hints.platform === 'Android') os = 'Android ' + hints.platformVersion;
    }
    if ((m = ua.match(/Edg(?:A|iOS)?\/(\d+)/))) browser = 'Microsoft Edge ' + m[1];
    else if ((m = ua.match(/OPR\/(\d+)/))) browser = 'Opera ' + m[1];
    else if ((m = ua.match(/SamsungBrowser\/(\d+)/))) browser = 'Samsung Internet ' + m[1];
    else if ((m = ua.match(/(?:Firefox|FxiOS)\/(\d+)/))) browser = 'Firefox ' + m[1];
    else if ((m = ua.match(/CriOS\/(\d+)/))) browser = 'Chrome (iOS) ' + m[1];
    else if ((m = ua.match(/Chrome\/(\d+)/))) browser = 'Chrome ' + m[1];
    else if ((m = ua.match(/Version\/([\d.]+).*Safari/))) browser = 'Safari ' + m[1];
    var device = (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) ? 'tablet'
               : (/Mobi|iPhone|iPod/.test(ua) ? 'mobile phone' : 'desktop or laptop');
    if (hints && hints.model) device += ' (' + hints.model + ')';
    return { os: os, browser: browser, device: device };
  }
  function withTimeout(promise, ms, fallback) {
    return Promise.race([promise, new Promise(function (resolve) { setTimeout(function () { resolve(fallback); }, ms); })]);
  }
  function notifyVisit(numbers) {
    if (isOwner || isBot || !window.fetch || !window.Promise) return;
    if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    var url = endpoint();
    if (!url) return;
    var today = berlinDate();
    if (store.get('fj-notified') === today) return;
    store.set('fj-notified', today);
    var geo = withTimeout(fetch('https://get.geojs.io/v1/ip/geo.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }), 5000, {});
    var hints = (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues)
      ? withTimeout(navigator.userAgentData.getHighEntropyValues(['platform', 'platformVersion', 'model']).catch(function () { return null; }), 2000, null)
      : Promise.resolve(null);
    Promise.all([geo, hints]).then(function (res) {
      var g = res[0] || {}, dev = describeDevice(navigator.userAgent || '', res[1]);
      var place = [g.city, g.region, g.country].filter(Boolean).join(', ') || 'unknown';
      var tz = '';
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* ignore */ }
      var conn = navigator.connection || {};
      var touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
      var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      var data = {
        _subject: '👀 New visitor on faresjalled.org · ' + place + ' · ' + dev.os,
        _template: 'table',
        _captcha: 'false',
        _honey: '',
        'IP address': g.ip || 'unknown',
        'Place (approximate, from the IP)': place + (g.accuracy ? ' (about ' + g.accuracy + ' km)' : ''),
        'Map (approximate)': g.latitude ? 'https://www.openstreetmap.org/?mlat=' + g.latitude + '&mlon=' + g.longitude + '#map=9/' + g.latitude + '/' + g.longitude : 'unknown',
        'Internet provider': g.organization_name ? g.organization_name + (g.asn ? ' (AS' + g.asn + ')' : '') : 'unknown',
        'Operating system': dev.os,
        'Browser': dev.browser,
        'Device': dev.device,
        'Screen': window.screen.width + ' x ' + window.screen.height + ' (pixel ratio ' + (window.devicePixelRatio || 1) + '), window ' + window.innerWidth + ' x ' + window.innerHeight,
        'Languages': (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]).join(', '),
        'Time zone': (tz || 'unknown') + (g.timezone && g.timezone !== tz ? ' (IP says ' + g.timezone + ')' : ''),
        'Visitor local time': new Date().toString(),
        'Came from': document.referrer || 'typed the address or used a bookmark',
        'Page': window.location.pathname + window.location.hash,
        'Touch screen': touch ? 'yes' : 'no',
        'CPU cores / memory': (navigator.hardwareConcurrency || '?') + ' cores, ' + (navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'memory unknown'),
        'Connection': conn.effectiveType ? conn.effectiveType + (conn.downlink ? ', about ' + conn.downlink + ' Mbit/s' : '') : 'unknown',
        'Colour scheme': dark ? 'dark' : 'light',
        'Visitor numbers': numbers ? 'today ' + numbers.day + ', ' + 'this month ' + numbers.month + ', this year ' + numbers.year + ', total ' + numbers.total : 'not available',
        'User agent': navigator.userAgent || ''
      };
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      });
    }).catch(function () { /* e-mail not sent: nothing to show the visitor */ });
  }

  /* ---------- Fun science facts in the hero ---------- */
  var factEl = $('[data-fact]');
  if (factEl) {
    var FACTS = [
      factEl.textContent,
      'Pentacene molecules can make a maser work at room temperature: first shown in 2012.',
      'The memristor, the "missing" fourth basic circuit element, was predicted by Leon Chua in 1971.',
      'Every one of the world\'s 500 fastest supercomputers runs Linux.',
      'The first computer "bug" (1947) was a real moth stuck in a relay of the Harvard Mark II.',
      'Light from the Moon needs about 1.3 seconds to reach your eyes.',
      'One gram of DNA can store about 215 petabytes of data (shown in 2017).'
    ];
    var factIndex = 0;
    setInterval(function () {
      if (document.hidden) return;
      factIndex = (factIndex + 1) % FACTS.length;
      if (reduceMotion) { factEl.textContent = FACTS[factIndex]; return; }
      factEl.classList.add('is-changing');
      setTimeout(function () { factEl.textContent = FACTS[factIndex]; factEl.classList.remove('is-changing'); }, 450);
    }, 8000);
  }

  /* ---------- Scroll progress bar and the rocket back to the top ---------- */
  var progressBar = $('[data-scroll-progress]');
  var toTop = $('[data-to-top]');
  var fxTicking = false;
  function scrollFx() {
    fxTicking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var y = window.pageYOffset || 0;
    if (progressBar) progressBar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
    if (toTop && !toTop.classList.contains('is-launching')) toTop.hidden = y < 600;
  }
  window.addEventListener('scroll', function () {
    if (fxTicking) return;
    fxTicking = true;
    window.requestAnimationFrame(scrollFx);
  }, { passive: true });
  scrollFx();
  if (toTop) {
    toTop.addEventListener('click', function () {
      toTop.classList.add('is-launching');
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      setTimeout(function () { toTop.classList.remove('is-launching'); toTop.hidden = true; }, 900);
    });
  }

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
