// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages: https://bo-10000.github.io/mandooshelf/
export default defineConfig({
  site: 'https://bo-10000.github.io',
  base: '/mandooshelf',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
  },
});
