# WellBreath · Respirar bien, vivir mejor

Web para mejorar los hábitos de respiración en el día a día, inspirada en el libro *Respira* de James Nestor y contrastada con investigación científica. Incluye ejercicios interactivos guiados y secciones dedicadas a la **ansiedad** y al **TDAH en adultos**, escritas con un tono cálido y cercano.

## Qué incluye

| Página | Contenido |
| --- | --- |
| `index.html` | Portada, práctica guiada de 1 minuto, claves del libro, estadísticas personales y ejercicio del día |
| `habitos.html` | Las 6 claves de *Respira* (nariz, lento, menos, exhalar, masticar, noche), autoevaluación, contador de respiraciones por minuto, test BOLT y registro diario de hábitos |
| `ejercicios.html` | Biblioteca de 9 ejercicios con reproductor animado, selector según cómo te sientes, consejos y rutinas |
| `ansiedad.html` | Artículo sobre ansiedad y respiración (círculo vicioso, CO₂, mitos, plan diario, cuándo pedir ayuda), ejercicios y anclaje 5-4-3-2-1 interactivo |
| `tdah.html` | Artículo sobre TDAH y respiración (regulación emocional, atención, apnea de pantalla, sueño), ejercicios adaptados y recordatorios de respiración |
| `fuentes.html` | Referencias científicas, aviso de salud y privacidad |

### El reproductor de respiración
- Círculo animado que crece al inhalar y se encoge al exhalar, con cuenta atrás y anillo de progreso.
- Sonido opcional (campanas suaves u «olas» que siguen tu respiración), voz en español y vibración.
- Ritmo y duración ajustables; mantiene la pantalla encendida durante la práctica.
- Botón **«Calma ahora»** en todas las páginas con suspiros cíclicos guiados.

Todo el progreso se guarda solo en el navegador (`localStorage`): sin cuentas, sin cookies de seguimiento, sin servidor.

## Cómo verla en local

Es un sitio estático, sin dependencias ni compilación. Diseño con paleta viva (azul, verde, violeta y amarillo), tipografías Plus Jakarta Sans e Inter, secciones a pantalla completa, modo claro/oscuro y animaciones suaves que respetan «reducir movimiento»:

```bash
python3 -m http.server 8000
# y abre http://localhost:8000
```

## Publicarla gratis con GitHub Pages

1. En GitHub, ve a **Settings → Pages**.
2. En *Source*, elige **Deploy from a branch**, selecciona la rama y la carpeta `/ (root)`.
3. En un par de minutos estará disponible en `https://<usuario>.github.io/WellBreath/`.

## Estructura

```
├── index.html, habitos.html, ejercicios.html, ansiedad.html, tdah.html, fuentes.html
├── css/styles.css        # Sistema de diseño (modo claro/oscuro, responsive)
├── js/exercises.js       # Biblioteca de ejercicios (añadir uno nuevo es añadir un objeto)
├── js/breath.js          # Motor del reproductor: animación, sonido, voz, estadísticas
├── js/tools.js           # Herramientas: test BOLT, contador, cuestionario, hábitos, anclaje, recordatorios
├── js/app.js             # Navegación, tema, modal «Calma ahora», avisos
├── img/favicon.svg
└── manifest.webmanifest
```

## Aviso

WellBreath es un proyecto divulgativo y de bienestar. No sustituye el consejo, diagnóstico ni tratamiento de un profesional sanitario.
