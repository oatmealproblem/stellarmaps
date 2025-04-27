<script lang="ts">
	import { mapSettings } from '../settings';
	import type { MapData } from './data/processMapData';
	import Glow from './Glow.svelte';
	import { getStrokeAttributes, getStrokeColorAttributes } from './mapUtils';
	interface Props {
		data: MapData;
		colors: Record<string, string>;
	}

	let { data, colors }: Props = $props();
	let knownBypassLinks = $derived(
		data.bypassLinks.filter((w) => !mapSettings.current.terraIncognita || w.isKnown),
	);
</script>

{#if mapSettings.current.wormholeStroke.enabled}
	{#each knownBypassLinks.filter((b) => b.type === 'wormhole') as bypassLink}
		<Glow enabled={mapSettings.current.wormholeStroke.glow}>
			{#snippet children({ filter })}
				<path
					d="M {bypassLink.from.x} {bypassLink.from.y} L {bypassLink.to.x} {bypassLink.to.y}"
					{filter}
					{...getStrokeAttributes(mapSettings.current.wormholeStroke)}
					{...getStrokeColorAttributes({
						mapSettings: mapSettings.current,
						colorStack: [mapSettings.current.wormholeStrokeColor],
						colors,
					})}
				/>
			{/snippet}
		</Glow>
	{/each}
{/if}

{#if mapSettings.current.lGateStroke.enabled}
	{#each knownBypassLinks.filter((b) => b.type === 'lgate') as bypassLink}
		<Glow enabled={mapSettings.current.lGateStroke.glow}>
			{#snippet children({ filter })}
				<path
					d="M {bypassLink.from.x} {bypassLink.from.y} L {bypassLink.to.x} {bypassLink.to.y}"
					{filter}
					{...getStrokeAttributes(mapSettings.current.lGateStroke)}
					{...getStrokeColorAttributes({
						mapSettings: mapSettings.current,
						colorStack: [mapSettings.current.lGateStrokeColor],
						colors,
					})}
				/>
			{/snippet}
		</Glow>
	{/each}
{/if}

{#if mapSettings.current.shroudTunnelStroke.enabled}
	{#each knownBypassLinks.filter((b) => b.type === 'shroud_tunnel') as bypassLink}
		<Glow enabled={mapSettings.current.shroudTunnelStroke.glow}>
			{#snippet children({ filter })}
				<path
					d="M {bypassLink.from.x} {bypassLink.from.y} L {bypassLink.to.x} {bypassLink.to.y}"
					{filter}
					{...getStrokeAttributes(mapSettings.current.shroudTunnelStroke)}
					{...getStrokeColorAttributes({
						mapSettings: mapSettings.current,
						colorStack: [mapSettings.current.shroudTunnelStrokeColor],
						colors,
					})}
				/>
			{/snippet}
		</Glow>
	{/each}
{/if}
