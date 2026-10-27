import * as db from './db.js';
import { pickImage } from './image.js';
import { h, blobUrl, goBack, iconBtn, toast } from './util.js';

export async function renderEdit(id) {
  const existing = id ? await db.get(id) : null;
  if (id && !existing) {
    return h('div', { class: 'empty' }, h('p', {}, 'Rezept nicht gefunden.'), h('a', { class: 'btn', href: '#/' }, 'Zur Übersicht'));
  }
  const r = existing || {
    id: crypto.randomUUID(), title: '', ingredients: [], steps: '', tags: [],
    servings: null, timeMinutes: null, notes: '', image: null, createdAt: Date.now(),
  };
  let image = r.image;

  const field = (label, input) => h('label', { class: 'field' }, h('span', {}, label), input);

  const title = h('input', { type: 'text', value: r.title, required: true, placeholder: 'z. B. Kartoffelsuppe' });
  const servings = h('input', { type: 'number', min: 1, inputMode: 'numeric', value: r.servings ?? '' });
  const time = h('input', { type: 'number', min: 0, inputMode: 'numeric', value: r.timeMinutes ?? '', placeholder: 'Minuten' });
  const tags = h('input', { type: 'text', value: (r.tags || []).join(', '), placeholder: 'z. B. Suppe, vegetarisch' });
  const ingredients = h('textarea', { rows: 6, value: (r.ingredients || []).join('\n'), placeholder: 'Eine Zutat pro Zeile\n500 g Kartoffeln\n1 Zwiebel' });
  const steps = h('textarea', { rows: 8, value: r.steps || '', placeholder: 'Schritte, durch Leerzeilen getrennt' });
  const notes = h('textarea', { rows: 3, value: r.notes || '' });

  const imageBox = h('div', { class: 'image-edit' });
  function drawImage() {
    imageBox.replaceChildren(
      image ? h('img', { src: blobUrl(image), alt: '' }) : h('div', { class: 'image-none' }, 'Kein Bild'),
      h('div', { class: 'image-actions' },
        h('button', { type: 'button', class: 'btn', onclick: changeImage }, image ? 'Bild ändern' : 'Bild hinzufügen'),
        image ? h('button', { type: 'button', class: 'btn', onclick: () => { image = null; drawImage(); } }, 'Bild entfernen') : null)
    );
  }
  async function changeImage() {
    try {
      const blob = await pickImage();
      if (blob) { image = blob; drawImage(); }
    } catch (err) {
      toast(err.message);
    }
  }
  drawImage();

  const toNum = (v) => (v === '' ? null : Math.max(0, Math.round(Number(v))) || null);

  async function save(e) {
    e.preventDefault();
    if (!title.value.trim()) {
      title.focus();
      return;
    }
    await db.put({
      ...r,
      title: title.value.trim(),
      servings: toNum(servings.value),
      timeMinutes: toNum(time.value),
      tags: tags.value.split(',').map((t) => t.trim()).filter(Boolean),
      ingredients: ingredients.value.split('\n').map((x) => x.trim()).filter(Boolean),
      steps: steps.value.trim(),
      notes: notes.value.trim(),
      image,
      updatedAt: Date.now(),
    });
    toast('Gespeichert');
    // Bearbeiten-Seite durch die Detailansicht ersetzen, damit „Zurück“ nicht wieder im Formular landet
    const target = `#/rezept/${encodeURIComponent(r.id)}`;
    if (existing) goBack(target);
    else location.replace(target);
  }

  const cancel = () => goBack(existing ? `#/rezept/${encodeURIComponent(r.id)}` : '#/');

  const form = h('form', { class: 'content edit-form', onsubmit: save },
    field('Titel *', title),
    h('div', { class: 'row' }, field('Portionen', servings), field('Zeit (Min.)', time)),
    field('Kategorie / Tags (kommagetrennt)', tags),
    field('Zutaten', ingredients),
    field('Zubereitung', steps),
    field('Notizen', notes),
    h('div', { class: 'field' }, h('span', {}, 'Bild'), imageBox),
    h('div', { class: 'form-actions' },
      h('button', { type: 'button', class: 'btn', onclick: cancel }, 'Abbrechen'),
      h('button', { type: 'submit', class: 'btn primary' }, 'Speichern')));

  if (!existing) setTimeout(() => title.focus(), 50);

  return h('div', { class: 'view edit-view' },
    h('header', { class: 'topbar' },
      iconBtn('back', 'Abbrechen', cancel),
      h('div', { class: 'topbar-title' }, existing ? 'Rezept bearbeiten' : 'Neues Rezept')),
    form);
}
