import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/00-setup.ts'],
    globalSetup: ['tests/02-bd.global-setup.ts'],
    // Los archivos comparten compustore_test (el seed vacía tablas): se ejecutan uno tras otro.
    fileParallelism: false,
  },
})
