import { defaultMapSettings } from './mapSettings';
import { type SavedMapSettings } from './SavedMapSettings';

export const presetMapSettings: SavedMapSettings[] = [
	{
		name: 'Default',
		settings: defaultMapSettings,
	},
	{
		name: 'Unions',
		settings: {
			...defaultMapSettings,
			unionMode: true,
		},
	},
	{
		name: 'Tight',
		settings: {
			...defaultMapSettings,
			voronoiGridSize: 10,
			claimVoidBorderThreshold: 0.6,
			claimVoidMaxSize: 200,
		},
	},
	{
		name: 'Circular',
		settings: {
			...defaultMapSettings,
			galaxyBorderStyle: 'circular',
		},
	},
	{
		name: 'Light Borders',
		settings: {
			...defaultMapSettings,
			borderColor: {
				color: 'secondary',
				colorAdjustments: [{ type: 'MIN_LIGHTNESS', value: 0.75 }],
			},
			borderFillColor: {
				color: 'secondary',
				colorAdjustments: [
					{
						type: 'MIN_LIGHTNESS',
						value: 0.5,
					},
					{
						type: 'OPACITY',
						value: 0.15,
					},
				],
			},
			borderFillFade: 0.25,
			backgroundColor: {
				color: 'true_black',
				colorAdjustments: [],
			},
			borderStroke: {
				...defaultMapSettings.borderStroke,
				width: 1,
				glow: true,
			},
			sectorBorderStroke: {
				...defaultMapSettings.sectorBorderStroke,
				glow: true,
			},
			unionBorderStroke: {
				...defaultMapSettings.unionBorderStroke,
				glow: true,
			},
			countryNames: false,
		},
	},
	{
		name: 'Starry Gold',
		settings: {
			...defaultMapSettings,
			countryNames: false,
			borderColor: {
				color: 'primary',
				colorAdjustments: [{ type: 'MIN_LIGHTNESS', value: 0.6 }],
			},
			borderFillColor: {
				color: 'border',
				colorAdjustments: [{ type: 'OPACITY', value: 0 }],
			},
			backgroundColor: {
				color: 'true_black',
				colorAdjustments: [],
			},
			borderFillFade: 0.15,
			starScapeCore: true,
			starScapeDust: true,
			starScapeNebula: true,
			starScapeStars: true,
		},
	},
	{
		name: 'Starry Blue',
		settings: {
			...defaultMapSettings,
			countryNames: false,
			borderColor: {
				color: 'primary',
				colorAdjustments: [{ type: 'MIN_LIGHTNESS', value: 0.6 }],
			},
			borderFillColor: {
				color: 'border',
				colorAdjustments: [{ type: 'OPACITY', value: 0 }],
			},
			backgroundColor: {
				color: 'true_black',
				colorAdjustments: [],
			},
			borderFillFade: 0.15,
			starScapeDust: true,
			starScapeDustColor: {
				color: 'blue',
				colorAdjustments: [{ type: 'OPACITY', value: 0.75 }],
			},
			starScapeNebula: true,
			starScapeNebulaColor: {
				color: 'red_orange',
				colorAdjustments: [{ type: 'OPACITY', value: 1 }],
			},
			starScapeNebulaAccentColor: {
				color: 'intense_red',
				colorAdjustments: [{ type: 'OPACITY', value: 1 }],
			},
			starScapeCore: true,
			starScapeCoreColor: {
				color: 'wave_blue',
				colorAdjustments: [
					{ type: 'OPACITY', value: 1 },
					{ type: 'LIGHTEN', value: 0.2 },
				],
			},
			starScapeCoreAccentColor: {
				color: 'white',
				colorAdjustments: [{ type: 'OPACITY', value: 1 }],
			},
			starScapeStars: true,
			starScapeStarsColor: {
				color: 'mist_blue',
				colorAdjustments: [
					{ type: 'OPACITY', value: 0.75 },
					{ type: 'LIGHTEN', value: 1 },
				],
			},
		},
	},
	{
		name: 'Relay Metro Map',
		settings: {
			...defaultMapSettings,
			alignStarsToGrid: true,
			hyperlaneMetroStyle: true,
			hyperlaneStroke: {
				...defaultMapSettings.hyperlaneStroke,
				width: 0.5,
				dashed: true,
				dashArray: '0.5 1',
			},
			hyperRelayStroke: {
				...defaultMapSettings.hyperRelayStroke,
				width: 4,
			},
			hyperRelayColor: {
				color: 'secondary',
				colorAdjustments: [{ type: 'MIN_LIGHTNESS', value: 0.85 }],
			},
			borderColor: { color: 'very_black', colorAdjustments: [] },
			borderFillColor: {
				color: 'secondary',
				colorAdjustments: [
					{ type: 'MIN_LIGHTNESS', value: 0.15 },
					{ type: 'OPACITY', value: 0.25 },
				],
			},
			backgroundColor: { color: 'very_black', colorAdjustments: [] },
			borderStroke: {
				...defaultMapSettings.borderStroke,
				smoothing: false,
			},
			sectorBorderStroke: {
				...defaultMapSettings.sectorBorderStroke,
				width: 1,
				smoothing: false,
				dashed: false,
			},
			sectorBorderColor: { color: 'border', colorAdjustments: [] },
			countryNames: false,
			countryEmblems: false,
			populatedSystemIcon: {
				...defaultMapSettings.populatedSystemIcon,
				icon: 'icon-circle',
				size: 2.5,
				position: 'center',
				color: {
					color: 'secondary',
					colorAdjustments: [
						{ type: 'MIN_LIGHTNESS', value: 0.4 },
						{ type: 'MAX_LIGHTNESS', value: 0.4 },
					],
				},
			},
			sectorCapitalIcon: {
				...defaultMapSettings.sectorCapitalIcon,
				icon: 'icon-circle',
				size: 4,
				position: 'center',
				color: {
					color: 'secondary',
					colorAdjustments: [
						{ type: 'MIN_LIGHTNESS', value: 0.4 },
						{ type: 'MAX_LIGHTNESS', value: 0.4 },
					],
				},
			},
			countryCapitalIcon: {
				...defaultMapSettings.countryCapitalIcon,
				enabled: false,
			},
			unpopulatedSystemIcon: {
				...defaultMapSettings.unpopulatedSystemIcon,
				size: 0.5,
			},
			voronoiGridSize: 25,
		},
	},
];
