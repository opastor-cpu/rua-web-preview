import {readFileSync,existsSync} from 'node:fs';
export const activities = JSON.parse(readFileSync('content/actividades.json','utf8')).activities;
const escape = s => String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const categories = {
 'hora-planeta-2025':'educacion','eco-innova-2025':'encuentros','enuma-2025':'encuentros','chili-2024':'territorio','educca-2023':'educacion','hunter-sostenible-2023':'territorio'
};
export function activityPhoto(photo,{className='',eager=false}={}){
 const webp=photo.filename.replace(/\.jpe?g$/i,'.webp');
 return `<picture>${existsSync(webp)?`<source type="image/webp" srcset="${escape(webp)}">`:''}<img class="${className}" src="${escape(photo.filename)}" width="${photo.dimensions.width}" height="${photo.dimensions.height}" ${eager?'fetchpriority="high"':'loading="lazy"'} alt="${escape(photo.alt)}"></picture>`;
}
export function stories(limit){
 const chosen=limit?[activities.find(a=>a.id==='hora-planeta-2025'),activities.find(a=>a.id==='eco-innova-2025'),activities.find(a=>a.id==='chili-2024')].filter(Boolean).slice(0,limit):activities;
 return `<div class="story-grid story-grid-v2">${chosen.map(a=>`<article class="story-card" data-story="${categories[a.id]}" data-search="${escape([a.title,a.place,a.date_label,a.category].join(' '))}"><a class="story-art" href="actividad-${a.id}.html" aria-label="Ver ${escape(a.title)}">${activityPhoto(a.images[0])}<span class="art-label">${escape(a.category)}</span></a><div class="story-meta"><span>${escape(a.date_label)}</span></div><h3><a href="actividad-${a.id}.html">${escape(a.title)}</a></h3><p>${escape(a.summary.split('. ')[0])}${a.summary.split('. ').length>1?'.':''}</p><a class="text-link" href="actividad-${a.id}.html">Ver actividad y fotografías</a></article>`).join('')}</div>`;
}
export function activityPages({page,pageHero,external}){
 for(const a of activities){
  const gallery=a.images.filter(i=>i.recommended!==false).slice(1);
  page(`actividad-${a.id}.html`,a.title,a.summary,`${pageHero('Actividades','RUA en acción',escape(a.title),escape(a.place))}<section class="section activity-article"><div class="container"><div class="article-meta"><span>${escape(a.date_label)}</span><span>${escape(a.category)}</span></div><figure class="article-main-photo">${activityPhoto(a.images[0],{eager:true})}<figcaption>${escape(a.images[0].context)} <span>Fotografía: ${escape(a.images[0].credit)}.</span></figcaption></figure><div class="article-content"><div><span class="eyebrow">Una historia de acción compartida</span><h2>Universidad y comunidad,<br><em>en el mismo camino.</em></h2></div><div><p class="intro">${escape(a.summary)}</p><div class="article-source"><span>Conoce la publicación original</span>${external(a.source,escape(a.publisher))}</div></div></div>${gallery.length?`<div class="activity-gallery">${gallery.map(i=>`<figure>${activityPhoto(i)}<figcaption>${escape(i.context)} Fotografía: ${escape(i.credit)}.</figcaption></figure>`).join('')}</div>`:''}<div class="article-bottom"><a class="button outline" href="actividades.html#historias">Volver a todas las actividades</a><a class="button" href="participa.html">Quiero participar en RUA</a></div></div></section>`,'actividades');
 }
}
export function activityCredits(external){
 return `<h2>Actividades y fotografías de RUA</h2><p>Las fotografías de actividades proceden de las publicaciones institucionales que se enlazan aquí. Se conservan sus créditos y marcas. Las imágenes de encuentros colectivos muestran a sus participantes; no se atribuye a RUA la pertenencia de todas las personas retratadas.</p><ul>${activities.map(a=>`<li><strong>${escape(a.title)}</strong> · ${escape(a.date_label)}. Fotografía y fuente: ${external(a.source,escape(a.publisher))}.</li>`).join('')}</ul>`;
}
