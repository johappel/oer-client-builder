# Task: Kind-Spezifika (Links, Pflichtfelder, Profile-Ansicht)

**Status:** ✅ Abgeschlossen  
**Datum:** 2026-02-05  
**Bereich:** `src/lib/nostr/nip19.ts`, `src/lib/nostr/parser.ts`, `src/lib/nostr/types.ts`, `src/lib/nostr/filter.ts`, `src/lib/widget/nostr-feed.ts`

## Ziel

- **Calendar (31922/31923):** `start` (optional `end`) ist notwendig, um Termine sinnvoll darzustellen und zuzuordnen; Öffnen-Link soll auf die Event-URI (`nostr:naddr...`) zeigen.
- **Artikel & Nachrichten (30023, 1):** Titel/Name/Beschreibung sind wichtig; Öffnen-Link soll auf die passende URI (`nostr:naddr...` bzw. `nostr:nevent...`) zeigen.
- **Profile (0):** Autor:innen/Creator/Contributor sollen darstellbar und verlinkbar sein; Klick auf eine Person öffnet eine Ansicht mit Person + deren Inhalten.
- **OER (30142):** Bestimmte Metadaten sollen im Klartext sichtbar sein (u.a. `learningResourceType`, `creator`, `about`, `audience`, `license`, `d`).

## Umsetzung

- `src/lib/nostr/nip19.ts`: Bech32-Encoding + Encoder für `naddr`, `nevent`, `nprofile`.
- `src/lib/nostr/parser.ts`:
  - Kind `1` bekommt `parseNoteEvent()` (Titel/Description aus Content).
  - `ParsedEvent.nostrUri` wird pro Kind abgeleitet (31922/31923/30142/30023 → `naddr`, 1 → `nevent`, 0 → `nprofile`).
- `src/lib/nostr/types.ts`: Metadaten erweitert (u.a. `NoteMetadata`, `ArticleMetadata` mit `name/description/d`, `AMBMetadata` mit `d` + `creatorPubkeys/contributorPubkeys`, `ParsedEvent.nostrUri`).
- `src/lib/nostr/filter.ts`: Volltextsuche nutzt Note-Metadaten (Titel/Summary/Description).
- `src/lib/widget/nostr-feed.ts`:
  - Calendar-Events ohne `start` werden nicht angezeigt.
  - „Öffnen“-Links nutzen bevorzugt `event.nostrUri` (fallback: `metadata.url`).
  - Klick auf Autor (Card/Modal) öffnet Profile-Ansicht inkl. Inhalte-Liste.
  - OER-Modal zeigt Schlüsselmetadaten im Klartext; Creator/Contributor (nostr) erscheinen als klickbare Chips.
  - Calendar: Wenn ein `r`-Tag vorhanden ist, wird dieser als primärer Link verwendet; wenn `location` eine URL ist, wird „Online“ als klickbarer Link in der Beschreibung ergänzt.
  - Browser-kompatibel: `nostr:*` Links werden beim Öffnen in `https://njump.edufeed.org/<entity>` umgewandelt.

## Validierung

- `npm run check`
- `npm run build`
