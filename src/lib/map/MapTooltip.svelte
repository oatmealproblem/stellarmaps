<script lang="ts">
	import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
	import { onDestroy, onMount } from 'svelte';

	import { locale, type MessageID, t } from '../../intl';
	import debug from '../debug';
	import type { GalacticObject, GameState, LocalizedText } from '../GameState.svelte';
	import HeroiconUserMicro from '../icons/HeroiconUserMicro.svelte';
	import { mapSettings } from '../settings';
	import { isDefined } from '../utils';
	import { localizeText } from './data/locUtils';
	import { mapModes } from './data/mapModes';
	import type { ProcessedSystem } from './data/processSystems';
	import { resolveColor } from './mapUtils';

	interface Props {
		x: number;
		y: number;
		system: GalacticObject;
		processedSystem: ProcessedSystem | null | undefined;
		gameState: null | GameState;
		colors: Record<string, string>;
	}

	let { x, y, system, processedSystem, gameState, colors }: Props = $props();

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
				...(staticSide != null ? { [staticSide]: '-5px' } : {}),
			});
		});
	}

	let cleanup: null | (() => void) = null;
	onMount(() => {
		cleanup = autoUpdate(targetEl, popupEl, updatePopupPos);
	});
	onDestroy(() => cleanup?.());

	let planets = $derived(
		system.colonies
			.map((planetId) => gameState?.planets.planet[planetId])
			.filter(isDefined)
			.sort((a, b) => (b.num_sapient_pops ?? 0) - (a.num_sapient_pops ?? 0)),
	);

	async function localizeValueLabel(
		message: MessageID | LocalizedText,
		data: Record<string, LocalizedText> = {},
	) {
		const values: Record<string, string> = {};
		for (const [k, v] of Object.entries(data)) {
			values[k] = await localizeText(v);
		}
		return typeof message === 'string' ? t(message, values) : await localizeText(message);
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
	<div class="arrow bg-surface-600" bind:this={arrowEl}></div>
	<strong>
		{#await localizeText(system.name)}
			{t('generic.loading')}
		{:then name}
			{name}
		{/await}
	</strong>
	{#if debug.current}
		<div>System ID: {system.id}</div>
		<div>Country ID: {processedSystem?.countryId}</div>
	{/if}
	{#if processedSystem?.mapModeCountryLabel}
		<div class="flex flex-row justify-between gap-1 text-sm">
			<span>
				{t(mapModes[mapSettings.current.mapMode]?.tooltipLabel ?? 'generic.NEVER')}:
			</span>
			<strong>
				{#await localizeValueLabel(processedSystem.mapModeCountryLabel)}
					{t('generic.loading')}
				{:then label}
					{label}
				{/await}
			</strong>
		</div>
	{/if}
	{#if processedSystem?.mapModeValues?.filter((v) => v.value).length}
		<strong class="mt-2 block">
			{t(mapModes[mapSettings.current.mapMode]?.tooltipLabel ?? 'generic.NEVER')}
		</strong>
		<ul class="text-sm">
			{#each processedSystem.mapModeValues.filter((v) => v.value) as systemValue}
				<li class="flex flex-row justify-between gap-3">
					<span>
						<svg class="inline-block h-3 w-3" viewBox="-1 -1 2 2">
							<circle
								r="0.875"
								fill={resolveColor({
									mapSettings: mapSettings.current,
									colorStack: [systemValue.color],
									colors,
								})}
								stroke={colors.black}
								stroke-width="0.125"
							/>
						</svg>
						{#await localizeValueLabel(systemValue.legendLabel, systemValue.legendLabelData)}
							{t('generic.loading')}
						{:then label}
							{label}
						{/await}
					</span>
					<strong>
						{new Intl.NumberFormat(locale.current, {
							notation: 'compact',
							maximumFractionDigits: 1,
						}).format(systemValue.value)}
					</strong>
				</li>
			{/each}
		</ul>
	{/if}
	{#if planets.length}
		<strong class="mt-2 block">{t('map.tooltip.colonies')}</strong>
		<ul class="ps-4">
			{#each planets as planet}
				<li class="flex flex-row justify-between text-sm">
					<span>
						{#await localizeText(planet.name)}
							{t('generic.loading')}
						{:then name}
							{name}
						{/await}
					</span>
					<span class="ms-3 inline-block">
						{planet.num_sapient_pops}<HeroiconUserMicro class="inline h-3 w-3" />
					</span>
				</li>
			{/each}
		</ul>
	{/if}
	<div class="text-sm">
		{t('map.click_to_view_system')}
	</div>
</div>
