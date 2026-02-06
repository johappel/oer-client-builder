/**
 * Nostr Event Types
 * Basierend auf Nostr Protocol und AMB-NIP (Kind 30142)
 */

export type NostrEventKind = 
  | 0      // Profil-Metadaten
  | 1      // Kurzer Text-Note
  | 30023  // Long-form Content (Artikel)
  | 30142  // AMB-NIP (OER Material)
  | 31922  // Calendar Event (date-based)
  | 31923; // Calendar Event (time-based)

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: NostrEventKind;
  tags: string[][];
  content: string;
  sig: string;
}

export interface NostrFilter {
  ids?: string[];
  authors?: string[];
  kinds?: NostrEventKind[];
  since?: number;
  until?: number;
  limit?: number;
  e?: string[]; // Event IDs
  p?: string[]; // Pubkeys
  t?: string[]; // Tags
  d?: string;   // Identifier
  search?: string; // Full-text search (NIP-50)
}

export interface NostrSubscription {
  id: string;
  filters: NostrFilter[];
}

export interface NostrMessage {
  type: 'EVENT' | 'EOSE' | 'NOTICE' | 'OK' | 'CLOSED';
  data?: any;
}

/**
 * AMB-NIP (Kind 30142) - Educational Metadata Profile
 */
export interface AMBMetadata {
  // Grundlegende Metadaten
  title?: string;
  name?: string;
  summary?: string;
  description?: string;
  image?: string;
  url?: string;
  d?: string;
  
  // Bildungsspezifische Metadaten
  educationalLevel?: string;
  educationalUse?: string;
  interactivityType?: string;
  learningResourceType?: string;
  typicalAgeRange?: string;
  timeRequired?: string;
  
  // Lernziele und Kompetenzen
  teaches?: string[];
  assesses?: string[];
  requires?: string[];
  
  // Kontext und Zielgruppe
  audience?: string[];
  inLanguage?: string[];
  keywords?: string[];
  
  // Lizenz und Rechte
  license?: string;
  copyrightHolder?: string;
  creator?: string;
  contributor?: string[];
  creatorPubkeys?: string[];
  contributorPubkeys?: string[];
  
  // Technische Metadaten
  format?: string;
  encodingFormat?: string;
  fileFormat?: string;
  size?: string;
  
  // Klassifikation
  subject?: string[];
  about?: string[];
  educationalFramework?: string;
  
  // Versionierung
  version?: string;
  isBasedOn?: string;
  
  // Zusätzliche Metadaten
  [key: string]: any;
}

/**
 * NIP-52 Calendar Event
 */
export interface CalendarParticipant {
  pubkey: string;
  relay?: string;
  role?: string;
}

export interface CalendarEvent {
  // Identity
  d?: string;

  // Content
  title?: string; // NIP-52: required (clients should treat as required)
  name?: string; // deprecated alias (some events still use it)
  content?: string; // event.content (required by NIP-52, may be empty string)
  summary?: string;
  description?: string; // optional tag-based description (some relays/clients)

  // Media / location
  image?: string;
  location?: string;
  url?: string; // primary external link (from "r" tag)
  externalRefs?: string[]; // "r" tags
  g?: string; // geohash

  // Time
  // Kind 31922: start/end are ISO dates (YYYY-MM-DD)
  // Kind 31923: start/end are Unix timestamps (seconds)
  start?: string | number;
  end?: string | number;
  start_t?: string; // legacy field (some clients)
  end_t?: string;   // legacy field (some clients)
  start_tzid?: string; // IANA TZ (e.g. Europe/Berlin)
  end_tzid?: string;   // IANA TZ (e.g. Europe/Berlin)

  // Misc
  status?: string;
  rsvp?: boolean;
  participants?: CalendarParticipant[];
  tags?: string[]; // "t" tags
}

/**
 * Profil-Metadaten (Kind 0)
 */
export interface ProfileMetadata {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  website?: string;
  lud16?: string;
  nip05?: string;
}

/**
 * Article Metadata (Kind 30023)
 */
export interface ArticleMetadata {
  title?: string;
  name?: string;
  summary?: string;
  description?: string;
  image?: string;
  url?: string;
  publishedAt?: number;
  d?: string;
}

export interface NoteMetadata {
  title?: string;
  name?: string;
  summary?: string;
  description?: string;
}

/**
 * Geparstes Event mit Metadaten
 */
export interface ParsedEvent {
  event: NostrEvent;
  metadata: AMBMetadata | CalendarEvent | ProfileMetadata | ArticleMetadata | NoteMetadata | null;
  type: 'amb' | 'calendar' | 'profile' | 'article' | 'note';
  author?: ProfileMetadata;
  nostrUri?: string;
}

/**
 * Widget-Konfiguration
 */
export interface WidgetConfig {
  relays: string[];
  kinds: NostrEventKind[];
  authors: string[];
  tags: string[][];
  ambTags?: string[][];
  calendarStartDate?: string;
  calendarEndDate?: string;
  search: string;
  categories: string[];
  instituteFilters?: string[][];
  maxItems: number;
  showSearch: boolean;
  showCategories: boolean;
  showAuthor: boolean;
  showOverlayChips?: boolean;
  showKeywords?: boolean;
  accentColor?: string;
  cardMinWidth?: number;
  maxColumns?: number;
  showLoadMore?: boolean;
  pageSize?: number;
  loadMoreStep?: number;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

/**
 * Filter-Konfiguration
 */
export interface FilterConfig {
  instituteFilters: string[][]; // Vordefinierte Filter (fix)
  userFilters: string[][];       // Zusätzliche Filter (optional)
  searchQuery?: string;
  selectedCategories?: string[];
  selectedAuthors?: string[];
}
