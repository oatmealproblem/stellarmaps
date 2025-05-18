import type { Snapshot, SystemId } from '$lib/project/snapshot';

import type { MapSettings } from '../../settings';
import { positionToString } from './utils';

export const processSystemCoordinatesDeps = ['alignStarsToGrid'] satisfies (keyof MapSettings)[];
export default function processSystemCoordinates(
	snapshot: Snapshot,
	settings: Pick<MapSettings, (typeof processSystemCoordinatesDeps)[number]>,
) {
	const systemIdToCoordinates: Record<SystemId, [number, number]> = {};
	const usedCoordinates = new Set(
		...Object.values(snapshot.systems).map((system) =>
			positionToString([system.coordinate.x, system.coordinate.y]),
		),
	);
	for (const system of Object.values(snapshot.systems)) {
		const originalCoordinates: [number, number] = [system.coordinate.x, system.coordinate.y];
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
		systemIdToCoordinates[system.id] = coordinates;
	}
	function getSystemCoordinates(systemId: SystemId): [number, number] {
		const coordinates = systemIdToCoordinates[systemId];
		if (coordinates != null) {
			return coordinates;
		}
		console.error(`System ${systemId} is missing coordinates; falling back to 0,0`);
		return [0, 0];
	}
	return getSystemCoordinates;
}
