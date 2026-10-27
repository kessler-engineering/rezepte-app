const MAX_EDGE = 1600;
const QUALITY = 0.85;

/** Verkleinert ein Bild auf höchstens MAX_EDGE px Kantenlänge und gibt ein JPEG-Blob zurück. */
export async function shrinkImage(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Bild konnte nicht verarbeitet werden'))), 'image/jpeg', QUALITY)
  );
}

/** Öffnet die Dateiauswahl (auf dem Handy: Kamera oder Galerie) und liefert das verkleinerte Bild oder null. */
export function pickImage() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) return resolve(null);
      shrinkImage(file).then(resolve, reject);
    };
    input.click();
  });
}
