# WellBreath · Respira conmigo, un rato al día

Web para mejorar los hábitos de respiración en el día a día, inspirada en el libro *Respira* de James Nestor y contrastada con investigación científica. Incluye ejercicios interactivos guiados y secciones dedicadas a la **ansiedad** y al **TDAH en adultos**, escritas con un tono cálido y cercano.

## Soplo, la mascota (y el logo)

**Soplo** es un soplo de aire con cara de calma: su cuerpo es una bocanada de aire y el remolino de su cabeza, el aire en movimiento. Es el logo de la web y, además, el guía de los ejercicios:

- se hincha al inhalar, hincha los mofletes al retener, cierra los ojos y **sopla** al exhalar (con partículas de aire), y lo celebra al terminar;
- toma el color de cada sección (coral en inicio, verde en hábitos, cielo en ejercicios, lila en ansiedad, miel en TDAH y pizarra en fuentes);
- parpadea, sigue el cursor con la mirada, da consejos si lo tocas y por la noche se duerme en el pie de página.

Quien prefiera algo más sencillo puede desactivarlo en los ajustes del reproductor y usar una pelota lisa.

## Qué incluye

| Página | Contenido |
| --- | --- |
| `index.html` | Hero que respira contigo, **Tu rincón** (planta, racha, semana, ánimo y sugerencia según la hora), historia con scroll, las 6 claves del libro y mosaico de secciones |
| `habitos.html` | Las claves de *Respira* (nariz, lento, menos, exhalar, masticar, noche), autoevaluación, contador de respiraciones, test BOLT y registro diario |
| `ejercicios.html` | Selector por estado de ánimo, biblioteca de 9 ejercicios con la «huella» de cada ritmo y reproductor guiado |
| `ansiedad.html` | Artículo sobre ansiedad y respiración, ejercicios, anclaje 5-4-3-2-1, mitos y cuándo pedir ayuda |
| `tdah.html` | Artículo sobre TDAH y respiración, ejercicios cortos y recordatorios antiapnea de pantalla |
| `fuentes.html` | Referencias científicas, aviso de salud y privacidad |

### Pensada para que apetezca volver
- **Una planta que crece** con cada sesión (10 niveles, de semilla a mariposa). Lo que aún no ha crecido se ve en tenue, para que veas hacia dónde vas. Nunca se marchita.
- **Racha amable** en la cabecera y resumen de tu semana.
- **¿Cómo llegas? / ¿Y ahora?**: un registro opcional del ánimo antes y después de practicar, para comprobar qué te sienta bien.
- **Saludo y sugerencia según la hora** del día y acceso rápido a tu último ejercicio.

### Detalles de interfaz
- Paleta suave y cálida con contraste AA verificado, modo claro y oscuro.
- Tipografías Bricolage Grotesque y Figtree **alojadas en la propia web** (sin peticiones a terceros).
- Animaciones con el scroll: títulos que aparecen palabra a palabra, números que cuentan, tarjetas que se reparten, banda de palabras que se acelera con el scroll, historia con imagen fija y separadores ondulados que fluyen.
- Todas las animaciones se desactivan si el sistema pide «reducir movimiento».
- Todo el progreso se guarda solo en el navegador (`localStorage`): sin cuentas, sin cookies de seguimiento, sin servidor.

## Cómo verla en local

Es un sitio estático, sin dependencias ni compilación:

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
├── css/styles.css        # Sistema de diseño (tokens, componentes, animaciones)
├── css/fonts.css         # @font-face de las tipografías locales
├── fonts/                # Bricolage Grotesque y Figtree (licencia SIL OFL)
├── js/soplo.js           # Soplo (caras, accesorios) y la planta que crece
├── js/exercises.js       # Biblioteca de ejercicios (añadir uno nuevo es añadir un objeto)
├── js/breath.js          # Reproductor: animación, sonido, voz, ánimo y estadísticas
├── js/tools.js           # Herramientas y «Tu rincón»
├── js/app.js             # Navegación, scroll, animaciones y modal «Calma ahora»
├── img/favicon.svg
└── manifest.webmanifest
```

## Aviso

WellBreath es un proyecto divulgativo y de bienestar. No sustituye el consejo, diagnóstico ni tratamiento de un profesional sanitario.
