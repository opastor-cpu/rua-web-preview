# RUA Perú · Nodo UNSA Arequipa — versión 10 de prueba

Rediseño responsive de la web de RUA, publicado como una versión de prueba para revisión en celulares y escritorio.

**Ver la web:** [RUA · vista de prueba](https://opastor-cpu.github.io/rua-web-preview/)

Este repositorio es una copia de trabajo para revisar el diseño. El [sitio original](https://lauracadillo.github.io/RUA/) se mantiene separado de esta publicación.

## Versión 10

- 15 fotografías adicionales distribuidas entre Donaciones (6), Convenios (6), Nosotros (2) y Participa (1). Seis tarjetas de apoyo y colaboración incorporan imágenes; las nuevas galerías de Arequipa conservan sus flechas discretas y avances independientes de cinco segundos.
- Las imágenes regionales tienen procedencia y créditos en `content/region.json` y en la página de créditos. Las fotografías de contexto no se presentan como actividades, integrantes ni convenios de RUA.
- Tres ilustraciones distintas de Shaun: teléfono para las redes, plantón para la presentación y limpieza para el cierre. Cada página completa muestra tres poses en escritorio y dos en móvil, donde se oculta el acceso lateral de redes. Las ilustraciones fueron generadas con IA; el personaje pertenece a sus titulares.
- El nombre **Red Universitaria Ambiental · Nodo UNSA** tiene mayor tamaño, contraste y separación en la portada.
- Los enlaces y controles utilizan sonidos breves distintos según su jerarquía, manteniendo el silencio opcional y la navegación inmediata.

## Contenido verificado

- Archivo público de 12 historias, todas con imagen comprobada, descripción breve, fecha y enlace a la publicación de respaldo mediante «Ver más». RUA Noticias muestra su publicación editorial original; las otras historias incluyen fotografías del evento. Las imágenes de jornadas colectivas no identifican a todas las personas retratadas como miembros de RUA.
- Se completaron imágenes de Apaga y Actúa, Hunter Sostenible, AREISA, Corso de la Amistad 2024 y RUA Noticias. Se conservaron los créditos y se optimizaron los nuevos recursos en WebP, sin ampliar su resolución.
- Ocho actividades y tres programas (**GreenClub**, **RUA Emprende** y **RUA Pet**) permanecen guardados en el contenido con `publication_status: "awaiting_photo"`, sin aparecer en el sitio. Las antiguas URLs de esas actividades redirigen al archivo público. Para publicarlos, incorporar una imagen verificable y cambiar su estado a `published`.
- Las tarjetas destacadas también muestran una descripción breve en celular. Los enlaces informativos usan «Ver más».
- El QR de Yape y los datos bancarios siguen sin completar, por indicación de RUA. No se publican el QR de ejemplo ni los números ficticios del sitio original.
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

- `content/actividades.json` y `content/archivo-ampliado.json` conservan las 20 actividades: 12 publicadas y 8 pendientes de fotografía, con sus fechas y fuentes.
- `content/programas.json` conserva GreenClub, RUA Emprende y RUA Pet pendientes de fotografía, junto con sus fuentes.
- `content/media.json` contiene el paisaje fijo de portada, la imagen oficial del equipo y las galerías de las secciones, con textos alternativos, dimensiones, fuentes y créditos.
- `content/region.json` contiene las 15 imágenes regionales adicionales y su atribución; `scripts/regional.mjs` genera sus tarjetas, galerías y créditos. `content/mascots.json` identifica las tres poses de Shaun. `v10.css` aplica estos cambios de diseño sin alterar el minijuego.
- `content/equipo.json` está preparado para incorporar nombres, cargos, periodo de gestión y fotografías cuando RUA los confirme. Mientras sus campos estén pendientes, la web muestra el directorio en actualización y el canal oficial de representantes.
- `scripts/build.mjs`, `scripts/layout.mjs`, `scripts/stories.mjs`, `scripts/sections.mjs` y `scripts/experience.mjs` generan las páginas. Edita estas fuentes y vuelve a generar el HTML para conservar los cambios.
- `carousel.js` controla las galerías y el carrusel móvil de líneas de acción. La fotografía de portada queda fuera de este comportamiento.
- `experience.css` define las composiciones fotográficas, las galerías y las adaptaciones para celulares; se carga después de `styles.css` y `updates.css`.
- `audio.js` genera el sonido de interacción mediante Web Audio. `audio.css` presenta el control de sonido del footer; ambos se incluyen en las páginas generadas.
- Los archivos de las fotografías se encuentran en `assets/`; las rutas declaradas en el contenido deben corresponder a archivos incluidos en el repositorio.
- La generación se detiene si una actividad o programa público carece de imagen, descripción o fuente, o si una fotografía no tiene archivo, crédito o texto alternativo. Los registros pendientes se excluyen explícitamente.

## Galerías y accesibilidad

Cada galería mantiene su propio temporizador. `data-interval="5000"` establece avances cada cinco segundos y `data-start-delay` añade un desfase únicamente al primer ciclo visible, para que las galerías no avancen todas a la vez. Una navegación manual inicia un nuevo ciclo de cinco segundos, sin volver a aplicar ese desfase.

La rotación se pausa mientras el cursor o el foco permanezcan dentro de la galería, cuando sale de la vista o cuando la pestaña deja de estar visible. Por eso, después de pulsar una flecha, el carrusel puede quedar detenido hasta retirar el cursor y mover el foco fuera: es el comportamiento previsto para permitir la lectura. Al salir de esas pausas se programa un ciclo nuevo, sin recuperar avances acumulados.

Los únicos controles visuales son las flechas anterior y siguiente. También se puede deslizar en pantallas táctiles o usar las teclas izquierda y derecha. Con el foco en la región del carrusel, la barra espaciadora activa o pausa la reproducción; sobre un botón o enlace conserva su función habitual. Las diapositivas inactivas usan `aria-hidden` e `inert`, y las acciones manuales anuncian su posición mediante un estado accesible.

Con la preferencia de movimiento reducido, las galerías empiezan sin avance automático y conservan la navegación manual. Las imágenes declaran dimensiones y utilizan carga diferida nativa cuando corresponde; las imágenes principales de portada, Nosotros y las páginas de actividad reciben prioridad. El carrusel no implementa una descarga adicional de la siguiente fotografía.

## Sonido de interacción

Los botones principales usan dos notas ascendentes (130 ms); la navegación, un tono de 85 ms; los enlaces de contenido, 65 ms; los externos, 90 ms; y los controles o desplegables, 40 ms. Las ganancias se mantienen entre `0.006` y `0.008` y se limitan los clics muy próximos. La navegación nunca espera al sonido. El contexto de audio se crea después de una interacción real del usuario: las rotaciones automáticas, cargas de página y clics programáticos no producen sonido. El minijuego y su foto secreta mantienen su audio independiente.

El botón **Sonido: sí/no** del footer refleja su estado mediante `aria-pressed`. La preferencia de silencio se conserva en `localStorage` cuando está disponible; si el navegador bloquea el almacenamiento o el audio, la navegación sigue funcionando.

## Otras secciones

- Inicio, Nosotros, Actividades, Equipo, Participa, Donaciones, Convenios y Fuentes y créditos.
- Menú responsive, filtros de historias, preguntas frecuentes y panel de redes sociales para escritorio con iconos de las aplicaciones.
- Las tres líneas de acción se muestran juntas en escritorio y como carrusel en pantallas de hasta 620 px. Las historias destacadas permiten desplazamiento horizontal en celulares.
- Preparación local de mensajes y enlaces oficiales de contacto. No se envían ni almacenan datos desde el formulario.
- Fotografías reales vinculadas a publicaciones verificadas de RUA e instituciones participantes. Las fuentes, créditos y condiciones localizadas se recogen en `creditos.html`; no se atribuye a RUA la pertenencia de todas las personas que aparecen en una actividad conjunta.
- Shaun acompaña el acceso a redes en escritorio; otras dos poses aparecen en la presentación y el pie de página. En celular solo se muestran estas dos últimas. Su procedencia se indica en `creditos.html`.
- Donaciones y propuestas de convenio canalizadas mediante el contacto oficial de colaboración de RUA.

## Pendientes editoriales

Quedan por confirmar los nombres de la coordinación general y de cada comisión, los cargos, el periodo de gestión y los retratos correspondientes. El directorio conserva su estado pendiente hasta recibir esa información. También se podrán incorporar nuevas fotografías propias, convocatorias actuales y los datos oficiales de colaboración o donación que RUA acuerde publicar. No se incluyen estadísticas, integrantes ni cuentas bancarias ficticias.

La vista de prueba solicita a los buscadores que no la indexen. Es pública y accesible mediante el enlace; esta indicación no es un control de acceso.


## Minijuego secreto (v8)

En la foto grande de la III Ecoferia, cinco pulsaciones consecutivas (sin más de 1,2 segundos entre ellas) abren «Lucianita y el océano». Las miniaturas de Inicio y Actividades conservan sus enlaces normales. El juego y sus dibujos originales en Canvas se cargan únicamente al descubrir el secreto.

- Inicio: «Ayuda a Lucianita a salvar el océano».
- Espacio/↑ o tocar la playa para saltar; ↓ o mantener el botón para agacharse. P pausa; Escape cierra.
- Playa en pixel art y ballenas que, al salir del mar, alternan «¡Salvemos el océano!» y «Tratado de Altamar» en burbujas de diálogo. Los mensajes acompañan a la ballena y desaparecen cuando se sumerge. Lucianita tiene proporciones chibi, ojos brillantes, mejillas, cabello y cuatro fotogramas de carrera.
- Barriles con fugas de petróleo y charcos, cinco variantes de basura (botellas/latas, bolsas, neumáticos, envases y redes), y aviones con humo animado. El humo es decorativo y no añade colisiones invisibles.
- Carrera infinita con cinco segundos iniciales a velocidad estable. La velocidad aumenta suavemente de 165 a 300 durante los siguientes 110 segundos y queda limitada; los aviones aparecen desde los 25 segundos. Los obstáculos aparecen más seguido, conservando espacio para aterrizar y reaccionar.
- Récord local, efectos y melodía original de ocho compases a 136 bpm, con bajo y percusión ligera para acompañar una carrera más dinámica. «Sonido» silencia ambos; la música sólo suena durante la carrera y se detiene al pausar, perder, cerrar o alcanzar la recompensa.
- A 1.000 puntos aparece la recompensa: la campaña facilitada por RUA se abre tras 5 segundos. «Seguir jugando» cancela la navegación y permite continuar. Cambiar de pestaña cancela la cuenta atrás.
- Cerrar, cambiar de pestaña o redimensionar pausa la partida. No hay cuentas, envíos de datos ni marcadores remotos.

Archivos: `ocean-game.js` (interfaz), `ocean-engine.mjs` (física), `ocean-art.js` (dibujos), `ocean-music.mjs` (melodía) y `ocean-game.css`.

Validación reproducible, sin dependencias adicionales:

```sh
node --test tests/ocean-engine.test.mjs tests/ocean-ui.test.mjs tests/ocean-music.test.mjs
node scripts/build.mjs
```
