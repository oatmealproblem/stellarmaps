<script lang="ts">
	import debug from '../debug';
	import { lastProcessedMapSettings, mapSettings } from '../settings';
	import type { MapData } from './data/processMapData';

	interface Props {
		data: MapData;
	}

	let { data }: Props = $props();
</script>

{#each data.labels.filter((label) => label.isKnown || !$mapSettings.terraIncognita) as label}
	{#each label.labelPoints as { point, emblemWidth, emblemHeight, textWidth, textHeight }}
		{#if $debug}<circle cx={point[0]} cy={point[1]} r={3} fill="#F0F" />{/if}
		{#if $debug && emblemWidth != null && emblemHeight != null}
			<rect
				stroke-width={1}
				stroke="#F0F"
				x={point[0] - emblemWidth / 2}
				y={point[1] - (textHeight != null ? emblemHeight : emblemHeight / 2)}
				width={emblemWidth}
				height={emblemHeight}
				fill="transparent"
			/>
		{/if}
		{#if emblemWidth != null && emblemHeight != null && label.emblemKey != null && data.emblems[label.emblemKey]}
			<image
				x={point[0] - emblemWidth / 2}
				y={point[1] - (textHeight != null ? emblemHeight : emblemHeight / 2)}
				width={emblemWidth}
				height={emblemHeight}
				xlink:href={data.emblems[label.emblemKey]}
			/>
			{#if label.isUnionLeader && $mapSettings.unionLeaderSymbol !== 'none'}
				<text
					transform="translate({point[0]},{point[1] -
						(textHeight != null ? emblemHeight : emblemHeight / 2)})"
					fill="white"
					text-anchor="middle"
					dominant-baseline="bottom"
					font-size={emblemHeight * $mapSettings.unionLeaderSymbolSize}
				>
					{$mapSettings.unionLeaderSymbol}
				</text>
			{/if}
		{/if}
		{#if $debug && textWidth != null && textHeight != null}
			<rect
				stroke-width={1}
				stroke="#F0F"
				x={point[0] - textWidth / 2}
				y={point[1] - (emblemHeight != null ? 0 : textHeight / 2)}
				width={textWidth}
				height={textHeight}
				fill="transparent"
			/>
		{/if}
		{#if textWidth != null && textHeight != null && label.primaryName}
			<text
				x={point[0]}
				y={point[1] + (emblemHeight != null ? textHeight / 2 : 0)}
				text-anchor="middle"
				dominant-baseline="middle"
				font-size={textHeight}
				fill="white"
				font-family={$lastProcessedMapSettings.countryNamesFont}
				textLength={textWidth}
				lengthAdjust="spacingAndGlyphs"
				text-decoration={label.isUnionLeader && $mapSettings.unionLeaderUnderline
					? 'underline'
					: ''}
				style:text-shadow="0px 0px 3px black"
			>
				{label.primaryName}
			</text>
		{/if}
		{#if textWidth != null && textHeight != null && label.secondaryName}
			<text
				x={point[0]}
				y={point[1] +
					(emblemHeight != null ? textHeight / 2 : 0) +
					textHeight * ($lastProcessedMapSettings.countryNamesSecondaryRelativeSize ?? 1) * 1.25}
				text-anchor="middle"
				dominant-baseline="middle"
				font-size={textHeight * ($lastProcessedMapSettings.countryNamesSecondaryRelativeSize ?? 1)}
				fill="white"
				font-family={$lastProcessedMapSettings.countryNamesFont}
				style:text-shadow="0px 0px 3px black"
			>
				{label.secondaryName}
			</text>
		{/if}
	{/each}
{/each}
