/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}
  },
  test: {
    include: ['tests/**/*.{test,spec}.?(c|m)[jt]s?(x)', 'tests/**/*Test.ts'],
    globals: true,
    environment: 'node'
  }
});
