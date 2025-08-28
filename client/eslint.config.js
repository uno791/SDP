// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';
import jestPlugin from 'eslint-plugin-jest';
import testingLibrary from 'eslint-plugin-testing-library';
import jestDom from 'eslint-plugin-jest-dom';

export default tseslint.config(
  // 0) Ignores
  { ignores: ['dist', 'build', 'coverage', '**/*.d.ts'] },

  // 1) Base JS + TS recommendations (type-aware)
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked, // requires tsconfig
    ],
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        // type-aware rules need a tsconfig:
        project: ['./tsconfig.json'],
        tsconfigRootDir: process.cwd(),
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React 17+ (no need to import React)
      'react/react-in-jsx-scope': 'off',

      // Hooks & accessibility best practices
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      // Vite fast refresh
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // 2) Tests: Jest + React Testing Library + jest-dom
  {
    name: 'jest-and-rtl',
    files: ['**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
        // If you also use the DOM in tests (common with RTL):
        ...globals.browser,
      },
    },
    plugins: {
      jest: jestPlugin,
      'testing-library': testingLibrary,
      'jest-dom': jestDom,
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      ...jestPlugin.configs.style.rules,
      ...testingLibrary.configs.react.rules,
      ...jestDom.configs.recommended.rules,
    },
  }
);
