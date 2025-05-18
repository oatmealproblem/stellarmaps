import { dequal as deepEquals } from 'dequal/lite';

import type { Snapshot } from '$lib/project/snapshot';

import debug from '../../debug';
import { type MapSettings } from '../../settings';
import { timeIt, timeItAsync } from '../../utils';
import processBorders, { processBordersDeps } from './processBorders';
import processBypassLinks from './processBypassLinks';
import processCircularGalaxyBorders, {
	processCircularGalaxyBordersDeps,
} from './processCircularGalaxyBorder';
import { processEmblems } from './processEmblems';
import processLabels, { processLabelsDeps } from './processLabels';
import processLegend, { processLegendDeps } from './processLegend';
import processOccupationBorders, { processOccupationBordersDeps } from './processOccupationBorders';
import processPolygons, { processPolygonsDeps } from './processPolygons';
import processSystemCoordinates, { processSystemCoordinatesDeps } from './processSystemCoordinates';
import processSystemOwnership, { processSystemOwnershipDeps } from './processSystemOwnership';
import processSystems, { processSystemsDeps } from './processSystems';
import processTerraIncognita, { processTerraIncognitaDeps } from './processTerraIncognita';
import processTerraIncognitaPath, {
	processTerraIncognitaPathDeps,
} from './processTerraIncognitaPath';
import processVoronoi, { processVoronoiDeps } from './processVoronoi';
import { createHyperlanePaths } from './utils';

export default async function processMapData(snapshot: Snapshot, rawSettings: MapSettings) {
	console.time('TOTAL PROCESSING TIME');
	const settings = { ...rawSettings };
	if (settings.hyperlaneMetroStyle) settings.alignStarsToGrid = true;
	if (settings.alignStarsToGrid) settings.hyperlaneSensitiveBorders = false;
	settings.unionMode = settings.mapMode === 'unions';

	// get these started right away; await just before needed
	const emblemsPromise = timeItAsync(
		'emblems',
		cached(processEmblems),
		Object.values(snapshot.factions),
	);

	const getSystemCoordinates = timeIt(
		'system coordinates',
		cached(processSystemCoordinates),
		snapshot,
		pickSettings(settings, processSystemCoordinatesDeps),
	);

	const { galaxyBorderCircles, galaxyBorderCirclesGeoJSON } = timeIt(
		'circular galaxy borders',
		cached(processCircularGalaxyBorders),
		snapshot,
		pickSettings(settings, processCircularGalaxyBordersDeps),
		getSystemCoordinates,
	);

	const { knownSystems, knownCountries } = timeIt(
		'terra incognita',
		cached(processTerraIncognita),
		snapshot,
		pickSettings(settings, processTerraIncognitaDeps),
	);

	const {
		sectorToSystemIds,
		countryToSystemIds,
		unionLeaderToSystemIds,
		unionLeaderToUnionMembers,
		ownedSystemPoints,
		systemIdToCountry,
		systemIdToUnionLeader,
		sectorToCountry,
		unionLeaderToSectors,
		fullOccupiedOccupierToSystemIds,
		partialOccupiedOccupierToSystemIds,
	} = timeIt(
		'system ownership',
		cached(processSystemOwnership),
		snapshot,
		pickSettings(settings, processSystemOwnershipDeps),
		getSystemCoordinates,
	);

	const { findClosestSystem, voronoi, systemIdToVoronoiIndexes } = timeIt(
		'voronoi',
		cached(processVoronoi),
		snapshot,
		pickSettings(settings, processVoronoiDeps),
		getSystemCoordinates,
		galaxyBorderCircles,
	);

	const {
		sectorToGeojson,
		countryToGeojson,
		unionLeaderToGeojson,
		terraIncognitaGeojson,
		fullOccupiedOccupierToGeojson,
		partialOccupiedOccupierToGeojson,
	} = timeIt(
		'polygons',
		cached(processPolygons),
		snapshot,
		pickSettings(settings, processPolygonsDeps),
		voronoi,
		systemIdToVoronoiIndexes,
		sectorToSystemIds,
		countryToSystemIds,
		unionLeaderToSystemIds,
		unionLeaderToSectors,
		sectorToCountry,
		knownSystems,
		fullOccupiedOccupierToSystemIds,
		partialOccupiedOccupierToSystemIds,
	);

	const { terraIncognitaPath } = timeIt(
		'terra incognita path',
		cached(processTerraIncognitaPath),
		pickSettings(settings, processTerraIncognitaPathDeps),
		terraIncognitaGeojson,
		galaxyBorderCirclesGeoJSON,
	);

	const { hyperlanesPath: unownedHyperlanesPath, relayHyperlanesPath: unownedRelayHyperlanesPath } =
		timeIt(
			'unowned hyperlanes',
			cached(createHyperlanePaths),
			snapshot,
			pickSettings(settings, ['hyperlaneMetroStyle']),
			systemIdToUnionLeader,
			null,
			getSystemCoordinates,
		);
	const borders = timeIt(
		'borders',
		cached(processBorders),
		snapshot,
		pickSettings(settings, processBordersDeps),
		unionLeaderToGeojson,
		countryToGeojson,
		sectorToGeojson,
		unionLeaderToUnionMembers,
		unionLeaderToSystemIds,
		countryToSystemIds,
		systemIdToUnionLeader,
		knownCountries,
		galaxyBorderCircles,
		galaxyBorderCirclesGeoJSON,
		getSystemCoordinates,
	);
	const occupationBorders = timeIt(
		'borders',
		cached(processOccupationBorders),
		snapshot,
		pickSettings(settings, processOccupationBordersDeps),
		fullOccupiedOccupierToGeojson,
		partialOccupiedOccupierToGeojson,
	);
	const labels = timeIt(
		'labels',
		cached(processLabels),
		snapshot,
		pickSettings(settings, processLabelsDeps),
		countryToGeojson,
		unionLeaderToUnionMembers,
		borders,
		knownCountries,
		ownedSystemPoints,
	);
	const systems = timeIt(
		'systems',
		cached(processSystems),
		snapshot,
		pickSettings(settings, processSystemsDeps),
		systemIdToCountry,
		knownCountries,
		knownSystems,
		getSystemCoordinates,
	);
	// TODO
	const bypassLinks: ReturnType<typeof processBypassLinks> = [];
	// const bypassLinks = timeIt(
	// 	'bypassLinks',
	// 	cached(processBypassLinks),
	// 	gameState,
	// 	knownSystems,
	// 	knownWormholes,
	// 	getSystemCoordinates,
	// );
	const legend = await timeItAsync(
		'legend',
		cached(processLegend),
		pickSettings(settings, processLegendDeps),
		systems,
	);

	const emblems = await emblemsPromise;

	console.timeEnd('TOTAL PROCESSING TIME');

	return {
		borders,
		occupationBorders,
		unownedHyperlanesPath,
		unownedRelayHyperlanesPath,
		emblems,
		systems,
		bypassLinks,
		labels,
		terraIncognitaPath,
		galaxyBorderCircles,
		findClosestSystem,
		systemIdToCountry,
		legend,
	};
}

export type MapData = Awaited<ReturnType<typeof processMapData>>;

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const cachedMemo: Map<Function, Function> = new Map();
function cached<Args extends unknown[], ReturnValue>(
	fn: (...args: Args) => ReturnValue,
): (...args: Args) => ReturnValue {
	const memoValue = cachedMemo.get(fn);
	if (memoValue) return memoValue as (...args: Args) => ReturnValue;
	let last: [Args, ReturnValue] | null = null;
	const fnWithCaching = (...args: Args) => {
		if (
			!debug.current &&
			last !== null &&
			last[0].length === args.length &&
			last[0].every((arg, i) => arg === args[i])
		) {
			return last[1];
		} else {
			const result = fn(...args);
			last = [args, result];
			return result;
		}
	};
	cachedMemo.set(fn, fnWithCaching);
	return fnWithCaching;
}

const pickSettingsMemo: Record<string, Partial<MapSettings>> = {};
function pickSettings<K extends keyof MapSettings>(
	settings: MapSettings,
	keys: K[],
): Pick<MapSettings, K> {
	const memoKey = keys.toSorted().join();
	const memoValue = pickSettingsMemo[memoKey];
	if (memoValue && keys.every((key) => deepEquals(memoValue[key], settings[key]))) {
		return memoValue as Pick<MapSettings, K>;
	} else {
		const value = Object.fromEntries(keys.map((key) => [key, settings[key]])) as Pick<
			MapSettings,
			K
		>;
		pickSettingsMemo[memoKey] = value;
		return value;
	}
}
