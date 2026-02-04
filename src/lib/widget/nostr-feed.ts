/**
 * Nostr Feed Widget
 * Web Component (Custom Element) mit Shadow DOM
 * Zeigt Nostr Events in einem Grid an
 */

import type { WidgetConfig, ParsedEvent, ProfileMetadata } from '../nostr/types.js';
import { NostrClient } from '../nostr/client.js';
import { parseEvent, enrichWithProfiles, extractProfiles } from '../nostr/parser.js';
import { applyTwoLevelFilter, createFilterConfig, extractCategories, extractAuthors } from '../nostr/filter.js';

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

    .card-link {
      text-decoration: none;
      color: #7e22ce;
      font-size: 14px;
      font-weight: bold;
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

export class NostrFeedWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private client: NostrClient | null = null;
  private events: ParsedEvent[] = [];
  private profiles: Map<string, ProfileMetadata> = new Map();
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
    console.log('[NostrFeedWidget] parsed config:', this.config);
    this.setupEventListeners();
    this.connectToRelays();
  }

  disconnectedCallback(): void {
    this.client?.disconnect();
  }

  private parseConfig(): WidgetConfig {
    const relays = this.getAttribute('relays')?.split(',').map(r => r.trim()) || [];
    const kinds = (this.getAttribute('kinds')?.split(',').map(k => parseInt(k.trim(), 10)) || [30142, 31922, 1, 30029, 0]) as any;
    const authors = this.getAttribute('authors')?.split(',').map(a => a.trim()) || [];
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
      input.placeholder = 'Suchen...';
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

    // Events mit Profilen anreichern
    const enrichedEvents = enrichWithProfiles(this.events, this.profiles);

    // Kategorien extrahieren
    const categories = extractCategories(enrichedEvents);

    // UI aktualisieren
    this.renderCategories(categories);
    this.renderGrid();
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

    if (filteredEvents.length === 0) {
      grid.innerHTML = '<div class="empty">Keine Ergebnisse gefunden</div>';
      return;
    }

    grid.innerHTML = '';

    filteredEvents.forEach(event => {
      const card = this.createCard(event);
      grid.appendChild(card);
    });
  }

  private createCard(event: ParsedEvent): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';

    const metadata = event.metadata as any;
    const author = event.author;

    const title = metadata?.title || metadata?.name || 'Unbenannt';
    const summary = metadata?.summary || metadata?.description || event.event.content?.slice(0, 100) || '';
    const image = metadata?.image || '';
    const url = metadata?.url || '';

    const typeLabels: Record<string, string> = {
      amb: 'OER Material',
      calendar: 'Veranstaltung',
      article: 'Artikel',
      note: 'Note',
      profile: 'Profil'
    };

    card.innerHTML = `
      <div class="card-image" style="${image ? `background-image: url('${image}')` : ''}">
        ${!image ? 'NO IMAGE' : ''}
      </div>
      <div class="card-content">
        <span class="card-type">${typeLabels[event.type] || event.type}</span>
        <h3 class="card-title">${title}</h3>
        <p class="card-summary">${summary.length > 100 ? summary.slice(0, 100) + '...' : summary}</p>
        ${this.config.showAuthor && author ? `
          <div class="card-meta">
            <div class="card-avatar" style="${author.picture ? `background-image: url('${author.picture}')` : ''}"></div>
            <span class="card-author">${author.name || author.display_name || 'Unbekannt'}</span>
          </div>
        ` : ''}
        <a class="card-link" href="${url || '#'}" target="_blank">Öffnen &rarr;</a>
      </div>
    `;

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

    const title = metadata?.title || metadata?.name || 'Unbenannt';
    const description = metadata?.summary || metadata?.description || event.event.content || '';
    const image = metadata?.image || '';
    const url = metadata?.url || '';

    modalImage.style.backgroundImage = image ? `url('${image}')` : 'none';
    modalTitle.textContent = title;
    modalDescription.textContent = description;

    if (this.config.showAuthor && author) {
      modalAvatar.style.backgroundImage = author.picture ? `url('${author.picture}')` : 'none';
      modalAuthor.textContent = author.name || author.display_name || 'Unbekannt';
    } else {
      modalAvatar.style.display = 'none';
      modalAuthor.textContent = '';
    }

    modalTags.innerHTML = '';
    event.event.tags
      .filter(t => t[0] === 't')
      .forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'modal-tag';
        tagEl.textContent = tag[1];
        modalTags.appendChild(tagEl);
      });

    modalLink.href = url || '#';
    modalLink.style.display = url ? 'inline-block' : 'none';

    modal.classList.add('open');
  }
}

// Custom Element registrieren
customElements.define('nostr-feed', NostrFeedWidget);
