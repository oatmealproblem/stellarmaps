<script lang="ts">
	import { match } from 'ts-pattern';

	import { mapSettings } from '../settings';
	import type { SectorBorderPath } from './data/processBorders';
	import type { MapData } from './data/processMapData';
	import Glow from './Glow.svelte';
	import {
		getFillColorAttributes,
		getStrokeAttributes,
		getStrokeColorAttributes,
	} from './mapUtils';

	interface Props {
		data: MapData;
		colors: Record<string, string>;
	}

	let { data, colors }: Props = $props();

	function getSectorBorderColorSetting(sectorBorder: SectorBorderPath) {
		return match(sectorBorder)
			.with({ type: 'union' }, () => mapSettings.current.unionBorderColor)
			.with({ type: 'core' }, () => mapSettings.current.sectorCoreBorderColor)
			.with({ type: 'standard' }, () => mapSettings.current.sectorBorderColor)
			.with({ type: 'frontier' }, () => mapSettings.current.sectorFrontierBorderColor)
			.exhaustive();
	}

	function getSectorBorderStrokeSetting(sectorBorder: SectorBorderPath) {
		return match(sectorBorder)
			.with({ type: 'union' }, () => mapSettings.current.unionBorderStroke)
			.with({ type: 'core' }, () => mapSettings.current.sectorCoreBorderStroke)
			.with({ type: 'standard' }, () => mapSettings.current.sectorBorderStroke)
			.with({ type: 'frontier' }, () => mapSettings.current.sectorFrontierBorderStroke)
			.exhaustive();
	}

	function getSectorBorderSortValue(sectorBorder: SectorBorderPath) {
		return match(sectorBorder)
			.with({ type: 'union' }, () => 0)
			.with({ type: 'core' }, () => 1)
			.with({ type: 'standard' }, () => 2)
			.with({ type: 'frontier' }, () => 3)
			.exhaustive();
	}

	function filterSectorBorders(sectorBorder: SectorBorderPath) {
		return getSectorBorderStrokeSetting(sectorBorder).enabled;
	}

	function sortSectorBorders(a: SectorBorderPath, b: SectorBorderPath) {
		return getSectorBorderSortValue(a) - getSectorBorderSortValue(b);
	}
</script>

{#if mapSettings.current.borderStroke.enabled}
	{#each data.borders.filter((border) => border.isKnown || !mapSettings.current.terraIncognita) as border}
		<path id="border-{border.countryId}-outer" d={`${border.outerPath}`} fill="none" />
		<path
			id="border-{border.countryId}-inner"
			d={border.innerPath}
			{...getFillColorAttributes({
				mapSettings: mapSettings.current,
				colors,
				countryColors: border,
				colorStack: [mapSettings.current.borderFillColor],
			})}
		/>
		{#if mapSettings.current.borderFillFade > 0}
			<path
				id="border-{border.countryId}-inner"
				d={border.innerPath}
				clip-path={`url(#border-${border.countryId}-inner-clip-path)`}
				stroke-width={mapSettings.current.borderFillFade * 25}
				filter="url(#fade)"
				fill="none"
				{...getStrokeColorAttributes({
					mapSettings: mapSettings.current,
					colors,
					countryColors: border,
					colorStack: [
						{
							...mapSettings.current.borderFillColor,
							colorAdjustments: mapSettings.current.borderFillColor.colorAdjustments.filter(
								(a) => a.type !== 'OPACITY',
							),
						},
					],
				})}
			/>
		{/if}
		{#each border.sectorBorders.filter(filterSectorBorders).sort(sortSectorBorders) as sectorBorder}
			<Glow enabled={getSectorBorderStrokeSetting(sectorBorder).glow}>
				{#snippet children({ filter })}
					<path
						d={sectorBorder.path}
						{...getStrokeAttributes(getSectorBorderStrokeSetting(sectorBorder))}
						{filter}
						clip-path={`url(#border-${border.countryId}-outer-clip-path)`}
						{...getStrokeColorAttributes({
							mapSettings: mapSettings.current,
							colors,
							countryColors: border,
							colorStack: [
								getSectorBorderColorSetting(sectorBorder),
								mapSettings.current.borderFillColor,
							],
						})}
						fill="none"
					/>
				{/snippet}
			</Glow>
		{/each}

		<Glow enabled={mapSettings.current.borderStroke.glow}>
			{#snippet children({ filter })}
				<path
					id="border-{border.countryId}-border-only"
					d={`${border.borderPath}`}
					{...getFillColorAttributes({
						mapSettings: mapSettings.current,
						colors,
						countryColors: border,
						colorStack: [mapSettings.current.borderColor, mapSettings.current.borderFillColor],
					})}
					{filter}
				/>
			{/snippet}
		</Glow>

		{#if mapSettings.current.occupation}
			{#each data.occupationBorders.filter((b) => b.occupied === border.countryId) as occupationBorder}
				<path
					d={occupationBorder.path}
					fill="url(#pattern-{occupationBorder.partial
						? 'partial'
						: 'full'}-occupation-{occupationBorder.occupier}-on-{occupationBorder.occupied})"
					clip-path={`url(#border-${border.countryId}-inner-clip-path)`}
				/>
			{/each}
		{/if}
	{/each}
{/if}
