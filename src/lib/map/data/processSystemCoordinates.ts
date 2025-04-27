import type { GameState } from '../../GameState.svelte';
import type { MapSettings } from '../../settings';
import { positionToString } from './utils';

export const processSystemCoordinatesDeps = ['alignStarsToGrid'] satisfies (keyof MapSettings)[];
export default function processSystemCoordinates(
	gameState: GameState,
	settings: Pick<MapSettings, (typeof processSystemCoordinatesDeps)[number]>,
) {
	const systemIdToCoordinates: Record<number, [number, number]> = {};
	const usedCoordinates = new Set(
		...Object.values(gameState.galactic_object).map((go) =>
			positionToString([go.coordinate.x, go.coordinate.y]),
		),
	);
	for (const go of Object.values(gameState.galactic_object)) {
		const originalCoordinates: [number, number] = [go.coordinate.x, go.coordinate.y];
		const preferredCoordinates: [number, number][] = settings.alignStarsToGrid
			? [
					[
						Math.round(originalCoordinates[0] / 20) * 20,
						Math.round(originalCoordinates[1] / 20) * 20,
					],
					[
						Math.round(originalCoordinates[0] / 10) * 10,
						Math.round(originalCoordinates[1] / 10) * 10,
					],
					[Math.round(originalCoordinates[0] / 5) * 5, Math.round(originalCoordinates[1] / 5) * 5],
					originalCoordinates,
				]
			: [];
		const coordinates =
			preferredCoordinates.find((coords) => !usedCoordinates.has(positionToString(coords))) ??
			originalCoordinates;
		usedCoordinates.add(positionToString(coordinates));
		systemIdToCoordinates[go.id] = coordinates;
	}
	function getSystemCoordinates(systemId: number, { invertX = false } = {}): [number, number] {
		const coordinates = systemIdToCoordinates[systemId];
		if (coordinates != null) {
			if (invertX) {
				return [-coordinates[0], coordinates[1]];
			} else {
				return coordinates;
			}
		}
		console.error(`System ${systemId} is missing coordinates; falling back to 0,0`);
		return [0, 0];
	}
	return getSystemCoordinates;
}
