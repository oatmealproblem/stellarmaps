import { z } from 'zod';

import { PersistedRawState } from '$lib/stateUtils.svelte';

import { type ColorSetting, zColorSetting } from './ColorSetting';
import { type IconSetting, zIconSetting } from './IconSetting';
import { type StrokeSetting, zStrokeSetting } from './StrokeSetting';
import { settingsAreDifferent } from './utils';

export type NumberMapSettings =
	| 'borderFillFade'
	| 'claimVoidBorderThreshold'
	| 'legendFontSize'
	| 'systemMapLabelFleetsFontSize'
	| 'systemMapLabelPlanetsFontSize'
	| 'systemMapOrbitDistanceExponent'
	| 'systemNamesFontSize'
	| 'terraIncognitaBrightness'
	| 'unionLeaderSymbolSize'
	| 'voronoiGridSize';

export type NumberOptionalMapSettings =
	| 'borderGap'
	| 'countryEmblemsMaxSize'
	| 'countryEmblemsMinSize'
	| 'countryNamesMaxSize'
	| 'countryNamesMinSize'
	| 'countryNamesSecondaryRelativeSize'
	| 'claimVoidMaxSize'
	| 'frontierBubbleThreshold'
	| 'starScapeStarsCount'
	| 'systemMapMoonScale'
	| 'systemMapPlanetScale'
	| 'systemMapStarScale';

export type StringMapSettings =
	| 'countryNamesFont'
	| 'countryNamesType'
	| 'labelsAvoidHoles'
	| 'mapMode'
	| 'mapModePointOfView'
	| 'mapModeSpecies'
	| 'systemMapLabelPlanetsFont'
	| 'systemMapLabelPlanetsPosition'
	| 'systemMapLabelPlanetsFallbackPosition'
	| 'systemMapLabelFleetsPosition'
	| 'systemNames'
	| 'systemNamesFont'
	| 'terraIncognitaPerspectiveCountry'
	| 'terraIncognitaStyle'
	| 'unionFederations'
	| 'unionFederationsColor'
	| 'unionHegemonies'
	| 'unionLeaderSymbol'
	| 'unionSubjects';

export type BooleanMapSettings =
	| 'alignStarsToGrid'
	| 'circularGalaxyBorders'
	| 'countryEmblems'
	| 'countryNames'
	| 'hyperlaneMetroStyle'
	| 'hyperlaneSensitiveBorders'
	| 'legend'
	| 'occupation'
	| 'sectorTypeBorderStyles'
	| 'starScapeCore'
	| 'starScapeDust'
	| 'starScapeNebula'
	| 'starScapeStars'
	| 'systemMapHyperlanesEnabled'
	| 'systemMapLabelAsteroidsEnabled'
	| 'systemMapLabelColoniesEnabled'
	| 'systemMapLabelFleetsEnabled'
	| 'systemMapLabelMoonsEnabled'
	| 'systemMapLabelPlanetsEnabled'
	| 'systemMapLabelStarsEnabled'
	| 'systemMapPlanetShadowSelf'
	| 'systemMapPlanetShadowPlanetarySystem'
	| 'systemMapPlanetShadowRings'
	| 'systemMapPlanetShadowOverlap'
	| 'terraIncognita'
	| 'unionLeaderUnderline'
	| 'unionMode';

export type ColorMapSettings =
	| 'backgroundColor'
	| 'borderColor'
	| 'borderFillColor'
	| 'hyperlaneColor'
	| 'hyperRelayColor'
	| 'legendBackgroundColor'
	| 'legendBorderColor'
	| 'lGateStrokeColor'
	| 'occupationColor'
	| 'systemMapOrbitColor'
	| 'sectorBorderColor'
	| 'sectorCoreBorderColor'
	| 'sectorFrontierBorderColor'
	| 'shroudTunnelStrokeColor'
	| 'starScapeCoreAccentColor'
	| 'starScapeCoreColor'
	| 'starScapeDustColor'
	| 'starScapeNebulaAccentColor'
	| 'starScapeNebulaColor'
	| 'starScapeStarsColor'
	| 'systemMapPlanetRingColor'
	| 'unionBorderColor'
	| 'unownedHyperlaneColor'
	| 'unownedHyperRelayColor'
	| 'wormholeStrokeColor';

export type StrokeMapSettings =
	| 'borderStroke'
	| 'hyperlaneStroke'
	| 'hyperRelayStroke'
	| 'legendBorderStroke'
	| 'lGateStroke'
	| 'systemMapOrbitStroke'
	| 'sectorBorderStroke'
	| 'sectorCoreBorderStroke'
	| 'sectorFrontierBorderStroke'
	| 'shroudTunnelStroke'
	| 'unionBorderStroke'
	| 'wormholeStroke';

export type IconMapSettings =
	| 'countryCapitalIcon'
	| 'gatewayIcon'
	| 'lGateIcon'
	| 'populatedSystemIcon'
	| 'sectorCapitalIcon'
	| 'shroudTunnelIcon'
	| 'systemMapCivilianFleetIcon'
	| 'systemMapCivilianStationIcon'
	| 'systemMapMilitaryFleetIcon'
	| 'systemMapMilitaryStationIcon'
	| 'unpopulatedSystemIcon'
	| 'wormholeIcon';

export type MapSettings = Record<NumberMapSettings, number> &
	Record<NumberOptionalMapSettings, number | null> &
	Record<StringMapSettings, string> &
	Record<BooleanMapSettings, boolean> &
	Record<ColorMapSettings, ColorSetting> &
	Record<StrokeMapSettings, StrokeSetting> &
	Record<IconMapSettings, IconSetting>;

export const zMapSettings: z.Schema<MapSettings, z.ZodTypeDef, unknown> = z.object({
	mapMode: z.string().catch('default'),
	mapModePointOfView: z.string().catch('player'),
	mapModeSpecies: z.string().catch('player'),
	backgroundColor: zColorSetting.catch({ color: 'very_black', colorAdjustments: [] }),
	borderFillColor: zColorSetting.catch({
		color: 'secondary',
		colorAdjustments: [{ type: 'OPACITY', value: 0.5 }],
	}),
	borderFillFade: z.number().catch(0),
	borderColor: zColorSetting.catch({ color: 'primary', colorAdjustments: [] }),
	borderStroke: zStrokeSetting.catch({
		enabled: true,
		width: 2,
		smoothing: true,
		glow: false,
		dashed: false,
		dashArray: '3 3',
	}),
	hyperlaneStroke: zStrokeSetting.catch({
		enabled: true,
		width: 0.5,
		smoothing: false,
		glow: false,
		dashed: false,
		dashArray: '3 3',
	}),
	hyperlaneColor: zColorSetting.catch({
		color: 'white',
		colorAdjustments: [{ type: 'OPACITY', value: 0.15 }],
	}),
	unownedHyperlaneColor: zColorSetting.catch({
		color: 'white',
		colorAdjustments: [{ type: 'OPACITY', value: 0.15 }],
	}),
	hyperRelayStroke: zStrokeSetting.catch({
		enabled: true,
		width: 0.5,
		smoothing: false,
		glow: false,
		dashed: false,
		dashArray: '3 3',
	}),
	hyperRelayColor: zColorSetting.catch({
		color: 'white',
		colorAdjustments: [{ type: 'OPACITY', value: 0.15 }],
	}),
	unownedHyperRelayColor: zColorSetting.catch({
		color: 'white',
		colorAdjustments: [{ type: 'OPACITY', value: 0.15 }],
	}),
	countryNames: z.boolean().catch(true),
	countryNamesType: z.string().catch('countryOnly'),
	countryNamesMinSize: z.number().nullable().catch(5),
	countryNamesMaxSize: z.number().nullable().catch(null),
	countryNamesSecondaryRelativeSize: z.number().catch(0.75),
	countryNamesFont: z.string().catch('Orbitron'),
	countryEmblems: z.boolean().catch(true),
	countryEmblemsMinSize: z.number().nullable().catch(null),
	countryEmblemsMaxSize: z.number().nullable().catch(75),
	labelsAvoidHoles: z.string().catch('owned'),
	systemNames: z.string().catch('none'),
	systemNamesFont: z.string().catch('Orbitron'),
	systemNamesFontSize: z.number().catch(3),
	sectorBorderStroke: zStrokeSetting.catch({
		enabled: true,
		width: 1,
		smoothing: true,
		glow: false,
		dashed: true,
		dashArray: '3 3',
	}),
	sectorBorderColor: zColorSetting.catch({
		color: 'border',
		colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.25 }],
	}),
	frontierBubbleThreshold: z.number().nullable().catch(null),
	sectorTypeBorderStyles: z.boolean().catch(false),
	sectorCoreBorderStroke: zStrokeSetting.catch({
		enabled: true,
		width: 1,
		smoothing: true,
		glow: false,
		dashed: false,
		dashArray: '3 3',
	}),
	sectorCoreBorderColor: zColorSetting.catch({
		color: 'border',
		colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.25 }],
	}),
	sectorFrontierBorderStroke: zStrokeSetting.catch({
		enabled: true,
		width: 1,
		smoothing: true,
		glow: false,
		dashed: true,
		dashArray: '1 3',
	}),
	sectorFrontierBorderColor: zColorSetting.catch({
		color: 'border',
		colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.25 }],
	}),
	countryCapitalIcon: zIconSetting.catch({
		enabled: true,
		icon: 'icon-diamond',
		size: 8,
		position: 'center',
		priority: 40,
		color: {
			color: 'border',
			colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.5 }],
		},
	}),
	sectorCapitalIcon: zIconSetting.catch({
		enabled: true,
		icon: 'icon-triangle',
		size: 6,
		position: 'center',
		priority: 30,
		color: {
			color: 'border',
			colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.5 }],
		},
	}),
	populatedSystemIcon: zIconSetting.catch({
		enabled: true,
		icon: 'icon-square',
		size: 2,
		position: 'center',
		priority: 20,
		color: {
			color: 'border',
			colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.5 }],
		},
	}),
	unpopulatedSystemIcon: zIconSetting.catch({
		enabled: true,
		icon: 'icon-circle',
		size: 1,
		position: 'center',
		priority: 10,
		color: { color: 'white', colorAdjustments: [] },
	}),
	wormholeIcon: zIconSetting.catch({
		enabled: false,
		icon: 'icon-wormhole',
		size: 8,
		position: 'right',
		priority: 40,
		color: { color: 'white', colorAdjustments: [] },
	}),
	gatewayIcon: zIconSetting.catch({
		enabled: false,
		icon: 'icon-gateway',
		size: 8,
		position: 'right',
		priority: 30,
		color: { color: 'white', colorAdjustments: [] },
	}),
	lGateIcon: zIconSetting.catch({
		enabled: false,
		icon: 'icon-l-gate',
		size: 8,
		position: 'right',
		priority: 20,
		color: { color: 'white', colorAdjustments: [] },
	}),
	shroudTunnelIcon: zIconSetting.catch({
		enabled: false,
		icon: 'icon-shroud-tunnel',
		size: 8,
		position: 'right',
		priority: 10,
		color: { color: 'white', colorAdjustments: [] },
	}),
	unionMode: z.boolean().catch(false),
	unionHegemonies: z.string().catch('joinedBorders'),
	unionFederations: z.string().catch(')joinedBorders'),
	unionFederationsColor: z.string().catch('founder'),
	unionSubjects: z.string().catch('joinedBorders'),
	unionLeaderSymbol: z.string().catch('✶'),
	unionLeaderSymbolSize: z.number().catch(0.3),
	unionLeaderUnderline: z.boolean().catch(true),
	unionBorderStroke: zStrokeSetting.catch({
		enabled: true,
		width: 2,
		smoothing: true,
		glow: false,
		dashed: false,
		dashArray: '3 3',
	}),
	unionBorderColor: zColorSetting.catch({
		color: 'border',
		colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.25 }],
	}),
	terraIncognita: z.boolean().catch(true),
	terraIncognitaPerspectiveCountry: z.string().catch('player'),
	terraIncognitaStyle: z.string().catch('striped'),
	terraIncognitaBrightness: z.number().catch(50),
	circularGalaxyBorders: z.boolean().catch(false),
	alignStarsToGrid: z.boolean().catch(false),
	hyperlaneMetroStyle: z.boolean().catch(false),
	wormholeStroke: zStrokeSetting.catch({
		enabled: false,
		width: 1,
		smoothing: false,
		glow: false,
		dashed: false,
		dashArray: '3 3',
	}),
	wormholeStrokeColor: zColorSetting.catch({
		color: 'intense_purple',
		colorAdjustments: [],
	}),
	lGateStroke: zStrokeSetting.catch({
		enabled: false,
		width: 1,
		smoothing: false,
		glow: false,
		dashed: false,
		dashArray: '3 3',
	}),
	lGateStrokeColor: zColorSetting.catch({
		color: 'intense_purple',
		colorAdjustments: [],
	}),
	shroudTunnelStroke: zStrokeSetting.catch({
		enabled: false,
		width: 1,
		smoothing: false,
		glow: false,
		dashed: false,
		dashArray: '3 3',
	}),
	shroudTunnelStrokeColor: zColorSetting.catch({
		color: 'intense_purple',
		colorAdjustments: [],
	}),
	voronoiGridSize: z.number().catch(30),
	borderGap: z.number().catch(2),
	hyperlaneSensitiveBorders: z.boolean().catch(true),
	claimVoidBorderThreshold: z.number().catch(0.6),
	claimVoidMaxSize: z.number().catch(1000),
	starScapeDust: z.boolean().catch(false),
	starScapeDustColor: zColorSetting.catch({
		color: 'ochre_brown',
		colorAdjustments: [{ type: 'OPACITY', value: 0.5 }],
	}),
	starScapeNebula: z.boolean().catch(false),
	starScapeNebulaColor: zColorSetting.catch({
		color: 'bright_purple',
		colorAdjustments: [{ type: 'OPACITY', value: 1 }],
	}),
	starScapeNebulaAccentColor: zColorSetting.catch({
		color: 'intense_purple',
		colorAdjustments: [{ type: 'OPACITY', value: 1 }],
	}),
	starScapeCore: z.boolean().catch(false),
	starScapeCoreColor: zColorSetting.catch({
		color: 'ochre_brown',
		colorAdjustments: [
			{ type: 'OPACITY', value: 1 },
			{ type: 'LIGHTEN', value: 1 },
		],
	}),
	starScapeCoreAccentColor: zColorSetting.catch({
		color: 'off_white',
		colorAdjustments: [{ type: 'OPACITY', value: 1 }],
	}),
	starScapeStars: z.boolean().catch(false),
	starScapeStarsColor: zColorSetting.catch({
		color: 'desert_yellow',
		colorAdjustments: [
			{ type: 'OPACITY', value: 0.75 },
			{ type: 'LIGHTEN', value: 1 },
		],
	}),
	starScapeStarsCount: z.number().catch(5000),
	legend: z.boolean().catch(true),
	legendFontSize: z.number().catch(16),
	legendBorderStroke: zStrokeSetting.catch({
		width: 1,
		dashed: false,
		smoothing: false,
		glow: false,
		enabled: true,
		dashArray: '3 3',
	}),
	legendBorderColor: zColorSetting.catch({
		color: 'grey',
		colorAdjustments: [],
	}),
	legendBackgroundColor: zColorSetting.catch({
		color: 'black',
		colorAdjustments: [{ type: 'OPACITY', value: 0.75 }],
	}),
	occupation: z.boolean().catch(false),
	occupationColor: zColorSetting.catch({
		color: 'border',
		colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.25 }],
	}),
	systemMapOrbitColor: zColorSetting.catch({ color: 'dark_grey', colorAdjustments: [] }),
	systemMapOrbitStroke: zStrokeSetting.catch({
		dashArray: '3 3',
		dashed: false,
		enabled: true,
		glow: false,
		smoothing: false,
		width: 0.5,
	}),
	systemMapStarScale: z.number().catch(2),
	systemMapPlanetScale: z.number().catch(1),
	systemMapMoonScale: z.number().catch(0.5),
	systemMapLabelPlanetsFont: z.string().catch('Orbitron'),
	systemMapLabelPlanetsFontSize: z.number().catch(10),
	systemMapLabelPlanetsPosition: z.string().catch('right'),
	systemMapLabelPlanetsFallbackPosition: z.string().catch('bottom'),
	systemMapLabelColoniesEnabled: z.boolean().catch(true),
	systemMapLabelStarsEnabled: z.boolean().catch(true),
	systemMapLabelPlanetsEnabled: z.boolean().catch(false),
	systemMapLabelMoonsEnabled: z.boolean().catch(false),
	systemMapLabelAsteroidsEnabled: z.boolean().catch(false),
	systemMapHyperlanesEnabled: z.boolean().catch(true),
	systemMapCivilianFleetIcon: zIconSetting.catch({
		enabled: false,
		icon: 'icon-triangle-narrow',
		size: 2,
		position: 'center',
		priority: 0,
		color: { color: 'border', colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.25 }] },
	}),
	systemMapCivilianStationIcon: zIconSetting.catch({
		enabled: false,
		icon: 'icon-diamond',
		size: 2,
		position: 'center',
		priority: 0,
		color: { color: 'border', colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.25 }] },
	}),
	systemMapMilitaryFleetIcon: zIconSetting.catch({
		enabled: false,
		icon: 'icon-triangle-narrow',
		size: 5,
		position: 'center',
		priority: 0,
		color: { color: 'border', colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.25 }] },
	}),
	systemMapMilitaryStationIcon: zIconSetting.catch({
		enabled: false,
		icon: 'icon-diamond',
		size: 5,
		position: 'center',
		priority: 0,
		color: { color: 'border', colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.25 }] },
	}),
	systemMapLabelFleetsEnabled: z.boolean().catch(true),
	systemMapLabelFleetsFontSize: z.number().catch(3),
	systemMapLabelFleetsPosition: z.string().catch('right'),
	systemMapPlanetRingColor: zColorSetting.catch({
		color: 'planet',
		colorAdjustments: [{ type: 'OPACITY', value: 0.75 }],
	}),
	systemMapOrbitDistanceExponent: z.number().catch(1),
	systemMapPlanetShadowSelf: z.boolean().catch(true),
	systemMapPlanetShadowPlanetarySystem: z.boolean().catch(true),
	systemMapPlanetShadowRings: z.boolean().catch(true),
	systemMapPlanetShadowOverlap: z.boolean().catch(false),
});

export const defaultMapSettings = zMapSettings.parse({});

export const mapSettings = new PersistedRawState({
	name: 'mapSettings',
	defaultValue: defaultMapSettings,
	schema: zMapSettings,
});
export const editedMapSettings = new PersistedRawState({
	name: 'editedMapSettings',
	defaultValue: mapSettings.current,
	schema: zMapSettings,
});
export const lastProcessedMapSettings = new PersistedRawState({
	name: 'lastProcessedMapSettings',
	defaultValue: mapSettings.current,
	schema: zMapSettings,
});

export const applyMapSettings = () => {
	mapSettings.current = editedMapSettings.current;
	if (
		settingsAreDifferent(mapSettings.current, lastProcessedMapSettings.current, {
			requiresReprocessingOnly: true,
		})
	) {
		lastProcessedMapSettings.current = mapSettings.current;
	}
};
