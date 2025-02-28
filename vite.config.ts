/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  plugins: [react(), tailwindcss()],
  define: {
    'process.env': {}
  },
  test: {
    include: ['tests/**/*.{test,spec}.?(c|m)[jt]s?(x)', 'tests/**/*Test.ts'],
    globals: true,
    environment: 'node'
  }
});
