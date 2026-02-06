<script lang="ts">
  import { onMount } from 'svelte';
  import type { WidgetConfig } from '../nostr/types.js';
  import type { NostrFeedWidget as NostrFeedWidgetType } from '../widget/nostr-feed.js';
  
  type VocabularyTerm = {
    value: string;
    label: string;
    notation?: string;
  };

  type VocabularySource = {
    id: string;
    name: string;
    tagKey: string;
    url: string;
    status: 'idle' | 'loading' | 'ready' | 'error';
    error: string;
    terms: VocabularyTerm[];
    selectedValues: string[];
  };

  type ManualTagRow = {
    id: string;
    key: string;
    value: string;
    scope: 'global' | 'amb';
  };

  type BuilderTab = 'general' | 'filters' | 'design';

  const STORAGE_KEY = 'oer-client-builder:widget-builder-form:v2';
  const GENERATED_CODE_STORAGE_KEY = 'oer-client-builder:widget-builder-generated-code:v1';
  const TAG_KEY_SUGGESTIONS: string[] = [
    '#creator:id',
    '#creator:name',
    '#creator:type',
    '#publisher:id',
    '#publisher:name',
    '#publisher:type',
    '#about:id',
    '#audience:id',
    '#educationalLevel:id',
    '#learningResourceType:id',
    '#teaches:id',
    '#assesses:id',
    '#competencyRequired:id',
    '#subject',
    '#keywords',
    '#inLanguage',
    '#t',
    '#location',
    '#start',
    '#end',
    '#r',
    '#d'
  ];

  const DEFAULT_VOCAB_PRESETS: Array<{ name: string; tagKey: string; url: string }> = [
    {
      name: 'About',
      tagKey: '#about:id',
      url: 'https://vocabs.edu-sharing.net/w3id.org/kim/hochschulfaechersystematik/n1.json'
    },
    {
      name: 'Audience',
      tagKey: '#audience:id',
      url: 'https://vocabs.edu-sharing.net/w3id.org/edu-sharing/vocabs/dublin/educationalAudienceRole/index.json'
    },
    {
      name: 'Learning Resource Type',
      tagKey: '#learningResourceType:id',
      url: 'https://vocabs.edu-sharing.net/w3id.org/edu-sharing/vocabs/switch/hcrt/scheme.json'
    }
  ];

  const DEFAULT_FORM_STATE: {
    relays: string;
    authors: string;
    rawTags: string;
    creatorIds: string;
    creatorNames: string;
    creatorIncludePerson: boolean;
    creatorIncludeOrganization: boolean;
    publisherIds: string;
    publisherNames: string;
    publisherIncludeOrganization: boolean;
    search: string;
    kinds: string;
    maxItems: string;
    showSearch: boolean;
    showCategories: boolean;
    showAuthor: boolean;
    showOverlayChips: boolean;
    showKeywords: boolean;
    showLoadMore: boolean;
    pageSize: string;
    loadMoreStep: string;
    accentColor: string;
    cardMinWidth: string;
    maxColumns: string;
    theme: string;
    autoPreview: boolean;
    calendarStartDate: string;
    calendarEndDate: string;
  } = {
    relays: 'wss://relay.edufeed.org,wss://relay-rpi.edufeed.org,wss://amb-relay.edufeed.org',
    authors: '',
    rawTags: '[]',
    creatorIds: '',
    creatorNames: '',
    creatorIncludePerson: true,
    creatorIncludeOrganization: false,
    publisherIds: '',
    publisherNames: '',
    publisherIncludeOrganization: true,
    search: '',
    kinds: '30142,31922,31923,1,30023,0',
    maxItems: '50',
    showSearch: true,
    showCategories: true,
    showAuthor: true,
    showOverlayChips: true,
    showKeywords: true,
    showLoadMore: true,
    pageSize: '24',
    loadMoreStep: '',
    accentColor: '#7e22ce',
    cardMinWidth: '280',
    maxColumns: '',
    theme: 'auto',
    autoPreview: false,
    calendarStartDate: '',
    calendarEndDate: ''
  };

  let localIdCounter = 0;

  function createLocalId(prefix: string): string {
    localIdCounter += 1;
    return `${prefix}-${localIdCounter}`;
  }

  function normalizeAmbFilterKey(input: string): string {
    const key = input.trim();
    const mappings: Record<string, string> = {
      '#about': '#about:id',
      '#audience': '#audience:id',
      '#learningResourceType': '#learningResourceType:id',
      '#educationalLevel': '#educationalLevel:id',
      '#teaches': '#teaches:id',
      '#assesses': '#assesses:id',
      '#competencyRequired': '#competencyRequired:id'
    };

    return mappings[key] || key;
  }

  function normalizeHexColor(input: string): string {
    const trimmed = input.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
      const short = trimmed.slice(1);
      return `#${short[0]}${short[0]}${short[1]}${short[1]}${short[2]}${short[2]}`.toLowerCase();
    }
    return '';
  }

  function createVocabularySource(
    input?: Partial<Pick<VocabularySource, 'name' | 'tagKey' | 'url' | 'selectedValues'>>
  ): VocabularySource {
    return {
      id: createLocalId('vocab'),
      name: (input?.name || '').trim(),
      tagKey: normalizeAmbFilterKey((input?.tagKey || '#about:id').trim()),
      url: (input?.url || '').trim(),
      status: 'idle',
      error: '',
      terms: [],
      selectedValues: Array.isArray(input?.selectedValues)
        ? input.selectedValues.map((v) => String(v).trim()).filter(Boolean)
        : []
    };
  }

  function createDefaultVocabularySources(): VocabularySource[] {
    return DEFAULT_VOCAB_PRESETS.map((preset) => createVocabularySource(preset));
  }

  function createManualTagRow(
    key = '#t',
    value = '',
    scope?: 'global' | 'amb'
  ): ManualTagRow {
    const normalizedScope = scope || (key.trim().toLowerCase() === '#t' ? 'global' : 'amb');
    return { id: createLocalId('manual'), key, value, scope: normalizedScope };
  }

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function parseLegacyLanguageMapString(input: string): string {
    const trimmed = input.trim();
    if (!trimmed.startsWith('@{') || !trimmed.endsWith('}')) return trimmed;
    const inner = trimmed.slice(2, -1);
    const germanMatch = inner.match(/(?:^|[,;])\s*de\s*=\s*([^,;]+)\s*/i);
    if (germanMatch?.[1]) return germanMatch[1].trim();
    const firstValue = inner.match(/=\s*([^,;]+)/);
    if (firstValue?.[1]) return firstValue[1].trim();
    return inner.trim();
  }

  function pickLocalizedText(value: unknown): string {
    if (typeof value === 'string') return parseLegacyLanguageMapString(value);
    if (!isRecord(value)) return '';

    const preferredLanguages = ['de', 'en', 'und'];
    for (const lang of preferredLanguages) {
      const candidate = value[lang];
      if (typeof candidate === 'string' && candidate.trim()) return parseLegacyLanguageMapString(candidate);
    }

    for (const candidate of Object.values(value)) {
      if (typeof candidate === 'string' && candidate.trim()) return parseLegacyLanguageMapString(candidate);
    }

    return '';
  }

  function parseNotation(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value)) {
      const first = value.find((entry) => typeof entry === 'string' && entry.trim().length > 0);
      return typeof first === 'string' ? first.trim() : '';
    }
    return '';
  }

  function collectVocabularyTerms(
    node: unknown,
    terms: VocabularyTerm[],
    seenValues: Set<string>
  ): void {
    if (!isRecord(node)) return;

    const id = typeof node.id === 'string' ? node.id.trim() : '';
    const notation = parseNotation(node.notation);
    const label =
      pickLocalizedText(node.prefLabel) || pickLocalizedText(node.title) || notation || id || 'Unbenannt';
    const value = id || notation || label;

    if (value && !seenValues.has(value)) {
      terms.push({ value, label, notation: notation || undefined });
      seenValues.add(value);
    }

    const narrower = Array.isArray(node.narrower) ? node.narrower : [];
    narrower.forEach((child) => collectVocabularyTerms(child, terms, seenValues));
  }

  function extractVocabularyTerms(payload: unknown): VocabularyTerm[] {
    const terms: VocabularyTerm[] = [];
    const seenValues = new Set<string>();

    if (Array.isArray(payload)) {
      payload.forEach((node) => collectVocabularyTerms(node, terms, seenValues));
    } else if (isRecord(payload)) {
      collectVocabularyTerms(payload, terms, seenValues);

      const topConcepts = Array.isArray(payload.hasTopConcept) ? payload.hasTopConcept : [];
      topConcepts.forEach((node) => collectVocabularyTerms(node, terms, seenValues));

      const narrower = Array.isArray(payload.narrower) ? payload.narrower : [];
      narrower.forEach((node) => collectVocabularyTerms(node, terms, seenValues));

      const graph = Array.isArray(payload['@graph']) ? payload['@graph'] : [];
      graph.forEach((node) => collectVocabularyTerms(node, terms, seenValues));
    }

    return terms.sort((a, b) => a.label.localeCompare(b.label, 'de', { sensitivity: 'base' }));
  }

  function normalizeFilterEntry(entry: unknown): string[] | null {
    if (!Array.isArray(entry) || entry.length < 2) return null;
    const [rawKey, ...rawValues] = entry;
    if (typeof rawKey !== 'string') return null;
    const key = rawKey.trim();
    if (!key) return null;
    const values = rawValues
      .map((value) => (typeof value === 'string' ? value.trim() : String(value).trim()))
      .filter(Boolean);
    if (values.length === 0) return null;
    return [key, ...values];
  }

  function parseRawTagFilters(raw: string): { filters: string[][]; error: string } {
    const trimmed = raw.trim();
    if (!trimmed) return { filters: [], error: '' };

    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) return { filters: [], error: 'Raw-JSON muss ein Array sein.' };

      const filters: string[][] = [];
      parsed.forEach((entry) => {
        const normalized = normalizeFilterEntry(entry);
        if (normalized) filters.push(normalized);
      });
      return { filters, error: '' };
    } catch {
      return { filters: [], error: 'Raw-JSON ist kein gueltiges JSON.' };
    }
  }

  function buildVocabularyTagFilters(sources: VocabularySource[]): string[][] {
    return sources
      .map((source) => {
        const key = normalizeAmbFilterKey(source.tagKey);
        const values = source.selectedValues.map((value) => value.trim()).filter(Boolean);
        if (!key || values.length === 0) return null;
        return [key, ...values];
      })
      .filter((entry): entry is string[] => Array.isArray(entry));
  }

  function buildManualTagFilters(rows: ManualTagRow[]): { globalTags: string[][]; ambTags: string[][] } {
    const groupedGlobal = new Map<string, Set<string>>();
    const groupedAmb = new Map<string, Set<string>>();

    rows.forEach((row) => {
      const key = normalizeAmbFilterKey(row.key);
      const value = row.value.trim();
      if (!key || !value) return;

      const scope = key.trim().toLowerCase() === '#t' ? 'global' : row.scope;
      const target = scope === 'global' ? groupedGlobal : groupedAmb;

      if (!target.has(key)) target.set(key, new Set<string>());
      target.get(key)?.add(value);
    });

    return {
      globalTags: Array.from(groupedGlobal.entries()).map(([key, values]) => [key, ...Array.from(values)]),
      ambTags: Array.from(groupedAmb.entries()).map(([key, values]) => [key, ...Array.from(values)])
    };
  }

  function buildCreatorTagFilters(): string[][] {
    const filters: string[][] = [];

    const creatorIdsValues = creatorIds
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (creatorIdsValues.length > 0) {
      filters.push(['#creator:id', ...Array.from(new Set(creatorIdsValues))]);
    }

    const creatorNamesValues = creatorNames
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (creatorNamesValues.length > 0) {
      filters.push(['#creator:name', ...Array.from(new Set(creatorNamesValues))]);
    }

    const creatorTypeValues: string[] = [];
    if (creatorIncludePerson) creatorTypeValues.push('Person');
    if (creatorIncludeOrganization) creatorTypeValues.push('Organization');
    if (creatorTypeValues.length > 0) {
      filters.push(['#creator:type', ...creatorTypeValues]);
    }

    return filters;
  }

  function buildPublisherTagFilters(): string[][] {
    const filters: string[][] = [];

    const publisherIdsValues = publisherIds
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (publisherIdsValues.length > 0) {
      filters.push(['#publisher:id', ...Array.from(new Set(publisherIdsValues))]);
    }

    const publisherNamesValues = publisherNames
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (publisherNamesValues.length > 0) {
      filters.push(['#publisher:name', ...Array.from(new Set(publisherNamesValues))]);
    }

    if (publisherIncludeOrganization) {
      filters.push(['#publisher:type', 'Organization']);
    }

    return filters;
  }

  function mergeTagFilters(groups: string[][][]): string[][] {
    const grouped = new Map<string, Set<string>>();
    groups.flat().forEach((entry) => {
      const normalized = normalizeFilterEntry(entry);
      if (!normalized) return;
      const [key, ...values] = normalized;
      if (!grouped.has(key)) grouped.set(key, new Set<string>());
      values.forEach((value) => grouped.get(key)?.add(value));
    });
    return Array.from(grouped.entries()).map(([key, values]) => [key, ...Array.from(values)]);
  }

  function splitAssistantTagFilters(filters: string[][]): { globalTags: string[][]; ambTags: string[][] } {
    const globalTags: string[][] = [];
    const ambTags: string[][] = [];

    filters.forEach((entry) => {
      const normalized = normalizeFilterEntry(entry);
      if (!normalized) return;
      const [key] = normalized;
      if (key.trim().toLowerCase() === '#t') {
        globalTags.push(normalized);
        return;
      }
      ambTags.push(normalized);
    });

    return { globalTags, ambTags };
  }

  function buildEffectiveTagFilters(): { globalTags: string[][]; ambTags: string[][]; error: string } {
    const raw = parseRawTagFilters(rawTags);
    const vocabulary = buildVocabularyTagFilters(vocabularySources);
    const manual = buildManualTagFilters(manualTagRows);
    const creator = buildCreatorTagFilters();
    const publisher = buildPublisherTagFilters();

    const assistantFilters = mergeTagFilters([vocabulary, creator, publisher, manual.ambTags]);
    const split = splitAssistantTagFilters(assistantFilters);

    return {
      globalTags: mergeTagFilters([raw.filters, split.globalTags, manual.globalTags]),
      ambTags: mergeTagFilters([split.ambTags]),
      error: raw.error
    };
  }

  // Form State mit Svelte 5 Runes
  let relays = $state(DEFAULT_FORM_STATE.relays);
  let authors = $state(DEFAULT_FORM_STATE.authors);
  let rawTags = $state(DEFAULT_FORM_STATE.rawTags);
  let creatorIds = $state(DEFAULT_FORM_STATE.creatorIds);
  let creatorNames = $state(DEFAULT_FORM_STATE.creatorNames);
  let creatorIncludePerson = $state(DEFAULT_FORM_STATE.creatorIncludePerson);
  let creatorIncludeOrganization = $state(DEFAULT_FORM_STATE.creatorIncludeOrganization);
  let publisherIds = $state(DEFAULT_FORM_STATE.publisherIds);
  let publisherNames = $state(DEFAULT_FORM_STATE.publisherNames);
  let publisherIncludeOrganization = $state(DEFAULT_FORM_STATE.publisherIncludeOrganization);
  let search = $state(DEFAULT_FORM_STATE.search);
  let kinds = $state(DEFAULT_FORM_STATE.kinds);
  let maxItems = $state(DEFAULT_FORM_STATE.maxItems);
  let showSearch = $state(DEFAULT_FORM_STATE.showSearch);
  let showCategories = $state(DEFAULT_FORM_STATE.showCategories);
  let showAuthor = $state(DEFAULT_FORM_STATE.showAuthor);
  let showOverlayChips = $state(DEFAULT_FORM_STATE.showOverlayChips);
  let showKeywords = $state(DEFAULT_FORM_STATE.showKeywords);
  let showLoadMore = $state(DEFAULT_FORM_STATE.showLoadMore);
  let pageSize = $state(DEFAULT_FORM_STATE.pageSize);
  let loadMoreStep = $state(DEFAULT_FORM_STATE.loadMoreStep);
  let accentColor = $state(DEFAULT_FORM_STATE.accentColor);
  let cardMinWidth = $state(DEFAULT_FORM_STATE.cardMinWidth);
  let maxColumns = $state(DEFAULT_FORM_STATE.maxColumns);
  let theme = $state(DEFAULT_FORM_STATE.theme);
  let autoPreview = $state(DEFAULT_FORM_STATE.autoPreview);
  let calendarStartDate = $state(DEFAULT_FORM_STATE.calendarStartDate);
  let calendarEndDate = $state(DEFAULT_FORM_STATE.calendarEndDate);
  let activeFormTab = $state<BuilderTab>('general');

  let vocabularySources = $state<VocabularySource[]>(createDefaultVocabularySources());
  let manualTagRows = $state<ManualTagRow[]>([]);

  let tagJsonError = $state('');
  let effectiveTagsPreview = $state('[]');

  let isClient = $state(false);
  
  // Preview Element
  let previewContainer: HTMLElement | null = $state(null);
  let widgetInstance: NostrFeedWidgetType | null = null;
  let NostrFeedWidget: typeof NostrFeedWidgetType | null = $state(null);
  let appliedConfig = $state<WidgetConfig>(parseFormState());
  
  // Generated Code
  let generatedCode = $state('');
  
  // Parse Form State
  function parseFormState(): WidgetConfig {
    const relayArray = relays.split(',').map(r => r.trim()).filter(Boolean);
    const authorArray = authors.split(',').map(a => a.trim()).filter(Boolean);
    const kindArray = kinds.split(',').map(k => parseInt(k.trim(), 10)).filter(k => !isNaN(k)) as any;
    const pageSizeNum = parseInt(pageSize, 10);
    const loadMoreStepNum = parseInt(loadMoreStep, 10);
    const effectivePageSize = Number.isFinite(pageSizeNum) && pageSizeNum > 0 ? pageSizeNum : 24;
    const legacyStaleLoadMoreStep =
      loadMoreStep.trim() === '24' &&
      Number.isFinite(pageSizeNum) &&
      pageSizeNum > 0 &&
      pageSizeNum !== 24;
    const effectiveLoadMoreStep =
      Number.isFinite(loadMoreStepNum) && loadMoreStepNum > 0 && !legacyStaleLoadMoreStep
        ? loadMoreStepNum
        : effectivePageSize;
    const maxItemsNum = Math.max(parseInt(maxItems, 10) || 50, effectivePageSize, effectiveLoadMoreStep);
    const cardMinWidthNum = parseInt(cardMinWidth, 10);
    const maxColumnsNum = parseInt(maxColumns, 10);
    const normalizedAccentColor = normalizeHexColor(accentColor);
    
    const { globalTags, ambTags } = buildEffectiveTagFilters();
    
    return {
      relays: relayArray,
      kinds: kindArray,
      authors: authorArray,
      tags: globalTags,
      ambTags: ambTags.length > 0 ? ambTags : undefined,
      calendarStartDate: calendarStartDate.trim() || undefined,
      calendarEndDate: calendarEndDate.trim() || undefined,
      search,
      categories: [],
      maxItems: maxItemsNum,
      showSearch,
      showCategories,
      showAuthor,
      showOverlayChips,
      showKeywords,
      showLoadMore,
      pageSize: Number.isFinite(pageSizeNum) && pageSizeNum > 0 ? pageSizeNum : undefined,
      loadMoreStep:
        Number.isFinite(loadMoreStepNum) && loadMoreStepNum > 0 && !legacyStaleLoadMoreStep
          ? loadMoreStepNum
          : undefined,
      accentColor: normalizedAccentColor || undefined,
      cardMinWidth: Number.isFinite(cardMinWidthNum) && cardMinWidthNum > 0 ? cardMinWidthNum : undefined,
      maxColumns: Number.isFinite(maxColumnsNum) && maxColumnsNum > 0 ? maxColumnsNum : undefined,
      theme: theme as 'light' | 'dark' | 'auto',
      language: 'de'
    };
  }

  type StoredFormState = {
    relays?: string;
    authors?: string;
    tags?: string; // legacy
    rawTags?: string;
    creatorIds?: string;
    creatorNames?: string;
    creatorIncludePerson?: boolean;
    creatorIncludeOrganization?: boolean;
    publisherIds?: string;
    publisherNames?: string;
    publisherIncludeOrganization?: boolean;
    search?: string;
    kinds?: string;
    maxItems?: string;
    showSearch?: boolean;
    showCategories?: boolean;
    showAuthor?: boolean;
    showOverlayChips?: boolean;
    showKeywords?: boolean;
    showLoadMore?: boolean;
    pageSize?: string;
    loadMoreStep?: string;
    accentColor?: string;
    cardMinWidth?: string;
    maxColumns?: string;
    theme?: string;
    autoPreview?: boolean;
    calendarStartDate?: string;
    calendarEndDate?: string;
    manualTagRows?: Array<{ key?: string; value?: string; scope?: 'global' | 'amb' }>;
    vocabularySources?: Array<{
      name?: string;
      tagKey?: string;
      url?: string;
      selectedValues?: string[];
    }>;
  };

  function readStoredFormState(): StoredFormState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StoredFormState;
    } catch {
      return null;
    }
  }

  function clearStoredFormState(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  function applyStoredFormState(stored: StoredFormState): void {
    if (typeof stored.relays === 'string') relays = stored.relays;
    if (typeof stored.authors === 'string') authors = stored.authors;
    if (typeof stored.rawTags === 'string') rawTags = stored.rawTags;
    else if (typeof stored.tags === 'string') rawTags = stored.tags;
    if (typeof stored.creatorIds === 'string') creatorIds = stored.creatorIds;
    if (typeof stored.creatorNames === 'string') creatorNames = stored.creatorNames;
    if (typeof stored.creatorIncludePerson === 'boolean') creatorIncludePerson = stored.creatorIncludePerson;
    if (typeof stored.creatorIncludeOrganization === 'boolean') creatorIncludeOrganization = stored.creatorIncludeOrganization;
    if (typeof stored.publisherIds === 'string') publisherIds = stored.publisherIds;
    if (typeof stored.publisherNames === 'string') publisherNames = stored.publisherNames;
    if (typeof stored.publisherIncludeOrganization === 'boolean') publisherIncludeOrganization = stored.publisherIncludeOrganization;
    if (typeof stored.search === 'string') search = stored.search;
    if (typeof stored.kinds === 'string') kinds = stored.kinds;
    if (typeof stored.maxItems === 'string') maxItems = stored.maxItems;
    if (typeof stored.showSearch === 'boolean') showSearch = stored.showSearch;
    if (typeof stored.showCategories === 'boolean') showCategories = stored.showCategories;
    if (typeof stored.showAuthor === 'boolean') showAuthor = stored.showAuthor;
    if (typeof stored.showOverlayChips === 'boolean') showOverlayChips = stored.showOverlayChips;
    if (typeof stored.showKeywords === 'boolean') showKeywords = stored.showKeywords;
    if (typeof stored.showLoadMore === 'boolean') showLoadMore = stored.showLoadMore;
    if (typeof stored.pageSize === 'string') pageSize = stored.pageSize;
    if (typeof stored.loadMoreStep === 'string') {
      const isLegacyDefault =
        stored.loadMoreStep.trim() === '24' &&
        (typeof stored.pageSize !== 'string' || stored.pageSize.trim() !== '24');
      loadMoreStep = isLegacyDefault ? '' : stored.loadMoreStep;
    }
    if (typeof stored.accentColor === 'string') accentColor = stored.accentColor;
    if (typeof stored.cardMinWidth === 'string') cardMinWidth = stored.cardMinWidth;
    if (typeof stored.maxColumns === 'string') maxColumns = stored.maxColumns;
    if (typeof stored.theme === 'string') theme = stored.theme;
    if (typeof stored.autoPreview === 'boolean') autoPreview = stored.autoPreview;
    if (typeof stored.calendarStartDate === 'string') calendarStartDate = stored.calendarStartDate;
    if (typeof stored.calendarEndDate === 'string') calendarEndDate = stored.calendarEndDate;

    if (Array.isArray(stored.vocabularySources)) {
      const mapped = stored.vocabularySources.map((source) =>
        createVocabularySource({
          name: typeof source?.name === 'string' ? source.name : '',
          tagKey: typeof source?.tagKey === 'string' ? source.tagKey : '#about:id',
          url: typeof source?.url === 'string' ? source.url : '',
          selectedValues: Array.isArray(source?.selectedValues) ? source.selectedValues : []
        })
      );
      vocabularySources = mapped.length > 0 ? mapped : createDefaultVocabularySources();
    }

    if (Array.isArray(stored.manualTagRows)) {
      manualTagRows = stored.manualTagRows.map((row) =>
        createManualTagRow(
          typeof row?.key === 'string' ? row.key : '#t',
          typeof row?.value === 'string' ? row.value : '',
          row?.scope === 'global' || row?.scope === 'amb' ? row.scope : undefined
        )
      );
    }
  }

  function applyPreview(): void {
    appliedConfig = parseFormState();
  }

  function resetForm(): void {
    relays = DEFAULT_FORM_STATE.relays;
    authors = DEFAULT_FORM_STATE.authors;
    rawTags = DEFAULT_FORM_STATE.rawTags;
    creatorIds = DEFAULT_FORM_STATE.creatorIds;
    creatorNames = DEFAULT_FORM_STATE.creatorNames;
    creatorIncludePerson = DEFAULT_FORM_STATE.creatorIncludePerson;
    creatorIncludeOrganization = DEFAULT_FORM_STATE.creatorIncludeOrganization;
    publisherIds = DEFAULT_FORM_STATE.publisherIds;
    publisherNames = DEFAULT_FORM_STATE.publisherNames;
    publisherIncludeOrganization = DEFAULT_FORM_STATE.publisherIncludeOrganization;
    search = DEFAULT_FORM_STATE.search;
    kinds = DEFAULT_FORM_STATE.kinds;
    maxItems = DEFAULT_FORM_STATE.maxItems;
    showSearch = DEFAULT_FORM_STATE.showSearch;
    showCategories = DEFAULT_FORM_STATE.showCategories;
    showAuthor = DEFAULT_FORM_STATE.showAuthor;
    showOverlayChips = DEFAULT_FORM_STATE.showOverlayChips;
    showKeywords = DEFAULT_FORM_STATE.showKeywords;
    showLoadMore = DEFAULT_FORM_STATE.showLoadMore;
    pageSize = DEFAULT_FORM_STATE.pageSize;
    loadMoreStep = DEFAULT_FORM_STATE.loadMoreStep;
    accentColor = DEFAULT_FORM_STATE.accentColor;
    cardMinWidth = DEFAULT_FORM_STATE.cardMinWidth;
    maxColumns = DEFAULT_FORM_STATE.maxColumns;
    theme = DEFAULT_FORM_STATE.theme;
    autoPreview = DEFAULT_FORM_STATE.autoPreview;
    calendarStartDate = DEFAULT_FORM_STATE.calendarStartDate;
    calendarEndDate = DEFAULT_FORM_STATE.calendarEndDate;
    vocabularySources = createDefaultVocabularySources();
    manualTagRows = [];

    if (isClient) clearStoredFormState();
    applyPreview();
  }

  async function loadVocabulary(sourceId: string): Promise<void> {
    const source = vocabularySources.find((entry) => entry.id === sourceId);
    if (!source) return;

    const url = source.url.trim();
    if (!url) {
      source.status = 'error';
      source.error = 'Bitte eine URL eingeben.';
      source.terms = [];
      return;
    }

    source.status = 'loading';
    source.error = '';

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const terms = extractVocabularyTerms(payload);
      if (terms.length === 0) throw new Error('Keine Konzepte gefunden.');

      source.terms = terms;
      source.status = 'ready';

      const allowedValues = new Set(terms.map((term) => term.value));
      source.selectedValues = source.selectedValues.filter((value) => allowedValues.has(value));
    } catch (error) {
      source.status = 'error';
      source.error = error instanceof Error ? error.message : 'Vocabulary konnte nicht geladen werden.';
      source.terms = [];
    }
  }

  function addVocabularySource(): void {
    vocabularySources = [...vocabularySources, createVocabularySource({ tagKey: '#about:id' })];
  }

  function removeVocabularySource(id: string): void {
    vocabularySources = vocabularySources.filter((entry) => entry.id !== id);
  }

  function addManualTagRow(): void {
    manualTagRows = [...manualTagRows, createManualTagRow()];
  }

  function removeManualTagRow(id: string): void {
    manualTagRows = manualTagRows.filter((row) => row.id !== id);
  }
  
  // Generate HTML Code
  function generateCode(config: WidgetConfig): string {
    const attributes: string[] = [];
    
    if (config.relays.length > 0) {
      attributes.push(`relays="${config.relays.join(',')}"`);
    }
    
    if (config.kinds.length > 0) {
      attributes.push(`kinds="${config.kinds.join(',')}"`);
    }
    
    if (config.authors.length > 0) {
      attributes.push(`authors="${config.authors.join(',')}"`);
    }
    
    if (config.tags.length > 0) {
      attributes.push(`tags='${JSON.stringify(config.tags)}'`);
    }

    if (config.ambTags && config.ambTags.length > 0) {
      attributes.push(`ambTags='${JSON.stringify(config.ambTags)}'`);
    }

    if (config.calendarStartDate) {
      attributes.push(`calendarStartDate="${config.calendarStartDate}"`);
    }

    if (config.calendarEndDate) {
      attributes.push(`calendarEndDate="${config.calendarEndDate}"`);
    }
    
    if (config.search) {
      attributes.push(`search="${config.search}"`);
    }
    
    if (!config.showSearch) {
      attributes.push('showSearch="false"');
    }
    
    if (!config.showCategories) {
      attributes.push('showCategories="false"');
    }
    
    if (!config.showAuthor) {
      attributes.push('showAuthor="false"');
    }

    if (config.showOverlayChips === false) {
      attributes.push('showOverlayChips="false"');
    }

    if (config.showKeywords === false) {
      attributes.push('showKeywords="false"');
    }

    if (config.showLoadMore === false) {
      attributes.push('showLoadMore="false"');
    }

    if (config.pageSize) {
      attributes.push(`pageSize="${config.pageSize}"`);
    }

    if (config.loadMoreStep) {
      attributes.push(`loadMoreStep="${config.loadMoreStep}"`);
    }

    if (config.accentColor) {
      attributes.push(`accentColor="${config.accentColor}"`);
    }

    if (config.cardMinWidth) {
      attributes.push(`cardMinWidth="${config.cardMinWidth}"`);
    }

    if (config.maxColumns) {
      attributes.push(`maxColumns="${config.maxColumns}"`);
    }
    
    if (config.theme !== 'auto') {
      attributes.push(`theme="${config.theme}"`);
    }
    
    attributes.push('maxItems="' + config.maxItems + '"');
    
    const scriptUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/src/lib/widget/nostr-feed.ts`
        : '/src/lib/widget/nostr-feed.ts';

    return `<!-- Nostr Feed Widget -->
<script type="module" src="${scriptUrl}"><\/script>
<nostr-feed ${attributes.join(' ')}></nostr-feed>`;
  }
  
  // Update Preview
  function updatePreview(config: WidgetConfig, widgetCtor: typeof NostrFeedWidgetType, container: HTMLElement): void {
    if (widgetInstance) {
      widgetInstance.remove();
    }
    
    widgetInstance = new widgetCtor();
    widgetInstance.setAttribute('relays', config.relays.join(','));
    widgetInstance.setAttribute('kinds', config.kinds.join(','));
    if (config.authors.length > 0) {
      widgetInstance.setAttribute('authors', config.authors.join(','));
    }
    if (config.tags.length > 0) {
      widgetInstance.setAttribute('tags', JSON.stringify(config.tags));
    }
    if (config.ambTags && config.ambTags.length > 0) {
      widgetInstance.setAttribute('ambTags', JSON.stringify(config.ambTags));
    }
    if (config.calendarStartDate) {
      widgetInstance.setAttribute('calendarStartDate', config.calendarStartDate);
    }
    if (config.calendarEndDate) {
      widgetInstance.setAttribute('calendarEndDate', config.calendarEndDate);
    }
    if (config.search) {
      widgetInstance.setAttribute('search', config.search);
    }
    if (!config.showSearch) {
      widgetInstance.setAttribute('showSearch', 'false');
    }
    if (!config.showCategories) {
      widgetInstance.setAttribute('showCategories', 'false');
    }
    if (!config.showAuthor) {
      widgetInstance.setAttribute('showAuthor', 'false');
    }
    if (config.showOverlayChips === false) {
      widgetInstance.setAttribute('showOverlayChips', 'false');
    }
    if (config.showKeywords === false) {
      widgetInstance.setAttribute('showKeywords', 'false');
    }
    if (config.showLoadMore === false) {
      widgetInstance.setAttribute('showLoadMore', 'false');
    }
    if (config.pageSize) {
      widgetInstance.setAttribute('pageSize', String(config.pageSize));
    }
    if (config.loadMoreStep) {
      widgetInstance.setAttribute('loadMoreStep', String(config.loadMoreStep));
    }
    if (config.accentColor) {
      widgetInstance.setAttribute('accentColor', config.accentColor);
    }
    if (config.cardMinWidth) {
      widgetInstance.setAttribute('cardMinWidth', String(config.cardMinWidth));
    }
    if (config.maxColumns) {
      widgetInstance.setAttribute('maxColumns', String(config.maxColumns));
    }
    widgetInstance.setAttribute('theme', config.theme);
    widgetInstance.setAttribute('maxItems', String(config.maxItems));
    
    container.appendChild(widgetInstance);
  }
  
  // Copy to Clipboard
  function copyToClipboard(): void {
    navigator.clipboard.writeText(generatedCode).then(() => {
      alert('Code in die Zwischenablage kopiert!');
    }).catch(err => {
      console.error('Fehler beim Kopieren:', err);
    });
  }

  function openTestPage(): void {
    try {
      localStorage.setItem(GENERATED_CODE_STORAGE_KEY, generatedCode);
    } catch {
      // ignore
    }
    window.open('/test', '_blank');
  }
  
  // Keep #t scope consistent (always global)
  $effect(() => {
    manualTagRows.forEach((row) => {
      if (normalizeAmbFilterKey(row.key).trim().toLowerCase() === '#t' && row.scope !== 'global') {
        row.scope = 'global';
      }
    });
  });

  // Update generated code on form changes
  $effect(() => {
    const config = parseFormState();
    generatedCode = generateCode(config);
  });

  // Persist generated code for test page
  $effect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem(GENERATED_CODE_STORAGE_KEY, generatedCode);
    } catch {
      // ignore
    }
  });

  // Effective tags preview
  $effect(() => {
    const { globalTags, ambTags, error } = buildEffectiveTagFilters();
    tagJsonError = error;
    effectiveTagsPreview = JSON.stringify(
      {
        tags: globalTags,
        ambTags
      },
      null,
      2
    );
  });

  // Persist form state
  $effect(() => {
    if (!isClient) return;
    const toStore: StoredFormState = {
      relays,
      authors,
      rawTags,
      creatorIds,
      creatorNames,
      creatorIncludePerson,
      creatorIncludeOrganization,
      publisherIds,
      publisherNames,
      publisherIncludeOrganization,
      search,
      kinds,
      maxItems,
      showSearch,
      showCategories,
      showAuthor,
      showOverlayChips,
      showKeywords,
      showLoadMore,
      pageSize,
      loadMoreStep,
      accentColor,
      cardMinWidth,
      maxColumns,
      theme,
      autoPreview,
      calendarStartDate,
      calendarEndDate,
      manualTagRows: manualTagRows.map((row) => ({ key: row.key, value: row.value, scope: row.scope })),
      vocabularySources: vocabularySources.map((source) => ({
        name: source.name,
        tagKey: source.tagKey,
        url: source.url,
        selectedValues: source.selectedValues
      }))
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // ignore
    }
  });

  // Auto preview (debounced)
  $effect(() => {
    if (!isClient || !autoPreview) return;
    const config = parseFormState();
    const timeout = setTimeout(() => {
      appliedConfig = config;
    }, 500);
    return () => clearTimeout(timeout);
  });

  // Render preview from applied config only
  $effect(() => {
    const widgetCtor = NostrFeedWidget;
    const container = previewContainer;
    if (!widgetCtor || !container) return;
    updatePreview(appliedConfig, widgetCtor, container);
  });
  
  // Initial setup
  onMount(async () => {
    console.log('[WidgetBuilder] onMount called');
    const stored = readStoredFormState();
    if (stored) {
      applyStoredFormState(stored);
    }
    isClient = true;
    // Dynamisch importieren für Browser-only
    const module = await import('../widget/nostr-feed.js');
    NostrFeedWidget = module.NostrFeedWidget;
    console.log('[WidgetBuilder] NostrFeedWidget loaded');
    // Vorschau wird per $effect aktualisiert
    applyPreview();
  });
</script>

<div class="widget-builder">
  <h1>Nostr Feed Widget Builder</h1>
  
  <div class="builder-layout">
    <div class="form-section">
      <h2>Konfiguration</h2>

      <div class="tabs">
        <button type="button" class="tab-button" class:active={activeFormTab === 'general'} onclick={() => (activeFormTab = 'general')}>
          Allgemein
        </button>
        <button type="button" class="tab-button" class:active={activeFormTab === 'filters'} onclick={() => (activeFormTab = 'filters')}>
          Filter
        </button>
        <button type="button" class="tab-button" class:active={activeFormTab === 'design'} onclick={() => (activeFormTab = 'design')}>
          Design
        </button>
      </div>

      {#if activeFormTab === 'general'}
        <div class="form-group">
          <label for="relays">Relays (kommasepariert)</label>
          <input
            type="text"
            id="relays"
            bind:value={relays}
            placeholder="wss://relay.edufeed.org,wss://relay-rpi.edufeed.org"
          />
        </div>

        <div class="form-group">
          <label for="authors">Npubs / Autoren (npub oder hex, kommasepariert)</label>
          <input
            type="text"
            id="authors"
            bind:value={authors}
            placeholder="npub1...,npub2..."
          />
          <small>Communities folgen als eigener Filter.</small>
        </div>

        <div class="form-group">
          <label for="search">Suche</label>
          <input
            type="text"
            id="search"
            bind:value={search}
            placeholder="Suchbegriffe... (ODER: Begriff1, Begriff2)"
          />
        </div>

        <div class="form-group">
          <label for="kinds">Event Types (kommasepariert)</label>
          <input
            type="text"
            id="kinds"
            bind:value={kinds}
            placeholder="30142,31922,1,30023,0"
          />
          <small>30142=OER, 31922=Calendar date, 31923=Calendar time, 1=Note, 30023=Artikel, 0=Profil</small>
        </div>

        <div class="form-group">
          <label for="pageSizeGeneral">Treffer pro Seite</label>
          <input
            type="number"
            id="pageSizeGeneral"
            bind:value={pageSize}
            min="1"
            max="200"
            step="1"
          />
        </div>
      {/if}

      {#if activeFormTab === 'filters'}
        <details class="accordion-item" open>
          <summary>AMB: Filter-Assistent</summary>
          <div class="accordion-content">
            <h3>Vocabulary-basierte Filter</h3>
            <p class="hint">
              URL + Tag-Key angeben, Vocabulary laden und Begriffe auswaehlen. Diese Filter gelten fuer
              `kind:30142` (AMB). Ausnahme: `#t` gilt global fuer alle ausgewaehlten Kinds.
            </p>

            <datalist id="tag-key-suggestions">
              {#each TAG_KEY_SUGGESTIONS as tagKey}
                <option value={tagKey}></option>
              {/each}
            </datalist>

            {#each vocabularySources as source (source.id)}
              <div class="vocab-card">
                <div class="vocab-grid">
                  <input
                    type="text"
                    bind:value={source.name}
                    placeholder="Name (optional)"
                    title="Name"
                  />
                  <input
                    type="text"
                    bind:value={source.tagKey}
                    list="tag-key-suggestions"
                    placeholder="#about:id"
                    title="Tag-Key"
                  />
                </div>
                <div class="vocab-grid vocab-grid-url">
                  <input
                    type="url"
                    bind:value={source.url}
                    placeholder="https://vocabs.edu-sharing.net/..."
                    title="Vocabulary URL"
                  />
                  <div class="vocab-actions">
                    <button
                      type="button"
                      class="small-button"
                      onclick={() => loadVocabulary(source.id)}
                      disabled={source.status === 'loading' || !source.url.trim()}
                    >
                      {source.status === 'loading' ? 'Lade...' : 'Vocabulary laden'}
                    </button>
                    <button type="button" class="small-button muted" onclick={() => removeVocabularySource(source.id)}>
                      Entfernen
                    </button>
                  </div>
                </div>

                {#if source.status === 'ready'}
                  <small>{source.terms.length} Eintraege geladen</small>
                {/if}
                {#if source.status === 'error'}
                  <small class="error-text">{source.error}</small>
                {/if}

                {#if source.terms.length > 0}
                  <select multiple size="8" bind:value={source.selectedValues}>
                    {#each source.terms as term}
                      <option value={term.value}>
                        {term.label}{term.notation ? ` (${term.notation})` : ''}
                      </option>
                    {/each}
                  </select>
                  <small>Mehrfachauswahl mit Strg/Cmd oder Shift.</small>
                {/if}
              </div>
            {/each}

            <button type="button" class="small-button" onclick={addVocabularySource}>
              + Vocabulary hinzufuegen
            </button>

            <h3>Manuelle Tag-Filter (Key/Value)</h3>
            <p class="hint">
              Fuer eigene AMB/Nostr-Tag-Filter im Assistenten mit Scope pro Zeile (`global` oder `nur 30142`).
              `#t` wirkt immer global. Gleicher Key wird intern zusammengefuehrt.
            </p>

            {#if manualTagRows.length === 0}
              <small>Noch keine manuellen Filter vorhanden.</small>
            {/if}

            {#each manualTagRows as row (row.id)}
              <div class="manual-row">
                <select bind:value={row.key}>
                  {#each TAG_KEY_SUGGESTIONS as option}
                    <option value={option}>{option}</option>
                  {/each}
                </select>
                <input type="text" bind:value={row.value} placeholder="Wert" />
                <select
                  bind:value={row.scope}
                  title="Scope"
                  disabled={normalizeAmbFilterKey(row.key).trim().toLowerCase() === '#t'}
                >
                  <option value="amb">nur 30142</option>
                  <option value="global">global</option>
                </select>
                <button type="button" class="small-button muted" onclick={() => removeManualTagRow(row.id)}>
                  Entfernen
                </button>
              </div>
            {/each}

            <button type="button" class="small-button" onclick={addManualTagRow}>
              + Key/Value Zeile
            </button>
          </div>
        </details>

        <details class="accordion-item">
          <summary>AMB: Creator Filter (Person/Organisation)</summary>
          <div class="accordion-content">
            <p class="hint">
              Erzeugt AMB-Tagfilter `#creator:type`, `#creator:name` und `#creator:id` (kommasepariert als ODER).
            </p>

            <div class="creator-type-grid">
              <label class="creator-type-option">
                <input type="checkbox" bind:checked={creatorIncludePerson} />
                Person
              </label>
              <label class="creator-type-option">
                <input type="checkbox" bind:checked={creatorIncludeOrganization} />
                Organization
              </label>
            </div>

            <div class="form-group tight">
              <label for="creatorNames">Creator Name(n) (optional)</label>
              <input
                type="text"
                id="creatorNames"
                bind:value={creatorNames}
                placeholder="Max Mustermann, Universitaet XY"
              />
            </div>

            <div class="form-group tight">
              <label for="creatorIds">Creator ID/URL(s) (optional)</label>
              <input
                type="text"
                id="creatorIds"
                bind:value={creatorIds}
                placeholder="https://orcid.org/..., https://d-nb.info/gnd/..."
              />
            </div>
          </div>
        </details>

        <details class="accordion-item">
          <summary>AMB: Publisher Filter (Organisation)</summary>
          <div class="accordion-content">
            <p class="hint">
              Erzeugt AMB-Tagfilter `#publisher:type`, `#publisher:name` und `#publisher:id` (kommasepariert als ODER).
            </p>

            <div class="publisher-type-grid">
              <label class="publisher-type-option">
                <input type="checkbox" bind:checked={publisherIncludeOrganization} />
                Organization
              </label>
            </div>

            <div class="form-group tight">
              <label for="publisherNames">Publisher Name(n) (optional)</label>
              <input
                type="text"
                id="publisherNames"
                bind:value={publisherNames}
                placeholder="Universitaet XY, Zentrale OER-Stelle"
              />
            </div>

            <div class="form-group tight">
              <label for="publisherIds">Publisher ID/URL(s) (optional)</label>
              <input
                type="text"
                id="publisherIds"
                bind:value={publisherIds}
                placeholder="https://example.org/publisher/xyz, https://orcid.org/..."
              />
            </div>

            <small>
              `publisher:type` wird auf `Organization` gesetzt, wenn aktiviert.
            </small>
          </div>
        </details>

        <details class="accordion-item">
          <summary>Calendar: Zeitbereich</summary>
          <div class="accordion-content">
            <div class="calendar-range-grid">
              <div>
                <label for="calendarStartDate">Startdatum</label>
                <input type="date" id="calendarStartDate" bind:value={calendarStartDate} />
              </div>
              <div>
                <label for="calendarEndDate">Enddatum</label>
                <input type="date" id="calendarEndDate" bind:value={calendarEndDate} />
              </div>
            </div>
            <small>Filtert nur Calendar Events anhand ihres `start`-Datums.</small>
          </div>
        </details>

        <details class="accordion-item">
          <summary>Erweiterte Filter (Raw JSON)</summary>
          <div class="accordion-content">
            <label for="rawTags">Zusatz-Filter als JSON Array</label>
            <textarea
              id="rawTags"
              bind:value={rawTags}
              rows="4"
              placeholder='[["#teaches:id","religion"],["#educationalLevel","primary"]]'
            ></textarea>
            {#if tagJsonError}
              <small class="error-text">{tagJsonError}</small>
            {/if}
          </div>
        </details>

        <div class="form-group">
          <div class="form-label">Aktive Tag-Filter (generiert)</div>
          <pre class="code-preview">{effectiveTagsPreview}</pre>
        </div>
      {/if}

      {#if activeFormTab === 'design'}
        <div class="form-group">
          <label for="theme">Theme</label>
          <select id="theme" bind:value={theme}>
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div class="design-block">
          <div class="design-title">Farben</div>
          <div class="form-group tight">
            <label for="accentColor">Accent-Farbe</label>
            <div class="color-row">
              <input type="color" id="accentColor" bind:value={accentColor} />
              <input type="text" bind:value={accentColor} placeholder="#7e22ce" />
            </div>
            <small>Wird fuer aktive Chips und Links im Widget genutzt.</small>
          </div>
        </div>

        <div class="design-block">
          <div class="design-title">Grid</div>
          <div class="form-group tight">
            <label for="cardMinWidth">Kartenbreite (px)</label>
            <input
              type="number"
              id="cardMinWidth"
              bind:value={cardMinWidth}
              min="180"
              max="520"
              step="10"
            />
          </div>
          <div class="form-group tight">
            <label for="maxColumns">Max. Spalten (optional)</label>
            <input
              type="number"
              id="maxColumns"
              bind:value={maxColumns}
              min="1"
              max="8"
              step="1"
              placeholder="leer = automatisch"
            />
            <small>Begrenzt die Spaltenzahl bei grossen Screens.</small>
          </div>
        </div>

        <div class="design-block">
          <div class="design-title">Paging</div>
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" bind:checked={showLoadMore} />
              Button "Mehr laden" anzeigen
            </label>
          </div>
          <div class="form-group tight">
            <label for="loadMoreStep">Nachladen pro Klick</label>
            <input
              type="number"
              id="loadMoreStep"
              bind:value={loadMoreStep}
              min="1"
              max="200"
              step="1"
              placeholder="leer = Treffer pro Seite"
            />
            <small>Leer bedeutet: gleich viele wie "Treffer pro Seite".</small>
          </div>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" bind:checked={showSearch} />
            Suchleiste anzeigen
          </label>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" bind:checked={showCategories} />
            Tag Wolke anzeigen
          </label>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" bind:checked={showOverlayChips} />
            Overlay Chips (AMB)
          </label>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" bind:checked={showKeywords} />
            Keywords (AMB)
          </label>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" bind:checked={showAuthor} />
            Autoren anzeigen
          </label>
        </div>
      {/if}
    </div>
    
    <div class="preview-section">
      <div class="preview-header">
        <h2>Vorschau</h2>
        <div class="preview-actions">
          <button class="apply-button" onclick={applyPreview} disabled={!NostrFeedWidget}>
            Anwenden
          </button>
          <label class="auto-preview">
            <input type="checkbox" bind:checked={autoPreview} />
            Auto (500ms)
          </label>
          <button class="reset-button" onclick={resetForm}>
            Zurücksetzen
          </button>
        </div>
      </div>
      <div class="preview-container" bind:this={previewContainer}></div>
    </div>
  </div>
  
  <div class="code-section">
    <h2>Generierter Code</h2>
    <pre class="code-block">{generatedCode}</pre>
    <div class="code-actions">
      <button class="copy-button" onclick={copyToClipboard}>
        Code kopieren
      </button>
      <button class="copy-button secondary" onclick={openTestPage}>
        Auf Testseite öffnen
      </button>
    </div>
  </div>
</div>

<style>
  .widget-builder {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
  }
  
  h1 {
    text-align: center;
    margin-bottom: 30px;
    color: #333;
  }
  
  h2 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #333;
  }

  h3 {
    margin: 12px 0 10px;
    color: #1f2937;
    font-size: 15px;
  }
  
  .builder-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 30px;
  }
  
  @media (max-width: 900px) {
    .builder-layout {
      grid-template-columns: 1fr;
    }
  }
  
  .form-section {
    background: #f9fafb;
    padding: 20px;
    border-radius: 8px;
  }

  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .tab-button {
    border: 1px solid #d1d5db;
    background: #ffffff;
    color: #111827;
    padding: 8px 12px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .tab-button.active {
    background: #7e22ce;
    border-color: #7e22ce;
    color: #ffffff;
  }

  .design-block {
    padding: 10px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #ffffff;
    margin-bottom: 14px;
  }

  .design-title {
    font-size: 13px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 10px;
  }

  .color-row {
    display: grid;
    grid-template-columns: 52px 1fr;
    gap: 8px;
    align-items: center;
  }

  .color-row input[type='color'] {
    width: 52px;
    height: 36px;
    padding: 0;
    border-radius: 6px;
    border: 1px solid #d1d5db;
  }
  
  .form-group {
    margin-bottom: 20px;
  }

  .form-group.tight {
    margin-bottom: 0;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: #374151;
  }

  .form-label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: #374151;
  }
  
  .form-group input,
  .form-group select,
  .accordion-content textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    box-sizing: border-box;
  }
  
  .form-group input:focus,
  .form-group select:focus,
  .accordion-content textarea:focus {
    outline: none;
    border-color: #7e22ce;
  }
  
  .form-group small,
  small {
    display: block;
    margin-top: 5px;
    color: #6b7280;
    font-size: 12px;
  }
  
  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: normal;
  }
  
  .checkbox-group input {
    width: auto;
  }

  .accordion-item {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #ffffff;
    margin-bottom: 14px;
    overflow: hidden;
  }

  .accordion-item summary {
    cursor: pointer;
    padding: 12px 14px;
    font-weight: 700;
    color: #1f2937;
    list-style: none;
  }

  .accordion-item summary::-webkit-details-marker {
    display: none;
  }

  .accordion-content {
    border-top: 1px solid #e5e7eb;
    padding: 12px 14px 14px;
    display: grid;
    gap: 12px;
  }

  .hint {
    margin: 0;
    font-size: 13px;
    color: #4b5563;
  }

  .vocab-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px;
    background: #f8fafc;
    display: grid;
    gap: 8px;
  }

  .vocab-grid {
    display: grid;
    gap: 8px;
    grid-template-columns: 1fr 170px;
  }

  .vocab-grid-url {
    grid-template-columns: 1fr auto;
  }

  .vocab-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .vocab-card select[multiple] {
    width: 100%;
    min-height: 150px;
    padding: 8px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
  }

  .manual-row {
    display: grid;
    grid-template-columns: 190px 1fr 130px auto;
    gap: 8px;
    align-items: center;
  }

  .creator-type-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .creator-type-option {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: #1f2937;
  }

  .creator-type-option input {
    width: auto;
  }

  .publisher-type-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .publisher-type-option {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: #1f2937;
  }

  .publisher-type-option input {
    width: auto;
  }

  .calendar-range-grid {
    display: grid;
    gap: 10px;
    grid-template-columns: 1fr 1fr;
  }

  .small-button {
    border: none;
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    background: #7e22ce;
    color: #fff;
  }

  .small-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .small-button.muted {
    background: #e5e7eb;
    color: #111827;
  }

  .error-text {
    color: #b91c1c;
  }

  .code-preview {
    margin: 0;
    padding: 10px;
    border-radius: 6px;
    background: #111827;
    color: #e5e7eb;
    font-size: 12px;
    line-height: 1.4;
    max-height: 220px;
    overflow: auto;
  }
  
  .preview-section {
    background: #f9fafb;
    padding: 20px;
    border-radius: 8px;
  }

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .preview-header h2 {
    margin-bottom: 0;
  }

  .preview-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .auto-preview {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #374151;
    user-select: none;
  }

  .auto-preview input {
    width: auto;
  }

  .apply-button,
  .reset-button {
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .apply-button {
    background: #7e22ce;
    color: white;
  }

  .apply-button:hover {
    background: #6b21a8;
  }

  .apply-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .reset-button {
    background: #e5e7eb;
    color: #111827;
  }

  .reset-button:hover {
    background: #d1d5db;
  }
  
  .preview-container {
    min-height: 300px;
    background: white;
    border-radius: 8px;
    padding: 20px;
  }
  
  .code-section {
    background: #f9fafb;
    padding: 20px;
    border-radius: 8px;
  }
  
  .code-block {
    background: #1f2937;
    color: #f9fafb;
    padding: 20px;
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    margin: 0 0 20px 0;
  }
  
  .copy-button {
    background: #7e22ce;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .copy-button:hover {
    background: #6b21a8;
  }

  .copy-button.secondary {
    background: #e5e7eb;
    color: #111827;
  }

  .copy-button.secondary:hover {
    background: #d1d5db;
  }

  .code-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  @media (max-width: 700px) {
    .vocab-grid,
    .vocab-grid-url,
    .manual-row,
    .calendar-range-grid {
      grid-template-columns: 1fr;
    }

    .vocab-actions {
      justify-content: flex-start;
      flex-wrap: wrap;
    }
  }
</style>

