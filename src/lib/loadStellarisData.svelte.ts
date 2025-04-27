import { rgb } from 'd3-color';
import { hsv } from 'd3-hsv';
import { z } from 'zod';

import { jsonify, tokenize } from '../shared/parseSave';
import { ADDITIONAL_COLORS } from './colors';
import { appSettings } from './settings';
import { PersistedRawState, RawStateWrapper } from './stateUtils.svelte';
import stellarMapsApi from './stellarMapsApi';
import { timeItAsync } from './utils';

export const stellarisPath = new PersistedRawState({
	name: 'stellarisPath',
	defaultValue: '',
	schema: z.string().catch(''),
});

export const stellarisDataPromise = new RawStateWrapper<
	ReturnType<typeof loadStellarisDataUnwrapped>
>(
	new Promise(() => {
		// do nothing
	}),
);

let loadedLanguage = appSettings.current.appStellarisLanguage;
$effect.root(() => {
	$effect(() => {
		if (loadedLanguage !== appSettings.current.appStellarisLanguage) {
			loadStellarisData();
		}
	});
});

export function loadStellarisData() {
	stellarisDataPromise.current = loadStellarisDataUnwrapped();
	return stellarisDataPromise.current;
}

async function loadStellarisDataUnwrapped() {
	const path = stellarisPath.current || (await stellarMapsApi.loadStellarisInstallDir());
	stellarisPath.current = path;
	const language = appSettings.current.appStellarisLanguage;
	loadedLanguage = language;
	const [colors, loc] = await Promise.all([loadColors(path), loadLoc(path, language)]);
	return { colors, loc };
}

function loadLoc(path: string, language: string) {
	return timeItAsync('loadLoc', stellarMapsApi.loadLoc, path, language);
}

async function loadColors(path: string): Promise<Record<string, string>> {
	const rawContents = await timeItAsync('loadColors', stellarMapsApi.loadColors, path);
	const colors: Record<string, string> = {};
	for (const rawContent of rawContents) {
		const re = /(hsv|rgb)\s*(\{\s*\d+\.?\d*\s*\d+\.?\d*\s*\d+\.?\d*\s*\})/gi;
		const processedRawContent = rawContent.replace(re, (match) => {
			return `{ ${match.substring(0, 3)} = ${match.substring(3)} }`;
		});
		const parsed = jsonify(tokenize(processedRawContent)) as {
			colors: Record<
				string,
				{
					map: { hsv?: [number, number, number]; rgb?: [number, number, number] };
				}
			>;
		};
		Object.entries(parsed.colors).forEach(([key, val]) => {
			let vals: [number, number, number] = [0, 0, 0];
			if (val.map.rgb) {
				vals = val.map.rgb;
			} else if (val.map.hsv) {
				vals = val.map.hsv;
			}
			const color = val.map.rgb ? rgb(...vals) : hsv(vals[0] * 360, vals[1], vals[2]);
			colors[key] = color.formatRgb();
		});
	}
	Object.assign(colors, ADDITIONAL_COLORS);
	return colors;
}
