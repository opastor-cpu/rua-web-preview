const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#main-menu');
function closeMenu(returnFocus = false) {
  menuButton?.setAttribute('aria-expanded', 'false');
  menu?.classList.remove('is-open');
  document.body.classList.remove('menu-open');
  if (returnFocus) menuButton.focus();
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menu.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
});
menu?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') closeMenu(true); });
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
matchMedia('(min-width: 851px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

document.querySelectorAll('.filter-button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter-button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let count = 0;
    document.querySelectorAll('[data-story]').forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.story !== button.dataset.filter;
      if (!card.hidden) count++;
    });
    document.querySelector('#filter-count').textContent = `${count} ${count === 1 ? 'historia' : 'historias'}`;
  });
});

const form = document.querySelector('#contact-form');
const result = document.querySelector('#contact-result');
if (form) form.querySelector('button[type="submit"]').disabled = false;
let draftMessage = '';
form?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const interest = String(data.get('interest'));
  const message = String(data.get('message') || '').trim();
  draftMessage = `Hola, equipo de RUA Perú – Nodo UNSA.${name ? ` Soy ${name}.` : ''}\nMe interesa ${interest}.${message ? `\n${message}` : ''}\n¿Podrían orientarme?`;
  document.querySelector('#message-preview').textContent = draftMessage;
  const contactLink = document.querySelector('#whatsapp-link');
  contactLink.href = interest === 'participar en el voluntariado' ? 'https://wa.link/uts8bs' : 'https://wa.link/3i4ec9';
  result.hidden = false;
  document.querySelector('#copy-status').textContent = '';
  result.focus({ preventScroll: true });
  result.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
});
document.querySelector('#copy-message')?.addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(draftMessage);
    status.textContent = 'Mensaje copiado. Puedes pegarlo en WhatsApp.';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector('#message-preview'));
    const selection = window.getSelection();
    selection.removeAllRanges(); selection.addRange(range);
    status.textContent = 'Texto seleccionado. Usa la opción Copiar de tu dispositivo.';
  }
});
const params = new URLSearchParams(window.location.search);
if (form && params.get('interes')) {
  const values = { voluntariado: 'participar en el voluntariado', alianza: 'proponer una colaboración', apoyo: 'apoyar una iniciativa' };
  if (values[params.get('interes')]) form.elements.interest.value = values[params.get('interes')];
}
