module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'plugin:sonarjs/recommended',
  ],
  ignorePatterns: [
    'coverage/',
    'dist/',
    'eslint-report.json',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    'import/core-modules': [
      'vite',
      '@vitejs/plugin-react',
    ],
  },
  rules: {
    'import/extensions': ['error', 'ignorePackages', {
      js: 'always',
    }],
    'no-console': ['error', {
      allow: ['warn', 'error'],
    }],
  },
};
