<script lang="ts">
	import { isColorDynamic, mapSettings } from '../settings';
	import type { MapData } from './data/processMapData';
	import Glow from './Glow.svelte';
	import { getStrokeAttributes, getStrokeColorAttributes } from './mapUtils';

	interface Props {
		data: MapData;
		colors: Record<string, string>;
	}

	let { data, colors }: Props = $props();

	let hyperRelaysDisabled = $derived(!$mapSettings.hyperRelayStroke.enabled);
	let hyperRelayIsDynamic = $derived(
		isColorDynamic($mapSettings.hyperRelayColor.color, $mapSettings),
	);
	let unownedHyperRelayColor = $derived(
		hyperRelayIsDynamic ? $mapSettings.unownedHyperRelayColor : $mapSettings.hyperRelayColor,
	);
	let unownedHyperRelayPath = $derived(
		[
			data.unownedRelayHyperlanesPath,
			...data.borders
				.filter((border) =>
					hyperRelayIsDynamic ? !border.isKnown && $mapSettings.terraIncognita : true,
				)
				.map((border) => border.relayHyperlanesPath),
		].join(' '),
	);

	let hyperlanesDisabled = $derived(!$mapSettings.hyperlaneStroke.enabled);
	let hyperlaneIsDynamic = $derived(
		isColorDynamic($mapSettings.hyperlaneColor.color, $mapSettings),
	);
	let unownedHyperlaneColor = $derived(
		hyperlaneIsDynamic ? $mapSettings.unownedHyperlaneColor : $mapSettings.hyperlaneColor,
	);
	let unownedHyperlanePath = $derived(
		[
			data.unownedHyperlanesPath,
			...data.borders
				.filter((border) =>
					hyperlaneIsDynamic ? !border.isKnown && $mapSettings.terraIncognita : true,
				)
				.map((border) => border.hyperlanesPath),
		].join(' ') + (hyperRelaysDisabled ? ` ${unownedHyperRelayPath}` : ''),
	);
</script>

{#if !hyperlanesDisabled}
	<Glow enabled={$mapSettings.hyperlaneStroke.glow}>
		{#snippet children({ filter })}
			<path
				d={unownedHyperlanePath}
				{...getStrokeColorAttributes({
					mapSettings: $mapSettings,
					colors,
					colorStack: [unownedHyperlaneColor],
				})}
				{...getStrokeAttributes($mapSettings.hyperlaneStroke)}
				{filter}
				fill="none"
			/>
		{/snippet}
	</Glow>
{/if}
{#if !hyperRelaysDisabled}
	<Glow enabled={$mapSettings.hyperRelayStroke.glow}>
		{#snippet children({ filter })}
			<path
				d={unownedHyperRelayPath}
				{...getStrokeColorAttributes({
					mapSettings: $mapSettings,
					colors,
					colorStack: [unownedHyperRelayColor],
				})}
				{...getStrokeAttributes($mapSettings.hyperRelayStroke)}
				{filter}
				fill="none"
			/>
		{/snippet}
	</Glow>
{/if}

{#each data.borders.filter((border) => border.isKnown || !$mapSettings.terraIncognita) as border}
	{#if !hyperlanesDisabled && hyperlaneIsDynamic}
		<Glow enabled={$mapSettings.hyperlaneStroke.glow}>
			{#snippet children({ filter })}
				<path
					d={hyperRelaysDisabled
						? `${border.hyperlanesPath} ${border.relayHyperlanesPath}`
						: border.hyperlanesPath}
					{...getStrokeColorAttributes({
						mapSettings: $mapSettings,
						colors,
						countryColors: border,
						colorStack: [$mapSettings.hyperlaneColor, $mapSettings.borderFillColor],
					})}
					{...getStrokeAttributes($mapSettings.hyperlaneStroke)}
					{filter}
					fill="none"
				/>
			{/snippet}
		</Glow>
	{/if}
	{#if !hyperRelaysDisabled && hyperRelayIsDynamic}
		<Glow enabled={$mapSettings.hyperRelayStroke.glow}>
			{#snippet children({ filter })}
				<path
					d={border.relayHyperlanesPath}
					{...getStrokeColorAttributes({
						mapSettings: $mapSettings,
						colors,
						countryColors: border,
						colorStack: [$mapSettings.hyperRelayColor, $mapSettings.borderFillColor],
					})}
					{...getStrokeAttributes($mapSettings.hyperRelayStroke)}
					{filter}
					fill="none"
				/>
			{/snippet}
		</Glow>
	{/if}
{/each}
