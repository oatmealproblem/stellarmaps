import type { FactionId, Snapshot, SystemId } from '$lib/project/snapshot';

import type { MapSettings } from '../../settings';
import {
	defaultCountryMapModeInfo,
	getCountryMapModeInfo,
	type MapModeCountryInfo,
	mapModes,
	type MapModeSystemValue,
} from './mapModes';
import type processSystemOwnership from './processSystemOwnership';

export interface ProcessedSystem extends MapModeCountryInfo {
	id: SystemId;
	countryId?: FactionId;
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
	systemIdToCountry: ReturnType<typeof processSystemOwnership>['systemIdToCountry'],
	knownCountries: Set<FactionId>,
	knownSystems: Set<SystemId>,
	getSystemCoordinates: (id: SystemId) => [number, number],
) {
	const playerCountryId = undefined as FactionId | undefined; // TODO gameState.player.filter((p) => gameState.country[p.country])[0]?.country;
	const povCountryId =
		settings.mapModePointOfView === 'player'
			? playerCountryId
			: parseInt(settings.mapModePointOfView);
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
		const countryId = systemIdToCountry[system.id];
		const country = countryId != null ? snapshot.factions[countryId] : null;
		const mapModeInfo =
			countryId != null
				? getCountryMapModeInfo(countryId, snapshot, settings)
				: defaultCountryMapModeInfo;

		const isOwned = country != null;
		const isColonized = false; // TODO isOwned && Boolean(system.colonies.length);
		const isSectorCapital = false; // TODO
		// Object.values(gameState.sectors).some((sector) =>
		// 	system.colonies.includes(sector.local_capital as number),
		// );
		const isCountryCapital = false; // TODO system.colonies.includes(country?.capital as number);
		const [x, y] = getSystemCoordinates(system.id);

		const ownerIsKnown = countryId != null && knownCountries.has(countryId);
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
			country ?? null,
		);
		const mapModeTotalValue = mapModeValues?.reduce((acc, cur) => acc + cur.value, 0);

		return {
			id: system.id,
			countryId,
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
