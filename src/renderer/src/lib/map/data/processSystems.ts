import type { GameState } from '../../GameState';
import type { MapSettings } from '../../settings';
import { isDefined } from '../../utils';
import {
	defaultCountryMapModeInfo,
	getCountryMapModeInfo,
	type MapModeCountryInfo,
	mapModes,
	type MapModeSystemValue,
} from './mapModes';
import type processSystemOwnership from './processSystemOwnership';

export interface ProcessedSystem extends MapModeCountryInfo {
	id: number;
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
	gameState: GameState,
	settings: Pick<MapSettings, (typeof processSystemsDeps)[number]>,
	systemIdToCountry: ReturnType<typeof processSystemOwnership>['systemIdToCountry'],
	knownCountries: Set<number>,
	knownSystems: Set<number>,
	getSystemCoordinates: (id: number, options?: { invertX?: boolean }) => [number, number],
	systemNames: Record<number, string>,
) {
	const playerCountryId = gameState.player.filter((p) => gameState.country[p.country])[0]?.country;
	const povCountryId =
		settings.mapModePointOfView === 'player'
			? playerCountryId
			: parseInt(settings.mapModePointOfView);
	const povCountry = povCountryId == null ? null : gameState.country[povCountryId];
	const selectedSpeciesId =
		settings.mapModeSpecies === 'player'
			? playerCountryId == null
				? null
				: gameState.country[playerCountryId]?.founder_species_ref
			: parseInt(settings.mapModeSpecies);
	const selectedSpecies =
		selectedSpeciesId == null ? null : gameState.species_db[selectedSpeciesId];

	const systems = Object.values(gameState.galactic_object).map<ProcessedSystem>((system) => {
		const countryId = systemIdToCountry[system.id];
		const country = countryId != null ? gameState.country[countryId] : null;
		const mapModeInfo =
			countryId != null
				? getCountryMapModeInfo(countryId, gameState, settings)
				: defaultCountryMapModeInfo;

		const isOwned = country != null;
		const isColonized = isOwned && Boolean(system.colonies.length);
		const isSectorCapital = Object.values(gameState.sectors).some((sector) =>
			system.colonies.includes(sector.local_capital as number),
		);
		const isCountryCapital = system.colonies.includes(country?.capital as number);
		const [x, y] = getSystemCoordinates(system.id, { invertX: true });

		const ownerIsKnown = countryId != null && knownCountries.has(countryId);
		const systemIsKnown = knownSystems.has(system.id);

		const bypassTypes = new Set(
			system.bypasses.map((bypassId) => gameState.bypasses[bypassId]?.type).filter(isDefined),
		);
		const hasWormhole =
			bypassTypes.has('wormhole') ||
			bypassTypes.has('strange_wormhole') ||
			bypassTypes.has('starlit_wormhole');
		const hasGateway = bypassTypes.has('gateway');
		const hasLGate = bypassTypes.has('lgate');
		const hasShroudTunnel = bypassTypes.has('shroud_tunnel');

		const mapModeValues = mapModes[settings.mapMode]?.system?.getValues(
			gameState,
			system,
			povCountry ?? null,
			selectedSpecies ?? null,
			country ?? null,
		);
		const mapModeTotalValue = mapModeValues?.reduce((acc, cur) => acc + cur.value, 0);

		return {
			id: system.id,
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
			name: systemNames[system.id] ?? 'Unknown',
			mapModeValues,
			mapModeTotalValue,
		};
	});
	return systems;
}
