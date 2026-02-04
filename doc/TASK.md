# Nostr Feed Widget Builder - Aufgabenliste

## Phase 1: Setup und Grundstruktur

### 1.1 Projekt-Setup
- [ ] SvelteKit Projekt initialisieren mit `npx sv create`
- [ ] Tailwind CSS konfigurieren
- [ ] TypeScript konfigurieren
- [ ] Ordnerstruktur erstellen

### 1.2 Widget-Setup
- [ ] Widget-Projektstruktur erstellen
- [ ] TypeScript Konfiguration
- [ ] Build-System (Vite) einrichten

---

## Phase 2: Widget Entwicklung (Vanilla JS)

### 2.1 Core Architektur
- [ ] Hauptklasse `NostrFeed` erstellen
- [ ] WebSocket-Manager implementieren
- [ ] Event-Buffer und State Management
- [ ] Configuration-Handler

### 2.2 Nostr Integration
- [ ] WebSocket-Client für Relays
- [ ] Nostr Filter Builder
- [ ] Event Parser für alle Kinds:
  - [ ] Kind 0: Profile
  - [ ] Kind 1: Text Notes
  - [ ] Kind 30023: Articles
  - [ ] Kind 30142: OER Materials
  - [ ] Kind 31922: Date-based Events
  - [ ] Kind 31923: Time-based Events
- [ ] Profile-Caching System

### 2.3 UI Komponenten

#### Feed Grid
- [ ] Grid-Layout Komponente
- [ ] Responsive Design (Mobile, Tablet, Desktop)
- [ ] Loading States
- [ ] Empty State
- [ ] Pagination / Infinite Scroll

#### Event Cards
- [ ] OER Material Card
- [ ] Calendar Event Card
- [ ] Article Card
- [ ] Text Note Card
- [ ] Hover-Effects und Animationen

#### Search & Filter
- [ ] Suchleiste mit Autocomplete
- [ ] Kategorie-Tags Filter
- [ ] Kind-Filter
- [ ] Clear All Button
- [ ] Aktive Filter Anzeige

#### Modals
- [ ] Profile Modal
  - [ ] Avatar, Name, Bio
  - [ ] Social Links
  - [ ] Alle Beiträge des Authors
- [ ] Detail Modal
  - [ ] OER: Vollständige Material-Info
  - [ ] Calendar: Event-Details + RSVP
  - [ ] Article: Vollständiger Artikel
  - [ ] Text Note: Thread-Ansicht

### 2.4 Styling
- [ ] CSS Custom Properties (Theming)
- [ ] Light/Dark Mode
- [ ] Responsive Breakpoints
- [ ] Animationen und Transitions
- [ ] Print Styles

### 2.5 Utilities
- [ ] Date/Time Formatter
- [ ] Markdown Renderer (sanitized)
- [ ] URL Parser
- [ ] Image Lazy Loading
- [ ] Intersection Observer

---

## Phase 3: Builder App Entwicklung (Svelte 5)

### 3.1 Core Setup
- [ ] Routes erstellen
- [ ] Layouts definieren
- [ ] Stores initialisieren

### 3.2 Components

#### ConfigForm.svelte
- [ ] Relay-Eingabe (mit Validierung)
- [ ] Authors-Eingabe (npub Validierung)
- [ ] Kinds-Auswahl (Checkboxes)
- [ ] Tags-Eingabe (Key-Value Paare)
- [ ] Theme-Auswahl
- [ ] Items per Page Slider
- [ ] Custom CSS Input

#### LivePreview.svelte
- [ ] Eingebettetes Widget
- [ ] Device Preview Toggle (Mobile/Desktop)
- [ ] Refresh Button
- [ ] Loading State

#### CodeOutput.svelte
- [ ] Syntax Highlighting
- [ ] Copy Button
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
- [ ] Npub Validator
- [ ] Relay URL Validator
- [ ] Widget Config to URL Params
- [ ] Widget Config Serializer

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
