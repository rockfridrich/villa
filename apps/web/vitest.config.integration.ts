import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: 'integration',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/integration/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'node_modules/',
        'tests/',
        '.next/',
        '*.config.ts',
        '*.config.js',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
