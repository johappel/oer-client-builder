/**
 * Event Parser
 * Parst Nostr Events und extrahiert Metadaten
 */

import type { 
  NostrEvent, 
  AMBMetadata, 
  CalendarEvent, 
  ProfileMetadata, 
  ParsedEvent 
} from './types.js';

/**
 * AMB-NIP (Kind 30142) Parser
 * Extrahiert Metadaten aus Tags mit JSON-Flattening
 */
export function parseAMBEvent(event: NostrEvent): AMBMetadata {
  const metadata: AMBMetadata = {};
  
  event.tags.forEach(tag => {
    const [key, value] = tag;
    
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
    else if (['title', 'name', 'summary', 'description', 'image', 'url', 'license', 'copyrightHolder', 'creator', 'format', 'encodingFormat', 'fileFormat', 'size', 'educationalFramework', 'version', 'isBasedOn'].includes(key)) {
      metadata[key] = value;
    }
  });
  
  // Fallback: Content als Beschreibung
  if (!metadata.summary && !metadata.description && event.content) {
    metadata.summary = event.content;
  }
  
  return metadata;
}

/**
 * NIP-52 Calendar Event Parser (Kind 31922, 31923)
 */
export function parseCalendarEvent(event: NostrEvent): CalendarEvent {
  const calendarEvent: CalendarEvent = {};
  
  event.tags.forEach(tag => {
    const [key, value] = tag;
    
    switch (key) {
      case 'name':
        calendarEvent.name = value;
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
      case 'start':
        calendarEvent.start = parseInt(value, 10);
        break;
      case 'end':
        calendarEvent.end = parseInt(value, 10);
        break;
      case 'start_t':
        calendarEvent.start_t = value;
        break;
      case 'end_t':
        calendarEvent.end_t = value;
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
        calendarEvent.participants.push(value);
        break;
    }
  });
  
  return calendarEvent;
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
export function parseArticleEvent(event: NostrEvent): { title?: string; summary?: string; image?: string; url?: string; publishedAt?: number } {
  const article: { title?: string; summary?: string; image?: string; url?: string; publishedAt?: number } = {};
  
  event.tags.forEach(tag => {
    const [key, value] = tag;
    
    switch (key) {
      case 'title':
        article.title = value;
        break;
      case 'summary':
        article.summary = value;
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
  }
  
  return article;
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

/**
 * Event parsen und Metadaten extrahieren
 */
export function parseEvent(event: NostrEvent): ParsedEvent {
  const type = getEventType(event);
  let metadata: AMBMetadata | CalendarEvent | ProfileMetadata | null = null;
  
  switch (type) {
    case 'amb':
      metadata = parseAMBEvent(event);
      break;
    case 'calendar':
      metadata = parseCalendarEvent(event);
      break;
    case 'profile':
      metadata = parseProfileEvent(event);
      break;
    case 'article':
      metadata = parseArticleEvent(event);
      break;
    case 'note':
      metadata = null;
      break;
  }
  
  return {
    event,
    metadata,
    type
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
