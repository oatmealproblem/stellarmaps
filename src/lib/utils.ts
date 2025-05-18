import { type ToastData, toaster } from './Toaster.svelte';

export function toastError<T>(options: {
	title: string;
	description?: string;
	defaultValue: T;
	action?: ToastData['action'];
}): (reason: unknown) => T {
	return (reason: unknown) => {
		let combinedDescription = options.description;
		if (options.description != null && reason != null) {
			combinedDescription = `${options.description}\n\n${reason}`;
		} else if (reason != null) {
			combinedDescription = `${reason}`;
		}
		toaster.addToast({
			closeDelay: 0,
			data: {
				kind: 'error',
				title: options.title,
				description: combinedDescription,
				action: options.action,
			},
		});
		return options.defaultValue;
	};
}

export function wait(ms: number): Promise<never> {
	return new Promise((resolve) => setTimeout(resolve, ms));
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
