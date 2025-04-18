<script lang="ts">
	import { onMount } from 'svelte';

	import { debounce } from '$lib/utils';

	import debug from '../debug';
	import { mapSettings } from '../settings';
	import BypassLinks from './BypassLinks.svelte';
	import CountryBorders from './CountryBorders.svelte';
	import CountryLabels from './CountryLabels.svelte';
	import type { MapData } from './data/processMapData';
	import Hyperlanes from './Hyperlanes.svelte';
	import Icons from './Icons.svelte';
	import MapModePaths from './MapModePaths.svelte';
	import OccupationPatternDefs from './OccupationPatternDefs.svelte';
	import SystemIcons from './SystemIcons.svelte';
	import TerraIncognita from './TerraIncognita.svelte';
	import TerraIncognitaDefs from './TerraIncognitaDefs.svelte';

	interface Props {
		data: null | MapData;
		colors: null | Record<string, string>;
		onChange?: () => void;
	}
	let { data, colors, onChange }: Props = $props();

	let debouncedOnChange = $derived(onChange ? debounce(onChange, 100) : undefined);

	onMount(() => {
		const mutationObserver = new MutationObserver(() => {
			debouncedOnChange?.();
		});
		const options = { attributes: true, characterData: true, childList: true, subtree: true };
		mutationObserver.observe(defs, options);
		mutationObserver.observe(g, options);

		return () => mutationObserver.disconnect();
	});

	let defs: SVGDefsElement;
	let g: SVGGElement;
</script>

<defs bind:this={defs}>
	{#if data}
		{#each data.borders.filter((border) => border.isKnown || !mapSettings.current.terraIncognita) as border}
			<clipPath id="border-{border.countryId}-inner-clip-path">
				<use href="#border-{border.countryId}-inner" />
			</clipPath>
			<clipPath id="border-{border.countryId}-outer-clip-path">
				<use href="#border-{border.countryId}-outer" />
			</clipPath>
			<TerraIncognitaDefs />
			<OccupationPatternDefs colors={colors ?? {}} {data} />
			<filter
				id="glow"
				filterUnits="objectBoundingBox"
				x="-50%"
				y="-50%"
				width="200%"
				height="200%"
			>
				<feGaussianBlur in="SourceGraphic" stdDeviation="2" />
				<!-- this actually just blurs;
						for a glow effect, apply this filter, then layer a duplicate non-filtered element on top;
						other approaches resulted in a pixellated look when zoomed in (at least when rendered with WebKitGTK)
					-->
			</filter>
			<filter
				id="fade"
				filterUnits="objectBoundingBox"
				x="-50%"
				y="-50%"
				width="200%"
				height="200%"
			>
				<feGaussianBlur in="SourceGraphic" stdDeviation={mapSettings.current.borderFillFade * 25} />
			</filter>
		{/each}
	{/if}
	<Icons />
</defs>
<g bind:this={g}>
	{#if data && colors}
		<CountryBorders {data} {colors} />
		<Hyperlanes {data} {colors} />
		<TerraIncognita {data} />
		<BypassLinks {data} {colors} />
		<MapModePaths {data} {colors} />
		<SystemIcons {data} {colors} />
		<CountryLabels {data} />
		{#if debug.current}
			{#each data.galaxyBorderCircles as circle}
				<circle
					cx={-circle.cx}
					cy={circle.cy}
					r={circle.r}
					stroke-width={['outer-padded', 'inner-padded', 'outlier'].includes(circle.type) ? 2 : 1}
					stroke={circle.type === 'outlier'
						? 'green'
						: circle.type.startsWith('outer')
							? 'blue'
							: 'red'}
					fill="transparent"
				/>
			{/each}
		{/if}
	{/if}
</g>
