/* ==========================================================================
   WellBreath — Motor de respiración guiada (con Soplo)
   Reproductor reutilizable: <div data-breath-player="coherente"></div>
   Atributos opcionales: data-compact, data-minutes, data-hide-settings,
   data-show-title, data-variant="hero", data-mood="none|after|both"
   ========================================================================== */
(function () {
  'use strict';

  const MIN_SCALE = 0.42;
  const RING_C = 2 * Math.PI * 96;
  const PREFS_KEY = 'wb-player-prefs';
  const STATS_KEY = 'wb-stats';
  const MOODS_KEY = 'wb-moods';
  const LAST_KEY = 'wb-last';

  const PHASE = {
    in:   { label: 'Inhala',      voice: 'Inhala',      face: 'in' },
    in2:  { label: 'Un poco más', voice: 'Un poco más', face: 'in' },
    hold: { label: 'Mantén',      voice: 'Mantén',      face: 'hold' },
    out:  { label: 'Exhala',      voice: 'Exhala',      face: 'out' },
    rest: { label: 'Pausa',       voice: 'Pausa',       face: 'rest' }
  };

  // Escala de ánimo: cara de Soplo, color y nombre
  const MOOD_SCALE = [
    { v: 1, mood: 'stressed', color: 'slate', label: 'Fatal' },
    { v: 2, mood: 'worried',  color: 'lilac', label: 'Regular' },
    { v: 3, mood: 'neutral',  color: 'honey', label: 'Normal' },
    { v: 4, mood: 'good',     color: 'sky',   label: 'Bien' },
    { v: 5, mood: 'calm',     color: 'leaf',  label: 'En calma' }
  ];

  /* ---------- Almacenamiento seguro ---------- */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* sin almacenamiento */ }
    }
  };

  const todayKey = (d = new Date()) => {
    const z = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  };

  function recordPractice(seconds, exId) {
    if (seconds < 20) return false;
    const stats = store.get(STATS_KEY, { days: {}, sessions: 0, byExercise: {} });
    const k = todayKey();
    stats.days = stats.days || {};
    stats.days[k] = (stats.days[k] || 0) + Math.round(seconds);
    stats.sessions = (stats.sessions || 0) + 1;
    stats.byExercise = stats.byExercise || {};
    stats.byExercise[exId] = (stats.byExercise[exId] || 0) + 1;
    store.set(STATS_KEY, stats);
    store.set(LAST_KEY, { id: exId, date: new Date().toISOString() });
    document.dispatchEvent(new CustomEvent('wb:practice', { detail: { seconds, exId } }));
    return true;
  }

  function recordMood(entry) {
    const list = store.get(MOODS_KEY, []);
    list.push(entry);
    store.set(MOODS_KEY, list.slice(-60));
    document.dispatchEvent(new CustomEvent('wb:mood', { detail: entry }));
  }

  /* ---------- Sonido ---------- */
  class BreathAudio {
    constructor() { this.ctx = null; this.noise = null; }

    ensure() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!this.ctx) this.ctx = new AC();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    }

    chime(freq, dur = 1.2, vol = 0.09) {
      const ctx = this.ensure(); if (!ctx) return;
      const t = ctx.currentTime;
      [1, 2.01].forEach((mult, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq * mult;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol / (i ? 4 : 1), t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g).connect(ctx.destination);
        osc.start(t); osc.stop(t + dur + 0.05);
      });
    }

    startWaves() {
      const ctx = this.ensure(); if (!ctx || this.noise) return;
      const len = ctx.sampleRate * 3;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { // ruido marrón: suave, como el mar
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        data[i] = last * 3.2;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 500;
      const gain = ctx.createGain(); gain.gain.value = 0.0001;
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start();
      this.noise = { src, filter, gain };
    }

    wave(type, secs) {
      if (!this.noise) this.startWaves();
      if (!this.noise) return;
      const t = this.ctx.currentTime;
      const { gain, filter } = this.noise;
      gain.gain.cancelScheduledValues(t); filter.frequency.cancelScheduledValues(t);
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), t);
      filter.frequency.setValueAtTime(filter.frequency.value, t);
      if (type === 'in' || type === 'in2') {
        gain.gain.linearRampToValueAtTime(type === 'in2' ? 0.5 : 0.42, t + secs);
        filter.frequency.linearRampToValueAtTime(type === 'in2' ? 1300 : 1100, t + secs);
      } else if (type === 'out') {
        gain.gain.linearRampToValueAtTime(0.03, t + secs);
        filter.frequency.linearRampToValueAtTime(380, t + secs);
      } else {
        gain.gain.linearRampToValueAtTime(type === 'hold' ? 0.22 : 0.03, t + Math.min(1, secs));
      }
    }

    quiet() {
      if (!this.noise) return;
      const t = this.ctx.currentTime;
      this.noise.gain.gain.cancelScheduledValues(t);
      this.noise.gain.gain.setTargetAtTime(0.0001, t, 0.3);
    }

    stopWaves() {
      if (!this.noise) return;
      const n = this.noise; this.noise = null;
      const t = this.ctx.currentTime;
      n.gain.gain.cancelScheduledValues(t);
      n.gain.gain.setTargetAtTime(0.0001, t, 0.25);
      setTimeout(() => { try { n.src.stop(); } catch (e) { /* ya parado */ } }, 1200);
    }

    cue(mode, type, secs) {
      if (mode === 'waves') return this.wave(type, secs);
      if (mode !== 'chimes') return;
      const tones = { in: 392, in2: 494, hold: 330, out: 262, rest: 220 };
      this.chime(tones[type], type === 'hold' || type === 'rest' ? 0.7 : 1.4, type === 'hold' || type === 'rest' ? 0.05 : 0.09);
    }

    finish(mode) {
      this.stopWaves();
      if (mode !== 'off') {
        this.chime(523, 2.2, 0.07);
        setTimeout(() => this.chime(659, 2.4, 0.06), 260);
        setTimeout(() => this.chime(784, 2.6, 0.05), 520);
      }
    }
  }
  const audio = new BreathAudio();
  window.WB_AUDIO = audio;

  /* ---------- Voz ---------- */
  let spanishVoice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const voices = speechSynthesis.getVoices();
    spanishVoice = voices.find((v) => /^es(-|_)ES/i.test(v.lang)) || voices.find((v) => /^es/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', pickVoice);
  }
  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = spanishVoice ? spanishVoice.lang : 'es-ES';
    if (spanishVoice) u.voice = spanishVoice;
    u.rate = 0.85; u.pitch = 0.95; u.volume = 0.9;
    speechSynthesis.speak(u);
  }

  /* ---------- Utilidades ---------- */
  const ease = (p) => 0.5 - Math.cos(Math.PI * p) / 2;
  const fmtTime = (s) => {
    s = Math.max(0, Math.round(s));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const fmtNum = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const soploSvg = (o) => (window.WB && WB.soplo ? WB.soplo(o) : '');

  function buildTimeline(ex, opts, dur) {
    const built = ex.build(opts);
    let seq = [];
    let cycles = 0;
    if (built.sequence) {
      seq = built.sequence.map((p) => Object.assign({}, p));
      cycles = seq.reduce((m, p) => Math.max(m, p.cycle || 1), 1);
    } else {
      const cycleSecs = built.cycle.reduce((a, p) => a + p.secs, 0);
      cycles = ex.duration.type === 'cycles' ? dur : Math.max(1, Math.round((dur * 60) / cycleSecs));
      for (let c = 0; c < cycles; c++) {
        built.cycle.forEach((p) => seq.push(Object.assign({}, p, { cycle: c + 1 })));
      }
    }
    let t = 0;
    let scale = MIN_SCALE;
    seq.forEach((p) => {
      p.start = t; t += p.secs; p.from = scale;
      if (p.type === 'in' || p.type === 'in2') p.to = p.to != null ? p.to : 1;
      else if (p.type === 'out') p.to = p.to != null ? p.to : MIN_SCALE;
      else p.to = scale;
      scale = p.to;
    });
    return { phases: seq, total: t, cycles };
  }

  const ICONS = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>'
  };

  let uid = 0;

  /* ---------- Reproductor ---------- */
  class BreathPlayer {
    constructor(el) {
      this.el = el;
      this.id = ++uid;
      this.variant = el.dataset.variant || '';
      this.compact = el.hasAttribute('data-compact');
      this.hideSettings = el.hasAttribute('data-hide-settings');
      this.showTitle = el.hasAttribute('data-show-title');
      this.moodMode = el.dataset.mood || (this.variant === 'hero' ? 'after' : 'both');
      this.prefs = Object.assign({ sound: 'off', voice: false, vibrate: false, soplo: true }, store.get(PREFS_KEY, {}));
      this.state = 'idle';
      this.elapsed = 0;
      this.raf = null;
      this.timer = null;
      this.wakeLock = null;
      this.pre = null;
      this.render();
      this.load(el.dataset.breathPlayer, el.dataset.minutes ? Number(el.dataset.minutes) : null);
      el.wbPlayer = this;
    }

    render() {
      const p = `bp${this.id}`;
      const cls = ['player', this.compact ? 'compact' : '', this.variant === 'hero' ? 'hero' : '', this.prefs.soplo ? '' : 'plain'].filter(Boolean).join(' ');
      this.el.innerHTML = `
        <div class="${cls}" data-face="idle">
          <h3 class="player-title"${this.showTitle ? '' : ' hidden'}></h3>
          <p class="player-sub"${this.showTitle ? '' : ' hidden'}></p>
          <div class="player-stage">
            <svg class="player-ring" viewBox="0 0 200 200" aria-hidden="true">
              <circle class="track" cx="100" cy="100" r="96"/>
              <circle class="progress" cx="100" cy="100" r="96" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C}"/>
            </svg>
            <div class="orb-ripple" aria-hidden="true"></div>
            <div class="orb" aria-hidden="true">${soploSvg({ player: true })}</div>
            <div class="particles" aria-hidden="true"></div>
          </div>
          <div class="player-readout"><span class="player-phase">Listo</span><span class="player-count" aria-hidden="true"></span></div>
          <p class="player-hint" aria-live="polite"></p>
          <div class="player-meta">
            <span><span class="m-cycle-label">Respiración</span> <b class="m-cycle">–</b></span>
            <span>Tiempo <b class="m-time">0:00</b></span>
          </div>
          <div class="player-controls">
            <button type="button" class="btn btn-lg js-toggle">${ICONS.play}<span>Empezar</span></button>
            <button type="button" class="btn btn-ghost btn-lg js-stop" hidden>${ICONS.stop}<span>Terminar</span></button>
          </div>
          <div class="mood-check js-mood" hidden>
            <span class="mood-q js-mood-q">¿Cómo llegas?</span>
            <div class="mood-faces" role="group" aria-label="Cómo te sientes">
              ${MOOD_SCALE.map((m) => `<button type="button" class="mood-face" data-v="${m.v}" aria-pressed="false" aria-label="${m.label}" title="${m.label}">${soploSvg({ mood: m.mood, color: m.color })}</button>`).join('')}
            </div>
            <p class="mood-thanks js-mood-thanks" hidden></p>
          </div>
          <details class="player-settings"${this.hideSettings ? ' hidden' : ''}>
            <summary>${ICONS.chevron} Ajustes: duración, ritmo y sonido</summary>
            <fieldset class="js-fieldset">
              <legend class="visually-hidden">Ajustes del ejercicio</legend>
              <div class="settings-grid">
                <div class="js-duration"></div>
                <div class="js-options"></div>
                <div>
                  <label class="setting-label" for="${p}-sound">Sonido guía</label>
                  <select id="${p}-sound" class="js-sound">
                    <option value="off">Sin sonido</option>
                    <option value="chimes">Campanas suaves</option>
                    <option value="waves">Olas (siguen tu respiración)</option>
                  </select>
                </div>
                <div class="toggle-row">
                  <label class="check"><input type="checkbox" class="js-voice"> Voz que te guía</label>
                  <label class="check js-vibrate-wrap"><input type="checkbox" class="js-vibrate"> Vibración</label>
                  <label class="check"><input type="checkbox" class="js-soplo"> Mostrar a Soplo</label>
                </div>
              </div>
            </fieldset>
          </details>
        </div>`;
      const q = (s) => this.el.querySelector(s);
      this.ui = {
        root: q('.player'), title: q('.player-title'), sub: q('.player-sub'), orb: q('.orb'), ripple: q('.orb-ripple'),
        ring: q('.progress'), particles: q('.particles'), stage: q('.player-stage'),
        phase: q('.player-phase'), count: q('.player-count'), hint: q('.player-hint'),
        cycle: q('.m-cycle'), cycleLabel: q('.m-cycle-label'), time: q('.m-time'),
        toggle: q('.js-toggle'), stop: q('.js-stop'), fieldset: q('.js-fieldset'),
        duration: q('.js-duration'), options: q('.js-options'),
        sound: q('.js-sound'), voice: q('.js-voice'), vibrate: q('.js-vibrate'), vibrateWrap: q('.js-vibrate-wrap'), soplo: q('.js-soplo'),
        mood: q('.js-mood'), moodQ: q('.js-mood-q'), moodThanks: q('.js-mood-thanks')
      };
      const u = this.ui;
      u.sound.value = this.prefs.sound;
      u.voice.checked = !!this.prefs.voice;
      u.vibrate.checked = !!this.prefs.vibrate;
      u.soplo.checked = this.prefs.soplo !== false;
      if (!('vibrate' in navigator)) u.vibrateWrap.hidden = true;
      if (!('speechSynthesis' in window)) u.voice.closest('label').hidden = true;
      if (window.WB && WB.renderSoplos) WB.renderSoplos(this.el);

      u.toggle.addEventListener('click', () => this.toggle());
      u.stop.addEventListener('click', () => this.stop());
      u.sound.addEventListener('change', () => {
        this.savePrefs({ sound: u.sound.value });
        if (u.sound.value !== 'waves') audio.stopWaves();
        if (u.sound.value === 'chimes') audio.chime(392);
      });
      u.voice.addEventListener('change', () => this.savePrefs({ voice: u.voice.checked }));
      u.vibrate.addEventListener('change', () => {
        this.savePrefs({ vibrate: u.vibrate.checked });
        if (u.vibrate.checked && navigator.vibrate) navigator.vibrate(40);
      });
      u.soplo.addEventListener('change', () => this.savePrefs({ soplo: u.soplo.checked }));
      u.mood.addEventListener('click', (e) => {
        const b = e.target.closest('.mood-face');
        if (b) this.pickMood(Number(b.dataset.v));
      });
    }

    savePrefs(patch) {
      Object.assign(this.prefs, patch);
      store.set(PREFS_KEY, this.prefs);
      this.applyPrefs();
      // sincroniza el resto de reproductores de la página
      document.querySelectorAll('[data-breath-player]').forEach((el) => {
        if (el.wbPlayer && el.wbPlayer !== this) el.wbPlayer.syncPrefs(this.prefs);
      });
    }

    syncPrefs(prefs) {
      this.prefs = Object.assign({}, prefs);
      const u = this.ui;
      u.sound.value = prefs.sound; u.voice.checked = !!prefs.voice; u.vibrate.checked = !!prefs.vibrate; u.soplo.checked = prefs.soplo !== false;
      this.applyPrefs();
    }

    applyPrefs() { this.ui.root.classList.toggle('plain', this.prefs.soplo === false); }

    load(id, durOverride) {
      const ex = window.WB_EXERCISES && window.WB_EXERCISES[id];
      if (!ex) return;
      this.stop(true);
      this.ex = ex;
      this.opts = Object.assign({}, ex.defaults);
      this.dur = ex.duration.type === 'fixed' ? null
        : (durOverride && ex.duration.values.includes(durOverride) ? durOverride : ex.duration.default);
      this.el.dataset.breathPlayer = id;
      this.ui.title.textContent = ex.name;
      this.ui.sub.textContent = ex.short;
      this.ui.cycleLabel.textContent = ex.display === 'count' ? 'Vuelta' : 'Respiración';
      this.renderSettings();
      this.rebuild();
    }

    renderSettings() {
      const ex = this.ex;
      const u = this.ui;
      const p = `bp${this.id}`;
      u.duration.innerHTML = '';
      if (ex.duration.type !== 'fixed') {
        const isCycles = ex.duration.type === 'cycles';
        const label = document.createElement('span');
        label.className = 'setting-label';
        label.id = `${p}-dur`;
        label.textContent = isCycles ? 'Número de ciclos' : 'Duración';
        const chips = document.createElement('div');
        chips.className = 'chips'; chips.setAttribute('role', 'group'); chips.setAttribute('aria-labelledby', label.id);
        ex.duration.values.forEach((v) => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'chip';
          b.textContent = isCycles ? `${v} ciclos` : `${v} min`;
          b.setAttribute('aria-pressed', String(v === this.dur));
          b.addEventListener('click', () => {
            this.dur = v;
            chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
            this.rebuild();
          });
          chips.appendChild(b);
        });
        u.duration.append(label, chips);
      }
      u.options.innerHTML = '';
      (ex.options || []).forEach((opt) => {
        const wrap = document.createElement('div');
        const inputId = `${p}-${opt.key}`;
        wrap.innerHTML = `
          <label class="setting-label" for="${inputId}">${opt.label}</label>
          <div class="range-row">
            <input type="range" id="${inputId}" min="${opt.min}" max="${opt.max}" step="${opt.step}" value="${this.opts[opt.key]}">
            <output for="${inputId}">${fmtNum(this.opts[opt.key])}${opt.unit}</output>
          </div>`;
        const input = wrap.querySelector('input');
        const out = wrap.querySelector('output');
        input.addEventListener('input', () => {
          this.opts[opt.key] = Number(input.value);
          out.textContent = fmtNum(this.opts[opt.key]) + opt.unit;
          this.rebuild();
        });
        u.options.appendChild(wrap);
      });
    }

    rebuild() {
      this.timeline = buildTimeline(this.ex, this.opts, this.dur);
      this.elapsed = 0;
      this.phaseIndex = -1;
      this.showIdle();
    }

    setFace(face) { this.ui.root.dataset.face = face; }

    emit(state) { this.el.dispatchEvent(new CustomEvent('wb:state', { bubbles: true, detail: { state, id: this.ex && this.ex.id } })); }

    showMood(moment) {
      const u = this.ui;
      const enabled = this.moodMode === 'both' || (this.moodMode === 'after' && moment === 'after');
      u.mood.hidden = !enabled;
      if (!enabled) return;
      u.mood.dataset.moment = moment;
      u.moodQ.textContent = moment === 'before' ? '¿Cómo llegas? (opcional)' : '¿Y ahora, cómo te sientes?';
      u.moodThanks.hidden = true;
      u.mood.querySelectorAll('.mood-face').forEach((b) => b.setAttribute('aria-pressed', String(moment === 'before' && Number(b.dataset.v) === this.pre)));
    }

    pickMood(v) {
      const u = this.ui;
      const moment = u.mood.dataset.moment;
      u.mood.querySelectorAll('.mood-face').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.v) === v)));
      if (moment === 'before') { this.pre = v; return; }
      if (this.moodSaved) return;
      this.moodSaved = true;
      recordMood({ date: new Date().toISOString(), ex: this.ex.id, pre: this.pre, post: v });
      const before = MOOD_SCALE.find((m) => m.v === this.pre);
      const after = MOOD_SCALE.find((m) => m.v === v);
      let msg = 'Gracias por contármelo. Lo guardo en tu rincón.';
      if (before && v > this.pre) msg = `Has pasado de «${before.label}» a «${after.label}». ¡Eso es respirar!`;
      else if (before && v === this.pre) msg = 'Igual que al empezar, y está bien. Cada sesión suma.';
      else if (before && v < this.pre) msg = 'Hoy cuesta más, y no pasa nada. Gracias por cuidarte igualmente.';
      u.moodThanks.textContent = msg;
      u.moodThanks.hidden = false;
    }

    showIdle() {
      const u = this.ui;
      this.setFace('idle');
      u.orb.style.transform = '';
      u.phase.textContent = 'Listo';
      u.count.textContent = '';
      u.hint.textContent = this.showTitle ? 'Cuando quieras, pulsa «Empezar» y sigue a Soplo.' : this.ex.short;
      u.cycle.textContent = `0 / ${this.timeline.cycles}`;
      u.time.textContent = fmtTime(this.timeline.total);
      u.ring.style.strokeDashoffset = RING_C;
      u.toggle.innerHTML = `${ICONS.play}<span>Empezar</span>`;
      u.stop.hidden = true;
      u.fieldset.disabled = false;
      this.moodSaved = false;
      this.showMood('before');
    }

    toggle() {
      if (this.state === 'running') this.pause();
      else this.start();
    }

    start() {
      if (this.state === 'done') { this.pre = null; this.rebuild(); }
      // pausa los demás reproductores
      document.querySelectorAll('[data-breath-player]').forEach((el) => {
        if (el.wbPlayer && el.wbPlayer !== this && el.wbPlayer.state === 'running') el.wbPlayer.pause();
      });
      if (this.prefs.sound !== 'off') audio.ensure();
      if (!this.baseTitle) this.baseTitle = document.title;
      this.state = 'running';
      this.t0 = performance.now() - this.elapsed * 1000;
      if (this.elapsed > 0 && this.phaseIndex >= 0) {
        const ph = this.timeline.phases[this.phaseIndex];
        this.setFace(PHASE[ph.type].face);
        if (ph && this.prefs.sound === 'waves') audio.wave(ph.type, Math.max(0.3, ph.start + ph.secs - this.elapsed));
      }
      const u = this.ui;
      u.toggle.innerHTML = `${ICONS.pause}<span>Pausa</span>`;
      u.stop.hidden = false;
      u.fieldset.disabled = true;
      u.mood.hidden = true;
      this.requestWakeLock();
      this.emit('running');
      const loop = () => { this.tick(); if (this.state === 'running') this.raf = requestAnimationFrame(loop); };
      this.raf = requestAnimationFrame(loop);
      // respaldo cuando la pestaña está en segundo plano (rAF se detiene)
      this.timer = setInterval(() => { if (document.hidden) this.tick(); }, 250);
    }

    pause() {
      if (this.state !== 'running') return;
      this.state = 'paused';
      this.clearLoops();
      audio.quiet();
      if ('speechSynthesis' in window) speechSynthesis.cancel();
      this.releaseWakeLock();
      this.setFace('paused');
      this.restoreTitle('En pausa · ');
      this.ui.toggle.innerHTML = `${ICONS.play}<span>Continuar</span>`;
      this.ui.phase.textContent = 'En pausa';
      this.ui.count.textContent = '';
      this.emit('paused');
    }

    stop(silent) {
      const wasActive = this.state === 'running' || this.state === 'paused';
      this.clearLoops();
      this.releaseWakeLock();
      if (wasActive) {
        audio.stopWaves();
        if ('speechSynthesis' in window) speechSynthesis.cancel();
        if (!silent) recordPractice(this.elapsed, this.ex.id);
      }
      this.restoreTitle();
      this.state = 'idle';
      if (this.timeline) { this.elapsed = 0; this.phaseIndex = -1; this.showIdle(); }
      if (wasActive) this.emit('idle');
    }

    restoreTitle(prefix) {
      if (!this.baseTitle) return;
      document.title = (prefix || '') + this.baseTitle;
      if (!prefix) this.baseTitle = null;
    }

    clearLoops() {
      if (this.raf) cancelAnimationFrame(this.raf);
      if (this.timer) clearInterval(this.timer);
      this.raf = null; this.timer = null;
    }

    finish() {
      this.clearLoops();
      this.releaseWakeLock();
      this.state = 'done';
      audio.finish(this.prefs.sound);
      if (this.prefs.voice) speak('Muy bien. Has terminado.');
      if (this.prefs.vibrate && navigator.vibrate) navigator.vibrate([60, 80, 60]);
      this.restoreTitle();
      const u = this.ui;
      this.setFace('done');
      u.orb.style.transform = `scale(${MIN_SCALE + 0.14})`;
      u.phase.textContent = '¡Bien hecho!';
      u.count.textContent = '';
      u.hint.textContent = this.ex.done || 'Bien hecho.';
      u.ring.style.strokeDashoffset = 0;
      u.time.textContent = '0:00';
      u.toggle.innerHTML = `${ICONS.play}<span>Repetir</span>`;
      u.stop.hidden = true;
      u.fieldset.disabled = false;
      this.moodSaved = false;
      this.showMood('after');
      this.celebrate();
      recordPractice(this.timeline.total, this.ex.id);
      this.emit('done');
      this.el.dispatchEvent(new CustomEvent('wb:done', { bubbles: true, detail: { id: this.ex.id } }));
    }

    /* Pequeña fiesta al terminar: confeti suave con los colores de la web */
    celebrate() {
      if (reduceMotion()) return;
      const colors = ['var(--coral)', 'var(--sky)', 'var(--leaf)', 'var(--lilac)', 'var(--honey)'];
      for (let i = 0; i < 22; i++) {
        const c = document.createElement('span');
        c.className = 'confetti';
        const a = Math.random() * Math.PI * 2;
        const d = 90 + Math.random() * 120;
        c.style.setProperty('--dx', `${Math.cos(a) * d}px`);
        c.style.setProperty('--dy', `${Math.sin(a) * d + 40}px`);
        c.style.setProperty('--rot', `${Math.round(Math.random() * 540 - 270)}deg`);
        c.style.setProperty('--cc', colors[i % colors.length]);
        c.style.setProperty('--s', `${6 + Math.random() * 8}px`);
        if (i % 3 === 0) c.style.setProperty('--r', '3px');
        this.ui.stage.appendChild(c);
        setTimeout(() => c.remove(), 1700);
      }
    }

    /* Partículas de aire que salen de la boca de Soplo al exhalar */
    puff(scale) {
      if (reduceMotion() || this.prefs.soplo === false) return;
      const n = 5;
      for (let i = 0; i < n; i++) {
        const s = document.createElement('span');
        s.className = 'particle';
        const a = Math.PI / 2 + (Math.random() - 0.5) * 1.9; // hacia abajo y a los lados
        const d = 60 + Math.random() * 70;
        s.style.top = `${50 + 13 * scale}%`;
        s.style.setProperty('--dx', `${Math.cos(a) * d}px`);
        s.style.setProperty('--dy', `${Math.sin(a) * d * 0.6 + 20}px`);
        s.style.setProperty('--s', `${5 + Math.random() * 9}px`);
        s.style.setProperty('--t', `${1.8 + Math.random() * 1.2}s`);
        s.style.animationDelay = `${i * 0.18}s`;
        this.ui.particles.appendChild(s);
        setTimeout(() => s.remove(), 4000);
      }
    }

    tick() {
      const tl = this.timeline;
      this.elapsed = (performance.now() - this.t0) / 1000;
      if (this.elapsed >= tl.total) { this.finish(); return; }

      let i = this.phaseIndex < 0 ? 0 : this.phaseIndex;
      while (i < tl.phases.length - 1 && this.elapsed >= tl.phases[i].start + tl.phases[i].secs) i++;
      const ph = tl.phases[i];
      const u = this.ui;

      if (i !== this.phaseIndex) {
        this.phaseIndex = i;
        const info = PHASE[ph.type];
        this.setFace(info.face);
        u.phase.textContent = info.label;
        u.hint.textContent = ph.hint || (this.ex.hints && this.ex.hints[ph.type]) || '';
        u.cycle.textContent = this.ex.display === 'count' ? `${Math.ceil(ph.cycle / 10)}` : `${ph.cycle} / ${tl.cycles}`;
        if (this.baseTitle) document.title = `${info.label}… · ${this.baseTitle}`;
        if (ph.type === 'in' && u.ripple) { // onda suave al empezar a inhalar
          u.ripple.classList.remove('go'); void u.ripple.offsetWidth; u.ripple.classList.add('go');
        }
        if (ph.type === 'out') this.puff(ph.from);
        audio.cue(this.prefs.sound, ph.type, ph.secs);
        if (this.prefs.voice) speak(info.voice);
        if (this.prefs.vibrate && navigator.vibrate) navigator.vibrate(ph.type === 'in' || ph.type === 'out' ? 35 : 15);
      }

      const p = Math.min(1, (this.elapsed - ph.start) / ph.secs);
      const scale = ph.from + (ph.to - ph.from) * ease(p);
      u.orb.style.transform = `scale(${scale.toFixed(4)})`;
      u.count.textContent = this.ex.display === 'count'
        ? String(((ph.cycle - 1) % 10) + 1)
        : String(Math.max(1, Math.ceil(ph.start + ph.secs - this.elapsed)));
      u.time.textContent = fmtTime(tl.total - this.elapsed);
      u.ring.style.strokeDashoffset = RING_C * (1 - this.elapsed / tl.total);
    }

    async requestWakeLock() {
      try {
        if ('wakeLock' in navigator && !this.wakeLock) {
          this.wakeLock = await navigator.wakeLock.request('screen');
          this.wakeLock.addEventListener('release', () => { this.wakeLock = null; });
        }
      } catch (e) { this.wakeLock = null; }
    }

    releaseWakeLock() {
      if (this.wakeLock) { this.wakeLock.release().catch(() => {}); this.wakeLock = null; }
    }
  }

  // Si se vuelve a la pestaña durante una sesión, recupera el bloqueo de pantalla
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    document.querySelectorAll('[data-breath-player]').forEach((el) => {
      if (el.wbPlayer && el.wbPlayer.state === 'running') el.wbPlayer.requestWakeLock();
    });
  });

  function initPlayers(root = document) {
    root.querySelectorAll('[data-breath-player]').forEach((el) => {
      if (!el.wbPlayer) new BreathPlayer(el);
    });
  }

  window.WB = window.WB || {};
  Object.assign(window.WB, { BreathPlayer, initPlayers, store, todayKey, recordPractice, speak, STATS_KEY, MOODS_KEY, LAST_KEY, MOOD_SCALE });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initPlayers());
  else initPlayers();
})();
