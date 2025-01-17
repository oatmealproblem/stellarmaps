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
		data.bypassLinks.filter((w) => !$mapSettings.terraIncognita || w.isKnown),
	);
</script>

{#if $mapSettings.wormholeStroke.enabled}
	{#each knownBypassLinks.filter((b) => b.type === 'wormhole') as bypassLink}
		<Glow enabled={$mapSettings.wormholeStroke.glow}>
			{#snippet children({ filter })}
				<path
					d="M {bypassLink.from.x} {bypassLink.from.y} L {bypassLink.to.x} {bypassLink.to.y}"
					{filter}
					{...getStrokeAttributes($mapSettings.wormholeStroke)}
					{...getStrokeColorAttributes({
						mapSettings: $mapSettings,
						colorStack: [$mapSettings.wormholeStrokeColor],
						colors,
					})}
				/>
			{/snippet}
		</Glow>
	{/each}
{/if}

{#if $mapSettings.lGateStroke.enabled}
	{#each knownBypassLinks.filter((b) => b.type === 'lgate') as bypassLink}
		<Glow enabled={$mapSettings.lGateStroke.glow}>
			{#snippet children({ filter })}
				<path
					d="M {bypassLink.from.x} {bypassLink.from.y} L {bypassLink.to.x} {bypassLink.to.y}"
					{filter}
					{...getStrokeAttributes($mapSettings.lGateStroke)}
					{...getStrokeColorAttributes({
						mapSettings: $mapSettings,
						colorStack: [$mapSettings.lGateStrokeColor],
						colors,
					})}
				/>
			{/snippet}
		</Glow>
	{/each}
{/if}

{#if $mapSettings.shroudTunnelStroke.enabled}
	{#each knownBypassLinks.filter((b) => b.type === 'shroud_tunnel') as bypassLink}
		<Glow enabled={$mapSettings.shroudTunnelStroke.glow}>
			{#snippet children({ filter })}
				<path
					d="M {bypassLink.from.x} {bypassLink.from.y} L {bypassLink.to.x} {bypassLink.to.y}"
					{filter}
					{...getStrokeAttributes($mapSettings.shroudTunnelStroke)}
					{...getStrokeColorAttributes({
						mapSettings: $mapSettings,
						colorStack: [$mapSettings.shroudTunnelStrokeColor],
						colors,
					})}
				/>
			{/snippet}
		</Glow>
	{/each}
{/if}
