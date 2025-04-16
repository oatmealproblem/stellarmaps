import type { GameState } from '../../GameState.svelte';
import type { MapSettings } from '../../settings';

export const processTerraIncognitaDeps = [
	'terraIncognitaPerspectiveCountry',
] satisfies (keyof MapSettings)[];

export default function processTerraIncognita(
	gameState: GameState,
	settings: Pick<MapSettings, (typeof processTerraIncognitaDeps)[number]>,
) {
	const terraIncognitaPerspectiveCountryId =
		settings.terraIncognitaPerspectiveCountry === 'player'
			? gameState.player.filter((p) => gameState.country[p.country])[0]?.country
			: parseInt(settings.terraIncognitaPerspectiveCountry);
	const terraIncognitaPerspectiveCountry =
		terraIncognitaPerspectiveCountryId != null
			? gameState.country[terraIncognitaPerspectiveCountryId]
			: null;
	const knownSystems = new Set(
		terraIncognitaPerspectiveCountry?.terra_incognita?.systems ??
			Object.keys(gameState.galactic_object).map((id) => parseInt(id)),
	);
	const wormholeIds = new Set(
		Object.values(gameState.bypasses)
			.filter((bypass) => bypass.type === 'wormhole' || bypass.type === 'strange_wormhole')
			.map((bypass) => bypass.id),
	);
	const knownWormholes = terraIncognitaPerspectiveCountry
		? new Set(terraIncognitaPerspectiveCountry.usable_bypasses.filter((id) => wormholeIds.has(id)))
		: wormholeIds;
	const knownCountries = new Set(
		terraIncognitaPerspectiveCountryId == null
			? Object.keys(gameState.country).map((id) => parseInt(id))
			: (terraIncognitaPerspectiveCountry?.relations_manager.relation ?? [])
					.filter((relation) => relation.communications)
					.map((relation) => relation.country),
	);
	if (terraIncognitaPerspectiveCountryId != null)
		knownCountries.add(terraIncognitaPerspectiveCountryId);

	return {
		knownSystems,
		knownCountries,
		knownWormholes,
	};
}
