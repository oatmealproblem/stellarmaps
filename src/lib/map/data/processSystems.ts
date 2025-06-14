import { Iterable, Option, pipe, Record } from 'effect';

import { FactionId, type Snapshot, type SystemId } from '$lib/project/snapshot';

import type { MapSettings } from '../../settings';
import {
	defaultCountryMapModeInfo,
	getCountryMapModeInfo,
	type MapModeCountryInfo,
	mapModes,
	type MapModeSystemValue,
} from './mapModes';

export interface ProcessedSystem extends MapModeCountryInfo {
	id: SystemId;
	countryId: FactionId | null;
	isColonized: boolean;
	isSectorCapital: boolean;
	isCountryCapital: boolean;
	isOwned: boolean;
	ownerIsKnown: boolean;
	systemIsKnown: boolean;
	hasWormhole: boolean;
	hasGateway: boolean;
	hasLGate: boolean;
	hasShroudTunnel: boolean;
	x: number;
	y: number;
	name: string;
	mapModeValues?: MapModeSystemValue[];
	mapModeTotalValue?: number;
}

export const processSystemsDeps = [
	'unionMode',
	'unionFederations',
	'unionHegemonies',
	'unionSubjects',
	'unionFederationsColor',
	'mapMode',
	'mapModePointOfView',
	'mapModeSpecies',
] satisfies (keyof MapSettings)[];

export default function processSystems(
	snapshot: Snapshot,
	settings: Pick<MapSettings, (typeof processSystemsDeps)[number]>,
	knownCountries: Set<FactionId>,
	knownSystems: Set<SystemId>,
	getSystemCoordinates: (id: SystemId) => [number, number],
) {
	const playerCountryId = undefined as FactionId | undefined; // TODO gameState.player.filter((p) => gameState.country[p.country])[0]?.country;
	const povCountryId =
		settings.mapModePointOfView === 'player'
			? playerCountryId
			: FactionId.make(settings.mapModePointOfView);
	const povCountry = povCountryId == null ? null : snapshot.factions[povCountryId];
	// TODO
	// const selectedSpeciesId =
	// 	settings.mapModeSpecies === 'player'
	// 		? playerCountryId == null
	// 			? null
	// 			: snapshot.factions[playerCountryId]?.founder_species_ref
	// 		: parseInt(settings.mapModeSpecies);
	// const selectedSpecies =
	// 	selectedSpeciesId == null ? null : gameState.species_db[selectedSpeciesId];

	const systems = Object.values(snapshot.systems).map<ProcessedSystem>((system) => {
		const factionId = system.factionId;
		const faction = factionId != null ? snapshot.factions[factionId] : null;
		const mapModeInfo =
			factionId != null
				? getCountryMapModeInfo(factionId, snapshot, settings)
				: defaultCountryMapModeInfo;

		const isOwned = faction != null;
		const colonies = new Set(
			pipe(
				snapshot.systemObjects,
				Record.values,
				Iterable.filterMap((obj) =>
					obj.population > 0 && obj.system === system.id ? Option.some(obj.id) : Option.none(),
				),
			),
		);
		const isColonized = isOwned && colonies.size > 0;
		const sector = system.sectorId != null ? snapshot.sectors[system.sectorId] : null;
		const isSectorCapital = sector?.capitalId != null && colonies.has(sector.capitalId);
		const isCountryCapital = faction?.capitalId != null && colonies.has(faction.capitalId);
		const [x, y] = getSystemCoordinates(system.id);

		const ownerIsKnown = factionId != null && knownCountries.has(factionId);
		const systemIsKnown = knownSystems.has(system.id);

		// const bypassTypes = new Set(
		// 	system.bypasses
		// 		.map((bypassId) => gameState.bypasses[bypassId]?.type)
		// 		.filter(Predicate.isNotNullable),
		// );
		const hasWormhole = false; // TODO bypassTypes.has('wormhole') || bypassTypes.has('strange_wormhole');
		const hasGateway = false; // TODO bypassTypes.has('gateway');
		const hasLGate = false; // TODO bypassTypes.has('lgate');
		const hasShroudTunnel = false; // TODO bypassTypes.has('shroud_tunnel');

		const mapModeValues = mapModes[settings.mapMode]?.system?.getValues(
			snapshot,
			system,
			povCountry ?? null,
			null, // TODO selectedSpecies ?? null,
			faction ?? null,
		);
		const mapModeTotalValue = mapModeValues?.reduce((acc, cur) => acc + cur.value, 0);

		return {
			id: system.id,
			countryId: factionId,
			...mapModeInfo,
			isColonized,
			isSectorCapital,
			isCountryCapital,
			isOwned,
			ownerIsKnown,
			systemIsKnown,
			hasWormhole,
			hasGateway,
			hasLGate,
			hasShroudTunnel,
			x,
			y,
			name: system.name,
			mapModeValues,
			mapModeTotalValue,
		};
	});
	return systems;
}
