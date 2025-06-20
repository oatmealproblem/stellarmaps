import { Data, identity, Iterable, Option, pipe, Predicate, Record } from 'effect';

import { localizeTextSync } from '$lib/map/data/locUtils';
import {
	Connection,
	Coordinate,
	Faction,
	FactionId,
	Flag,
	Sector,
	SectorId,
	Snapshot,
	System,
	SystemId,
	SystemObject,
	SystemObjectId,
} from '$lib/project/snapshot';

import { type GameState } from './GameState.svelte';

type Context = {
	loc: Record<string, string>;
};

export default function convertToSnapshot(gameState: GameState, context: Context): Snapshot {
	const snapshot = Snapshot.make({
		date: gameState.date,
		factions: pipe(
			extractCountries(gameState, context),
			// TODO federations
			(factions) => Record.fromIterableBy(factions, (faction) => faction.id),
			Data.struct,
		),
		systems: pipe(
			extractGalacticObjects(gameState, context),
			(systems) => Record.fromIterableBy(systems, (system) => system.id),
			Data.struct,
		),
		systemObjects: pipe(
			extractPlanets(gameState, context),
			// TODO fleets
			(systemObjects) => Record.fromIterableBy(systemObjects, (systemObject) => systemObject.id),
			Data.struct,
		),
		sectors: pipe(
			extractSectors(gameState),
			Iterable.appendAll(extractFrontierSectors(gameState)),
			(sectors) => Record.fromIterableBy(sectors, (sector) => sector.id),
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
			flag: Flag.make({
				primaryColor: country.flag?.colors[0] ?? 'black',
				secondaryColor: country.flag?.colors[1] ?? 'black',
				emblem: country.flag?.icon
					? `${country.flag.icon.category}/${country.flag.icon.file}`
					: null,
			}),
			capitalId: country.capital != null ? SystemObjectId.make(`planet-${country.capital}`) : null,
		});
		return faction;
	});
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
			connections: Data.array([
				...galacticObject.hyperlane.map((hyperlane) =>
					Connection.make({
						type: 'hyperlane',
						to: SystemId.make(`system-${hyperlane.to}`),
					}),
				),
				// TODO bypasses
			]),
		});
		return system;
	});
}
