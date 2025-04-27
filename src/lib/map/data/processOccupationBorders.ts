import type { GameState } from '../../GameState.svelte';
import type { MapSettings } from '../../settings';
import { getCountryMapModeInfo } from './mapModes';
import { multiPolygonToPath, type PolygonalFeature } from './utils';

export const processOccupationBordersDeps = [
	'occupation',
	'unionMode',
	'unionFederations',
	'unionHegemonies',
	'unionSubjects',
	'unionFederationsColor',
	'mapMode',
	'mapModePointOfView',
] satisfies (keyof MapSettings)[];

interface OccupationBorder {
	occupied: number;
	occupier: number;
	primaryColor: string;
	secondaryColor: string;
	partial: boolean;
	path: string;
}

export default function processOccupationBorders(
	gameState: GameState,
	settings: Pick<MapSettings, (typeof processOccupationBordersDeps)[number]>,
	fullOccupiedOccupierToSystemIds: Record<string, PolygonalFeature>,
	partialOccupiedOccupierToSystemIds: Record<string, PolygonalFeature>,
): OccupationBorder[] {
	if (!settings.occupation) return [];
	const makeMapFunc =
		(partial: boolean) =>
		([key, geojson]: [string, PolygonalFeature]) => {
			const ids = key.split('-').map((s) => parseInt(s));
			const occupied = ids[0] ?? -1; // this should never be nullish
			const occupier = ids[1] ?? -1; // this should never be nullish
			const { primaryColor, secondaryColor } = getCountryMapModeInfo(occupier, gameState, settings);
			const path = multiPolygonToPath(geojson, false);
			return {
				occupied,
				occupier,
				primaryColor,
				secondaryColor,
				partial,
				path,
			};
		};
	return [
		...Object.entries(fullOccupiedOccupierToSystemIds).map(makeMapFunc(false)),
		...Object.entries(partialOccupiedOccupierToSystemIds).map(makeMapFunc(true)),
	];
}
