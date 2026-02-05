# Task: Calendar Events (31922/31923) â€“ Parser pro Kind

**Status:** âœ… Abgeschlossen  
**Datum:** 2026-02-05  
**Bereich:** `src/lib/nostr/parser.ts`, `src/lib/nostr/types.ts`, `src/lib/nostr/filter.ts`

## Ziel

- Bei Calendar/Events (NIP-52) sollen die wichtigen Felder aus den Nostr-`tags` extrahiert werden (z.B. `title`, `start`, `end`, `start_tzid/start_tz`, `end_tzid/end_tz`, `image`, `location`, `d`).
- Es soll pro `kind` einen eigenen Parser geben:
  - Kind `31922` (date-based): `start`/`end` als ISO-Datum (`YYYY-MM-DD`)
  - Kind `31923` (time-based): `start`/`end` als Unix-Timestamp (Sekunden)

## Umsetzung

- `src/lib/nostr/types.ts`: `CalendarEvent` erweitert (u.a. `title`, `content`, `start/end` als `string | number`, `start_tzid/end_tzid`, strukturierte `participants`).
- `src/lib/nostr/parser.ts`:
  - Gemeinsame Tag-Extraktion in `parseCalendarEventBase()`
  - Kind-spezifische Parser: `parseCalendarEventDate()` (31922) und `parseCalendarEventTime()` (31923)
  - `parseEvent()` nutzt eine `kind -> parser` Registry (`metadataParsersByKind`) statt nur nach Event-Typ zu unterscheiden
- `src/lib/nostr/filter.ts`: Volltextsuche fÃ¼r Calendar-Events nutzt jetzt `title` + `summary/description/content` + `location`.

## Validierung

- `npm run check`
- `npm run build`

