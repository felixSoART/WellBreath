/* ==========================================================================
   WellBreath — Soplo, la mascota que respira contigo
   «Un soplo de aire con cara de calma»: el cuerpo es una bocanada de aire,
   el rizo de la cabeza es el aire en movimiento y la cara cambia según
   cómo respiras. También dibuja la planta que crece con tu práctica.
   ========================================================================== */
(function () {
  'use strict';

  const WB = window.WB || (window.WB = {});
  const INK = '#1f2433';

  const BODY = 'M60 20C87 20 105 41 105 68C105 93 86 107 60 107C34 107 15 93 15 68C15 41 33 20 60 20Z';
  const WISP = 'M96 33c6-1 11 3 10.5 8.5c-.4 4.6-5.6 6.4-8.4 3.2c-1.9-2.2-.2-5.3 2.3-4.6M96 33c-4 .7-7.5 0-10-2';

  const spiral = (cx, cy) => `M${cx - 1} ${cy}a1 1 0 1 1 2 0a2.2 2.2 0 1 1 -4.2 0a3.6 3.6 0 1 1 7 0`;
  const star = (x, y, r) => `M${x} ${y - r}Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z`;

  const EYES = {
    open: `<g class="e-open"><ellipse cx="46" cy="63" rx="4.3" ry="5.6" fill="${INK}"/><ellipse cx="74" cy="63" rx="4.3" ry="5.6" fill="${INK}"/><circle cx="47.6" cy="60.8" r="1.4" fill="#fff"/><circle cx="75.6" cy="60.8" r="1.4" fill="#fff"/></g>`,
    closed: `<g class="e-closed" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"><path d="M40.5 63.5Q46 69 51.5 63.5"/><path d="M68.5 63.5Q74 69 79.5 63.5"/></g>`,
    happy: `<g class="e-happy" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M40.5 66Q46 58.5 51.5 66"/><path d="M68.5 66Q74 58.5 79.5 66"/></g>`,
    stressed: `<g class="e-stressed" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M41 59L50 63.5L41 68"/><path d="M79 59L70 63.5L79 68"/></g>`,
    sleepy: `<g class="e-sleepy" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"><path d="M40.5 65Q46 67.5 51.5 65"/><path d="M68.5 65Q74 67.5 79.5 65"/></g>`,
    focused: `<g class="e-focused"><ellipse cx="46" cy="64" rx="4.2" ry="3.8" fill="${INK}"/><ellipse cx="74" cy="64" rx="4.2" ry="3.8" fill="${INK}"/><g fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"><path d="M39.5 54.5Q46 53 52 55.5"/><path d="M68 55.5Q74 53 80.5 54.5"/></g></g>`,
    worried: `<g class="e-worried"><ellipse cx="46" cy="64" rx="4.2" ry="5.2" fill="${INK}"/><ellipse cx="74" cy="64" rx="4.2" ry="5.2" fill="${INK}"/><circle cx="47.4" cy="62" r="1.3" fill="#fff"/><circle cx="75.4" cy="62" r="1.3" fill="#fff"/><g fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"><path d="M39 56L51 51.5"/><path d="M69 51.5L81 56"/></g></g>`,
    dizzy: `<g class="e-dizzy" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"><path d="${spiral(46, 63)}"/><path d="${spiral(74, 63)}"/></g>`
  };

  const MOUTHS = {
    smile: `<path class="m-smile" d="M53 77Q60 83.5 67 77" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>`,
    small: `<path class="m-small" d="M55.5 77.5Q60 80.8 64.5 77.5" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    big: `<g class="m-big"><path d="M51.5 75.5Q60 89 68.5 75.5Z" fill="${INK}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M55.5 82.2Q60 86 64.5 82.2Q60 80.5 55.5 82.2Z" fill="#f08a72"/></g>`,
    o: `<ellipse class="m-o" cx="60" cy="79" rx="3.6" ry="4.4" fill="${INK}"/>`,
    flat: `<path class="m-flat" d="M54.5 78.5H65.5" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    frown: `<path class="m-frown" d="M53.5 81.5Q60 75.5 66.5 81.5" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    wavy: `<path class="m-wavy" d="M50 79Q53.3 75.5 56.6 79T63.3 79T70 79" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`,
    puff: `<path class="m-puff" d="M56 78.5Q60 80.5 64 78.5" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
  };

  const ACC = {
    sprout: `<g class="acc acc-sprout"><path d="M60 21V9" stroke="#4f8f47" stroke-width="3.4" stroke-linecap="round"/><path d="M60 13C54 6 46.5 7.5 45.5 12C51.5 15.5 56.5 15 60 13Z" fill="#86bf7c" stroke="#4f8f47" stroke-width="1.6" stroke-linejoin="round"/><path d="M60 11C66 3.5 74 5 75 9.5C69 13 63.5 13 60 11Z" fill="#9fd094" stroke="#4f8f47" stroke-width="1.6" stroke-linejoin="round"/></g>`,
    heart: `<g transform="translate(-70 0)"><path class="acc acc-heart" d="M93 37C86.5 32.6 84 29.4 84 26.4C84 23.8 86 21.8 88.5 21.8C90.3 21.8 92 22.9 93 24.6C94 22.9 95.7 21.8 97.5 21.8C100 21.8 102 23.8 102 26.4C102 29.4 99.5 32.6 93 37Z" fill="#f0896b" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/></g>`,
    spark: `<g transform="translate(-77 2)"><path class="acc acc-spark" d="M97 13L86.5 30H94L89.5 45L101.5 25.5H94L99 13Z" fill="#f3bf57" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/></g>`,
    zzz: `<g class="acc acc-zzz" fill="${INK}" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800"><text x="16" y="34" font-size="15">z</text><text x="8" y="22" font-size="11">z</text><text x="3" y="12" font-size="8">z</text></g>`,
    sweat: `<g transform="translate(-60 2)"><path class="acc acc-sweat" d="M90 36C90 36 85.5 42 85.5 45C85.5 47.5 87.5 49.5 90 49.5C92.5 49.5 94.5 47.5 94.5 45C94.5 42 90 36 90 36Z" fill="#a9c3f2" stroke="${INK}" stroke-width="1.6"/></g>`,
    sparkles: `<g class="acc acc-sparkles" fill="#f3bf57" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"><path d="${star(17, 34, 7)}"/><path d="${star(103, 26, 6)}"/><path d="${star(108, 52, 4)}"/></g>`,
    glasses: `<g class="acc acc-glasses" fill="none" stroke="${INK}" stroke-width="2.6"><circle cx="46" cy="63" r="9"/><circle cx="74" cy="63" r="9"/><path d="M55 61.5Q60 58.5 65 61.5" stroke-linecap="round"/></g>`,
    moon: `<g transform="translate(-86 2)"><path class="acc acc-moon" d="M101 14A11 11 0 1 0 107 32A9 9 0 1 1 101 14Z" fill="#f7d58c" stroke="${INK}" stroke-width="1.6"/></g>`
  };

  const MOODS = {
    hello:    { eyes: 'open', mouth: 'smile' },
    calm:     { eyes: 'closed', mouth: 'smile' },
    happy:    { eyes: 'happy', mouth: 'big' },
    blow:     { eyes: 'closed', mouth: 'o' },
    stressed: { eyes: 'stressed', mouth: 'wavy' },
    worried:  { eyes: 'worried', mouth: 'frown' },
    neutral:  { eyes: 'open', mouth: 'flat' },
    good:     { eyes: 'open', mouth: 'smile' },
    sleepy:   { eyes: 'sleepy', mouth: 'small' },
    focused:  { eyes: 'focused', mouth: 'small' },
    dizzy:    { eyes: 'dizzy', mouth: 'wavy' }
  };

  const COLORS = ['coral', 'sky', 'leaf', 'lilac', 'honey', 'slate'];

  /**
   * Devuelve el SVG de Soplo.
   * @param {object} o  mood, acc (accesorio), color (coral|sky|leaf|lilac|honey|slate), player (todas las caras), cls
   */
  function soplo(o = {}) {
    const mood = MOODS[o.mood] || MOODS.hello;
    const style = o.color && COLORS.includes(o.color) ? ` style="--soplo-fill:var(--${o.color})"` : '';
    const cheeks = `<g class="cheeks" fill="#ff9aad"><ellipse cx="33.5" cy="75" rx="6.5" ry="4"/><ellipse cx="86.5" cy="75" rx="6.5" ry="4"/></g>`;
    let face;
    if (o.player) {
      // En el reproductor se incluyen todas las expresiones y el CSS elige según la fase
      face = `<g class="soplo-eyes">${EYES.open}${EYES.closed}${EYES.happy}</g>${MOUTHS.smile}${MOUTHS.small}${MOUTHS.o}${MOUTHS.puff}${MOUTHS.big}${MOUTHS.flat}`;
    } else {
      face = `<g class="soplo-eyes">${EYES[mood.eyes]}</g>${MOUTHS[mood.mouth]}`;
    }
    const acc = (o.acc || '').split(' ').filter((a) => ACC[a]).map((a) => ACC[a]).join('');
    const wisp = o.acc && o.acc.includes('sprout') ? '' : `<path class="soplo-wisp" d="${WISP}"/>`;
    return `<svg class="soplo${o.cls ? ' ' + o.cls : ''}" viewBox="0 0 120 120" aria-hidden="true" focusable="false"${style}>
      <g class="soplo-figure">
        <ellipse class="soplo-shadow" cx="60" cy="113" rx="30" ry="4"/>
        <circle class="soplo-ball" cx="60" cy="64" r="44"/>
        <path class="soplo-body" d="${BODY}"/>
        ${wisp}
        <g class="soplo-face">${cheeks}${face}</g>
        ${acc}
      </g>
    </svg>`;
  }

  /* ---------- La planta que crece con la práctica ---------- */
  const PLANT_LEVELS = [
    { min: 0,  name: 'Semilla',      text: 'Tu planta te espera. Haz tu primera sesión para que brote.' },
    { min: 1,  name: 'Brote',        text: '¡Ha brotado! Cada sesión la ayuda a crecer.' },
    { min: 3,  name: 'Plantita',     text: 'Ya tiene sus primeras hojas. Vas muy bien.' },
    { min: 5,  name: 'Creciendo',    text: 'Crece fuerte, como tu costumbre de parar a respirar.' },
    { min: 8,  name: 'Con capullo',  text: 'Le ha salido un capullo. Algo bonito está a punto de pasar.' },
    { min: 12, name: 'Primera flor', text: '¡Su primera flor! Doce sesiones cuidándote.' },
    { min: 18, name: 'Florecida',    text: 'Ya tiene varias flores. Tu práctica se nota.' },
    { min: 25, name: 'Jardín',       text: 'Esto ya es un pequeño jardín. ¡Qué maravilla!' },
    { min: 35, name: 'Plenitud',     text: 'Tu planta está en plenitud, como tu respiración.' },
    { min: 50, name: 'Con visita',   text: '¡Ha llegado una mariposa! Cincuenta sesiones. Eres constancia pura.' }
  ];

  function plantLevel(sessions) {
    let lv = 0;
    PLANT_LEVELS.forEach((l, i) => { if (sessions >= l.min) lv = i; });
    return lv;
  }

  const leaf = (x, y, side, l, s = 1) => {
    const d = side === 'l'
      ? 'M0 0C-7 -11 -22 -13 -28 -6C-21 3 -8 4 0 0Z'
      : 'M0 0C7 -11 22 -13 28 -6C21 3 8 4 0 0Z';
    return `<path class="p-leaf p-leaf-${side}" data-l="${l}" d="${d}" transform="translate(${x} ${y}) scale(${s})"/>`;
  };
  const flower = (x, y, color, l, r = 7) => {
    let petals = '';
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      petals += `<circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="${(r * 0.78).toFixed(1)}"/>`;
    }
    return `<g class="p-flower" data-l="${l}" style="--fc:var(--${color})"><g class="p-petals">${petals}</g><circle class="p-center" cx="${x}" cy="${y}" r="${(r * 0.62).toFixed(1)}"/></g>`;
  };

  function plant() {
    return `<svg class="plant" viewBox="0 0 200 240" role="img" aria-label="Tu planta">
      <g class="p-grow">
        <path class="p-stem" data-l="1" d="M100 166C100 156 99 148 100 140"/>
        <path class="p-stem" data-l="2" d="M100 140C101 132 99 124 100 117"/>
        <path class="p-stem" data-l="3" d="M100 117C101 108 98 100 100 92"/>
        <path class="p-stem" data-l="4" d="M100 92C102 83 98 74 100 66"/>
        <path class="p-stem" data-l="5" d="M100 66C101 58 99 51 100 45"/>
        <path class="p-stem" data-l="6" d="M99 112C90 106 76 100 66 94"/>
        <path class="p-stem" data-l="7" d="M100 96C110 90 126 86 138 80"/>
        <path class="p-stem" data-l="8" d="M100 74C92 70 82 64 74 58"/>
        ${leaf(100, 152, 'l', 1, 0.62)}${leaf(100, 150, 'r', 1, 0.62)}
        ${leaf(100, 130, 'l', 2, 0.85)}${leaf(100, 127, 'r', 2, 0.85)}
        ${leaf(100, 106, 'l', 3, 0.9)}${leaf(100, 103, 'r', 3, 0.9)}
        ${leaf(84, 103, 'r', 6, 0.55)}${leaf(118, 89, 'l', 7, 0.55)}
        ${leaf(100, 82, 'l', 7, 0.7)}${leaf(100, 79, 'r', 8, 0.7)}
        <path class="p-bud" data-l="4" data-lmax="4" d="M100 70C94 64 95 55 100 50C105 55 106 64 100 70Z"/>
        ${flower(100, 42, 'coral', 5, 8)}
        ${flower(64, 92, 'honey', 6, 6.5)}
        ${flower(140, 78, 'lilac', 7, 6.5)}
        ${flower(72, 56, 'sky', 8, 6)}
      </g>
      <g class="p-pot">
        <path class="p-pot-body" d="M60 172H140L132 222C131 228 126 232 120 232H80C74 232 69 228 68 222Z"/>
        <rect class="p-pot-rim" x="54" y="160" width="92" height="17" rx="8.5"/>
        <ellipse class="p-soil" cx="100" cy="163.5" rx="38" ry="4.5"/>
        <ellipse class="p-seed" data-l="0" data-lmax="0" cx="100" cy="161" rx="6.5" ry="4.2"/>
        <g fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"><path d="M85 196Q89 200 93 196"/><path d="M107 196Q111 200 115 196"/><path d="M96 205Q100 208.5 104 205"/></g>
        <g fill="#f08a72" opacity=".5"><ellipse cx="80" cy="203" rx="4.5" ry="2.8"/><ellipse cx="120" cy="203" rx="4.5" ry="2.8"/></g>
      </g>
      <g class="p-butterfly" data-l="9">
        <g class="p-wings"><path d="M0 0C-9 -12 -18 -6 -14 2C-11 7 -4 5 0 0Z" fill="var(--lilac)"/><path d="M0 0C9 -12 18 -6 14 2C11 7 4 5 0 0Z" fill="var(--honey)"/></g>
        <path d="M0 -6V5" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
      </g>
    </svg>`;
  }

  /** Muestra en la planta los elementos del nivel. «grownFrom» anima lo que es nuevo. */
  function setPlantLevel(svg, level, grownFrom) {
    svg.querySelectorAll('[data-l]').forEach((el) => {
      const min = Number(el.dataset.l);
      const max = el.dataset.lmax != null ? Number(el.dataset.lmax) : Infinity;
      const on = level >= min && level <= max;
      el.classList.toggle('on', on);
      el.classList.toggle('ghost', level < min); // lo que crecerá se ve en tenue
      el.classList.toggle('new', on && grownFrom != null && min > grownFrom);
    });
    svg.dataset.level = level;
  }

  /* ---------- Render automático de [data-soplo] ---------- */
  function renderAll(root = document) {
    root.querySelectorAll('[data-soplo]:not([data-soplo-done])').forEach((el) => {
      el.innerHTML = soplo({ mood: el.dataset.soplo, acc: el.dataset.acc, color: el.dataset.color, cls: el.dataset.cls });
      el.setAttribute('data-soplo-done', '');
    });
    root.querySelectorAll('[data-plant]:not([data-plant-done])').forEach((el) => {
      el.innerHTML = plant();
      el.setAttribute('data-plant-done', '');
    });
    // parpadeo natural: cada Soplo con su propio ritmo
    root.querySelectorAll('.soplo .e-open').forEach((e) => {
      if (e.style.animationDelay) return;
      e.style.animationDelay = `${(Math.random() * 6).toFixed(2)}s`;
      e.style.animationDuration = `${(5 + Math.random() * 3).toFixed(2)}s`;
    });
  }

  /* ---------- Los ojos siguen al puntero (solo con ratón) ---------- */
  function trackEyes() {
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let px = 0, py = 0, raf = null;
    const update = () => {
      raf = null;
      document.querySelectorAll('[data-track-eyes] .soplo-eyes').forEach((eyes) => {
        const svg = eyes.ownerSVGElement;
        const r = svg.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const cx = r.left + r.width / 2, cy = r.top + r.height * 0.53;
        const dx = px - cx, dy = py - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, dist / 300) * 3.2;
        eyes.style.transform = `translate(${((dx / dist) * k).toFixed(2)}px, ${((dy / dist) * k).toFixed(2)}px)`;
      });
    };
    addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  }

  Object.assign(WB, { soplo, plant, plantLevel, setPlantLevel, PLANT_LEVELS, renderSoplos: renderAll });

  const init = () => { renderAll(); trackEyes(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
