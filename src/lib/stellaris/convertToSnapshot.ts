import { Data, HashSet, identity, Iterable, Match, Option, pipe, Predicate, Record } from 'effect';

import { localizeTextSync } from '$lib/map/data/locUtils';
import {
	Connection,
	ConnectionId,
	ConnectionType,
	Coordinate,
	Faction,
	FactionId,
	Flag,
	Membership,
	MembershipId,
	MembershipTag,
	Sector,
	SectorId,
	Snapshot,
	System,
	SystemId,
	SystemObject,
	SystemObjectId,
} from '$lib/project/snapshot';

import { type Bypass, type Country, type GameState } from './GameState.svelte';

type Context = {
	loc: Record<string, string>;
};

export default function convertToSnapshot(gameState: GameState, context: Context): Snapshot {
	const snapshot = Snapshot.make({
		date: gameState.date,
		connections: pipe(
			extractHyperlaneConnections(gameState),
			Iterable.appendAll(extractBypassConnections(gameState)),
			makeRecordFromIterableById,
			Data.struct,
		),
		factions: pipe(
			extractCountries(gameState, context),
			Iterable.appendAll(extractFederations(gameState, context)),
			makeRecordFromIterableById,
			Data.struct,
		),
		memberships: pipe(
			extractSubjectMemberships(gameState),
			Iterable.appendAll(extractFederationMemberships(gameState)),
			makeRecordFromIterableById,
			Data.struct,
		),
		systems: pipe(
			extractGalacticObjects(gameState, context),
			makeRecordFromIterableById,
			Data.struct,
		),
		systemObjects: pipe(
			extractPlanets(gameState, context),
			// TODO fleets
			makeRecordFromIterableById,
			Data.struct,
		),
		sectors: pipe(
			extractSectors(gameState),
			Iterable.appendAll(extractFrontierSectors(gameState)),
			makeRecordFromIterableById,
			Data.struct,
		),
	});
	snapshot.init();
	return snapshot;
}

function extractCountries(gameState: GameState, context: Context): Faction[] {
	return Object.values(gameState.country).map((country) => {
		const faction = Faction.make({
			id: FactionId.make(`country-${country.id}`),
			name: localizeTextSync(country.name, context.loc),
			flag: makeFlagFromCountry(country),
			capitalId: country.capital != null ? SystemObjectId.make(`planet-${country.capital}`) : null,
			knownSystemIds: new Set(
				country.terra_incognita?.systems.map((systemId) => SystemId.make(`system-${systemId}`)),
			),
		});
		return faction;
	});
}

function extractSubjectMemberships(gameState: GameState): Membership[] {
	return Object.values(gameState.country)
		.map((country) => {
			if (country.overlord == null) return null;
			const memberId = FactionId.make(`country-${country.id}`);
			const organizationId = FactionId.make(`country-${country.overlord}`);
			return Membership.make({
				id: MembershipId.make(`${organizationId}-${memberId}`),
				memberId,
				organizationId,
				tags: HashSet.fromIterable<MembershipTag>(['subject']),
			});
		})
		.filter(Predicate.isNotNull);
}

function extractFederations(gameState: GameState, context: Context): Faction[] {
	return Object.values(gameState.federation).map((federation) => {
		const foundingCountry =
			federation.members[0] != null ? gameState.country[federation.members[0]] : undefined;
		const faction = Faction.make({
			id: FactionId.make(`federation-${federation.id}`),
			name: localizeTextSync(federation.name, context.loc),
			// TODO option to use current leader
			flag: makeFlagFromCountry(foundingCountry),
			capitalId: null,
		});
		return faction;
	});
}

function extractFederationMemberships(gameState: GameState): Membership[] {
	return Object.values(gameState.federation).flatMap((federation) =>
		federation.members.map((countryId) => {
			const organizationId = FactionId.make(`federation-${federation.id}`);
			const memberId = FactionId.make(`country-${countryId}`);
			const isHegemony = federation.federation_progress.federation_type === 'hegemony_federation';
			const memberTag = isHegemony ? 'hegemony_member' : 'federation_member';
			const leaderTag = isHegemony ? 'hegemony_leader' : 'federation_leader';
			const membership = Membership.make({
				id: MembershipId.make(`${organizationId}-${memberId}`),
				memberId,
				organizationId,
				tags: HashSet.fromIterable<MembershipTag>([
					...(countryId === federation.leader ? ([leaderTag] as const) : []),
					memberTag,
				]),
			});
			return membership;
		}),
	);
}

function extractSectors(gameState: GameState): Sector[] {
	return Object.values(gameState.sectors)
		.map((stellarisSector) => {
			const ownerId = stellarisSector.owner;
			if (ownerId == null) return null;
			const sector = Sector.make({
				id: SectorId.make(`sector-${stellarisSector.id}`),
				type:
					stellarisSector.local_capital === gameState.country[ownerId]?.capital
						? 'core'
						: 'standard',
				factionId: FactionId.make(`country-${ownerId}`),
				capitalId:
					stellarisSector.local_capital != null
						? SystemObjectId.make(`planet-${stellarisSector.local_capital}`)
						: null,
			});
			return sector;
		})
		.filter(Predicate.isNotNull);
}

function extractFrontierSectors(gameState: GameState): Sector[] {
	return Object.values(gameState.country)
		.map((country) => {
			const sector = Sector.make({
				id: SectorId.make(`frontier-sector-${country.id}`),
				type: 'frontier',
				factionId: FactionId.make(`country-${country.id}`),
				capitalId: null,
			});
			return sector;
		})
		.filter(Predicate.isNotNull);
}

function extractPlanets(gameState: GameState, context: Context): SystemObject[] {
	const planetToSystem = pipe(
		gameState.galactic_object,
		Record.values,
		Iterable.flatMap((system) =>
			Iterable.map(system.planet, (planet) => [planet.toString(), system] as const),
		),
		(entries) => Record.fromIterableWith(entries, identity),
	);
	return Object.values(gameState.planets.planet).map((planet) => {
		const systemId = pipe(
			planetToSystem,
			Record.get(planet.id.toString()),
			Option.getOrThrow,
			(system) => SystemId.make(`system-${system.id}`),
		);
		const systemObject = SystemObject.make({
			id: SystemObjectId.make(`planet-${planet.id}`),
			name: localizeTextSync(planet.name, context.loc),
			systemId,
			coordinate: Coordinate.make({ x: -planet.coordinate.x, y: planet.coordinate.y }),
			population: planet.num_sapient_pops ?? 0,
		});
		return systemObject;
	});
}

function extractGalacticObjects(gameState: GameState, context: Context): System[] {
	const fleetToCountry = pipe(
		gameState.country,
		Record.values,
		Iterable.flatMap((country) =>
			pipe(
				country.fleets_manager?.owned_fleets ?? [],
				Iterable.map((ownedFleet) => [ownedFleet.fleet.toString(), country.id] as [string, number]),
			),
		),
		Record.fromEntries,
	);

	return Object.values(gameState.galactic_object).map((galacticObject) => {
		const starbase =
			galacticObject.starbases[0] != null
				? gameState.starbase_mgr.starbases[galacticObject.starbases[0]]
				: null;
		const starbaseShip = starbase == null ? null : gameState.ships[starbase.station];
		const starbaseOwnerId = starbaseShip != null ? fleetToCountry[starbaseShip.fleet] : null;
		const stellarisSector = Object.values(gameState.sectors).find((s) =>
			s.systems.includes(galacticObject.id),
		);
		const system = System.make({
			id: SystemId.make(`system-${galacticObject.id}`),
			name: localizeTextSync(galacticObject.name, context.loc),
			coordinate: Coordinate.make({
				x: -galacticObject.coordinate.x,
				y: galacticObject.coordinate.y,
			}),
			factionId: starbaseOwnerId != null ? FactionId.make(`country-${starbaseOwnerId}`) : null,
			sectorId: stellarisSector
				? SectorId.make(`sector-${stellarisSector.id}`)
				: starbaseOwnerId != null
					? SectorId.make(`frontier-sector-${starbaseOwnerId}`)
					: null,
		});
		return system;
	});
}

function extractHyperlaneConnections(gameState: GameState): Iterable<Connection> {
	return pipe(
		gameState.galactic_object,
		Record.values,
		Iterable.flatMap((galacticObject) => {
			return galacticObject.hyperlane.map((hyperlane) =>
				makeConnectionFromTypeAndGalacticObjectIds('hyperlane', galacticObject.id, hyperlane.to),
			);
		}),
		HashSet.fromIterable, // dedupe
	);
}

function extractBypassConnections(gameState: GameState): Iterable<Connection> {
	const lGateNexus = Object.values(gameState.galactic_object).find(
		(object) => object.flags?.lcluster1,
	);
	const shroudTunnelNexus = Object.values(gameState.galactic_object).find(
		(object) => object.flags?.shroud_tunnel_nexus,
	);
	const galacticObjectsByWormhole = pipe(
		gameState.galactic_object,
		Record.values,
		Iterable.flatMap((object) =>
			object.natural_wormholes.map((wormhole) => ({ ...object, wormhole })),
		),
		(iterable) => Record.fromIterableBy(iterable, (object) => object.wormhole.toString()),
	);
	const galacticObjectsByMegastructure = pipe(
		gameState.galactic_object,
		Record.values,
		Iterable.flatMap((object) =>
			object.megastructures.map((megastructure) => ({ ...object, megastructure })),
		),
		(iterable) => Record.fromIterableBy(iterable, (object) => object.megastructure.toString()),
	);

	return pipe(
		gameState.bypasses,
		Record.values,
		Iterable.flatMap<Bypass, Connection | null>((bypass) =>
			Match.value(bypass.type).pipe(
				Match.withReturnType<Iterable<Connection | null>>(),
				Match.when(Match.is('gateway'), () => {
					if (!bypass.owner) return [];
					const galacticObject = galacticObjectsByMegastructure[bypass.owner.id];
					if (!galacticObject) return [];
					return [makeConnectionFromTypeAndGalacticObjectIds('gateway', galacticObject.id, null)];
				}),
				Match.when(Match.is('wormhole', 'strange_wormhole'), () => {
					if (!bypass.owner) return [];
					const galacticObject = galacticObjectsByWormhole[bypass.owner.id];
					if (!galacticObject) return [];
					const toBypass = bypass.linked_to != null ? gameState.bypasses[bypass.linked_to] : null;
					const toGalacticObject =
						toBypass?.owner != null ? galacticObjectsByWormhole[toBypass.owner.id] : null;
					return [
						makeConnectionFromTypeAndGalacticObjectIds(
							'wormhole',
							galacticObject.id,
							toGalacticObject?.id,
						),
					];
				}),
				Match.when(Match.is('lgate'), () => {
					if (!bypass.owner) return [];
					const galacticObject = galacticObjectsByMegastructure[bypass.owner.id];
					if (!galacticObject) return [];
					if (galacticObject.id === lGateNexus?.id) return [];
					return [
						makeConnectionFromTypeAndGalacticObjectIds('lgate', galacticObject.id, lGateNexus?.id),
					];
				}),
				Match.when(Match.is('shroud_tunnel'), () => {
					if (!bypass.owner) return [];
					const galacticObject = galacticObjectsByWormhole[bypass.owner.id];
					if (!galacticObject) return [];
					if (galacticObject.id === shroudTunnelNexus?.id) return [];
					return [
						makeConnectionFromTypeAndGalacticObjectIds(
							'shroud_tunnel',
							galacticObject.id,
							shroudTunnelNexus?.id,
						),
					];
				}),
				Match.when(Match.is('relay_bypass'), () => {
					if (!bypass.owner) return [];
					const galacticObject = galacticObjectsByMegastructure[bypass.owner.id];
					if (!galacticObject) return [];
					return galacticObject.hyperlane.map((hyperlane) => {
						const toGalacticObject = gameState.galactic_object[hyperlane.to];
						if (!toGalacticObject) return null;
						if (
							toGalacticObject.bypasses.some(
								(bypassId) => gameState.bypasses[bypassId]?.type === 'relay_bypass',
							)
						) {
							return makeConnectionFromTypeAndGalacticObjectIds(
								'hyper_relay',
								galacticObject.id,
								toGalacticObject.id,
							);
						} else {
							return null;
						}
					});
				}),
				Match.orElse(() => []),
			),
		),
		Iterable.filter(Predicate.isNotNullable),
		HashSet.fromIterable, // dedupe
	);
}

function makeFlagFromCountry(country: Country | undefined) {
	return Flag.make({
		primaryColor: country?.flag?.colors[0] ?? 'black',
		secondaryColor: country?.flag?.colors[1] ?? 'black',
		emblem: country?.flag?.icon ? `${country.flag.icon.category}/${country.flag.icon.file}` : null,
	});
}

function makeRecordFromIterableById<T extends { id: string }>(
	iterable: Iterable<T>,
): Record<T['id'], T> {
	return Record.fromIterableBy(iterable, (item) => item.id);
}

function makeConnectionFromTypeAndGalacticObjectIds(
	type: ConnectionType,
	id1: number,
	id2: number | null | undefined,
) {
	const systemId1 = SystemId.make(`system-${id1}`);
	const systemId2 = id2 != null ? SystemId.make(`system-${id2}`) : null;
	const [fromId, toId] =
		systemId2 != null ? ([systemId1, systemId2] as [SystemId, SystemId]).sort() : [systemId1, null];
	const id =
		toId != null
			? ConnectionId.make(`${type}-from-${fromId}-to-${toId}`)
			: ConnectionId.make(`${type}-from-${fromId}`);
	return Connection.make({
		id,
		type,
		fromId,
		toId,
	});
}
