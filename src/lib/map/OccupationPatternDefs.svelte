<script lang="ts">
	import { mapSettings } from '../settings';
	import type { MapData } from './data/processMapData';
	import { getFillColorAttributes } from './mapUtils';

	interface Props {
		data: MapData;
		colors: Record<string, string>;
	}

	let { data, colors }: Props = $props();
</script>

<pattern
	id="pattern-full-occupier"
	viewBox="0,0,10,20"
	preserveAspectRatio="none"
	width="10"
	height="5"
	patternUnits="userSpaceOnUse"
	patternTransform="rotate(-45)"
>
	<rect fill="white" width="10" height="6" />
</pattern>
<pattern
	id="pattern-partial-occupier"
	viewBox="0,0,10,20"
	preserveAspectRatio="none"
	width="10"
	height="5"
	patternUnits="userSpaceOnUse"
	patternTransform="rotate(-45)"
>
	<rect fill="white" width="10" height="3" />
</pattern>

{#each data.occupationBorders as occupation}
	<pattern
		id="pattern-{occupation.partial
			? 'partial'
			: 'full'}-occupation-{occupation.occupier}-on-{occupation.occupied}"
		viewBox="0,0,10,20"
		preserveAspectRatio="none"
		width="10"
		height="5"
		patternUnits="userSpaceOnUse"
		patternTransform="rotate(-45)"
	>
		<rect
			{...getFillColorAttributes({
				mapSettings: mapSettings.current,
				colors,
				countryColors: [occupation, data.borders.find((b) => b.countryId === occupation.occupied)],
				colorStack: [mapSettings.current.occupationColor, mapSettings.current.borderFillColor],
			})}
			width="10"
			height={occupation.partial ? 3 : 6}
		/>
	</pattern>
{/each}
<!-- {#each partialOccupiers as occupier}
	<pattern
		id="pattern-partial-occupier-{occupier}-on-{occupied}"
		viewBox="0,0,10,20"
		preserveAspectRatio="none"
		width="5"
		height="5"
		patternUnits="userSpaceOnUse"
		patternTransform="rotate(-45)"
	>
		<rect
			{...getFillColorAttributes({
				mapSettings: mapSettings.current,
				colors,
				countryColors: data.occupationBorders.find((b) => b.occupier === occupier),
				colorStack: [mapSettings.current.borderColor, mapSettings.current.borderFillColor],
			})}
			width="10"
			height="3"
		/>
	</pattern>
{/each} -->
