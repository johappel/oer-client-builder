<script lang="ts">
  let { children } = $props();
</script>

<div class="app">
  {@render children()}
</div>

<style>
  :global {
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background-color: #f5f5f5;
    }
  }
  
  .app {
    min-height: 100vh;
  }
</style>
