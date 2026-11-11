// Builds the whole app into one self-contained HTML file (dist-single/index.html).
// Handy for sharing a preview; the normal `npm run build` output is what you deploy.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'dist-single', emptyOutDir: true },
});
