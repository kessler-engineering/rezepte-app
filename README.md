# Rezepte

Web-App (PWA) für Küchenrezepte. Läuft im Browser auf Handy und PC und funktioniert offline. Die Rezepte werden lokal im Browser gespeichert (IndexedDB).

## Starten (PC)

```
python -m http.server 8000
```

Danach im Browser `http://localhost:8000` öffnen. Ein Doppelklick auf `index.html` reicht nicht, weil Service Worker und Module einen Server brauchen.

## Aufs Handy bringen

Die App ist über GitHub Pages online: **https://kessler-engineering.github.io/rezepte-app/**

Jeder Push auf `main` wird nach etwa einer Minute automatisch veröffentlicht.

- **Android (Chrome):** Adresse öffnen → Menü ⋮ → „App installieren“
- **iPhone (Safari):** Adresse öffnen → Teilen → „Zum Home-Bildschirm“

Die Daten liegen pro Gerät und Browser. Zum Sichern oder Übertragen: Menü ⋮ → „Backup exportieren“ und auf dem anderen Gerät „Backup importieren“.

## Dateien

- `js/list.js`: Hauptmenü, Suche, Buchstaben-Index
- `js/detail.js`: Rezeptansicht
- `js/edit.js`: Anlegen und Bearbeiten
- `js/db.js`: Speicherung, Export und Import
- `js/image.js`: verkleinert Fotos auf maximal 1600 px
- `sw.js`: Offline-Cache. Nach Änderungen an den Dateien `CACHE` hochzählen (`rezepte-v2` …)
