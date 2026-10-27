/** Kleiner Helfer zum Erzeugen von DOM-Elementen: h('div', {class: 'x', onclick}, kind1, kind2) */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k in el && k !== 'list') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** Objekt-URLs für Bilder; werden beim Seitenwechsel freigegeben. */
const urls = [];
export function blobUrl(blob) {
  const u = URL.createObjectURL(blob);
  urls.push(u);
  return u;
}
export function releaseBlobUrls() {
  while (urls.length) URL.revokeObjectURL(urls.pop());
}

/** Zahl der Seitenwechsel innerhalb der App; wird vom Router hochgezählt. */
export const nav = { count: 0 };

/** Zurück innerhalb der App; wurde die Seite direkt geöffnet, stattdessen zu `fallback`. */
export function goBack(fallback) {
  if (nav.count > 0) history.back();
  else location.replace(fallback);
}

export function formatTime(min) {
  if (!min) return '';
  if (min < 60) return `${min} Min.`;
  const hrs = Math.floor(min / 60);
  const rest = min % 60;
  return rest ? `${hrs} Std. ${rest} Min.` : `${hrs} Std.`;
}

export function toast(msg) {
  const t = h('div', { class: 'toast', role: 'status' }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), 2600);
}

export const icons = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  more: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/></svg>',
  camera: '<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
};

export function iconBtn(name, label, onclick, extraClass = '') {
  const b = h('button', { class: `icon-btn ${extraClass}`, type: 'button', 'aria-label': label, title: label, onclick });
  b.innerHTML = icons[name];
  return b;
}
