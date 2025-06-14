import { Record } from 'effect';

import { FactionId, type Snapshot } from '$lib/project/snapshot';

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
	occupied: FactionId;
	occupier: FactionId;
	primaryColor: string;
	secondaryColor: string;
	partial: boolean;
	path: string;
}

export default function processOccupationBorders(
	snapshot: Snapshot,
	settings: Pick<MapSettings, (typeof processOccupationBordersDeps)[number]>,
	fullOccupiedOccupierToSystemIds: Record<FactionId, PolygonalFeature>,
	partialOccupiedOccupierToSystemIds: Record<FactionId, PolygonalFeature>,
): OccupationBorder[] {
	if (!settings.occupation) return [];
	const makeMapFunc =
		(partial: boolean) =>
		([key, geojson]: [FactionId, PolygonalFeature]) => {
			const ids = key.split('-').map((s) => FactionId.make(s));
			const occupied = ids[0];
			if (occupied == null || snapshot.factions[occupied])
				throw new Error(`Invalid occupied faction ID, ${occupied}`);
			const occupier = ids[1];
			if (occupier == null || snapshot.factions[occupier])
				throw new Error(`Invalid occupier faction ID, ${occupier}`);
			const { primaryColor, secondaryColor } = getCountryMapModeInfo(occupier, snapshot, settings);
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
		...Record.toEntries(fullOccupiedOccupierToSystemIds).map(makeMapFunc(false)),
		...Record.toEntries(partialOccupiedOccupierToSystemIds).map(makeMapFunc(true)),
	];
}
