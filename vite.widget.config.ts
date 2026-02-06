import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		emptyOutDir: false,
		outDir: 'static',
		lib: {
			entry: resolve(__dirname, 'src/lib/widget/nostr-feed.ts'),
			formats: ['es'],
			fileName: () => 'nostr-feed.js'
		},
		rollupOptions: {
			output: {
				inlineDynamicImports: true
			}
		},
		target: 'es2020',
		minify: 'esbuild',
		sourcemap: true
	}
});
