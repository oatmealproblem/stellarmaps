import { Array, Iterable, Option, pipe } from 'effect';

import type { Faction } from '$lib/project/snapshot';

import { stellarisPath } from '../../loadStellarisData.svelte';
import stellarMapsApi from '../../stellarMapsApi';

const emblems: Record<string, Promise<string>> = {};
export async function processEmblems(factions: Faction[]) {
	const promises: Promise<string>[] = [];
	const keys: string[] = pipe(
		factions,
		Iterable.filterMap((faction) => Option.fromNullable(faction.flag.emblem)),
		(values) => new Set(values),
		Array.fromIterable,
	);

	keys.forEach((key) => {
		if (emblems[key] == null) {
			emblems[key] = stellarMapsApi.loadEmblem(
				stellarisPath.current,
				...(key.split('/') as [string, string]),
			);
		}
		promises.push(emblems[key]);
	});

	const results = await Promise.allSettled(promises);
	return results.reduce<Record<string, string>>((acc, cur, i) => {
		const key = keys[i];
		if (cur.status === 'fulfilled') {
			if (key != null) {
				acc[key] = cur.value;
			}
		} else {
			console.warn('failed to load emblem', key, cur.reason);
		}
		return acc;
	}, {});
}
