import { Iterable, pipe, Record } from 'effect';

import type { FactionId, Snapshot } from '$lib/project/snapshot';

import type { MapSettings } from '../../settings';

export const processTerraIncognitaDeps = [
	'terraIncognitaPerspectiveCountry',
] satisfies (keyof MapSettings)[];

export default function processTerraIncognita(
	snapshot: Snapshot,
	settings: Pick<MapSettings, (typeof processTerraIncognitaDeps)[number]>,
) {
	const terraIncognitaPerspectiveCountryId =
		settings.terraIncognitaPerspectiveCountry === 'player'
			? Object.values(snapshot.factions)[0]?.id
			: (settings.terraIncognitaPerspectiveCountry as FactionId);
	const terraIncognitaPerspectiveCountry =
		terraIncognitaPerspectiveCountryId != null
			? snapshot.factions[terraIncognitaPerspectiveCountryId]
			: null;

	const knownSystems =
		terraIncognitaPerspectiveCountry?.knownSystemIds ??
		new Set(
			pipe(
				snapshot.systems,
				Record.values,
				Iterable.map((system) => system.id),
			),
		);

	const knownCountries =
		terraIncognitaPerspectiveCountry != null
			? new Set(
					pipe(
						terraIncognitaPerspectiveCountry.relationships,
						Iterable.flatMap((r) => [r.leftId, r.rightId]),
					),
				)
			: new Set(
					pipe(
						snapshot.factions,
						Record.values,
						Iterable.map((faction) => faction.id),
					),
				);

	return {
		knownSystems,
		knownCountries,
	};
}
