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

	let hyperRelaysDisabled = $derived(!mapSettings.current.hyperRelayStroke.enabled);
	let hyperRelayIsDynamic = $derived(
		isColorDynamic(mapSettings.current.hyperRelayColor.color, mapSettings.current),
	);
	let unownedHyperRelayColor = $derived(
		hyperRelayIsDynamic
			? mapSettings.current.unownedHyperRelayColor
			: mapSettings.current.hyperRelayColor,
	);
	let unownedHyperRelayPath = $derived(
		[
			data.unownedRelayHyperlanesPath,
			...data.borders
				.filter((border) =>
					hyperRelayIsDynamic ? !border.isKnown && mapSettings.current.terraIncognita : true,
				)
				.map((border) => border.relayHyperlanesPath),
		].join(' '),
	);

	let hyperlanesDisabled = $derived(!mapSettings.current.hyperlaneStroke.enabled);
	let hyperlaneIsDynamic = $derived(
		isColorDynamic(mapSettings.current.hyperlaneColor.color, mapSettings.current),
	);
	let unownedHyperlaneColor = $derived(
		hyperlaneIsDynamic
			? mapSettings.current.unownedHyperlaneColor
			: mapSettings.current.hyperlaneColor,
	);
	let unownedHyperlanePath = $derived(
		[
			data.unownedHyperlanesPath,
			...data.borders
				.filter((border) =>
					hyperlaneIsDynamic ? !border.isKnown && mapSettings.current.terraIncognita : true,
				)
				.map((border) => border.hyperlanesPath),
		].join(' ') + (hyperRelaysDisabled ? ` ${unownedHyperRelayPath}` : ''),
	);
</script>

{#if !hyperlanesDisabled}
	<Glow enabled={mapSettings.current.hyperlaneStroke.glow}>
		{#snippet children({ filter })}
			<path
				d={unownedHyperlanePath}
				{...getStrokeColorAttributes({
					mapSettings: mapSettings.current,
					colors,
					colorStack: [unownedHyperlaneColor],
				})}
				{...getStrokeAttributes(mapSettings.current.hyperlaneStroke)}
				{filter}
				fill="none"
			/>
		{/snippet}
	</Glow>
{/if}
{#if !hyperRelaysDisabled}
	<Glow enabled={mapSettings.current.hyperRelayStroke.glow}>
		{#snippet children({ filter })}
			<path
				d={unownedHyperRelayPath}
				{...getStrokeColorAttributes({
					mapSettings: mapSettings.current,
					colors,
					colorStack: [unownedHyperRelayColor],
				})}
				{...getStrokeAttributes(mapSettings.current.hyperRelayStroke)}
				{filter}
				fill="none"
			/>
		{/snippet}
	</Glow>
{/if}

{#each data.borders.filter((border) => border.isKnown || !mapSettings.current.terraIncognita) as border}
	{#if !hyperlanesDisabled && hyperlaneIsDynamic}
		<Glow enabled={mapSettings.current.hyperlaneStroke.glow}>
			{#snippet children({ filter })}
				<path
					d={hyperRelaysDisabled
						? `${border.hyperlanesPath} ${border.relayHyperlanesPath}`
						: border.hyperlanesPath}
					{...getStrokeColorAttributes({
						mapSettings: mapSettings.current,
						colors,
						countryColors: border,
						colorStack: [mapSettings.current.hyperlaneColor, mapSettings.current.borderFillColor],
					})}
					{...getStrokeAttributes(mapSettings.current.hyperlaneStroke)}
					{filter}
					fill="none"
				/>
			{/snippet}
		</Glow>
	{/if}
	{#if !hyperRelaysDisabled && hyperRelayIsDynamic}
		<Glow enabled={mapSettings.current.hyperRelayStroke.glow}>
			{#snippet children({ filter })}
				<path
					d={border.relayHyperlanesPath}
					{...getStrokeColorAttributes({
						mapSettings: mapSettings.current,
						colors,
						countryColors: border,
						colorStack: [mapSettings.current.hyperRelayColor, mapSettings.current.borderFillColor],
					})}
					{...getStrokeAttributes(mapSettings.current.hyperRelayStroke)}
					{filter}
					fill="none"
				/>
			{/snippet}
		</Glow>
	{/if}
{/each}
