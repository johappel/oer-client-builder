# Task: Builder Persistenz + Apply/Auto-Vorschau

**Status:** ✅ Abgeschlossen  
**Datum:** 2026-02-04  
**Bereich:** `src/lib/builder/WidgetBuilder.svelte`

## Ziel

- Vorschau nicht bei jedem Tastendruck neu initialisieren (WebSocket-Reconnect vermeiden)
- Formularzustand beim Neuladen der Seite wiederherstellen

## Umsetzung

- **Apply-Mechanismus**: Vorschau wird nur aus einem *applied* Config-State gerendert (Button „Apply“).
- **Auto-Vorschau**: Optional per Checkbox, debounced (500ms) – aktualisiert die Vorschau ohne Klick.
- **localStorage Persistenz**: Formularfelder + Auto-Vorschau werden unter `oer-client-builder:widget-builder-form:v1` gespeichert und beim Start wieder geladen.
- **SSR-sicher**: `localStorage` Zugriff nur im `onMount`, Persistenz-Writes nur wenn `isClient === true`.

## Validierung

- `npm run check`
- `npm run build`

