// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://cifrasyfinanzas.com',
  // Los enlaces internos, el canonical y el sitemap usan barra final, pero se aceptan las dos formas:
  // si alguien escribe o pega la URL sin la barra, la página carga igual (en producción Cloudflare
  // Pages redirige a la versión con barra).
  trailingSlash: 'ignore',
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [react(), sitemap()]
});