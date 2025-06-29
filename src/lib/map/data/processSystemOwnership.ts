import * as turf from '@turf/turf';

import type { FactionId, SectorId, Snapshot, SystemId } from '$lib/project/snapshot';

import type { MapSettings } from '../../settings';
import { getOrSetDefault } from '../../utils';
import { getUnionLeaderId, pointToGeoJSON } from './utils';

export const processSystemOwnershipDeps = [
	'frontierBubbleThreshold',
	'unionMode',
	'unionFederations',
	'unionHegemonies',
	'unionSubjects',
	'unionFederationsColor',
] satisfies (keyof MapSettings)[];

export default function processSystemOwnership(
	snapshot: Snapshot,
	settings: Pick<MapSettings, (typeof processSystemOwnershipDeps)[number]>,
	getSystemCoordinates: (id: SystemId) => [number, number],
) {
	const unionLeaderToSystemIds: Record<FactionId, Set<SystemId>> = {};
	const unionLeaderToUnionMembers: Record<FactionId, Set<FactionId>> = {};
	const unionLeaderToSectors: Record<FactionId, Set<SectorId>> = {};
	const ownedSystemPoints: GeoJSON.Point[] = [];
	const systemIdToUnionLeader: Record<SystemId, FactionId> = {};
	const fullOccupiedOccupierToSystemIds: Record<FactionId, Set<SystemId>> = {};
	const partialOccupiedOccupierToSystemIds: Record<FactionId, Set<SystemId>> = {};
	for (const system of Object.values(snapshot.systems)) {
		const ownerId = system.factionId;
		const owner = ownerId != null ? snapshot.factions[ownerId] : null;

		if (ownerId != null && owner != null) {
			const sectorId = system.sectorId;
			if (sectorId == null) throw new Error('Unsupported: owned system does not have sector');
			const joinedUnionLeaderId =
				getUnionLeaderId(ownerId, snapshot, settings, ['joinedBorders']) ?? ownerId;
			ownedSystemPoints.push(turf.point(pointToGeoJSON(getSystemCoordinates(system.id))).geometry);
			getOrSetDefault(unionLeaderToSystemIds, joinedUnionLeaderId, new Set()).add(system.id);
			getOrSetDefault(unionLeaderToUnionMembers, joinedUnionLeaderId, new Set()).add(ownerId);
			getOrSetDefault(unionLeaderToSectors, joinedUnionLeaderId, new Set()).add(sectorId);
			systemIdToUnionLeader[system.id] = joinedUnionLeaderId;

			// TODO occupation
			// const mainStar = system.planet[0] == null ? null : gameState.planets.planet[system.planet[0]];
			// const occupier = mainStar?.controller !== ownerId ? mainStar?.controller : null;
			// if (occupier != null) {
			// 	if (
			// 		system.colonies.every((colonyId) => {
			// 			const planet = gameState.planets.planet[colonyId];
			// 			if (!planet) return true; // bad data, don't care
			// 			if (planet.owner !== ownerId) return true; // different owner (eg pre-FTL), don't care
			// 			return planet.controller != null && planet.controller !== ownerId; // occupied
			// 		})
			// 	) {
			// 		getOrSetDefault(fullOccupiedOccupierToSystemIds, `${ownerId}-${occupier}`, new Set()).add(
			// 			system.id,
			// 		);
			// 	} else {
			// 		getOrSetDefault(
			// 			partialOccupiedOccupierToSystemIds,
			// 			`${ownerId}-${occupier}`,
			// 			new Set(),
			// 		).add(system.id);
			// 	}
			// }
		}
	}

	// TODO move this logic to gameState->snapshot converter
	// postprocess sectors: assign small "frontier bubbles" to nearby sectors
	// for (const [sectorId, systemIds] of Object.entries(sectorToSystemIds).map(parseNumberEntry)) {
	// 	if (sectorId >= 0) continue; // not a fronteir

	// 	// find the clusters (hyperlane connected systems in the same sector)
	// 	const clusters: Set<number>[] = [];
	// 	for (const systemId of systemIds) {
	// 		const neighborIds = gameState.galactic_object[systemId]?.hyperlane.map((h) => h.to) ?? [];
	// 		const cluster = clusters.find((c) => neighborIds.some((n) => c.has(n))) ?? new Set();
	// 		cluster.add(systemId);
	// 		if (!clusters.includes(cluster)) clusters.push(cluster);
	// 		let otherCluster = clusters.find((c) => c !== cluster && neighborIds.some((n) => c.has(n)));
	// 		while (otherCluster != null) {
	// 			for (const mergedSystemId of otherCluster) cluster.add(mergedSystemId);
	// 			clusters.splice(clusters.indexOf(otherCluster), 1);
	// 			otherCluster = clusters.find((c) => c !== cluster && neighborIds.some((n) => c.has(n)));
	// 		}
	// 	}

	// 	// reassign clusters that are below the "bubble" threshold
	// 	for (const cluster of clusters.filter(
	// 		(c) => c.size <= (settings.frontierBubbleThreshold ?? 0),
	// 	)) {
	// 		// count how many hyperlane connections each neighbor has
	// 		const neighborSectorToNumConnections: Record<number, number> = {};
	// 		for (const systemId of cluster) {
	// 			const neighborIds = gameState.galactic_object[systemId]?.hyperlane.map((h) => h.to) ?? [];
	// 			for (const neighborId of neighborIds) {
	// 				const neighborSectorId = systemToSectorId[neighborId];
	// 				if (
	// 					neighborSectorId != null &&
	// 					neighborSectorId !== sectorId &&
	// 					// only count sectors that belong to the same country
	// 					sectorToCountry[neighborSectorId] === sectorToCountry[sectorId]
	// 				) {
	// 					neighborSectorToNumConnections[neighborSectorId] =
	// 						getOrDefault(neighborSectorToNumConnections, neighborSectorId, 0) + 1;
	// 				}
	// 			}
	// 		}

	// 		// first try most connected (by hyperlane) neighbor
	// 		const reassignedSectorId = Object.keys(neighborSectorToNumConnections)
	// 			.map((key) => parseInt(key))
	// 			.sort((a, b) => {
	// 				let comparison =
	// 					(neighborSectorToNumConnections[b] ?? 0) - (neighborSectorToNumConnections[a] ?? 0);
	// 				if (comparison === 0) {
	// 					// if 0, sort by id, to safeguard against non-deterministic behavior
	// 					// (the order of the keys in json from rust is not guaranteed to be consistent)
	// 					comparison = a - b;
	// 				}
	// 				return comparison;
	// 			})[0];

	// 		// assign system to target if found
	// 		if (reassignedSectorId != null) {
	// 			for (const systemId of cluster) {
	// 				systemIds.delete(systemId);
	// 				sectorToSystemIds[reassignedSectorId]?.add(systemId);
	// 				systemToSectorId[systemId] = reassignedSectorId;
	// 			}
	// 		}
	// 	}
	// }

	return {
		unionLeaderToSystemIds,
		unionLeaderToUnionMembers,
		unionLeaderToSectors,
		ownedSystemPoints,
		systemIdToUnionLeader,
		fullOccupiedOccupierToSystemIds,
		partialOccupiedOccupierToSystemIds,
	};
}
