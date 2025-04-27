<script lang="ts">
	import { mapSettings } from '../settings';
	import type { MapData } from './data/processMapData';
	interface Props {
		data: MapData;
	}

	let { data }: Props = $props();
	let terraIncognitaColor = $derived(
		`rgb(${mapSettings.current.terraIncognitaBrightness},${mapSettings.current.terraIncognitaBrightness},${mapSettings.current.terraIncognitaBrightness})`,
	);
</script>

{#if mapSettings.current.terraIncognita}
	<!-- filtered and patterned path disappears at some zoom levels -->
	<!-- always draw a flat terra incognita underneath as a fallback -->
	<path id="terra-incognita-fallback" d={data.terraIncognitaPath} fill={terraIncognitaColor} />
	<path
		id="terra-incognita"
		d={data.terraIncognitaPath}
		fill={mapSettings.current.terraIncognitaStyle === 'striped'
			? 'url(#dark-stripes)'
			: terraIncognitaColor}
		filter={mapSettings.current.terraIncognitaStyle === 'cloudy'
			? 'url(#terra-incognita-filter)'
			: ''}
	/>
{/if}
