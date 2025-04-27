import IntlMessageFormat, { type FormatXMLElementFn, type PrimitiveType } from 'intl-messageformat';

import { RawStateWrapper } from '$lib/stateUtils.svelte';
import { getOrSetDefault } from '$lib/utils';

import enUS from './en-US';
import fiFI from './fi-FI';
import jaJP from './ja-JP';
import zhTW from './zh-TW';

type Paths<T> = T extends object
	? {
			[K in keyof T]: `${Exclude<K, symbol>}${Paths<T[K]> extends never ? '' : `.${Paths<T[K]>}`}`;
		}[keyof T]
	: never;

export type MessageID = Paths<typeof enUS>;

type UnflattenedMessages = { [key: string]: string | UnflattenedMessages };
function flattenMessages(messages: UnflattenedMessages, prefix = ''): Record<string, string> {
	return Object.fromEntries(
		Object.entries(messages).flatMap(([k, v]) =>
			typeof v === 'string'
				? [[`${prefix}${k}`, v]]
				: Object.entries(flattenMessages(v, `${prefix}${k}.`)),
		),
	);
}

export const LOCALES = ['en-US', 'fi-FI', 'ja-JP', 'zh-TW', 'MessageID'] as const;
type Locale = (typeof LOCALES)[number];

const locales = {
	'en-US': flattenMessages(enUS) as Record<MessageID, string>,
	'fi-FI': flattenMessages(fiFI) as Partial<Record<MessageID, string>>,
	'ja-JP': flattenMessages(jaJP) as Partial<Record<MessageID, string>>,
	'zh-TW': flattenMessages(zhTW) as Partial<Record<MessageID, string>>,
	MessageID: Object.fromEntries(Object.keys(flattenMessages(enUS)).map((k) => [k, k])) as Record<
		MessageID,
		string
	>,
} satisfies Record<Locale, Partial<Record<MessageID, string>>>;

export function getBestLocale(): Locale {
	const keys = Object.keys(locales) as [Locale, ...Locale[]];
	return (
		// exact match
		keys.find((key) => key === navigator.language) ??
		// otherwise first matching language
		keys.find((key) => key.startsWith(`${navigator.language.split('-')[0]}-`)) ??
		// otherwise first (en-US)
		keys[0]
	);
}

export const locale = new RawStateWrapper<Locale>(getBestLocale());

export const translatorModeMessages = new RawStateWrapper<Record<string, string>>({});

export function getTranslatorModeExtraMessageIDs() {
	return Object.keys(translatorModeMessages.current).filter((key) => !(key in locales['en-US']));
}

export function getTranslatorModeUntranslatedMessageIDs() {
	return Object.keys(locales['en-US']).filter(
		(key) =>
			!(key in translatorModeMessages.current) ||
			translatorModeMessages.current[key] === locales['en-US'][key as MessageID],
	);
}

const cachedMessages: Partial<Record<Locale, Record<string, IntlMessageFormat>>> = {};

export function t(
	messageId: MessageID,
	values?: Record<string, PrimitiveType | FormatXMLElementFn<string>>,
) {
	if (locale.current === 'MessageID') return messageId;
	if (translatorModeMessages.current[messageId] != null) {
		return new IntlMessageFormat(translatorModeMessages.current[messageId]).format(
			values,
		) as string;
	} else {
		const message =
			cachedMessages[locale.current]?.[messageId] ??
			new IntlMessageFormat(
				locales[locale.current][messageId] ?? locales['en-US'][messageId],
				locale.current,
			);
		getOrSetDefault(cachedMessages, locale.current, {})[messageId] = message;
		return `${message.format(values)}` as string;
	}
}
