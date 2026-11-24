import {readFileSync, existsSync, writeFileSync} from 'node:fs';

const readContent = name => JSON.parse(readFileSync(`content/${name}.json`, 'utf8'));
export const extraActivities = readContent('archivo-ampliado').activities;
const allPrograms = readContent('programas').programs;
const allActivities = [...readContent('actividades').activities, ...extraActivities]
  .sort((a, b) => (b.date || b.published_date || '').localeCompare(a.date || a.published_date || ''));
export const pendingActivities = allActivities.filter(activity => activity.publication_status === 'awaiting_photo');
export const activities = allActivities.filter(activity => activity.publication_status !== 'awaiting_photo');
export const programs = allPrograms.filter(program => program.publication_status !== 'awaiting_photo');
const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const categories = {
  'hora-planeta-2025': 'educacion', 'eco-innova-2025': 'encuentros',
  'enuma-2025': 'encuentros', 'chili-2024': 'territorio',
  'educca-2023': 'educacion', 'hunter-sostenible-2023': 'territorio'
};
const visiblePhotos = activity => (activity.images || []).filter(photo => photo.recommended !== false);
for (const item of [...activities, ...programs]) {
  if (!visiblePhotos(item).length || !item.summary || !item.source) {
    throw new Error(`Public content needs an image, description and source: ${item.id}`);
  }
  for (const photo of visiblePhotos(item)) {
    if (!existsSync(photo.filename) || !photo.alt || !photo.credit) {
      throw new Error(`Public image needs a file, alternative text and credit: ${item.id}`);
    }
  }
}
const imageCredit = photo => `${photo.kind === 'poster' ? 'Imagen original' : 'Fotografía'}: ${escape(photo.credit)}`;
const sourceLink = (url, text, className = 'text-link') => `<a class="${className}" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${text}<span class="sr-only"> (abre en otra pestaña)</span></a>`;

export function activityPhoto(photo, {className = '', eager = false} = {}) {
  if (!photo) return '';
  const webp = photo.webp?.filename || photo.filename.replace(/\.jpe?g$/i, '.webp');
  const dimensions = photo.dimensions || photo;
  return `<picture>${webp !== photo.filename && existsSync(webp) ? `<source type="image/webp" srcset="${escape(webp)}">` : ''}<img class="${escape([className,photo.kind==='poster'?'original-poster':photo.kind==='photo_collage'?'original-collage':''].filter(Boolean).join(' '))}" src="${escape(photo.filename)}" width="${dimensions.width}" height="${dimensions.height}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" alt="${escape(photo.alt)}"></picture>`;
}

function storyCard(activity) {
  const photo = visiblePhotos(activity)[0];
  const url = `actividad-${activity.id}.html`;
  const category = activity.filter || categories[activity.id] || 'encuentros';
  return `<article class="story-card${photo ? '' : ' action-card story-card-text'}" data-story="${category}" data-year="${escape((activity.date || activity.published_date || '').slice(0,4))}">${photo ? `<a class="story-art" href="${url}" aria-label="Ver más sobre ${escape(activity.title)}">${activityPhoto(photo)}<span class="art-label">${escape(activity.category)}</span></a>` : `<span class="eyebrow">${escape(activity.category)}</span>`}<div class="story-meta"><span>${escape(activity.date_label)}</span></div><h3><a href="${url}">${escape(activity.title)}</a></h3><p>${escape(activity.summary.split('. ')[0])}${activity.summary.split('. ').length > 1 ? '.' : ''}</p><a class="text-link" href="${url}" aria-label="Ver más sobre ${escape(activity.title)}">Ver más</a></article>`;
}

export function archiveTools() {
  const years = [...new Set(activities.map(a => (a.date || a.published_date || '').slice(0,4)).filter(Boolean))].sort().reverse();
  return `<div class="archive-tools"><label for="story-year"><span>Explora por año</span><select id="story-year"><option value="all">Todos</option>${years.map(year=>`<option value="${year}">${year}</option>`).join('')}</select></label></div>`;
}

export function archivePage(chosen = activities) {
  return `<div class="story-grid story-grid-v2">${chosen.map(storyCard).join('')}</div>`;
}

export function stories(limit) {
  const chosen = limit
    ? ['ecoferia-yaravi-2026', 'rua-major-2025', 'agua-colegio-2018'].map(id => activities.find(activity => activity.id === id)).filter(Boolean).slice(0, limit)
    : activities;
  return archivePage(chosen) + (limit ? '' : '<div class="archive-more" hidden><button class="button outline" type="button" id="story-more">Ver más historias</button></div>');
}

export function programCards(external = sourceLink) {
  if (!programs.length) return '';
  return `<section class="section programs-section" id="programas"><div class="container"><div class="section-head"><div><span class="eyebrow">Ideas con identidad propia</span><h2>Programas de nuestra <em>comunidad.</em></h2></div><p class="intro">Conoce algunas iniciativas que forman parte del recorrido de RUA.</p></div><div class="action-grid program-grid">${programs.map(program => {
    const photo=visiblePhotos(program)[0];
    return `<article class="action-card program-card${photo?' has-program-photo':''}" id="programa-${escape(program.id)}">${photo?`<a class="program-photo" href="${escape(program.source)}" target="_blank" rel="noopener noreferrer" aria-label="Ver más sobre ${escape(program.title)}">${activityPhoto(photo)}</a>`:''}<div class="program-copy"><span class="eyebrow">${escape(program.date.slice(0, 4))}</span><h3>${escape(program.title)}</h3><p>${escape(program.summary)}</p>${external(program.source, `Ver más<span class="sr-only"> sobre ${escape(program.title)}</span>`)}</div></article>`;
  }).join('')}</div><div class="action-footer"><p>Consulta con el equipo las oportunidades para participar en estas iniciativas. <a class="text-link" href="participa.html#contacto">Conversar con RUA</a></p></div></div></section>`;
}

export function activityPages({page, pageHero, external}) {
  // Preserve old incoming URLs without publishing stories that still await photos.
  for (const activity of pendingActivities) {
    const target = 'actividades.html#historias';
    writeFileSync(`actividad-${activity.id}.html`, `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=${target}"><title>Actividades | RUA Perú</title></head><body><p><a href="${target}">Ver más actividades de RUA</a></p></body></html>`);
  }
  for (const activity of activities) {
    const [mainPhoto, ...gallery] = visiblePhotos(activity);
    const source = `<div class="article-source"><div class="article-original"><span>Publicación original · ${escape(activity.publisher)}</span>${external(activity.source,`Ver más<span class="sr-only"> en ${escape(activity.publisher)}</span>`)}</div>${(activity.secondary_sources || []).map(item => `<div class="article-original"><span>${escape(item.publisher)}</span>${external(item.url,`Ver más<span class="sr-only"> en ${escape(item.publisher)}</span>`)}</div>`).join('')}</div>`;
    const mainFigure = mainPhoto ? `<figure class="article-main-photo">${activity.id==='ecoferia-yaravi-2026'?`<button type="button" id="ecoferia-photo" data-ocean-trigger aria-label="Fotografía de voluntariado en la Ecoferia">${activityPhoto(mainPhoto,{eager:true})}</button>`:activityPhoto(mainPhoto,{eager:true})}<figcaption>${escape(mainPhoto.context || mainPhoto.caption)} <span>${imageCredit(mainPhoto)}.</span></figcaption></figure>` : '';
    const galleryMarkup = gallery.length ? `<div class="activity-gallery">${gallery.map(photo => `<figure>${activityPhoto(photo)}<figcaption>${escape(photo.context || photo.caption)} ${imageCredit(photo)}.</figcaption></figure>`).join('')}</div>` : '';
    page(`actividad-${activity.id}.html`, activity.title, activity.summary, `${pageHero('Actividades', 'RUA en acción', escape(activity.title), escape(activity.place))}<section class="section activity-article${mainPhoto ? '' : ' activity-article-text'}"><div class="container"><div class="article-meta"><span>${escape(activity.date_label)}</span><span>${escape(activity.category)}</span></div>${mainFigure}<div class="article-content"><div><span class="eyebrow">Una historia de acción compartida</span><h2>Universidad y comunidad,<br><em>en el mismo camino.</em></h2></div><div><p class="intro">${escape(activity.summary)}</p>${source}</div></div>${galleryMarkup}<div class="article-bottom"><a class="button outline" href="actividades.html#historias">Volver a todas las actividades</a><a class="button" href="participa.html">Quiero participar en RUA</a></div></div></section>`, 'actividades');
  }
}

export function activityCredits(external) {
  return `<h2>Actividades y fotografías de RUA</h2><p>Las historias se apoyan en las publicaciones institucionales enlazadas aquí. Las fotografías conservan sus créditos y marcas. Las imágenes de encuentros colectivos muestran a sus participantes; no se atribuye a RUA la pertenencia de todas las personas retratadas.</p><ul>${activities.map(activity => `<li><strong>${escape(activity.title)}</strong> · ${escape(activity.date_label)}. ${visiblePhotos(activity).length ? 'Fotografía y fuente' : 'Fuente'}: ${external(activity.source, escape(activity.publisher))}.${(activity.secondary_sources || []).map(item => ` ${external(item.url, escape(item.publisher))}.`).join('')}</li>`).join('')}</ul>${programs.length ? '<h2>Programas e iniciativas</h2>' : ''}<ul>${programs.map(program => `<li><strong>${escape(program.title)}</strong> · ${escape(program.date.slice(0, 4))}. Fuente: ${external(program.source, escape(program.publisher))}.</li>`).join('')}</ul>`;
}
