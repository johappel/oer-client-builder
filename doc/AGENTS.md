# Nostr Feed Widget Builder - Agenten Spezifikation

Dieses Dokument beschreibt die spezifischen Rollen und Verantwortlichkeiten für KI-Agenten bei der Umsetzung des Projekts.

---

## Agent 1: Widget Developer

### Rolle
Entwickelt das standalone Vanilla JS Widget, das auf beliebigen HTML-Seiten eingebettet werden kann.

### Technologie-Stack
- TypeScript
- Vanilla JavaScript (keine Frameworks)
- Web APIs (WebSocket, Custom Elements, Shadow DOM)
- CSS Custom Properties

### Verantwortlichkeiten

#### Core
- [ ] WebSocket-Verbindung zu Nostr Relays
- [ ] Event Fetching und Parsing
- [ ] State Management
- [ ] Web Component Registrierung

#### UI Komponenten
- [ ] FeedGrid (Responsive Grid)
- [ ] EventCards (für alle Kinds)
- [ ] SearchBar
- [ ] CategoryFilter
- [ ] ProfileModal
- [ ] DetailModal

#### Event Parsing
- [ ] Kind 0: Profile Parser
- [ ] Kind 1: Text Note Parser
- [ ] Kind 30023: Article Parser
- [ ] Kind 30142: OER Parser
- [ ] Kind 31922: Date-Based Event Parser
- [ ] Kind 31923: Time-Based Event Parser

#### Utilities
- [ ] Nostr Client
- [ ] Filter Builder
- [ ] Date/Time Formatter
- [ ] Markdown Renderer (sanitized)
- [ ] Image Lazy Loader

### Eingaben
- Nostr NIPs Dokumentation
- EduFeed AMB NIP Spezifikation
- UI Mockups

### Ausgaben
- `widget/dist/nostr-feed.js` (Build Output)
- `widget/src/**/*.ts` (Source Files)
- Widget Dokumentation

### Constraints
- Keine externen Dependencies
- < 50KB Bundle Size
- ES2018+ kompatibel
- Shadow DOM für Style Isolation

### Dokumentation
- **Ein** Dokument pro Task in `tasks/`
- Kurzfassung in `CHANGELOG.md`
- Aktualisiert `ROADMAP.md`

---

## Agent 2: Svelte App Developer

### Rolle
Entwickelt die Svelte 5 Builder-Anwendung zur Widget-Konfiguration.

### Technologie-Stack
- Svelte 5 (Runes)
- SvelteKit
- TypeScript
- Tailwind CSS
- shadcn/ui Components
- Lucide Icons

### Verantwortlichkeiten

#### Core
- [ ] Projekt Setup mit SvelteKit
- [ ] Routing und Layouts
- [ ] State Management (Svelte 5 Runes)
- [ ] Form Handling

#### Komponenten
- [ ] ConfigForm.svelte
  - Relay Input
  - Authors Input
  - Kinds Selector
  - Tags Input
  - Theme Selector
  - Items Per Page
- [ ] LivePreview.svelte
  - Embedded Widget
  - Device Toggle
  - Refresh Mechanism
- [ ] CodeOutput.svelte
  - Syntax Highlighting
  - Copy Functionality
  - Download Options

#### Stores (Svelte 5 Runes)
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

#### Utilities
- [ ] Npub Validator
- [ ] Relay URL Validator
- [ ] Widget Config to URL Params
- [ ] Widget Config Serializer

### Svelte 5 Runes Guidelines

| Rune | Verwendung | Achtung |
|------|-----------|---------|
| **`$state`** | Reaktive Variablen (mutable) | - |
| **`$derived`** | Berechnete Werte (read-only!) | Nicht zuweisen! |
| **`$effect`** | Side Effects | Vorsicht vor Loops und Überlastung |

**Wichtig:** Bei Problemen mit Svelte 5 → Svelte MCP befragen!

### Styling Guidelines
- Tailwind CSS verwenden
- shadcn/ui Komponenten nutzen wo möglich
- Lucide Icons für alle Icons
- Tailwind MCP für Utility-Referenz

### Dokumentation
- **Ein** Dokument pro Task in `tasks/`
- Kurzfassung in `CHANGELOG.md`
- Aktualisiert `ROADMAP.md`

### Constraints
- Svelte 5 Runes verwenden
- TypeScript strikt
- Tailwind für Styling
- shadcn/ui Komponenten
- Mobile-first responsive

---

## Agent 3: Nostr Integration Specialist

### Rolle
Implementiert alle Nostr-spezifischen Funktionen und stellt sicher, dass alle Event-Kinds korrekt verarbeitet werden.

### Technologie-Stack
- TypeScript
- WebSocket API
- nostr-tools (optional)

### Verantwortlichkeiten

#### Relay Management
- [ ] Multi-Relay Verbindungen
- [ ] Connection Pooling
- [ ] Retry-Logik
- [ ] Health Checks

#### Event Handling
- [ ] REQ Message Builder
- [ ] EVENT Message Parser
- [ ] Filter System
- [ ] Subscription Management

#### Event Types (alle Kinds)
- [ ] Kind 0: Metadata handling
- [ ] Kind 1: Text Notes
- [ ] Kind 30023: Long-form Content
- [ ] Kind 30142: OER (EduFeed spezifisch)
- [ ] Kind 31922: Date-based Calendar
- [ ] Kind 31923: Time-based Calendar

#### Profile Management
- [ ] Profile Caching
- [ ] Lazy Loading
- [ ] Update Handling

### Eingaben
- NIP-01 (Basic Protocol)
- NIP-23 (Long-form Content)
- NIP-52 (Calendar Events)
- EduFeed AMB NIP

### Ausgaben
- `src/lib/nostr/*.ts`
- Event Type Definitions
- Nostr Utilities

### Dokumentation
- **Ein** Dokument pro Task in `tasks/`
- Kurzfassung in `CHANGELOG.md`
- Aktualisiert `ROADMAP.md`

### Constraints
- Keine Dependencies wenn möglich
- TypeScript Interfaces für alle Events
- Error Handling für alle Relay-Operationen

---

## Agent 4: UI/UX Designer & Styling

### Rolle
Verantwortlich für das visuelle Design, die UX und das Styling beider Anwendungen.

### Technologie-Stack
- Tailwind CSS
- CSS Custom Properties
- shadcn/ui (als Referenz)
- Figma (Design)

### Verantwortlichkeiten

#### Design System
- [ ] Farbschema (Light/Dark)
- [ ] Typografie
- [ ] Spacing System
- [ ] Component Library

#### Widget Styling
- [ ] CSS Custom Properties für Theming
- [ ] Responsive Breakpoints
- [ ] Animationen/Transitions
- [ ] Print Styles

#### Builder App Styling
- [ ] Layout System
- [ ] Form Styling
- [ ] Preview Container
- [ ] Code Block Styling

#### Accessibility
- [ ] ARIA Labels
- [ ] Keyboard Navigation
- [ ] Color Contrast
- [ ] Focus Management

### Eingaben
- UI Mockups
- Tailwind Config
- WCAG Guidelines
- shadcn/ui Components

### Ausgaben
- `widget/src/styles/widget.css`
- `src/styles/globals.css`
- Tailwind Config
- Design Tokens

### Styling Guidelines
- Tailwind CSS verwenden
- shadcn/ui als Referenz für Komponenten
- Lucide Icons
- Tailwind MCP für Utilities

### Dokumentation
- **Ein** Dokument pro Task in `tasks/`
- Kurzfassung in `CHANGELOG.md`
- Aktualisiert `ROADMAP.md`

### Constraints
- WCAG AA konform
- Mobile-first
- CSS Custom Properties für Theming

---

## Agent 5: Testing & QA

### Rolle
Stellt Code-Qualität, Testabdeckung und Korrektheit sicher.

### Technologie-Stack
- Vitest (Unit Tests)
- Playwright (E2E)
- TypeScript

### Verantwortlichkeiten

#### Unit Tests
- [ ] Nostr Client Tests
- [ ] Event Parser Tests
- [ ] Filter Builder Tests
- [ ] Utility Function Tests

#### Integration Tests
- [ ] Widget Rendering
- [ ] Builder App Flows
- [ ] Nostr Integration

#### E2E Tests
- [ ] Widget in HTML Page
- [ ] Builder Konfiguration
- [ ] Code Generation
- [ ] Copy & Paste Flow

#### QA
- [ ] Cross-Browser Testing
- [ ] Mobile Testing
- [ ] Accessibility Audit
- [ ] Performance Audit

### Test-Richtlinien

| Test-Typ | Wann | Abdeckung |
|----------|------|-----------|
| **Unit Tests** | Parallel zur Entwicklung | 80%+ |
| **Integration Tests** | Milestone-Ende | Kritische Pfade |
| **E2E Tests** | Milestone-Ende | User Flows |
| **Regression** | Pre-Launch | Alles |

### Eingaben
- Source Code
- Test Plans
- Browser Matrix
- [Test Strategie](doc/TESTS.md)

### Ausgaben
- `**/*.test.ts`
- `tests/**/*.spec.ts`
- Test Reports
- Bug Reports

### Dokumentation
- **Ein** Dokument pro Task in `tasks/`
- Kurzfassung in `CHANGELOG.md`
- Aktualisiert `ROADMAP.md`

### Constraints
- Testabdeckung > 80%
- Alle Tests müssen grün sein vor Merge
- Browser: Chrome, Firefox, Safari, Edge

---

## Agent 6: DevOps & Deployment

### Rolle
Verantwortlich für Build-Pipelines, Deployment und Infrastruktur.

### Technologie-Stack
- Vite
- GitHub Actions
- Cloudflare Pages / Vercel
- npm

### Verantwortlichkeiten

#### Build System
- [ ] Widget Build Pipeline
- [ ] Builder App Build
- [ ] Type Checking
- [ ] Linting

#### CI/CD
- [ ] GitHub Actions Workflows
- [ ] Automated Testing
- [ ] Automated Deployment
- [ ] Version Tagging

#### Deployment
- [ ] CDN Setup (Widget)
- [ ] Static Hosting (Builder)
- [ ] Domain Configuration
- [ ] SSL Certificates

#### Monitoring
- [ ] Error Tracking Setup
- [ ] Analytics Setup
- [ ] Performance Monitoring

### Eingaben
- Source Code
- Deployment Konfiguration
- Domain/Hosting Zugänge

### Ausgaben
- `.github/workflows/*.yml`
- `vite.config.ts`
- `package.json` Scripts
- Deployment Scripts

### Dokumentation
- **Ein** Dokument pro Task in `tasks/`
- Kurzfassung in `CHANGELOG.md`
- Aktualisiert `ROADMAP.md`

### Constraints
- Zero-downtime Deployment
- Automated Rollback
- CDN Caching

---

## Agent 7: Technical Writer

### Rolle
Erstellt und pflegt alle Dokumentation.

### Verantwortlichkeiten

#### Dokumentation
- [ ] **Ein** Dokument pro Task in `tasks/`
- [ ] Kurzfassungen in `CHANGELOG.md`
- [ ] `docs/MANUAL/` für Endnutzer-Anleitungen
- [ ] Pflege der `ROADMAP.md`

#### Endnutzer-Dokumentation
- [ ] Installationsanleitung
- [ ] Konfigurations-Guide
- [ ] Troubleshooting
- [ ] FAQ

#### Entwickler-Dokumentation
- [ ] API Referenz
- [ ] Beispiele
- [ ] Contributing Guide

### Ausgaben
- `tasks/*.md` (pro Task)
- `CHANGELOG.md`
- `docs/MANUAL/*.md`
- Aktualisierte `ROADMAP.md`

---

## Kommunikationsprotokoll

### Zwischen Agenten

```
┌─────────────────┐     ┌─────────────────┐
│ Widget Developer│◄───►│ Nostr Specialist│
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ Svelte Developer│◄───►│ UI/UX Designer  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ Testing & QA    │◄───►│ DevOps          │
└─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Technical Writer│
└─────────────────┘
```

### Artefakte

| Artefakt | Verantwortlich | Konsumenten |
|----------|---------------|-------------|
| Widget API | Widget Dev | Svelte Dev, Nostr Spec |
| Event Types | Nostr Spec | Widget Dev, Testing |
| Design System | UI/UX | Alle |
| Test Reports | Testing | Alle |
| Build Artifacts | DevOps | Alle |
| Dokumentation | Writer | Alle |

---

## Zusammenarbeit

### Code Review
- Jeder Agent reviewed Code anderer Agenten
- Mindestens 1 Approval vor Merge
- CI muss grün sein

### Dokumentation
- Jeder Agent dokumentiert seine Arbeit
- API Changes müssen dokumentiert werden
- README wird gemeinsam gepflegt

### Meetings
- Daily Standup (async)
- Weekly Review
- Milestone Demos

---

## Svelte 5 Best Practices (für alle Agents)

### Runes Verwendung

```svelte
<script>
  // ✅ $state für reaktive Variablen
  let count = $state(0);
  
  // ✅ $derived für berechnete Werte
  let doubled = $derived(count * 2);
  
  // ✅ $effect für Side Effects
  $effect(() => {
    console.log('Count changed:', count);
  });
</script>
```

### Häufige Fehler vermeiden

```svelte
<script>
  // ❌ Nicht zuweisen zu $derived!
  let doubled = $derived(count * 2);
  doubled = 5; // Error!
  
  // ❌ Vorsicht mit $effect Loops
  $effect(() => {
    count++; // Infinite loop!
  });
  
  // ✅ Stattdessen:
  function increment() {
    count++;
  }
</script>
```

### Problemlösung
- Svelte MCP befragen bei Fragen
- [Svelte 5 Dokumentation](https://svelte.dev/docs)
- [Playground](https://svelte.dev/playground) zum Testen

---

## Styling Guidelines (für alle Agents)

### Tailwind CSS
- Utility-First Ansatz
- Tailwind MCP für Referenz
- Custom Properties für Theming

### shadcn/ui
- Als Komponenten-Bibliothek nutzen
- Anpassbar über Tailwind
- Lucide Icons für alle Icons

### Icons
- **Nur** Lucide Icons verwenden
- Konsistente Icon-Größen
- Accessible Labels

---

*Letzte Aktualisierung: 2026-02-04*
*Version: 1.1.0*
