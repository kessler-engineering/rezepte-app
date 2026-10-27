const DB_NAME = 'rezepte';
const STORE = 'recipes';

let dbPromise;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function run(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req && req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export const getAll = () => run('readonly', (s) => s.getAll());
export const get = (id) => run('readonly', (s) => s.get(id));
export const put = (recipe) => run('readwrite', (s) => s.put(recipe));
export const remove = (id) => run('readwrite', (s) => s.delete(id));

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export async function exportAll() {
  const recipes = await getAll();
  const out = [];
  for (const r of recipes) {
    out.push({ ...r, image: r.image ? await blobToDataUrl(r.image) : null });
  }
  return { app: 'rezepte', version: 1, exportedAt: new Date().toISOString(), recipes: out };
}

/** Importiert ein Backup. Rezepte mit gleicher ID werden überschrieben. Gibt die Anzahl zurück. */
export async function importAll(data) {
  if (!data || !Array.isArray(data.recipes)) throw new Error('Keine gültige Backup-Datei');
  let n = 0;
  for (const r of data.recipes) {
    if (!r || !r.id || !r.title) continue;
    const image = r.image ? await (await fetch(r.image)).blob() : null;
    await put({ ...r, image });
    n++;
  }
  return n;
}
