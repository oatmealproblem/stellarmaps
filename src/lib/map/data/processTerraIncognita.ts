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

	// TODO
	const knownCountries = new Set(
		pipe(
			snapshot.factions,
			Record.values,
			Iterable.map((faction) => faction.id),
		),
	);
	// const knownCountries = new Set(
	// 	terraIncognitaPerspectiveCountryId == null
	// 		? Object.keys(gameState.country).map((id) => parseInt(id))
	// 		: (terraIncognitaPerspectiveCountry?.relations_manager.relation ?? [])
	// 				.filter((relation) => relation.communications)
	// 				.map((relation) => relation.country),
	// );
	// if (terraIncognitaPerspectiveCountryId != null)
	// 	knownCountries.add(terraIncognitaPerspectiveCountryId);

	return {
		knownSystems,
		knownCountries,
	};
}
