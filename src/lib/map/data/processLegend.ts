import { type MessageID, t } from '../../../intl';
import type { GameState } from '../../GameState.svelte';
import type { ColorSetting, IconSetting, MapSettings } from '../../settings';
import { localizeText } from './locUtils';
import { mapModes, type MapModeSystemValue } from './mapModes';
import type processBorders from './processBorders';
import type processSystems from './processSystems';
import { getTextAspectRatio } from './utils';

interface LegendItem {
	symbol:
		| {
				type: 'icon';
				icon: string;
				color: ColorSetting;
				scale?: number;
		  }
		| {
				type: 'border';
				primaryColor: string;
				secondaryColor: string;
		  }
		| {
				type: 'pattern';
				pattern: string;
		  }
		| {
				type: 'hr';
		  };
	label: string;
}

interface LegendData {
	items: LegendItem[];
	maxLabelWidth: number;
}

export const processLegendDeps = [
	'mapMode',
	'mapModePointOfView',
	'legendFontSize',
	'occupation',
	'countryCapitalIcon',
	'sectorCapitalIcon',
	'populatedSystemIcon',
	'wormholeIcon',
	'gatewayIcon',
	'lGateIcon',
	'shroudTunnelIcon',
] satisfies (keyof MapSettings)[];

export default async function processLegend(
	gameState: GameState,
	settings: Pick<MapSettings, (typeof processLegendDeps)[number]>,
	borders: ReturnType<typeof processBorders>,
	systems: ReturnType<typeof processSystems>,
): Promise<LegendData> {
	const mapMode = mapModes[settings.mapMode];
	const countryMapModeLegendItems: LegendItem[] =
		mapMode?.country == null
			? []
			: await Promise.all(
					mapMode.country
						.filter((mapModeCountry) => mapModeCountry.showInLegend === 'always')
						.map(async (mapModeCountry) => ({
							label:
								typeof mapModeCountry.label === 'string'
									? t(mapModeCountry.label)
									: await localizeText(mapModeCountry.label ?? { key: 'UNKNOWN' }),
							symbol: {
								type: 'border',
								primaryColor: mapModeCountry.primaryColor,
								secondaryColor: mapModeCountry.secondaryColor ?? mapModeCountry.primaryColor,
							},
						})),
				);

	const systemMapModeLegendItems: LegendItem[] = await Promise.all(
		Object.values(
			systems.reduce<Record<string, MapModeSystemValue>>((acc, cur) => {
				for (const value of cur.mapModeValues ?? []) {
					acc[value.legendIndex] = value;
				}
				return acc;
			}, {}),
		)
			.sort((a, b) => a.legendIndex - b.legendIndex)
			.map<Promise<LegendItem>>(async (value) => {
				const values: Record<string, string> = {};
				for (const [k, v] of Object.entries(value.legendLabelData ?? {})) {
					values[k] = await localizeText(v);
				}
				return {
					label:
						typeof value.legendLabel === 'string'
							? t(value.legendLabel, values)
							: await localizeText(value.legendLabel),
					symbol: {
						type: 'icon',
						icon: 'icon-circle',
						color: value.legendColor ?? value.color,
					},
				};
			}),
	);

	const occupationLegendItems: LegendItem[] = settings.occupation
		? [
				{
					label: t('legend.fully_occupied'),
					symbol: {
						type: 'pattern',
						pattern: 'pattern-full-occupier',
					},
				},
				{
					label: t('legend.partially_occupied'),
					symbol: {
						type: 'pattern',
						pattern: 'pattern-partial-occupier',
					},
				},
			]
		: [];

	const systemIconSettings: [MessageID, IconSetting][] = [
		['setting.countryCapitalIcon', settings.countryCapitalIcon],
		['setting.sectorCapitalIcon', settings.sectorCapitalIcon],
		['setting.populatedSystemIcon', settings.populatedSystemIcon],
		['setting.wormholeIcon', settings.wormholeIcon],
		['setting.gatewayIcon', settings.gatewayIcon],
		['setting.lGateIcon', settings.lGateIcon],
		['setting.shroudTunnelIcon', settings.shroudTunnelIcon],
	];
	const largestIconSize = Math.max(
		...systemIconSettings
			.filter(([_messageId, setting]) => setting.enabled)
			.map(([_messageId, setting]) => setting.size),
	);
	const systemIconItems: LegendItem[] = systemIconSettings
		.filter(([_messageId, setting]) => setting.enabled)
		.map(([messageId, setting]) => ({
			label: t(messageId),
			symbol: {
				type: 'icon',
				icon: setting.icon,
				color: setting.color,
				scale: setting.size / largestIconSize,
			},
		}));

	const items = insertHrBetweenGroups([
		countryMapModeLegendItems,
		systemMapModeLegendItems,
		occupationLegendItems,
		systemIconItems,
	]);
	return {
		items,
		maxLabelWidth: Math.max(
			...items.map((item) => settings.legendFontSize / getTextAspectRatio(item.label, 'system-ui')),
		),
	};
}

function insertHrBetweenGroups(groups: LegendItem[][]): LegendItem[] {
	return groups
		.filter((group) => group.length)
		.map<LegendItem[]>((group, i) =>
			i === 0 ? group : [{ label: '', symbol: { type: 'hr' } }, ...group],
		)
		.flat();
}
