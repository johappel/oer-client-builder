# Nostr Feed Widget - Test Strategie

Dieses Dokument definiert den Test-Plan für das Widget und die Builder App.

---

## 1. Unit Tests

### 1.1 Widget Unit Tests

#### Nostr Client (`widget/src/utils/nostr.ts`)

```typescript
describe('NostrClient', () => {
  // Verbindungsmanagement
  test('should connect to multiple relays', () => {});
  test('should handle connection failures gracefully', () => {});
  test('should retry failed connections', () => {});
  test('should disconnect from all relays on cleanup', () => {});
  
  // Event Fetching
  test('should fetch events with filter', () => {});
  test('should handle empty results', () => {});
  test('should merge events from multiple relays', () => {});
  test('should deduplicate events by id', () => {});
  
  // Subscription Management
  test('should create subscription with unique id', () => {});
  test('should close subscription on demand', () => {});
  test('should handle EOSE (End of Stored Events)', () => {});
});
```

#### Event Parser (`widget/src/parsers/`)

```typescript
describe('AMBParser', () => {
  // Grundlegende Parsing
  test('should parse minimal AMB event', () => {});
  test('should parse full AMB event with all fields', () => {});
  test('should handle missing optional fields', () => {});
  test('should handle malformed events gracefully', () => {});
  
  // Tag Parsing
  test('should parse about:id tags', () => {});
  test('should parse educationalLevel:id tags', () => {});
  test('should parse creator with pubkey (p tag)', () => {});
  test('should parse creator without pubkey (flattened tags)', () => {});
  test('should parse multiple creators', () => {});
  test('should parse license:id tag', () => {});
  test('should parse encoding:contentUrl', () => {});
  
  // Edge Cases
  test('should handle empty tags array', () => {});
  test('should handle unknown tags', () => {});
  test('should handle special characters in content', () => {});
});

describe('CalendarParser', () => {
  test('should parse date-based event (31922)', () => {});
  test('should parse time-based event (31923)', () => {});
  test('should handle timezone information', () => {});
  test('should parse participants', () => {});
  test('should use title field (name is deprecated per NIP-52)', () => {});
  test('should handle required content field', () => {});
});

describe('ArticleParser', () => {
  test('should parse article event (30023)', () => {});
  test('should handle markdown content', () => {});
  test('should parse published_at timestamp', () => {});
});
```

#### Filter Logic (`widget/src/utils/filter.ts`)

```typescript
describe('FilterEngine', () => {
  // Client-seitige Suche
  test('should search in name field', () => {});
  test('should search in description field', () => {});
  test('should search in keywords', () => {});
  test('should be case-insensitive', () => {});
  test('should handle partial matches', () => {});
  
  // Tag-Filter
  test('should filter by about:id', () => {});
  test('should filter by educationalLevel:id', () => {});
  test('should filter by multiple values (OR)', () => {});
  test('should combine multiple filters (AND)', () => {});
  
  // Kombinierte Filter
  test('should combine search and tag filters', () => {});
  test('should handle empty filter criteria', () => {});
  test('should handle no matches', () => {});
});
```

#### Utilities (`widget/src/utils/`)

```typescript
describe('DateFormatter', () => {
  test('should format ISO8601 duration', () => {});
  test('should format Unix timestamp', () => {});
  test('should format ISO date', () => {});
  test('should handle invalid dates', () => {});
});

describe('LicenseDetector', () => {
  test('should detect CC BY', () => {});
  test('should detect CC0', () => {});
  test('should detect proprietary license', () => {});
  test('should handle unknown license', () => {});
});

describe('ResourceTypeDetector', () => {
  test('should detect video from learningResourceType', () => {});
  test('should detect PDF from encodingFormat', () => {});
  test('should detect image from encodingFormat', () => {});
  test('should default to document', () => {});
});
```

### 1.2 Builder App Unit Tests

#### Config Store (`src/lib/stores/config.svelte.ts`)

```typescript
describe('ConfigStore', () => {
  test('should initialize with defaults', () => {});
  test('should update relays', () => {});
  test('should add/remove authors', () => {});
  test('should add vocabulary', () => {});
  test('should select/deselect concepts', () => {});
  test('should validate configuration', () => {});
  test('should generate widget config', () => {});
});
```

#### Vocabulary Loader (`src/lib/utils/vocabulary.ts`)

```typescript
describe('VocabularyLoader', () => {
  test('should load SKOS vocabulary from URL', () => {});
  test('should parse ConceptScheme', () => {});
  test('should extract top concepts', () => {});
  test('should handle narrower concepts', () => {});
  test('should handle network errors', () => {});
  test('should handle invalid JSON', () => {});
  test('should handle non-SKOS format', () => {});
});
```

#### Validators (`src/lib/utils/validators.ts`)

```typescript
describe('NpubValidator', () => {
  test('should validate correct npub', () => {});
  test('should reject invalid npub', () => {});
  test('should reject empty string', () => {});
  test('should convert npub to pubkey', () => {});
});

describe('RelayUrlValidator', () => {
  test('should validate wss:// URL', () => {});
  test('should validate ws:// URL', () => {});
  test('should reject http:// URL', () => {});
  test('should reject invalid format', () => {});
});
```

#### Code Generator (`src/lib/utils/widget.ts`)

```typescript
describe('CodeGenerator', () => {
  test('should generate widget HTML', () => {});
  test('should escape special characters', () => {});
  test('should format JSON attributes', () => {});
  test('should include all config options', () => {});
  test('should generate minified version', () => {});
});
```

---

## 2. Integration Tests

### 2.1 Widget Integration Tests

```typescript
describe('Widget Integration', () => {
  test('should fetch and display events', async () => {});
  test('should filter events client-side', async () => {});
  test('should open detail modal on click', async () => {});
  test('should load profile data for creators', async () => {});
  test('should handle pagination', async () => {});
});
```

### 2.2 Builder Integration Tests

```typescript
describe('Builder Integration', () => {
  test('should complete full configuration flow', async () => {});
  test('should generate valid widget code', async () => {});
  test('should show live preview', async () => {});
  test('should handle vocabulary loading errors', async () => {});
});
```

---

## 3. E2E Tests

### 3.1 Widget E2E Tests (Playwright)

#### Grundlegende Funktionalität

```typescript
test('Widget displays events in grid', async ({ page }) => {
  await page.goto('/test-widget.html');
  await expect(page.locator('.nostr-feed-grid')).toBeVisible();
  await expect(page.locator('.event-card')).toHaveCount(12);
});

test('Widget filters by search query', async ({ page }) => {
  await page.goto('/test-widget.html');
  await page.fill('[data-testid="search-input"]', 'Mathematik');
  await expect(page.locator('.event-card')).toHaveCount(3);
});

test('Widget opens detail modal', async ({ page }) => {
  await page.goto('/test-widget.html');
  await page.click('.event-card:first-child');
  await expect(page.locator('.detail-modal')).toBeVisible();
  await expect(page.locator('.detail-modal h2')).toContainText('Expected Title');
});

test('Widget shows active filters from config', async ({ page }) => {
  await page.goto('/test-widget-with-filters.html');
  await expect(page.locator('.active-filter')).toContainText('Religion');
});

test('Widget allows additional user filters', async ({ page }) => {
  await page.goto('/test-widget-with-filters.html');
  await page.click('[data-testid="filter-level-2"]');
  await expect(page.locator('.event-card')).toHaveCount(5);
});
```

#### Fehlerfälle

```typescript
test('Widget shows error on relay failure', async ({ page }) => {
  await page.goto('/test-widget-bad-relay.html');
  await expect(page.locator('.error-message')).toBeVisible();
  await expect(page.locator('.error-message')).toContainText('Verbindung fehlgeschlagen');
});

test('Widget shows empty state when no events', async ({ page }) => {
  await page.goto('/test-widget-no-events.html');
  await expect(page.locator('.empty-state')).toBeVisible();
});

test('Widget handles slow network gracefully', async ({ page }) => {
  await page.route('**/relay/**', route => route.abort());
  await page.goto('/test-widget.html');
  await expect(page.locator('.loading-state')).toBeVisible();
});
```

#### Accessibility

```typescript
test('Widget is keyboard navigable', async ({ page }) => {
  await page.goto('/test-widget.html');
  await page.keyboard.press('Tab');
  await expect(page.locator('.event-card:focus')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.detail-modal')).toBeVisible();
});

test('Widget has proper ARIA labels', async ({ page }) => {
  await page.goto('/test-widget.html');
  await expect(page.locator('[aria-label="Materialien durchsuchen"]')).toBeVisible();
});
```

### 3.2 Builder App E2E Tests

#### Konfigurations-Flow

```typescript
test('Builder: Complete configuration workflow', async ({ page }) => {
  await page.goto('/builder');
  
  // Step 1: Basic Config
  await page.fill('[name="relay"]', 'wss://relay.edufeed.org');
  await page.fill('[name="author"]', 'npub1...');
  await page.click('[data-testid="next-step"]');
  
  // Step 2: Vocabulary
  await page.fill('[name="vocab-url"]', 'https://skohub.io/.../schulfaecher/index.json');
  await page.click('[data-testid="load-vocab"]');
  await page.waitForSelector('.vocabulary-loaded');
  await page.click('[data-testid="select-concept-religion"]');
  await page.click('[data-testid="next-step"]');
  
  // Step 3: Appearance
  await page.selectOption('[name="theme"]', 'light');
  await page.click('[data-testid="next-step"]');
  
  // Step 4: Code Generation
  await expect(page.locator('.generated-code')).toBeVisible();
  await page.click('[data-testid="copy-code"]');
  
  // Verify copied content
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('nostr-feed');
});
```

#### Vokabular-Loading

```typescript
test('Builder: Load and display vocabulary', async ({ page }) => {
  await page.goto('/builder');
  await page.click('[data-testid="next-step"]'); // Skip to vocab step
  
  await page.fill('[name="vocab-url"]', 'https://skohub.io/.../schulfaecher/index.json');
  await page.click('[data-testid="load-vocab"]');
  
  await expect(page.locator('.vocabulary-tree')).toBeVisible();
  await expect(page.locator('.concept-count')).toContainText('62 Konzepte');
});

test('Builder: Handle vocabulary loading error', async ({ page }) => {
  await page.goto('/builder');
  await page.click('[data-testid="next-step"]');
  
  await page.fill('[name="vocab-url"]', 'https://invalid-url.com');
  await page.click('[data-testid="load-vocab"]');
  
  await expect(page.locator('.error-message')).toContainText('Vokabular konnte nicht geladen werden');
});
```

#### Live Preview

```typescript
test('Builder: Live preview updates on config change', async ({ page }) => {
  await page.goto('/builder');
  await page.fill('[name="relay"]', 'wss://relay.edufeed.org');
  
  await page.click('[data-testid="preview-tab"]');
  await expect(page.locator('.live-preview iframe')).toBeVisible();
  
  // Change config
  await page.click('[data-testid="config-tab"]');
  await page.selectOption('[name="theme"]', 'dark');
  
  // Verify preview updated
  await page.click('[data-testid="preview-tab"]');
  const iframe = page.frameLocator('.live-preview iframe');
  await expect(iframe.locator('body')).toHaveClass(/dark/);
});
```

---

## 4. Test-Abdeckung Ziele

| Bereich | Unit Tests | Integration | E2E | Ziel-Abdeckung |
|---------|------------|-------------|-----|----------------|
| Nostr Client | ✅ | ✅ | ✅ | 90% |
| Event Parser | ✅ | ✅ | ✅ | 95% |
| Filter Engine | ✅ | ✅ | ✅ | 90% |
| UI Components | ✅ | ✅ | ✅ | 80% |
| Config Store | ✅ | ✅ | - | 90% |
| Vocabulary Loader | ✅ | ✅ | ✅ | 85% |
| Code Generator | ✅ | - | ✅ | 90% |

---

## 5. Test-Daten

### 5.1 Mock Events

```json
{
  "amb_minimal": {
    "kind": 30142,
    "pubkey": "abc123...",
    "tags": [
      ["d", "test-resource-1"],
      ["name", "Test Resource"],
      ["description", "A test resource"]
    ],
    "content": "A test resource"
  },
  "amb_full": {
    "kind": 30142,
    "pubkey": "abc123...",
    "tags": [
      ["d", "test-resource-2"],
      ["name", "Complete Resource"],
      ["description", "Full description"],
      ["about:id", "http://w3id.org/kim/schulfaecher/s1024"],
      ["about:prefLabel:de", "Evangelisch"],
      ["educationalLevel:id", "https://w3id.org/kim/educationalLevel/level_2"],
      ["learningResourceType:id", "http://w3id.org/openeduhub/vocabs/new_lrt/video"],
      ["license:id", "https://creativecommons.org/licenses/by/4.0/"],
      ["image", "https://example.com/image.jpg"],
      ["t", "Religion"],
      ["t", "Video"]
    ],
    "content": "Full description"
  }
}
```

### 5.2 Mock Vokabulare

```json
{
  "schulfaecher_mini": {
    "@context": "...",
    "id": "http://w3id.org/kim/schulfaecher/",
    "type": "ConceptScheme",
    "title": {"de": "Schulfächer"},
    "hasTopConcept": [
      {
        "id": "http://w3id.org/kim/schulfaecher/s1024",
        "prefLabel": {"de": "Religionslehre (evangelisch)"}
      },
      {
        "id": "http://w3id.org/kim/schulfaecher/s1017",
        "prefLabel": {"de": "Mathematik"}
      }
    ]
  }
}
```

---

## 6. CI/CD Integration

### 6.1 Pre-Commit Hooks

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:unit:coverage
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
```

### 6.2 Quality Gates

- Unit Test Abdeckung > 80%
- Keine E2E Tests dürfen fehlschlagen
- Keine TypeScript Errors
- Keine Lint Errors

---

## 7. Test-Dateien Struktur

```
widget/
├── src/
│   └── __tests__/
│       ├── nostr.test.ts
│       ├── parsers/
│       │   ├── amb.test.ts
│       │   ├── calendar.test.ts
│       │   └── article.test.ts
│       └── utils/
│           ├── filter.test.ts
│           ├── date.test.ts
│           └── license.test.ts

doc/
├── src/
│   └── __tests__/
│       ├── stores/
│       │   └── config.test.ts
│       └── utils/
│           ├── vocabulary.test.ts
│           ├── validators.test.ts
│           └── widget.test.ts

e2e/
├── widget/
│   ├── basic.spec.ts
│   ├── filtering.spec.ts
│   ├── modal.spec.ts
│   └── accessibility.spec.ts
└── builder/
    ├── config-flow.spec.ts
    ├── vocabulary.spec.ts
    └── preview.spec.ts
```

---

*Letzte Aktualisierung: 2026-02-04*
*Version: 1.0.0*
