import type { Country } from '../../GameState.svelte';
import { stellarisPath } from '../../loadStellarisData.svelte';
import stellarMapsApi from '../../stellarMapsApi';

const emblems: Record<string, Promise<string>> = {};
export async function processEmblems(countries: Country[]) {
	const promises: Promise<string>[] = [];
	const keys: string[] = [];
	countries.forEach((c) => {
		if (c.flag?.icon) {
			const key = `${c.flag.icon.category}/${c.flag.icon.file}`;
			if (keys.includes(key)) {
				// do nothing
			} else {
				keys.push(key);
				if (emblems[key] == null) {
					emblems[key] = stellarMapsApi.loadEmblem(
						stellarisPath.current,
						c.flag.icon.category,
						c.flag.icon.file,
					);
				}
				promises.push(emblems[key]);
			}
		}
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
