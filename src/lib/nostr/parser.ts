/**
 * Event Parser
 * Parst Nostr Events und extrahiert Metadaten
 */

import type { 
  NostrEvent, 
  AMBMetadata, 
  CalendarEvent, 
  ArticleMetadata,
  NoteMetadata,
  ProfileMetadata, 
  ParsedEvent 
} from './types.js';
import { encodeNaddr, encodeNevent, encodeNprofile } from './nip19.js';

function isAllDigits(value: string): boolean {
  return /^[0-9]+$/.test(value);
}

/**
 * AMB-NIP (Kind 30142) Parser
 * Extrahiert Metadaten aus Tags mit JSON-Flattening
 */
export function parseAMBEvent(event: NostrEvent): AMBMetadata {
  const metadata: AMBMetadata = {};
  
  event.tags.forEach(tag => {
    const [key, value, _relay, role] = tag;
    
    // JSON-Flattening mit `:` als Trennzeichen
    if (key.startsWith('#')) {
      const jsonKey = key.slice(1);
      
      // Array-Werte (z.B. #teaches, #assesses)
      if (['teaches', 'assesses', 'requires', 'audience', 'inLanguage', 'keywords', 'subject', 'about', 'contributor'].includes(jsonKey)) {
        if (!metadata[jsonKey]) {
          metadata[jsonKey] = [];
        }
        (metadata[jsonKey] as string[]).push(value);
      } 
      // Einzelne Werte
      else {
        metadata[jsonKey] = value;
      }
    }
    // Standard-Tags ohne #
    else if (['d', 'title', 'name', 'summary', 'description', 'image', 'url', 'license', 'copyrightHolder', 'creator', 'format', 'encodingFormat', 'fileFormat', 'size', 'educationalFramework', 'version', 'isBasedOn', 'learningResourceType'].includes(key)) {
      metadata[key] = value;
    }
    // Nostr-native creators/contributors
    else if (key === 'p' && role) {
      if (role === 'creator') {
        if (!metadata.creatorPubkeys) metadata.creatorPubkeys = [];
        metadata.creatorPubkeys.push(value);
      } else if (role === 'contributor') {
        if (!metadata.contributorPubkeys) metadata.contributorPubkeys = [];
        metadata.contributorPubkeys.push(value);
      }
    }
  });
  
  // Fallback: Content als Beschreibung
  if (!metadata.summary && !metadata.description && event.content) {
    metadata.summary = event.content;
  }
  
  return metadata;
}

/**
 * NIP-52 Calendar Event Parser (shared tag extraction)
 */
function parseCalendarEventBase(event: NostrEvent): CalendarEvent {
  const calendarEvent: CalendarEvent = { content: event.content };
  
  event.tags.forEach(tag => {
    const [key, value, relay, role] = tag;
    
    switch (key) {
      case 'd':
        calendarEvent.d = value;
        break;
      case 'title':
        calendarEvent.title = value;
        calendarEvent.name = value;
        break;
      case 'name':
        calendarEvent.name = value;
        if (!calendarEvent.title) {
          calendarEvent.title = value;
        }
        break;
      case 'summary':
        calendarEvent.summary = value;
        break;
      case 'description':
        calendarEvent.description = value;
        break;
      case 'image':
        calendarEvent.image = value;
        break;
      case 'location':
        calendarEvent.location = value;
        break;
      case 'g':
        calendarEvent.g = value;
        break;
      case 'start':
        calendarEvent.start = value;
        break;
      case 'end':
        calendarEvent.end = value;
        break;
      case 'start_t':
        calendarEvent.start_t = value;
        break;
      case 'end_t':
        calendarEvent.end_t = value;
        break;
      case 'start_tzid':
      case 'start_tz':
        calendarEvent.start_tzid = value;
        break;
      case 'end_tzid':
      case 'end_tz':
        calendarEvent.end_tzid = value;
        break;
      case 'status':
        calendarEvent.status = value;
        break;
      case 'rsvp':
        calendarEvent.rsvp = value === '1' || value === 'true';
        break;
      case 'p':
        if (!calendarEvent.participants) {
          calendarEvent.participants = [];
        }
        calendarEvent.participants.push({ pubkey: value, relay, role });
        break;
      case 't':
        if (!calendarEvent.tags) {
          calendarEvent.tags = [];
        }
        calendarEvent.tags.push(value);
        break;
    }
  });
  
  if (!calendarEvent.title && calendarEvent.name) {
    calendarEvent.title = calendarEvent.name;
  }

  return calendarEvent;
}

/**
 * NIP-52 Calendar Event Parser (Kind 31922: date-based)
 * `start` / `end` are ISO dates (YYYY-MM-DD)
 */
export function parseCalendarEventDate(event: NostrEvent): CalendarEvent {
  const calendarEvent = parseCalendarEventBase(event);
  // Ensure we keep ISO date strings as-is (no implicit number parsing)
  if (typeof calendarEvent.start === 'number') {
    calendarEvent.start = String(calendarEvent.start);
  }
  if (typeof calendarEvent.end === 'number') {
    calendarEvent.end = String(calendarEvent.end);
  }
  return calendarEvent;
}

/**
 * NIP-52 Calendar Event Parser (Kind 31923: time-based)
 * `start` / `end` are Unix timestamps (seconds)
 */
export function parseCalendarEventTime(event: NostrEvent): CalendarEvent {
  const calendarEvent = parseCalendarEventBase(event);

  if (typeof calendarEvent.start === 'string' && isAllDigits(calendarEvent.start)) {
    calendarEvent.start = Number(calendarEvent.start);
  }
  if (typeof calendarEvent.end === 'string' && isAllDigits(calendarEvent.end)) {
    calendarEvent.end = Number(calendarEvent.end);
  }

  return calendarEvent;
}

/**
 * Legacy wrapper for calendar events (Kind 31922, 31923)
 */
export function parseCalendarEvent(event: NostrEvent): CalendarEvent {
  return event.kind === 31922 ? parseCalendarEventDate(event) : parseCalendarEventTime(event);
}

/**
 * Profil-Metadaten Parser (Kind 0)
 */
export function parseProfileEvent(event: NostrEvent): ProfileMetadata {
  try {
    return JSON.parse(event.content) as ProfileMetadata;
  } catch (error) {
    console.error('[Parser] Failed to parse profile metadata:', error);
    return {};
  }
}

/**
 * Artikel Parser (Kind 30023, 30029)
 */
export function parseArticleEvent(event: NostrEvent): ArticleMetadata {
  const article: ArticleMetadata = {};
  
  event.tags.forEach(tag => {
    const [key, value] = tag;
    
    switch (key) {
      case 'd':
        article.d = value;
        break;
      case 'title':
        article.title = value;
        article.name = value;
        break;
      case 'summary':
        article.summary = value;
        article.description = value;
        break;
      case 'image':
        article.image = value;
        break;
      case 'url':
        article.url = value;
        break;
      case 'published_at':
        article.publishedAt = parseInt(value, 10);
        break;
    }
  });
  
  // Fallback: Content als Zusammenfassung
  if (!article.summary && event.content) {
    article.summary = event.content.slice(0, 200);
    article.description = article.summary;
  }
  if (!article.title && event.content) {
    const firstLine = event.content.split('\n').map(l => l.trim()).find(Boolean);
    if (firstLine) {
      article.title = firstLine.slice(0, 80);
      article.name = article.title;
    }
  }
  
  return article;
}

export function parseNoteEvent(event: NostrEvent): NoteMetadata {
  const note: NoteMetadata = {};
  const content = (event.content || '').trim();
  const firstLine = content.split('\n').map(l => l.trim()).find(Boolean) || '';
  if (firstLine) {
    note.title = firstLine.slice(0, 80);
    note.name = note.title;
  }
  if (content) {
    note.description = content;
    note.summary = content.length > 200 ? content.slice(0, 200) : content;
  }
  return note;
}

/**
 * Event-Typ bestimmen
 */
export function getEventType(event: NostrEvent): ParsedEvent['type'] {
  switch (event.kind) {
    case 30142:
      return 'amb';
    case 31922:
    case 31923:
      return 'calendar';
    case 0:
      return 'profile';
    case 30023:
    case 30029:
      return 'article';
    case 1:
      return 'note';
    default:
      return 'note';
  }
}

type MetadataParser = (event: NostrEvent) => AMBMetadata | CalendarEvent | ProfileMetadata | ArticleMetadata | NoteMetadata;

const metadataParsersByKind: Partial<Record<NostrEvent['kind'], MetadataParser>> = {
  30142: parseAMBEvent,
  31922: parseCalendarEventDate,
  31923: parseCalendarEventTime,
  0: parseProfileEvent,
  30023: parseArticleEvent,
  30029: parseArticleEvent,
  1: parseNoteEvent
};

function firstTagValue(event: NostrEvent, key: string): string | undefined {
  const found = event.tags.find(t => t[0] === key);
  return found?.[1];
}

function computeNostrUri(event: NostrEvent): string | undefined {
  try {
    if (event.kind === 0) {
      return `nostr:${encodeNprofile(event.pubkey)}`;
    }
    if (event.kind === 1) {
      return `nostr:${encodeNevent(event.id)}`;
    }
    if (event.kind === 30142 || event.kind === 31922 || event.kind === 31923 || event.kind === 30023 || event.kind === 30029) {
      const d = firstTagValue(event, 'd');
      if (!d) return undefined;
      return `nostr:${encodeNaddr(event.kind, event.pubkey, d)}`;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/**
 * Event parsen und Metadaten extrahieren
 */
export function parseEvent(event: NostrEvent): ParsedEvent {
  const type = getEventType(event);
  const parser = metadataParsersByKind[event.kind];
  const metadata = parser ? parser(event) : null;
  
  return {
    event,
    metadata,
    type,
    nostrUri: computeNostrUri(event)
  };
}

/**
 * Mehrere Events parsen
 */
export function parseEvents(events: NostrEvent[]): ParsedEvent[] {
  return events.map(parseEvent);
}

/**
 * Profil-Metadaten aus Profil-Events extrahieren
 */
export function extractProfiles(events: NostrEvent[]): Map<string, ProfileMetadata> {
  const profiles = new Map<string, ProfileMetadata>();
  
  events
    .filter(event => event.kind === 0)
    .forEach(event => {
      const profile = parseProfileEvent(event);
      profiles.set(event.pubkey, profile);
    });
  
  return profiles;
}

/**
 * Events mit Profilen anreichern
 */
export function enrichWithProfiles(events: ParsedEvent[], profiles: Map<string, ProfileMetadata>): ParsedEvent[] {
  return events.map(parsedEvent => ({
    ...parsedEvent,
    author: profiles.get(parsedEvent.event.pubkey)
  }));
}
