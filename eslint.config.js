/**
 * ESLint Configuration (v9+)
 * AI Bradaa - Production-grade linting
 */

import js from '@eslint/js';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'archive/**',
      '.netlify/**',
      'coverage/**',
    ],
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        // Test globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      // Error prevention
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'no-console': 'off', // We use console for server-side logging
      'no-undef': 'error',

      // Code style
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'always-multiline'],
      'indent': ['error', 2, { SwitchCase: 1 }],

      // Best practices
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'prefer-arrow-callback': 'warn',
      'no-throw-literal': 'error',

      // Async/await
      'require-await': 'warn',
      'no-return-await': 'error',
    },
  },
];
