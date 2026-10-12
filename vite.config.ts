import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/39Kingdom/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        print: resolve(__dirname, 'print.html'),
      },
    },
  },
});
