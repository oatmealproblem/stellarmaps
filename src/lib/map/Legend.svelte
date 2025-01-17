<script lang="ts">
	import { SYSTEM_FONTS } from '../constants';
	import { mapSettings } from '../settings';
	import type { MapData } from './data/processMapData';
	import Icons from './Icons.svelte';
	import {
		getFillColorAttributes,
		getStrokeAttributes,
		getStrokeColorAttributes,
	} from './mapUtils';
	import OccupationPatternDefs from './OccupationPatternDefs.svelte';

	interface Props {
		data: null | MapData;
		colors: null | Record<string, string>;
	}

	let { data, colors }: Props = $props();

	let borderWidth = $derived(
		$mapSettings.legendBorderStroke.enabled ? $mapSettings.legendBorderStroke.width : 0,
	);
	let padding = $derived($mapSettings.legendFontSize);
	let symbolSize = $derived($mapSettings.legendFontSize * 1.25);
	let symbolLabelGap = $derived($mapSettings.legendFontSize / 4);
	let rowGap = $derived($mapSettings.legendFontSize / 2);
	let width = $derived(
		(data?.legend.maxLabelWidth ?? 0) + symbolSize + symbolLabelGap + padding * 2 + borderWidth * 2,
	);
	let height = $derived(
		symbolSize * (data?.legend.items.length ?? 0) +
			rowGap * ((data?.legend.items ?? [null]).length - 1) +
			padding * 2 +
			borderWidth * 2,
	);
</script>

{#if (data?.legend.items.length ?? 0) > 0 && $mapSettings.legend}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		xmlns:xlink="http://www.w3.org/1999/xlink"
		viewBox="0 0 {width} {height}"
		width="{width}px"
		height="{height}px"
	>
		<defs>
			{#if colors && data}
				<OccupationPatternDefs {colors} {data} />
			{/if}
			<Icons />
		</defs>
		<rect
			x={borderWidth / 2}
			y={borderWidth / 2}
			width={width - borderWidth}
			height={height - borderWidth}
			{...getStrokeAttributes($mapSettings.legendBorderStroke)}
			{...getStrokeColorAttributes({
				mapSettings: $mapSettings,
				colorStack: [$mapSettings.legendBorderColor],
				colors: colors ?? {},
			})}
			{...getFillColorAttributes({
				mapSettings: $mapSettings,
				colorStack: [$mapSettings.legendBackgroundColor],
				colors: colors ?? {},
			})}
		></rect>
		{#each data?.legend.items ?? [] as item, i}
			<g
				transform="translate({borderWidth + padding} {borderWidth +
					padding +
					(symbolSize + rowGap) * i})"
			>
				{#if colors && item.symbol.type === 'border'}
					<circle
						cx={symbolSize / 2}
						cy={symbolSize / 2}
						r={symbolSize / 2 - 1}
						stroke-width={2}
						{...getStrokeColorAttributes({
							mapSettings: $mapSettings,
							countryColors: item.symbol,
							colorStack: [$mapSettings.borderColor, $mapSettings.borderFillColor],
							colors,
						})}
						{...getFillColorAttributes({
							mapSettings: $mapSettings,
							countryColors: item.symbol,
							colorStack: [$mapSettings.borderFillColor],
							colors,
						})}
					/>
				{/if}
				{#if colors && item.symbol.type === 'icon'}
					<use
						href="#{item.symbol.icon}"
						x={0}
						y={0}
						width={symbolSize}
						height={symbolSize}
						transform="scale({item.symbol.scale ?? 1})"
						transform-origin="{symbolSize / 2} {symbolSize / 2}"
						{...getFillColorAttributes({
							mapSettings: $mapSettings,
							colors,
							colorStack: [item.symbol.color],
						})}
					/>
				{/if}
				{#if item.symbol.type === 'pattern'}
					<rect width={symbolSize} height={symbolSize} fill="url(#{item.symbol.pattern})" />
				{/if}
				{#if item.symbol.type === 'hr'}
					<line
						x1="0"
						x2={width - borderWidth - padding * 2}
						y1={symbolSize / 2}
						y2={symbolSize / 2}
						{...getStrokeAttributes($mapSettings.legendBorderStroke)}
						stroke-width="1"
						{...getStrokeColorAttributes({
							mapSettings: $mapSettings,
							colorStack: [$mapSettings.legendBorderColor],
							colors: colors ?? {},
						})}
					/>
				{/if}
				<text
					fill="#FFFFFF"
					x={symbolSize + symbolLabelGap}
					y={$mapSettings.legendFontSize}
					dominant-baseline="auto"
					font-size={$mapSettings.legendFontSize}
					font-family={SYSTEM_FONTS}
				>
					{item.label}
				</text>
			</g>
		{/each}
	</svg>
{/if}
