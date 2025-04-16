import * as turf from '@turf/turf';

import type { GameState } from '../../GameState.svelte';
import type { MapSettings } from '../../settings';
import { getOrDefault, getOrSetDefault, parseNumberEntry } from '../../utils';
import { getFrontierSectorPseudoId, getUnionLeaderId, pointToGeoJSON } from './utils';

export const processSystemOwnershipDeps = [
	'frontierBubbleThreshold',
	'unionMode',
	'unionFederations',
	'unionHegemonies',
	'unionSubjects',
	'unionFederationsColor',
] satisfies (keyof MapSettings)[];

export default function processSystemOwnership(
	gameState: GameState,
	settings: Pick<MapSettings, (typeof processSystemOwnershipDeps)[number]>,
	getSystemCoordinates: (id: number, options?: { invertX?: boolean }) => [number, number],
) {
	const fleetToCountry: Record<string, number> = {};
	Object.values(gameState.country).forEach((country) => {
		country.fleets_manager?.owned_fleets.forEach((owned_fleet) => {
			fleetToCountry[owned_fleet.fleet] = country.id;
		});
	});
	const systemToSectorId: Record<number, number> = {};
	const sectorToSystemIds: Record<number, Set<number>> = {};
	const sectorToCountry: Record<number, number> = {};
	const countryToSystemIds: Record<string, Set<number>> = {};
	const unionLeaderToSystemIds: Record<string, Set<number>> = {};
	const unionLeaderToUnionMembers: Record<number, Set<number>> = {};
	const unionLeaderToSectors: Record<number, Set<number>> = {};
	const ownedSystemPoints: GeoJSON.Point[] = [];
	const systemIdToCountry: Record<string, number> = {};
	const systemIdToUnionLeader: Record<string, number> = {};
	const fullOccupiedOccupierToSystemIds: Record<string, Set<number>> = {};
	const partialOccupiedOccupierToSystemIds: Record<string, Set<number>> = {};
	for (const system of Object.values(gameState.galactic_object)) {
		const starbase =
			system.starbases[0] != null ? gameState.starbase_mgr.starbases[system.starbases[0]] : null;
		const starbaseShip = starbase == null ? null : gameState.ships[starbase.station];
		const ownerId = starbaseShip != null ? fleetToCountry[starbaseShip.fleet] : null;
		const owner = ownerId != null ? gameState.country[ownerId] : null;

		if (ownerId != null && owner != null) {
			const sector = Object.values(gameState.sectors).find(
				(s) => s.owner === ownerId && s.systems.includes(system.id),
			);
			const sectorId = sector != null ? sector.id : getFrontierSectorPseudoId(ownerId);
			systemToSectorId[system.id] = sectorId;
			getOrSetDefault(sectorToSystemIds, sectorId, new Set()).add(system.id);
			sectorToCountry[sectorId] = ownerId;
			const joinedUnionLeaderId = getUnionLeaderId(ownerId, gameState, settings, ['joinedBorders']);
			ownedSystemPoints.push(turf.point(pointToGeoJSON(getSystemCoordinates(system.id))).geometry);
			getOrSetDefault(countryToSystemIds, ownerId, new Set()).add(system.id);
			getOrSetDefault(unionLeaderToSystemIds, joinedUnionLeaderId, new Set()).add(system.id);
			getOrSetDefault(unionLeaderToUnionMembers, joinedUnionLeaderId, new Set()).add(ownerId);
			getOrSetDefault(unionLeaderToSectors, joinedUnionLeaderId, new Set()).add(sectorId);
			systemIdToCountry[system.id] = ownerId;
			systemIdToUnionLeader[system.id] = joinedUnionLeaderId;

			const mainStar = system.planet[0] == null ? null : gameState.planets.planet[system.planet[0]];
			const occupier = mainStar?.controller !== ownerId ? mainStar?.controller : null;
			if (occupier != null) {
				if (
					system.colonies.every((colonyId) => {
						const planet = gameState.planets.planet[colonyId];
						if (!planet) return true; // bad data, don't care
						if (planet.owner !== ownerId) return true; // different owner (eg pre-FTL), don't care
						return planet.controller != null && planet.controller !== ownerId; // occupied
					})
				) {
					getOrSetDefault(fullOccupiedOccupierToSystemIds, `${ownerId}-${occupier}`, new Set()).add(
						system.id,
					);
				} else {
					getOrSetDefault(
						partialOccupiedOccupierToSystemIds,
						`${ownerId}-${occupier}`,
						new Set(),
					).add(system.id);
				}
			}
		}
	}

	// postprocess sectors: assign small "frontier bubbles" to nearby sectors
	for (const [sectorId, systemIds] of Object.entries(sectorToSystemIds).map(parseNumberEntry)) {
		if (sectorId >= 0) continue; // not a fronteir

		// find the clusters (hyperlane connected systems in the same sector)
		const clusters: Set<number>[] = [];
		for (const systemId of systemIds) {
			const neighborIds = gameState.galactic_object[systemId]?.hyperlane.map((h) => h.to) ?? [];
			const cluster = clusters.find((c) => neighborIds.some((n) => c.has(n))) ?? new Set();
			cluster.add(systemId);
			if (!clusters.includes(cluster)) clusters.push(cluster);
			let otherCluster = clusters.find((c) => c !== cluster && neighborIds.some((n) => c.has(n)));
			while (otherCluster != null) {
				for (const mergedSystemId of otherCluster) cluster.add(mergedSystemId);
				clusters.splice(clusters.indexOf(otherCluster), 1);
				otherCluster = clusters.find((c) => c !== cluster && neighborIds.some((n) => c.has(n)));
			}
		}

		// reassign clusters that are below the "bubble" threshold
		for (const cluster of clusters.filter(
			(c) => c.size <= (settings.frontierBubbleThreshold ?? 0),
		)) {
			// count how many hyperlane connections each neighbor has
			const neighborSectorToNumConnections: Record<number, number> = {};
			for (const systemId of cluster) {
				const neighborIds = gameState.galactic_object[systemId]?.hyperlane.map((h) => h.to) ?? [];
				for (const neighborId of neighborIds) {
					const neighborSectorId = systemToSectorId[neighborId];
					if (
						neighborSectorId != null &&
						neighborSectorId !== sectorId &&
						// only count sectors that belong to the same country
						sectorToCountry[neighborSectorId] === sectorToCountry[sectorId]
					) {
						neighborSectorToNumConnections[neighborSectorId] =
							getOrDefault(neighborSectorToNumConnections, neighborSectorId, 0) + 1;
					}
				}
			}

			// first try most connected (by hyperlane) neighbor
			const reassignedSectorId = Object.keys(neighborSectorToNumConnections)
				.map((key) => parseInt(key))
				.sort((a, b) => {
					let comparison =
						(neighborSectorToNumConnections[b] ?? 0) - (neighborSectorToNumConnections[a] ?? 0);
					if (comparison === 0) {
						// if 0, sort by id, to safeguard against non-deterministic behavior
						// (the order of the keys in json from rust is not guaranteed to be consistent)
						comparison = a - b;
					}
					return comparison;
				})[0];

			// assign system to target if found
			if (reassignedSectorId != null) {
				for (const systemId of cluster) {
					systemIds.delete(systemId);
					sectorToSystemIds[reassignedSectorId]?.add(systemId);
					systemToSectorId[systemId] = reassignedSectorId;
				}
			}
		}
	}

	return {
		sectorToSystemIds,
		sectorToCountry,
		countryToSystemIds,
		unionLeaderToSystemIds,
		unionLeaderToUnionMembers,
		unionLeaderToSectors,
		ownedSystemPoints,
		systemIdToCountry,
		systemIdToUnionLeader,
		fullOccupiedOccupierToSystemIds,
		partialOccupiedOccupierToSystemIds,
	};
}
