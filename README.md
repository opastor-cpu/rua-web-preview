# RUA Perú · Nodo UNSA Arequipa — versión 4 de prueba

Rediseño responsive de la web de RUA, publicado como una versión de prueba para revisión en celulares y escritorio.

**Ver la web:** [RUA · vista de prueba](https://opastor-cpu.github.io/rua-web-preview/)

Este repositorio es una copia de trabajo para revisar el diseño. El [sitio original](https://lauracadillo.github.io/RUA/) se mantiene separado de esta publicación.

## Versión 4

- 34 fotografías distintas de actividades y comunidad, incluida la imagen oficial del equipo: 33 sin contar ese banner. Las variantes JPG/WebP de una misma fotografía no se cuentan como imágenes nuevas. El paisaje de portada se documenta por separado.
- Archivo de 20 actividades, con fechas, fuentes y páginas de detalle. La portada muestra una selección breve; el archivo permite consultar el resto.
- Tres programas documentados: **GreenClub**, **RUA Emprende** y **RUA Pet**. Sus textos distinguen las actividades realizadas de las metas y oportunidades pendientes de confirmación.
- Una única fotografía fija del Misti en portada. En celulares, texto e imagen comparten la misma composición. La portada no rota ni muestra controles o rótulos sobre la fotografía.
- Galerías independientes en las secciones, con flechas discretas para avanzar o retroceder, y el banner del equipo mostrado completo.
- Redes sociales con iconos y acceso a [LinkedIn de RUA](https://www.linkedin.com/company/rua-unsa-aqp/), además de Instagram, Facebook, TikTok, YouTube y WhatsApp.
- Sonido breve y suave al pulsar botones, enlaces o preguntas desplegables, con un control de silencio en el pie de página.

## Publicación

GitHub Pages publica la raíz de la rama `main`. Las páginas HTML generadas, estilos, JavaScript y fotografías están incluidos en el repositorio; Pages los sirve directamente. Las actualizaciones de `main` se publican automáticamente.

## Actualizar contenido

Desde la raíz del repositorio, genera las páginas después de modificar el contenido o las plantillas:

```sh
node scripts/build.mjs
```

- `content/actividades.json` y `content/archivo-ampliado.json` contienen las 20 actividades, con sus fechas, fuentes y fotografías disponibles.
- `content/programas.json` contiene GreenClub, RUA Emprende y RUA Pet, junto con sus fuentes.
- `content/media.json` contiene el paisaje fijo de portada, la imagen oficial del equipo y las galerías de las secciones, con textos alternativos, dimensiones, fuentes y créditos.
- `content/equipo.json` está preparado para incorporar nombres, cargos, periodo de gestión y fotografías cuando RUA los confirme. Mientras sus campos estén pendientes, la web muestra el directorio en actualización y el canal oficial de representantes.
- `scripts/build.mjs`, `scripts/layout.mjs`, `scripts/stories.mjs`, `scripts/sections.mjs` y `scripts/experience.mjs` generan las páginas. Edita estas fuentes y vuelve a generar el HTML para conservar los cambios.
- `carousel.js` controla las galerías y el carrusel móvil de líneas de acción. La fotografía de portada queda fuera de este comportamiento.
- `experience.css` define las composiciones fotográficas, las galerías y las adaptaciones para celulares; se carga después de `styles.css` y `updates.css`.
- `audio.js` genera el sonido de interacción mediante Web Audio. `audio.css` presenta el control de sonido del footer; ambos se incluyen en las páginas generadas.
- Los archivos de las fotografías se encuentran en `assets/`; las rutas declaradas en el contenido deben corresponder a archivos incluidos en el repositorio.

## Galerías y accesibilidad

Cada galería mantiene su propio temporizador. `data-interval="5000"` establece avances cada cinco segundos y `data-start-delay` añade un desfase únicamente al primer ciclo visible, para que las galerías no avancen todas a la vez. Una navegación manual inicia un nuevo ciclo de cinco segundos, sin volver a aplicar ese desfase.

La rotación se pausa mientras el cursor o el foco permanezcan dentro de la galería, cuando sale de la vista o cuando la pestaña deja de estar visible. Por eso, después de pulsar una flecha, el carrusel puede quedar detenido hasta retirar el cursor y mover el foco fuera: es el comportamiento previsto para permitir la lectura. Al salir de esas pausas se programa un ciclo nuevo, sin recuperar avances acumulados.

Los únicos controles visuales son las flechas anterior y siguiente. También se puede deslizar en pantallas táctiles o usar las teclas izquierda y derecha. Con el foco en la región del carrusel, la barra espaciadora activa o pausa la reproducción; sobre un botón o enlace conserva su función habitual. Las diapositivas inactivas usan `aria-hidden` e `inert`, y las acciones manuales anuncian su posición mediante un estado accesible.

Con la preferencia de movimiento reducido, las galerías empiezan sin avance automático y conservan la navegación manual. Las imágenes declaran dimensiones y utilizan carga diferida nativa cuando corresponde; las imágenes principales de portada, Nosotros y las páginas de actividad reciben prioridad. El carrusel no implementa una descarga adicional de la siguiente fotografía.

## Sonido de interacción

El sonido dura aproximadamente 50 ms, utiliza una ganancia máxima de `0.01` y limita los clics muy próximos entre sí. El contexto de audio se crea después de una interacción real del usuario: las rotaciones automáticas, cargas de página y clics programáticos no producen sonido.

El botón **Sonido: sí/no** del footer refleja su estado mediante `aria-pressed`. La preferencia de silencio se conserva en `localStorage` cuando está disponible; si el navegador bloquea el almacenamiento o el audio, la navegación sigue funcionando.

## Otras secciones

- Inicio, Nosotros, Actividades, Equipo, Participa, Donaciones, Convenios y Fuentes y créditos.
- Menú responsive, filtros de historias, preguntas frecuentes y panel de redes sociales para escritorio con iconos de las aplicaciones.
- Las tres líneas de acción se muestran juntas en escritorio y como carrusel en pantallas de hasta 620 px. Las historias destacadas permiten desplazamiento horizontal en celulares.
- Preparación local de mensajes y enlaces oficiales de contacto. No se envían ni almacenan datos desde el formulario.
- Fotografías reales vinculadas a publicaciones verificadas de RUA e instituciones participantes. Las fuentes, créditos y condiciones localizadas se recogen en `creditos.html`; no se atribuye a RUA la pertenencia de todas las personas que aparecen en una actividad conjunta.
- Shaun acompaña el acceso a redes en escritorio y aparece una segunda vez en la invitación a participar de la portada. Su procedencia se indica en `creditos.html`.
- Donaciones y propuestas de convenio canalizadas mediante el contacto oficial de colaboración de RUA.

## Pendientes editoriales

Quedan por confirmar los nombres de la coordinación general y de cada comisión, los cargos, el periodo de gestión y los retratos correspondientes. El directorio conserva su estado pendiente hasta recibir esa información. También se podrán incorporar nuevas fotografías propias, convocatorias actuales y los datos oficiales de colaboración o donación que RUA acuerde publicar. No se incluyen estadísticas, integrantes ni cuentas bancarias ficticias.

La vista de prueba solicita a los buscadores que no la indexen. Es pública y accesible mediante el enlace; esta indicación no es un control de acceso.


## Minijuego secreto (v6)

En la foto grande de la III Ecoferia, cinco pulsaciones consecutivas (sin más de 1,2 segundos entre ellas) abren «Lucianita y el océano». Las miniaturas de Inicio y Actividades conservan sus enlaces normales. El juego y sus dibujos originales en Canvas se cargan únicamente al descubrir el secreto.

- Inicio: «Ayuda a Lucianita a salvar el océano».
- Espacio/↑ o tocar la playa para saltar; ↓ o mantener el botón para agacharse. P pausa; Escape cierra.
- Playa en pixel art, ballenas ocasionales y mensajes alternos de conservación. Lucianita tiene proporciones chibi, ojos brillantes, mejillas, cabello y cuatro fotogramas de carrera.
- Barriles con fugas de petróleo y charcos, cinco variantes de basura (botellas/latas, bolsas, neumáticos, envases y redes), y aviones con humo animado. El humo es decorativo y no añade colisiones invisibles.
- Carrera infinita con ocho segundos iniciales a velocidad estable. La velocidad aumenta suavemente de 140 a 250 durante los siguientes 180 segundos y queda limitada; los aviones aparecen desde los 45 segundos. Los huecos y el salto conservan un margen de reacción incluso al máximo.
- Récord local, efectos y melodía original suave de ocho compases a 104 bpm. «Sonido» silencia ambos; la música sólo suena durante la carrera y se detiene al pausar, perder, cerrar o alcanzar la recompensa.
- A 1.000 puntos aparece la recompensa: la campaña facilitada por RUA se abre tras 5 segundos. «Seguir jugando» cancela la navegación y permite continuar. Cambiar de pestaña cancela la cuenta atrás.
- Cerrar, cambiar de pestaña o redimensionar pausa la partida. No hay cuentas, envíos de datos ni marcadores remotos.

Archivos: `ocean-game.js` (interfaz), `ocean-engine.mjs` (física), `ocean-art.js` (dibujos), `ocean-music.mjs` (melodía) y `ocean-game.css`.

Validación reproducible, sin dependencias adicionales:

```sh
node --test tests/ocean-engine.test.mjs tests/ocean-ui.test.mjs tests/ocean-music.test.mjs
node scripts/build.mjs
```
