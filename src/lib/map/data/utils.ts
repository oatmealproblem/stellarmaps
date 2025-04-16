import * as turf from '@turf/turf';
import { pathRound } from 'd3-path';
import { curveBasis, curveBasisClosed, curveLinear, curveLinearClosed } from 'd3-shape';

import type { GameState } from '../../GameState.svelte';
import type { MapSettings } from '../../settings';
import type { BorderCircle } from './processCircularGalaxyBorder';

export type PolygonalGeometry = GeoJSON.Polygon | GeoJSON.MultiPolygon;
export type PolygonalFeature = GeoJSON.Feature<PolygonalGeometry>;
export type PolygonalFeatureCollection = GeoJSON.FeatureCollection<PolygonalGeometry>;

export const SCALE = 100;

export function pointToGeoJSON([x, y]: [number, number]): [number, number] {
	return [x / SCALE, y / SCALE];
}

export function pointFromGeoJSON(point: GeoJSON.Position): [number, number] {
	return [point[0] * SCALE, point[1] * SCALE];
}

export function inverseX([x, y]: [number, number]): [number, number] {
	return [-x, y];
}

export function getUnionLeaderId(
	countryId: number,
	gameState: GameState,
	settings: Pick<
		MapSettings,
		'unionMode' | 'unionFederations' | 'unionHegemonies' | 'unionSubjects' | 'unionFederationsColor'
	>,
	values: ('joinedBorders' | 'separateBorders' | 'off')[],
): number {
	const isIncludedValue = (value: string) => (values as string[]).includes(value);
	const country = gameState.country[countryId];
	if (country == null) return countryId;
	const overlordId = country.overlord;
	const overlord = overlordId != null ? gameState.country[overlordId] : null;
	const federation = country.federation != null ? gameState.federation[country.federation] : null;
	const isHegemonyFederation = federation
		? federation.federation_progress.federation_type === 'hegemony_federation'
		: false;
	const isNonHegemonyFederation = federation ? !isHegemonyFederation : false;
	const overlordFederation =
		overlord?.federation != null ? gameState.federation[overlord.federation] : null;
	if (!settings.unionMode) {
		return countryId;
	} else if (
		isIncludedValue(settings.unionFederations) &&
		isIncludedValue(settings.unionSubjects) &&
		overlordFederation
	) {
		return settings.unionFederationsColor === 'leader'
			? overlordFederation.leader
			: (overlordFederation.members[0] ?? countryId);
	} else if (
		federation &&
		((isIncludedValue(settings.unionFederations) && isNonHegemonyFederation) ||
			(isIncludedValue(settings.unionHegemonies) && isHegemonyFederation))
	) {
		return settings.unionFederationsColor === 'leader'
			? federation.leader
			: (federation.members[0] ?? countryId);
	} else if (isIncludedValue(settings.unionSubjects) && overlord && overlordId != null) {
		return overlordId;
	} else {
		return countryId;
	}
}

export function isUnionLeader(
	countryId: number,
	gameState: GameState,
	settings: Pick<
		MapSettings,
		'unionMode' | 'unionFederations' | 'unionHegemonies' | 'unionSubjects'
	>,
) {
	const country = gameState.country[countryId];
	if (country == null) return false;
	const federation = country.federation != null ? gameState.federation[country.federation] : null;
	const federationIsDisplayedAsUnion =
		federation?.federation_progress.federation_type === 'hegemony_federation'
			? settings.unionHegemonies !== 'off'
			: settings.unionFederations !== 'off';
	if (!settings.unionMode) {
		return false;
	} else if (federation && federationIsDisplayedAsUnion) {
		return federation.leader === countryId;
	} else if (settings.unionSubjects !== 'off') {
		return Boolean(country.subjects.length);
	} else {
		return false;
	}
}

export function multiPolygonToPath(
	geoJSON: PolygonalFeatureCollection | PolygonalFeature,
	smooth: boolean,
) {
	const features = geoJSON.type === 'FeatureCollection' ? geoJSON.features : [geoJSON];
	const coordinates = features.flatMap((feature) =>
		feature.geometry.type === 'MultiPolygon'
			? feature.geometry.coordinates
			: [feature.geometry.coordinates],
	);
	return coordinates
		.flat()
		.map((points) => points.map<[number, number]>(pointFromGeoJSON))
		.map((points) => {
			const pathContext = pathRound(3);
			const curve = smooth ? curveBasisClosed(pathContext) : curveLinearClosed(pathContext);
			curve.lineStart();
			for (const point of points.map(inverseX)) {
				curve.point(...point);
			}
			curve.lineEnd();
			return pathContext.toString();
		})
		.join(' ');
}

export function segmentToPath(segment: GeoJSON.Position[], smooth: boolean): string {
	const points = segment.map(pointFromGeoJSON);
	const pathContext = pathRound(3);
	const curve = smooth ? curveBasis(pathContext) : curveLinear(pathContext);
	curve.lineStart();
	for (const point of points.map(inverseX)) {
		curve.point(...point);
	}
	curve.lineEnd();
	return pathContext.toString();
}

export function getPolygons(
	geojson: PolygonalFeatureCollection | PolygonalFeature | null,
): GeoJSON.Feature<GeoJSON.Polygon>[] {
	if (geojson == null) return [];
	const features = geojson.type === 'FeatureCollection' ? geojson.features : [geojson];
	return features.flatMap((feature) => {
		if (!['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) {
			return [];
		} else if (feature.geometry.type === 'Polygon') {
			return [feature as GeoJSON.Feature<GeoJSON.Polygon>];
		} else {
			return feature.geometry.coordinates.map((coords) => turf.polygon(coords));
		}
	});
}

export function positionToString(p: GeoJSON.Position): string {
	return `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
}

export function getAllPositionArrays(geoJSON: PolygonalFeatureCollection | PolygonalFeature) {
	const features = geoJSON.type === 'FeatureCollection' ? geoJSON.features : [geoJSON];
	const allPositionArrays = features
		.map<GeoJSON.Position[][]>((f) => {
			const geometry = f.geometry;
			if (geometry.type === 'Polygon') {
				return geometry.coordinates;
			} else {
				return geometry.coordinates.flat();
			}
		})
		.flat();
	return allPositionArrays;
}

export function createHyperlanePaths(
	gameState: GameState,
	settings: Pick<MapSettings, 'hyperlaneMetroStyle'>,
	relayMegastructures: Set<number>,
	systemIdToUnionLeader: Record<number, number>,
	owner: null | number,
	getSystemCoordinates: (id: number, options?: { invertX?: boolean }) => [number, number],
) {
	const hyperlanes = new Set<string>();
	const relayHyperlanes = new Set<string>();
	Object.values(gameState.galactic_object).forEach((go) => {
		for (const hyperlane of go.hyperlane.filter((lane) => {
			if (owner != null) {
				return systemIdToUnionLeader[go.id] === owner && systemIdToUnionLeader[lane.to] === owner;
			} else {
				return (
					systemIdToUnionLeader[go.id] == null ||
					systemIdToUnionLeader[lane.to] == null ||
					systemIdToUnionLeader[go.id] !== systemIdToUnionLeader[lane.to]
				);
			}
		})) {
			const isRelay =
				go.megastructures.some((id) => relayMegastructures.has(id)) &&
				gameState.galactic_object[hyperlane.to]?.megastructures.some((id) =>
					relayMegastructures.has(id),
				);
			const key = [go.id, hyperlane.to].sort().join(',');
			if (isRelay) {
				relayHyperlanes.add(key);
			} else {
				hyperlanes.add(key);
			}
		}
	});

	const RADIUS = 3;
	const RADIUS_45 = Math.sqrt(RADIUS ** 2 / 2);
	const makeHyperlanePath = (key: string) => {
		const [a, b] = key.split(',').map((id) => getSystemCoordinates(parseInt(id)));
		if (a == null || b == null)
			throw new Error(`Failed to parse system ids from hyperlane key ${key}`);
		const simplePath = `M ${-a[0]} ${a[1]} L ${-b[0]} ${b[1]}`;
		const dx = b[0] - a[0];
		const dy = b[1] - a[1];
		const dxSign = dx > 0 ? -1 : 1;
		const dySign = dy > 0 ? 1 : -1;
		if (
			!settings.hyperlaneMetroStyle ||
			Math.abs(dx) < 1 ||
			Math.abs(dy) < 1 ||
			Math.abs(turf.round(dx / dy, 1)) === 1
		) {
			return simplePath;
		} else {
			if (
				Math.abs(dx) > Math.abs(dy) &&
				Math.abs(dx) > RADIUS + RADIUS_45 &&
				Math.abs(dy) > RADIUS
			) {
				return [
					`M ${-a[0]} ${a[1]}`,
					`h ${dxSign * (Math.abs(dx) - Math.abs(dy) - RADIUS)}`,
					`q ${dxSign * RADIUS} 0 ${dxSign * (RADIUS + RADIUS_45)} ${dySign * RADIUS_45}`,
					`L ${-b[0]} ${b[1]}`,
				].join(' ');
			} else if (
				Math.abs(dy) > Math.abs(dx) &&
				Math.abs(dy) > RADIUS + RADIUS_45 &&
				Math.abs(dx) > RADIUS
			) {
				return [
					`M ${-a[0]} ${a[1]}`,
					`v ${dySign * (Math.abs(dy) - Math.abs(dx) - RADIUS)}`,
					`q 0 ${dySign * RADIUS} ${dxSign * RADIUS_45} ${dySign * (RADIUS_45 + RADIUS)}`,
					`L ${-b[0]} ${b[1]}`,
				].join(' ');
			} else {
				return simplePath;
			}
		}
	};

	const hyperlanesPath = Array.from(hyperlanes.values()).map(makeHyperlanePath).join(' ');
	const relayHyperlanesPath = Array.from(relayHyperlanes.values()).map(makeHyperlanePath).join(' ');
	return { hyperlanesPath, relayHyperlanesPath };
}

// frontier sectors don't exist as actual sector objects in the gameState
// use the negative country id so they all have unique ids (needed when processing union boundaries)
// also subtract 1, to avoid confusion with 0 vs -0 (country ids start at 0)
export function getFrontierSectorPseudoId(countryId: number) {
	return -countryId - 1;
}

export function closeRings(geojson: PolygonalFeature, loggingContext: Record<string, any> = {}) {
	getAllPositionArrays(geojson).forEach((ring) => {
		const first = ring[0];
		const last = ring[ring.length - 1];
		if (first != null && last != null) {
			const areEqual = first[0] === last[0] && first[1] === last[1];
			if (!areEqual) {
				console.warn('Found unclosed ring. Closing.', { geojson, ring, ...loggingContext });
				ring.push(first);
			}
		}
	});
}

export function applyGalaxyBoundary(
	geojson: PolygonalFeature,
	externalBorder: PolygonalFeature | null,
) {
	if (externalBorder != null) {
		return turf.intersect(turf.featureCollection([geojson, externalBorder]));
	}
	return geojson;
}

const OUTLIER_HYPERLANE_PADDING = 7.5;
export function makeBorderCircleGeojson(
	gameState: GameState,
	getSystemCoordinates: (id: number) => [number, number],
	circle: BorderCircle,
) {
	let geojson: PolygonalFeature | null = turf.circle(
		pointToGeoJSON([circle.cx, circle.cy]),
		circle.r / SCALE,
		{
			units: 'degrees',
			steps: Math.max(8, Math.ceil(circle.r)),
		},
	);

	if (circle.type === 'outlier') {
		const multiLineString = turf.multiLineString(
			Array.from(circle.systems).flatMap((systemId) => {
				const system = gameState.galactic_object[systemId];
				if (system == null) return [];
				return system.hyperlane.map(({ to }) => [
					pointToGeoJSON(getSystemCoordinates(systemId)),
					pointToGeoJSON(getSystemCoordinates(to)),
				]);
			}),
		);
		const hyperlaneBuffer = turf.buffer(multiLineString, OUTLIER_HYPERLANE_PADDING / SCALE, {
			units: 'degrees',
			steps: 1,
		});
		if (hyperlaneBuffer) {
			geojson = turf.union(turf.featureCollection([geojson, hyperlaneBuffer]));
		}
	}

	return geojson;
}

export function getSharedDistancePercent(
	polygon: GeoJSON.Feature<GeoJSON.Polygon>,
	sharedPositionStrings: Set<string>,
) {
	let sharedDistance = 0;
	let totalDistance = 0;
	turf.segmentEach(polygon, (segment) => {
		const from = segment?.geometry.coordinates[0] ?? [0, 0];
		const to = segment?.geometry.coordinates[1] ?? [0, 0];
		const segmentDistance = Math.hypot(from[0] - to[0], from[1] - to[1]);
		totalDistance += segmentDistance;
		if (
			sharedPositionStrings.has(positionToString(from)) &&
			sharedPositionStrings.has(positionToString(to))
		) {
			sharedDistance += segmentDistance;
		}
	});
	return sharedDistance / totalDistance;
}
const measureTextContext = document
	.createElement('canvas')
	.getContext('2d') as CanvasRenderingContext2D;
export function getTextAspectRatio(text: string, fontFamily: string) {
	measureTextContext.font = `10px '${fontFamily}'`;
	return 10 / measureTextContext.measureText(text).width;
}
