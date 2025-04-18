import { z } from 'zod';

import { PersistedRawState } from '$lib/stateUtils.svelte';

import { getBestLocale, locale, LOCALES } from '../../intl';
import { disableTranslatorMode, enableTranslatorMode } from '../translatorMode';

export type StringAppSettings = 'appLocale' | 'appStellarisLanguage';
export type BooleanAppSettings = 'appTranslatorMode';

const STELLARIS_LANGUAGES = [
	'l_english',
	'l_braz_por',
	'l_german',
	'l_french',
	'l_spanish',
	'l_polish',
	'l_russian',
	'l_simp_chinese',
	'l_japanese',
	'l_korean',
] as const;
export type StellarisLanguage = (typeof STELLARIS_LANGUAGES)[number];

const zAppSettings = z.object({
	appLocale: z.enum(LOCALES).catch(getBestLocale()),
	appStellarisLanguage: z.enum(STELLARIS_LANGUAGES).catch('l_english'),
	appTranslatorMode: z.boolean().catch(false),
});

export type AppSettings = z.infer<typeof zAppSettings>;

const defaultAppSettings: AppSettings = zAppSettings.parse({});

export const appSettings = new PersistedRawState<AppSettings>({
	name: 'appSettings',
	defaultValue: defaultAppSettings,
	schema: zAppSettings,
});

$effect.root(() => {
	$effect(() => {
		if (appSettings.current.appTranslatorMode) {
			enableTranslatorMode();
		} else {
			disableTranslatorMode();
		}
	});

	$effect(() => {
		locale.current = appSettings.current.appLocale;
	});
});
