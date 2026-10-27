import * as db from './db.js';
import { pickImage } from './image.js';
import { h, blobUrl, formatTime, goBack, iconBtn, icons, toast } from './util.js';

export async function renderDetail(id) {
  const r = await db.get(id);
  if (!r) {
    return h('div', { class: 'empty' }, h('p', {}, 'Rezept nicht gefunden.'), h('a', { class: 'btn', href: '#/' }, 'Zur Übersicht'));
  }

  async function addImage() {
    try {
      const blob = await pickImage();
      if (!blob) return;
      r.image = blob;
      r.updatedAt = Date.now();
      await db.put(r);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch (err) {
      toast(err.message);
    }
  }

  async function del() {
    if (!confirm(`„${r.title}“ wirklich löschen?`)) return;
    await db.remove(r.id);
    toast('Rezept gelöscht');
    goBack('#/');
  }

  let hero;
  if (r.image) {
    const change = h('button', { class: 'hero-change', type: 'button', onclick: addImage, 'aria-label': 'Bild ändern', title: 'Bild ändern' });
    change.innerHTML = icons.camera;
    hero = h('div', { class: 'hero' }, h('img', { src: blobUrl(r.image), alt: r.title }), change);
  } else {
    const add = h('button', { class: 'hero-add', type: 'button', onclick: addImage }, h('span', {}, 'Bild hinzufügen'));
    add.insertAdjacentHTML('afterbegin', icons.camera);
    hero = add;
  }

  const facts = [
    r.servings ? `${r.servings} ${r.servings === 1 ? 'Portion' : 'Portionen'}` : null,
    r.timeMinutes ? formatTime(r.timeMinutes) : null,
  ].filter(Boolean);

  const ingredients = (r.ingredients || []).filter((x) => x.trim());

  return h('div', { class: 'view detail-view' },
    h('header', { class: 'topbar' },
      iconBtn('back', 'Zurück', () => goBack('#/')),
      h('div', { class: 'topbar-title' }, r.title),
      h('div', { class: 'topbar-actions' },
        iconBtn('edit', 'Bearbeiten', () => (location.hash = `#/rezept/${encodeURIComponent(r.id)}/bearbeiten`)),
        iconBtn('trash', 'Löschen', del))),
    hero,
    h('article', { class: 'content' },
      h('h1', { class: 'recipe-title' }, r.title),
      (r.tags || []).length ? h('div', { class: 'chips' }, r.tags.map((t) => h('span', { class: 'chip' }, t))) : null,
      facts.length ? h('div', { class: 'facts' }, facts.map((f) => h('span', {}, f))) : null,
      ingredients.length
        ? h('section', {},
            h('h2', {}, 'Zutaten'),
            h('ul', { class: 'ingredients' },
              ingredients.map((x) => h('li', { onclick: (e) => e.currentTarget.classList.toggle('done') }, x))))
        : null,
      r.steps && r.steps.trim()
        ? h('section', {}, h('h2', {}, 'Zubereitung'), h('div', { class: 'steps' }, paragraphs(r.steps)))
        : null,
      r.notes && r.notes.trim()
        ? h('section', {}, h('h2', {}, 'Notizen'), h('div', { class: 'notes' }, paragraphs(r.notes)))
        : null));
}

function paragraphs(text) {
  return text.split(/\n\s*\n/).map((p) => h('p', {}, p.trim()));
}
