import {readFileSync} from 'node:fs';
import {mediaImage} from './experience.mjs';

const content = JSON.parse(readFileSync('content/region.json', 'utf8'));
export const regionalPhotos = content.photos;
const escape = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const photoFor = key => {
  const photo = regionalPhotos[key];
  if (!photo) throw new Error(`Missing regional photo: ${key}`);
  return photo;
};
const credit = photo => `<figcaption>${escape(photo.caption)} <a href="creditos.html#region" aria-label="Ver créditos de ${escape(photo.caption)}">Créditos</a></figcaption>`;
const arrow = previous => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${previous?'m14 6-6 6 6 6':'m10 6 6 6-6 6'}"/></svg>`;

export function regionalFigure(key, className='') {
  const photo = photoFor(key);
  return `<figure class="regional-photo ${className}">${mediaImage(photo)}${credit(photo)}</figure>`;
}

export function regionalGallery(keys, label, name) {
  return `<div class="photo-gallery regional-gallery" data-carousel="${escape(name)}" data-interval="5000" data-start-delay="${name.length*173}" tabindex="0" role="region" aria-roledescription="carrusel" aria-label="${escape(label)}. Usa las flechas para cambiar y espacio para pausar."><div class="carousel-stage">${keys.map((key,index)=>{const photo=photoFor(key);return `<figure class="carousel-slide ${index===0?'is-active':''}" aria-hidden="${index!==0}">${mediaImage(photo)}${credit(photo)}</figure>`;}).join('')}</div><div class="carousel-controls"><button type="button" data-prev aria-label="${escape(label)}: anterior">${arrow(true)}</button><button type="button" data-next aria-label="${escape(label)}: siguiente">${arrow(false)}</button><span class="sr-only carousel-status" aria-live="polite"></span></div></div>`;
}

export function regionalStory({keys,name,overline,title,copy,link,label='Ver más'}) {
  return `<section class="section regional-story"><div class="container regional-story-grid"><div class="regional-story-copy"><span class="eyebrow">${overline}</span><h2>${title}</h2><p>${copy}</p>${link?`<a class="text-link" href="${link}">${label}</a>`:''}</div>${regionalGallery(keys,'Paisajes de Arequipa',name)}</div></section>`;
}

export function regionalCard(key,title,copy,link,label='Ver más',external=false) {
  return `<article class="regional-card">${regionalFigure(key)}<div class="regional-card-copy"><h3>${title}</h3><p>${copy}</p><a class="text-link" href="${link}"${external?' target="_blank" rel="noopener noreferrer"':''}>${label}${external?'<span class="sr-only"> (abre en otra pestaña)</span>':''}</a></div></article>`;
}

export function regionalCredits(external) {
  return `<h2 id="region">Nuestra región: fotografías de Arequipa</h2><p>Estas imágenes acompañan las formas de apoyo y colaboración. Los paisajes, espacios universitarios y fotografías de otras instituciones ilustran el entorno regional; no representan actividades ni convenios de RUA salvo cuando el crédito lo indica expresamente.</p><ul>${Object.values(regionalPhotos).map(photo=>`<li><strong>${escape(photo.caption)}</strong>. ${escape(photo.credit || photo.author)}. ${external(photo.source,'Publicación original')}${photo.license_url?` · ${external(photo.license_url,escape(photo.license))}`:''}. ${photo.processing_note?escape(photo.processing_note):'Optimización de tamaño y formato para la web.'}</li>`).join('')}</ul>`;
}
