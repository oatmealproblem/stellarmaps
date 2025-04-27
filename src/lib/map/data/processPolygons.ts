import * as turf from '@turf/turf';
import { Delaunay, Voronoi } from 'd3-delaunay';
import * as topojsonClient from 'topojson-client';
import * as topojsonServer from 'topojson-server';
import * as topojsonSimplify from 'topojson-simplify';
import type { MultiPolygon, Objects, Polygon, Topology } from 'topojson-specification';

import type { GameState } from '../../GameState.svelte';
import type { MapSettings } from '../../settings';
import { getOrDefault, isDefined, parseNumberEntry } from '../../utils';
import {
	closeRings,
	getAllPositionArrays,
	getPolygons,
	getSharedDistancePercent,
	pointToGeoJSON,
	type PolygonalFeature,
	type PolygonalGeometry,
	positionToString,
	SCALE,
} from './utils';

type TopojsonPolygonal = MultiPolygon | Polygon;

export const processPolygonsDeps = [
	'claimVoidMaxSize',
	'claimVoidBorderThreshold',
	'voronoiGridSize',
] satisfies (keyof MapSettings)[];

export default function processPolygons(
	gameState: GameState,
	settings: Pick<MapSettings, (typeof processPolygonsDeps)[number]>,
	voronoi: Voronoi<[number, number]>,
	systemIdToVoronoiIndexes: Record<number, number[]>,
	sectorToSystemIds: Record<number, Set<number>>,
	countryToSystemIds: Record<number, Set<number>>,
	unionLeaderToSystemIds: Record<number, Set<number>>,
	unionLeaderToSectors: Record<number, Set<number>>,
	sectorToCountry: Record<number, number>,
	knownSystems: Set<number>,
	fullOccupiedOccupierToSystemIds: Record<string, Set<number>>,
	partialOccupiedOccupierToSystemIds: Record<string, Set<number>>,
) {
	const claimVoidEnabled = settings.claimVoidMaxSize != null && settings.claimVoidMaxSize > 0;
	const systemIdToPolygon: Record<number, PolygonalFeature> = {};
	for (const systemId of [
		...(claimVoidEnabled ? [-1] : []),
		...Object.values(gameState.galactic_object).map((system) => system.id),
	]) {
		const delaunayPolygons = (systemIdToVoronoiIndexes[systemId] ?? []).map((voronoiIndex) =>
			voronoi.cellPolygon(voronoiIndex),
		);
		const geojson = topologicallyMergeDelaunayPolygons(delaunayPolygons);
		if (geojson) {
			systemIdToPolygon[systemId] = geojson;
		}
	}

	const topology = topojsonSimplify.simplify(
		topojsonSimplify.presimplify(
			topojsonServer.topology(systemIdToPolygon) as Topology<Objects<any>>,
		),
		(settings.voronoiGridSize * 2) / SCALE ** 2,
	);

	const countryToGeojson = mergeSystemMappingPolygons(topology, countryToSystemIds);
	const unionLeaderToGeojson = mergeSystemMappingPolygons(topology, unionLeaderToSystemIds);
	const sectorToGeojson = mergeSystemMappingPolygons(topology, sectorToSystemIds);
	const fullOccupiedOccupierToGeojson = mergeSystemMappingPolygons(
		topology,
		fullOccupiedOccupierToSystemIds,
	);
	const partialOccupiedOccupierToGeojson = mergeSystemMappingPolygons(
		topology,
		partialOccupiedOccupierToSystemIds,
	);
	const unknownSystemIds = Object.values(gameState.galactic_object)
		.map((s) => s.id)
		.filter((id) => !knownSystems.has(id));
	const terraIncognitaGeojson = mergeSystemPolygons(topology, unknownSystemIds);

	Object.entries(sectorToGeojson).forEach(([sector, geojson]) => closeRings(geojson, { sector }));
	Object.entries(countryToGeojson).forEach(([country, geojson]) =>
		closeRings(geojson, { country }),
	);
	Object.entries(unionLeaderToGeojson).forEach(([unionLeader, geojson]) =>
		closeRings(geojson, { unionLeader }),
	);
	Object.entries(fullOccupiedOccupierToGeojson).forEach(([fullOccupiedOccupier, geojson]) =>
		closeRings(geojson, { fullOccupiedOccupier }),
	);
	Object.entries(partialOccupiedOccupierToGeojson).forEach(([partialOccupiedOccupier, geojson]) =>
		closeRings(geojson, { partialOccupiedOccupier }),
	);
	if (terraIncognitaGeojson != null) closeRings(terraIncognitaGeojson, { terraIncognita: true });

	if (claimVoidEnabled) {
		const sectorToPositionStrings: Record<number, Set<string>> = Object.fromEntries(
			Object.entries(sectorToGeojson).map(([id, geojson]) => [
				id,
				new Set(turf.coordAll(geojson).map(positionToString)),
			]),
		);
		const unionLeaderToPositionStrings: Record<number, Set<string>> = Object.fromEntries(
			Object.entries(unionLeaderToGeojson).map(([id, geojson]) => [
				id,
				new Set(turf.coordAll(geojson).map(positionToString)),
			]),
		);
		for (const voidPolygon of getVoidPolygons(topology)) {
			const area = turf.area(voidPolygon);
			if (area > (settings.claimVoidMaxSize ?? 0) * 10_000_000) continue;
			const voidPositionStrings = turf.coordAll(voidPolygon).map(positionToString);

			let unionLeaderId: number | undefined;
			let unionLeaderSharedDistancePercent = Math.max(
				settings.claimVoidBorderThreshold,
				Number.EPSILON,
			);
			Object.entries(unionLeaderToGeojson)
				.map(parseNumberEntry)
				.forEach(([id]) => {
					const sharedDistancePercent = getSharedDistancePercent(
						voidPolygon,
						getOrDefault(unionLeaderToPositionStrings, id, new Set()),
					);
					if (sharedDistancePercent >= unionLeaderSharedDistancePercent) {
						unionLeaderId = id;
						unionLeaderSharedDistancePercent = sharedDistancePercent;
					}
				});

			const sectorId =
				unionLeaderId == null
					? null
					: Array.from(getOrDefault(unionLeaderToSectors, unionLeaderId, new Set())).sort(
							(a, b) => {
								const aPositionStrings = getOrDefault(sectorToPositionStrings, a, new Set());
								const aNumSharedPoints = voidPositionStrings.filter((p) =>
									aPositionStrings.has(p),
								).length;
								const bPositionStrings = getOrDefault(sectorToPositionStrings, b, new Set());
								const bNumSharedPoints = voidPositionStrings.filter((p) =>
									bPositionStrings.has(p),
								).length;
								return bNumSharedPoints - aNumSharedPoints;
							},
						)[0];

			const countryId = sectorId == null ? null : sectorToCountry[sectorId];

			addPolygonToGeojsonMapping(voidPolygon, sectorToGeojson, sectorId);
			addPolygonToGeojsonMapping(voidPolygon, countryToGeojson, countryId);
			addPolygonToGeojsonMapping(voidPolygon, unionLeaderToGeojson, unionLeaderId);
		}
	}

	return {
		countryToGeojson,
		unionLeaderToGeojson,
		sectorToGeojson,
		terraIncognitaGeojson,
		fullOccupiedOccupierToGeojson,
		partialOccupiedOccupierToGeojson,
	};
}

function mergeSystemMappingPolygons<K extends string | number>(
	topology: Topology<Objects>,
	systemIdMapping: Record<K, Set<number>>,
) {
	return Object.fromEntries(
		Object.entries(systemIdMapping)
			.map(([key, systemIds]) => [
				key,
				mergeSystemPolygons(topology, Array.from(systemIds as Set<number>)),
			])
			.filter(([_key, geojson]) => geojson != null),
	) as Record<K, PolygonalFeature>;
}

function mergeSystemPolygons(
	topology: Topology<Objects>,
	systemIds: number[],
): PolygonalFeature | null {
	const geometry = topojsonClient.merge(
		topology,
		systemIds
			.map((systemId) => topology.objects[systemId])
			.filter(
				(object): object is TopojsonPolygonal =>
					object?.type === 'Polygon' || object?.type === 'MultiPolygon',
			),
	) as PolygonalGeometry | null;
	if (geometry == null) return null;
	const feature = turf.feature(geometry);
	if (getAllPositionArrays(feature).length === 0) return null;
	return feature;
}

function topologicallyMergeDelaunayPolygons(
	systemPolygons: (Delaunay.Polygon | null | undefined)[],
) {
	const nonNullishPolygons = systemPolygons
		.filter(isDefined)
		.filter((points) => points.length >= 4);
	if (nonNullishPolygons.length === 0) return null;
	const geojsonPolygons = nonNullishPolygons.map((points) =>
		turf.polygon([points.map(pointToGeoJSON)]),
	);
	return topologicallyMergePolygons(geojsonPolygons);
}

function topologicallyMergePolygons(geojsonPolygons: PolygonalFeature[]) {
	const topology = topojsonServer.topology(
		Object.fromEntries(geojsonPolygons.map((p, i) => [i, p])),
	) as Topology<Objects<any>>;
	const merged = topojsonClient.merge(
		topology,
		Object.values(topology.objects).filter(
			(o): o is TopojsonPolygonal => o.type === 'Polygon' || o.type === 'MultiPolygon',
		),
	) as PolygonalGeometry | null;
	if (merged == null) return null;

	return turf.feature(merged);
}

function getVoidPolygons(topology: Topology<Objects>) {
	if (topology.objects[-1] == null) return [];
	const voidGeojson = topojsonClient.feature(topology, '-1') as unknown as PolygonalFeature | null;
	return getPolygons(voidGeojson);
}

function addPolygonToGeojsonMapping(
	polygon: GeoJSON.Feature<GeoJSON.Polygon>,
	mapping: Record<number, PolygonalFeature>,
	id: number | null | undefined,
) {
	const currentGeojson = id == null ? null : mapping[id];
	if (id != null && currentGeojson) {
		const updatedGeojson = topologicallyMergePolygons([currentGeojson, polygon]);
		if (updatedGeojson) {
			mapping[id] = updatedGeojson;
		}
	}
}
