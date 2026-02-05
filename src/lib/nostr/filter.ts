/**
 * Filter Engine
 * Two-Level Filtering: Institute Pre-Filters + User Additional Filters
 */

import type { ParsedEvent, FilterConfig } from './types.js';

/**
 * Prüft, ob ein Event einem einzelnen Filter entspricht
 */
export function matchesFilter(event: ParsedEvent, filter: string[]): boolean {
  if (filter.length === 0) return true;
  
  const [key, ...values] = filter;
  
  // Tag-basierte Filter
  if (key.startsWith('#')) {
    const tagKey = key.slice(1);
    const tagValues = event.event.tags
      .filter(t => t[0] === tagKey)
      .map(t => t[1]);
    
    return values.some(value => tagValues.includes(value));
  }
  
  // Autor-basierte Filter
  if (key === 'authors') {
    return values.includes(event.event.pubkey);
  }
  
  // Kind-basierte Filter
  if (key === 'kinds') {
    return values.includes(String(event.event.kind));
  }
  
  // Suchbegriff in Metadaten
  if (key === 'search') {
    const searchTerm = values.join(' ').toLowerCase();
    const metadata = event.metadata;
    
    if (!metadata) return false;
    
    // Metadaten basierend auf Event-Typ behandeln
    let searchableText = '';
    
    if (event.type === 'amb') {
      const ambMetadata = metadata as any;
      searchableText = [
        ambMetadata.title || ambMetadata.name || '',
        ambMetadata.summary || ambMetadata.description || '',
        ...(ambMetadata.keywords || []),
        ...(ambMetadata.subject || []),
        ...(ambMetadata.about || [])
      ].join(' ');
    } else if (event.type === 'calendar') {
      const calendarMetadata = metadata as any;
      searchableText = [
        calendarMetadata.title || calendarMetadata.name || '',
        calendarMetadata.summary || calendarMetadata.description || calendarMetadata.content || '',
        calendarMetadata.location || ''
      ].join(' ');
    } else if (event.type === 'article') {
      const articleMetadata = metadata as any;
      searchableText = [
        articleMetadata.title || '',
        articleMetadata.summary || ''
      ].join(' ');
    } else if (event.type === 'profile') {
      const profileMetadata = metadata as any;
      searchableText = [
        profileMetadata.name || profileMetadata.display_name || '',
        profileMetadata.about || ''
      ].join(' ');
    } else if (event.type === 'note') {
      const noteMetadata = metadata as any;
      searchableText = [
        noteMetadata.title || noteMetadata.name || '',
        noteMetadata.summary || '',
        noteMetadata.description || '',
        event.event.content || ''
      ].join(' ');
    } else {
      // Note: Content durchsuchen
      searchableText = event.event.content || '';
    }
    
    return searchableText.toLowerCase().includes(searchTerm);
  }
  
  return false;
}

/**
 * Prüft, ob ein Event allen Filtern entspricht (AND-Logik)
 */
export function matchesAllFilters(event: ParsedEvent, filters: string[][]): boolean {
  if (filters.length === 0) return true;
  
  return filters.every(filter => matchesFilter(event, filter));
}

/**
 * Prüft, ob ein Event mindestens einem Filter entspricht (OR-Logik)
 */
export function matchesAnyFilter(event: ParsedEvent, filters: string[][]): boolean {
  if (filters.length === 0) return true;
  
  return filters.some(filter => matchesFilter(event, filter));
}

/**
 * Two-Level Filtering
 * Institute Pre-Filters (fix) + User Additional Filters (optional)
 */
export function applyTwoLevelFilter(
  events: ParsedEvent[],
  config: FilterConfig
): ParsedEvent[] {
  const { instituteFilters, userFilters, searchQuery, selectedCategories, selectedAuthors } = config;
  
  // Schritt 1: Institute Pre-Filters anwenden (fix)
  let filtered = events.filter(event => matchesAllFilters(event, instituteFilters));
  
  // Schritt 2: User Additional Filters anwenden (optional)
  if (userFilters.length > 0) {
    filtered = filtered.filter(event => matchesAllFilters(event, userFilters));
  }
  
  // Schritt 3: Suchbegriff anwenden
  if (searchQuery && searchQuery.trim()) {
    const searchFilter: string[] = ['search', searchQuery.trim()];
    filtered = filtered.filter(event => matchesFilter(event, searchFilter));
  }
  
  // Schritt 4: Kategorien anwenden
  if (selectedCategories && selectedCategories.length > 0) {
    filtered = filtered.filter(event => {
      const tags = event.event.tags.filter(t => t[0] === 't').map(t => t[1]);
      return selectedCategories.some(cat => tags.includes(cat));
    });
  }
  
  // Schritt 5: Autoren anwenden
  if (selectedAuthors && selectedAuthors.length > 0) {
    filtered = filtered.filter(event => selectedAuthors.includes(event.event.pubkey));
  }
  
  return filtered;
}

/**
 * Filter-Konfiguration erstellen
 */
export function createFilterConfig(
  instituteFilters: string[][],
  userFilters: string[][] = [],
  searchQuery?: string,
  selectedCategories?: string[],
  selectedAuthors?: string[]
): FilterConfig {
  return {
    instituteFilters,
    userFilters,
    searchQuery,
    selectedCategories,
    selectedAuthors
  };
}

/**
 * Filter aus Widget-Konfiguration erstellen
 */
export function createFiltersFromConfig(
  authors?: string[],
  tags?: string[][]
): string[][] {
  const filters: string[][] = [];
  
  if (authors && authors.length > 0) {
    filters.push(['authors', ...authors]);
  }
  
  if (tags && tags.length > 0) {
    filters.push(...tags);
  }
  
  return filters;
}

/**
 * Verfügbare Kategorien aus Events extrahieren
 */
export function extractCategories(events: ParsedEvent[]): string[] {
  const categories = new Set<string>();
  
  events.forEach(event => {
    event.event.tags
      .filter(t => t[0] === 't')
      .forEach(t => categories.add(t[1]));
  });
  
  return Array.from(categories).sort();
}

/**
 * Verfügbare Autoren aus Events extrahieren
 */
export function extractAuthors(events: ParsedEvent[]): string[] {
  const authors = new Set<string>();
  
  events.forEach(event => {
    authors.add(event.event.pubkey);
  });
  
  return Array.from(authors);
}

/**
 * Filter-Statistik
 */
export interface FilterStats {
  total: number;
  filtered: number;
  instituteFiltered: number;
  userFiltered: number;
  searchFiltered: number;
  categoryFiltered: number;
  authorFiltered: number;
}

/**
 * Filter-Statistik berechnen
 */
export function calculateFilterStats(
  events: ParsedEvent[],
  config: FilterConfig
): FilterStats {
  const { instituteFilters, userFilters, searchQuery, selectedCategories, selectedAuthors } = config;
  
  const total = events.length;
  
  // Institute Pre-Filters
  const instituteFiltered = events.filter(event => matchesAllFilters(event, instituteFilters)).length;
  
  // User Additional Filters
  let afterInstitute = events.filter(event => matchesAllFilters(event, instituteFilters));
  const userFiltered = userFilters.length > 0 
    ? afterInstitute.filter(event => matchesAllFilters(event, userFilters)).length
    : instituteFiltered;
  
  // Suchbegriff
  let afterUser = userFilters.length > 0
    ? afterInstitute.filter(event => matchesAllFilters(event, userFilters))
    : afterInstitute;
  const searchFiltered = searchQuery && searchQuery.trim()
    ? afterUser.filter(event => {
        const searchFilter: string[] = ['search', searchQuery.trim()];
        return matchesFilter(event, searchFilter);
      }).length
    : userFiltered;
  
  // Kategorien
  let afterSearch = searchQuery && searchQuery.trim()
    ? afterUser.filter(event => {
        const searchFilter: string[] = ['search', searchQuery.trim()];
        return matchesFilter(event, searchFilter);
      })
    : afterUser;
  const categoryFiltered = selectedCategories && selectedCategories.length > 0
    ? afterSearch.filter(event => {
        const tags = event.event.tags.filter(t => t[0] === 't').map(t => t[1]);
        return selectedCategories.some(cat => tags.includes(cat));
      }).length
    : searchFiltered;
  
  // Autoren
  let afterCategories = selectedCategories && selectedCategories.length > 0
    ? afterSearch.filter(event => {
        const tags = event.event.tags.filter(t => t[0] === 't').map(t => t[1]);
        return selectedCategories.some(cat => tags.includes(cat));
      })
    : afterSearch;
  const authorFiltered = selectedAuthors && selectedAuthors.length > 0
    ? afterCategories.filter(event => selectedAuthors.includes(event.event.pubkey)).length
    : categoryFiltered;
  
  return {
    total,
    filtered: authorFiltered,
    instituteFiltered,
    userFiltered,
    searchFiltered,
    categoryFiltered,
    authorFiltered
  };
}
