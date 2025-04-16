import { BaseDirectory, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import type { z } from 'zod';

interface PersistedStateOptions<T> {
	name: string;
	defaultValue: T;
	schema: z.Schema<T, z.ZodTypeDef, unknown>;
	dir?: string;
	baseDir?: BaseDirectory;
}

export class PersistedRawState<T> {
	#name: string;
	#current: T = $state()!;
	#dir?: string;
	#baseDir: BaseDirectory;

	constructor({
		name,
		defaultValue,
		schema,
		dir,
		baseDir = BaseDirectory.AppConfig,
	}: PersistedStateOptions<T>) {
		const localStorageValue = localStorage.getItem(name);
		this.#name = name;
		this.#dir = dir;
		this.#baseDir = baseDir;
		this.#current =
			localStorageValue != null ? schema.parse(JSON.parse(localStorageValue)) : defaultValue;

		readTextFile(
			`${this.#dir != null && this.#dir != '' ? `${this.#dir}/` : ''}${this.#name}.json`,
			{
				baseDir: this.#baseDir,
			},
		)
			.then((fileValue) => schema.parse(JSON.parse(fileValue)))
			.catch(() => defaultValue)
			.then((value) => {
				this.#current = value;
			});
	}

	get current(): Readonly<T> {
		return this.#current;
	}

	set current(value: T) {
		this.#current = value;
		localStorage.setItem(this.#name, JSON.stringify(value));
		writeTextFile(
			`${this.#dir != null && this.#dir != '' ? `${this.#dir}/` : ''}${this.#name}.json`,
			JSON.stringify(value, undefined, 2),
			{
				baseDir: this.#baseDir,
			},
		);
	}
}

export class PersistedDeepState<T> {
	#name: string;
	#current: T = $state()!;
	#dir?: string;
	#baseDir: BaseDirectory;

	constructor({
		name,
		defaultValue,
		schema,
		dir,
		baseDir = BaseDirectory.AppConfig,
	}: PersistedStateOptions<T>) {
		const localStorageValue = localStorage.getItem(name);
		this.#name = name;
		this.#dir = dir;
		this.#baseDir = baseDir;
		this.#current =
			localStorageValue != null ? schema.parse(JSON.parse(localStorageValue)) : defaultValue;

		readTextFile(
			`${this.#dir != null && this.#dir != '' ? `${this.#dir}/` : ''}${this.#name}.json`,
			{
				baseDir: this.#baseDir,
			},
		)
			.then((fileValue) => schema.parse(JSON.parse(fileValue)))
			.catch(() => defaultValue)
			.then((value) => {
				this.#current = value;
			});

		$effect.root(() => {
			$effect(() => {
				localStorage.setItem(this.#name, JSON.stringify(this.#current));
				writeTextFile(
					`${this.#dir != null && this.#dir != '' ? `${this.#dir}/` : ''}${this.#name}.json`,
					JSON.stringify(this.#current, undefined, 2),
					{
						baseDir: this.#baseDir,
					},
				);
			});
		});
	}

	get current(): T {
		return this.#current;
	}

	set current(value: T) {
		this.#current = value;
	}
}

// export class DeepStateWrapper<T> {
// 	#current = $state<T>();

// 	constructor(initialValue: T) {
// 		this.#current = initialValue;
// 	}

// 	get current() {
// 		return this.#current as T;
// 	}

// 	set current(value: T) {
// 		this.#current = value;
// 	}
// }

export class RawStateWrapper<T> {
	#current = $state<T>();

	constructor(initialValue: T) {
		this.#current = initialValue;
	}

	get current() {
		return this.#current as T;
	}

	set current(value: T) {
		this.#current = value;
	}
}
