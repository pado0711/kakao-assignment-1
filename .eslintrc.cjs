module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  plugins: [
    'react',
    'react-hooks',
  ],
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
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: 'module',
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/core-modules': [
      'vite',
      '@vitejs/plugin-react',
    ],
  },
  rules: {
    'import/extensions': ['error', 'ignorePackages', {
      js: 'always',
      jsx: 'always',
    }],
    'react/jsx-filename-extension': ['error', {
      extensions: ['.jsx'],
    }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': ['error', {
      allow: ['warn', 'error'],
    }],
  },
};
