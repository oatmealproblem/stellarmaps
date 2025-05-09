import * as turf from '@turf/turf';
import { interpolateBasis } from 'd3-interpolate';

import type { GameState } from '../../GameState.svelte';
import type { MapSettings } from '../../settings';
import type { NonEmptyArray } from '../../utils';
import {
	makeBorderCircleGeojson,
	pointFromGeoJSON,
	pointToGeoJSON,
	type PolygonalFeature,
	SCALE,
} from './utils';

const CIRCLE_OUTER_PADDING = 15;
const CIRCLE_INNER_PADDING = 10;
const OUTLIER_DISTANCE = 30;
const OUTLIER_RADIUS = 15;
const STARBURST_NUM_SLICES = 12;
const STARBURST_LINES_PER_SLICE = 50;
const STARBURST_SLICE_ANGLE = (Math.PI * 2) / STARBURST_NUM_SLICES;
const ONE_DEGREE = Math.PI / 180;

export interface BorderCircle {
	cx: number;
	cy: number;
	r: number;
	type: 'inner' | 'outer' | 'inner-padded' | 'outer-padded' | 'outlier';
	isMainCluster: boolean;
	systems: Set<number>;
}

export const processCircularGalaxyBordersDeps = [
	'circularGalaxyBorders',
] satisfies (keyof MapSettings)[];

export default function processCircularGalaxyBorders(
	gameState: GameState,
	settings: Pick<MapSettings, (typeof processCircularGalaxyBordersDeps)[number]>,
	getSystemCoordinates: (id: number, options?: { invertX?: boolean }) => [number, number],
) {
	const clusters: {
		systems: Set<number>;
		outliers: Set<number>;
		bBox: { xMin: number; xMax: number; yMin: number; yMax: number };
		nonOutlierPoints: GeoJSON.FeatureCollection<GeoJSON.Point>;
	}[] = [];

	for (const go of Object.values(gameState.galactic_object)) {
		if (clusters.some((cluster) => cluster.systems.has(go.id))) continue;
		const cluster: (typeof clusters)[0] = {
			systems: new Set<number>([go.id]),
			outliers: new Set<number>(),
			bBox: {
				xMin: getSystemCoordinates(go.id)[0],
				xMax: getSystemCoordinates(go.id)[0],
				yMin: getSystemCoordinates(go.id)[1],
				yMax: getSystemCoordinates(go.id)[1],
			},
			nonOutlierPoints: turf.featureCollection([
				turf.point(pointToGeoJSON(getSystemCoordinates(go.id))),
			]),
		};
		const edge = go.hyperlane.map((hyperlane) => hyperlane.to);
		const edgeSet = new Set(edge);
		while (edge.length > 0) {
			const nextId = edge.pop();
			if (nextId == null) break; // this shouldn't be possible, here for type inference
			edgeSet.delete(nextId);
			const next = gameState.galactic_object[nextId];
			if (next != null && !cluster.systems.has(nextId)) {
				cluster.systems.add(nextId);
				const nextHyperlanes = next.hyperlane;
				const isOutlier =
					nextHyperlanes.length === 1 &&
					nextHyperlanes[0] != null &&
					nextHyperlanes[0].length > OUTLIER_DISTANCE;
				if (!isOutlier) {
					cluster.nonOutlierPoints.features.push(
						turf.point(pointToGeoJSON(getSystemCoordinates(nextId))),
					);
				}
				if (isOutlier) {
					cluster.outliers.add(nextId);
				} else {
					if (getSystemCoordinates(nextId)[0] < cluster.bBox.xMin)
						cluster.bBox.xMin = getSystemCoordinates(nextId)[0];
					if (getSystemCoordinates(nextId)[0] > cluster.bBox.xMax)
						cluster.bBox.xMax = getSystemCoordinates(nextId)[0];
					if (getSystemCoordinates(nextId)[1] < cluster.bBox.yMin)
						cluster.bBox.yMin = getSystemCoordinates(nextId)[1];
					if (getSystemCoordinates(nextId)[1] > cluster.bBox.yMax)
						cluster.bBox.yMax = getSystemCoordinates(nextId)[1];
				}
				for (const hyperlane of nextHyperlanes) {
					if (!cluster.systems.has(hyperlane.to) && !edgeSet.has(hyperlane.to)) {
						edge.push(hyperlane.to);
						edgeSet.add(hyperlane.to);
					}
				}
			}
		}
		clusters.push(cluster);
	}

	let starburstGeoJSON: null | PolygonalFeature = null;
	const mainCluster = clusters.find((cluster) =>
		clusters.every((otherCluster) => cluster.systems.size >= otherCluster.systems.size),
	);
	if (mainCluster && gameState.galaxy.shape === 'starburst' && settings.circularGalaxyBorders) {
		let outerRadii: number[] = [];
		let innerRadii: number[] = [];
		for (let i = 0; i < STARBURST_NUM_SLICES; i++) {
			const minAngle = STARBURST_SLICE_ANGLE * i - ONE_DEGREE;
			const maxAngle = STARBURST_SLICE_ANGLE * (i + 1) + ONE_DEGREE;
			const [minR, maxR] = getMinMaxSystemRadii(
				Array.from(mainCluster.systems).filter((id) => {
					let systemAngle = Math.atan2(getSystemCoordinates(id)[1], getSystemCoordinates(id)[0]);
					if (systemAngle < 0) systemAngle = Math.PI * 2 + systemAngle;
					return (
						!mainCluster.outliers.has(id) && systemAngle >= minAngle && systemAngle <= maxAngle
					);
				}),
				0,
				0,
				gameState,
				getSystemCoordinates,
			);
			outerRadii.push(maxR);
			innerRadii.push(minR);
		}

		const outerStartIndex = findStarburstStartIndex(outerRadii);
		const outerStartAngle = outerStartIndex * STARBURST_SLICE_ANGLE;
		for (let i = 0; i < outerStartIndex; i++) {
			outerRadii.push(outerRadii.shift() as number);
		}
		outerRadii = smoothRadii(outerRadii, outerRadii, [], 100);
		const interpolateOuterRadii = interpolateBasis(outerRadii);
		starburstGeoJSON = makeStarburstPolygon(
			outerStartAngle,
			interpolateOuterRadii,
			CIRCLE_OUTER_PADDING,
		);

		const innerStartIndex = findStarburstStartIndex(innerRadii);
		const innerStartAngle = innerStartIndex * STARBURST_SLICE_ANGLE;
		for (let i = 0; i < innerStartIndex; i++) {
			innerRadii.push(innerRadii.shift() as number);
		}
		innerRadii = smoothRadii(innerRadii, [], innerRadii, 100);
		// don't cut out inner shape if the core is too small (eg has gigastructures core)
		if (innerRadii.every((r) => r > CIRCLE_INNER_PADDING)) {
			const interpolateInnerRadii = interpolateBasis(innerRadii);
			starburstGeoJSON = turf.difference(
				turf.featureCollection([
					starburstGeoJSON,
					makeStarburstPolygon(innerStartAngle, interpolateInnerRadii, -CIRCLE_INNER_PADDING),
				]),
			);
		}
	}

	const galaxyBorderCircles = clusters
		.map((cluster) => {
			const isMainCluster = cluster === mainCluster;
			let cx = (cluster.bBox.xMin + cluster.bBox.xMax) / 2;
			let cy = (cluster.bBox.yMin + cluster.bBox.yMax) / 2;
			if (cluster === mainCluster) {
				cx = 0;
				cy = 0;
			} else {
				const hull = turf.convex(cluster.nonOutlierPoints);
				if (hull) {
					const hullCenter = turf.centerOfMass(hull);
					const point = pointFromGeoJSON(hullCenter.geometry.coordinates);
					cx = point[0];
					cy = point[1];
				}
			}
			const [minR, maxR] = getMinMaxSystemRadii(
				Array.from(cluster.systems).filter((id) => !cluster.outliers.has(id)),
				cx,
				cy,
				gameState,
				getSystemCoordinates,
			);
			const clusterCircles: NonEmptyArray<BorderCircle> = [
				{
					cx,
					cy,
					r: maxR,
					type: 'outer',
					systems: cluster.systems,
					isMainCluster,
				},
				{
					cx,
					cy,
					r: maxR + CIRCLE_OUTER_PADDING,
					type: 'outer-padded',
					systems: cluster.systems,
					isMainCluster,
				},
			];
			if (minR > 0) {
				clusterCircles.push({
					cx,
					cy,
					r: minR,
					type: 'inner',
					systems: cluster.systems,
					isMainCluster,
				});
			}
			if (minR > CIRCLE_INNER_PADDING * 2) {
				clusterCircles.push({
					cx,
					cy,
					r: minR - CIRCLE_INNER_PADDING,
					type: 'inner-padded',
					systems: cluster.systems,
					isMainCluster,
				});
			}
			clusterCircles.push(
				...Array.from(cluster.outliers).map((outlierId) => ({
					cx: getSystemCoordinates(outlierId)[0],
					cy: getSystemCoordinates(outlierId)[1],
					r: OUTLIER_RADIUS,
					type: 'outlier' as const,
					systems: new Set([outlierId]),
					isMainCluster,
				})),
			);
			return clusterCircles;
		})
		// sort biggest to smallest, so if an inner circle contains a smaller cluster, the smaller one isn't erased
		.sort((a, b) => b[0].r - a[0].r)
		.flat();

	if (!settings.circularGalaxyBorders) {
		return {
			galaxyBorderCircles,
			galaxyBorderCirclesGeoJSON: null,
		};
	}

	let galaxyBorderCirclesGeoJSON: null | PolygonalFeature = starburstGeoJSON;
	for (const circle of galaxyBorderCircles.filter(
		(circle) => starburstGeoJSON == null || !circle.isMainCluster || circle.type === 'outlier',
	)) {
		const polygon = makeBorderCircleGeojson(gameState, getSystemCoordinates, circle);
		if (polygon == null) continue;
		if (circle.type === 'outer-padded' || circle.type === 'outlier') {
			if (galaxyBorderCirclesGeoJSON == null) {
				galaxyBorderCirclesGeoJSON = polygon;
			} else {
				galaxyBorderCirclesGeoJSON = turf.union(
					turf.featureCollection([galaxyBorderCirclesGeoJSON, polygon]),
				);
			}
		} else if (circle.type === 'inner-padded') {
			if (galaxyBorderCirclesGeoJSON != null) {
				galaxyBorderCirclesGeoJSON = turf.difference(
					turf.featureCollection([galaxyBorderCirclesGeoJSON, polygon]),
				);
			}
		}
	}
	return { galaxyBorderCircles, galaxyBorderCirclesGeoJSON };
}

function getMinMaxSystemRadii(
	systemIds: number[],
	cx: number,
	cy: number,
	gameState: GameState,
	getSystemCoordinates: (id: number, options?: { invertX?: boolean }) => [number, number],
): [number, number] {
	const sortedRadiusesSquared = systemIds
		.map((id) => {
			return (cx - getSystemCoordinates(id)[0]) ** 2 + (cy - getSystemCoordinates(id)[1]) ** 2;
		})
		.sort((a, b) => a - b);
	return [
		Math.sqrt(sortedRadiusesSquared[0] ?? 0),
		Math.sqrt(sortedRadiusesSquared[sortedRadiusesSquared.length - 1] ?? 0),
	];
}

function smoothRadii(radii: number[], minimums: number[], maximums: number[], passes: number) {
	let newRadii = radii;
	let passesDone = 0;
	while (passesDone < passes) {
		newRadii = smoothRadiiPass(newRadii, minimums, maximums);
		passesDone++;
	}
	return newRadii;
}

function smoothRadiiPass(radii: number[], minimums: number[], maximums: number[]) {
	const newRadii: number[] = [];
	radii.forEach((radius, i) => {
		let proposedValue = radius;
		const prevPrev = radii[i - 2];
		const prev = radii[i - 1];
		const next = radii[i + 1];
		const nextNext = radii[i + 2];
		if (prev != null && next != null) {
			proposedValue = (prev + next) / 2;
		} else if (prev != null && prevPrev != null) {
			const slope = radius - prev;
			const prevSlope = prev - prevPrev;
			if (Math.abs(prevSlope) < Math.abs(slope)) {
				proposedValue = prev + prevSlope;
			}
		} else if (next != null && nextNext != null) {
			const slope = next - radius;
			const nextSlope = nextNext - next;
			if (Math.abs(nextSlope) < Math.abs(slope)) {
				proposedValue = next - nextSlope;
			}
		}
		const min = minimums[i];
		const max = maximums[i];
		if ((min == null || proposedValue >= min) && (max == null || proposedValue <= max)) {
			newRadii.push(proposedValue);
		} else {
			newRadii.push(radius);
		}
	});
	return newRadii;
}

function findStarburstStartIndex(radii: number[]) {
	const startRadius = radii.slice().sort((a, b) => {
		const aPrevSliceIndex = (radii.indexOf(a) - 1 + radii.length) % radii.length;
		const aDiff = a - (radii[aPrevSliceIndex] as number); // type coercion is safe here
		const bPrevSliceIndex = (radii.indexOf(b) - 1 + radii.length) % radii.length;
		const bDiff = b - (radii[bPrevSliceIndex] as number); // type coercion is safe here
		return aDiff - bDiff;
	})[0];
	return startRadius == null ? 0 : radii.indexOf(startRadius);
}

function makeStarburstPolygon(
	startAngle: number,
	interpolateRadii: (n: number) => number,
	padding: number,
): PolygonalFeature {
	const positions: GeoJSON.Position[] = [];
	for (let i = 0; i < STARBURST_NUM_SLICES; i++) {
		const sliceIndex = i;
		const fromAngle = startAngle + STARBURST_SLICE_ANGLE * sliceIndex;
		for (let j = 0; j < STARBURST_LINES_PER_SLICE + (i === STARBURST_NUM_SLICES - 1 ? 1 : 0); j++) {
			const angle = fromAngle + (STARBURST_SLICE_ANGLE / STARBURST_LINES_PER_SLICE) * j;
			const radius =
				(interpolateRadii(
					i / STARBURST_NUM_SLICES + j / STARBURST_LINES_PER_SLICE / STARBURST_NUM_SLICES,
				) +
					padding) /
				SCALE;
			positions.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
		}
	}
	if (positions[0]) {
		positions.push(positions[0]);
	}
	return turf.polygon([positions]);
}
