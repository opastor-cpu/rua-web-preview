import {readFileSync} from 'node:fs';
import {mascot} from './experience.mjs';

const {activities} = JSON.parse(readFileSync('content/proximas-actividades.json', 'utf8'));
const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const calendar = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18M8 15h2m4 0h2m-8 3h2"/></svg>';

export function upcomingSection() {
  // Confirmed activities can be added with title, date_label, place, summary and url.
  const agenda = activities.length ? `<div class="upcoming-list">${activities.map(activity => `<article class="upcoming-event"><span class="upcoming-date">${escape(activity.date_label)}</span><h2>${escape(activity.title)}</h2>${activity.place ? `<p class="upcoming-place">${escape(activity.place)}</p>` : ''}<p>${escape(activity.summary)}</p>${activity.url ? `<a class="text-link" href="${escape(activity.url)}" target="_blank" rel="noopener noreferrer">Ver más<span class="sr-only"> sobre ${escape(activity.title)} (abre en otra pestaña)</span></a>` : ''}</article>`).join('')}</div>` : `<div class="upcoming-empty">${calendar}<div><h2>Agenda por anunciar</h2><p>Pronto compartiremos las nuevas actividades.</p></div></div>`;
  return `<section class="upcoming-section" id="proximas-actividades" aria-labelledby="upcoming-title"><div class="container"><nav class="breadcrumb" aria-label="Ruta de navegación"><a href="index.html">Inicio</a><span aria-hidden="true">/</span><span>Actividades</span></nav><div class="upcoming-layout"><div class="upcoming-intro"><span class="eyebrow">Agenda RUA</span><h1 id="upcoming-title">Próximas<br><em>actividades.</em></h1><p>Aquí encontrarás las próximas fechas y cómo participar en RUA.</p></div><div class="upcoming-agenda">${agenda}</div><div class="upcoming-art" aria-hidden="true">${mascot('upcoming-mascot', 'plant')}</div></div></div></section>`;
}
