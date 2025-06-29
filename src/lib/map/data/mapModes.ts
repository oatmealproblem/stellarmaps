import { Faction, FactionId, type Snapshot, System } from '$lib/project/snapshot';

import type { MessageID } from '../../../intl';
import type { ColorSetting, MapSettings } from '../../settings';
import type { LocalizedText, Species } from '../../stellaris/GameState.svelte';
import { getUnionLeaderId } from './utils';

interface MapMode {
	id: string;
	name: MessageID;
	tooltipLabel?: MessageID;
	country?: MapModeBorder[];
	system?: MapModeSystem;
	hasPov?: boolean;
	hasSpecies?: boolean;
}

interface MapModeBorder {
	label: LocalizedText | MessageID | null;
	showInLegend: 'always' | 'never';
	primaryColor: string;
	secondaryColor?: string;
	matches: (snapshot: Snapshot, countryId: FactionId, povCountryId?: FactionId) => boolean;
}

interface MapModeSystem {
	scale?: number;
	getValues: (
		snapshot: Snapshot,
		system: System,
		povCountry: Faction | null,
		selectedSpecies: Species | null,
		systemOwner: Faction | null,
	) => MapModeSystemValue[];
}

export interface MapModeSystemValue {
	value: number;
	color: ColorSetting;
	legendColor?: ColorSetting;
	legendIndex: number;
	legendLabel: MessageID | LocalizedText;
	legendLabelData?: Record<string, LocalizedText>;
}

export const mapModes: Record<string, MapMode> = {
	default: {
		id: 'default',
		name: 'map_mode.default.name',
	},
	unions: {
		id: 'unions',
		name: 'map_mode.unions.name',
	},
	wars: {
		id: 'wars',
		name: 'map_mode.wars.name',
		tooltipLabel: 'map_mode.wars.tooltip_label',
		hasPov: true,
		country: [
			{
				label: 'map_mode.common.selected_country',
				showInLegend: 'always',
				primaryColor: 'dark_teal',
				matches: (_gameState, countryId, povCountryId) => countryId === povCountryId,
			},
			{
				label: 'map_mode.wars.ally',
				showInLegend: 'always',
				primaryColor: 'sky_blue',
				matches: (_snapshot, _countryId, _povCountryId) => false,
				// TODO
				// Object.values(snapshot.war).some(
				// 	(war) =>
				// 		(war.attackers.some((c) => c.country === countryId) &&
				// 			war.attackers.some((c) => c.country === povCountryId)) ||
				// 		(war.defenders.some((c) => c.country === countryId) &&
				// 			war.defenders.some((c) => c.country === povCountryId)),
				// ),
			},
			{
				label: 'map_mode.wars.hostile',
				showInLegend: 'always',
				primaryColor: 'red',
				matches: areCountriesHostile,
			},
			{
				label: 'map_mode.wars.at_war',
				showInLegend: 'always',
				primaryColor: 'orange',
				matches: (_gameState, _countryId) => false,
				// TODO
				// Object.values(gameState.war).some(
				// 	(war) =>
				// 		war.attackers.some((c) => c.country === countryId) ||
				// 		war.defenders.some((c) => c.country === countryId),
				// ),
			},
			{
				label: 'map_mode.wars.at_peace',
				showInLegend: 'always',
				primaryColor: 'white',
				matches: () => true,
			},
		],
	},
	population: {
		id: 'population',
		name: 'map_mode.population.name_total',
		tooltipLabel: 'map_mode.population.tooltip_label',
		country: [
			{
				label: 'map_mode.common.selected_country',
				showInLegend: 'never',
				matches: () => true,
				primaryColor: 'black',
			},
		],
		system: {
			getValues: (_snapshot, _system) => {
				// TODO
				// const planets = system.colonies
				// 	.map((planetId) => snapshot.planets.planet[planetId])
				// 	.filter(Predicate.isNotNullable);
				// const population = planets.reduce(
				// 	(totalPopulation, planet) => totalPopulation + (planet.num_sapient_pops ?? 0),
				// 	0,
				// );
				const population = 0;
				return [
					{
						value: population,
						color: { color: 'intense_blue', colorAdjustments: [{ type: 'OPACITY', value: 0.5 }] },
						legendIndex: 0,
						legendLabel: 'map_mode.population.total',
					},
				];
			},
		},
	},
	populationByCountry: {
		id: 'populationByCountry',
		name: 'map_mode.population.name_by_country',
		tooltipLabel: 'map_mode.population.tooltip_label',
		country: [
			{
				label: null,
				showInLegend: 'never',
				matches: () => true,
				primaryColor: 'black',
			},
		],
		system: {
			getValues: (_snapshot, _system) => {
				return [];
				// const planets = system.colonies
				// 	.map((planetId) => gameState.planets.planet[planetId])
				// 	.filter(Predicate.isNotNullable);
				// const populationByCountry: Map<number, number> = planets.reduce<Map<number, number>>(
				// 	(acc, planet) => {
				// 		if (planet.owner != null && planet.num_sapient_pops != null) {
				// 			acc.set(planet.owner, (acc.get(planet.owner) ?? 0) + planet.num_sapient_pops);
				// 		}
				// 		return acc;
				// 	},
				// 	new Map(),
				// );
				// return Array.from(populationByCountry)
				// 	.map<MapModeSystemValue>(([countryId, population]) => {
				// 		const color = snapshot.country[countryId]?.flag?.colors[0] ?? 'black';
				// 		return {
				// 			value: population,
				// 			color: {
				// 				color,
				// 				colorAdjustments: [
				// 					{ type: 'MIN_CONTRAST', value: 0.25 },
				// 					{ type: 'OPACITY', value: 0.75 },
				// 				],
				// 			},
				// 			legendColor: { color: 'white', colorAdjustments: [] },
				// 			legendIndex: 0,
				// 			legendLabel: 'map_mode.population.country',
				// 		};
				// 	})
				// 	.sort((a, b) => b.value - a.value);
			},
		},
	},
	populationSpecies: {
		id: 'populationSpecies',
		name: 'map_mode.population.name_species',
		tooltipLabel: 'map_mode.population.tooltip_label',
		hasSpecies: true,
		country: [
			{
				label: null,
				showInLegend: 'never',
				matches: () => true,
				primaryColor: 'black',
			},
		],
		system: {
			getValues: () => {
				return [];
				// TODO
				// const planets = system.colonies
				// 	.map((planetId) => gameState.planets.planet[planetId])
				// 	.filter(Predicate.isNotNullable);
				// const population = planets.reduce(
				// 	(totalPopulation, planet) => totalPopulation + (planet.num_sapient_pops ?? 0),
				// 	0,
				// );
				// const { freePopulation, enslavedPopulation } = planets.reduce(
				// 	(acc, planet) => {
				// 		let freePlanetPopulation = 0;
				// 		let enslavedPlanetPopulation = 0;
				// 		for (const [speciesId, speciesPopulation] of Object.entries(
				// 			planet.species_information ?? {},
				// 		).map(parseNumberEntry)) {
				// 			if (
				// 				selectedSpecies?.id != null &&
				// 				(speciesId === selectedSpecies.id ||
				// 					gameState.species_db[speciesId]?.base_ref === selectedSpecies.id)
				// 			) {
				// 				freePlanetPopulation +=
				// 					(speciesPopulation.num_pops ?? 0) - (speciesPopulation.num_enslaved ?? 0);
				// 				enslavedPlanetPopulation += speciesPopulation.num_enslaved ?? 0;
				// 			}
				// 		}
				// 		acc.freePopulation += freePlanetPopulation;
				// 		acc.enslavedPopulation += enslavedPlanetPopulation;
				// 		return acc;
				// 	},
				// 	{ freePopulation: 0, enslavedPopulation: 0 },
				// );
				// return [
				// 	{
				// 		value: freePopulation,
				// 		color: { color: 'intense_blue', colorAdjustments: [] },
				// 		legendIndex: 0,
				// 		legendLabel: 'map_mode.population.free_species',
				// 		legendLabelData: { species: selectedSpecies?.name ?? { key: 'UNKNOWN' } },
				// 	},
				// 	{
				// 		value: enslavedPopulation,
				// 		color: { color: 'intense_red', colorAdjustments: [] },
				// 		legendIndex: 1,
				// 		legendLabel: 'map_mode.population.enslaved_species',
				// 		legendLabelData: { species: selectedSpecies?.name ?? { key: 'UNKNOWN' } },
				// 	},
				// 	{
				// 		value: population - freePopulation - enslavedPopulation,
				// 		color: { color: 'dark_grey', colorAdjustments: [] },
				// 		legendIndex: 2,
				// 		legendLabel: 'map_mode.population.other_species',
				// 	},
				// ];
			},
		},
	},
	fleetPowerAlliedAndHostile: {
		id: 'fleetPowerAlliedAndHostile',
		name: 'map_mode.fleet_power.name_allied_and_hostile',
		tooltipLabel: 'map_mode.fleet_power.tooltip_label',
		hasPov: true,
		country: [
			{
				label: null,
				showInLegend: 'never',
				matches: () => true,
				primaryColor: 'black',
			},
		],
		system: {
			getValues() {
				return [];
				// TODO
				// 	const fleetToCountry: Record<string, number> = {};
				// 	Object.values(gameState.country).forEach((country) => {
				// 		country.fleets_manager?.owned_fleets.forEach((owned_fleet) => {
				// 			fleetToCountry[owned_fleet.fleet] = country.id;
				// 		});
				// 	});

				// 	const mainStar =
				// 		system.planet[0] == null ? null : gameState.planets.planet[system.planet[0]];
				// 	const spaceControllerId = mainStar?.controller;

				// 	let ownMobileFleetPower = 0;
				// 	let ownStationFleetPower = 0;
				// 	let alliedMobileFleetPower = 0;
				// 	let alliedStationFleetPower = 0;
				// 	let hostileMobileFleetPower = 0;
				// 	let hostileStationFleetPower = 0;

				// 	const visibleFleets = new Set(povCountry?.sensor_range_fleets);
				// 	// TODO look into incorporating old sightings (country.intel)
				// 	for (const fleetId of system.fleet_presence.filter((id) => visibleFleets.has(id))) {
				// 		const fleet = gameState.fleet[fleetId];
				// 		const controllerId = fleet?.station ? spaceControllerId : fleetToCountry[fleetId];
				// 		const controller = controllerId == null ? null : gameState.country[controllerId];
				// 		if (!fleet || !controller) continue;
				// 		if (povCountry && controller.id === povCountry.id) {
				// 			if (fleet.station) {
				// 				ownStationFleetPower += fleet.military_power;
				// 			} else {
				// 				ownMobileFleetPower += fleet.military_power;
				// 			}
				// 		} else if (areCountriesFightingWarOnSameSide(gameState, povCountry?.id, controllerId)) {
				// 			if (fleet.station) {
				// 				alliedStationFleetPower += fleet.military_power;
				// 			} else {
				// 				alliedMobileFleetPower += fleet.military_power;
				// 			}
				// 		} else if (areCountriesHostile(gameState, povCountry?.id, controllerId)) {
				// 			if (fleet.station) {
				// 				hostileStationFleetPower += fleet.military_power;
				// 			} else {
				// 				hostileMobileFleetPower += fleet.military_power;
				// 			}
				// 		}
				// 	}
				// 	return [
				// 		{
				// 			value: ownMobileFleetPower,
				// 			color: { color: 'dark_teal', colorAdjustments: [{ type: 'LIGHTEN', value: 0.0 }] },
				// 			legendIndex: 0,
				// 			legendLabel: 'map_mode.fleet_power.own_fleet',
				// 		},
				// 		{
				// 			value: ownStationFleetPower,
				// 			color: { color: 'dark_teal', colorAdjustments: [{ type: 'DARKEN', value: 0.2 }] },
				// 			legendIndex: 1,
				// 			legendLabel: 'map_mode.fleet_power.own_station',
				// 		},
				// 		{
				// 			value: alliedMobileFleetPower,
				// 			color: { color: 'intense_blue', colorAdjustments: [{ type: 'LIGHTEN', value: 0.0 }] },
				// 			legendIndex: 2,
				// 			legendLabel: 'map_mode.fleet_power.allied_fleet',
				// 		},
				// 		{
				// 			value: alliedStationFleetPower,
				// 			color: { color: 'intense_blue', colorAdjustments: [{ type: 'DARKEN', value: 0.2 }] },
				// 			legendIndex: 3,
				// 			legendLabel: 'map_mode.fleet_power.allied_station',
				// 		},
				// 		{
				// 			value: hostileMobileFleetPower,
				// 			color: { color: 'intense_red', colorAdjustments: [{ type: 'LIGHTEN', value: 0.0 }] },
				// 			legendIndex: 4,
				// 			legendLabel: 'map_mode.fleet_power.hostile_fleet',
				// 		},
				// 		{
				// 			value: hostileStationFleetPower,
				// 			color: { color: 'intense_red', colorAdjustments: [{ type: 'DARKEN', value: 0.2 }] },
				// 			legendIndex: 5,
				// 			legendLabel: 'map_mode.fleet_power.hostile_station',
				// 		},
				// 	];
			},
		},
	},
	authority: {
		id: 'authority',
		name: 'map_mode.authority.name',
		tooltipLabel: 'map_mode.authority.tooltip_label',
		country: [
			{
				label: { key: 'auth_democratic' },
				primaryColor: 'teal',
				showInLegend: 'always',
				matches: () => false,
				// TODO
				// snapshot.country[country]?.government?.authority === 'auth_democratic',
			},
			{
				label: { key: 'auth_oligarchic' },
				primaryColor: 'yellow',
				showInLegend: 'always',
				matches: () => false,
				// TODO
				// snapshot.country[country]?.government?.authority === 'auth_oligarchic',
			},
			{
				label: { key: 'auth_dictatorial' },
				primaryColor: 'intense_orange',
				showInLegend: 'always',
				matches: () => false,
				// TODO
				// snapshot.country[country]?.government?.authority === 'auth_dictatorial',
			},
			{
				label: { key: 'auth_imperial' },
				primaryColor: 'red',
				showInLegend: 'always',
				matches: () => false,
				// TODO
				// snapshot.country[country]?.government?.authority === 'auth_imperial',
			},
			{
				label: { key: 'auth_corporate' },
				primaryColor: 'desert_yellow',
				showInLegend: 'always',
				matches: () => false,
				// TODO
				// snapshot.country[country]?.government?.authority === 'auth_corporate',
			},
			{
				label: { key: 'auth_hive_mind' },
				primaryColor: 'bright_yellow',
				showInLegend: 'always',
				matches: () => false,
				// TODO
				// snapshot.country[country]?.government?.authority === 'auth_hive_mind',
			},
			{
				label: { key: 'auth_machine_intelligence' },
				primaryColor: 'sky_blue',
				showInLegend: 'always',
				matches: () => false,
				// TODO
				// snapshot.country[country]?.government?.authority === 'auth_machine_intelligence',
			},
			{
				label: null,
				showInLegend: 'never',
				matches: () => true,
				primaryColor: 'black',
			},
		],
	},
	relations: {
		id: 'relations',
		name: 'map_mode.relations.name',
		tooltipLabel: 'map_mode.relations.tooltip_label',
		hasPov: true,
		country: [
			{
				label: 'map_mode.common.selected_country',
				primaryColor: 'white',
				showInLegend: 'always',
				matches: (_gameState, country, povCountry) => {
					return country === povCountry;
				},
			},
			// TODO
			// {
			// 	label: { key: 'OPINION_EXCELLENT' },
			// 	primaryColor: 'intense_blue',
			// 	showInLegend: 'always',
			// 	matches: (gameState, country, povCountry) => {
			// 		const relation = gameState.country[country]?.relations_manager.relation.find(
			// 			(r) => r.country === povCountry,
			// 		);
			// 		return relation != null && relation.relation_current >= 750;
			// 	},
			// },
			// {
			// 	label: { key: 'OPINION_GOOD' },
			// 	primaryColor: 'turquoise',
			// 	showInLegend: 'always',
			// 	matches: (gameState, country, povCountry) => {
			// 		const relation = gameState.country[country]?.relations_manager.relation.find(
			// 			(r) => r.country === povCountry,
			// 		);
			// 		return relation != null && relation.relation_current >= 300;
			// 	},
			// },
			// {
			// 	label: { key: 'OPINION_NEUTRAL' },
			// 	primaryColor: 'yellow',
			// 	showInLegend: 'always',
			// 	matches: (gameState, country, povCountry) => {
			// 		const relation = gameState.country[country]?.relations_manager.relation.find(
			// 			(r) => r.country === povCountry,
			// 		);
			// 		return relation != null && relation.relation_current >= -300;
			// 	},
			// },
			// {
			// 	label: { key: 'OPINION_POOR' },
			// 	primaryColor: 'intense_orange',
			// 	showInLegend: 'always',
			// 	matches: (gameState, country, povCountry) => {
			// 		const relation = gameState.country[country]?.relations_manager.relation.find(
			// 			(r) => r.country === povCountry,
			// 		);
			// 		return relation != null && relation.relation_current >= -750;
			// 	},
			// },
			// {
			// 	label: { key: 'OPINION_TERRIBLE' },
			// 	primaryColor: 'intense_red',
			// 	showInLegend: 'always',
			// 	matches: (gameState, country, povCountry) => {
			// 		const relation = gameState.country[country]?.relations_manager.relation.find(
			// 			(r) => r.country === povCountry,
			// 		);
			// 		return relation != null && relation.relation_current < -750;
			// 	},
			// },
			{
				label: null,
				showInLegend: 'never',
				matches: () => true,
				primaryColor: 'black',
			},
		],
	},
};

export interface MapModeCountryInfo {
	primaryColor: string;
	secondaryColor: string;
	mapModeCountryLabel?: LocalizedText | MessageID;
}

export const defaultCountryMapModeInfo: MapModeCountryInfo = {
	primaryColor: 'black',
	secondaryColor: 'black',
};

export function getCountryMapModeInfo(
	countryId: FactionId,
	snapshot: Snapshot,
	settings: Pick<
		MapSettings,
		| 'mapMode'
		| 'mapModePointOfView'
		| 'unionMode'
		| 'unionFederations'
		| 'unionHegemonies'
		| 'unionSubjects'
		| 'unionFederationsColor'
	>,
): MapModeCountryInfo {
	const povCountryId =
		settings.mapModePointOfView === 'player'
			? undefined // TODO gameState.player.filter((p) => gameState.country[p.country])[0]?.country
			: FactionId.make(settings.mapModePointOfView);
	const mapMode = mapModes[settings.mapMode];
	if (mapMode?.country) {
		const match = mapMode.country.find(({ matches }) => matches(snapshot, countryId, povCountryId));
		if (match) {
			return {
				primaryColor: match.primaryColor,
				secondaryColor: match.secondaryColor ?? match.primaryColor,
				mapModeCountryLabel:
					match.showInLegend === 'always' ? (match.label ?? undefined) : undefined,
			};
		} else {
			return defaultCountryMapModeInfo;
		}
	} else {
		const unionLeaderId =
			getUnionLeaderId(countryId, snapshot, settings, ['joinedBorders', 'separateBorders']) ??
			countryId;
		return snapshot.factions[unionLeaderId]?.flag ?? defaultCountryMapModeInfo;
	}
}

function areCountriesHostile(
	snapshot: Snapshot,
	id1: FactionId | null | undefined,
	id2: FactionId | null | undefined,
) {
	if (id1 == null || id2 == null) return false;
	return false;
	// const HOSTILE_COUNTRY_TYPES = ['awakened_marauders']; // it would be better to parse common/country_types
	// const faction1 = snapshot.factions[id1];
	// const faction2 = snapshot.factions[id2];
	// const relationTo2 = faction1?.relations_manager.relation.find((r) => r.country === id2);
	// const relationTo1 = faction2?.relations_manager.relation.find((r) => r.country === id1);
	// if (
	// 	Object.values(gameState.war).some(
	// 		(war) =>
	// 			(war.attackers.some((c) => c.country === id1) &&
	// 				war.defenders.some((c) => c.country === id2)) ||
	// 			(war.defenders.some((c) => c.country === id1) &&
	// 				war.attackers.some((c) => c.country === id2)),
	// 	)
	// )
	// 	return true;
	// if (faction1?.overlord === id2 || faction2?.overlord === id1) return false;
	// if (relationTo1?.truce != null || relationTo2?.truce != null) return false;
	// if (relationTo1?.hostile || relationTo2?.hostile) return true;
	// if (
	// 	faction1 &&
	// 	faction2 &&
	// 	(HOSTILE_COUNTRY_TYPES.includes(faction1.type) || HOSTILE_COUNTRY_TYPES.includes(faction2.type))
	// )
	// 	return true;
	// return false;
}

// function areCountriesFightingWarOnSameSide(
// 	_snapshot: Snapshot,
// 	_id1: FactionId | null | undefined,
// 	_id2: FactionId | null | undefined,
// ) {
// return Object.values(gameState.war).some(
// 	(war) =>
// 		(war.attackers.some((c) => c.country === id1) &&
// 			war.attackers.some((c) => c.country === id2)) ||
// 		(war.defenders.some((c) => c.country === id1) &&
// 			war.defenders.some((c) => c.country === id2)),
// );
// }
