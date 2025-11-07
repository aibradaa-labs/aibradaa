export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.mjs'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: [
    '**/tests/unit/**/*.test.mjs',
    '**/tests/integration/**/*.test.mjs',
  ],
  collectCoverageFrom: [
    'api/**/*.mjs',
    'app/**/*.mjs',
    'ai_pod/**/*.mjs',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/dist/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageDirectory: 'coverage',
  verbose: true,
};
