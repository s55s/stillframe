import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset URLs, so the built game works from any sub-path: GitHub Pages
  // serves it at https://<user>.github.io/<repo>/, not at the site root.
  base: './',
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: {
    target: 'es2022',
    // Source maps in the production build too, so breakpoints in .ts files
    // also bind when debugging the built bundle (the "Production build" launch config).
    sourcemap: true,
  },
});
