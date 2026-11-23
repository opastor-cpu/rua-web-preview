# RUA Perú · Nodo UNSA Arequipa — vista de prueba

Rediseño responsive de la web de RUA, publicado como una versión de prueba para revisión en celulares y escritorio.

**Ver la web:** https://opastor-cpu.github.io/rua-web-preview/

Este repositorio es una copia de trabajo para revisar el diseño. El sitio original está en https://lauracadillo.github.io/RUA/ y no se modifica con esta publicación.

## Publicación

GitHub Pages publica la raíz de la rama `main`. Las páginas HTML generadas, estilos, JavaScript y fotografías están incluidos en el repositorio; Pages los sirve directamente. Las actualizaciones de `main` se publican automáticamente.

## Actualizar contenido

Desde la raíz del repositorio, genera las páginas después de modificar el contenido o las plantillas:

```sh
node scripts/build.mjs
```

- `content/actividades.json` contiene las historias, fechas, fuentes y fotografías publicadas.
- `content/equipo.json` está preparado para incorporar nombres, cargos, periodo de gestión y fotografías cuando RUA los confirme. Mientras sus campos estén pendientes, la web muestra el directorio en actualización y el canal oficial de representantes.
- `scripts/build.mjs`, `scripts/layout.mjs`, `scripts/stories.mjs` y `scripts/sections.mjs` generan las páginas. Edita estas fuentes y vuelve a generar el HTML para conservar los cambios.
- Los archivos de las fotografías se encuentran en `assets/`; las rutas declaradas en el contenido deben corresponder a archivos incluidos en el repositorio.

## Contenido

- Inicio, Nosotros, Actividades, Equipo, Participa, Donaciones, Convenios y Fuentes y créditos.
- Tres historias destacadas en portada y seis actividades en el archivo, cada una con su página y fotografías.
- Menú responsive, filtros de historias, preguntas frecuentes y panel de redes sociales para escritorio con iconos de las aplicaciones.
- Preparación local de mensajes y enlaces oficiales de contacto. No se envían ni almacenan datos desde el formulario.
- Fotografía del Misti en alta resolución y versiones optimizadas para la web, con atribución y licencia en `creditos.html`.
- Fotografías reales de actividades vinculadas a publicaciones institucionales de la UNSA y municipalidades, con sus fuentes y créditos.
- Donaciones y propuestas de convenio canalizadas mediante el contacto oficial de colaboración de RUA.

Pendientes editoriales: nombres, cargos, periodo de gestión y retratos confirmados del equipo; nuevas fotografías que facilite RUA; convocatorias actuales y datos oficiales de colaboración o donación que se acuerde publicar. No se incluyen estadísticas, integrantes ni cuentas bancarias ficticias.

La vista de prueba solicita a los buscadores que no la indexen. Es pública y accesible mediante el enlace; esta indicación no es un control de acceso.
