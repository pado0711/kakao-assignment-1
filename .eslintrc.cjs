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
    'eslint-report.json',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
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
