/* ==========================================================================
   WellBreath — Biblioteca de ejercicios de respiración
   Cada ejercicio define cómo se construye su ritmo (build) a partir de las
   opciones elegidas por la persona. Tipos de fase:
     in   → inhalar          in2  → segunda inhalación corta (suspiro)
     hold → retener lleno    out  → exhalar          rest → pausa en vacío
   ========================================================================== */
(function () {
  'use strict';

  const minutes = (values, def) => ({ type: 'minutes', values, default: def });

  const EXERCISES = {
    coherente: {
      name: 'Respiración coherente',
      short: 'Inhala y exhala despacio, al mismo ritmo. La base de todo.',
      pattern: '5,5 · 5,5',
      categories: ['base', 'calma'],
      library: true,
      duration: minutes([1, 3, 5, 10, 15], 5),
      options: [
        { key: 'pace', label: 'Segundos por inhalación y exhalación', min: 3.5, max: 7, step: 0.5, default: 5.5, unit: ' s' }
      ],
      build: (o) => ({ cycle: [
        { type: 'in', secs: o.pace },
        { type: 'out', secs: o.pace }
      ] }),
      hints: {
        in: 'Por la nariz, suave, llenando primero el abdomen.',
        out: 'Deja salir el aire sin empujar, como un globo que se vacía solo.'
      },
      intro: 'Es el ritmo que James Nestor describe en Respira como la respiración que más le cambió la vida: unas 5,5 respiraciones por minuto. A esa velocidad el corazón, la presión arterial y la respiración tienden a sincronizarse, y la variabilidad de la frecuencia cardiaca (un buen marcador de resiliencia al estrés) aumenta.',
      how: [
        'Siéntate con la espalda cómoda, sin rigidez. Hombros sueltos.',
        'Respira por la nariz, sin hacer ruido, hacia la parte baja de las costillas.',
        'Sigue el círculo: crece al inhalar, se encoge al exhalar.',
        'Si te falta el aire, baja el ritmo a 4 o 4,5 segundos. Con la práctica podrás alargarlo.'
      ],
      benefits: ['Reduce la activación del estrés', 'Aumenta la variabilidad cardiaca', 'Ideal como práctica diaria de 5 a 10 minutos'],
      caution: 'Nada debería doler ni marearte. Si notas mareo, respira más suave (menos volumen), no más profundo.',
      source: 'Nestor, Respira (2020); Lehrer y Gevirtz (2014); Bernardi et al., BMJ (2001).',
      done: 'Precioso. Quédate unos segundos notando cómo late tu corazón ahora.'
    },

    suspiro: {
      name: 'Suspiro cíclico',
      short: 'Dos inhalaciones por la nariz y una exhalación larga por la boca.',
      pattern: '2+1 · 6',
      categories: ['calma', 'ansiedad'],
      library: true,
      duration: minutes([1, 2, 3, 5], 3),
      options: [
        { key: 'out', label: 'Duración de la exhalación', min: 4, max: 9, step: 0.5, default: 6, unit: ' s' }
      ],
      build: (o) => ({ cycle: [
        { type: 'in', secs: 2.2, to: 0.84 },
        { type: 'in2', secs: 1, to: 1 },
        { type: 'out', secs: o.out }
      ] }),
      hints: {
        in: 'Inhala por la nariz, llenando los pulmones casi del todo…',
        in2: '…y una pequeña inhalación extra para terminar de llenarlos.',
        out: 'Ahora suelta todo el aire por la boca, despacio, hasta el final.'
      },
      intro: 'Es lo que tu cuerpo hace solo cuando suspiras o cuando un bebé termina de llorar. La segunda inhalación reabre los alvéolos que se han ido cerrando y la exhalación larga activa la respuesta de calma. En un estudio de Stanford (2023), practicarlo 5 minutos al día durante un mes mejoró el estado de ánimo y redujo la frecuencia respiratoria en reposo, más que una meditación mindfulness de la misma duración.',
      how: [
        'Primera inhalación por la nariz, amplia pero sin forzar.',
        'Sin soltar el aire, añade una segunda inhalación corta para «rellenar».',
        'Exhala lentamente por la boca, como si soplaras a través de una pajita, hasta vaciarte.',
        'Uno o dos suspiros ya ayudan en un momento de agobio. Cinco minutos al día es la dosis estudiada.'
      ],
      benefits: ['El ejercicio más rápido para bajar revoluciones', 'Útil en momentos de ansiedad o enfado', 'Mejora del ánimo con práctica diaria'],
      caution: 'Si te mareas, haz la segunda inhalación más pequeña y la exhalación más suave.',
      source: 'Balban et al., Cell Reports Medicine (2023); Li et al., Nature (2016) sobre el suspiro.',
      done: 'Bien hecho. Fíjate en tus hombros y tu mandíbula: ¿están más sueltos?'
    },

    cuadrada: {
      name: 'Respiración cuadrada',
      short: 'Cuatro tiempos iguales: inhala, mantén, exhala, mantén.',
      pattern: '4 · 4 · 4 · 4',
      categories: ['foco', 'calma'],
      library: true,
      duration: minutes([1, 3, 5, 10], 3),
      options: [
        { key: 'side', label: 'Segundos por lado', min: 3, max: 6, step: 1, default: 4, unit: ' s' }
      ],
      build: (o) => ({ cycle: [
        { type: 'in', secs: o.side },
        { type: 'hold', secs: o.side },
        { type: 'out', secs: o.side },
        { type: 'rest', secs: o.side }
      ] }),
      hints: {
        in: 'Inhala por la nariz, recorriendo el primer lado del cuadrado.',
        hold: 'Mantén el aire sin tensión: garganta relajada.',
        out: 'Exhala despacio por la nariz.',
        rest: 'Quédate en vacío, tranquilo. Enseguida vuelve el aire.'
      },
      intro: 'También llamada «box breathing». Su estructura fija le da a la mente algo concreto en lo que apoyarse, por eso es muy útil para centrarte antes de una reunión, un examen o una conversación difícil.',
      how: [
        'Imagina un cuadrado. Cada lado es una fase.',
        'Las retenciones deben ser suaves: no cierres la garganta con fuerza.',
        'Si 4 segundos se hacen largos, empieza con 3.'
      ],
      benefits: ['Ayuda a concentrarte', 'Estructura muy fácil de recordar', 'Buena para antes de situaciones exigentes'],
      caution: 'Si tienes la presión alta sin controlar o estás embarazada, haz las retenciones cortas (2 s) o elimínalas.',
      source: 'Técnica de uso común en entrenamiento de manejo del estrés; ver revisión de Zaccaro et al. (2018).',
      done: 'Hecho. Tu mente tenía un cuadrado al que agarrarse. ¿Cómo está ahora?'
    },

    '478': {
      name: 'Respiración 4-7-8',
      short: 'Para soltar la tensión del día y preparar el sueño.',
      pattern: '4 · 7 · 8',
      categories: ['dormir', 'calma'],
      library: true,
      duration: { type: 'cycles', values: [4, 6, 8], default: 4 },
      options: [
        { key: 'speed', label: 'Velocidad (1 = ritmo completo)', min: 0.5, max: 1, step: 0.1, default: 1, unit: '×' }
      ],
      build: (o) => ({ cycle: [
        { type: 'in', secs: 4 * o.speed },
        { type: 'hold', secs: 7 * o.speed },
        { type: 'out', secs: 8 * o.speed }
      ] }),
      hints: {
        in: 'Inhala en silencio por la nariz.',
        hold: 'Mantén el aire, cómodo, sin apretar.',
        out: 'Exhala por la boca, con un suave «fuuu», hasta el final.'
      },
      intro: 'Popularizada por el médico Andrew Weil a partir de técnicas del pranayama. La exhalación, el doble de larga que la inhalación, es la que hace el trabajo de calmarte. Lo importante es la proporción, no los segundos exactos.',
      how: [
        'Apoya la punta de la lengua detrás de los dientes de arriba.',
        'Haz 4 ciclos para empezar. Con el tiempo puedes llegar a 8.',
        'Si la retención de 7 se hace pesada, baja la velocidad a 0,6 o 0,7: mantienes la proporción.',
        'Puedes hacerla ya tumbado, con la luz apagada.'
      ],
      benefits: ['Rutina para antes de dormir', 'Exhalación larga que activa la calma', 'Pocos ciclos, poco tiempo'],
      caution: 'Es normal un ligero mareo las primeras veces: haz menos ciclos. Evita las retenciones largas si estás embarazada o tienes problemas cardiacos.',
      source: 'Andrew Weil; mecanismos de la exhalación lenta en Zaccaro et al. (2018).',
      done: 'Perfecto. Si estás en la cama, deja que tu respiración vaya a su aire ahora.'
    },

    exhalacion: {
      name: 'Exhalación larga',
      short: 'La exhalación más larga que la inhalación. Calma inmediata.',
      pattern: '4 · 6',
      categories: ['calma', 'ansiedad', 'base'],
      library: true,
      duration: minutes([1, 3, 5, 10], 3),
      options: [
        { key: 'inh', label: 'Inhalación', min: 3, max: 5, step: 0.5, default: 4, unit: ' s' },
        { key: 'exh', label: 'Exhalación', min: 5, max: 10, step: 0.5, default: 6, unit: ' s' }
      ],
      build: (o) => ({ cycle: [
        { type: 'in', secs: o.inh },
        { type: 'out', secs: Math.max(o.exh, o.inh) }
      ] }),
      hints: {
        in: 'Inhala por la nariz, sin prisa.',
        out: 'Exhala más lento todavía, como si empañaras un cristal.'
      },
      intro: 'Cada vez que exhalas, tu corazón se ralentiza un poco gracias al nervio vago (es la llamada arritmia sinusal respiratoria). Si alargas la exhalación, le das más tiempo a ese freno natural. Es una herramienta sencilla que puedes usar en cualquier sitio sin que nadie lo note.',
      how: [
        'Empieza con 4 de inhalación y 6 de exhalación.',
        'Cuando te resulte fácil, alarga la exhalación a 7 u 8.',
        'Puedes exhalar por la nariz o por la boca con los labios entreabiertos.'
      ],
      benefits: ['Discreta: puedes hacerla en público', 'Baja la frecuencia cardiaca', 'Muy útil en momentos de agobio'],
      caution: 'No vacíes los pulmones a la fuerza: la exhalación es larga, no tensa.',
      source: 'Zaccaro et al., Frontiers in Human Neuroscience (2018); Lehrer y Gevirtz (2014).',
      done: 'Bien. Has activado tu freno natural. Vuelve a lo tuyo con esta calma.'
    },

    abdominal: {
      name: 'Respiración abdominal',
      short: 'Aprende a usar tu diafragma, el gran músculo de la respiración.',
      pattern: 'Vientre',
      categories: ['base'],
      library: true,
      duration: minutes([2, 3, 5, 10], 3),
      options: [
        { key: 'inh', label: 'Inhalación', min: 3, max: 6, step: 0.5, default: 4, unit: ' s' },
        { key: 'exh', label: 'Exhalación', min: 4, max: 8, step: 0.5, default: 6, unit: ' s' }
      ],
      build: (o) => ({ cycle: [
        { type: 'in', secs: o.inh },
        { type: 'out', secs: o.exh }
      ] }),
      hints: {
        in: 'Nota cómo la mano del vientre sube y las costillas se abren hacia los lados.',
        out: 'El vientre baja solo. La mano del pecho apenas se mueve.'
      },
      intro: 'Con el estrés solemos respirar con el pecho y los hombros, lo que mantiene al cuerpo en modo alerta. Con este ejercicio vuelves a la respiración diafragmática: el diafragma baja al inhalar, el abdomen se expande y los pulmones se llenan desde abajo. Un estudio de 2017 encontró que 8 semanas de práctica mejoraron la atención y redujeron el cortisol.',
      how: [
        'Siéntate o túmbate. Pon una mano en el pecho y otra en el vientre, bajo el ombligo.',
        'Al inhalar por la nariz, deja que suba la mano del vientre. La del pecho, casi quieta.',
        'Las costillas también se abren hacia los lados, como un acordeón.',
        'Al exhalar, el abdomen vuelve solo, sin apretar.'
      ],
      benefits: ['Corrige la respiración alta y tensa', 'Base para el resto de ejercicios', 'Mejora la atención con práctica regular'],
      caution: 'No hinches el vientre a la fuerza. Es un movimiento suave y amplio, no un esfuerzo.',
      source: 'Ma et al., Frontiers in Psychology (2017).',
      done: 'Muy bien. Tu diafragma lo agradece. Intenta recordar esta sensación durante el día.'
    },

    ligera: {
      name: 'Respirar menos',
      short: 'Respiración ligera y silenciosa para aumentar tu tolerancia al CO₂.',
      pattern: 'Suave',
      categories: ['base'],
      library: true,
      duration: minutes([2, 3, 5], 3),
      options: [],
      build: () => ({ cycle: [
        { type: 'in', secs: 2.5, to: 0.72 },
        { type: 'out', secs: 3.5 },
        { type: 'rest', secs: 2 }
      ] }),
      hints: {
        in: 'Toma un poquito menos de aire del que te pide el cuerpo.',
        out: 'Suelta el aire relajado, sin ruido.',
        rest: 'Una pequeña pausa natural. Nota una ligera hambre de aire, agradable.'
      },
      intro: 'Una de las ideas más sorprendentes de Respira: la mayoría respiramos demasiado. El dióxido de carbono no es solo un desecho; lo necesitamos para que la hemoglobina suelte el oxígeno a los tejidos (efecto Bohr). Esta práctica, inspirada en el método Buteyko, enseña a tu cuerpo a sentirse cómodo con un poco menos de aire.',
      how: [
        'Respira solo por la nariz y de forma silenciosa: si alguien estuviera a tu lado, no te oiría.',
        'Reduce un poco el tamaño de cada respiración, sin aguantar la respiración.',
        'Busca una ligera «hambre de aire» que puedas mantener con calma. Si se vuelve incómoda, descansa.',
        'Relaja el pecho y los hombros: la tensión aumenta la necesidad de aire.'
      ],
      benefits: ['Aumenta la tolerancia al CO₂', 'Contrarresta la sobrerrespiración crónica', 'Respiración más eficiente en reposo'],
      caution: 'La sensación de falta de aire debe ser leve. Si te genera ansiedad, para y vuelve a la respiración coherente.',
      source: 'Nestor, Respira (2020); McKeown, The Oxygen Advantage (2015).',
      done: 'Gracias por tu paciencia. Respirar menos es un arte: se aprende poco a poco.'
    },

    reset: {
      name: 'Reset de 1 minuto',
      short: 'Pensado para mentes rápidas: corto, visual y con propósito.',
      pattern: '60 s',
      categories: ['foco', 'tdah'],
      library: true,
      duration: { type: 'fixed' },
      options: [],
      build: () => ({ sequence: [
        { type: 'in', secs: 2.2, to: 0.84, cycle: 1, hint: 'Suspiro 1: inhala por la nariz…' },
        { type: 'in2', secs: 1, to: 1, cycle: 1, hint: '…y un poco más.' },
        { type: 'out', secs: 6, cycle: 1, hint: 'Suelta todo por la boca.' },
        { type: 'in', secs: 2.2, to: 0.84, cycle: 2, hint: 'Suspiro 2: inhala…' },
        { type: 'in2', secs: 1, to: 1, cycle: 2, hint: '…un poquito más.' },
        { type: 'out', secs: 6, cycle: 2, hint: 'Exhala largo. Suelta los hombros.' },
        { type: 'in', secs: 4, cycle: 3, hint: 'Ahora respira lento por la nariz.' },
        { type: 'out', secs: 6, cycle: 3, hint: 'Nota los pies en el suelo.' },
        { type: 'in', secs: 4, cycle: 4, hint: 'Inhala…' },
        { type: 'out', secs: 6, cycle: 4, hint: 'Exhala. ¿Dónde está tu atención ahora?' },
        { type: 'in', secs: 4, cycle: 5, hint: 'Inhala…' },
        { type: 'out', secs: 6, cycle: 5, hint: 'Exhala. Piensa: ¿cuál es mi siguiente paso?' },
        { type: 'in', secs: 4, cycle: 6, hint: 'Última inhalación…' },
        { type: 'out', secs: 6, cycle: 6, hint: 'Exhala y dilo en voz baja: «Ahora voy a…».' }
      ] }),
      hints: {},
      intro: 'Diseñado para personas con TDAH (y para cualquiera con la cabeza a mil). Dos suspiros cíclicos para bajar revoluciones, cuatro respiraciones lentas para aterrizar y una pregunta final para elegir conscientemente tu siguiente tarea. Úsalo entre tareas, después de una interrupción o cuando notes que te dispersas.',
      how: [
        'No necesitas cerrar los ojos ni sentarte en postura de meditación.',
        'Sigue las instrucciones que aparecen bajo el círculo.',
        'Al final, nombra en voz alta (o escribe) la única cosa que vas a hacer ahora.'
      ],
      benefits: ['Solo un minuto: cabe en cualquier día', 'Ayuda en las transiciones entre tareas', 'Corta el piloto automático'],
      caution: 'Ninguna en particular. Si te mareas con los suspiros, hazlos más suaves.',
      source: 'Combina el suspiro cíclico (Balban et al., 2023) con exhalación lenta (Zaccaro et al., 2018).',
      done: '¡Reset completado! Ve a por esa siguiente tarea. Solo esa.'
    },

    contador: {
      name: 'Contar respiraciones',
      short: 'Cuenta del 1 al 10. Si te pierdes, vuelves al 1 sin juzgarte.',
      pattern: '1 → 10',
      categories: ['foco', 'tdah'],
      library: true,
      display: 'count',
      duration: minutes([2, 3, 5, 10], 3),
      options: [
        { key: 'inh', label: 'Inhalación', min: 3, max: 5, step: 0.5, default: 4, unit: ' s' },
        { key: 'exh', label: 'Exhalación', min: 4, max: 7, step: 0.5, default: 5, unit: ' s' }
      ],
      build: (o) => ({ cycle: [
        { type: 'in', secs: o.inh },
        { type: 'out', secs: o.exh }
      ] }),
      hints: {
        in: 'Inhala…',
        out: 'Al exhalar, cuenta mentalmente el número que ves.'
      },
      intro: 'Contar respiraciones es un entrenamiento de atención muy concreto: hay una tarea clara, un número que seguir y un modo sencillo de darte cuenta de que te has distraído. Distraerte no es fallar: darte cuenta y volver ES el ejercicio. Cada vuelta es una repetición, como en el gimnasio.',
      how: [
        'El círculo te muestra el número de cada respiración, del 1 al 10.',
        'Cuenta mentalmente al exhalar.',
        'Si notas que te has ido a otro pensamiento, sonríe y empieza tu cuenta interna de nuevo en 1.',
        'No hay puntuación. Lo que entrena tu atención es el momento de volver.'
      ],
      benefits: ['Entrena la atención sostenida', 'Estructura clara, ideal si meditar te cuesta', 'Muestra con amabilidad cuándo te distraes'],
      caution: 'Ninguna en particular.',
      source: 'Levinson et al., Frontiers in Psychology (2014): el conteo de respiraciones como medida de mindfulness.',
      done: 'Hecho. ¿Cuántas veces volviste? Cada vuelta cuenta.'
    },

    sos: {
      name: 'Calma rápida',
      short: 'Suspiros cíclicos guiados para momentos difíciles.',
      pattern: 'SOS',
      categories: ['ansiedad'],
      library: false,
      duration: minutes([1, 2, 3, 5], 2),
      options: [],
      build: () => ({ cycle: [
        { type: 'in', secs: 2.4, to: 0.84 },
        { type: 'in2', secs: 1.1, to: 1 },
        { type: 'out', secs: 6.5 }
      ] }),
      hints: {
        in: 'Inhala por la nariz…',
        in2: '…un poquito más…',
        out: 'Y suéltalo todo despacio por la boca. Lo estás haciendo bien.'
      },
      intro: '',
      how: [], benefits: [], caution: '', source: 'Balban et al. (2023).',
      done: 'Lo has hecho. Esto pasa. Tómate tu tiempo antes de seguir.'
    }
  };

  // Valores por defecto de cada ejercicio (opciones + duración)
  Object.keys(EXERCISES).forEach((id) => {
    const ex = EXERCISES[id];
    ex.id = id;
    ex.defaults = {};
    (ex.options || []).forEach((opt) => { ex.defaults[opt.key] = opt.default; });
  });

  window.WB_EXERCISES = EXERCISES;

  window.WB_CATEGORIES = {
    todos: 'Todos',
    base: 'Base diaria',
    calma: 'Calma',
    ansiedad: 'Ansiedad',
    foco: 'Foco',
    tdah: 'TDAH',
    dormir: 'Dormir'
  };
})();
