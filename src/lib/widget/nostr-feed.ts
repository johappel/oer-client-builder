/**
 * Nostr Feed Widget
 * Web Component (Custom Element) mit Shadow DOM
 * Zeigt Nostr Events in einem Grid an
 */

import type { WidgetConfig, ParsedEvent, ProfileMetadata } from '../nostr/types.js';
import { NostrClient } from '../nostr/client.js';
import { parseEvent, enrichWithProfiles, extractProfiles } from '../nostr/parser.js';
import { applyTwoLevelFilter, createFilterConfig, extractCategories, extractAuthors } from '../nostr/filter.js';
import { normalizePubkey, encodeNaddr, encodeNprofile, decodeNaddrKind } from '../nostr/nip19.js';
import { renderCard } from './card-renderers/index.js';

const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
    }

    .nostr-feed-container {
      width: 100%;
    }

    .search-bar {
      margin-bottom: 20px;
    }

    .search-input {
      width: 100%;
      padding: 12px 15px;
      font-size: 16px;
      border: 1px solid #ddd;
      border-radius: 25px;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      border-color: #7e22ce;
    }

    .categories {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }

    .category-chip {
      padding: 6px 12px;
      background: #f3f4f6;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }

    .category-chip:hover {
      background: #e5e7eb;
    }

    .category-chip.active {
      background: #7e22ce;
      color: white;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .card {
      border: 1px solid #eee;
      border-radius: 8px;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s;
      cursor: pointer;
    }

    .card:hover {
      transform: translateY(-3px);
    }

    .card-image {
      height: 160px;
      background-color: #f0f0f0;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ccc;
    }

    .card-content {
      padding: 15px;
    }

    .card-title {
      margin: 0 0 8px;
      font-size: 16px;
      color: #333;
      font-weight: 600;
    }

    .card-summary {
      margin: 0 0 15px;
      font-size: 14px;
      color: #666;
      line-height: 1.4;
      height: 40px;
      overflow: hidden;
    }

    .card-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }

    .card-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: #e5e7eb;
      background-size: cover;
      background-position: center;
    }

    .card-author {
      font-size: 12px;
      color: #666;
    }

    .card-type {
      display: inline-block;
      padding: 2px 8px;
      background: #f3f4f6;
      border-radius: 4px;
      font-size: 11px;
      color: #666;
      margin-bottom: 10px;
    }

    .card-date {
      font-size: 12px;
      color: #6b7280;
      margin: 0 0 10px;
    }

    .card-link {
      text-decoration: none;
      color: #7e22ce;
      font-size: 14px;
      font-weight: bold;
    }

    /* Calendar cards */
    .card-calendar .card-content {
      background: linear-gradient(135deg, #f97316, #ec4899);
      color: #fff;
    }

    .card-calendar .card-title {
      color: #fff;
      margin-bottom: 10px;
    }

    .calendar-title-date {
      font-weight: 500;
      opacity: 0.85;
      font-size: 0.9em;
    }

    .card-calendar .card-summary {
      color: rgba(255, 255, 255, 0.92);
      height: auto;
    }

    .card-calendar .card-author {
      color: rgba(255, 255, 255, 0.9);
    }

    .card-calendar .card-type {
      background: rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.9);
    }

    .card-calendar .card-link {
      color: #fff;
    }

    .calendar-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      width: 64px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
      background: #fff;
    }

    .calendar-badge-year {
      background: #ef4444;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 0;
      text-align: center;
    }

    .calendar-badge-day {
      color: #111827;
      font-size: 26px;
      font-weight: 800;
      line-height: 1.1;
      padding: 8px 0 4px;
      text-align: center;
    }

    .calendar-badge-month {
      background: #f3f4f6;
      color: #374151;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.12em;
      padding: 4px 0 6px;
      text-align: center;
    }

    .calendar-tags {
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
      max-width: 60%;
    }

    .calendar-tag {
      background: rgba(0, 0, 0, 0.55);
      color: #fff;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      line-height: 1.2;
      backdrop-filter: blur(4px);
    }

    /* OER cards */
    .card-amb .card-content {
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      color: #fff;
    }

    .card-amb .card-title {
      color: #fff;
      margin-bottom: 8px;
    }

    .card-amb .card-type {
      background: rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.9);
    }

    .card-amb .card-link {
      color: #fff;
    }

    .oer-creators {
      display: flex;
      gap: 6px;
      margin: 10px 0 0;
      flex-wrap: wrap;
    }

    .oer-credits {
      width: 100%;
      display: grid;
      gap: 6px;
      font-size: 12px;
      line-height: 1.35;
      opacity: 0.95;
    }

    .oer-credit-label {
      font-weight: 800;
      margin-right: 6px;
    }

    .oer-avatar {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      max-width: 100%;
      border: none;
      background: transparent;
      padding: 0;
      cursor: pointer;
      text-align: left;
    }

    .oer-avatar-img {
      width: 28px;
      height: 28px;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.92);
      background: rgba(255, 255, 255, 0.22);
      background-size: cover;
      background-position: center;
      border: 1px solid rgba(255, 255, 255, 0.25);
    }

    .oer-avatar-name {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.95);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }

    .oer-creators-text {
      margin: 6px 0 10px;
      font-size: 12px;
      opacity: 0.92;
    }

    .oer-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 8px 0 10px;
    }

    .oer-summary {
      color: rgba(255, 255, 255, 0.92);
      height: auto;
      margin-bottom: 10px;
    }

    .oer-keywords {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 10px;
    }

    .oer-chip {
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: rgba(0, 0, 0, 0.28);
      color: rgba(255, 255, 255, 0.92);
    }

    .oer-image-overlay {
      position: absolute;
      left: 10px;
      right: 10px;
      bottom: 10px;
      display: flex;
      gap: 8px;
      justify-content: flex-start;
      flex-wrap: wrap;
      pointer-events: none;
    }

    .oer-overlay-chip {
      background: rgba(0, 0, 0, 0.55);
      color: #fff;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      line-height: 1.2;
      backdrop-filter: blur(4px);
    }

    .event-meta {
      margin: 10px 0 12px;
      display: grid;
      gap: 8px;
      font-size: 13px;
    }

    .event-row {
      display: flex;
      align-items: center;
      gap: 10px;
      opacity: 0.95;
      word-break: break-word;
    }

    .event-row a {
      color: rgba(255, 255, 255, 0.95);
      text-decoration: underline;
    }

    .event-icon {
      width: 16px;
      height: 16px;
      fill: currentColor;
      opacity: 0.9;
      flex: 0 0 auto;
    }

    .loading {
      text-align: center;
      padding: 20px;
      color: #666;
      grid-column: 1 / -1;
    }

    .empty {
      text-align: center;
      padding: 40px;
      color: #666;
      grid-column: 1 / -1;
    }

    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }

    .modal.open {
      display: flex;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 20px;
      position: relative;
    }

    .modal-close {
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    }

    .modal-image {
      width: 100%;
      height: 300px;
      background-color: #f0f0f0;
      background-size: cover;
      background-position: center;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .modal-title {
      margin: 0 0 10px;
      font-size: 24px;
      color: #333;
    }

    .modal-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .modal-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #e5e7eb;
      background-size: cover;
      background-position: center;
    }

    .modal-author {
      font-size: 14px;
      color: #666;
    }

    .modal-description {
      line-height: 1.6;
      color: #333;
      white-space: pre-wrap;
    }

    .kv-row {
      margin: 10px 0;
    }

    .kv-label {
      font-weight: 600;
    }

    .person-link {
      border: none;
      background: transparent;
      color: #7e22ce;
      padding: 0;
      font: inherit;
      cursor: pointer;
    }

    .profile-list {
      margin: 10px 0 0;
      padding-left: 18px;
    }

    .profile-list button {
      border: none;
      background: transparent;
      padding: 0;
      color: inherit;
      cursor: pointer;
      text-align: left;
      font: inherit;
    }

    .profile-list button:hover {
      text-decoration: underline;
    }

    .modal-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 20px;
    }

    .modal-tag {
      padding: 4px 10px;
      background: #f3f4f6;
      border-radius: 16px;
      font-size: 12px;
      color: #666;
    }

    .modal-link {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 20px;
      background: #7e22ce;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
    }

    .modal-link:hover {
      background: #6b21a8;
    }

    /* Dark Mode */
    :host([theme="dark"]) .card {
      background: #1f2937;
      border-color: #374151;
    }

    :host([theme="dark"]) .card-title {
      color: #f9fafb;
    }

    :host([theme="dark"]) .card-summary {
      color: #9ca3af;
    }

    :host([theme="dark"]) .card-author {
      color: #9ca3af;
    }

    :host([theme="dark"]) .card-type {
      background: #374151;
      color: #9ca3af;
    }

    :host([theme="dark"]) .search-input {
      background: #1f2937;
      border-color: #374151;
      color: #f9fafb;
    }

    :host([theme="dark"]) .category-chip {
      background: #374151;
      color: #f9fafb;
    }

    :host([theme="dark"]) .category-chip:hover {
      background: #4b5563;
    }

    :host([theme="dark"]) .modal-content {
      background: #1f2937;
    }

    :host([theme="dark"]) .modal-title {
      color: #f9fafb;
    }

    :host([theme="dark"]) .modal-description {
      color: #e5e7eb;
    }

    :host([theme="dark"]) .modal-tag {
      background: #374151;
      color: #9ca3af;
    }
  </style>

  <div class="nostr-feed-container">
    <div class="search-bar" id="searchBar"></div>
    <div class="categories" id="categories"></div>
    <div class="grid" id="grid">
      <div class="loading">Verbinde mit Nostr...</div>
    </div>
  </div>

  <div class="modal" id="modal">
    <div class="modal-content">
      <button class="modal-close" id="modalClose">&times;</button>
      <div class="modal-image" id="modalImage"></div>
      <h2 class="modal-title" id="modalTitle"></h2>
      <div class="modal-meta">
        <div class="modal-avatar" id="modalAvatar"></div>
        <div class="modal-author" id="modalAuthor"></div>
      </div>
      <div class="modal-description" id="modalDescription"></div>
      <div class="modal-tags" id="modalTags"></div>
      <a class="modal-link" id="modalLink" target="_blank">Öffnen</a>
    </div>
  </div>
`;

const NJUMP_BASE = 'https://njump.edufeed.org/';
const KANBAN_CARDSBOARD_BASE = 'https://kanban.edufeed.org/cardsboard/';

export class NostrFeedWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private client: NostrClient | null = null;
  private events: ParsedEvent[] = [];
  private profiles: Map<string, ProfileMetadata> = new Map();
  private requestedProfiles: Set<string> = new Set();
  private pendingProfilePubkeys: Set<string> = new Set();
  private profileFetchTimer: number | null = null;
  private config!: WidgetConfig;
  private selectedCategories: string[] = [];
  private searchQuery = '';

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(TEMPLATE.content.cloneNode(true));
    // Config wird im connectedCallback geparst, damit Attribute verfügbar sind
  }

  connectedCallback(): void {
    console.log('[NostrFeedWidget] connectedCallback called');
    console.log('[NostrFeedWidget] relays attribute:', this.getAttribute('relays'));
    // Config hier parsen, damit Attribute verfügbar sind
    this.config = this.parseConfig();
    this.searchQuery = this.config.search || '';
    console.log('[NostrFeedWidget] parsed config:', this.config);
    this.setupEventListeners();
    this.connectToRelays();
    this.queueProfileFetch(this.config.authors || []);
  }

  disconnectedCallback(): void {
    this.client?.disconnect();
  }

  private parseConfig(): WidgetConfig {
    const relays = this.getAttribute('relays')?.split(',').map(r => r.trim()) || [];
    const kinds = (this.getAttribute('kinds')?.split(',').map(k => parseInt(k.trim(), 10)) || [30142, 31922, 1, 30023, 0]) as any;
    const rawAuthors = this.getAttribute('authors')?.split(',').map(a => a.trim()).filter(Boolean) || [];
    const authors = rawAuthors
      .map((a) => normalizePubkey(a))
      .filter((a): a is string => Boolean(a));
    if (rawAuthors.length > 0 && authors.length === 0) {
      console.warn('[NostrFeedWidget] authors attribute provided but none could be parsed (expected hex or npub).', rawAuthors);
    }
    const tagsAttr = this.getAttribute('tags');
    const tags: string[][] = tagsAttr ? JSON.parse(tagsAttr) : [];
    const search = this.getAttribute('search') || '';
    const categoriesAttr = this.getAttribute('categories');
    const categories = categoriesAttr ? JSON.parse(categoriesAttr) : [];
    const maxItems = parseInt(this.getAttribute('maxItems') || '50', 10);
    const showSearch = this.getAttribute('showSearch') !== 'false';
    const showCategories = this.getAttribute('showCategories') !== 'false';
    const showAuthor = this.getAttribute('showAuthor') !== 'false';
    const theme = (this.getAttribute('theme') as 'light' | 'dark' | 'auto') || 'auto';
    const language = this.getAttribute('language') || 'de';

    return {
      relays,
      kinds,
      authors,
      tags,
      search,
      categories,
      maxItems,
      showSearch,
      showCategories,
      showAuthor,
      theme,
      language
    };
  }

  private setupEventListeners(): void {
    const searchInput = this.shadow.getElementById('searchBar') as HTMLElement;
    const modal = this.shadow.getElementById('modal') as HTMLElement;
    const modalClose = this.shadow.getElementById('modalClose') as HTMLElement;

    // Suchleiste
    if (this.config.showSearch) {
      const input = document.createElement('input');
      input.className = 'search-input';
      input.placeholder = 'Suchen... (ODER: Begriff1, Begriff2)';
      input.value = this.searchQuery;
      input.addEventListener('input', (e) => {
        this.searchQuery = (e.target as HTMLInputElement).value;
        this.renderGrid();
      });
      searchInput.appendChild(input);
    } else {
      searchInput.style.display = 'none';
    }

    // Modal schließen
    modalClose.addEventListener('click', () => {
      modal.classList.remove('open');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  }

  private connectToRelays(): void {
    console.log('[NostrFeedWidget] Connecting to relays:', this.config.relays);
    
    if (this.config.relays.length === 0) {
      console.error('[NostrFeedWidget] No relays configured!');
      return;
    }
    
    this.client = new NostrClient({
      relays: this.config.relays,
      onEvent: (event) => this.handleEvent(event),
      onNotice: (notice) => console.log('[NostrFeedWidget] Notice:', notice),
      onError: (error) => console.error('[NostrFeedWidget] Error:', error),
      onConnect: (relay) => console.log('[NostrFeedWidget] Connected to:', relay),
      onDisconnect: (relay) => console.log('[NostrFeedWidget] Disconnected from:', relay)
    });

    this.client.connect();

    // Subscription erstellen
    const filters = this.createFilters();
    this.client.subscribe('widget-subscription', filters);
  }

  private createFilters() {
    const filters: any[] = [{ kinds: this.config.kinds, limit: this.config.maxItems }];

    if (this.config.authors.length > 0) {
      filters[0].authors = this.config.authors;
    }

    if (this.config.tags.length > 0) {
      filters[0]['#t'] = this.config.tags.map(t => t[1]);
    }

    return filters;
  }

  private handleEvent(event: any): void {
    const parsedEvent = parseEvent(event);
    this.events.push(parsedEvent);

    // Profil-Events separat speichern
    if (parsedEvent.type === 'profile') {
      this.profiles.set(event.pubkey, parsedEvent.metadata as ProfileMetadata);
    }

    this.queueProfilesForEvent(parsedEvent);

    // Events mit Profilen anreichern
    const enrichedEvents = enrichWithProfiles(this.events, this.profiles);

    // Kategorien extrahieren
    const categories = extractCategories(enrichedEvents);

    // UI aktualisieren
    this.renderCategories(categories);
    this.renderGrid();
  }

  private queueProfilesForEvent(parsedEvent: ParsedEvent): void {
    const pubkeys = new Set<string>();
    const authorPk = parsedEvent?.event?.pubkey;
    if (typeof authorPk === 'string' && /^[0-9a-f]{64}$/i.test(authorPk)) pubkeys.add(authorPk.toLowerCase());

    const metadata: any = parsedEvent.metadata as any;
    if (parsedEvent.type === 'amb') {
      const creators = Array.isArray(metadata?.creatorPubkeys) ? metadata.creatorPubkeys : [];
      const contributors = Array.isArray(metadata?.contributorPubkeys) ? metadata.contributorPubkeys : [];
      [...creators, ...contributors].forEach((pk: unknown) => {
        if (typeof pk === 'string' && /^[0-9a-f]{64}$/i.test(pk)) pubkeys.add(pk.toLowerCase());
      });
    }
    if (parsedEvent.type === 'calendar') {
      const participants = Array.isArray(metadata?.participants) ? metadata.participants : [];
      participants.forEach((p: any) => {
        if (p && typeof p.pubkey === 'string' && /^[0-9a-f]{64}$/i.test(p.pubkey)) pubkeys.add(p.pubkey.toLowerCase());
      });
    }

    if (parsedEvent.type === 'profile' && typeof authorPk === 'string') {
      pubkeys.delete(authorPk.toLowerCase());
    }

    this.queueProfileFetch(Array.from(pubkeys));
  }

  private queueProfileFetch(pubkeys: string[]): void {
    const toAdd: string[] = [];
    for (const pk of pubkeys) {
      const pubkey = typeof pk === 'string' ? pk.trim().toLowerCase() : '';
      if (!pubkey) continue;
      if (!/^[0-9a-f]{64}$/.test(pubkey)) continue;
      if (this.requestedProfiles.has(pubkey)) continue;
      if (this.pendingProfilePubkeys.has(pubkey)) continue;
      this.pendingProfilePubkeys.add(pubkey);
      toAdd.push(pubkey);
    }

    if (toAdd.length === 0) return;
    if (this.profileFetchTimer !== null) return;

    this.profileFetchTimer = window.setTimeout(() => {
      this.profileFetchTimer = null;
      this.flushProfileFetch();
    }, 150);
  }

  private flushProfileFetch(): void {
    if (!this.client) return;

    const newlyQueued = Array.from(this.pendingProfilePubkeys);
    this.pendingProfilePubkeys.clear();
    newlyQueued.forEach((pk) => this.requestedProfiles.add(pk));

    const all = Array.from(this.requestedProfiles);
    if (all.length === 0) return;

    const chunkSize = 200;
    const filters: any[] = [];
    for (let i = 0; i < all.length; i += chunkSize) {
      filters.push({ kinds: [0], authors: all.slice(i, i + chunkSize), limit: 1 });
    }

    try {
      this.client.unsubscribe('profiles');
    } catch {
      // ignore
    }
    this.client.subscribe('profiles', filters as any);
  }

  private renderCategories(categories: string[]): void {
    const categoriesContainer = this.shadow.getElementById('categories') as HTMLElement;

    if (!this.config.showCategories || categories.length === 0) {
      categoriesContainer.style.display = 'none';
      return;
    }

    categoriesContainer.innerHTML = '';

    categories.forEach(category => {
      const chip = document.createElement('button');
      chip.className = 'category-chip';
      chip.textContent = category;
      chip.addEventListener('click', () => {
        if (this.selectedCategories.includes(category)) {
          this.selectedCategories = this.selectedCategories.filter(c => c !== category);
          chip.classList.remove('active');
        } else {
          this.selectedCategories.push(category);
          chip.classList.add('active');
        }
        this.renderGrid();
      });
      categoriesContainer.appendChild(chip);
    });
  }

  private renderGrid(): void {
    const grid = this.shadow.getElementById('grid') as HTMLElement;

    if (this.events.length === 0) {
      grid.innerHTML = '<div class="loading">Verbinde mit Nostr...</div>';
      return;
    }

    // Filter anwenden
    const filterConfig = createFilterConfig(
      this.config.tags,
      [],
      this.searchQuery,
      this.selectedCategories,
      this.config.authors
    );

    const filteredEvents = applyTwoLevelFilter(
      enrichWithProfiles(this.events, this.profiles),
      filterConfig
    );

    const displayEvents = filteredEvents.filter((event) => {
      if (event.type !== 'calendar') return true;
      const metadata = event.metadata as any;
      return Boolean(metadata?.start);
    });

    if (displayEvents.length === 0) {
      grid.innerHTML = '<div class="empty">Keine Ergebnisse gefunden</div>';
      return;
    }

    grid.innerHTML = '';

    displayEvents.forEach(event => {
      const card = this.createCard(event);
      grid.appendChild(card);
    });
  }

  private isSafeHref(href: string): boolean {
    try {
      const s = href.trim();
      if (!s) return false;
      if (s.toLowerCase().startsWith('nostr:')) return true;
      const u = new URL(s);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private isSafeHttpUrl(url: string): boolean {
    try {
      const u = new URL(url.trim());
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private toNjumpUrl(nostrUri: string): string | null {
    const s = nostrUri.trim();
    if (!s.toLowerCase().startsWith('nostr:')) return null;
    const entity = s.slice('nostr:'.length).trim();
    if (!entity) return null;
    if (!/^[a-z0-9]+1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$/i.test(entity)) return null;
    return `${NJUMP_BASE}${entity}`;
  }

  private toKanbanBoardUrl(nostrUri: string): string | null {
    const s = nostrUri.trim();
    const entity = s.toLowerCase().startsWith('nostr:') ? s.slice('nostr:'.length).trim() : s;
    if (!entity) return null;
    if (!/^naddr1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$/i.test(entity)) return null;
    return `${KANBAN_CARDSBOARD_BASE}${entity}`;
  }

  private normalizeOpenHref(href: string): string | null {
    const s = href.trim();
    if (!s) return null;
    if (s.toLowerCase().startsWith('nostr:')) return this.toNjumpUrl(s);
    if (this.isSafeHttpUrl(s)) return s;
    return null;
  }

  private parseATagCoordinate(aCoord: string): { kind: number; pubkey: string; identifier: string } | null {
    const value = (aCoord || '').trim();
    if (!value) return null;
    const first = value.indexOf(':');
    if (first <= 0) return null;
    const second = value.indexOf(':', first + 1);
    if (second <= first + 1) return null;
    const kindStr = value.slice(0, first);
    const pubkey = value.slice(first + 1, second);
    const identifier = value.slice(second + 1);
    const kind = Number(kindStr);
    if (!Number.isFinite(kind) || kind <= 0) return null;
    if (!pubkey || !identifier) return null;
    return { kind, pubkey, identifier };
  }

  private aTagToNaddrNostrUri(aValue: string): { nostrUri: string; kind: number | null } | null {
    const raw = (aValue || '').trim();
    if (!raw) return null;

    if (raw.toLowerCase().startsWith('nostr:naddr1')) {
      return { nostrUri: raw, kind: decodeNaddrKind(raw) };
    }

    if (/^naddr1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$/i.test(raw)) {
      const nostrUri = `nostr:${raw}`;
      return { nostrUri, kind: decodeNaddrKind(raw) };
    }

    const coord = this.parseATagCoordinate(raw);
    if (!coord) return null;
    return { nostrUri: `nostr:${encodeNaddr(coord.kind, coord.pubkey, coord.identifier)}`, kind: coord.kind };
  }

  private primaryHref(event: ParsedEvent): string | null {
    const metadata = event.metadata as any;

    if (event.type === 'calendar') {
      const rUrl = typeof metadata?.url === 'string' ? metadata.url : '';
      if (rUrl) {
        const normalized = this.normalizeOpenHref(rUrl);
        if (normalized) return normalized;
      }

      const location = typeof metadata?.location === 'string' ? metadata.location : '';
      if (location) {
        const normalized = this.normalizeOpenHref(location);
        if (normalized) return normalized;
      }
    }

    if (event.type === 'amb') {
      const dRaw = typeof metadata?.d === 'string' ? metadata.d : '';
      if (dRaw) {
        const normalized = this.normalizeOpenHref(dRaw);
        if (normalized) return normalized;
      }

      // Kanban-Boards: d-Tag ist ein Identifier (nostr:kanban:board-...), "Öffnen" soll direkt zur Board-App gehen.
      if (typeof dRaw === 'string' && dRaw.startsWith('nostr:kanban:board-')) {
        const kanbanRef = (event.event.tags || [])
          .filter((t) => t[0] === 'a' && typeof t[1] === 'string')
          .map((t) => this.aTagToNaddrNostrUri(String(t[1])))
          .find((parsed) => parsed?.kind === 30301);

        if (kanbanRef?.nostrUri) {
          const boardUrl = this.toKanbanBoardUrl(kanbanRef.nostrUri);
          if (boardUrl) return boardUrl;
        }

        return null;
      }

      const url = typeof metadata?.url === 'string' ? metadata.url : '';
      if (url) {
        const normalized = this.normalizeOpenHref(url);
        if (normalized) return normalized;
      }

      const aCoord = event.event.tags.find((t) => t[0] === 'a')?.[1];
      if (typeof aCoord === 'string') {
        const parsed = this.aTagToNaddrNostrUri(aCoord);
        if (parsed?.nostrUri) {
          const normalized = this.normalizeOpenHref(parsed.nostrUri);
          if (normalized) return normalized;
        }
      }
    }

    if (event.nostrUri) {
      const normalized = this.normalizeOpenHref(event.nostrUri);
      if (normalized) return normalized;
    }

    const url = typeof metadata?.url === 'string' ? metadata.url : '';
    if (url) {
      const normalized = this.normalizeOpenHref(url);
      if (normalized) return normalized;
    }
    return null;
  }

  private formatCalendarRange(kind: number, metadata: any): string | null {
    const start = metadata?.start;
    const end = metadata?.end;

    if (!start) return null;

    if (kind === 31922) {
      const tz = metadata?.start_tzid || metadata?.start_tz;
      const endTz = metadata?.end_tzid || metadata?.end_tz || tz;

      const startUnix = typeof start === 'number' ? start : (typeof start === 'string' && /^[0-9]+$/.test(start) ? Number(start) : null);
      const endUnix = typeof end === 'number' ? end : (typeof end === 'string' && /^[0-9]+$/.test(end) ? Number(end) : null);

      if (startUnix) {
        const fmt = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', ...(tz ? { timeZone: tz } : {}) });
        const startStr = fmt.format(new Date(startUnix * 1000));
        if (endUnix) {
          const endFmt = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', ...(endTz ? { timeZone: endTz } : {}) });
          const endStr = endFmt.format(new Date(endUnix * 1000));
          return startStr === endStr ? startStr : `${startStr} – ${endStr}`;
        }
        return startStr;
      }

      if (typeof start === 'string') {
        const startDate = new Date(`${start}T00:00:00`);
        const startStr = Number.isFinite(startDate.getTime())
          ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(startDate)
          : start;

        if (typeof end === 'string' && end) {
          const endDate = new Date(`${end}T00:00:00`);
          const endStr = Number.isFinite(endDate.getTime())
            ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(endDate)
            : end;
          return startStr === endStr ? startStr : `${startStr} – ${endStr}`;
        }

        return startStr;
      }
    }

    if (kind === 31923 && typeof start === 'number') {
      const tz = metadata?.start_tzid || metadata?.start_tz;
      const fmt = new Intl.DateTimeFormat('de-DE', {
        dateStyle: 'medium',
        timeStyle: 'short',
        ...(tz ? { timeZone: tz } : {})
      });
      const startStr = fmt.format(new Date(start * 1000));
      if (typeof end === 'number') {
        const endTz = metadata?.end_tzid || metadata?.end_tz || tz;
        const endFmt = new Intl.DateTimeFormat('de-DE', {
          dateStyle: 'medium',
          timeStyle: 'short',
          ...(endTz ? { timeZone: endTz } : {})
        });
        return `${startStr} – ${endFmt.format(new Date(end * 1000))}`;
      }
      return startStr;
    }

    if (typeof start === 'string') {
      if (typeof end === 'string' && end) return `${start} – ${end}`;
      return start;
    }

    return null;
  }

  private clearElement(el: HTMLElement): void {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  private addKvRow(container: HTMLElement, label: string, value: string): void {
    const row = document.createElement('div');
    row.className = 'kv-row';
    const strong = document.createElement('span');
    strong.className = 'kv-label';
    strong.textContent = `${label}: `;
    const span = document.createElement('span');
    span.textContent = value;
    row.appendChild(strong);
    row.appendChild(span);
    container.appendChild(row);
  }

  private addKvLinkRow(container: HTMLElement, label: string, url: string, text?: string): void {
    const row = document.createElement('div');
    row.className = 'kv-row';

    const strong = document.createElement('span');
    strong.className = 'kv-label';
    strong.textContent = `${label}: `;

    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = text || url;

    row.appendChild(strong);
    row.appendChild(a);
    container.appendChild(row);
  }

  private openProfile(pubkey: string): void {
    const modal = this.shadow.getElementById('modal') as HTMLElement;
    const modalImage = this.shadow.getElementById('modalImage') as HTMLElement;
    const modalTitle = this.shadow.getElementById('modalTitle') as HTMLElement;
    const modalAvatar = this.shadow.getElementById('modalAvatar') as HTMLElement;
    const modalAuthor = this.shadow.getElementById('modalAuthor') as HTMLElement;
    const modalDescription = this.shadow.getElementById('modalDescription') as HTMLElement;
    const modalTags = this.shadow.getElementById('modalTags') as HTMLElement;
    const modalLink = this.shadow.getElementById('modalLink') as HTMLAnchorElement;

    const profile = this.profiles.get(pubkey) || {};
    const title = profile.display_name || profile.name || pubkey.slice(0, 8) + '…' + pubkey.slice(-4);

    modalImage.style.backgroundImage = profile.banner && this.isSafeHttpUrl(profile.banner) ? `url('${profile.banner}')` : 'none';
    modalTitle.textContent = title;

    modalAvatar.style.display = 'block';
    modalAvatar.style.backgroundImage = profile.picture && this.isSafeHttpUrl(profile.picture) ? `url('${profile.picture}')` : 'none';

    modalAuthor.textContent = profile.nip05 || pubkey;
    (modalAuthor as any).onclick = null;
    (modalAvatar as any).onclick = null;
    (modalAuthor as any).style.cursor = 'default';
    (modalAvatar as any).style.cursor = 'default';

    this.clearElement(modalDescription);
    if (profile.about) {
      const about = document.createElement('div');
      about.textContent = profile.about;
      modalDescription.appendChild(about);
    }
    if (profile.website) this.addKvRow(modalDescription, 'Website', profile.website);

    this.clearElement(modalTags);

    const items = enrichWithProfiles(this.events, this.profiles)
      .filter((e) => e.event.pubkey === pubkey && e.type !== 'profile')
      .slice(0, 50);

    if (items.length > 0) {
      const listTitle = document.createElement('div');
      listTitle.className = 'kv-row';
      listTitle.textContent = `Inhalte (${items.length}):`;
      modalDescription.appendChild(listTitle);

      const ul = document.createElement('ul');
      ul.className = 'profile-list';
      items.forEach((item) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        const meta = item.metadata as any;
        btn.textContent = meta?.title || meta?.name || item.event.content?.slice(0, 60) || item.event.id.slice(0, 12);
        btn.addEventListener('click', () => this.openModal(item));
        li.appendChild(btn);
        ul.appendChild(li);
      });
      modalDescription.appendChild(ul);
    }

    const profileUri = `nostr:${encodeNprofile(pubkey)}`;
    modalLink.href = this.toNjumpUrl(profileUri) || profileUri;
    modalLink.rel = 'noopener noreferrer';
    modalLink.style.display = 'inline-block';

    modal.classList.add('open');
  }

  private createCard(event: ParsedEvent): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';

    const metadata = event.metadata as any;
    const author = event.author;
    const authorPicture = author?.picture && this.isSafeHttpUrl(author.picture) ? author.picture : '';
    const authorName = author ? author.name || author.display_name || null : null;

    const title = metadata?.title || metadata?.name || 'Unbenannt';
    const summary = metadata?.summary || metadata?.description || event.event.content?.slice(0, 100) || '';
    const imageRaw = typeof metadata?.image === 'string' ? metadata.image : '';
    const image = imageRaw && this.isSafeHttpUrl(imageRaw) ? imageRaw : '';
    const href = this.primaryHref(event);

    const typeLabels: Record<string, string> = {
      amb: 'OER Material',
      calendar: 'Veranstaltung',
      article: 'Artikel',
      note: 'Nachricht',
      profile: 'Profil'
    };

    const tags = event.event.tags.filter((t) => t[0] === 't').map((t) => t[1]);

    const locationRaw = typeof metadata?.location === 'string' ? metadata.location : '';
    const calendarLocationUrl = locationRaw && this.isSafeHttpUrl(locationRaw) ? locationRaw : null;
    const calendarLocationText = !calendarLocationUrl && locationRaw ? locationRaw : null;

    const rendered = renderCard({
      event,
      config: this.config,
      typeLabel: typeLabels[event.type] || event.type,
      title,
      summary,
      imageUrl: image || null,
      href,
      tags,
      author,
      authorName,
      authorPicture: authorPicture || null,
      profileByPubkey: (pubkey: string) => this.profiles.get(pubkey),
      calendarLocationUrl,
      calendarLocationText
    });

    card.className = ['card', rendered.cardClassName].filter(Boolean).join(' ');
    card.innerHTML = rendered.html;

    /* legacy card template (replaced by renderers)
    card.innerHTML = `
      <div class="card-image" style="${image ? `background-image: url('${image}')` : ''}">
        ${!image ? 'NO IMAGE' : ''}
      </div>
      <div class="card-content">
        <span class="card-type">${typeLabels[event.type] || event.type}</span>
        <h3 class="card-title">${title}</h3>
        <p class="card-summary">${displaySummary.length > 100 ? displaySummary.slice(0, 100) + '...' : displaySummary}</p>
        ${this.config.showAuthor && authorName ? `
          <div class="card-meta">
            <div class="card-avatar" style="${authorPicture ? `background-image: url('${authorPicture}')` : ''}"></div>
            <span class="card-author">${authorName || 'Unbekannt'}</span>
          </div>
        ` : ''}
        <a class="card-link" href="${url || '#'}" target="_blank">Öffnen &rarr;</a>
      </div>
    `;
    */

    const linkEl = card.querySelector('.card-link') as HTMLAnchorElement | null;
    if (linkEl) {
      if (href) {
        linkEl.href = href;
        linkEl.rel = 'noopener noreferrer';
      } else {
        linkEl.style.display = 'none';
      }
    }

    const metaEl = card.querySelector('.card-meta') as HTMLElement | null;
    if (metaEl) {
      metaEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openProfile(event.event.pubkey);
      });
    }

    card.querySelectorAll<HTMLElement>('.oer-avatar[data-pubkey]').forEach((el) => {
      const pubkey = el.getAttribute('data-pubkey') || '';
      if (!pubkey) return;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openProfile(pubkey);
      });
    });

    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName !== 'A') {
        this.openModal(event);
      }
    });

    return card;
  }

  private openModal(event: ParsedEvent): void {
    const modal = this.shadow.getElementById('modal') as HTMLElement;
    const modalImage = this.shadow.getElementById('modalImage') as HTMLElement;
    const modalTitle = this.shadow.getElementById('modalTitle') as HTMLElement;
    const modalAvatar = this.shadow.getElementById('modalAvatar') as HTMLElement;
    const modalAuthor = this.shadow.getElementById('modalAuthor') as HTMLElement;
    const modalDescription = this.shadow.getElementById('modalDescription') as HTMLElement;
    const modalTags = this.shadow.getElementById('modalTags') as HTMLElement;
    const modalLink = this.shadow.getElementById('modalLink') as HTMLAnchorElement;

    const metadata = event.metadata as any;
    const author = event.author;
    const authorPicture = author?.picture && this.isSafeHttpUrl(author.picture) ? author.picture : '';

    if (event.type === 'profile') {
      this.openProfile(event.event.pubkey);
      return;
    }

    const title = metadata?.title || metadata?.name || 'Unbenannt';
    const imageRaw = typeof metadata?.image === 'string' ? metadata.image : '';
    const image = imageRaw && this.isSafeHttpUrl(imageRaw) ? imageRaw : '';
    const href = this.primaryHref(event);

    const extraLines: string[] = [];
    if (event.type === 'calendar') {
      const when = this.formatCalendarRange(event.event.kind, metadata);
      if (when) extraLines.push(`Termin: ${when}`);
      const location = typeof metadata?.location === 'string' ? metadata.location : '';
      const locationUrl = location && this.isSafeHttpUrl(location) ? location : '';
      if (!locationUrl && location) extraLines.push(`Ort: ${location}`);
      if (metadata?.start === undefined) extraLines.push('Hinweis: start fehlt (Event ist unvollständig).');
    }
    if (event.type === 'article') {
      if (metadata?.publishedAt) {
        extraLines.push(`Veröffentlicht: ${new Date(Number(metadata.publishedAt) * 1000).toLocaleString('de-DE')}`);
      }
    }
    // AMB/OER (Kind 30142) Zusatzinfos werden als strukturierte KV-Zeilen unten angehängt,
    // damit Links (Lizenz, OER, Referenzen) klickbar sind und nicht doppelt im Fließtext landen.

    const baseText = metadata?.summary || metadata?.description || metadata?.content || event.event.content || '';
    const description = extraLines.length > 0 ? [...extraLines, '', String(baseText)].join('\n') : String(baseText);

    modalImage.style.backgroundImage = image ? `url('${image}')` : 'none';
    modalTitle.textContent = title;
    modalDescription.textContent = description;

    if (event.type === 'calendar') {
      const location = typeof metadata?.location === 'string' ? metadata.location : '';
      if (location && this.isSafeHttpUrl(location)) {
        const row = document.createElement('div');
        row.className = 'kv-row';

        const label = document.createElement('span');
        label.className = 'kv-label';
        label.textContent = 'Online: ';

        const a = document.createElement('a');
        a.href = location;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = location;

        row.appendChild(label);
        row.appendChild(a);
        modalDescription.appendChild(document.createElement('br'));
        modalDescription.appendChild(row);
      }
    }

    if (event.type === 'amb') {
      const tags = event.event.tags || [];
      const lang = this.config.language || 'de';

      const uniq = (values: string[]) => Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));

      const extractPrefLabels = (base: string): string[] => {
        const prefTags = tags
          .filter((t) => typeof t[0] === 'string' && t[0].startsWith(`${base}:prefLabel:`))
          .map((t) => ({ key: t[0], value: t[1] }))
          .filter((t) => typeof t.value === 'string' && t.value.trim().length > 0);
        if (prefTags.length === 0) return [];
        const exact = prefTags.filter((t) => t.key === `${base}:prefLabel:${lang}`).map((t) => t.value);
        return uniq((exact.length > 0 ? exact : prefTags.map((t) => t.value)) as string[]);
      };

      const learningType =
        extractPrefLabels('learningResourceType')[0] ||
        (typeof metadata?.learningResourceType === 'string' ? metadata.learningResourceType : '');
      if (learningType) this.addKvRow(modalDescription, 'learningResourceType', learningType);

      const about = extractPrefLabels('about');
      if (about.length > 0) this.addKvRow(modalDescription, 'about', about.join(', '));

      const audience = extractPrefLabels('audience');
      if (audience.length > 0) this.addKvRow(modalDescription, 'audience', audience.join(', '));

      const educationalLevel = extractPrefLabels('educationalLevel');
      if (educationalLevel.length > 0) this.addKvRow(modalDescription, 'educationalLevel', educationalLevel.join(', '));

      const license =
        (typeof metadata?.license === 'string' ? metadata.license : '') ||
        (tags.find((t) => t[0] === 'license:id')?.[1] as string | undefined) ||
        '';
      if (license) {
        if (this.isSafeHttpUrl(license)) this.addKvLinkRow(modalDescription, 'Lizenz', license);
        else this.addKvRow(modalDescription, 'Lizenz', license);
      }

      const d =
        (typeof metadata?.d === 'string' ? metadata.d : '') ||
        (tags.find((t) => t[0] === 'd')?.[1] as string | undefined) ||
        '';
      if (d) {
        if (this.isSafeHttpUrl(d)) {
          this.addKvLinkRow(modalDescription, 'OER', d);
        } else if (d.startsWith('nostr:kanban:board-')) {
          const kanbanRef = (event.event.tags || [])
            .filter((t) => t[0] === 'a' && typeof t[1] === 'string')
            .map((t) => this.aTagToNaddrNostrUri(String(t[1])))
            .find((parsed) => parsed?.kind === 30301);
          if (kanbanRef?.nostrUri) {
            const boardUrl = this.toKanbanBoardUrl(kanbanRef.nostrUri);
            if (boardUrl) {
              this.addKvLinkRow(modalDescription, 'Kanban Board', boardUrl);
            } else {
              this.addKvRow(modalDescription, 'd', d);
            }
          } else {
            this.addKvRow(modalDescription, 'd', d);
          }
        } else {
          this.addKvRow(modalDescription, 'd', d);
        }
      }

      const refs = uniq(tags.filter((t) => t[0] === 'r' && typeof t[1] === 'string').map((t) => t[1] as string)).filter((u) =>
        this.isSafeHttpUrl(u)
      );
      if (refs.length > 0) {
        const row = document.createElement('div');
        row.className = 'kv-row';
        const strong = document.createElement('span');
        strong.className = 'kv-label';
        strong.textContent = 'Referenzen: ';
        row.appendChild(strong);

        const list = document.createElement('div');
        refs.forEach((u) => {
          const a = document.createElement('a');
          a.href = u;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = u;
          a.style.display = 'block';
          list.appendChild(a);
        });
        row.appendChild(list);
        modalDescription.appendChild(row);
      }
    }

    if (this.config.showAuthor && author) {
      const authorPic = author.picture && this.isSafeHttpUrl(author.picture) ? author.picture : '';
      modalAvatar.style.backgroundImage = authorPic ? `url('${authorPic}')` : 'none';
      modalAuthor.textContent = author.name || author.display_name || 'Unbekannt';
      (modalAuthor as any).onclick = () => this.openProfile(event.event.pubkey);
      (modalAvatar as any).onclick = () => this.openProfile(event.event.pubkey);
      (modalAuthor as any).style.cursor = 'pointer';
      (modalAvatar as any).style.cursor = 'pointer';
    } else {
      modalAvatar.style.display = 'none';
      modalAuthor.textContent = '';
      (modalAuthor as any).onclick = null;
      (modalAvatar as any).onclick = null;
    }

    modalTags.innerHTML = '';
    const textTags = event.event.tags
      .filter((t) => t[0] === 't')
      .map((t) => t[1]);
    const keywordTags = event.event.tags
      .filter((t) => t[0] === 'keywords')
      .map((t) => t[1]);
    [...textTags, ...keywordTags]
      .filter((v) => typeof v === 'string' && v.trim().length > 0)
      .forEach((value) => {
        const tagEl = document.createElement('span');
        tagEl.className = 'modal-tag';
        tagEl.textContent = String(value);
        modalTags.appendChild(tagEl);
      });

    if (event.type === 'amb') {
      const addPersonTag = (role: string, pubkey: string) => {
        const prof = this.profiles.get(pubkey);
        const name = prof?.name || prof?.display_name || pubkey.slice(0, 8) + '…' + pubkey.slice(-4);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'modal-tag';
        btn.style.cursor = 'pointer';
        btn.style.border = 'none';
        btn.textContent = `${role}: ${name}`;
        btn.addEventListener('click', () => this.openProfile(pubkey));
        modalTags.appendChild(btn);
      };

      const creatorPubkeys = Array.isArray(metadata?.creatorPubkeys) ? metadata.creatorPubkeys : [];
      creatorPubkeys.forEach((pk: string) => addPersonTag('creator', pk));

      const contributorPubkeys = Array.isArray(metadata?.contributorPubkeys) ? metadata.contributorPubkeys : [];
      contributorPubkeys.forEach((pk: string) => addPersonTag('contributor', pk));
    }

    if (href) {
      modalLink.href = href;
      modalLink.rel = 'noopener noreferrer';
      modalLink.style.display = 'inline-block';
    } else {
      modalLink.href = '#';
      modalLink.style.display = 'none';
    }

    modal.classList.add('open');
  }
}

// Custom Element registrieren
customElements.define('nostr-feed', NostrFeedWidget);
