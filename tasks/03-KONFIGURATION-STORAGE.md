# Task: Konfiguration im Storage persistieren

**Status:** ✅ Abgeschlossen  
**Datum:** 2026-02-04  
**Bereich:** `src/lib/builder/WidgetBuilder.svelte`

## Ziel

- Die Widget-Builder-Konfiguration soll nach einem Reload der Website erhalten bleiben.

## Umsetzung

- Speicherung der Formularwerte in `localStorage` unter `oer-client-builder:widget-builder-form:v1`.
- Wiederherstellung der Werte beim Start im `onMount` (SSR-sicher).

## Hinweise

- Die Implementierung ist zusammen mit Apply/Auto-Vorschau umgesetzt (siehe `tasks/02-BUILDER-PERSISTENZ-APPLY.md`).

