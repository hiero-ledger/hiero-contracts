// SPDX-License-Identifier: Apache-2.0

import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

// Custom inline plugin for header checking
const headerRule = {
    create(context) {
        return {
            Program(node) {
                const comments = context.sourceCode.getAllComments();
                const hasHeader = comments.some(comment =>
                    comment.value.includes('SPDX-License-Identifier: Apache-2.0'),
                );

                if (!hasHeader) {
                    context.report({ node, message: 'Missing SPDX license header' });
                }
            },
        };
    },
};

export default defineConfig([
    // Global ignores
    {
        ignores: ['**/node_modules/**', '**/dist/**'],
    },

    // Base recommended configs
    js.configs.recommended,

    // Main configuration for all JS files
    {
        files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
        plugins: {
            'simple-import-sort': simpleImportSort,
            local: {
                rules: {
                    header: headerRule,
                },
            },
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.es2021,
                __ENV: 'readonly',
            },
        },
        rules: {
            // Disable rules that conflict with Prettier
            ...prettierConfig.rules,

            // Style & safety
            'no-trailing-spaces': 'error',
            'no-useless-escape': 'warn',
            'prefer-const': 'error',
            'comma-dangle': [
                'error',
                {
                    arrays: 'always-multiline',
                    objects: 'always-multiline',
                    imports: 'always-multiline',
                    exports: 'always-multiline',
                    functions: 'always-multiline',
                },
            ],

            // Import sorting
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'off',

            // SPDX header
            'local/header': 'error',
        },
    },

    // Config for eslint config files themselves
    {
        files: ['eslint.config.mjs'],
        languageOptions: {
            sourceType: 'module',
            globals: {
                ...globals.node,
            },
        },
    },

    // Test files - relaxed rules (JS only)
    {
        files: ['**/*.spec.js', '**/*.test.js', '**/test/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.mocha,
            },
        },
    },
]);
