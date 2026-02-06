# Nostr Feed Widget Builder - Aufgabenliste

**Stand:** 2026-02-05  
**Hinweis:** Detaillierte Umsetzungen pro Teilaufgabe stehen in `tasks/*.md`.

## Phase 1: Setup und Grundstruktur

### 1.1 Projekt-Setup
- [x] SvelteKit Projekt initialisieren mit `npx sv create`
- [x] Tailwind CSS konfigurieren
- [x] TypeScript konfigurieren
- [x] Ordnerstruktur erstellen

### 1.2 Widget-Setup
- [x] Widget-Projektstruktur erstellen
- [x] TypeScript Konfiguration
- [x] Build-System (Vite) einrichten

---

## Phase 2: Widget Entwicklung (Vanilla JS)

### 2.1 Core Architektur
- [x] Hauptklasse `NostrFeedWidget` erstellen
- [x] WebSocket-Manager implementieren (Multi-Relay Client)
- [x] Event-Buffer und State Management
- [x] Configuration-Handler (Attribute → Config)

### 2.2 Nostr Integration
- [x] WebSocket-Client für Relays
- [x] Nostr Filter Builder
- [x] Event Parser für alle Kinds:
  - [x] Kind 0: Profile
  - [x] Kind 1: Text Notes
  - [x] Kind 30023: Articles (Long-form)
  - [x] Kind 30142: OER Materials (AMB)
  - [x] Kind 31922: Date-based Events
  - [x] Kind 31923: Time-based Events
  - [x] Calendar (NIP-52): wichtige Felder aus `tags` extrahieren (`title`, `start`, `end`, `start_tzid/start_tz`, `end_tzid/end_tz`, `image`, `location`, `d`, `r`) und pro Kind eigenen Parser verwenden
  - [x] Kind-Spezifika: Pflichtfelder + Öffnen-Link (Browser-kompatibel via `https://njump.edufeed.org/...`), Kanban-Boards via `https://kanban.edufeed.org/cardsboard/...`
- [x] Profile-Caching System (Kind 0 lazy nachladen + Cache)

### 2.3 UI Komponenten

#### Feed Grid
- [x] Grid-Layout Komponente
- [x] Responsive Design (Mobile, Tablet, Desktop)
- [x] Loading States
- [x] Empty State
- [ ] Pagination / Infinite Scroll

#### Event Cards
- [x] OER Material Card (Kind 30142, eigener Renderer)
- [x] Calendar Event Card (Kind 31922/31923, eigener Renderer)
- [x] Article Card (Kind 30023)
- [x] Text Note Card (Kind 1)
- [x] Hover-Effects und Animationen (basic)

#### Search & Filter
- [ ] Suchleiste mit Autocomplete
- [x] Suchleiste (kommagetrennte Begriffe = ODER-Suche)
- [x] Kategorie-Tags Filter
- [ ] Kind-Filter
- [ ] Clear All Button
- [ ] Aktive Filter Anzeige

#### Views & Modals
- [x] Profile View (Ansichtswechsel, kein Modal)
  - [x] Header (Banner, Avatar, Name, Pubkey/NIP-05)
  - [x] Zurück zur Übersicht
  - [x] Filter: Alle / Termine / Materialien
- [x] Detail Modal (Detailansicht bleibt Modal)
  - [x] OER: Schlüsselmetadaten, Lizenz (nur im Modal), `d`-Link, `r`-Referenzen
  - [x] Calendar: Event-Details + Online/Location-Link
  - [x] Article/Text Note: Inhalte/Metadaten
  - [ ] RSVP / Thread-Ansicht (optional)

### 2.4 Styling
- [x] CSS Custom Properties (Theming)
- [x] Light/Dark/Auto Theme
- [x] Responsive Breakpoints
- [x] Animationen und Transitions (basic)
- [ ] Print Styles

### 2.5 Utilities
- [x] Date/Time Formatter
- [ ] Markdown Renderer (sanitized)
- [x] URL Parser (inkl. `nostr:` → Browser-Links)
- [ ] Image Lazy Loading
- [ ] Intersection Observer

---

## Phase 3: Builder App Entwicklung (Svelte 5)

### 3.1 Core Setup
- [x] Routes erstellen
- [x] Layouts definieren
- [x] Builder State (Svelte 5 Runes)

### 3.2 Components

#### ConfigForm.svelte
- [x] Relay-Eingabe (basic)
- [x] Authors-Eingabe (npub/hex)
- [x] Kinds-Eingabe (kommasepariert)
- [x] Tags-Eingabe (JSON Array)
- [x] Theme-Auswahl
- [ ] Relay/Inputs Validierung (optional)
- [ ] Kinds-Auswahl (Checkboxes)
- [ ] Items per Page Slider
- [ ] Custom CSS Input

#### LivePreview.svelte
- [x] Eingebettetes Widget
- [ ] Device Preview Toggle (Mobile/Desktop)
- [x] Refresh/Apply Button
- [x] Loading State (basic)

#### CodeOutput.svelte
- [ ] Syntax Highlighting
- [x] Copy Button
- [ ] Download als HTML
- [ ] Share Link

### 3.3 Stores (Svelte 5 Runes)

```typescript
// config.svelte.ts
export const config = $state<WidgetConfig>({
  relays: [],
  authors: [],
  kinds: [0, 1, 30023, 30142, 31922, 31923],
  tags: [],
  theme: 'auto',
  itemsPerPage: 12
});

// preview.svelte.ts
export const preview = $state<PreviewState>({
  widget: null,
  loading: false,
  error: null,
  device: 'desktop'
});
```

### 3.4 Utilities
- [x] Npub Validator / NIP-19 Converter (npub → hex)
- [ ] Relay URL Validator
- [ ] Widget Config to URL Params
- [ ] Widget Config Serializer
- [x] Konfiguration im localStorage speichern (Persistenz)
- [x] Apply/Auto-Vorschau (debounced)

---

## Phase 4: Integration & Testing

### 4.1 Widget Testing
- [ ] Unit Tests (Jest/Vitest)
  - [ ] Nostr Client
  - [ ] Event Parser
  - [ ] Filter Builder
- [ ] E2E Tests (Playwright)
  - [ ] Widget Rendering
  - [ ] User Interactions
  - [ ] Cross-Browser

### 4.2 Builder App Testing
- [ ] Component Tests
- [ ] Store Tests
- [ ] E2E Flows
  - [ ] Widget Configuration
  - [ ] Code Generation
  - [ ] Copy & Paste

### 4.3 Cross-Origin Testing
- [ ] CORS Konfiguration
- [ ] Multiple Relays
- [ ] CDN Deployment

---

## Phase 5: Deployment

### 5.1 Widget CDN
- [ ] Vite Build Pipeline
- [ ] Minification
- [ ] Source Maps
- [ ] Deploy zu CDN (Cloudflare/AWS S3)

### 5.2 Builder App
- [ ] Static Site Generation (adapter-static)
- [ ] GitHub Pages / Vercel / Netlify
- [ ] Custom Domain

### 5.3 Dokumentation
- [ ] README.md
- [ ] API Dokumentation
- [ ] Beispiele
- [ ] Changelog

---

## Phase 6: Post-Launch

### 6.1 Monitoring
- [ ] Error Tracking (Sentry)
- [ ] Analytics (Plausible)
- [ ] Performance Monitoring

### 6.2 Iteration
- [ ] User Feedback sammeln
- [ ] Bug Fixes
- [ ] Neue Features
- [ ] Performance Optimierungen

---

## Checklisten

### Definition of Done

- [ ] Feature implementiert
- [ ] Tests geschrieben
- [ ] Dokumentation aktualisiert
- [ ] Code Review durchgeführt
- [ ] Keine Konsole-Errors
- [ ] Mobile-optimiert
- [ ] Accessibility geprüft

### Pre-Release Checklist

- [ ] Alle Tests grün
- [ ] Build erfolgreich
- [ ] Lighthouse Score > 90
- [ ] Cross-Browser getestet
- [ ] Dokumentation vollständig
- [ ] Changelog aktualisiert
- [ ] Version getaggt

---

## Ressourcen

### Dokumentation
- [Svelte 5](https://svelte.dev/docs)
- [SvelteKit](https://kit.svelte.dev/docs)
- [Nostr NIPs](https://github.com/nostr-protocol/nips)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tools
- [Nostr Dev Kit](https://ndkit.com)
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools)
- [Zod](https://zod.dev) (Schema Validation)

### Design
- [Shadcn UI](https://ui.shadcn.com) (Referenz)
- [Radix UI](https://www.radix-ui.com) (Primitives)

---

## Anhänge

### A: Widget API Referenz

```typescript
interface NostrFeedWidget extends HTMLElement {
  // Properties
  authors: string[];
  kinds: number[];
  tags: string[][];
  relays: string[];
  theme: 'light' | 'dark' | 'auto';
  itemsPerPage: number;

  // Methods
  refresh(): Promise<void>;
  filter(search: string, tags: string[]): void;
  setTheme(theme: 'light' | 'dark'): void;

  // Events
  onEventClick: (event: NostrEvent) => void;
  onProfileClick: (profile: Profile) => void;
}
```

### B: Nostr Event Types (Types)

```typescript
type NostrEvent =
  | ProfileEvent
  | TextNoteEvent
  | ArticleEvent
  | OEREvent
  | CalendarEventDate
  | CalendarEventTime;

interface BaseEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}
```

---

*Letzte Aktualisierung: 2026-02-04*
*Version: 1.0.0*
