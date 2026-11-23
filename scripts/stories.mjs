import {readFileSync, existsSync} from 'node:fs';

const readContent = name => JSON.parse(readFileSync(`content/${name}.json`, 'utf8'));
export const extraActivities = readContent('archivo-ampliado').activities;
export const programs = readContent('programas').programs;
export const activities = [...readContent('actividades').activities, ...extraActivities]
  .sort((a, b) => (b.date || b.published_date || '').localeCompare(a.date || a.published_date || ''));
const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const categories = {
  'hora-planeta-2025': 'educacion', 'eco-innova-2025': 'encuentros',
  'enuma-2025': 'encuentros', 'chili-2024': 'territorio',
  'educca-2023': 'educacion', 'hunter-sostenible-2023': 'territorio'
};
const visiblePhotos = activity => (activity.images || []).filter(photo => photo.recommended !== false);
const sourceLink = (url, text, className = 'text-link') => `<a class="${className}" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${text}<span class="sr-only"> (abre en otra pestaña)</span></a>`;

export function activityPhoto(photo, {className = '', eager = false} = {}) {
  if (!photo) return '';
  const webp = photo.webp?.filename || photo.filename.replace(/\.jpe?g$/i, '.webp');
  const dimensions = photo.dimensions || photo;
  return `<picture>${webp !== photo.filename && existsSync(webp) ? `<source type="image/webp" srcset="${escape(webp)}">` : ''}<img class="${escape(className)}" src="${escape(photo.filename)}" width="${dimensions.width}" height="${dimensions.height}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} alt="${escape(photo.alt)}"></picture>`;
}

function storyCard(activity) {
  const photo = visiblePhotos(activity)[0];
  const url = `actividad-${activity.id}.html`;
  const category = activity.filter || categories[activity.id] || 'encuentros';
  return `<article class="story-card${photo ? '' : ' action-card story-card-text'}" data-story="${category}" data-search="${escape([activity.title, activity.place, activity.date_label, activity.category].join(' '))}">${photo ? `<a class="story-art" href="${url}" aria-label="Ver ${escape(activity.title)}">${activityPhoto(photo)}<span class="art-label">${escape(activity.category)}</span></a>` : `<span class="eyebrow">${escape(activity.category)}</span>`}<div class="story-meta"><span>${escape(activity.date_label)}</span></div><h3><a href="${url}">${escape(activity.title)}</a></h3><p>${escape(activity.summary.split('. ')[0])}${activity.summary.split('. ').length > 1 ? '.' : ''}</p><a class="text-link" href="${url}">${photo ? 'Ver actividad y fotografías' : 'Conocer la actividad'}</a></article>`;
}

export function archivePage(chosen = activities) {
  return `<div class="story-grid story-grid-v2">${chosen.map(storyCard).join('')}</div>`;
}

export function stories(limit) {
  const chosen = limit
    ? ['ecoferia-yaravi-2026', 'hilando-verde-2025', 'chili-2024'].map(id => activities.find(activity => activity.id === id)).filter(Boolean).slice(0, limit)
    : activities;
  return archivePage(chosen);
}

export function programCards(external = sourceLink) {
  return `<section class="section programs-section" id="programas"><div class="container"><div class="section-head"><div><span class="eyebrow">Ideas con identidad propia</span><h2>Programas de nuestra <em>comunidad.</em></h2></div><p class="intro">Conoce algunas iniciativas que forman parte del recorrido de RUA.</p></div><div class="action-grid program-grid">${programs.map(program => `<article class="action-card program-card" id="programa-${escape(program.id)}"><span class="eyebrow">${escape(program.date.slice(0, 4))}</span><h3>${escape(program.title)}</h3><p>${escape(program.summary)}</p>${external(program.source, `Conocer la fuente de ${escape(program.title)}`)}</article>`).join('')}</div><div class="action-footer"><p>Consulta con el equipo las oportunidades para participar en estas iniciativas. <a class="text-link" href="participa.html#contacto">Conversar con RUA</a></p></div></div></section>`;
}

export function activityPages({page, pageHero, external}) {
  for (const activity of activities) {
    const [mainPhoto, ...gallery] = visiblePhotos(activity);
    const source = `<div class="article-source"><span>Conoce la publicación original</span>${external(activity.source, escape(activity.publisher))}${(activity.secondary_sources || []).map(item => external(item.url, escape(item.publisher))).join('')}</div>`;
    const mainFigure = mainPhoto ? `<figure class="article-main-photo">${activityPhoto(mainPhoto, {eager: true})}<figcaption>${escape(mainPhoto.context || mainPhoto.caption)} <span>Fotografía: ${escape(mainPhoto.credit)}.</span></figcaption></figure>` : '';
    const galleryMarkup = gallery.length ? `<div class="activity-gallery">${gallery.map(photo => `<figure>${activityPhoto(photo)}<figcaption>${escape(photo.context || photo.caption)} Fotografía: ${escape(photo.credit)}.</figcaption></figure>`).join('')}</div>` : '';
    page(`actividad-${activity.id}.html`, activity.title, activity.summary, `${pageHero('Actividades', 'RUA en acción', escape(activity.title), escape(activity.place))}<section class="section activity-article${mainPhoto ? '' : ' activity-article-text'}"><div class="container"><div class="article-meta"><span>${escape(activity.date_label)}</span><span>${escape(activity.category)}</span></div>${mainFigure}<div class="article-content"><div><span class="eyebrow">Una historia de acción compartida</span><h2>Universidad y comunidad,<br><em>en el mismo camino.</em></h2></div><div><p class="intro">${escape(activity.summary)}</p>${source}</div></div>${galleryMarkup}<div class="article-bottom"><a class="button outline" href="actividades.html#historias">Volver a todas las actividades</a><a class="button" href="participa.html">Quiero participar en RUA</a></div></div></section>`, 'actividades');
  }
}

export function activityCredits(external) {
  return `<h2>Actividades y fotografías de RUA</h2><p>Las historias se apoyan en las publicaciones institucionales enlazadas aquí. Las fotografías conservan sus créditos y marcas. Las imágenes de encuentros colectivos muestran a sus participantes; no se atribuye a RUA la pertenencia de todas las personas retratadas.</p><ul>${activities.map(activity => `<li><strong>${escape(activity.title)}</strong> · ${escape(activity.date_label)}. ${visiblePhotos(activity).length ? 'Fotografía y fuente' : 'Fuente'}: ${external(activity.source, escape(activity.publisher))}.${(activity.secondary_sources || []).map(item => ` ${external(item.url, escape(item.publisher))}.`).join('')}</li>`).join('')}</ul><h2>Programas e iniciativas</h2><ul>${programs.map(program => `<li><strong>${escape(program.title)}</strong> · ${escape(program.date.slice(0, 4))}. Fuente: ${external(program.source, escape(program.publisher))}.</li>`).join('')}</ul>`;
}
