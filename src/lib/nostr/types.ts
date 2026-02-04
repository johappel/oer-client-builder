/**
 * Nostr Event Types
 * Basierend auf Nostr Protocol und AMB-NIP (Kind 30142)
 */

export type NostrEventKind = 
  | 0      // Profil-Metadaten
  | 1      // Kurzer Text-Note
  | 30023  // Long-form Content (Artikel)
  | 30029  // Parameterized Replaceable Event (Artikel)
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
export interface CalendarEvent {
  name?: string;
  description?: string;
  image?: string;
  location?: string;
  start?: number; // Unix timestamp
  end?: number;   // Unix timestamp
  start_t?: string; // ISO 8601 time string
  end_t?: string;   // ISO 8601 time string
  status?: string;
  rsvp?: boolean;
  participants?: string[];
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
 * Geparstes Event mit Metadaten
 */
export interface ParsedEvent {
  event: NostrEvent;
  metadata: AMBMetadata | CalendarEvent | ProfileMetadata | null;
  type: 'amb' | 'calendar' | 'profile' | 'article' | 'note';
  author?: ProfileMetadata;
}

/**
 * Widget-Konfiguration
 */
export interface WidgetConfig {
  relays: string[];
  kinds: NostrEventKind[];
  authors: string[];
  tags: string[][];
  search: string;
  categories: string[];
  instituteFilters?: string[][];
  maxItems: number;
  showSearch: boolean;
  showCategories: boolean;
  showAuthor: boolean;
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
