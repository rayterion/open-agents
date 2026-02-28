/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    // Allow explicit any in certain cases during development
    '@typescript-eslint/no-explicit-any': 'warn',
    // Allow empty interfaces
    '@typescript-eslint/no-empty-interface': 'off',
    // Allow unused vars prefixed with _
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // Allow require() where needed
    '@typescript-eslint/no-require-imports': 'warn',
    // Allow non-null assertions
    '@typescript-eslint/no-non-null-assertion': 'warn',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.js',
    '*.mjs',
    '*.cjs',
  ],
  overrides: [
    {
      // TypeScript files only
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    {
      // React Native / mobile specific
      files: ['apps/mobile/**/*.ts', 'apps/mobile/**/*.tsx'],
      env: {
        browser: true,
      },
      rules: {
        // React Native JSX doesn't require React import in newer versions
        'no-undef': 'off',
      },
    },
    {
      // Test files
      files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
