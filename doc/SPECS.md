# Nostr Feed Widget - Technische Spezifikationen

Dieses Dokument enthält detaillierte Spezifikationen für die Implementierung des Widgets und der Builder App.

---

## 1. Widget Spezifikationen

### 1.1 AMB Event Darstellung (Kind 30142)

#### Card Layout

```
┌─────────────────────────────────────┐
│  [Thumbnail/Image]                  │
│  ┌────────┐                         │
│  │ ▶️     │  [Lizenz-Icon]          │
│  └────────┘                         │
├─────────────────────────────────────┤
│  Titel (name)                       │
│  Kurzbeschreibung (description)     │
│  [max 2 Zeilen]                     │
│                                     │
│  [🏷️ Fach] [🏷️ Stufe] [🏷️ Typ]    │
│                                     │
│  [👤 Avatar] Autorname    [📅 Datum]│
└─────────────────────────────────────┘
```

#### Pflichtfelder (Required)

| Feld | Quelle | Fallback |
|------|--------|----------|
| `name` | `name` Tag | "Unbenannte Ressource" |
| `id` | `d` Tag | Event ID verwenden |
| `author` | `pubkey` | N/A |

#### Optionale Felder mit Fallbacks

| Feld | Quelle | Fallback | Anzeige |
|------|--------|----------|---------|
| `image` | `image` Tag | Platzhalter-Bild | Generisches Bild mit Icon |
| `description` | `description` Tag oder `content` | "Keine Beschreibung" | Leer lassen |
| `license` | `license:id` Tag | Keine Anzeige | Lizenz-Icon |
| `type` | `learningResourceType:id` | "Material" | Übersetzter Label |
| `subject` | `about:id` | Keine Anzeige | Erstes Fach |
| `level` | `educationalLevel:id` | Keine Anzeige | Übersetzter Label |
| `language` | `inLanguage` | Keine Anzeige | Sprach-Flag |

#### Icons nach Ressourcentyp

| Typ | Icon | Fallback |
|-----|------|----------|
| Video | ▶️ Video | `learningResourceType:id` enthält "video" |
| PDF | 📄 PDF | `encoding:encodingFormat` = "application/pdf" |
| Audio | 🎵 Audio | `learningResourceType:id` enthält "audio" |
| Bild | 🖼️ Bild | `encoding:encodingFormat` startet mit "image/" |
| Link | 🔗 Link | `r` Tag vorhanden |
| Kurs | 📚 Kurs | `learningResourceType:id` enthält "course" |
| Default | 📄 Dokument | Alles andere |

#### Lizenz-Visualisierung

| Lizenz | Icon | Farbe |
|--------|------|-------|
| CC BY | 🆓 CC BY | Grün |
| CC BY-SA | 🆓 CC BY-SA | Grün |
| CC BY-ND | ©️ CC BY-ND | Gelb |
| CC BY-NC | ©️ CC BY-NC | Gelb |
| CC0 | 🆓 CC0 | Grün |
| Keine Lizenz | 🔒 | Rot |
| `isAccessibleForFree=true` | 🆓 Kostenlos | Grün |

### 1.2 Detail-Ansicht (Modal)

```
┌─────────────────────────────────────────────────────────────┐
│  [X]                                                        │
│                                                             │
│  [Großes Bild/Video Player]                                 │
│                                                             │
│  Titel                                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  🏷️ Fächer: Religion, Evangelisch, Theologie               │
│  🎓 Stufen: Sek I, Sek II                                  │
│  📝 Typ: Video                                             │
│  🌐 Sprache: Deutsch                                       │
│  📅 Veröffentlicht: 15.01.2024                             │
│  ©️ Lizenz: CC BY 4.0                                      │
│                                                             │
│  Beschreibung                                               │
│  ─────────────────────────────────────────────────────────  │
│  [Vollständiger Text aus content/description]               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  Autoren:                                                   │
│  [Avatar] Prof. Dr. Maria Schmidt (Evangelisch)            │
│  [Avatar] Dr. Thomas Müller (Katholisch)                   │
│                                                             │
│  [🌐 Zum Material] [📥 Download]                           │
└─────────────────────────────────────────────────────────────┘
```

#### Detail-Ansicht Felder

| Sektion | Felder | Anzeige |
|---------|--------|---------|
| **Header** | Image/Video | Mit Play-Button für Videos |
| **Meta** | Fächer, Stufen, Typ, Sprache | Als Tags |
| **Beschreibung** | `content` oder `description` | Vollständiger Text |
| **Autoren** | `creator:*` oder `p` Tags | Mit Profilbild aus Kind 0 |
| **Publisher** | `publisher:name` | Als Link falls URL vorhanden |
| **Lizenz** | `license:id` | Icon + Name + Link |
| **Actions** | `encoding:contentUrl`, `r` Tags | "Zum Material", "Download" |

### 1.3 Responsive Verhalten

| Breakpoint | Grid-Spalten | Bildgröße |
|------------|--------------|-----------|
| Mobile (< 640px) | 1 | 16:9, full width |
| Tablet (640-1024px) | 2 | 16:9 |
| Desktop (> 1024px) | 3-4 | 16:9 |

### 1.4 Loading & Error States

#### Loading State
```
┌─────────────────────────────────────┐
│  ⏳ Lade Materialien...             │
│  [████████░░░░░░░░░░] 45%           │
└─────────────────────────────────────┘
```

#### Empty State
```
┌─────────────────────────────────────┐
│  🔍 Keine Ergebnisse gefunden       │
│                                     │
│  Versuchen Sie:                     │
│  • Andere Suchbegriffe              │
│  • Weniger Filter                   │
│  • Andere Zeitperiode               │
└─────────────────────────────────────┘
```

#### Error State
```
┌─────────────────────────────────────┐
│  ❌ Verbindung zum Relay fehlgeschlagen│
│                                     │
│  [🔄 Erneut versuchen]              │
└─────────────────────────────────────┘
```

---

## 2. Builder App Spezifikationen

### 2.1 Formular-Felder

#### Grundkonfiguration

| Feld | Typ | Validierung | Default |
|------|-----|-------------|---------|
| **Relay URLs** | Array von URLs | URL Format, ws:// oder wss:// | `["wss://relay.edufeed.org"]` |
| **Autoren (npubs)** | Array von Strings | npub Format validieren | `[]` |
| **Event Kinds** | Multi-Select | Checkboxen | `[30142]` |

#### AMB-Filter Konfiguration

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| **Vokabulare** | Dynamic List | URLs zu SKOS Vokabularen |
| **Ausgewählte Konzepte** | Multi-Select | Hierarchische Baumansicht |
| **Mapping** | Select | AMB-Tag Zuordnung |

#### Vokabular-Loader UI

```
┌─────────────────────────────────────────────────────────────┐
│  Vokabulare                                                 │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Vokabular-URL: [________________________] [+ Hinzufügen]  │
│                                                             │
│  Geladene Vokabulare:                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [x] Schulfächer (62 Konzepte)              [🗑️]   │   │
│  │   └─ [x] Religion (konfessionslos)                  │   │
│  │   └─ [x] Evangelisch                              │   │
│  │   └─ [ ] Mathematik                               │   │
│  │   └─ [ ] Physik                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Mapping: [about:id ▼]  ←  Fachgebiet                      │
│                                                             │
│  [+ Weiteres Vokabular hinzufügen]                         │
└─────────────────────────────────────────────────────────────┘
```

#### Erscheinungsbild

| Feld | Typ | Optionen | Default |
|------|-----|----------|---------|
| **Theme** | Select | light, dark, auto | auto |
| **Items pro Zeile** | Range Slider | 1-6 | 3 |
| **Items pro Seite** | Number | 6-48 | 12 |
| **Suchplaceholder** | Text | Freitext | "Materialien durchsuchen..." |
| **NIP-50 aktivieren** | Toggle | on/off | off |

### 2.2 Validierungsregeln

#### Relay URLs
- Muss mit `ws://` oder `wss://` beginnen
- Muss gültige Domain/IP enthalten
- Keine doppelten Einträge
- Max 10 Relays

#### Autoren (npubs)
- Muss mit `npub1` beginnen (bech32 Format)
- Optional: Validierung gegen tatsächliche Nostr-Keys
- Max 100 Autoren

#### Vokabulare
- Muss gültige JSON-URL sein
- Muss SKOS Format haben (`@context`, `hasTopConcept`)
- Mindestens ein Konzept muss ausgewählt sein

#### Tag-Mapping
- Jedes Vokabular muss einem AMB-Tag zugeordnet werden
- Erlaubte Tags: `#about:id`, `#educationalLevel:id`, `#audience:id`, `#learningResourceType:id`

### 2.3 UI Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Step 1    │───▶│   Step 2    │───▶│   Step 3    │───▶│   Step 4    │
│  Relays &   │    │  Vokabulare │    │  Erschein-  │    │  Code       │
│  Autoren    │    │  & Filter   │    │  ungsbild   │    │  Generieren │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

#### Step 1: Grundkonfiguration
1. Relay URLs eingeben
2. Autoren (npubs) eingeben
3. Event Kinds auswählen
4. → Weiter zu Vokabularen

#### Step 2: Vokabulare & Filter
1. Vokabular-URL eingeben
2. Vokabular laden und anzeigen
3. Gewünschte Konzepte auswählen
4. AMB-Tag Mapping festlegen
5. → Weiter zu Erscheinungsbild

#### Step 3: Erscheinungsbild
1. Theme auswählen
2. Grid-Einstellungen
3. Such-Optionen
4. → Live-Vorschau anzeigen

#### Step 4: Code Generieren
1. Vorschau bestätigen
2. Code generieren
3. Kopieren oder Download

### 2.4 State Management

```typescript
// config.svelte.ts
interface BuilderConfig {
  // Step 1
  relays: string[];
  authors: string[];
  kinds: number[];
  
  // Step 2
  vocabularies: Array<{
    url: string;
    name: string;
    concepts: Array<{
      id: string;
      prefLabel: Record<string, string>;
      selected: boolean;
    }>;
    mapping: 'about:id' | 'educationalLevel:id' | 'audience:id' | 'learningResourceType:id';
  }>;
  
  // Step 3
  theme: 'light' | 'dark' | 'auto';
  itemsPerRow: number;
  itemsPerPage: number;
  searchPlaceholder: string;
  enableNip50: boolean;
}
```

### 2.5 Live-Vorschau

- Echtzeit-Updates bei Konfigurationsänderungen
- Eingebettetes Widget mit Test-Daten
- Device-Preview (Mobile/Desktop)
- Error-Anzeige bei ungültiger Konfiguration

---

## 3. API Schnittstellen

### 3.1 Widget JavaScript API

```typescript
interface NostrFeedWidget extends HTMLElement {
  // Properties
  authors: string[];
  kinds: number[];
  tags: string[][];
  relays: string[];
  theme: 'light' | 'dark' | 'auto';
  itemsPerPage: number;
  enableNip50Search: boolean;
  fallbackSearch: boolean;
  
  // Methods
  refresh(): Promise<void>;
  search(query: string): void;
  filterByTag(tag: string, value: string): void;
  clearUserFilters(): void;
  
  // Events
  onEventClick: (event: NostrEvent) => void;
  onProfileClick: (profile: Profile) => void;
  onError: (error: Error) => void;
}
```

### 3.2 Builder API

```typescript
// POST /api/preview
interface PreviewRequest {
  config: BuilderConfig;
}

interface PreviewResponse {
  html: string;
  css: string;
  js: string;
  warnings?: string[];
}

// POST /api/validate-npub
interface ValidateNpubRequest {
  npub: string;
}

interface ValidateNpubResponse {
  valid: boolean;
  pubkey?: string;
  profile?: Profile;
}

// POST /api/load-vocabulary
interface LoadVocabularyRequest {
  url: string;
}

interface LoadVocabularyResponse {
  name: string;
  concepts: Concept[];
  error?: string;
}
```

---

## 4. Performance Anforderungen

### 4.1 Widget

| Metrik | Zielwert |
|--------|----------|
| Initial Load | < 2s |
| Time to First Event | < 500ms |
| Search Response | < 100ms (Client-seitig) |
| Bundle Size | < 50KB (gzipped) |
| Memory Usage | < 50MB |

### 4.2 Builder App

| Metrik | Zielwert |
|--------|----------|
| Page Load | < 1s |
| Vokabular Laden | < 3s |
| Preview Update | < 500ms |
| Code Generation | < 100ms |

---

## 5. Accessibility (A11y)

### 5.1 Widget

- Keyboard Navigation (Tab, Enter, Escape)
- ARIA Labels für alle interaktiven Elemente
- Color Contrast WCAG AA (4.5:1 für Text)
- Screen Reader Support
- Reduced Motion Support

### 5.2 Builder App

- Form Labels mit `for` Attributen
- Error Messages mit `aria-describedby`
- Focus Management zwischen Steps
- Skip Links für Navigation

---

## 6. Browser Support

| Browser | Min Version |
|---------|-------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

**Required APIs:**
- WebSocket
- Custom Elements (Web Components)
- Shadow DOM
- ES2018+

---

*Letzte Aktualisierung: 2026-02-04*
*Version: 1.0.0*
