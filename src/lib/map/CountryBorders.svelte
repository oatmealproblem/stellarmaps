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
			.with({ type: 'union' }, () => $mapSettings.unionBorderColor)
			.with({ type: 'core' }, () => $mapSettings.sectorCoreBorderColor)
			.with({ type: 'standard' }, () => $mapSettings.sectorBorderColor)
			.with({ type: 'frontier' }, () => $mapSettings.sectorFrontierBorderColor)
			.exhaustive();
	}

	function getSectorBorderStrokeSetting(sectorBorder: SectorBorderPath) {
		return match(sectorBorder)
			.with({ type: 'union' }, () => $mapSettings.unionBorderStroke)
			.with({ type: 'core' }, () => $mapSettings.sectorCoreBorderStroke)
			.with({ type: 'standard' }, () => $mapSettings.sectorBorderStroke)
			.with({ type: 'frontier' }, () => $mapSettings.sectorFrontierBorderStroke)
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

{#if $mapSettings.borderStroke.enabled}
	{#each data.borders.filter((border) => border.isKnown || !$mapSettings.terraIncognita) as border}
		<path id="border-{border.countryId}-outer" d={`${border.outerPath}`} fill="none" />
		<path
			id="border-{border.countryId}-inner"
			d={border.innerPath}
			{...getFillColorAttributes({
				mapSettings: $mapSettings,
				colors,
				countryColors: border,
				colorStack: [$mapSettings.borderFillColor],
			})}
		/>
		{#if $mapSettings.borderFillFade > 0}
			<path
				id="border-{border.countryId}-inner"
				d={border.innerPath}
				clip-path={`url(#border-${border.countryId}-inner-clip-path)`}
				stroke-width={$mapSettings.borderFillFade * 25}
				filter="url(#fade)"
				fill="none"
				{...getStrokeColorAttributes({
					mapSettings: $mapSettings,
					colors,
					countryColors: border,
					colorStack: [
						{
							...$mapSettings.borderFillColor,
							colorAdjustments: $mapSettings.borderFillColor.colorAdjustments.filter(
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
							mapSettings: $mapSettings,
							colors,
							countryColors: border,
							colorStack: [getSectorBorderColorSetting(sectorBorder), $mapSettings.borderFillColor],
						})}
						fill="none"
					/>
				{/snippet}
			</Glow>
		{/each}

		<Glow enabled={$mapSettings.borderStroke.glow}>
			{#snippet children({ filter })}
				<path
					id="border-{border.countryId}-border-only"
					d={`${border.borderPath}`}
					{...getFillColorAttributes({
						mapSettings: $mapSettings,
						colors,
						countryColors: border,
						colorStack: [$mapSettings.borderColor, $mapSettings.borderFillColor],
					})}
					{filter}
				/>
			{/snippet}
		</Glow>

		{#if $mapSettings.occupation}
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
