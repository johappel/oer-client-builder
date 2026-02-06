# Task: Profile-Ansicht (View) + Card-Theming + Footer-Layout

**Status:** ✅ Abgeschlossen  
**Datum:** 2026-02-05  
**Bereich:** `src/lib/widget/nostr-feed.ts`, `src/lib/widget/card-renderers/*`

## Ziel

- Klick auf Avatar/Autor soll **nicht** den Detail-Dialog öffnen, sondern in eine **Profil-Ansicht** wechseln (mit „Zurück zur Übersicht“).
- Detailansicht bleibt als **Modal** für Events erhalten.
- Card-Layout soll konsistent sein: **Footer unten** (Avatar links, „Öffnen →“ rechts), unabhängig von Inhaltshöhe.
- Auf farbintensive Verlaufsflächen in Cards verzichten und stattdessen **Light/Dark/Auto Theme** über CSS-Variablen nutzen.
- Wenn kein Bild vorhanden ist: dezenter **Glow/Placeholder-Gradient** im Bildbereich.
- OER-Overlay-Chips (educationalLevel/resourceType/about) sollen **einzeilig** bleiben und bei langen Labels gekürzt werden.

## Umsetzung

### Profil-Ansicht (View statt Modal)

- `src/lib/widget/nostr-feed.ts`
  - Neue Profile-Header-UI im Widget (Banner, Avatar, Name, Pubkey/NIP-05, About).
  - „← Zurück zur Übersicht“ setzt den View zurück und zeigt wieder Suche/Kategorien.
  - Filter-Chips in der Profilansicht: **Alle / Termine / Materialien**.
  - Grid wird im Profilmodus auf `authors=[pubkey]` gefiltert; Suche/Kategorien werden deaktiviert.

### Footer-Layout als Default

- `src/lib/widget/nostr-feed.ts`: Shared CSS für `.card-footer` (bottom-aligned, links Meta/Avatar, rechts Link).
- Renderer:
  - `src/lib/widget/card-renderers/default.ts`
  - `src/lib/widget/card-renderers/calendar.ts`
  - `src/lib/widget/card-renderers/amb.ts`
  - Alle nutzen nun ein gemeinsames Footer-Markup (`.card-footer` + optional `.card-footer-spacer`).

### Theming (Light/Dark/Auto) + Placeholder Glow

- `src/lib/widget/nostr-feed.ts`
  - CSS Custom Properties für Oberflächen/Border/Text/Link/Chips (inkl. Dark-Overrides).
  - `theme="auto"` berücksichtigt `prefers-color-scheme: dark`.
  - `.card-image--placeholder` rendert einen subtilen Glow-Gradient, wenn kein Bild vorhanden ist.
  - „NO IMAGE“ Text wurde entfernt.

### OER Overlay-Chips (einzeilig, begrenzt)

- `src/lib/widget/nostr-feed.ts`
  - `.oer-chip-stack` ist auf max. `60%` Bildbreite begrenzt.
  - `.oer-chip-overlay` ist einzeilig (`text-overflow: ellipsis`), sodass lange `about` Labels nicht umbrechen.

## Validierung

- `npm run check`
- `npm run build`

