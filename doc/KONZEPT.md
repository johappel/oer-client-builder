# Nostr Feed Widget Builder - Konzept

## Zusammenfassung

Eine Svelte 5 Anwendung zum Konfigurieren und Generieren von embeddable HTML/JS Widgets, die Nostr Events als Bildungskatalog in einem Grid darstellen.

**Unterstützte Event-Kinds:**
- Kind 30142: AMB (Allgemeines Metadatenprofil für Bildungsressourcen)
- Kind 31922/31923: Calendar Events (NIP-52)
- Kind 30023: Long-form Content (Articles, NIP-23)
- Kind 1: Short Text Notes (NIP-10)
- Kind 0: Profile Metadata

---

## AMB NIP Spezifikation (Kind 30142)

### Überblick

AMB (Allgemeines Metadatenprofil für Bildungsressourcen) ist ein standardisiertes Metadatenprofil für Bildungsressourcen. Das AMB-NIP definiert, wie diese Metadaten als Nostr Events (Kind 30142) gespeichert werden.

**Wichtige Eigenschaften:**
- Addressable Event (kann über `kind:pubkey:d-tag` adressiert werden)
- JSON-Flattening mit `:` als Delimiter für verschachtelte Strukturen
- Nostr-native Tags (`t`, `p`, `a`, `r`) für bessere Interoperabilität

### Tag-Struktur

#### Kern-Metadaten
| Tag | Beschreibung | Beispiel |
|-----|-------------|----------|
| `d` | Eindeutige ID der Ressource | `["d", "oersi.org/resources/abc123"]` |
| `type` | Typ der Ressource | `["type", "LearningResource"]` |
| `name` | Titel | `["name", "Pythagorean Theorem Video"]` |
| `description` | Beschreibung | `["description", "An introductory video..."]` |
| `content` | Duplikat der Beschreibung (für Clients) | `"An introductory video..."` |

#### Fachliche Einordnung (Educational)
| Tag | Beschreibung | Beispiel |
|-----|-------------|----------|
| `about:id` | Fachgebiet URI | `["about:id", "http://w3id.org/kim/schulfaecher/s1017"]` |
| `about:prefLabel:de` | Fachbezeichnung | `["about:prefLabel:de", "Mathematik"]` |
| `learningResourceType:id` | Ressourcentyp URI | `["learningResourceType:id", "http://w3id.org/openeduhub/vocabs/new_lrt/video"]` |
| `educationalLevel:id` | Bildungsstufe URI | `["educationalLevel:id", "https://w3id.org/kim/educationalLevel/level_06"]` |
| `audience:id` | Zielgruppe URI | `["audience:id", "http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student"]` |
| `teaches:id` | Lehrplanbezug URI | `["teaches:id", "..."]` |
| `assesses:id` | Kompetenzüberprüfung URI | `["assesses:id", "..."]` |

#### Urheberschaft (Provenance)
| Tag | Beschreibung | Beispiel |
|-----|-------------|----------|
| `p` | Nostr-native Creator (pubkey) | `["p", "<pubkey>", "wss://relay.example.com", "creator"]` |
| `creator:name` | Name (extern) | `["creator:name", "Prof. John Doe"]` |
| `creator:id` | ORCID/GND (extern) | `["creator:id", "https://orcid.org/0000-0000..."]` |
| `creator:type` | Typ | `["creator:type", "Person"]` |
| `creator:affiliation:name` | Institution | `["creator:affiliation:name", "MIT"]` |
| `contributor:*` | Mitwirkende (gleiche Struktur) | `["contributor:name", "..."]` |
| `publisher:name` | Herausgeber | `["publisher:name", "e-teaching.org"]` |
| `dateCreated` | Erstellungsdatum | `["dateCreated", "2024-01-15"]` |
| `datePublished` | Veröffentlichungsdatum | `["datePublished", "2024-02-01"]` |
| `dateModified` | Änderungsdatum | `["dateModified", "2024-03-01"]` |

#### Lizenz & Zugang
| Tag | Beschreibung | Beispiel |
|-----|-------------|----------|
| `license:id` | Lizenz URI | `["license:id", "https://creativecommons.org/licenses/by/4.0/"]` |
| `isAccessibleForFree` | Kostenlos | `["isAccessibleForFree", "true"]` |
| `conditionsOfAccess:id` | Zugangsbedingungen | `["conditionsOfAccess:id", "..."]` |

#### Technische Metadaten
| Tag | Beschreibung | Beispiel |
|-----|-------------|----------|
| `image` | Bild-URL | `["image", "https://example.com/thumb.jpg"]` |
| `inLanguage` | Sprache | `["inLanguage", "de"]` |
| `duration` | Dauer (ISO8601) | `["duration", "PT45M"]` |
| `encoding:contentUrl` | Datei-URL | `["encoding:contentUrl", "https://example.com/video.mp4"]` |
| `encoding:encodingFormat` | MIME-Type | `["encoding:encodingFormat", "video/mp4"]` |

#### Relationen
| Tag | Beschreibung | Beispiel |
|-----|-------------|----------|
| `a` | Nostr-native Referenz | `["a", "30142:<pubkey>:<d>", "wss://relay", "isPartOf"]` |
| `isBasedOn:id` | Externe Referenz | `["isBasedOn:id", "https://doi.org/..."]` |
| `isPartOf:id` | Teil von | `["isPartOf:id", "..."]` |
| `hasPart:id` | Enthält | `["hasPart:id", "..."]` |

#### Externe Referenzen
| Tag | Beschreibung | Beispiel |
|-----|-------------|----------|
| `r` | Externe URL | `["r", "https://oersi.org/resources/xyz"]` |
| `t` | Keywords/Tags | `["t", "Mathematik"]` |

### Filter-Optionen

#### Standard Nostr Filter (NIP-01)
```json
{"kinds": [30142]}
{"kinds": [30142], "authors": ["<pubkey>"]}
{"kinds": [30142], "#d": ["<resource-id>"]}
{"kinds": [30142], "since": 1700000000, "until": 1800000000}
```

#### AMB-spezifische Tag-Filter
```json
// Nach Keyword
{"kinds": [30142], "#t": ["Mathematik"]}

// Nach Fachgebiet
{"kinds": [30142], "#about:id": ["http://w3id.org/kim/schulfaecher/s1017"]}

// Nach Ressourcentyp
{"kinds": [30142], "#learningResourceType:id": ["http://w3id.org/openeduhub/vocabs/new_lrt/video"]}

// Nach Bildungsstufe
{"kinds": [30142], "#educationalLevel:id": ["https://w3id.org/kim/educationalLevel/level_06"]}

// Nach Zielgruppe
{"kinds": [30142], "#audience:id": ["http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student"]}

// Nach Sprache
{"kinds": [30142], "#inLanguage": ["de"]}

// Nach Lizenz
{"kinds": [30142], "#license:id": ["https://creativecommons.org/licenses/by/4.0/"]}

// Nach Creator (Nostr pubkey)
{"kinds": [30142], "#p": ["<pubkey>"]}

// Nach externer Referenz
{"kinds": [30142], "#r": ["https://doi.org/10.1234/example"]}
```

#### NIP-50 Full-Text Search (Optional)

> **Hinweis:** Die Volltextsuche (NIP-50) wird von vielen Relays noch nicht vollständig unterstützt. Das Widget sollte daher:
> 1. Die Volltextsuche als **optionales Feature** im Builder konfigurierbar machen
> 2. Automatisch auf **Client-seitige Suche** fallbacken, wenn das Relay keine NIP-50 Unterstützung bietet
> 3. Dem Nutzer transparent anzeigen, welche Suchmethode verwendet wird

```json
// Freitext-Suche (wenn Relay NIP-50 unterstützt)
{"kinds": [30142], "search": "pythagorean theorem"}

// Nach Publisher
{"kinds": [30142], "search": "publisher.name:e-teaching.org"}

// Nach Fach (deutsch)
{"kinds": [30142], "search": "about.prefLabel.de:Mathematik"}

// Kombiniert
{"kinds": [30142], "search": "forschung publisher.name:e-teaching.org"}
```

**Fallback-Strategie für Client-seitige Suche:**
Wenn ein Relay NIP-50 nicht unterstützt, sollte das Widget:
1. Alle Events laden (mit Pagination)
2. Client-seitige Suche über `name`, `description`, `keywords` durchführen
3. Den Nutzer über die eingeschränkte Suche informieren

**Widget Konfiguration:**
> Status: Noch nicht implementiert (Stand 2026-02-05). Aktuell läuft die Suche client-seitig über das Attribut `search`.

### Referenz-Implementierungen

- **amb-relay**: https://git.edufeed.org/edufeed/amb-relay
- **typesense30142**: https://git.edufeed.org/edufeed/nostrlib/src/branch/master/eventstore/typesense30142

### Vokabular-Integration

Das Widget kann mit kontrollierten Vokabularen (z.B. Schulfächer) arbeiten, um konsistente Filter zu ermöglichen.

**Beispiel: Institut für Religionspädagogik**

Ein Institut möchte nur Inhalte zu religiösen Themen anzeigen. Konfiguration:

```html
<nostr-feed
  authors="npub1...,npub2..."  <!-- Nur bestimmte Publisher -->
  kinds="30142,31922,31923,30023,1,0"
  tags='[
    ["#about:id","http://w3id.org/kim/schulfaecher/s1055"],
    ["#about:id","http://w3id.org/kim/schulfaecher/s1024"],
    ["#about:id","http://w3id.org/kim/schulfaecher/s1025"],
    ["#about:id","http://w3id.org/kim/schulfaecher/s1057"],
    ["#about:id","http://w3id.org/kim/schulfaecher/s1026"],
    ["#about:id","http://w3id.org/kim/schulfaecher/s1056"],
    ["#about:id","http://w3id.org/kim/schulfaecher/s1021"]
  ]'
></nostr-feed>
```

> Hinweis: `tags` werden aktuell client-seitig gefiltert; nur `#t` wird zusätzlich als Relay-Filter (`#t`) in der REQ-Subscription genutzt.

**Verwendete Fach-URIs (aus Schulfächer-Vokabular):**

| Fach | URI | Label |
|------|-----|-------|
| Religion (konfessionslos) | `http://w3id.org/kim/schulfaecher/s1055` | Religion |
| Evangelisch | `http://w3id.org/kim/schulfaecher/s1024` | Religionslehre (evangelisch) |
| Islamisch | `http://w3id.org/kim/schulfaecher/s1025` | Religionslehre (islamisch) |
| Jüdisch | `http://w3id.org/kim/schulfaecher/s1057` | Religionslehre (jüdisch) |
| Katholisch | `http://w3id.org/kim/schulfaecher/s1026` | Religionslehre (katholisch) |
| Alevitisch | `http://w3id.org/kim/schulfaecher/s1056` | Religionslehre (alevitisch) |
| Philosophie | `http://w3id.org/kim/schulfaecher/s1021` | Philosophie (für Theologie) |

**Builder-App Feature: Flexible Vokabular-Integration**

Der Builder unterstützt beliebige SKOS-Vokabulare über URL-Eingabe:

1. **Vokabular-URL eingeben** (z.B. `https://skohub.io/.../schulfaecher/index.json`)
2. **Automatisches Laden** und Parsen der Konzepte
3. **Hierarchische Anzeige** (Top Concepts + Narrower)
4. **Multi-Select** für gewünschte Konzepte
5. **Mapping zu AMB-Tags**:
   - `about:id` für Schulfächer
   - `educationalLevel:id` für Bildungsstufen
   - `audience:id` für Zielgruppen
   - `learningResourceType:id` für Ressourcentypen

**Unterstützte Standard-Vokabulare:**

| Vokabular | URL | AMB-Tag |
|-----------|-----|---------|
| Schulfächer | `https://w3id.org/kim/schulfaecher/` | `#about:id` |
| Bildungsstufen | `https://w3id.org/kim/educationalLevel/` | `#educationalLevel:id` |
| Sektoren | `https://w3id.org/class/sectors` | `#audience:id` oder custom |
| HCRT (Ressourcentypen) | `https://w3id.org/kim/hcrt/` | `#learningResourceType:id` |

**Benutzerdefinierte Vokabulare:**
Nutzer können eigene SKOS-Vokabulare einbinden:
```
Vokabular-URL: [________________] [+ Hinzufügen]
Geladene Vokabulare:
- [x] Schulfächer (62 Konzepte)
- [x] Bildungsstufen (10 Konzepte)
[ Entfernen ]
```

---

## Features

### Builder Anwendung (Svelte 5)

| Feature | Beschreibung |
|---------|-------------|
| **Konfiguration** | Formular zur Widget-Konfiguration |
| **Live Vorschau** | Echtzeit-Vorschau des Widgets |
| **Snippet Generator** | Kopierbarer HTML/JS Code |

### Widget Konfigurationsoptionen

| Option | Typ | Beschreibung |
|--------|-----|-------------|
| `authors` | string | Komma-separierte `npub`/hex (Vorfilter) |
| `kinds` | string | Komma-separierte Kind-Nummern (z.B. `30142,31922,31923,1,30023,0`) |
| `tags` | string | JSON Array für Vorfilter (Widget-Attribut `tags`) |
| `relays` | string | Komma-separierte Relay URLs |
| `search` | string | Initialer Suchbegriff (Client-seitig) |
| `categories` | string | JSON Array der ausgewählten Kategorien (optional) |
| `maxItems` | string | Maximale Anzahl Events (Relay-Limit) |
| `showSearch` | string | `true/false` – Suchleiste anzeigen |
| `showCategories` | string | `true/false` – Kategorien anzeigen |
| `showAuthor` | string | `true/false` – Autor/Avatar im Footer anzeigen |
| `theme` | string | `light`, `dark`, `auto` |
| `language` | string | UI-Sprache (z.B. `de`) |

### Widget Komponenten

| Komponente | Beschreibung |
|------------|-------------|
| **Feed Grid** | Responsive Grid mit Event Cards |
| **Suchleiste** | Text-basierte Filtersuche (kommagetrennte Begriffe = ODER-Suche) |
| **Kategorie-Chips** | Anklickbare `t`-Tags als Filter |
| **Profil-Ansicht** | Ansichtswechsel (kein Modal) mit „Zurück zur Übersicht“ + Inhaltsliste |
| **Detail-Modal** | Event-Details (OER/Calendar/Artikel/Note) |

---

## Zwei-Ebenen-Filterung (Institut vs. Endnutzer)

Das Widget unterstützt eine hierarchische Filterung:

### Ebene 1: Institut-Konfiguration (Vorfilter)
Durch das Institut voreingestellt, **nicht änderbar** durch Endnutzer:
```html
<nostr-feed
  authors="npub1...,npub2..."           <!-- Nur diese Autoren -->
  kinds="30142"                          <!-- Nur AMB Events -->
  tags='[["#about:id","http://w3id.org/kim/schulfaecher/s1024"]]'  <!-- Nur Evangelisch -->
></nostr-feed>
```

### Ebene 2: Endnutzer-Filter (Zusatzfilter)
Der Endnutzer kann **zusätzlich** einschränken:

1. **Suchbegriff** (Client-seitige Suche über Name, Description, Keywords)
2. **Zusätzliche Vokabular-Filter** (nur aus den vom Institut geladenen Vokabularen)
3. **Event-Typ Filter** (Material, Video, PDF, etc.)

### Filter-Logik
```
Ergebnis = Events 
  WHERE (authors IN [npub1, npub2])      // Institut-Vorfilter
  AND   (about:id = Evangelisch)         // Institut-Vorfilter
  AND   (Endnutzer-Suchbegriff IN [name, description, keywords])  // Optional
  AND   (educationalLevel IN [Sek I, Sek II])  // Optional (Nutzer)
```

### UI-Umsetzung
- **Vorfilter**: Angezeigt als "Aktive Filter", nicht entfernbar
- **Zusatzfilter**: Auswählbar durch den Nutzer aus dem verfügbaren Vokabular
- **Suche**: Client-seitig über die bereits gefilterten Events

---

## Datenstrukturen

### Event Types

#### Kind 30142: AMB Event
```typescript
interface AMBEvent {
  id: string;
  pubkey: string;
  d: string; // Resource ID
  type: string[];
  name: string;
  description: string;
  content: string;
  
  // Educational
  about: Array<{
    id: string;
    prefLabel: Record<string, string>;
  }>;
  learningResourceType: Array<{
    id: string;
    prefLabel: Record<string, string>;
  }>;
  educationalLevel: Array<{
    id: string;
    prefLabel: Record<string, string>;
  }>;
  audience: Array<{
    id: string;
    prefLabel: Record<string, string>;
  }>;
  teaches: Array<{ id: string }>;
  
  // Provenance
  creators: Array<{
    pubkey?: string; // Nostr-native
    name?: string;
    id?: string; // ORCID/GND
    affiliation?: { name: string };
  }>;
  datePublished?: string;
  publisher?: Array<{ name: string }>;
  
  // Rights
  license?: { id: string };
  isAccessibleForFree?: boolean;
  
  // Technical
  image?: string;
  inLanguage: string[];
  duration?: string;
  encoding?: Array<{
    contentUrl: string;
    encodingFormat?: string;
  }>;
  
  // Relations
  isPartOf?: string[];
  hasPart?: string[];
  isBasedOn?: string[];
  
  // Tags
  keywords: string[];
  externalRefs: string[]; // r tags
}
```

#### Kind 31922/31923: Calendar Events (NIP-52)
```typescript
interface CalendarEvent {
  id: string;
  pubkey: string;
  d: string;
  title: string; // Required
  content: string; // Required (Beschreibung, kann leer sein)
  summary?: string;
  image?: string;
  location?: string;
  g?: string; // geohash
  start: string | number; // ISO date (31922) oder Unix timestamp (31923)
  end?: string | number;
  start_tzid?: string; // Nur für 31923
  end_tzid?: string; // Nur für 31923
  participants?: Array<{
    pubkey: string;
    role?: string;
  }>;
  tags: string[];
  // name?: string; // DEPRECATED - use title instead
}
```

#### Kind 30023: Article (NIP-23)
```typescript
interface Article {
  id: string;
  pubkey: string;
  d: string;
  title: string;
  summary: string;
  image?: string;
  content: string; // Markdown
  published_at: number;
  tags: string[];
}
```

#### Kind 1: Text Note
```typescript
interface TextNote {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
  tags: string[][];
}
```

#### Kind 0: Profile
```typescript
interface Profile {
  pubkey: string;
  name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
}
```

---

## UI Spezifikation

### Builder App Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Nostr Feed Builder                              [Logo]         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────┐  ┌──────────────────────────┐ │
│  │  Konfiguration              │  │  Live Vorschau           │ │
│  │  ─────────────────────────  │  │  ───────────────────────  │ │
│  │                             │  │                          │ │
│  │  Relays: [______] [+✓]      │  │  ┌──────┐ ┌──────┐      │ │
│  │  Authors: [______] [+✓]     │  │  │Card  │ │Card  │      │ │
│  │  Kinds: [☑] 0 [☑] 1 ...    │  │  └──────┘ └──────┘      │ │
│  │                             │  │                          │ │
│  │  --- AMB Filter ---         │  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ │
│  │  Fach: [Mathe ▼]            │  │                          │ │
│  │  Stufe: [Level 6 ▼]         │  │  [Grid/List ▼] [Filter ▼]│ │
│  │  Typ: [Video ▼]             │  │                          │ │
│  │  Sprache: [DE ▼]            │  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ │
│  │                             │  │                          │ │
│  │  Theme: [Light ▼]           │  │                          │ │
│  │  Items/Row: [3 ▼]           │  │                          │ │
│  │                             │  │                          │ │
│  │  [📋 Code generieren]       │  │                          │ │
│  └─────────────────────────────┘  └──────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Generated Code                                             ││
│  │  ─────────────────────────────────────────────────────────  ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │ <script src="https://cdn.example.com/nostr-feed.js">│   ││
│  │  │ </script>                                           │   ││
│  │  │ <nostr-feed                                         │   ││
│  │  │   authors="npub1..."                                │   ││
│  │  │   kinds="1,30142,31922,30023"                       │   ││
│  │  │   tags='[["#about:id","http://w3id.org/..."]]'      │   ││
│  │  │   relays="wss://relay.edufeed.org"                  │   ││
│  │  │ ></nostr-feed>                                      │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  │                                                             ││
│  │  [📋 Kopieren]  [🔄 Reset]  [💾 Speichern]                  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Widget Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Aktive Filter: [Religion ✗] [Evangelisch ✗] [npub1... ✗]       │
│  (Vom Institut voreingestellt - können nicht entfernt werden)   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🔍 Suchen...                    [Filter ▼]  [Grid/List ▼] │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Zusätzlich filtern (vom Nutzer wählbar):                       │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │Sek I│ │Sek II│ │Bachelor│ │Master│ │Video│ │PDF  │ │...  │  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │
│                                                                 │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│  │                  │ │                  │ │                  │ │
│  │      [Bild]      │ │      [Bild]      │ │      [Bild]      │ │
│  │                  │ │                  │ │                  │ │
│  ├──────────────────┤ ├──────────────────┤ ├──────────────────┤ │
│  │ Titel            │ │ Titel            │ │ Titel            │ │
│  │ Beschreibung...  │ │ Beschreibung...  │ │ Beschreibung...  │ │
│  │ [Avatar] Autor   │ │ [Avatar] Autor   │ │ [Avatar] Autor   │ │
│  │ 📹 Video | 🆓 CC │ │ 📄 PDF | 🆓 CC   │ │ 🗓️ Event | 🔒   │ │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│                                                                 │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│  │ [Load More...]   │ │                  │ │                  │ │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technische Architektur

### Builder App (SvelteKit)

```
src/
├── app.html                 # HTML Template
├── app.d.ts                 # TypeScript Deklarationen
├── routes/                  # SvelteKit Routes
│   ├── +page.svelte       # Hauptseite (Builder)
│   └── api/
│       └── preview/+server.ts  # Preview API
├── lib/
│   ├── components/        # Wiederverwendbare Komponenten
│   │   ├── ConfigForm.svelte
│   │   ├── LivePreview.svelte
│   │   ├── CodeOutput.svelte
│   │   ├── TagInput.svelte
│   │   └── AMBFilterSection.svelte  # AMB-spezifische Filter
│   ├── stores/            # Svelte Stores
│   │   └── config.svelte.ts
│   └── utils/             # Hilfsfunktionen
│       ├── nostr.ts
│       ├── widget.ts
│       └── amb.ts         # AMB-spezifische Utilities
└── styles/
    └── globals.css
```

### Widget (Vanilla JS)

```
widget/
├── src/
│   ├── index.ts           # Entry Point
│   ├── NostrFeed.ts       # Hauptklasse
│   ├── components/
│   │   ├── FeedGrid.ts
│   │   ├── SearchBar.ts
│   │   ├── CategoryFilter.ts
│   │   ├── ProfileModal.ts
│   │   └── DetailModal.ts
│   ├── parsers/
│   │   ├── amb.ts         # Kind 30142 Parser
│   │   ├── calendar.ts    # Kind 31922/31923 Parser
│   │   ├── article.ts     # Kind 30023 Parser
│   │   ├── note.ts        # Kind 1 Parser
│   │   └── profile.ts     # Kind 0 Parser
│   ├── utils/
│   │   ├── nostr.ts       # Nostr Client
│   │   ├── filter.ts      # Filter-Logik
│   │   └── dom.ts         # DOM Helpers
│   └── styles/
│       └── widget.css     # Widget Styles
├── dist/
│   └── nostr-feed.js      # Build Output
└── package.json
```

---

## Schnittstellen

### Widget API

```html
<script src="https://cdn.example.com/nostr-feed.js"></script>
<nostr-feed
  relays="wss://relay.edufeed.org,wss://relay-rpi.edufeed.org,wss://amb-relay.edufeed.org"
  kinds="30142,31922,31923,1,30023,0"
  authors="npub1...,npub2..."
  tags='[["#t","education"],["#about:id","http://w3id.org/..."]]'
  search="religion, foerbico"
  maxItems="50"
  showSearch="true"
  showCategories="true"
  showAuthor="true"
  theme="auto"
  language="de"
></nostr-feed>
```

### Props

| Prop | Typ | Default | Beschreibung |
|------|-----|---------|--------------|
| `authors` | string | '' | Komma-separierte `npub`/hex |
| `kinds` | string | '30142,31922,31923,1,30023,0' | Komma-separierte Kind-Nummern |
| `tags` | string | '[]' | JSON-Array von Tag-Filtern |
| `relays` | string | '' | Komma-separierte Relay-URLs |
| `search` | string | '' | Suchbegriff (kommagetrennt = ODER-Suche) |
| `categories` | string | '[]' | JSON Array der Kategorien (optional) |
| `maxItems` | string | '50' | Maximale Anzahl Events |
| `showSearch` | string | 'true' | Suchleiste anzeigen |
| `showCategories` | string | 'true' | Kategorien anzeigen |
| `showAuthor` | string | 'true' | Autor/Avatar anzeigen |
| `theme` | string | 'auto' | `light`, `dark`, `auto` |
| `language` | string | 'de' | UI-Sprache |

---

## Implementierungsphasen

### Phase 1: Core Widget
- WebSocket-Verbindung zu Relays
- Event-Fetching für alle Kinds
- Grid-Darstellung
- Suche und Filter

### Phase 2: AMB-Spezifische Features
- Kind 30142 Parser mit vollständigem AMB-Support
- AMB-spezifische Filter (Fach, Stufe, Typ)
- NIP-50 Full-Text Search Integration

### Phase 3: Builder App
- Konfigurationsformular mit AMB-Filter-Section
- Live-Vorschau
- Snippet-Generator

### Phase 4: Erweiterte Features
- Profil-Ansicht
- Detail-Modal
- Responsive Design
- Dark Mode

---

## Dateien

### Builder App
- `src/routes/+page.svelte` - Hauptseite (Builder)
- `src/lib/builder/WidgetBuilder.svelte` - Konfigurationsformular + Live-Vorschau + Code-Generator

### Widget
- `src/lib/widget/nostr-feed.ts` - Web Component (Shadow DOM) + UI/State
- `src/lib/widget/card-renderers/*` - Renderer pro Kind (Default/Calendar/AMB)
- `src/lib/nostr/*` - Client, Parser, Filter, Types, NIP-19 Helper

---

## Bekannte Limitationen

1. **Kind 30142** ist kein offizieller NIP, sondern EduFeed-spezifisch
2. **CORS**: Relays müssen CORS-konfiguriert sein
3. **Browser-Kompatibilität**: Web Component APIs erforderlich
4. **Performance**: Große Feed-Mengen erfordern Pagination

---

## Referenzen

- [AMB Spezifikation](https://dini-ag-kim.github.io/amb/latest/)
- [AMB NIP](doc/AMB.md) - Lokale Kopie
- [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md)
- [NIP-23](https://github.com/nostr-protocol/nips/blob/master/23.md)
- [NIP-52](https://github.com/nostr-protocol/nips/blob/master/52.md)
- [amb-relay](https://git.edufeed.org/edufeed/amb-relay)

---

*Letzte Aktualisierung: 2026-02-04*
*Version: 1.0.0*
