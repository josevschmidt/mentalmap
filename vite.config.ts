import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Correção para __dirname em módulos ESM (necessário para o build no GitHub)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: '/', // Essencial para rodar na raiz do seu subdomínio
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  // Removi o bloco "define" e "server" para simplificar, 
  // já que você não tem a chave de API no momento.
});