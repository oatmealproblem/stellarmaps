import { Delaunay } from 'd3-delaunay';

import { type Snapshot, System, SystemId } from '$lib/project/snapshot';

import type { MapSettings } from '../../settings';
import { getOrSetDefault } from '../../utils';
import type { BorderCircle } from './processCircularGalaxyBorder';

const MAX_BORDER_DISTANCE = 700; // systems further from the center than this will not have country borders

export const processVoronoiDeps = [
	'hyperlaneSensitiveBorders',
	'voronoiGridSize',
	'alignStarsToGrid',
	'galaxyBorderStyle',
] satisfies (keyof MapSettings)[];

export const SYSTEMLESS_VORONOI_POINTS = SystemId.make('SYSTEMLESS_VORONOI_POINTS');

export default function processVoronoi(
	snapshot: Snapshot,
	settings: Pick<MapSettings, (typeof processVoronoiDeps)[number]>,
	getSystemCoordinates: (id: SystemId) => [number, number],
	galaxyBorderCircles: BorderCircle[],
) {
	const voronoiIndexToSystem: Record<number, SystemId> = {};
	const systemIdToVoronoiIndexes: Record<SystemId, number[]> = {};
	const points = Object.values(snapshot.systems).map((system, i) => {
		systemIdToVoronoiIndexes[system.id] = [i];
		voronoiIndexToSystem[i] = system.id;
		return getSystemCoordinates(system.id);
	});
	if (settings.hyperlaneSensitiveBorders) {
		for (const system of Object.values(snapshot.systems)) {
			const [fromX, fromY] = getSystemCoordinates(system.id);
			// TODO don't hard-code hyperlane, check definitions
			for (const connection of system.connections.filter((c) => c.type === 'hyperlane')) {
				const [toX, toY] = getSystemCoordinates(connection.to);
				const dx = toX - fromX;
				const dy = toY - fromY;
				const distance = Math.hypot(dx, dy);
				const numPoints = Math.round(distance / settings.voronoiGridSize / 2) * 2;
				for (let i = 1; i <= numPoints / 2; i++) {
					// only add half (the other system will add its half)
					const t = i / (numPoints + 1);
					const x = fromX + t * dx;
					const y = fromY + t * dy;
					getOrSetDefault(systemIdToVoronoiIndexes, system.id, []).push(points.length);
					voronoiIndexToSystem[points.length] = system.id;
					points.push([x, y]);
				}
			}
		}
	}
	const minDistanceSquared = settings.voronoiGridSize ** 2;
	const outerCircles = galaxyBorderCircles.filter((c) => c.type === 'outer');
	const isInOuterCircle = ([x, y]: [number, number]) =>
		outerCircles.some((circle) => Math.hypot(circle.cx - x, circle.cy - y) < circle.r);
	let extraPointsIndex = points.length;
	const extraPointsIndexes: number[] = [];
	systemIdToVoronoiIndexes[SYSTEMLESS_VORONOI_POINTS] = extraPointsIndexes;
	const extraPoints: [number, number][] = [];
	for (let x = -MAX_BORDER_DISTANCE; x <= MAX_BORDER_DISTANCE; x += settings.voronoiGridSize) {
		for (
			let y = -MAX_BORDER_DISTANCE, row = 0;
			y <= MAX_BORDER_DISTANCE;
			y += settings.voronoiGridSize, row++
		) {
			// shifting every other row helps for more pleasing borders when claimVoid is enabled
			const shiftedX =
				x + (row % 2 === 1 && !settings.alignStarsToGrid ? settings.voronoiGridSize / 2 : 0);
			const shiftedY = y;
			if (
				points.some(
					([otherX, otherY]) =>
						(otherX - shiftedX) ** 2 + (otherY - shiftedY) ** 2 < minDistanceSquared,
				)
			) {
				// do nothing
			} else {
				extraPoints.push([shiftedX, shiftedY]);
				if (isInOuterCircle([shiftedY, shiftedX])) extraPointsIndexes.push(extraPointsIndex);
				extraPointsIndex++;
			}
		}
	}
	if (settings.galaxyBorderStyle === 'blobs') {
		// using points.push(...extraPoints) can cause a stack overflow when the grid size is small
		for (const point of extraPoints) {
			points.push(point);
		}
	}
	const delaunay = Delaunay.from(points);
	const voronoi = delaunay.voronoi([
		-MAX_BORDER_DISTANCE,
		-MAX_BORDER_DISTANCE,
		MAX_BORDER_DISTANCE,
		MAX_BORDER_DISTANCE,
	]);

	function findClosestSystem(x: number, y: number): System | null {
		const index = delaunay.find(x, y);
		const systemId = voronoiIndexToSystem[index];
		return systemId == null ? null : (snapshot.systems[systemId] ?? null);
	}
	return {
		findClosestSystem,
		voronoi,
		systemIdToVoronoiIndexes,
	};
}
