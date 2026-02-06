/**
 * Nostr Feed Widget
 * Web Component (Custom Element) mit Shadow DOM
 * Zeigt Nostr Events in einem Grid an
 */

import type { WidgetConfig, ParsedEvent, ProfileMetadata } from '../nostr/types.js';
import { NostrClient } from '../nostr/client.js';
import { parseEvent, enrichWithProfiles, extractProfiles } from '../nostr/parser.js';
import { applyTwoLevelFilter, createFilterConfig, extractCategories, extractAuthors, matchesAllFilters } from '../nostr/filter.js';
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

      --surface: #ffffff;
      --surface-2: #f8fafc;
      --text: #0f172a;
      --muted: #475569;
      --muted-2: #64748b;
      --border: #e2e8f0;
      --shadow: 0 2px 8px rgba(15, 23, 42, 0.08);

      --chip-bg: #f1f5f9;
      --chip-bg-hover: #e2e8f0;
      --chip-active: #7e22ce;
      --chip-active-text: #ffffff;

      --input-bg: #ffffff;

      --link: #7e22ce;
      --link-hover: #6b21a8;

      --modal-bg: #ffffff;

      --placeholder-1: rgba(126, 34, 206, 0.22);
      --placeholder-2: rgba(14, 165, 233, 0.18);
      --placeholder-3: rgba(236, 72, 153, 0.12);
    }

    :host([theme="dark"]) {
      --surface: #0b1220;
      --surface-2: #111827;
      --text: #f8fafc;
      --muted: #cbd5e1;
      --muted-2: #94a3b8;
      --border: #1f2937;
      --shadow: 0 2px 12px rgba(0, 0, 0, 0.35);

      --chip-bg: #1f2937;
      --chip-bg-hover: #334155;
      --chip-active: #a855f7;
      --chip-active-text: #0b1220;

      --input-bg: #0b1220;

      --link: #c084fc;
      --link-hover: #e9d5ff;

      --modal-bg: #0b1220;

      --placeholder-1: rgba(168, 85, 247, 0.22);
      --placeholder-2: rgba(56, 189, 248, 0.16);
      --placeholder-3: rgba(236, 72, 153, 0.10);
    }

    @media (prefers-color-scheme: dark) {
      :host([theme="auto"]) {
        --surface: #0b1220;
        --surface-2: #111827;
        --text: #f8fafc;
        --muted: #cbd5e1;
        --muted-2: #94a3b8;
        --border: #1f2937;
        --shadow: 0 2px 12px rgba(0, 0, 0, 0.35);

        --chip-bg: #1f2937;
        --chip-bg-hover: #334155;
        --chip-active: #a855f7;
        --chip-active-text: #0b1220;

        --input-bg: #0b1220;

        --link: #c084fc;
        --link-hover: #e9d5ff;

        --modal-bg: #0b1220;

        --placeholder-1: rgba(168, 85, 247, 0.22);
        --placeholder-2: rgba(56, 189, 248, 0.16);
        --placeholder-3: rgba(236, 72, 153, 0.10);
      }
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
      border: 1px solid var(--border);
      border-radius: 25px;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.2s;
      background: var(--input-bg);
      color: var(--text);
    }

    .search-input:focus {
      border-color: var(--link);
    }

    .categories {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }

    .category-chip {
      padding: 6px 12px;
      background: var(--chip-bg);
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
      color: var(--text);
    }

    .category-chip:hover {
      background: var(--chip-bg-hover);
    }

    .category-chip.active {
      background: var(--chip-active);
      color: var(--chip-active-text);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .card {
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      background: var(--surface);
      box-shadow: var(--shadow);
      transition: transform 0.2s;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .card:hover {
      transform: translateY(-3px);
    }

    .card-image {
      height: 160px;
      background-color: var(--surface-2);
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--muted-2);
      flex: 0 0 auto;
    }

    .card-image--placeholder {
      background-image:
        radial-gradient(circle at 18% 28%, var(--placeholder-1), transparent 55%),
        radial-gradient(circle at 78% 18%, var(--placeholder-2), transparent 50%),
        linear-gradient(135deg, var(--placeholder-3), var(--surface-2));
    }

    .card-content {
      padding: 15px;
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      color: var(--text);
      background: var(--surface);
    }

    .card-title {
      margin: 0 0 8px;
      font-size: 16px;
      color: var(--text);
      font-weight: 600;
    }

    .card-summary {
      margin: 0 0 15px;
      font-size: 14px;
      color: var(--muted);
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
      color: var(--muted-2);
    }

    .card-type {
      display: inline-block;
      padding: 2px 8px;
      background: var(--chip-bg);
      border-radius: 4px;
      font-size: 11px;
      color: var(--muted);
      margin-bottom: 10px;
      width: fit-content;
    }

    .card-date {
      font-size: 12px;
      color: #6b7280;
      margin: 0 0 10px;
    }

    .card-link {
      text-decoration: none;
      color: var(--link);
      font-size: 14px;
      font-weight: bold;
      margin-top: auto;
      align-self: flex-start;
    }

    .card-link:hover {
      color: var(--link-hover);
    }

    .card-footer {
      margin-top: auto;
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px;

    }

    .card-footer .card-meta {
      margin-bottom: 0;
    }

    .card-footer .card-link {
      margin-top: 0;
      align-self: auto;
    }

    .card-footer-spacer {
      flex: 1 1 auto;
    }

    /* Calendar cards */
    .card-calendar .card-content {
      border-top: 3px solid #f97316;
    }

    .calendar-title-date {
      font-weight: 500;
      opacity: 0.85;
      font-size: 0.9em;
    }

    .card-calendar .card-summary {
      height: auto;
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
      border-top: 3px solid #0ea5e9;
    }

    .oer-creators {
      display: flex;
      gap: 6px;
      margin: 10px 0;
      flex-wrap: wrap;
    }

    .oer-credits {
      width: 100%;
      display: grid;
      gap: 6px;
      margin-top: 10px;
      margin-bottom: 8px;
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
      color: var(--text);
      background: var(--chip-bg);
      background-size: cover;
      background-position: center;
      border: 1px solid var(--border);
    }

    .oer-footer-avatar-name {
      font-size: 12px;
      color: var(--muted-2);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }

    .oer-footer-avatar .oer-avatar-img {
      width: 22px;
      height: 22px;
      font-size: 10px;
    }

    .oer-creators-text {
      margin: 6px 0 10px;
      font-size: 12px;
      opacity: 0.92;
    }

    .oer-chip-stack {
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
      max-width: 60%;
      pointer-events: none;
      min-width: 0;
    }

    .oer-summary {
      color: var(--muted);
      height: auto;
      margin-bottom: 10px;
    }

    .oer-keywords {
      display: flex;
      display: none;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 10px;
    }

    .oer-chip {
      font-size: 12px;
      padding: 2px 5px;
      border-radius: 9999px;
      background: rgba(0, 0, 0, 0.28);
      color: rgba(255, 255, 255, 0.92);
    }

    .oer-chip-overlay {
      display: inline-block;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      box-sizing: border-box;
    }

    .oer-keyword-chip {
      background: rgba(0, 0, 0, 0.05);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 9999px;
      padding: 2px 8px;
      max-width: 220px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 12px;
    }

    .oer-keywords-stack {
      // position: absolute;
      // left: 10px;
      // right: 10px;
      // bottom: 10px;
      display: flex;
      gap: 2px;
      justify-content: flex-start;
      flex-wrap: wrap;
      pointer-events: none;
      padding: 10px 0px;
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
      color: var(--link);
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
      color: var(--muted);
      grid-column: 1 / -1;
    }

    .empty {
      text-align: center;
      padding: 40px;
      color: var(--muted);
      grid-column: 1 / -1;
    }

    .paging {
      display: flex;
      justify-content: center;
      margin-top: 18px;
    }

    .load-more-button {
      border: none;
      border-radius: 9999px;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      background: var(--chip-active);
      color: var(--chip-active-text);
    }

    .load-more-button:hover {
      opacity: 0.92;
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
      background: var(--modal-bg);
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
      color: var(--muted);
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
      color: var(--text);
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
      color: var(--muted);
    }

    .modal-description {
      line-height: 1.6;
      color: var(--text);
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
      color: var(--link);
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
      background: var(--chip-bg);
      border-radius: 16px;
      font-size: 12px;
      color: var(--muted);
    }

    .modal-link {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 20px;
      background: var(--link);
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
    }

    .modal-link:hover {
      background: var(--link-hover);
    }

    /* Profile view */
    .profile-header {
      display: none;
      margin: 0 0 18px;
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      background: var(--surface);
      box-shadow: var(--shadow);
    }

    .profile-banner {
      height: 170px;
      background: var(--surface-2);
      background-size: cover;
      background-position: center;
      position: relative;
    }

    .profile-back {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 2;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.85);
      color: var(--text);
      padding: 8px 12px;
      border-radius: 9999px;
      cursor: pointer;
      font-size: 13px;
      backdrop-filter: blur(6px);
    }

    :host([theme="dark"]) .profile-back {
      background: rgba(17, 24, 39, 0.75);
    }

    @media (prefers-color-scheme: dark) {
      :host([theme="auto"]) .profile-back {
        background: rgba(17, 24, 39, 0.75);
      }
    }

    .profile-header-card {
      display: grid;
      grid-template-columns: 72px 1fr;
      gap: 14px;
      padding: 14px 16px 16px;
      align-items: center;
    }

    .profile-avatar-large {
      width: 72px;
      height: 72px;
      border-radius: 9999px;
      background: var(--surface-2);
      background-size: cover;
      background-position: center;
      border: 4px solid var(--surface);
      box-shadow: 0 10px 22px rgba(0, 0, 0, 0.12);
      margin-top: -38px;
    }

    .profile-name {
      font-size: 22px;
      font-weight: 750;
      color: var(--text);
      line-height: 1.2;
      margin: 0 0 4px;
      word-break: break-word;
    }

    .profile-sub {
      font-size: 12px;
      color: var(--muted-2);
      word-break: break-all;
    }

    .profile-about {
      padding: 0 16px 14px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.45;
      white-space: pre-wrap;
    }

    .profile-section-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 16px 14px;
      border-top: 1px solid var(--border);
      background: var(--surface);
    }

    .profile-section-title {
      margin: 0;
      font-size: 18px;
      color: var(--text);
      font-weight: 700;
    }

    .profile-type-filters {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .profile-filter-chip {
      border: 1px solid var(--border);
      background: var(--chip-bg);
      color: var(--text);
      border-radius: 9999px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 12px;
    }

    .profile-filter-chip.active {
      background: var(--chip-active);
      color: var(--chip-active-text);
      border-color: transparent;
    }
  </style>

  <div class="nostr-feed-container">
    <div class="search-bar" id="searchBar"></div>
    <div class="categories" id="categories"></div>

    <div class="profile-header" id="profileHeader">
      <div class="profile-banner" id="profileBanner">
        <button class="profile-back" id="profileBack" type="button">â† ZurÃ¼ck zur Ãœbersicht</button>
      </div>
      <div class="profile-header-card">
        <div class="profile-avatar-large" id="profileAvatarLarge"></div>
        <div>
          <div class="profile-name" id="profileName"></div>
          <div class="profile-sub" id="profileSub"></div>
        </div>
      </div>
      <div class="profile-about" id="profileAbout"></div>
      <div class="profile-section-row">
        <h3 class="profile-section-title">VerÃ¶ffentlichungen & Termine</h3>
        <div class="profile-type-filters" id="profileTypeFilters">
          <button class="profile-filter-chip" type="button" data-filter="all">Alle</button>
          <button class="profile-filter-chip" type="button" data-filter="calendar">Termine</button>
          <button class="profile-filter-chip" type="button" data-filter="amb">Materialien</button>
        </div>
      </div>
    </div>

    <div class="grid" id="grid">
      <div class="loading">Verbinde mit Nostr...</div>
    </div>
    <div class="paging" id="paging"></div>
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
      <a class="modal-link" id="modalLink" target="_blank">Ã–ffnen</a>
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
  private activeProfilePubkey: string | null = null;
  private profileTypeFilter: 'all' | 'calendar' | 'amb' = 'all';
  private displayedCount = 0;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(TEMPLATE.content.cloneNode(true));
    // Config wird im connectedCallback geparst, damit Attribute verfÃ¼gbar sind
  }

  connectedCallback(): void {
    console.log('[NostrFeedWidget] connectedCallback called');
    console.log('[NostrFeedWidget] relays attribute:', this.getAttribute('relays'));
    // Config hier parsen, damit Attribute verfÃ¼gbar sind
    this.config = this.parseConfig();
    this.searchQuery = this.config.search || '';
    this.resetPagination();
    console.log('[NostrFeedWidget] parsed config:', this.config);
    this.applyVisualConfig();
    this.setupEventListeners();
    this.connectToRelays();
    this.queueProfileFetch(this.config.authors || []);
  }

  disconnectedCallback(): void {
    this.client?.disconnect();
  }

  private parseConfig(): WidgetConfig {
    const relays = this.getAttribute('relays')?.split(',').map(r => r.trim()) || [];
    const kinds = (this.getAttribute('kinds')?.split(',').map(k => parseInt(k.trim(), 10)) || [30142, 31922, 31923, 1, 30023, 0]) as any;
    const rawAuthors = this.getAttribute('authors')?.split(',').map(a => a.trim()).filter(Boolean) || [];
    const authors = rawAuthors
      .map((a) => normalizePubkey(a))
      .filter((a): a is string => Boolean(a));
    if (rawAuthors.length > 0 && authors.length === 0) {
      console.warn('[NostrFeedWidget] authors attribute provided but none could be parsed (expected hex or npub).', rawAuthors);
    }

    const parseFilterArray = (attrName: string): string[][] => {
      const raw = this.getAttribute(attrName);
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        console.warn(`[NostrFeedWidget] Invalid JSON in "${attrName}" attribute.`);
        return [];
      }
    };

    const tags = parseFilterArray('tags');
    const ambTags = parseFilterArray('ambTags');
    const search = this.getAttribute('search') || '';
    const categoriesAttr = this.getAttribute('categories');
    const categories = categoriesAttr ? JSON.parse(categoriesAttr) : [];
    const maxItems = parseInt(this.getAttribute('maxItems') || '50', 10);
    const showSearch = this.getAttribute('showSearch') !== 'false';
    const showCategories = this.getAttribute('showCategories') !== 'false';
    const showAuthor = this.getAttribute('showAuthor') !== 'false';
    const showOverlayChips = this.getAttribute('showOverlayChips') !== 'false';
    const showKeywords = this.getAttribute('showKeywords') !== 'false';
    const showLoadMore = this.getAttribute('showLoadMore') !== 'false';
    const pageSize = this.parsePositiveInt(this.getAttribute('pageSize'), 24);
    const loadMoreStep = this.parsePositiveInt(this.getAttribute('loadMoreStep'), pageSize);
    const accentColor = this.normalizeHexColor(this.getAttribute('accentColor') || '') || undefined;
    const cardMinWidth = this.parsePositiveInt(this.getAttribute('cardMinWidth'), 280);
    const maxColumns = this.parsePositiveInt(this.getAttribute('maxColumns'), 0) || undefined;
    const theme = (this.getAttribute('theme') as 'light' | 'dark' | 'auto') || 'auto';
    const language = this.getAttribute('language') || 'de';
    const calendarStartDate = this.getAttribute('calendarStartDate')?.trim() || '';
    const calendarEndDate = this.getAttribute('calendarEndDate')?.trim() || '';

    return {
      relays,
      kinds,
      authors,
      tags,
      ambTags: ambTags.length > 0 ? ambTags : undefined,
      calendarStartDate: calendarStartDate || undefined,
      calendarEndDate: calendarEndDate || undefined,
      search,
      categories,
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
      language
    };
  }

  private parsePositiveInt(value: string | null, fallback: number): number {
    const parsed = Number.parseInt((value || '').trim(), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return parsed;
  }

  private normalizeHexColor(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const shortHex = /^#([0-9a-fA-F]{3})$/;
    const longHex = /^#([0-9a-fA-F]{6})$/;
    const shortMatch = trimmed.match(shortHex);
    if (shortMatch) {
      const [r, g, b] = shortMatch[1].split('');
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    const longMatch = trimmed.match(longHex);
    if (longMatch) return `#${longMatch[1].toLowerCase()}`;
    return null;
  }

  private darkenHex(color: string, amount: number): string {
    const normalized = this.normalizeHexColor(color);
    if (!normalized) return color;
    const value = normalized.slice(1);
    const r = Number.parseInt(value.slice(0, 2), 16);
    const g = Number.parseInt(value.slice(2, 4), 16);
    const b = Number.parseInt(value.slice(4, 6), 16);
    const factor = Math.max(0, Math.min(1, 1 - amount));
    const toHex = (channel: number) => Math.round(channel * factor).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private applyVisualConfig(): void {
    const grid = this.shadow.getElementById('grid') as HTMLElement;
    const cardMinWidth = Math.max(180, this.config.cardMinWidth || 280);
    const maxColumns = this.config.maxColumns && this.config.maxColumns > 0 ? this.config.maxColumns : null;
    const gap = 20;

    grid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${cardMinWidth}px, 1fr))`;

    if (maxColumns) {
      const maxWidth = maxColumns * cardMinWidth + (maxColumns - 1) * gap;
      grid.style.maxWidth = `${maxWidth}px`;
      grid.style.marginLeft = 'auto';
      grid.style.marginRight = 'auto';
    } else {
      grid.style.maxWidth = '';
      grid.style.marginLeft = '';
      grid.style.marginRight = '';
    }

    const accent = this.normalizeHexColor(this.config.accentColor || '');
    if (!accent) return;
    this.style.setProperty('--chip-active', accent);
    this.style.setProperty('--link', accent);
    this.style.setProperty('--link-hover', this.darkenHex(accent, 0.18));
  }

  private resetPagination(): void {
    const pageSize = Math.max(1, this.config.pageSize || 24);
    this.displayedCount = pageSize;
  }

  private showNextPage(): void {
    const step = Math.max(1, this.config.loadMoreStep || this.config.pageSize || 24);
    this.displayedCount += step;
    this.renderGrid();
  }

  private setupEventListeners(): void {
    const searchInput = this.shadow.getElementById('searchBar') as HTMLElement;
    const profileBack = this.shadow.getElementById('profileBack') as HTMLButtonElement;
    const profileTypeFilters = this.shadow.getElementById('profileTypeFilters') as HTMLElement;
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
        this.resetPagination();
        this.renderGrid();
      });
      searchInput.appendChild(input);
    } else {
      searchInput.style.display = 'none';
    }

    // Modal schlieÃŸen
    modalClose.addEventListener('click', () => {
      modal.classList.remove('open');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });

    profileBack.addEventListener('click', () => {
      this.activeProfilePubkey = null;
      this.profileTypeFilter = 'all';
      this.resetPagination();
      this.renderGrid();
    });

    profileTypeFilters.querySelectorAll<HTMLButtonElement>('button[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = (btn.getAttribute('data-filter') || 'all') as any;
        if (filter === 'all' || filter === 'calendar' || filter === 'amb') {
          this.profileTypeFilter = filter;
          this.resetPagination();
          this.renderGrid();
        }
      });
    });
  }

  private renderProfileHeader(): void {
    const header = this.shadow.getElementById('profileHeader') as HTMLElement;
    const banner = this.shadow.getElementById('profileBanner') as HTMLElement;
    const avatar = this.shadow.getElementById('profileAvatarLarge') as HTMLElement;
    const nameEl = this.shadow.getElementById('profileName') as HTMLElement;
    const subEl = this.shadow.getElementById('profileSub') as HTMLElement;
    const aboutEl = this.shadow.getElementById('profileAbout') as HTMLElement;
    const searchBar = this.shadow.getElementById('searchBar') as HTMLElement;
    const categories = this.shadow.getElementById('categories') as HTMLElement;
    const filterWrap = this.shadow.getElementById('profileTypeFilters') as HTMLElement;

    if (!this.activeProfilePubkey) {
      header.style.display = 'none';
      searchBar.style.display = this.config.showSearch ? '' : 'none';
      categories.style.display = this.config.showCategories ? '' : 'none';
      return;
    }

    const pubkey = this.activeProfilePubkey;
    const profile = this.profiles.get(pubkey) || {};
    const displayName = (profile.display_name || profile.name || '').trim() || 'Unbekannter Nutzer';
    const sub = (profile.nip05 || pubkey).trim();

    header.style.display = 'block';
    searchBar.style.display = 'none';
    categories.style.display = 'none';

    banner.style.backgroundImage =
      profile.banner && this.isSafeHttpUrl(profile.banner) ? `url('${profile.banner}')` : 'none';
    avatar.style.backgroundImage =
      profile.picture && this.isSafeHttpUrl(profile.picture) ? `url('${profile.picture}')` : 'none';

    nameEl.textContent = displayName;
    subEl.textContent = sub;
    aboutEl.textContent = (profile.about || '').trim();
    aboutEl.style.display = aboutEl.textContent ? 'block' : 'none';

    filterWrap.querySelectorAll<HTMLButtonElement>('button[data-filter]').forEach((btn) => {
      const key = btn.getAttribute('data-filter') || 'all';
      btn.classList.toggle('active', key === this.profileTypeFilter);
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
    const normalizedKinds = Array.from(
      new Set(
        (Array.isArray(this.config.kinds) ? this.config.kinds : []).filter((kind) => Number.isFinite(kind))
      )
    );

    const createBaseFilter = (kinds: number[]) => {
      const filter: any = { kinds, limit: this.config.maxItems };
      if (this.config.authors.length > 0) {
        filter.authors = this.config.authors;
      }
      return filter;
    };

    const applyRelayTagFilters = (targetFilter: any, tagFilters: string[][]): void => {
      if (!Array.isArray(tagFilters) || tagFilters.length === 0) return;
      const relayTagFilters: Record<string, string[]> = {};
      tagFilters.forEach((tagFilter) => {
        if (!Array.isArray(tagFilter) || tagFilter.length < 2) return;
        const [rawKey, ...rawValues] = tagFilter;
        if (typeof rawKey !== 'string') return;
        const key = rawKey.trim();
        if (!key.startsWith('#')) return;
        const values = rawValues
          .map((value) => (typeof value === 'string' ? value.trim() : String(value).trim()))
          .filter(Boolean);
        if (values.length === 0) return;
        if (!relayTagFilters[key]) relayTagFilters[key] = [];
        relayTagFilters[key].push(...values);
      });

      Object.entries(relayTagFilters).forEach(([key, values]) => {
        targetFilter[key] = Array.from(new Set(values));
      });
    };

    const filters: any[] = [];
    const globalTags = Array.isArray(this.config.tags) ? this.config.tags : [];
    const ambOnlyTags = Array.isArray(this.config.ambTags) ? this.config.ambTags : [];

    const hasAmbKind = normalizedKinds.includes(30142);
    const nonAmbKinds = normalizedKinds.filter((kind) => kind !== 30142);

    if (nonAmbKinds.length > 0) {
      const nonAmbFilter = createBaseFilter(nonAmbKinds);
      applyRelayTagFilters(nonAmbFilter, globalTags);
      filters.push(nonAmbFilter);
    }

    if (hasAmbKind) {
      const ambFilter = createBaseFilter([30142]);
      applyRelayTagFilters(ambFilter, [...globalTags, ...ambOnlyTags]);
      filters.push(ambFilter);
    }

    if (filters.length === 0) {
      const fallbackKinds = normalizedKinds.length > 0 ? normalizedKinds : [30142, 31922, 31923, 1, 30023, 0];
      const fallback = createBaseFilter(fallbackKinds);
      applyRelayTagFilters(fallback, globalTags);
      filters.push(fallback);
    }

    return filters;
  }

  private parseDateStartMs(dateValue?: string): number | null {
    const value = (dateValue || '').trim();
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isFinite(parsed.getTime())) return null;
    return parsed.getTime();
  }

  private parseDateEndMs(dateValue?: string): number | null {
    const value = (dateValue || '').trim();
    if (!value) return null;
    const parsed = new Date(`${value}T23:59:59.999`);
    if (!Number.isFinite(parsed.getTime())) return null;
    return parsed.getTime();
  }

  private calendarEventStartMs(event: ParsedEvent): number | null {
    if (event.type !== 'calendar') return null;
    const metadata = event.metadata as any;
    const start = metadata?.start;

    if (typeof start === 'number' && Number.isFinite(start)) {
      return start * 1000;
    }

    if (typeof start === 'string') {
      const trimmed = start.trim();
      if (!trimmed) return null;
      if (/^[0-9]+$/.test(trimmed)) {
        return Number(trimmed) * 1000;
      }
      const parsed = new Date(`${trimmed}T00:00:00`);
      if (!Number.isFinite(parsed.getTime())) return null;
      return parsed.getTime();
    }

    return null;
  }

  private handleEvent(event: any): void {
    const parsedEvent = parseEvent(event);
    const includesProfileKind = Array.isArray(this.config.kinds) && this.config.kinds.includes(0);

    // Profil-Events immer fuer Name/Avatar cachen, aber nur als Card aufnehmen wenn kind:0 aktiviert ist.
    if (parsedEvent.type === 'profile') {
      this.profiles.set(event.pubkey, parsedEvent.metadata as ProfileMetadata);
      if (!includesProfileKind) {
        this.renderGrid();
        return;
      }
    }

    this.events.push(parsedEvent);

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
        this.resetPagination();
        this.renderGrid();
      });
      categoriesContainer.appendChild(chip);
    });
  }

  private renderGrid(): void {
    const grid = this.shadow.getElementById('grid') as HTMLElement;
    const paging = this.shadow.getElementById('paging') as HTMLElement;
    this.renderProfileHeader();

    if (this.events.length === 0) {
      grid.innerHTML = '<div class="loading">Verbinde mit Nostr...</div>';
      paging.innerHTML = '';
      return;
    }

    const selectedAuthors = this.activeProfilePubkey ? [this.activeProfilePubkey] : this.config.authors;
    const searchQuery = this.activeProfilePubkey ? '' : this.searchQuery;
    const selectedCategories = this.activeProfilePubkey ? [] : this.selectedCategories;

    // Filter anwenden
    const globalTags = Array.isArray(this.config.tags) ? this.config.tags : [];
    const ambOnlyTags = Array.isArray(this.config.ambTags) ? this.config.ambTags : [];

    const filterConfig = createFilterConfig(
      globalTags,
      [],
      searchQuery,
      selectedCategories,
      selectedAuthors
    );

    let filteredEvents = applyTwoLevelFilter(
      enrichWithProfiles(this.events, this.profiles),
      filterConfig
    );

    if (ambOnlyTags.length > 0) {
      filteredEvents = filteredEvents.filter((event) => {
        if (event.type !== 'amb') return true;
        return matchesAllFilters(event, ambOnlyTags);
      });
    }

    if (this.activeProfilePubkey) {
      filteredEvents = filteredEvents.filter((e) => e.type !== 'profile');
      if (this.profileTypeFilter !== 'all') {
        filteredEvents = filteredEvents.filter((e) => e.type === this.profileTypeFilter);
      }
    }

    const calendarStartMs = this.parseDateStartMs(this.config.calendarStartDate);
    const calendarEndMs = this.parseDateEndMs(this.config.calendarEndDate);

    if (calendarStartMs !== null || calendarEndMs !== null) {
      filteredEvents = filteredEvents.filter((event) => {
        if (event.type !== 'calendar') return true;
        const startMs = this.calendarEventStartMs(event);
        if (startMs === null) return false;
        if (calendarStartMs !== null && startMs < calendarStartMs) return false;
        if (calendarEndMs !== null && startMs > calendarEndMs) return false;
        return true;
      });
    }

    const displayEvents = filteredEvents.filter((event) => {
      if (event.type !== 'calendar') return true;
      const metadata = event.metadata as any;
      return Boolean(metadata?.start);
    });

    if (displayEvents.length === 0) {
      grid.innerHTML = '<div class="empty">Keine Ergebnisse gefunden</div>';
      paging.innerHTML = '';
      return;
    }

    grid.innerHTML = '';

    const pageActive = this.config.showLoadMore !== false;
    const visibleLimit = pageActive ? Math.max(1, this.displayedCount) : displayEvents.length;
    const visibleEvents = displayEvents.slice(0, visibleLimit);

    visibleEvents.forEach(event => {
      const card = this.createCard(event);
      grid.appendChild(card);
    });

    paging.innerHTML = '';
    if (pageActive && displayEvents.length > visibleLimit) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'load-more-button';
      button.textContent = `Mehr laden (${visibleLimit}/${displayEvents.length})`;
      button.addEventListener('click', () => this.showNextPage());
      paging.appendChild(button);
    }
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

      // Kanban-Boards: d-Tag ist ein Identifier (nostr:kanban:board-...), "Ã–ffnen" soll direkt zur Board-App gehen.
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
          return startStr === endStr ? startStr : `${startStr} â€“ ${endStr}`;
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
          return startStr === endStr ? startStr : `${startStr} â€“ ${endStr}`;
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
        return `${startStr} â€“ ${endFmt.format(new Date(end * 1000))}`;
      }
      return startStr;
    }

    if (typeof start === 'string') {
      if (typeof end === 'string' && end) return `${start} â€“ ${end}`;
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

  private openProfileModal(pubkey: string): void {
    const modal = this.shadow.getElementById('modal') as HTMLElement;
    const modalImage = this.shadow.getElementById('modalImage') as HTMLElement;
    const modalTitle = this.shadow.getElementById('modalTitle') as HTMLElement;
    const modalAvatar = this.shadow.getElementById('modalAvatar') as HTMLElement;
    const modalAuthor = this.shadow.getElementById('modalAuthor') as HTMLElement;
    const modalDescription = this.shadow.getElementById('modalDescription') as HTMLElement;
    const modalTags = this.shadow.getElementById('modalTags') as HTMLElement;
    const modalLink = this.shadow.getElementById('modalLink') as HTMLAnchorElement;

    const profile = this.profiles.get(pubkey) || {};
    const title = profile.display_name || profile.name || pubkey.slice(0, 8) + 'â€¦' + pubkey.slice(-4);

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

  private openProfile(pubkey: string): void {
    const normalized = normalizePubkey(pubkey) || pubkey;
    this.activeProfilePubkey = normalized;
    this.profileTypeFilter = 'all';
    this.queueProfileFetch([normalized]);
    this.resetPagination();
    (this.shadow.getElementById('modal') as HTMLElement).classList.remove('open');
    this.renderGrid();
  }

  private createCard(event: ParsedEvent): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';

    const metadata = event.metadata as any;
    const author = event.author;
    const authorPicture = author?.picture && this.isSafeHttpUrl(author.picture) ? author.picture : '';
    const authorNameRaw = author ? (author.name || author.display_name || '').trim() : '';
    const authorName = authorNameRaw || `Unbekannt ${event.event.pubkey.slice(-4)}`;

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
        ${!image ? '' : ''}
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
        <a class="card-link" href="${url || '#'}" target="_blank">Ã–ffnen &rarr;</a>
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
      if (metadata?.start === undefined) extraLines.push('Hinweis: start fehlt (Event ist unvollstÃ¤ndig).');
    }
    if (event.type === 'article') {
      if (metadata?.publishedAt) {
        extraLines.push(`VerÃ¶ffentlicht: ${new Date(Number(metadata.publishedAt) * 1000).toLocaleString('de-DE')}`);
      }
    }
    // AMB/OER (Kind 30142) Zusatzinfos werden als strukturierte KV-Zeilen unten angehÃ¤ngt,
    // damit Links (Lizenz, OER, Referenzen) klickbar sind und nicht doppelt im FlieÃŸtext landen.

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
        const name = prof?.name || prof?.display_name || pubkey.slice(0, 8) + 'â€¦' + pubkey.slice(-4);
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
