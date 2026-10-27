import * as db from './db.js';
import { h, blobUrl, formatTime, iconBtn, icons, toast } from './util.js';

const LETTERS = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const collator = new Intl.Collator('de', { sensitivity: 'base', numeric: true });

/** Anfangsbuchstabe für die Gruppierung: Ä→A, Ö→O, Ü→U, Ziffern/Sonderzeichen→# */
export function letterOf(title) {
  const c = (title || '').trim().charAt(0).normalize('NFD').charAt(0).toUpperCase();
  return c >= 'A' && c <= 'Z' ? c : '#';
}

export async function renderList() {
  const recipes = (await db.getAll()).sort((a, b) => collator.compare(a.title, b.title));

  const listEl = h('div', { class: 'recipe-list' });
  const indexEl = h('nav', { class: 'az-index', 'aria-label': 'Schnellauswahl nach Anfangsbuchstabe' });
  const bubble = h('div', { class: 'az-bubble', 'aria-hidden': 'true' });
  let available = new Set();

  function fill(query) {
    const q = query.trim().toLowerCase();
    const shown = q
      ? recipes.filter((r) => r.title.toLowerCase().includes(q) || (r.tags || []).some((t) => t.toLowerCase().includes(q)))
      : recipes;

    const groups = new Map();
    for (const r of shown) {
      const l = letterOf(r.title);
      if (!groups.has(l)) groups.set(l, []);
      groups.get(l).push(r);
    }
    available = new Set(groups.keys());

    if (!recipes.length) {
      listEl.replaceChildren(
        h('div', { class: 'empty' },
          h('p', { class: 'empty-title' }, 'Noch keine Rezepte'),
          h('p', {}, 'Leg dein erstes Rezept an.'),
          h('a', { class: 'btn primary', href: '#/neu' }, 'Neues Rezept'))
      );
    } else if (!shown.length) {
      listEl.replaceChildren(h('div', { class: 'empty' }, h('p', {}, `Keine Treffer für „${query.trim()}“`)));
    } else {
      listEl.replaceChildren(
        ...[...groups].map(([letter, items]) =>
          h('section', { class: 'group', id: 'sec-' + letter },
            h('h2', { class: 'group-head' }, letter),
            h('ul', {}, items.map(itemEl)))
        )
      );
    }

    indexEl.replaceChildren(
      ...LETTERS.map((l) => h('span', { class: available.has(l) ? '' : 'off', 'data-l': l }, l))
    );
    indexEl.hidden = !shown.length;
  }

  function itemEl(r) {
    const meta = [formatTime(r.timeMinutes), (r.tags || []).join(', ')].filter(Boolean).join(' · ');
    const thumb = r.image
      ? h('img', { class: 'thumb', src: blobUrl(r.image), alt: '', loading: 'lazy' })
      : h('div', { class: 'thumb placeholder' }, r.title.trim().charAt(0).toUpperCase());
    return h('li', {},
      h('a', { class: 'item', href: '#/rezept/' + encodeURIComponent(r.id) },
        thumb,
        h('div', { class: 'item-text' },
          h('div', { class: 'item-title' }, r.title),
          meta && h('div', { class: 'item-meta' }, meta))));
  }

  // --- Buchstaben-Index: Antippen oder mit dem Finger darüberziehen ---
  let lastLetter = null;
  function jumpAt(clientY) {
    const rect = indexEl.getBoundingClientRect();
    const i = Math.max(0, Math.min(LETTERS.length - 1, Math.floor(((clientY - rect.top) / rect.height) * LETTERS.length)));
    // Gruppe vorhanden? Sonst die nächste danach, notfalls die letzte davor
    let target = LETTERS.slice(i).find((l) => available.has(l)) || LETTERS.slice(0, i).reverse().find((l) => available.has(l));
    bubble.textContent = LETTERS[i];
    bubble.classList.add('show');
    if (!target || target === lastLetter) return;
    lastLetter = target;
    document.getElementById('sec-' + target)?.scrollIntoView({ block: 'start' });
    if (navigator.vibrate) navigator.vibrate(5);
  }
  function endDrag() {
    lastLetter = null;
    bubble.classList.remove('show');
  }
  indexEl.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    indexEl.setPointerCapture(e.pointerId);
    jumpAt(e.clientY);
  });
  indexEl.addEventListener('pointermove', (e) => {
    if (indexEl.hasPointerCapture(e.pointerId)) jumpAt(e.clientY);
  });
  indexEl.addEventListener('pointerup', endDrag);
  indexEl.addEventListener('pointercancel', endDrag);

  // --- Kopfzeile ---
  const search = h('input', {
    type: 'search', placeholder: 'Suchen …', 'aria-label': 'Rezepte durchsuchen',
    oninput: () => { fill(search.value); window.scrollTo(0, 0); },
  });
  const searchWrap = h('label', { class: 'search' }, search);
  searchWrap.insertAdjacentHTML('afterbegin', icons.search);

  const menu = h('div', { class: 'menu', hidden: true },
    h('button', { type: 'button', onclick: doExport }, 'Backup exportieren'),
    h('button', { type: 'button', onclick: doImport }, 'Backup importieren'));
  const menuBtn = iconBtn('more', 'Menü', (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
    if (!menu.hidden) document.addEventListener('click', () => (menu.hidden = true), { once: true });
  });

  async function doExport() {
    menu.hidden = true;
    const data = await db.exportAll();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `rezepte-backup-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`${data.recipes.length} Rezepte exportiert`);
  }

  function doImport() {
    menu.hidden = true;
    const input = h('input', { type: 'file', accept: 'application/json,.json' });
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        const n = await db.importAll(JSON.parse(await file.text()));
        toast(`${n} Rezepte importiert`);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } catch (err) {
        toast('Import fehlgeschlagen: ' + err.message);
      }
    };
    input.click();
  }

  const fab = h('a', { class: 'fab', href: '#/neu', 'aria-label': 'Neues Rezept', title: 'Neues Rezept' });
  fab.innerHTML = icons.plus;

  fill('');

  return h('div', { class: 'view list-view' },
    h('header', { class: 'topbar' },
      h('h1', {}, 'Rezepte'),
      h('div', { class: 'topbar-actions' }, menuBtn, menu)),
    recipes.length ? h('div', { class: 'search-bar' }, searchWrap) : null,
    listEl,
    indexEl,
    bubble,
    fab);
}
