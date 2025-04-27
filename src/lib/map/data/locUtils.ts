import { romanize } from 'romans';

import type { LocalizedText } from '../../GameState.svelte';
import { stellarisDataPromise } from '../../loadStellarisData.svelte';
import { appSettings, type StellarisLanguage } from '../../settings';
import { isDefined } from '../../utils';

function getStellarisLanguageCode(stellarisLanguage: StellarisLanguage) {
	const stellarisLanguageToCode: Record<StellarisLanguage, string> = {
		l_english: 'en-US',
		l_braz_por: 'pt-BR',
		l_german: 'de-DE',
		l_french: 'fr-FR',
		l_spanish: 'es-ES',
		l_polish: 'pl-PL',
		l_russian: 'ru-RU',
		l_simp_chinese: 'zh-CN',
		l_japanese: 'ja-JP',
		l_korean: 'ko-KR',
	};
	return stellarisLanguageToCode[stellarisLanguage];
}

function getStellarisLanguageOrdinals(stellarisLanguage: string): Record<string, string> {
	return (
		{
			l_english: { one: 'st', two: 'nd', few: 'rd', other: 'th' },
			// TODO? implement other languages
		}[stellarisLanguage] ?? {}
	);
}

const formatOrdinals = (n: number) => {
	const enOrdinalRules = new Intl.PluralRules(
		getStellarisLanguageCode(appSettings.current.appStellarisLanguage),
		{ type: 'ordinal' },
	);
	const rule = enOrdinalRules.select(n);
	const suffix = getStellarisLanguageOrdinals(appSettings.current.appStellarisLanguage)[rule] ?? '';
	return `${new Intl.NumberFormat(getStellarisLanguageCode(appSettings.current.appStellarisLanguage)).format(n)}${suffix}`;
};

const numFormatters = {
	CARD: (n: number) =>
		new Intl.NumberFormat(
			getStellarisLanguageCode(appSettings.current.appStellarisLanguage),
		).format(n),
	C: (n: number) =>
		new Intl.NumberFormat(getStellarisLanguageCode(appSettings.current.appStellarisLanguage), {
			minimumIntegerDigits: 1,
		}).format(n),
	CC: (n: number) =>
		new Intl.NumberFormat(getStellarisLanguageCode(appSettings.current.appStellarisLanguage), {
			minimumIntegerDigits: 2,
		}).format(n),
	CCC: (n: number) =>
		new Intl.NumberFormat(getStellarisLanguageCode(appSettings.current.appStellarisLanguage), {
			minimumIntegerDigits: 3,
		}).format(n),
	CC0: (n: number) =>
		new Intl.NumberFormat(getStellarisLanguageCode(appSettings.current.appStellarisLanguage), {
			minimumIntegerDigits: 2,
		}).format(n - 1),
	ORD: formatOrdinals,
	ORD0: (n: number) => formatOrdinals(n - 1),
	R: (n: number) => romanize(n),
	HEX: (n: number) => n.toString(16),
};

export function localizeText(text: LocalizedText) {
	return stellarisDataPromise.current.then(({ loc }) => localizeTextSync(text, loc));
}

export function localizeTextSync(
	text: null | undefined | LocalizedText,
	loc: Record<string, string>,
): string {
	if (text == null) return 'NULL';
	if (text.key === '%ACRONYM%') {
		const base = text.variables?.find((v) => v.key === 'base')?.value;
		return base
			? localizeTextSync(base, loc)
					.split(' ')
					.filter((s) => s.length > 0)
					// first char of each word + last char of final word (cause that's how acronyms work in Stellaris *shrug*)
					.flatMap((s, i, a) => (i < a.length - 1 ? [s[0]] : [s[0], s[s.length - 1]]))
					.filter(isDefined)
					.join('')
					.toLocaleUpperCase(getStellarisLanguageCode(appSettings.current.appStellarisLanguage))
			: '';
	} else if (text.key === '%SEQ%') {
		const fmt = text.variables?.find((v) => v.key === 'fmt')?.value;
		const num = text.variables?.find((v) => v.key === 'num')?.value;
		if (fmt == null || num == null) {
			console.warn('localization failed', text);
			return 'LOCALIZATION FAILED';
		}
		return localizeTextSync(
			{
				key: fmt.key,
				variables: Object.entries(numFormatters).map(([key, formatter]) => ({
					key,
					value: { key: formatter(parseInt(num.key)) },
				})),
			},
			loc,
		);
	} else if (text.key === '%ADJECTIVE%') {
		try {
			const var0 = text.variables?.[0];
			const var1 = text.variables?.[1];
			if (!var0) throw new Error();
			return (loc['adj_format'] ?? 'adj $1$')
				.replace('adj', localizeTextSync(var0.value, loc))
				.replace('$1$', var1 ? localizeTextSync(var1.value, loc) : '');
		} catch {
			console.warn('localization failed', text);
			return 'LOCALIZATION FAILED';
		}
	} else if (text.key === '%ADJ%') {
		try {
			const var0 = text.variables?.[0];
			if (!var0 || !var0.value?.variables) throw new Error();
			const adj = loc[var0.value.key] ?? var0.value.key;
			if (adj.match(/\$\w+\$/)) {
				return localizeTextSync(var0.value, loc);
			} else {
				return (loc['adj_format'] ?? 'adj $1$')
					.replace('adj', adj)
					.replace(
						'$1$',
						localizeTextSync(var0.value.variables.find((v) => v.key === '1')?.value, loc),
					);
			}
		} catch {
			console.warn('localization failed', text);
			return 'LOCALIZATION FAILED';
		}
	}
	let value = loc[text.key];
	if (value == null) return removeColorAndIconCodes(text.key);
	if (text.variables) {
		text.variables.forEach((variable) => {
			const localizedVariable = localizeTextSync(variable.value, loc);
			value = (value as string)
				.replace(`$${variable.key}$`, localizedVariable)
				.replace(`[${variable.key}]`, localizedVariable)
				.replace(`<${variable.key}>`, localizedVariable);
		});
	}
	return removeColorAndIconCodes(value);
}

export function removeColorAndIconCodes(text: string): string {
	return text.replace(/[\u0011§].?/g, '').replace(/\u0013\w*/g, ''); // eslint-disable-line no-control-regex
}
