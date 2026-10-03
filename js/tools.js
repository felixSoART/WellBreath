/* ==========================================================================
   WellBreath — Herramientas interactivas
   ========================================================================== */
(function () {
  'use strict';

  const WB = window.WB || {};
  const store = WB.store;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt1 = (n) => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
  const shortDate = (iso) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  /* ======================================================================
     Biblioteca de ejercicios (página Ejercicios)
     ====================================================================== */
  function initLibrary() {
    const list = $('#exercise-list');
    const playerEl = $('#main-player');
    if (!list || !playerEl) return;
    const details = $('#exercise-details');
    const filters = $('#exercise-filters');
    const EX = window.WB_EXERCISES;
    // Orden pensado: de lo básico a lo específico (las claves numéricas como '478' se ordenarían primero)
    const ORDER = ['coherente', 'suspiro', 'exhalacion', 'abdominal', 'cuadrada', '478', 'ligera', 'reset', 'contador'];
    const ids = ORDER.filter((id) => EX[id] && EX[id].library)
      .concat(Object.keys(EX).filter((id) => EX[id].library && !ORDER.includes(id)));
    let current = null;
    let filter = 'todos';

    function renderFilters() {
      filters.innerHTML = '';
      Object.entries(window.WB_CATEGORIES).forEach(([key, label]) => {
        if (key !== 'todos' && !ids.some((id) => EX[id].categories.includes(key))) return;
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'chip'; b.textContent = label;
        b.setAttribute('aria-pressed', String(key === filter));
        b.addEventListener('click', () => { filter = key; renderFilters(); renderList(); });
        filters.appendChild(b);
      });
    }

    function renderList() {
      list.innerHTML = '';
      ids.filter((id) => filter === 'todos' || EX[id].categories.includes(filter)).forEach((id) => {
        const ex = EX[id];
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'ex-card'; b.dataset.id = id;
        b.setAttribute('aria-pressed', String(id === current));
        b.innerHTML = `
          <span class="ex-pattern" aria-hidden="true">${esc(ex.pattern)}</span>
          <span>
            <h3>${esc(ex.name)}</h3>
            <p>${esc(ex.short)}</p>
            <span class="tags">${ex.categories.map((c) => `<span class="tag${c === 'ansiedad' ? ' calm' : (c === 'tdah' || c === 'foco') ? ' focus' : c === 'dormir' ? ' accent' : ''}">${esc(window.WB_CATEGORIES[c])}</span>`).join('')}</span>
          </span>`;
        b.addEventListener('click', () => {
          select(id, true);
          if (window.matchMedia('(max-width: 940px)').matches) playerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        list.appendChild(b);
      });
    }

    function renderDetails(ex) {
      if (!details) return;
      details.innerHTML = `
        <h2 class="mt-0">${esc(ex.name)}</h2>
        <p>${esc(ex.intro)}</p>
        <h3>Cómo hacerlo</h3>
        <ol>${ex.how.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
        <h3>Para qué te puede servir</h3>
        <ul>${ex.benefits.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
        <div class="callout warn" style="margin:1em 0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
          <p><strong>Con cuidado</strong>${esc(ex.caution)}</p>
        </div>
        <p class="source">Base: ${esc(ex.source)}</p>`;
    }

    function select(id, push) {
      if (!EX[id] || !EX[id].library) id = 'coherente';
      current = id;
      if (playerEl.wbPlayer) playerEl.wbPlayer.load(id);
      $$('.ex-card', list).forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.id === id)));
      renderDetails(EX[id]);
      if (push && history.replaceState) history.replaceState(null, '', `#${id}`);
    }

    renderFilters();
    const fromHash = decodeURIComponent(location.hash.slice(1));
    current = EX[fromHash] && EX[fromHash].library ? fromHash : 'coherente';
    renderList();
    select(current, false);

    $$('[data-mood-exercise]').forEach((btn) => btn.addEventListener('click', () => {
      select(btn.dataset.moodExercise, true);
      if (filter !== 'todos') { filter = 'todos'; renderFilters(); renderList(); }
      playerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    window.addEventListener('hashchange', () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (EX[id] && EX[id].library && id !== current) {
        select(id, false);
        playerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  /* ======================================================================
     Test de pausa de control (BOLT)
     ====================================================================== */
  function initBolt(root) {
    const KEY = 'wb-bolt';
    const display = $('.js-bolt-time', root);
    const btn = $('.js-bolt-btn', root);
    const result = $('.js-bolt-result', root);
    const hist = $('.js-bolt-history', root);
    let t0 = 0, raf = null, running = false;

    const levels = [
      { max: 10, title: 'Menos de 10 segundos', text: 'Tu cuerpo es muy sensible al CO₂ y probablemente respiras más de lo que necesitas. No pasa nada: es un punto de partida muy común en épocas de estrés. Empieza por respirar por la nariz durante el día y practica la respiración coherente y la de «Respirar menos» unos minutos diarios.' },
      { max: 20, title: 'Entre 10 y 20 segundos', text: 'Hay margen de mejora. Es frecuente notar algo de respiración por la boca, suspiros o cansancio. La respiración nasal, el ejercicio suave con la boca cerrada y la práctica diaria de respiración lenta suelen subir esta cifra en pocas semanas.' },
      { max: 30, title: 'Entre 20 y 30 segundos', text: 'Vas por buen camino. Sigue cuidando la respiración nasal, también al dormir y al hacer ejercicio, para seguir ganando tolerancia.' },
      { max: 40, title: 'Entre 30 y 40 segundos', text: '¡Muy bien! Tu respiración en reposo es tranquila y eficiente. Mantén tus hábitos.' },
      { max: Infinity, title: 'Más de 40 segundos', text: 'Excelente. Según el método Buteyko, esta cifra refleja una respiración en reposo muy ligera y eficiente.' }
    ];

    function renderHistory() {
      const data = store.get(KEY, []);
      hist.innerHTML = data.slice(-5).reverse().map((d) => `<li><span>${shortDate(d.date)}</span><b>${fmt1(d.secs)} s</b></li>`).join('');
    }

    function loop() { display.textContent = `${fmt1((performance.now() - t0) / 1000)} s`; raf = requestAnimationFrame(loop); }

    btn.addEventListener('click', () => {
      if (!running) {
        running = true; t0 = performance.now(); result.innerHTML = '';
        btn.textContent = 'Siento la primera necesidad de respirar';
        btn.classList.add('btn-accent');
        loop();
      } else {
        running = false; cancelAnimationFrame(raf);
        const secs = (performance.now() - t0) / 1000;
        display.textContent = `${fmt1(secs)} s`;
        btn.textContent = 'Repetir el test';
        btn.classList.remove('btn-accent');
        if (secs < 2) { result.innerHTML = '<p>Ha sido muy rápido. Prueba otra vez con calma: espera a la <strong>primera</strong> sensación clara de querer respirar, sin aguantar más allá.</p>'; return; }
        const idx = levels.findIndex((l) => secs < l.max);
        const lv = levels[idx];
        result.innerHTML = `
          <h4>${lv.title}</h4>
          <div class="scale" aria-hidden="true">${levels.map((_, i) => `<div class="${i <= idx ? 'on' : ''}"></div>`).join('')}</div>
          <div class="scale-labels" aria-hidden="true"><span>&lt;10</span><span>10-20</span><span>20-30</span><span>30-40</span><span>40+</span></div>
          <p class="mt-1">${lv.text}</p>
          <p class="small muted">Recuerda: es una herramienta de autoobservación, no un diagnóstico. Lo útil es comparar tu propia evolución, mejor siempre a la misma hora (por ejemplo, nada más levantarte).</p>`;
        const data = store.get(KEY, []);
        data.push({ date: new Date().toISOString(), secs: Math.round(secs * 10) / 10 });
        store.set(KEY, data.slice(-30));
        renderHistory();
      }
    });
    renderHistory();
  }

  /* ======================================================================
     Contador de respiraciones por minuto
     ====================================================================== */
  function initCounter(root) {
    const display = $('.js-count-time', root);
    const startBtn = $('.js-count-start', root);
    const tap = $('.js-count-tap', root);
    const tapNum = $('.js-count-num', root);
    const result = $('.js-count-result', root);
    const DURATION = 60;
    let count = 0, t0 = 0, timer = null;

    function end() {
      clearInterval(timer); timer = null;
      tap.disabled = true;
      startBtn.disabled = false; startBtn.textContent = 'Volver a contar';
      display.textContent = '0 s';
      let text;
      if (count <= 8) text = '<h4>Respiración lenta</h4><p>Tienes un ritmo pausado. Si estabas en calma y sin forzar, ¡genial! (Si has ralentizado a propósito al sentirte observado, repítelo otro día distraídamente: a todos nos pasa.)</p>';
      else if (count <= 12) text = '<h4>Ritmo tranquilo</h4><p>Estás en la parte baja de lo habitual en reposo. Un ritmo muy saludable.</p>';
      else if (count <= 20) text = '<h4>Dentro de lo habitual</h4><p>La mayoría de adultos respira entre 12 y 20 veces por minuto en reposo. Con práctica de respiración lenta puedes aprender a bajar ese ritmo cuando lo necesites.</p>';
      else text = '<h4>Ritmo acelerado</h4><p>Puede deberse a estrés, nervios, cansancio o simplemente a que te has movido. Prueba unos minutos de respiración coherente y vuelve a contar. Si respiras así de rápido a menudo en reposo o sientes falta de aire, coméntalo con tu médico.</p>';
      result.innerHTML = `<p class="mb-0"><strong style="font-size:1.4rem">${count} respiraciones por minuto</strong></p>${text}`;
    }

    startBtn.addEventListener('click', () => {
      count = 0; tapNum.textContent = '0'; result.innerHTML = '';
      tap.disabled = false; startBtn.disabled = true; startBtn.textContent = 'Contando…';
      t0 = performance.now();
      display.textContent = `${DURATION} s`;
      timer = setInterval(() => {
        const left = DURATION - Math.floor((performance.now() - t0) / 1000);
        display.textContent = `${Math.max(0, left)} s`;
        if (left <= 0) end();
      }, 200);
      tap.focus();
    });
    tap.addEventListener('click', () => { if (timer) { count++; tapNum.textContent = String(count); } });
  }

  /* ======================================================================
     Autoevaluación «¿Cómo respiras?»
     ====================================================================== */
  const QUIZ = [
    { q: 'Cuando estás en reposo (leyendo, en el ordenador…), ¿respiras con la boca abierta?', reco: { title: 'Vuelve a la nariz', text: 'Deja una nota en tu pantalla con un simple «boca cerrada, lengua arriba». La nariz filtra, calienta y humedece el aire, y te hace respirar más despacio.' } },
    { q: '¿Te levantas con la boca seca, roncas o te dicen que respiras fuerte al dormir?', reco: { title: 'Cuida tu respiración nocturna', text: 'La respiración bucal nocturna empeora el descanso. Si roncas fuerte, haces pausas al respirar o te levantas cansado/a, consulta con tu médico: podría ser apnea del sueño, que tiene tratamiento.' } },
    { q: '¿Suspiras o bostezas a menudo, incluso sin estar cansado/a?', reco: { title: 'Puede que respires de más', text: 'Los suspiros frecuentes pueden ser un signo de sobrerrespiración. Prueba el ejercicio «Respirar menos» y comprueba tu pausa de control (test BOLT) más abajo.' } },
    { q: 'Al respirar, ¿se te mueven más el pecho y los hombros que el abdomen?', reco: { title: 'Despierta tu diafragma', text: 'La respiración alta mantiene al cuerpo en alerta. Practica la respiración abdominal con una mano en el vientre: 3 minutos al día durante dos semanas marcan la diferencia.' } },
    { q: '¿Notas que aguantas la respiración cuando te concentras, escribes o miras el móvil?', reco: { title: 'Ojo con la «apnea de pantalla»', text: 'Es muy común. Programa recordatorios de respiración (los tienes en la sección de TDAH) o aprovecha cada notificación como señal para exhalar despacio.' } },
    { q: '¿Te cuesta respirar por la nariz porque la notas taponada a menudo?', reco: { title: 'Revisa tu nariz', text: 'Una nariz congestionada de forma crónica merece una visita al médico o al otorrino (desviación de tabique, alergias, pólipos…). Mientras tanto, practicar la respiración nasal suave suele ayudar a que se vaya abriendo.' } },
    { q: '¿Sientes a menudo que «no te llega el aire» o que necesitas respirar hondo?', reco: { title: 'Más lento, no más hondo', text: 'Esa sensación suele empeorar si tomas grandes bocanadas. Prueba la exhalación larga y lee nuestra sección sobre ansiedad. Si es algo nuevo, intenso o va con dolor en el pecho, consulta con un médico.' } },
    { q: '¿Practicas deporte o caminas respirando por la boca?', reco: { title: 'Entrena con la boca cerrada', text: 'Empieza caminando solo por la nariz. Cuando te pida abrir la boca, baja un poco el ritmo. En unas semanas tu cuerpo se adapta y podrás ir aumentando la intensidad.' } }
  ];

  function initQuiz(root) {
    const form = $('form', root);
    const out = $('.js-quiz-result', root);
    const qs = $('.js-quiz-questions', root);
    qs.classList.add('quiz-grid');
    qs.innerHTML = QUIZ.map((item, i) => `
      <div class="quiz-q">
        <fieldset>
          <legend>${i + 1}. ${esc(item.q)}</legend>
          <div class="quiz-opts">
            ${['Casi nunca', 'A veces', 'A menudo'].map((label, v) => `<label><input type="radio" name="q${i}" value="${v}" ${v === 0 ? 'required' : ''}> ${label}</label>`).join('')}
          </div>
        </fieldset>
      </div>`).join('');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const answers = QUIZ.map((_, i) => { const c = form.querySelector(`input[name="q${i}"]:checked`); return c ? Number(c.value) : 0; });
      const score = answers.reduce((a, b) => a + b, 0);
      const recos = QUIZ.map((item, i) => ({ ...item.reco, v: answers[i] })).filter((r) => r.v > 0).sort((a, b) => b.v - a.v);
      let intro;
      if (score <= 3) intro = '<h4>¡Tu respiración tiene muy buena base!</h4><p>Pocos hábitos que corregir. Mantén la práctica diaria de respiración lenta para tener esta herramienta a punto cuando la necesites.</p>';
      else if (score <= 8) intro = '<h4>Algunos hábitos para pulir</h4><p>Nada fuera de lo común: casi todos hemos perdido parte de la buena respiración por el estrés, las pantallas o el sedentarismo. Estas son tus prioridades:</p>';
      else intro = '<h4>Tu respiración te está pidiendo atención</h4><p>Y eso es una buena noticia, porque significa que tienes mucho que ganar. Ve paso a paso, empezando por lo primero de la lista:</p>';
      out.innerHTML = `${intro}${recos.length ? `<ul class="reco-list">${recos.slice(0, 4).map((r) => `<li><b>${esc(r.title)}</b>${esc(r.text)}</li>`).join('')}</ul>` : ''}
        <p class="small muted mt-1">Este cuestionario es orientativo y no sustituye una valoración profesional.</p>`;
      out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  /* ======================================================================
     Hábitos diarios
     ====================================================================== */
  const HABITS = [
    { id: 'nariz', text: 'He respirado por la nariz al caminar o moverme', sub: 'Boca cerrada, lengua apoyada en el paladar' },
    { id: 'practica', text: 'He hecho 5 minutos de respiración lenta', sub: 'Coherente, abdominal o exhalación larga' },
    { id: 'pausas', text: 'He hecho al menos 3 pausas para respirar', sub: 'Entre tareas o al mirar el móvil' },
    { id: 'postura', text: 'He revisado hombros, mandíbula y postura', sub: 'Hombros abajo, dientes separados, espalda larga' },
    { id: 'mover', text: 'Me he movido al aire libre', sub: 'Un paseo cuenta, y mucho' },
    { id: 'noche', text: 'He preparado el sueño respirando despacio', sub: 'Por ejemplo, 4 ciclos de 4-7-8 en la cama' }
  ];

  function initHabits(root) {
    const KEY = 'wb-habits';
    const listEl = $('.js-habit-list', root);
    const weekEl = $('.js-habit-week', root);
    const bar = $('.js-habit-bar', root);
    const label = $('.js-habit-label', root);
    const today = WB.todayKey();

    function render() {
      const data = store.get(KEY, {});
      const done = data[today] || [];
      listEl.innerHTML = HABITS.map((h) => `
        <li class="habit-item"><label>
          <input type="checkbox" value="${h.id}" ${done.includes(h.id) ? 'checked' : ''}>
          <span>${esc(h.text)}<small>${esc(h.sub)}</small></span>
        </label></li>`).join('');
      const pct = Math.round((done.length / HABITS.length) * 100);
      bar.style.width = `${pct}%`;
      const msgs = ['¡Vamos! Uno solo ya cuenta.', '¡Buen comienzo!', 'Vas genial.', '¡Más de la mitad!', 'Casi lo tienes.', 'Un día redondo.', '¡Día completo! Tu cuerpo te lo agradece.'];
      label.textContent = `${done.length} de ${HABITS.length} · ${msgs[done.length]}`;
      const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
      let html = '';
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const k = WB.todayKey(d);
        const p = Math.round(((data[k] || []).length / HABITS.length) * 100);
        html += `<div class="week-day${i === 0 ? ' today' : ''}">${days[d.getDay()]}<div class="week-dot" style="--p:${p}" title="${p}%"></div></div>`;
      }
      weekEl.innerHTML = html;
    }

    listEl.addEventListener('change', (e) => {
      if (e.target.type !== 'checkbox') return;
      const data = store.get(KEY, {});
      const set = new Set(data[today] || []);
      if (e.target.checked) set.add(e.target.value); else set.delete(e.target.value);
      data[today] = Array.from(set);
      // conservamos solo los últimos 60 días
      Object.keys(data).sort().slice(0, -60).forEach((k) => delete data[k]);
      store.set(KEY, data);
      const focusVal = e.target.value;
      render();
      const again = listEl.querySelector(`input[value="${focusVal}"]`);
      if (again) again.focus({ preventScroll: true });
    });
    render();
  }

  /* ======================================================================
     Anclaje 5-4-3-2-1
     ====================================================================== */
  const GROUND = [
    { n: 5, title: 'cosas que puedes ver', text: 'Mira a tu alrededor despacio. Un objeto, un color, una luz, una sombra… Nómbralas mentalmente.' },
    { n: 4, title: 'cosas que puedes tocar', text: 'La textura de tu ropa, la silla bajo tu cuerpo, el suelo bajo tus pies, tus manos entre sí.' },
    { n: 3, title: 'sonidos que puedes oír', text: 'Lejanos o cercanos. El tráfico, un pájaro, tu propia respiración, el zumbido de un aparato.' },
    { n: 2, title: 'olores que puedes notar', text: 'Si no hueles nada, recuerda dos olores que te gusten: café, lluvia, ropa limpia…' },
    { n: 1, title: 'cosa que puedes saborear', text: 'O una cosa buena de ti. Puede ser algo pequeño: «He tenido el valor de parar».' }
  ];

  function initGrounding(root) {
    const box = $('.js-ground', root);
    let step = -1;

    function render() {
      if (step < 0) {
        box.innerHTML = `
          <div class="ground-step">
            <p>Cuando la ansiedad te lleva al futuro o a tus pensamientos, tus sentidos te devuelven al presente. Ve paso a paso, sin prisa.</p>
            <button type="button" class="btn btn-calm js-g-start">Empezar el anclaje</button>
          </div>`;
        $('.js-g-start', box).addEventListener('click', () => { step = 0; render(); focusStep(); });
        return;
      }
      if (step >= GROUND.length) {
        box.innerHTML = `
          <div class="ground-step">
            <div class="ground-num" aria-hidden="true">✓</div>
            <h4>Estás aquí. Estás a salvo.</h4>
            <p>Lo has hecho muy bien. Ahora, si quieres, termina con tres exhalaciones largas: inhala por la nariz en 4… y suelta el aire en 6 u 8.</p>
            <button type="button" class="btn btn-ghost js-g-restart">Volver a empezar</button>
          </div>`;
        $('.js-g-restart', box).addEventListener('click', () => { step = 0; render(); focusStep(); });
        focusStep();
        return;
      }
      const g = GROUND[step];
      box.innerHTML = `
        <div class="ground-step">
          <div class="ground-progress" aria-hidden="true">${GROUND.map((_, i) => `<span class="${i <= step ? 'on' : ''}"></span>`).join('')}</div>
          <div class="ground-num" aria-hidden="true">${g.n}</div>
          <h4 tabindex="-1" class="js-g-title">${g.n} ${g.title}</h4>
          <p>${g.text}</p>
          <div class="ground-dots" role="group" aria-label="Marca cada una cuando la encuentres">
            ${Array.from({ length: g.n }, (_, i) => `<button type="button" class="ground-dot" aria-pressed="false" aria-label="${i + 1}">${i + 1}</button>`).join('')}
          </div>
          <div class="btn-row" style="justify-content:center">
            ${step > 0 ? '<button type="button" class="btn btn-ghost btn-sm js-g-prev">Atrás</button>' : ''}
            <button type="button" class="btn btn-calm btn-sm js-g-next">Siguiente</button>
          </div>
        </div>`;
      const dots = $$('.ground-dot', box);
      dots.forEach((d) => d.addEventListener('click', () => {
        d.setAttribute('aria-pressed', d.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        if (dots.every((x) => x.getAttribute('aria-pressed') === 'true')) setTimeout(() => { step++; render(); focusStep(); }, 600);
      }));
      $('.js-g-next', box).addEventListener('click', () => { step++; render(); focusStep(); });
      const prev = $('.js-g-prev', box);
      if (prev) prev.addEventListener('click', () => { step--; render(); focusStep(); });
    }

    function focusStep() { const t = $('.js-g-title, h4', box); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } }
    render();
  }

  /* ======================================================================
     Recordatorio de respiración (anti apnea de pantalla)
     ====================================================================== */
  const NUDGES = [
    'Suelta los hombros y haz una exhalación larga.',
    '¿Estás aguantando la respiración? Inhala por la nariz… y suelta despacio.',
    'Tres respiraciones lentas antes de seguir. Tu cerebro te lo agradece.',
    'Separa los dientes, relaja la lengua, exhala largo.',
    'Mira por la ventana o a lo lejos y respira tranquilo/a.',
    'Un suspiro cíclico: dos inhalaciones por la nariz, una exhalación larga.',
    'Pies en el suelo. ¿Qué estás haciendo ahora mismo? Respira y elige.'
  ];

  function initReminder(root) {
    const sel = $('.js-rem-interval', root);
    const btn = $('.js-rem-toggle', root);
    const status = $('.js-rem-status', root);
    const testBtn = $('.js-rem-test', root);
    let timer = null, next = 0, ticker = null;

    function nudge() {
      const text = NUDGES[Math.floor(Math.random() * NUDGES.length)];
      if (window.WB_AUDIO) { window.WB_AUDIO.chime(523, 1.8, 0.07); setTimeout(() => window.WB_AUDIO.chime(392, 2, 0.06), 300); }
      if (WB.toast) WB.toast(`🌬️ ${text}`, 12000);
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        try { new Notification('Pausa para respirar', { body: text, icon: 'img/favicon.svg', tag: 'wb-breath' }); } catch (e) { /* sin notificación */ }
      }
    }

    function schedule() {
      const mins = Number(sel.value);
      next = Date.now() + mins * 60000;
      clearTimeout(timer);
      timer = setTimeout(() => { nudge(); schedule(); }, mins * 60000);
    }

    function updateStatus() {
      if (!timer) { status.textContent = 'Recordatorios desactivados.'; return; }
      const left = Math.max(0, Math.round((next - Date.now()) / 1000));
      status.textContent = `Activo. Próxima pausa en ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}. Deja esta pestaña abierta.`;
    }

    btn.addEventListener('click', async () => {
      if (timer) {
        clearTimeout(timer); clearInterval(ticker); timer = null;
        btn.textContent = 'Activar recordatorios'; sel.disabled = false; updateStatus();
        return;
      }
      if ('Notification' in window && Notification.permission === 'default') {
        try { await Notification.requestPermission(); } catch (e) { /* ignorado */ }
      }
      if (window.WB_AUDIO) window.WB_AUDIO.ensure();
      schedule();
      ticker = setInterval(updateStatus, 1000);
      btn.textContent = 'Desactivar'; sel.disabled = true; updateStatus();
    });
    if (testBtn) testBtn.addEventListener('click', () => { if (window.WB_AUDIO) window.WB_AUDIO.ensure(); nudge(); });
    updateStatus();
  }

  /* ======================================================================
     Estadísticas y ejercicio del día
     ====================================================================== */
  // Anima los números de 0 a su valor final
  function countUp(el, target) {
    const from = Number(el.textContent) || 0;
    if (from === target || matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = target; return; }
    const t0 = performance.now(), dur = 900;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function renderStats() {
    const stats = store.get(WB.STATS_KEY, { days: {}, sessions: 0 });
    const days = stats.days || {};
    const today = WB.todayKey();
    let week = 0;
    for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() - i); week += days[WB.todayKey(d)] || 0; }
    let streak = 0;
    const d = new Date();
    if (!days[today]) d.setDate(d.getDate() - 1); // la racha sigue viva si hoy aún no has practicado
    while (days[WB.todayKey(d)]) { streak++; d.setDate(d.getDate() - 1); }
    const values = { today: Math.round((days[today] || 0) / 60), week: Math.round(week / 60), streak, sessions: stats.sessions || 0 };
    $$('[data-stat]').forEach((el) => countUp(el, values[el.dataset.stat]));
    $$('[data-stat-message]').forEach((el) => {
      if (!values.sessions) el.textContent = 'Todavía no has hecho ninguna sesión. ¿Empezamos con una de un minuto?';
      else if (values.today) el.textContent = 'Hoy ya has dedicado un rato a respirar. Eso es cuidarse.';
      else if (streak) el.textContent = `Llevas ${streak} ${streak === 1 ? 'día' : 'días'} seguidos. Una sesión corta hoy mantiene la racha.`;
      else el.textContent = 'Cada día es un buen día para volver. Sin culpa: solo empieza.';
    });
  }

  function initExerciseOfDay() {
    const el = $('[data-exercise-of-day]');
    if (!el) return;
    const plan = [
      ['abdominal', 'Domingo: vuelve a lo básico y despierta tu diafragma.'],
      ['coherente', 'Lunes: empieza la semana con 5 minutos a tu ritmo coherente.'],
      ['exhalacion', 'Martes: alarga tus exhalaciones y suelta tensión.'],
      ['cuadrada', 'Miércoles: a mitad de semana, céntrate con la respiración cuadrada.'],
      ['suspiro', 'Jueves: el suspiro cíclico, la dosis de calma más estudiada.'],
      ['ligera', 'Viernes: aprende a respirar menos (y mejor).'],
      ['478', 'Sábado: regálate un 4-7-8 antes de dormir.']
    ];
    const [id, text] = plan[new Date().getDay()];
    const ex = window.WB_EXERCISES[id];
    el.innerHTML = `
      <span class="tag">Ejercicio del día</span>
      <h3 class="mt-1" style="font-size:1.6rem">${esc(ex.name)}</h3>
      <p>${esc(text)}</p>
      <p class="muted small">${esc(ex.short)}</p>
      <a class="btn" href="ejercicios.html#${id}">Practicarlo ahora</a>`;
  }

  function init() {
    initLibrary();
    $$('[data-tool="bolt"]').forEach(initBolt);
    $$('[data-tool="counter"]').forEach(initCounter);
    $$('[data-tool="quiz"]').forEach(initQuiz);
    $$('[data-tool="habits"]').forEach(initHabits);
    $$('[data-tool="grounding"]').forEach(initGrounding);
    $$('[data-tool="reminder"]').forEach(initReminder);
    initExerciseOfDay();
    renderStats();
    document.addEventListener('wb:practice', renderStats);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
