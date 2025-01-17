<script lang="ts">
	import * as d3Shape from 'd3-shape';
	import type { PickByValue } from 'utility-types';

	import {
		type IconMapSettings,
		type MapSettings,
		mapSettings,
		mapSettingsConfig,
		type SettingConfigIcon,
	} from '../settings';
	import { mapModes } from './data/mapModes';
	import type { MapData } from './data/processMapData';
	import type { ProcessedSystem } from './data/processSystems';
	import { getFillColorAttributes } from './mapUtils';

	interface Props {
		data: MapData;
		colors: Record<string, string>;
	}

	let { data, colors }: Props = $props();

	interface IconSettingMetadata {
		systemProperty?: keyof PickByValue<ProcessedSystem, boolean>;
		mustKnowOwner?: boolean;
	}
	const metadata: Partial<Record<IconMapSettings, IconSettingMetadata>> = {
		countryCapitalIcon: { systemProperty: 'isCountryCapital', mustKnowOwner: true },
		sectorCapitalIcon: { systemProperty: 'isSectorCapital', mustKnowOwner: true },
		populatedSystemIcon: { systemProperty: 'isColonized', mustKnowOwner: true },
		unpopulatedSystemIcon: {},
		wormholeIcon: { systemProperty: 'hasWormhole', mustKnowOwner: false },
		gatewayIcon: { systemProperty: 'hasGateway', mustKnowOwner: false },
		lGateIcon: { systemProperty: 'hasLGate', mustKnowOwner: false },
		shroudTunnelIcon: { systemProperty: 'hasShroudTunnel', mustKnowOwner: false },
	};

	function getSystemIcons(system: MapData['systems'][number], mapSettings: MapSettings) {
		const iconSettingConfigs = mapSettingsConfig
			.flatMap((category) => category.settings)
			.filter(
				(config): config is SettingConfigIcon<MapSettings, IconMapSettings> =>
					config.type === 'icon',
			)
			.filter((config) => mapSettings[config.id].enabled)
			.filter((config) => {
				const meta = metadata[config.id];
				if (!meta) return false;
				const systemProperty = meta.systemProperty;
				if (systemProperty != null && !system[systemProperty]) return false;
				if (meta.mustKnowOwner && mapSettings.terraIncognita && !system.ownerIsKnown) return false;
				return true;
			})
			.sort((a, b) => mapSettings[b.id].priority - mapSettings[a.id].priority);
		const centerConfig = iconSettingConfigs.find(
			(config) => mapSettings[config.id].position === 'center',
		);
		const center =
			centerConfig == null ? null : { ...mapSettings[centerConfig.id], x: system.x, y: system.y };
		const startingOffset = (center?.size ?? 0) / 2;
		let offset = startingOffset;
		const left = iconSettingConfigs
			.filter((config) => mapSettings[config.id].position === 'left')
			.map((config) => {
				const icon = {
					...mapSettings[config.id],
					x: system.x - offset - mapSettings[config.id].size / 2,
					y: system.y,
				};
				offset += mapSettings[config.id].size;
				return icon;
			});
		offset = startingOffset;
		const right = iconSettingConfigs
			.filter((config) => mapSettings[config.id].position === 'right')
			.map((config) => {
				const icon = {
					...mapSettings[config.id],
					x: system.x + offset + mapSettings[config.id].size / 2,
					y: system.y,
				};
				offset += mapSettings[config.id].size;
				return icon;
			});
		offset = startingOffset;
		const top = iconSettingConfigs
			.filter((config) => mapSettings[config.id].position === 'top')
			.map((config) => {
				const icon = {
					...mapSettings[config.id],
					y: system.y - offset - mapSettings[config.id].size / 2,
					x: system.x,
				};
				offset += mapSettings[config.id].size;
				return icon;
			});
		offset = startingOffset;
		const bottom = iconSettingConfigs
			.filter((config) => mapSettings[config.id].position === 'bottom')
			.map((config) => {
				const icon = {
					...mapSettings[config.id],
					y: system.y + offset + mapSettings[config.id].size / 2,
					x: system.x,
				};
				offset += mapSettings[config.id].size;
				return icon;
			});
		return { center, left, right, top, bottom, system };
	}

	function getIconsBottom(systemIcons: ReturnType<typeof getSystemIcons>): number {
		return Math.max(
			systemIcons.center
				? systemIcons.center.y + systemIcons.center.size / 2
				: systemIcons.system.y,
			...systemIcons.left.map((i) => i.y + i.size / 2),
			...systemIcons.right.map((i) => i.y + i.size / 2),
			...systemIcons.top.map((i) => i.y + i.size / 2),
			...systemIcons.bottom.map((i) => i.y + i.size / 2),
		);
	}

	function shouldShowLabel(system: MapData['systems'][number]) {
		if ($mapSettings.systemNames === 'none') return false;
		if ($mapSettings.systemNames === 'all') return true;
		if ($mapSettings.systemNames === 'countryCapitals' && system.isCountryCapital) return true;
		if (
			$mapSettings.systemNames === 'sectorCapitals' &&
			(system.isCountryCapital || system.isSectorCapital)
		)
			return true;
		if ($mapSettings.systemNames === 'colonized' && system.isColonized) return true;
		return false;
	}

	function getMapModeIcons(systems: MapData['systems']) {
		const max = Math.max(...systems.map((s) => s.mapModeTotalValue ?? 0));
		const scale = (100 / max) * (mapModes[$mapSettings.mapMode]?.system?.scale ?? 1);
		return systems
			.filter((system) => system.mapModeTotalValue)
			.map((system) => {
				const total = system.mapModeTotalValue ?? 0;
				const r = Math.sqrt(total * scale);
				let startAngle = 0;
				const arcs = (system.mapModeValues ?? [])
					.filter((value) => value.value)
					.map((value) => {
						const angle = (value.value / total) * Math.PI * 2;
						const start = startAngle;
						const end = start + angle;
						startAngle = end;
						return {
							...value,
							start,
							end,
						};
					});
				return { r, arcs, ...system };
			})
			.sort((a, b) => b.r - a.r);
	}
</script>

{#each data.systems
	.filter((s) => s.systemIsKnown || !$mapSettings.terraIncognita)
	.map((s) => getSystemIcons(s, $mapSettings)) as systemIcons}
	{#each [...(systemIcons.center ? [systemIcons.center] : []), ...systemIcons.left, ...systemIcons.right, ...systemIcons.top, ...systemIcons.bottom] as systemIcon}
		<use
			href="#{systemIcon.icon}"
			x={systemIcon.x - systemIcon.size / 2}
			y={systemIcon.y - systemIcon.size / 2}
			width={systemIcon.size}
			height={systemIcon.size}
			{...getFillColorAttributes({
				mapSettings: $mapSettings,
				colors,
				countryColors: systemIcons.system,
				colorStack: [systemIcon.color, $mapSettings.borderFillColor],
			})}
		/>
	{/each}
	{#if shouldShowLabel(systemIcons.system)}
		<text
			x={systemIcons.system.x}
			y={getIconsBottom(systemIcons) + $mapSettings.systemNamesFontSize / 4}
			text-anchor="middle"
			dominant-baseline="hanging"
			font-size={$mapSettings.systemNamesFontSize}
			fill="white"
			font-family={$mapSettings.systemNamesFont}
			style:text-shadow="0px 0px 3px black"
		>
			{systemIcons.system.name}
		</text>
	{/if}
{/each}

{#each getMapModeIcons(data.systems.filter((s) => s.systemIsKnown || !$mapSettings.terraIncognita)) as system}
	{#if system.arcs.length <= 1}
		<circle
			cx={system.x}
			cy={system.y}
			r={system.r}
			{...getFillColorAttributes({
				mapSettings: $mapSettings,
				colors,
				countryColors: system,
				colorStack: [
					system.arcs[0]?.color ?? { color: 'black', colorAdjustments: [] },
					$mapSettings.borderFillColor,
				],
			})}
		/>
	{:else}
		{#each system.arcs as arc}
			<path
				d={d3Shape.arc()({
					innerRadius: 0,
					outerRadius: system.r,
					startAngle: arc.start,
					endAngle: arc.end,
				})}
				transform="translate({system.x},{system.y})"
				{...getFillColorAttributes({
					mapSettings: $mapSettings,
					colors,
					countryColors: system,
					colorStack: [arc.color, $mapSettings.borderFillColor],
				})}
			/>
		{/each}
	{/if}
	<circle
		cx={system.x}
		cy={system.y}
		r={system.r + 0.25}
		stroke-width="0.5"
		fill="none"
		stroke={colors.black}
	/>
{/each}

{#each data.systems
	.filter((s) => s.systemIsKnown || !$mapSettings.terraIncognita)
	.filter(shouldShowLabel)
	.map((s) => getSystemIcons(s, $mapSettings)) as systemIcons}
	<text
		x={systemIcons.system.x}
		y={getIconsBottom(systemIcons) + $mapSettings.systemNamesFontSize / 4}
		text-anchor="middle"
		dominant-baseline="hanging"
		font-size={$mapSettings.systemNamesFontSize}
		fill="white"
		font-family={$mapSettings.systemNamesFont}
		style:text-shadow="0px 0px 3px black"
	>
		{systemIcons.system.name}
	</text>
{/each}
