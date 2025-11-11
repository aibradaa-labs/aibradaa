/**
 * ESLint Configuration (v9+)
 * AI Bradaa - Production-grade linting
 * Standalone config without @eslint/js dependency
 */

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'archive/**',
      '.netlify/**',
      'coverage/**',
      'data/**',
      'docs/**',
      '**/*.md',
      'project/governance/84/eval_suites/**',
    ],
  },
  {
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
      // Error prevention (relaxed for now)
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'no-undef': 'warn',
      'no-undef-init': 'off',
      'no-undefined': 'off',

      // Code style (warnings only)
      'semi': 'off',
      'quotes': 'off',
      'comma-dangle': 'off',
      'indent': 'off',

      // Best practices (warnings)
      'eqeqeq': 'off',
      'no-var': 'warn',
      'prefer-const': 'off',
      'prefer-arrow-callback': 'off',
      'no-throw-literal': 'off',

      // Async/await
      'require-await': 'off',
      'no-return-await': 'off',

      // Disable problematic rules
      'no-constant-condition': 'off',
      'no-empty': 'off',
    },
  },
];
