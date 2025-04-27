import { path } from '@tauri-apps/api';
import type { UnlistenFn } from '@tauri-apps/api/event';
import * as dialog from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { watch, type WatchEvent } from '@tauri-apps/plugin-fs';
import type { ObjectExpression } from 'acorn';

import { locale, translatorModeMessages } from '../intl';
import { RawStateWrapper } from './stateUtils.svelte';
import { debounce, toastError } from './utils';

let enabled = false;

export const translatorModeFilePath = new RawStateWrapper<string | null>(null);
let unwatch: null | UnlistenFn = null;
export async function selectTranslatorModeFile() {
	const filePath = await dialog.open({
		directory: false,
		multiple: false,
		defaultPath: await path.documentDir(),
		filters: [{ extensions: ['ts'], name: 'TypeScript' }],
	});
	if (typeof filePath === 'string') {
		unwatch?.();
		const { parse } = await import('acorn');
		translatorModeFilePath.current = filePath;

		const readFileAndExtractMessages = debounce(() => {
			readTextFile(filePath as string).then((contents) => {
				function getLineColMessagePrefix(position: number) {
					const line = Array.from(contents.substring(0, position)).filter(
						(char) => char === '\n',
					).length;
					const lastNewlineIndex = contents.lastIndexOf('\n', position);
					const column = position - (lastNewlineIndex + 1);
					return `Line ${line}, Column ${column}:`;
				}

				function extractMessages(
					objectExpression: ObjectExpression,
					messages: Record<string, string>,
					prefix: string,
				) {
					objectExpression.properties.forEach((property) => {
						if (property.type !== 'Property')
							throw new Error(
								`${getLineColMessagePrefix(property.start)} Expected Property, found ${property.type}`,
							);
						if (property.key.type !== 'Identifier' && property.key.type !== 'Literal')
							throw new Error(
								`${getLineColMessagePrefix(property.key.start)} Expected key to be Identifier or Literal, found ${property.key.type}`,
							);
						const key = `${prefix}${property.key.type === 'Identifier' ? property.key.name : property.key.value}`;
						if (property.value.type === 'ObjectExpression') {
							extractMessages(property.value, messages, `${key}.`);
						} else if (
							property.value.type === 'Literal' &&
							typeof property.value.value === 'string'
						) {
							messages[key] = property.value.value;
						} else if (
							property.value.type === 'TemplateLiteral' &&
							property.value.expressions.length === 0 &&
							property.value.quasis.length === 1
						) {
							messages[key] = property.value.quasis[0]?.value.raw ?? '';
						} else {
							throw new Error(
								`${getLineColMessagePrefix(property.value.start)} Expected value to be ObjectExpression, string Literal, or expressionless Template Literal; found ${property.value.type}`,
							);
						}
					});
					return messages;
				}

				try {
					const program = parse(contents, { ecmaVersion: 'latest', sourceType: 'module' });
					if (program.body[0]?.type !== 'ExportDefaultDeclaration')
						throw new Error(
							`${getLineColMessagePrefix(program.body[0]?.start ?? 0)} Expected ExportDefaultDeclaration, found ${program.body[0]?.type}`,
						);
					const declaration = program.body[0].declaration;
					if (declaration.type !== 'ObjectExpression')
						throw new Error(
							`${getLineColMessagePrefix(declaration.start)} Expected ObjectExpression, found ${declaration.type}`,
						);
					const messages = extractMessages(declaration, {}, '');
					translatorModeMessages.current = messages;
				} catch (error) {
					console.error(error);
					toastError({
						title: 'Failed to parse translation file',
						defaultValue: null,
					})(error);
				}
			});
		}, 50);

		const callback = (e?: WatchEvent) => {
			if (e == null || e.paths.some((p) => p === filePath)) readFileAndExtractMessages();
		};

		unwatch = await watch(filePath, callback);

		callback();
	}
}

function keydownListener(event: KeyboardEvent) {
	if (event.key === 'Alt') {
		locale.current = 'MessageID';
	}
}

function keyupListener(event: KeyboardEvent) {
	if (event.key === 'Alt') {
		locale.current =
			JSON.parse(localStorage.getItem('appSettings') ?? '{}')['appLocale'] ?? 'en-US';
	}
}

export function enableTranslatorMode() {
	if (!enabled) {
		enabled = true;
		window.addEventListener('keydown', keydownListener);
		window.addEventListener('keyup', keyupListener);
	}
}

export function disableTranslatorMode() {
	enabled = false;
	translatorModeFilePath.current = null;
	unwatch?.();
	window.removeEventListener('keydown', keydownListener);
	window.removeEventListener('keyup', keyupListener);
	translatorModeMessages.current = {};
}
