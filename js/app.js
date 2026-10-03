/* ==========================================================================
   WellBreath — Interacciones generales: navegación, scroll y detalles vivos
   ========================================================================== */
(function () {
  'use strict';

  const WB = window.WB || (window.WB = {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const store = WB.store || { get: (k, f) => f, set: () => {} };
  document.documentElement.classList.remove('no-js');

  /* ---------- Tema claro / oscuro ---------- */
  const themeBtn = $('.theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const root = document.documentElement;
      const current = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = current === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('wb-theme', next); } catch (e) { /* sin almacenamiento */ }
      themeBtn.setAttribute('aria-label', next === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
      const meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'dark' ? '#15161c' : '#fffdfa');
    });
  }

  /* ---------- Menú móvil ---------- */
  const navBtn = $('.nav-toggle');
  const nav = $('.main-nav');
  if (navBtn && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      navBtn.setAttribute('aria-expanded', String(open));
      navBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    navBtn.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); navBtn.focus(); } });
    matchMedia('(min-width: 1081px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  /* ---------- Avisos (toast) ---------- */
  WB.toast = function (text, ms = 6000, opts = {}) {
    let wrap = $('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      wrap.setAttribute('role', 'status');
      wrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(wrap);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    if ((opts.soplo || opts.plant != null) && WB.soplo) {
      const ico = document.createElement('span');
      ico.className = 't-ico';
      if (opts.plant != null) {
        ico.innerHTML = WB.plant();
        WB.setPlantLevel(ico.querySelector('svg'), opts.plant, opts.plant - 1);
      } else {
        ico.innerHTML = WB.soplo({ mood: opts.soplo, color: opts.color || 'coral' });
      }
      t.appendChild(ico);
    }
    const span = document.createElement('span');
    span.textContent = text + ' ';
    if (opts.link) {
      const a = document.createElement('a');
      a.href = opts.link.href; a.textContent = opts.link.text;
      span.appendChild(a);
    }
    const close = document.createElement('button');
    close.type = 'button'; close.setAttribute('aria-label', 'Cerrar aviso'); close.textContent = '×';
    const remove = () => { t.classList.add('out'); setTimeout(() => t.remove(), 350); };
    close.addEventListener('click', remove);
    t.append(span, close);
    wrap.appendChild(t);
    setTimeout(remove, ms);
  };

  /* ---------- Modal «Calma ahora» ---------- */
  function buildSos() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="sos-title">
        <button type="button" class="icon-btn modal-close" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
        <div class="modal-scroll theme-lilac">
          <h2 id="sos-title">Vamos a respirar juntos</h2>
          <p>No tienes que hacerlo perfecto. Sigue a Soplo: <strong>dos inhalaciones por la nariz</strong> y <strong>una exhalación larga por la boca</strong>. Lo que sientes es incómodo, pero no es peligroso, y va a pasar.</p>
          <div class="js-sos-player" data-breath-player="sos" data-compact data-minutes="2" data-mood="after"></div>
          <div class="modal-links">
            <a class="btn btn-ghost btn-sm" href="ansiedad.html#anclaje">Anclaje 5-4-3-2-1</a>
            <a class="btn btn-ghost btn-sm" href="ansiedad.html">Entender la ansiedad</a>
          </div>
          <p class="small muted center mt-2 mb-0">Si estás en peligro o piensas en hacerte daño, llama al <strong>112</strong> o al <strong>024</strong> (España, 24 h, gratuito). En otros países, a tu número local de emergencias.</p>
        </div>
      </div>`;
    document.body.appendChild(modal);
    return modal;
  }

  let sosModal = null;
  let lastFocus = null;

  function openSos() {
    if (!sosModal) {
      sosModal = buildSos();
      $('.modal-close', sosModal).addEventListener('click', closeSos);
      sosModal.addEventListener('click', (e) => { if (e.target === sosModal) closeSos(); });
      sosModal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSos();
        if (e.key === 'Tab') { // mantiene el foco dentro del diálogo
          const f = $$('button:not([disabled]), a[href], select:not([disabled]), input:not([disabled]), summary', sosModal).filter((x) => x.offsetParent !== null);
          if (!f.length) return;
          if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
          else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        }
      });
      if (WB.initPlayers) WB.initPlayers(sosModal);
    }
    lastFocus = document.activeElement;
    sosModal.hidden = false;
    document.body.style.overflow = 'hidden';
    const startBtn = $('.js-toggle', sosModal);
    if (startBtn) startBtn.focus({ preventScroll: true });
  }

  function closeSos() {
    if (!sosModal) return;
    const p = $('.js-sos-player', sosModal);
    if (p && p.wbPlayer && (p.wbPlayer.state === 'running' || p.wbPlayer.state === 'paused')) p.wbPlayer.stop();
    sosModal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  WB.openSos = openSos;
  $$('[data-open-sos]').forEach((b) => b.addEventListener('click', openSos));

  /* ---------- Saludo según la hora y si es tu primera visita ---------- */
  const hour = new Date().getHours();
  const greet = hour >= 6 && hour < 12 ? 'Buenos días' : hour >= 12 && hour < 21 ? 'Buenas tardes' : 'Buenas noches';
  const stats = store.get('wb-stats', { sessions: 0 });
  const returning = (stats.sessions || 0) > 0;
  $$('[data-greeting]').forEach((el) => { el.textContent = returning ? `${greet} · qué alegría verte` : `${greet} · bienvenido/a`; });

  const speech = $('[data-speech]');
  const say = (text) => {
    if (!speech || speech.textContent === text) return;
    speech.textContent = text;
    speech.classList.remove('swap'); void speech.offsetWidth; speech.classList.add('swap');
  };
  if (speech) {
    const night = hour >= 21 || hour < 6;
    say(returning ? (night ? '¡Hola otra vez! ¿Respiramos un poco antes de dormir?' : '¡Has vuelto! ¿Un minuto juntos?') : '¡Hola! Soy Soplo. ¿Respiramos juntos un minuto?');
    const lines = {
      running: 'Sígueme: me hincho al inhalar y me desinflo al exhalar.',
      paused: 'Aquí te espero. Sin prisa.',
      idle: 'Cuando quieras, empezamos.',
      done: '¡Qué bien sienta! ¿Me cuentas cómo estás?'
    };
    document.addEventListener('wb:state', (e) => { if (e.target.closest('.hero-stage')) say(lines[e.detail.state] || lines.idle); });
  }
  $$('[data-hero-start]').forEach((btn) => btn.addEventListener('click', () => {
    const p = $('.hero-stage [data-breath-player]');
    if (!p || !p.wbPlayer) return;
    if (matchMedia('(max-width: 960px)').matches) p.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    if (p.wbPlayer.state !== 'running') p.wbPlayer.start();
  }));

  // Soplo del pie: duerme por la noche
  $$('[data-soplo-time]').forEach((el) => {
    const night = hour >= 22 || hour < 7;
    el.dataset.soplo = night ? 'sleepy' : 'hello';
    el.dataset.acc = night ? 'zzz' : '';
    el.removeAttribute('data-soplo-done');
    if (WB.renderSoplos) WB.renderSoplos(el.parentNode);
  });
  $$('[data-bye]').forEach((el) => { el.textContent = hour >= 21 || hour < 6 ? '¡Que descanses!' : '¡Hasta pronto!'; });


  /* ---------- Toca a Soplo: un consejo al azar ---------- */
  const TIPS = [
    'Cierra la boca y respira por la nariz un minuto. ¿Notas la diferencia?',
    'Suelta los hombros. Ahora, una exhalación larga, larga…',
    'Separa los dientes y relaja la lengua: la mandíbula guarda mucha tensión.',
    'Exhalar más largo que inhalar es tu freno de mano natural.',
    'Antes de abrir el correo, tres respiraciones lentas.',
    'Un suspiro cíclico: dos inhalaciones por la nariz y una exhalación larga.',
    'Respirar menos no es aguantar: es respirar más suave y silencioso.',
    'Si te mareas al practicar, haz las respiraciones más pequeñas.',
    'Camina contando: inhala en 4 pasos, exhala en 6.',
    'No hace falta hacerlo perfecto. Hace falta hacerlo.'
  ];
  let tipIndex = Math.floor(Math.random() * TIPS.length);
  $$('.hero-mascot .mascot').forEach((m) => {
    const box = m.closest('.hero-mascot');
    box.removeAttribute('aria-hidden');
    $$('.ring, .disc, .orbit', box).forEach((d) => d.setAttribute('aria-hidden', 'true'));
    m.setAttribute('role', 'button');
    m.setAttribute('tabindex', '0');
    m.setAttribute('aria-label', 'Toca a Soplo para recibir un consejo');
    m.style.cursor = 'pointer';
    const bubble = document.createElement('p');
    bubble.className = 'tip-bubble';
    bubble.setAttribute('aria-live', 'polite');
    bubble.hidden = true;
    box.appendChild(bubble);
    let hideT = null;
    const poke = () => {
      m.classList.remove('boing'); void m.offsetWidth; m.classList.add('boing');
      tipIndex = (tipIndex + 1) % TIPS.length;
      bubble.textContent = TIPS[tipIndex];
      bubble.hidden = false;
      bubble.classList.remove('swap'); void bubble.offsetWidth; bubble.classList.add('swap');
      clearTimeout(hideT);
      hideT = setTimeout(() => { bubble.hidden = true; }, 6000);
    };
    m.addEventListener('click', poke);
    m.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); } });
  });
  $$('[data-plant]').forEach((p) => {
    p.style.cursor = 'pointer';
    p.addEventListener('click', () => { p.classList.remove('tickle'); void p.offsetWidth; p.classList.add('tickle'); });
  });

  /* ---------- Burbujas de aire ---------- */
  $$('[data-bubbles]').forEach((wrap) => {
    if (reduce) return;
    const n = Number(wrap.dataset.bubbles) || 8;
    for (let i = 0; i < n; i++) {
      const b = document.createElement('span');
      b.style.setProperty('--x', `${Math.round(Math.random() * 100)}%`);
      b.style.setProperty('--s', `${Math.round(10 + Math.random() * 26)}px`);
      b.style.setProperty('--t', `${(14 + Math.random() * 14).toFixed(1)}s`);
      b.style.setProperty('--d', `${(-Math.random() * 24).toFixed(1)}s`);
      wrap.appendChild(b);
    }
  });

  /* ---------- Títulos que aparecen palabra a palabra ---------- */
  $$('[data-split]').forEach((el) => {
    let i = 0;
    const wrapWord = (node) => {
      const w = document.createElement('span'); w.className = 'w';
      const inner = document.createElement('span'); inner.style.setProperty('--i', i++);
      inner.appendChild(node); w.appendChild(inner);
      return w;
    };
    Array.from(el.childNodes).forEach((node) => {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(' '));
          else frag.appendChild(wrapWord(document.createTextNode(part)));
        });
        el.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.tagName !== 'BR') {
        el.replaceChild(wrapWord(node.cloneNode(true)), node);
      }
    });
  });

  /* ---------- Aparición suave al hacer scroll (con escalonado) ---------- */
  $$('.stagger').forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      child.classList.add('reveal');
      child.style.setProperty('--d', `${Math.min(i, 8) * 0.09}s`);
    });
  });
  const revealables = $$('.reveal, [data-split], .deal, .myth, [data-count]');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible');
        if (en.target.hasAttribute('data-count')) countTo(en.target);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => { el.classList.add('is-visible'); if (el.hasAttribute('data-count')) countTo(el, true); });
  }

  /* ---------- Números que cuentan ---------- */
  function countTo(el, instant) {
    const target = Number(el.dataset.count);
    const dec = Number(el.dataset.decimals || 0);
    const fmt = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (instant || reduce) { el.textContent = fmt(target); return; }
    const t0 = performance.now(), dur = 1400;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Historia que avanza con el scroll ---------- */
  $$('.story').forEach((story) => {
    const steps = $$('.story-step', story);
    const soplos = $$('.story-soplos > div', story);
    const dots = $$('.story-dots span', story);
    const caption = $('.story-caption', story);
    const disc = $('.story-disc', story);
    const set = (i) => {
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      soplos.forEach((s, k) => s.classList.toggle('on', k === i));
      dots.forEach((s, k) => s.classList.toggle('on', k === i));
      const st = steps[i];
      if (caption && st.dataset.caption) caption.textContent = st.dataset.caption;
      if (disc && st.dataset.color) disc.style.setProperty('--sc', `var(--${st.dataset.color}-soft)`);
    };
    set(0);
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) set(steps.indexOf(en.target)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io.observe(s));
  });

  /* ---------- Bucle de scroll: cabecera, progreso, parallax, banda ---------- */
  const header = $('.site-header');
  const progress = $('.scroll-progress');
  const parallax = $$('[data-parallax]');
  const fades = $$('[data-scroll-fade]');
  const fab = $('.sos-fab');
  const marquees = $$('[data-marquee]').map((track) => {
    Array.from(track.children).forEach((c) => track.appendChild(c.cloneNode(true))); // copia para que el bucle sea continuo
    return { track, x: 0, visible: false };
  });
  let lastY = window.scrollY;
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (progress) progress.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
    if (fab) {
      if (y > lastY + 6 && y > 400) fab.classList.add('mini');
      else if (y < lastY - 6) fab.classList.remove('mini');
    }
    if (!reduce) {
      parallax.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const off = (r.top + r.height / 2 - innerHeight / 2) * Number(el.dataset.parallax || 0.1);
        el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
      });
      fades.forEach((el) => {
        const h = el.offsetHeight || innerHeight;
        const p = Math.min(1, Math.max(0, y / (h * 0.9)));
        el.style.opacity = (1 - p * 0.75).toFixed(3);
        el.style.transform = `translate3d(0, ${(-p * 40).toFixed(1)}px, 0)`;
      });
    }
    lastY = y;
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // La banda de palabras avanza sola y además se acelera con el scroll
  if (marquees.length && !reduce) {
    if ('IntersectionObserver' in window) {
      const mio = new IntersectionObserver((entries) => entries.forEach((en) => {
        const m = marquees.find((q) => q.track === en.target); if (m) m.visible = en.isIntersecting;
      }));
      marquees.forEach((m) => mio.observe(m.track));
    }
    let prevT = performance.now(), prevY = scrollY;
    const loop = (t) => {
      const dt = Math.min(64, t - prevT); prevT = t;
      const dy = scrollY - prevY; prevY = scrollY;
      marquees.forEach((m) => {
        if (!m.visible) return;
        const half = m.track.scrollWidth / 2;
        m.x -= dt * 0.035 + Math.abs(dy) * 0.6;
        if (-m.x > half) m.x += half;
        m.track.style.transform = `translate3d(${m.x.toFixed(1)}px, 0, 0)`;
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---------- Inclinación suave de las tarjetas grandes ---------- */
  if (finePointer && !reduce) {
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg) translateY(-4px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Índice de capítulos: resalta la sección visible ---------- */
  const tocLinks = $$('.chapter-nav a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const map = new Map();
    tocLinks.forEach((a) => { const t = document.getElementById(a.getAttribute('href').slice(1)); if (t) map.set(t, a); });
    const setActive = (a) => {
      tocLinks.forEach((x) => x.classList.toggle('is-active', x === a));
      const bar = a.closest('ol');
      if (bar) bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
    };
    const tio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { const a = map.get(en.target); if (a) setActive(a); } });
    }, { rootMargin: '-35% 0px -60% 0px' });
    map.forEach((_, t) => tio.observe(t));
  }

  /* ---------- Año en el pie ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
