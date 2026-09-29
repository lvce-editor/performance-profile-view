import * as config from '@lvce-editor/eslint-config'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...config.default,
  ...config.recommendedRegex,
  ...config.recommendedTsconfig,
  ...config.recommendedVirtualDom,
  ...config.recommendedActions,
  {
    files: ['packages/extension/src/**/*.ts'],
    rules: {
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      'virtual-dom/prefer-state-destructuring': 'off',
    },
  },
  {
    files: ['packages/performance-profile-parser-worker/src/**/*.ts'],
    rules: {
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
    },
  },
  {
    files: ['packages/extension/test/**/*.ts'],
    rules: {
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      'virtual-dom/no-inline-event-handlers': 'off',
      'virtual-dom/no-object-attribute-values': 'off',
      'virtual-dom/prefer-merge-class-names': 'off',
      'virtual-dom/prefer-state-destructuring': 'off',
    },
  },
  {
    rules: {
      'e2e/no-imports': 'off',
      'github-actions/action-versions': 'off',
      'github-actions/ci-versions': 'off',
      'sonarjs/void-use': 'off',
    },
  },
])
