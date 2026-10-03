/* ==========================================================================
   WellBreath — Interacciones generales del sitio
   ========================================================================== */
(function () {
  'use strict';

  const WB = window.WB || (window.WB = {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
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
    });
  }

  /* ---------- Menú móvil ---------- */
  const navBtn = $('.nav-toggle');
  const nav = $('.main-nav');
  if (navBtn && nav) {
    navBtn.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navBtn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) { nav.classList.remove('is-open'); navBtn.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { nav.classList.remove('is-open'); navBtn.setAttribute('aria-expanded', 'false'); navBtn.focus(); } });
  }

  /* ---------- Avisos (toast) ---------- */
  WB.toast = function (text, ms = 6000) {
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
    const span = document.createElement('span');
    span.textContent = text;
    const close = document.createElement('button');
    close.type = 'button'; close.setAttribute('aria-label', 'Cerrar aviso'); close.textContent = '×';
    close.addEventListener('click', () => t.remove());
    t.append(span, close);
    wrap.appendChild(t);
    setTimeout(() => t.remove(), ms);
  };

  /* ---------- Modal SOS: calma rápida ---------- */
  function buildSos() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="sos-title">
        <button type="button" class="icon-btn modal-close" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
        <h2 id="sos-title">Vamos a respirar juntos</h2>
        <p>No tienes que hacerlo perfecto. Sigue el círculo: <strong>dos inhalaciones por la nariz</strong> y <strong>una exhalación larga por la boca</strong>. Lo que sientes es incómodo, pero no es peligroso, y va a pasar.</p>
        <div class="js-sos-player" data-breath-player="sos" data-compact data-minutes="2"></div>
        <div class="modal-links">
          <a class="btn btn-ghost btn-sm" href="ansiedad.html#anclaje">Anclaje 5-4-3-2-1</a>
          <a class="btn btn-ghost btn-sm" href="ansiedad.html">Entender la ansiedad</a>
        </div>
        <p class="small muted center mt-2 mb-0">Si estás en peligro o piensas en hacerte daño, llama al <strong>112</strong> o al <strong>024</strong> (España, 24 h, gratuito). En otros países, a tu número local de emergencias.</p>
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
        if (e.key === 'Tab') { // atrapa el foco dentro del diálogo
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
    if (startBtn) startBtn.focus();
  }

  function closeSos() {
    if (!sosModal) return;
    const p = $('.js-sos-player', sosModal);
    if (p && p.wbPlayer && p.wbPlayer.state !== 'idle' && p.wbPlayer.state !== 'done') p.wbPlayer.stop();
    sosModal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  WB.openSos = openSos;
  $$('[data-open-sos]').forEach((b) => b.addEventListener('click', openSos));

  /* ---------- Aparición suave al hacer scroll ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Índice del artículo: resalta la sección visible ---------- */
  const tocLinks = $$('.toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const map = new Map();
    tocLinks.forEach((a) => { const t = document.getElementById(a.getAttribute('href').slice(1)); if (t) map.set(t, a); });
    const tio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          tocLinks.forEach((a) => a.classList.remove('is-active'));
          const a = map.get(en.target); if (a) a.classList.add('is-active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    map.forEach((_, t) => tio.observe(t));
  }

  /* ---------- Año en el pie ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
