import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: [
      'unthreatening-pseudoascetical-veronique.ngrok-free.dev',
      '*.ngrok-free.dev'
    ]
  }
});