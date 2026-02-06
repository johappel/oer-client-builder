# Changelog

## 2026-02-05 - Calendar Parser pro Kind ✅

### Improvements

- `src/lib/nostr/nip19.ts`: Encoder für `naddr`/`nevent`/`nprofile` (Bech32)
- `src/lib/nostr/parser.ts`: `ParsedEvent.nostrUri` pro Kind + Note-Metadaten Parser (Kind 1) + OER Creator/Contributor Pubkeys aus `p` Tags
- `src/lib/widget/nostr-feed.ts`: Profile-Ansicht (Autor-Klick), OER-Schlüsselmetadaten im Modal, Calendar ohne `start` wird ausgefiltert, Öffnen-Link nutzt `nostr:` URI
- Calendar Links: `r`-Tag wird als primärer Link genutzt; `location`-URL erscheint als „Online“ Link im Modal
- Öffnen-Link: `nostr:*` wird für Browser-Klicks als `https://njump.edufeed.org/<entity>` ausgegeben

- `src/lib/nostr/parser.ts`: Kind-spezifische Calendar-Parser für 31922/31923 (Date vs. Unix seconds) + `kind -> parser` Registry
- `src/lib/nostr/types.ts`: `CalendarEvent` erweitert (title/content, TZ-Felder, strukturierte Participants)
- `src/lib/nostr/filter.ts`: Suche für Calendar-Events nutzt `title`/`content`/`location`
- `src/lib/widget/card-renderers/*`: Renderer pro Kind (Default, Calendar, AMB/OER) + gemeinsames Footer-Layout (Avatar links, „Öffnen →“ rechts)
- `src/lib/widget/nostr-feed.ts`: Profil-Ansicht als View (mit „Zurück zur Übersicht“ + Filter Alle/Termine/Materialien); Detail-Modal bleibt nur für Event-Details
- `src/lib/widget/nostr-feed.ts`: Theme über CSS Custom Properties (light/dark/auto inkl. `prefers-color-scheme`) + Placeholder-Glow bei fehlendem Bild + „NO IMAGE“ entfernt

## 2026-02-04 - MVP Implementierung ✅

### Features Implementiert

#### 1. Projekt-Setup
- Svelte 5 Projekt mit TypeScript initialisiert
- Tailwind CSS 4.x mit PostCSS konfiguriert
- Entwicklungsserver läuft auf http://localhost:5173/

#### 2. Nostr Bibliothek (`src/lib/nostr/`)
- **types.ts**: Alle Nostr Event-Typen definiert (Kind 0, 1, 30023, 30142, 31922, 31923)
- **client.ts**: WebSocket-basierter Client mit Multi-Relay Support (inkl. Subscription-Flush bei Connect + optionalem Debug-Logging)
- **nip19.ts**: NIP-19 Helper (npub → hex)
- **parser.ts**: AMB-NIP, NIP-52, NIP-23 Parser
- **filter.ts**: Two-Level Filtering Engine

#### 3. Nostr Feed Widget (`src/lib/widget/`)
- Web Component mit Shadow DOM
- Responsive Grid-Layout
- Suchleiste mit Echtzeit-Filterung
- Kategorie-Chips
- Detail-Modal für Events
- Dark Mode Support
- Autoren-Filter akzeptiert `npub` oder hex (auto-konvertiert)

#### 4. Widget Builder App (`src/lib/builder/`)
- Formular zur Widget-Konfiguration
- Live-Vorschau (Apply/Auto-Preview)
- HTML-Code Generierung
- Copy-to-Clipboard
- Persistente Formular-Einstellungen via localStorage

### Technische Herausforderungen & Lösungen

#### Problem: Config-Initialisierung im Constructor
**Symptom**: Widget verbindet sich nicht mit Relays  
**Ursache**: Die Config wurde im Constructor geparst, bevor Attribute gesetzt waren  
**Lösung**: Config-Initialisierung in `connectedCallback` verschoben

```typescript
// Vorher (nicht funktionierend)
constructor() {
  this.config = this.parseConfig(); // Attribute noch nicht verfügbar
}

// Nachher (funktionierend)
connectedCallback() {
  this.config = this.parseConfig(); // Attribute jetzt verfügbar
  this.connectToRelays();
}
```

#### Problem: PostCSS/Tailwind 4.x Kompatibilität
**Lösung**: `@tailwindcss/postcss` Plugin installiert und konfiguriert

#### Problem: SSR-Fehler mit `document`
**Lösung**: Dynamischer Import im `onMount` Hook der Builder App

### Bekannte Einschränkungen

1. **Events werden nicht sofort angezeigt**: Das Widget zeigt "Verbinde mit Nostr..." bis Events empfangen werden. Dies kann je nach Relay-Auslastung variieren.

2. **Authentifizierung**: Einige Relays erfordern AUTH (z.B. `wss://amb-relay.edufeed.org`), was noch nicht implementiert ist.

3. **UI-Update bei Events**: Die Event-Anzeige im Grid wird noch nicht automatisch aktualisiert, wenn Events empfangen werden.

### Nächste Schritte (M2: Enhanced Features)

1. Automatisches UI-Update bei neuen Events
2. Profil-Ansicht für Autoren
3. Erweiterte Detail-Ansicht für Events
4. Vokabular-Integration (SKOS)
5. Performance-Optimierungen (Virtual Scrolling)

### Tests

- ✅ Widget verbindet sich mit Relays
- ✅ Builder App generiert korrekten HTML-Code
- ✅ Preview funktioniert in der Builder App
- ✅ Dark Mode wird unterstützt

### Dateien

```
src/
├── lib/
│   ├── nostr/
│   │   ├── types.ts
│   │   ├── client.ts
│   │   ├── parser.ts
│   │   ├── filter.ts
│   │   └── index.ts
│   ├── widget/
│   │   ├── nostr-feed.ts
│   │   └── index.ts
│   └── builder/
│       └── WidgetBuilder.svelte
├── routes/
│   ├── +layout.svelte
│   └── +page.svelte
└── app.html
```
