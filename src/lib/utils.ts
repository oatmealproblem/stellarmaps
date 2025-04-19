import type { getToastStore, ToastSettings } from '@skeletonlabs/skeleton';

export function toastError<T>(options: {
	title: string;
	description?: string;
	defaultValue: T;
	toastStore: ReturnType<typeof getToastStore>;
	action?: ToastSettings['action'];
}): (reason: unknown) => T {
	return (reason: unknown) => {
		options.toastStore.trigger({
			message: `
				<h4 class="h4">${options.title}</h4>
				${options.description != null ? `<div>${options.description}</div>` : ''}
				<pre class="bg-error-700 p-2 my-2 rounded-sm whitespace-pre-line break-all max-h-48 overflow-y-auto">${reason}</pre>
			`,
			autohide: false,
			action: options.action,
		});
		return options.defaultValue;
	};
}

export function wait(ms: number): Promise<never> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseNumberEntry<T>(entry: [string, T]): [number, T] {
	return [parseInt(entry[0]), entry[1]];
}

export function isDefined<T>(value: T | null | undefined): value is T {
	return value != null;
}

export function saveToWindow<T>(key: string, value: T): T {
	(window as any)[key] = value;
	return value;
}

export function timeIt<Args extends unknown[], ReturnValue>(
	message: string,
	fn: (...args: Args) => ReturnValue,
	...args: Args
) {
	console.log(`START: ${message}`);
	console.time(`END:   ${message}`);
	const result = fn(...args);
	console.timeEnd(`END:   ${message}`);
	return result;
}

export async function timeItAsync<Args extends unknown[], ReturnValue>(
	message: string,
	fn: (...args: Args) => Promise<ReturnValue>,
	...args: Args
) {
	console.log(`START: ${message}`);
	console.time(`END:   ${message}`);
	const result = await fn(...args);
	console.timeEnd(`END:   ${message}`);
	return result;
}

export function debounce<T extends any[]>(fn: (...args: T) => void, ms: number) {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	return (...args: T) => {
		if (timeoutId != null) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => {
			fn(...args);
			timeoutId = null;
		}, ms);
	};
}

export type NonEmptyArray<T> = [T, ...T[]];

export function getOrSetDefault<T>(
	record: Record<string, NonNullable<T>>,
	key: string | number,
	defaultValue: NonNullable<T>,
): NonNullable<T> {
	const current = record[key];
	if (current != null) return current;
	record[key] = defaultValue;
	return defaultValue;
}

export function getOrDefault<T>(
	record: Record<string, T>,
	key: string | number,
	defaultValue: NonNullable<T>,
): NonNullable<T> {
	return record[key] ?? defaultValue;
}

export function isEmptyObject(value: unknown) {
	return (
		value != null &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		Object.keys(value).length === 0
	);
}
