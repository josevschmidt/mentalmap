import path from 'path';
import { fileURLToPath } from 'url'; // Adicione isso
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Adicione estas duas linhas para simular o __dirname no ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    base: '/', // Adicione isso explicitamente para garantir que funcione no subdomínio
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'), // Ajustei para './' para apontar para a raiz conforme seu código
      }
    }
  };
});