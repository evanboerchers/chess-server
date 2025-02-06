import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Enables global variables like `expect`, `test`, `vi`, etc.
    environment: 'node', // Sets the environment to node for backend tests
    alias: {
    },
    transform: {
    },
    setupFiles: [], // If you have any setup file
    snapshotFormat: {
      // Customize snapshot formatting if needed
      printBasicPrototype: false,
    },
  },
});
