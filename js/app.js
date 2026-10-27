import { renderList } from './list.js';
import { renderDetail } from './detail.js';
import { renderEdit } from './edit.js';
import { releaseBlobUrls, h, nav } from './util.js';

const app = document.getElementById('app');

// Scrollposition der Liste merken, damit „Zurück“ an derselben Stelle landet
let listScroll = 0;
let currentRoute = '';

async function route() {
  const hash = location.hash.replace(/^#/, '') || '/';
  if (currentRoute === '/') listScroll = window.scrollY;
  currentRoute = hash;

  releaseBlobUrls();
  let view;
  let m;
  try {
    if (hash === '/') view = await renderList();
    else if (hash === '/neu') view = await renderEdit(null);
    else if ((m = hash.match(/^\/rezept\/([^/]+)\/bearbeiten$/))) view = await renderEdit(decodeURIComponent(m[1]));
    else if ((m = hash.match(/^\/rezept\/([^/]+)$/))) view = await renderDetail(decodeURIComponent(m[1]));
    else {
      location.replace('#/');
      return;
    }
  } catch (err) {
    console.error(err);
    view = h('div', { class: 'empty' }, h('p', {}, 'Fehler: ' + err.message), h('a', { class: 'btn', href: '#/' }, 'Zur Übersicht'));
  }

  app.replaceChildren(view);
  window.scrollTo(0, hash === '/' ? listScroll : 0);
}

window.addEventListener('hashchange', (e) => {
  if (e.isTrusted) nav.count++;
  route();
});
route();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service Worker nicht registriert', e));
}

// Browser bitten, die Daten nicht automatisch zu löschen
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
