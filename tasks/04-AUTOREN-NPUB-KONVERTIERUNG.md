# Task: Autoren-Eingabe `npub` automatisch konvertieren

**Status:** ✅ Abgeschlossen  
**Datum:** 2026-02-04  
**Bereich:** `src/lib/widget/nostr-feed.ts`, `src/lib/nostr/nip19.ts`, `src/lib/builder/WidgetBuilder.svelte`

## Ziel

- Das Relay erwartet im Nostr-Filter `authors` hex-Pubkeys.
- Im Builder soll man komfortabel `npub1...` (Bech32 / NIP-19) eingeben können.

## Umsetzung

- NIP-19 Utility `npub → hex` implementiert in `src/lib/nostr/nip19.ts` (ohne externe Dependencies).
- Widget akzeptiert im `authors`-Attribut sowohl hex als auch `npub` und konvertiert beim Parsen.
- Builder-Label angepasst auf „npub oder hex“.

## Validierung

- `npm run check`
- `npm run build`

