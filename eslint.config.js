import { fileURLToPath } from 'node:url';

import { includeIgnoreFile } from '@eslint/compat';
import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import eslintPluginSvelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

import svelteConfig from './svelte.config.js';

const extraFileExtensions = ['.svelte'];
const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

/** @type {import('eslint').Linter.Config[]} */
export default tsEslint.config(
	includeIgnoreFile(gitignorePath),
	{ files: ['src/**/*.{ts}'] },
	{ languageOptions: { globals: { ...globals.browser, ...globals.node } } },
	pluginJs.configs.recommended,
	// ts
	...tsEslint.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				extraFileExtensions,
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	// svelte
	...eslintPluginSvelte.configs['flat/recommended'],
	{
		files: ['src/**/*.svelte'],
		languageOptions: {
			parserOptions: {
				extraFileExtensions,
				parser: tsEslint.parser,
				svelteConfig: svelteConfig,
			},
		},
	},
	// prettier
	eslintConfigPrettier,
	...eslintPluginSvelte.configs['flat/prettier'],
	// other
	{
		plugins: {
			'simple-import-sort': simpleImportSort,
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/prefer-nullish-coalescing': 'error',
			'@typescript-eslint/strict-boolean-expressions': ['error', { allowNullableBoolean: true }],
			'@typescript-eslint/no-unnecessary-condition': 'error',
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error',
		},
	},
	// disable type-aware linting for some files
	{
		files: [
			'*.{js,ts,cjs}', // root dir config files
			'scripts/*', // helper scripts
			'src/electron/preload.cjs',
		],
		...tsEslint.configs.disableTypeChecked,
	},
	{
		ignores: ['src-tauri/'],
	},
);
