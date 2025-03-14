module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-hooks',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Enforce proper API utility function usage
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.name="fetch"]',
        message: 'Direct fetch() calls are not allowed. Use apiGet(), apiPost(), apiPut(), or apiDelete() from apiUtils.js instead.',
      },
    ],
    // Enforce proper imports for API utilities
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'axios',
            message: 'Please use the apiUtils functions instead of axios.',
          },
          {
            name: 'jquery',
            message: 'Please use the apiUtils functions instead of jQuery ajax.',
          },
        ],
      },
    ],
    // Disable specific rules for specific files
    'no-unused-vars': 'warn',
  },
  overrides: [
    {
      // Disable fetch restriction in apiUtils.js
      files: ['**/apiUtils.js', '**/src/utils/apiUtils.js'],
      rules: {
        'no-restricted-syntax': 'off',
      }
    }
  ]
};
