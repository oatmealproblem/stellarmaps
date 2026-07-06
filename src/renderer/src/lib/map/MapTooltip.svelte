<script lang="ts">
	import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
	import { onDestroy, onMount } from 'svelte';
	import { locale, t, type MessageID } from '../../intl';
	import type { GalacticObject, GameState, LocalizedText } from '../GameState';
	import HeroiconUserMicro from '../icons/HeroiconUserMicro.svelte';
	import { mapSettings } from '../settings';
	import { isDefined } from '../utils';
	import { localizeText } from './data/locUtils';
	import { mapModes } from './data/mapModes';
	import type { ProcessedSystem } from './data/processSystems';
	import { resolveColor } from './mapUtils';
	import { getSystemColonies } from './data/utils';

	export let x: number;
	export let y: number;
	export let system: GalacticObject;
	export let processedSystem: ProcessedSystem | null | undefined;
	export let gameState: null | GameState;
	export let colors: Record<string, string>;

	let targetEl: HTMLDivElement;
	let popupEl: HTMLDivElement;
	let arrowEl: HTMLDivElement;

	function updatePopupPos() {
		computePosition(targetEl, popupEl, {
			placement: 'right-start',
			middleware: [offset(4), flip(), shift(), arrow({ element: arrowEl, padding: 12 })],
		}).then((pos) => {
			popupEl.style.left = `${pos.x}px`;
			popupEl.style.top = `${pos.y}px`;
			popupEl.style.display = 'block';
			const arrowData = pos.middlewareData.arrow;

			const staticSide = {
				top: 'bottom',
				right: 'left',
				bottom: 'top',
				left: 'right',
			}[pos.placement.split('-')[0] ?? 'right'];

			Object.assign(arrowEl.style, {
				left: arrowData?.x != null ? `${arrowData.x}px` : '',
				top: arrowData?.y != null ? `${arrowData.y}px` : '',
				right: '',
				bottom: '',
				...(staticSide ? { [staticSide]: '-5px' } : {}),
			});
		});
	}

	let cleanup: null | (() => void) = null;
	onMount(() => {
		cleanup = autoUpdate(targetEl, popupEl, updatePopupPos);
	});
	onDestroy(() => cleanup?.());

	$: colonies = gameState == null ? [] : getSystemColonies(gameState, system);

	async function localizeValueLabel(
		message: MessageID | LocalizedText,
		data: Record<string, LocalizedText> = {},
	) {
		const values: Record<string, string> = {};
		for (const [k, v] of Object.entries(data)) {
			values[k] = await localizeText(v);
		}
		return typeof message === 'string' ? $t(message, values) : await localizeText(message);
	}
</script>

<div
	class="pointer-events-none absolute -ms-1 -mt-2 h-4 w-2"
	style:top="{y}px"
	style:left="{x}px"
	tabindex="-1"
	bind:this={targetEl}
></div>

<div
	data-popup="map-tooltip"
	class="pointer-events-none rounded border border-surface-500 bg-surface-600 px-2 py-1 shadow-sm"
	bind:this={popupEl}
>
	<div class="arrow bg-surface-600" bind:this={arrowEl} />
	<strong>
		{#await localizeText(system.name)}
			{$t('generic.loading')}
		{:then name}
			{name}
		{/await}
	</strong>
	{#if processedSystem?.mapModeCountryLabel}
		<div class="flex flex-row justify-between gap-1 text-sm">
			<span>
				{$t(mapModes[$mapSettings.mapMode]?.tooltipLabel ?? 'generic.NEVER')}:
			</span>
			<strong>
				{#await localizeValueLabel(processedSystem.mapModeCountryLabel)}
					{$t('generic.loading')}
				{:then label}
					{label}
				{/await}
			</strong>
		</div>
	{/if}
	{#if processedSystem?.mapModeValues?.filter((v) => v.value).length}
		<strong class="mt-2 block">
			{$t(mapModes[$mapSettings.mapMode]?.tooltipLabel ?? 'generic.NEVER')}
		</strong>
		<ul class="text-sm">
			{#each processedSystem.mapModeValues.filter((v) => v.value) as systemValue}
				<li class="flex flex-row justify-between gap-3">
					<span>
						<svg class="inline-block h-3 w-3" viewBox="-1 -1 2 2">
							<circle
								r="0.875"
								fill={resolveColor({
									mapSettings: $mapSettings,
									colorStack: [systemValue.color],
									colors,
								})}
								stroke={colors.black}
								stroke-width="0.125"
							/>
						</svg>
						{#await localizeValueLabel(systemValue.legendLabel, systemValue.legendLabelData)}
							{$t('generic.loading')}
						{:then label}
							{label}
						{/await}
					</span>
					<strong>
						{new Intl.NumberFormat($locale, {
							notation: 'compact',
							maximumFractionDigits: 1,
						}).format(systemValue.value)}
					</strong>
				</li>
			{/each}
		</ul>
	{/if}
	{#if colonies.length}
		<strong class="mt-2 block">{$t('map.tooltip.colonies')}</strong>
		<ul class="ps-4">
			{#each colonies as colony}
				<li class="flex flex-row justify-between text-sm">
					<span>
						{#await localizeText(colony.name)}
							{$t('generic.loading')}
						{:then name}
							{name}
						{/await}
					</span>
					<span class="ms-3 inline-block">
						{colony.num_sapient_pops}<HeroiconUserMicro class="inline h-3 w-3" />
					</span>
				</li>
			{/each}
		</ul>
	{/if}
	<div class="text-sm">
		{$t('map.click_to_view_system')}
	</div>
</div>
