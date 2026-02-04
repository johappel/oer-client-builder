<script lang="ts">
  import { onMount } from 'svelte';
  import type { WidgetConfig } from '../nostr/types.js';
  import type { NostrFeedWidget as NostrFeedWidgetType } from '../widget/nostr-feed.js';
  
  // Form State mit Svelte 5 Runes
  let relays = $state('wss://relay.edufeed.org,wss://relay-rpi.edufeed.org,wss://amb-relay.edufeed.org');
  let authors = $state('');
  let tags = $state('[]');
  let search = $state('');
  let kinds = $state('30142,31922,1,30029,0');
  let maxItems = $state('50');
  let showSearch = $state(true);
  let showCategories = $state(true);
  let showAuthor = $state(true);
  let theme = $state('auto');
  
  // Preview Element
  let previewContainer: HTMLElement | null = $state(null);
  let widgetInstance: NostrFeedWidgetType | null = null;
  let NostrFeedWidget: typeof NostrFeedWidgetType | null = $state(null);
  
  // Generated Code
  let generatedCode = $state('');
  
  // Parse Form State
  function parseFormState(): WidgetConfig {
    const relayArray = relays.split(',').map(r => r.trim()).filter(Boolean);
    const authorArray = authors.split(',').map(a => a.trim()).filter(Boolean);
    const kindArray = kinds.split(',').map(k => parseInt(k.trim(), 10)).filter(k => !isNaN(k)) as any;
    const maxItemsNum = parseInt(maxItems, 10) || 50;
    
    let tagsArray: string[][] = [];
    try {
      tagsArray = JSON.parse(tags) as string[][];
    } catch (e) {
      console.error('Invalid JSON in tags:', e);
    }
    
    return {
      relays: relayArray,
      kinds: kindArray,
      authors: authorArray,
      tags: tagsArray,
      search,
      categories: [],
      maxItems: maxItemsNum,
      showSearch,
      showCategories,
      showAuthor,
      theme: theme as 'light' | 'dark' | 'auto',
      language: 'de'
    };
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
    
    if (config.theme !== 'auto') {
      attributes.push(`theme="${config.theme}"`);
    }
    
    attributes.push('maxItems="' + config.maxItems + '"');
    
    return `<!-- Nostr Feed Widget -->
<script type="module" src="https://your-domain.com/nostr-feed.js"><\/script>
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
  
  // Update on state change
  $effect(() => {
    const config = parseFormState();
    generatedCode = generateCode(config);

    const widgetCtor = NostrFeedWidget;
    const container = previewContainer;
    if (!widgetCtor || !container) return;
    updatePreview(config, widgetCtor, container);
  });
  
  // Initial setup
  onMount(async () => {
    console.log('[WidgetBuilder] onMount called');
    // Dynamisch importieren für Browser-only
    const module = await import('../widget/nostr-feed.js');
    NostrFeedWidget = module.NostrFeedWidget;
    console.log('[WidgetBuilder] NostrFeedWidget loaded');
    // Vorschau wird per $effect aktualisiert
  });
</script>

<div class="widget-builder">
  <h1>Nostr Feed Widget Builder</h1>
  
  <div class="builder-layout">
    <div class="form-section">
      <h2>Konfiguration</h2>
      
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
        <label for="authors">Autoren (npubs, kommasepariert)</label>
        <input
          type="text"
          id="authors"
          bind:value={authors}
          placeholder="npub1...,npub2..."
        />
      </div>
      
      <div class="form-group">
        <label for="tags">Tags (JSON Array)</label>
        <textarea
          id="tags"
          bind:value={tags}
          rows="3"
          placeholder='[["#teaches:id","religion"],["#educationalLevel","primary"]]'
        ></textarea>
      </div>
      
      <div class="form-group">
        <label for="search">Suchbegriff</label>
        <input
          type="text"
          id="search"
          bind:value={search}
          placeholder="Suchbegriff..."
        />
      </div>
      
      <div class="form-group">
        <label for="kinds">Event Types (kommasepariert)</label>
        <input
          type="text"
          id="kinds"
          bind:value={kinds}
          placeholder="30142,31922,1,30029,0"
        />
        <small>30142=OER, 31922=Veranstaltung, 1=Note, 30029=Artikel, 0=Profil</small>
      </div>
      
      <div class="form-group">
        <label for="maxItems">Maximale Anzahl</label>
        <input
          type="number"
          id="maxItems"
          bind:value={maxItems}
          min="10"
          max="200"
        />
      </div>
      
      <div class="form-group">
        <label for="theme">Theme</label>
        <select id="theme" bind:value={theme}>
          <option value="auto">Auto</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
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
          Kategorien anzeigen
        </label>
      </div>
      
      <div class="form-group checkbox-group">
        <label>
          <input type="checkbox" bind:checked={showAuthor} />
          Autoren anzeigen
        </label>
      </div>
    </div>
    
    <div class="preview-section">
      <h2>Vorschau</h2>
      <div class="preview-container" bind:this={previewContainer}></div>
    </div>
  </div>
  
  <div class="code-section">
    <h2>Generierter Code</h2>
    <pre class="code-block">{generatedCode}</pre>
    <button class="copy-button" onclick={copyToClipboard}>
      Code kopieren
    </button>
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
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: #374151;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
  }
  
  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #7e22ce;
  }
  
  .form-group small {
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
  
  .preview-section {
    background: #f9fafb;
    padding: 20px;
    border-radius: 8px;
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
</style>
