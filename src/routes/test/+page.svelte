<script lang="ts">
  import { onMount } from 'svelte';

  const GENERATED_CODE_STORAGE_KEY = 'oer-client-builder:widget-builder-generated-code:v1';

  let code = $state('');
  let iframeSrcdoc = $state('');
  let lastRunLabel = $state('');

  function defaultCode(origin: string): string {
    return `<!-- Nostr Feed Widget -->
<script type="module" src="${origin}/src/lib/widget/nostr-feed.ts"><\/script>
<nostr-feed
  relays="wss://relay.edufeed.org,wss://relay-rpi.edufeed.org,wss://amb-relay.edufeed.org"
  kinds="30142,31922,31923,1,30023"
  pageSize="12"
></nostr-feed>`;
  }

  function createIframeDoc(snippet: string): string {
    return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        margin: 0;
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background: #f5f5f5;
      }
    </style>
  </head>
  <body>
${snippet}
  </body>
</html>`;
  }

  function runSnippet(): void {
    iframeSrcdoc = createIframeDoc(code);
    lastRunLabel = new Date().toLocaleTimeString('de-DE');
    try {
      localStorage.setItem(GENERATED_CODE_STORAGE_KEY, code);
    } catch {
      // ignore
    }
  }

  function loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(GENERATED_CODE_STORAGE_KEY);
      if (stored && stored.trim()) {
        code = stored;
      }
    } catch {
      // ignore
    }
  }

  function resetToDefault(): void {
    code = defaultCode(window.location.origin);
    runSnippet();
  }

  onMount(() => {
    loadFromStorage();
    if (!code.trim()) {
      code = defaultCode(window.location.origin);
    }
    runSnippet();
  });
</script>

<div class="test-page">
  <header>
    <h1>Widget Testseite</h1>
    <p>Hier kannst du den generierten Embed-Code direkt testen.</p>
  </header>

  <div class="actions">
    <button type="button" onclick={runSnippet}>Vorschau aktualisieren</button>
    <button type="button" class="secondary" onclick={loadFromStorage}>Aus Builder laden</button>
    <button type="button" class="secondary" onclick={resetToDefault}>Default-Code</button>
    <a href="/" class="link-button">Zum Builder</a>
    {#if lastRunLabel}
      <span class="run-info">Letzter Lauf: {lastRunLabel}</span>
    {/if}
  </div>

  <div class="layout">
    <details class="panel embed-accordion">
      <summary>Embed-Code</summary>
      <div class="embed-content">
        <textarea bind:value={code} rows="20" spellcheck="false"></textarea>
      </div>
    </details>

    <section class="panel preview-panel">
      <h2>Vorschau (volle Breite)</h2>
      <iframe title="Widget Vorschau" srcdoc={iframeSrcdoc}></iframe>
    </section>
  </div>
</div>

<style>
  .test-page {
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 16px 20px;
    box-sizing: border-box;
  }

  h1 {
    margin: 0 0 6px;
  }

  p {
    margin: 0 0 14px;
    color: #4b5563;
  }

  .actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 14px;
  }

  button,
  .link-button {
    border: none;
    border-radius: 6px;
    padding: 9px 12px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
    background: #7e22ce;
    color: #fff;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
  }

  button.secondary {
    background: #e5e7eb;
    color: #111827;
  }

  .run-info {
    color: #6b7280;
    font-size: 12px;
    margin-left: auto;
  }

  .layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .panel {
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    padding: 12px;
    display: grid;
    gap: 10px;
  }

  .embed-accordion {
    padding: 0;
    overflow: hidden;
  }

  .embed-accordion summary {
    cursor: pointer;
    list-style: none;
    padding: 12px;
    font-size: 16px;
    font-weight: 700;
    border-bottom: 1px solid #e5e7eb;
  }

  .embed-accordion summary::-webkit-details-marker {
    display: none;
  }

  .embed-content {
    padding: 12px;
  }

  .panel h2 {
    margin: 0;
    font-size: 16px;
  }

  textarea {
    width: 100%;
    min-height: 260px;
    font-family: "Courier New", monospace;
    font-size: 12px;
    line-height: 1.4;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 10px;
    resize: vertical;
    box-sizing: border-box;
  }

  iframe {
    width: 100%;
    min-height: 78vh;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
  }

  .preview-panel {
    padding-bottom: 14px;
  }
</style>
