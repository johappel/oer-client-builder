# Nostr Feed Widget Builder - Roadmap

## Milestone 1: MVP (Minimum Viable Product)
**Ziel: Funktionsfähiges Widget mit grundlegender Builder-App**

### Woche 1-2: Core Widget + Tests
- [ ] Widget-Projektsetup
- [ ] WebSocket-Verbindung zu Relays
- [ ] Event-Fetching für Kind 0, 1, 30142
- [ ] Grid-Darstellung mit CSS
- [ ] Suche nach Titel/Summary
- [ ] Profile-Modal
- [x] Autoren: `npub` → hex (NIP-19) für Relay-Filter
- [ ] **Unit Tests**: Nostr Client, Event Parser (AMB)

### Woche 3-4: Builder App + Tests
- [x] SvelteKit Setup
- [x] Konfigurationsformular
- [x] Live-Vorschau
- [x] Snippet-Generator
- [x] Basic Styling
- [x] Formular-Persistenz (localStorage)
- [x] Apply/Auto-Vorschau (debounced)
- [ ] **Unit Tests**: Config Store, Validators
- [ ] **E2E Tests**: Basic Widget Rendering

### Deliverables
- [ ] Widget läuft in beliebiger HTML-Seite
- [ ] Builder-App deployed
- [ ] Dokumentation
- [ ] **Testabdeckung: 60%**

---

## Milestone 2: Enhanced Features
**Ziel: Vollständige Feature-Parität mit Anforderungen**

### Woche 5-6: Event Types + Tests
- [x] Calendar Parser (NIP-52): wichtige Felder aus `tags` + Parser pro Kind (31922/31923)
- [ ] Kind 31922 (Date-based Events)
- [ ] Kind 31923 (Time-based Events)
- [ ] Kind 30023 (Articles)
- [ ] Kategorie-Filter
- [ ] **Unit Tests**: Calendar Parser, Article Parser
- [ ] **Unit Tests**: Filter Engine

### Woche 7-8: UI/UX + Tests
- [ ] Detail-Ansicht für alle Event-Types
- [ ] Responsive Design
- [ ] Dark Mode
- [ ] Loading States
- [ ] Empty States
- [ ] **Unit Tests**: UI Components
- [ ] **E2E Tests**: Widget Filtering, Modal Interactions

### Deliverables
- [ ] Alle Event-Kinds unterstützt
- [ ] Mobile-optimiert
- [ ] Theming vollständig
- [ ] **Testabdeckung: 75%**

---

## Milestone 3: Polish & Performance
**Ziel: Produktionsreife Qualität**

### Woche 9-10: Performance + Vokabular
- [ ] Lazy Loading
- [ ] Virtual Scrolling
- [ ] Event Caching
- [ ] Debounced Search
- [ ] Code Splitting
- [ ] Vokabular-Integration im Builder
- [ ] **Unit Tests**: Vocabulary Loader, Code Generator

### Woche 11-12: Testing & QA
- [ ] **E2E Tests**: Vollständiger Builder Flow
- [ ] **E2E Tests**: Zwei-Ebenen-Filterung
- [ ] Cross-Browser Testing
- [ ] Accessibility Audit
- [ ] Performance Audit (Lighthouse)
- [ ] Bug Fixes aus Test-Phase

### Deliverables
- [ ] Testabdeckung > **80%**
- [ ] Lighthouse Score > 90
- [ ] WCAG AA konform
- [ ] Alle E2E Tests grün

---

## Milestone 4: Launch
**Ziel: Öffentliche Verfügbarkeit**

### Woche 13-14: Deployment
- [ ] CDN Setup
- [ ] Domain-Konfiguration
- [ ] SSL-Zertifikate
- [ ] Monitoring
- [ ] **Regression Tests** vor Deployment

### Woche 15: Marketing
- [ ] Demo-Seite
- [ ] Tutorial-Videos
- [ ] Blog-Posts
- [ ] Social Media

### Deliverables
- [ ] Öffentlicher Launch
- [ ] Dokumentation vollständig
- [ ] Support-Channel

---

## Test-Strategie im Detail

### Kontinuierliche Tests (Während Entwicklung)
- **Unit Tests** werden parallel zu jedem Feature geschrieben
- **Test-Driven Development (TDD)** für komplexe Logik (Parser, Filter)
- **Pre-commit Hooks**: Lint + Unit Tests müssen passen

### Milestone-Tests (Am Ende jedes Milestones)
- **Integration Tests**: Zusammenspiel der Komponenten
- **E2E Tests**: Kritische User Flows
- **Regression Tests**: Bestehende Features funktionieren noch

### Pre-Launch Tests (Woche 12-13)
- **Vollständige E2E Test-Suite**
- **Cross-Browser Testing** (Chrome, Firefox, Safari, Edge)
- **Accessibility Audit** (axe-core, Lighthouse)
- **Performance Audit** (Lighthouse, Web Vitals)
- **Security Audit** (XSS, CSP)

---

## Zukünftige Features (Post-Launch)

### Phase 2
- [ ] Favoriten-Speicherung (localStorage)
- [ ] Export zu verschiedenen Formaten (JSON, CSV)
- [ ] Erweiterte Filter (Datum, Autor, etc.)
- [ ] Mehrsprachige UI

### Phase 3
- [ ] Nutzer-Accounts
- [ ] Gespeicherte Konfigurationen
- [ ] Widget-Templates
- [ ] API für Entwickler

### Phase 4
- [ ] Nostr-Integration (eigene Posts)
- [ ] Zaps-Unterstützung
- [ ] Kommentar-Funktion
- [ ] Social Features

---

## Zeitplan Übersicht

| Milestone | Zeitraum | Tests | Status |
|-----------|----------|-------|--------|
| MVP | Woche 1-4 | Unit Tests für Core | 🔲 Geplant |
| Enhanced Features | Woche 5-8 | Unit + E2E Tests | 🔲 Geplant |
| Polish & Performance | Woche 9-12 | Vollständige Test-Suite | 🔲 Geplant |
| Launch | Woche 13-15 | Regression Tests | 🔲 Geplant |

---

## Test-Meilensteine

| Woche | Test-Ziel | Abdeckung |
|-------|-----------|-----------|
| 2 | Widget Core Unit Tests | 40% |
| 4 | Builder Unit Tests + Widget E2E | 60% |
| 6 | Parser + Filter Tests | 70% |
| 8 | UI Component Tests | 75% |
| 10 | Vocabulary + Generator Tests | 78% |
| 12 | **Vollständige E2E Tests** | **80%+** |
| 13 | Regression Tests | 80%+ |

---

## Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Relay-Instabilität | Hoch | Mittel | Mehrere Relays, Retry-Logik |
| CORS-Probleme | Mittel | Hoch | Proxy-Fallback, dokumentieren |
| Browser-Kompatibilität | Niedrig | Mittel | Polyfills, Feature Detection |
| Performance bei großen Feeds | Mittel | Hoch | Pagination, Virtual Scrolling |
| **Tests zu spät beginnen** | **Mittel** | **Hoch** | **TDD von Anfang an, kontinuierliche Tests** |

---

## Erfolgsmetriken

- [ ] Widget-Nutzung: > 1000 Einbettungen in 3 Monaten
- [ ] Builder-Nutzung: > 500 Widgets erstellt
- [ ] Performance: < 2s Ladezeit
- [ ] Accessibility: WCAG AA Score > 95
- [ ] Nutzerzufriedenheit: NPS > 50
- [ ] **Testabdeckung: > 80%**
- [ ] **E2E Tests: 100% grün**

---

## Dokumentation

- [Test Strategie](doc/TESTS.md) - Detaillierte Test-Pläne
- [Spezifikationen](doc/SPECS.md) - Anforderungen für Tests

---

*Letzte Aktualisierung: 2026-02-04*
*Version: 1.1.0*
