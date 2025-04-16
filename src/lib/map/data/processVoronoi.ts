import { Delaunay } from 'd3-delaunay';

import type { GalacticObject, GameState } from '../../GameState.svelte';
import type { MapSettings } from '../../settings';
import { getOrSetDefault } from '../../utils';
import type { BorderCircle } from './processCircularGalaxyBorder';

const MAX_BORDER_DISTANCE = 700; // systems further from the center than this will not have country borders

export const processVoronoiDeps = [
	'hyperlaneSensitiveBorders',
	'voronoiGridSize',
	'alignStarsToGrid',
	'circularGalaxyBorders',
] satisfies (keyof MapSettings)[];

export default function processVoronoi(
	gameState: GameState,
	settings: Pick<MapSettings, (typeof processVoronoiDeps)[number]>,
	getSystemCoordinates: (id: number, options?: { invertX?: boolean }) => [number, number],
	galaxyBorderCircles: BorderCircle[],
) {
	const voronoiIndexToSystem: Record<number, number> = {};
	const systemIdToVoronoiIndexes: Record<number, number[]> = {};
	const points = Object.values(gameState.galactic_object).map((system, i) => {
		systemIdToVoronoiIndexes[system.id] = [i];
		voronoiIndexToSystem[i] = system.id;
		return getSystemCoordinates(system.id);
	});
	if (settings.hyperlaneSensitiveBorders) {
		for (const system of Object.values(gameState.galactic_object)) {
			const [fromX, fromY] = getSystemCoordinates(system.id);
			for (const hyperlane of system.hyperlane) {
				const [toX, toY] = getSystemCoordinates(hyperlane.to);
				const dx = toX - fromX;
				const dy = toY - fromY;
				const numPoints = Math.round(hyperlane.length / settings.voronoiGridSize / 2) * 2;
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
	systemIdToVoronoiIndexes[-1] = extraPointsIndexes;
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
	if (!settings.circularGalaxyBorders) {
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

	function findClosestSystem(x: number, y: number): GalacticObject | null {
		const index = delaunay.find(x, y);
		const systemId = voronoiIndexToSystem[index];
		return systemId == null ? null : (gameState.galactic_object[systemId] ?? null);
	}
	return {
		findClosestSystem,
		voronoi,
		systemIdToVoronoiIndexes,
	};
}
