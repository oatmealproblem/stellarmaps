<script lang="ts">
	import { getModalStore, getToastStore, RangeSlider, SlideToggle } from '@skeletonlabs/skeleton';
	import { path } from '@tauri-apps/api';
	import * as dialog from '@tauri-apps/plugin-dialog';
	import * as fs from '@tauri-apps/plugin-fs';
	import { z } from 'zod';

	import { t } from '../intl';
	import convertBlobToDataUrl from './convertBlobToDataUrl';
	import convertSvgToPng from './convertSvgToPng';
	import type { GalacticObject, GameState } from './GameState.svelte';
	import type { MapData } from './map/data/processMapData';
	import Legend from './map/Legend.svelte';
	import Map from './map/Map.svelte';
	import { getBackgroundColor, getFillColorAttributes, resolveColor } from './map/mapUtils';
	import SolarSystemMap from './map/solarSystemMap/SolarSystemMap.svelte';
	import renderStarScape from './map/starScape/renderStarScape';
	import { type MapSettings, mapSettings } from './settings';
	import { PersistedDeepState } from './stateUtils.svelte';
	import stellarMapsApi from './stellarMapsApi';
	import { toastError } from './utils';

	interface Props {
		[key: string]: any;
	}

	let { ...props }: Props = $props();

	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- this suppresses warning about unknown prop 'parent'
	const _props = props;
	const modalStore = getModalStore();
	const toastStore = getToastStore();
	const colors: Record<string, string> = $modalStore[0]?.meta?.colors;
	const mapData: MapData = $modalStore[0]?.meta?.mapData;
	const gameState: GameState = $modalStore[0]?.meta?.gameState;
	const openedSystem: GalacticObject | undefined = $modalStore[0]?.meta?.openedSystem;

	let hiddenGalaxyMapSvg: SVGSVGElement;
	let hiddenSystemMapContainer: HTMLDivElement;
	let hiddenLegendContainer: HTMLDivElement;

	const zExportSettings = z.object({
		lockAspectRatio: z.boolean().catch(true),
		lockedAspectRatio: z.tuple([z.number(), z.number()]).catch([1, 1]),
		imageWidth: z.number().int().catch(2048),
		imageHeight: z.number().int().catch(2048),
		centerX: z.number().catch(0),
		centerY: z.number().catch(0),
		invertCenterX: z.boolean().catch(false),
		invertCenterY: z.boolean().catch(true),
		zoom: z.number().catch(0),
	});
	const defaultExportSettings = zExportSettings.parse({});
	const exportSettings = new PersistedDeepState({
		name: 'exportSettings',
		defaultValue: defaultExportSettings,
		schema: zExportSettings,
	});
	let lockAspectRatio = $derived(exportSettings.current.lockAspectRatio);
	let lockedAspectRatio = $derived(exportSettings.current.lockedAspectRatio);
	let imageWidth = $derived(exportSettings.current.imageWidth);
	let imageHeight = $derived(exportSettings.current.imageHeight);
	let centerX = $derived(exportSettings.current.centerX);
	let centerY = $derived(exportSettings.current.centerY);
	let invertCenterX = $derived(exportSettings.current.invertCenterX);
	let invertCenterY = $derived(exportSettings.current.invertCenterY);
	let zoom = $derived(exportSettings.current.zoom);
	let scale = $derived(1 / (zoom >= 0 ? 1 + zoom : 1 / (1 - zoom)));
	let mapWidth = $derived(
		imageHeight > imageWidth
			? 1000 * scale
			: (1000 * scale * lockedAspectRatio[1]) / lockedAspectRatio[0],
	);
	let mapHeight = $derived(
		imageWidth > imageHeight
			? 1000 * scale
			: (1000 * scale * lockedAspectRatio[0]) / lockedAspectRatio[1],
	);
	let mapLeft = $derived((invertCenterX ? -centerX : centerX) - mapWidth / 2);
	let mapTop = $derived((invertCenterY ? -centerY : centerY) - mapHeight / 2);
	let viewBoxLeft = $derived(Math.min(-500, mapLeft));
	let viewBoxTop = $derived(Math.min(-500, mapTop));
	let viewBoxWidth = $derived(
		viewBoxLeft < -500
			? Math.max(mapWidth, 500 - viewBoxLeft)
			: Math.max(1000, 500 + mapLeft + mapWidth),
	);
	let viewBoxHeight = $derived(
		viewBoxTop < -500
			? Math.max(mapHeight, 500 - viewBoxTop)
			: Math.max(1000, 500 + mapTop + mapHeight),
	);

	function hasBackgroundImage(mapSettings: MapSettings) {
		return (
			mapSettings.starScapeDust ||
			mapSettings.starScapeCore ||
			mapSettings.starScapeNebula ||
			mapSettings.starScapeStars
		);
	}

	function onPreviewClick(this: SVGElement, event: MouseEvent) {
		const boundingRect = this.getBoundingClientRect();
		const svgXPercent = (event.clientX - boundingRect.left) / boundingRect.width;
		const svgYPercent = (event.clientY - boundingRect.top) / boundingRect.height;
		exportSettings.current.centerX =
			Math.round(viewBoxLeft + viewBoxWidth * svgXPercent) * (invertCenterX ? -1 : 1);
		if (centerX < 0) {
			exportSettings.current.centerX *= -1;
			exportSettings.current.invertCenterX = !invertCenterX;
		}
		exportSettings.current.centerY =
			Math.round(viewBoxTop + viewBoxHeight * svgYPercent) * (invertCenterY ? -1 : 1);
		if (centerY < 0) {
			exportSettings.current.centerY *= -1;
			exportSettings.current.invertCenterY = !invertCenterY;
		}
	}

	async function exportPng() {
		const backgroundImageUrl =
			openedSystem != null || !hasBackgroundImage(mapSettings.current)
				? undefined
				: await renderStarScape(
						gameState,
						mapSettings.current,
						colors,
						{
							left: mapLeft,
							top: mapTop,
							width: mapWidth,
							height: mapHeight,
						},
						{
							width: imageWidth,
							height: imageHeight,
						},
					);
		const legendSvg = hiddenLegendContainer.querySelector('svg');
		const legendImageUrl = legendSvg
			? await convertSvgToPng(legendSvg, {
					left: 0,
					top: 0,
					width: (1000 * imageWidth) / imageHeight,
					height: 1000,
					outputWidth: imageWidth,
					outputHeight: imageHeight,
				}).then(convertBlobToDataUrl)
			: undefined;
		const buffer = await convertSvgToPng(
			openedSystem
				? (hiddenSystemMapContainer.querySelector('svg') as SVGSVGElement)
				: hiddenGalaxyMapSvg,
			{
				left: mapLeft,
				top: mapTop,
				width: mapWidth,
				height: mapHeight,
				outputWidth: imageWidth,
				outputHeight: imageHeight,
				backgroundImageUrl,
				foregroundImageUrl: openedSystem ? undefined : legendImageUrl,
				backgroundColor: getBackgroundColor(colors, mapSettings.current),
			},
		).then((blob) => blob.arrayBuffer());
		const savePath = await dialog.save({
			defaultPath: await path.join(await path.pictureDir(), 'map.png'),
			filters: [{ extensions: ['png'], name: 'Image' }],
		});
		if (savePath != null) {
			await fs.writeFile(savePath, new Uint8Array(buffer)).then(() => {
				toastStore.trigger({
					background: 'variant-filled-success',
					message: t('notification.export_success'),
					timeout: 10000,
					action: {
						label: `
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
								<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
							</svg>
						`,
						response: () => stellarMapsApi.revealFile(savePath),
					},
				});
			});
			return;
		} else {
			return;
		}
	}

	async function exportSvg() {
		const svgToExport = openedSystem
			? (hiddenSystemMapContainer.querySelector('svg') as SVGSVGElement)
			: hiddenGalaxyMapSvg;
		svgToExport.setAttribute('width', imageWidth.toString());
		svgToExport.setAttribute('height', imageHeight.toString());
		svgToExport.setAttribute('viewBox', `${mapLeft} ${mapTop} ${mapWidth} ${mapHeight}`);
		const bgImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
		if (!openedSystem && hasBackgroundImage(mapSettings.current)) {
			bgImage.setAttribute('x', mapLeft.toString());
			bgImage.setAttribute('y', mapTop.toString());
			bgImage.setAttribute('width', mapWidth.toString());
			bgImage.setAttribute('height', mapHeight.toString());
			bgImage.setAttribute(
				'xlink:href',
				await renderStarScape(
					gameState,
					mapSettings.current,
					colors,
					{
						left: mapLeft,
						top: mapTop,
						width: mapWidth,
						height: mapHeight,
					},
					{
						width: imageWidth,
						height: imageHeight,
					},
				),
			);
			svgToExport.prepend(bgImage);
		}
		const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		bgRect.setAttribute('class', 'bg-rect');
		bgRect.setAttribute('x', mapLeft.toString());
		bgRect.setAttribute('y', mapTop.toString());
		bgRect.setAttribute('width', mapWidth.toString());
		bgRect.setAttribute('height', mapHeight.toString());
		bgRect.setAttribute('fill', getBackgroundColor(colors, mapSettings.current));
		svgToExport.prepend(bgRect);
		const legendContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		legendContainer.setAttribute('transform', `translate(${mapLeft} ${mapTop}) scale(${scale})`);
		legendContainer.innerHTML = openedSystem ? '' : hiddenLegendContainer.innerHTML;
		svgToExport.append(legendContainer);
		const svgString = svgToExport.outerHTML;
		if (!openedSystem && hasBackgroundImage(mapSettings.current)) svgToExport.removeChild(bgImage);
		svgToExport.removeChild(bgRect);
		svgToExport.removeChild(legendContainer);
		const savePath = await dialog.save({
			defaultPath: await path.join(await path.pictureDir(), 'map.svg').catch(() => ''),
			filters: [{ extensions: ['svg'], name: 'Image' }],
		});
		if (savePath != null) {
			await fs.writeTextFile(savePath, svgString).then(() => {
				toastStore.trigger({
					background: 'variant-filled-success',
					message: t('notification.export_success'),
					timeout: 10000,
					action: {
						label: `
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
								<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
							</svg>
						`,
						response: () => stellarMapsApi.revealFile(savePath),
					},
				});
			});
			return;
		} else {
			return;
		}
	}

	let processing = $state(false);
	async function onSubmit(exporter: () => Promise<void>) {
		processing = true;
		try {
			await exporter();
			modalStore.close();
		} catch (error) {
			toastError({
				title: t('notification.export_failed'),
				defaultValue: null,
				toastStore,
			})(error);
			processing = false;
		}
	}
</script>

<div
	class="bg-surface-100-800-token modal block h-auto w-[60rem] overflow-y-auto p-4 shadow-xl rounded-container-token"
	role="dialog"
	aria-modal="true"
>
	<form
		class="space-y-4"
		onsubmit={(e) => {
			e.preventDefault();
			onSubmit(exportPng);
		}}
		novalidate
	>
		<header class="modal-header text-2xl font-bold">{t('export.header')}</header>
		<article class="modal-body flex space-x-5">
			<div class="inline-block w-0 flex-1">
				<div class="mb-1 flex justify-between">
					<p>{t('export.image_size')}</p>
					<small class="flex">
						{t('export.lock_aspect_ratio')}
						<SlideToggle
							size="sm"
							name="lock-aspect-ratio"
							class="ml-1"
							disabled={processing || !imageHeight || !imageWidth}
							active="variant-filled-secondary"
							bind:checked={exportSettings.current.lockAspectRatio}
						/>
					</small>
				</div>
				<div class="input-group input-group-divider grid-cols-[auto_3rem_3rem_auto_3rem]">
					<input
						type="number"
						disabled={processing}
						bind:value={exportSettings.current.imageWidth}
						oninput={() => {
							if (imageWidth && lockAspectRatio) {
								exportSettings.current.imageHeight = Math.round(
									(imageWidth * lockedAspectRatio[0]) / lockedAspectRatio[1],
								);
							}
							if (imageWidth && imageHeight && !lockAspectRatio) {
								exportSettings.current.lockedAspectRatio = [imageHeight, imageWidth];
							}
						}}
					/>
					<div class="input-group-shim !justify-center !px-0">px</div>
					<div class="input-group-shim">×</div>
					<input
						type="number"
						disabled={processing}
						bind:value={exportSettings.current.imageHeight}
						oninput={() => {
							if (imageHeight && lockAspectRatio) {
								exportSettings.current.imageWidth = Math.round(
									(imageHeight * lockedAspectRatio[1]) / lockedAspectRatio[0],
								);
							}
							if (imageWidth && imageHeight && !lockAspectRatio) {
								exportSettings.current.lockedAspectRatio = [imageHeight, imageWidth];
							}
						}}
					/>
					<div class="input-group-shim !justify-center !px-0">px</div>
				</div>
				<p class="mb-1 mt-3">{t('export.zoom')}</p>
				<RangeSlider
					disabled={processing}
					name="zoom"
					min={-9}
					max={9}
					step={0.1}
					bind:value={exportSettings.current.zoom}
				/>
				<p class="mb-1 mt-3">
					{t('export.center')}
					<span class="ml-1 text-surface-300">{t('export.center_hint')}</span>
				</p>
				<div class="input-group input-group-divider grid-cols-[auto_3rem_3rem_auto_3rem]">
					<input
						type="number"
						disabled={processing}
						bind:value={exportSettings.current.centerX}
						onblur={() => {
							if (centerX < 0) {
								exportSettings.current.centerX = -centerX;
								exportSettings.current.invertCenterX = !invertCenterX;
							}
						}}
					/>
					<button
						disabled={processing}
						class="variant-filled-secondary !justify-center"
						onclick={() => {
							exportSettings.current.invertCenterX = !invertCenterX;
						}}
					>
						{invertCenterX ? 'W' : 'E'}
					</button>
					<div class="input-group-shim">×</div>
					<input
						type="number"
						disabled={processing}
						bind:value={exportSettings.current.centerY}
						onblur={() => {
							if (centerY < 0) {
								exportSettings.current.centerY = -centerY;
								exportSettings.current.invertCenterY = !invertCenterY;
							}
						}}
					/>
					<button
						disabled={processing}
						class="variant-filled-secondary !justify-center"
						onclick={() => {
							exportSettings.current.invertCenterY = !invertCenterY;
						}}
					>
						{invertCenterY ? 'N' : 'S'}
					</button>
				</div>
			</div>
			<aside class="inline-block w-[12rem] flex-initial">
				<p>
					{t('export.preview')}
					<small>{t('export.click_to_center')}</small>
				</p>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_interactive_supports_focus -->
				<svg
					id="map-svg"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="{viewBoxLeft} {viewBoxTop} {viewBoxWidth} {viewBoxHeight}"
					width="1000"
					height="1000"
					class="h-[12rem] w-[12rem]"
					style="background: {resolveColor({
						mapSettings: mapSettings.current,
						colors,
						colorStack: [mapSettings.current.backgroundColor],
					})};"
					onclick={onPreviewClick}
					role="button"
					style:cursor="pointer"
				>
					{#if openedSystem}
						<SolarSystemMap
							system={openedSystem}
							{mapData}
							{colors}
							{gameState}
							id="systemMapPreview"
							previewMode
						/>
					{:else if mapData}
						{#each mapData.borders as border}
							<path
								d={border.borderPath}
								{...getFillColorAttributes({
									mapSettings: mapSettings.current,
									colors,
									countryColors: border,
									colorStack: [
										mapSettings.current.borderColor,
										mapSettings.current.borderFillColor,
									],
								})}
							/>
							<path
								d={border.innerPath}
								{...getFillColorAttributes({
									mapSettings: mapSettings.current,
									colors,
									countryColors: border,
									colorStack: [
										// normally only use this approximation when for background colors
										// but it helps this simplified preview reflect the map
										mapSettings.current.borderFillColor,
									],
								})}
							/>
						{/each}
						{#if mapSettings.current.terraIncognita}
							<path
								id="terra-incognita-fallback"
								d={mapData.terraIncognitaPath}
								fill={`rgba(${mapSettings.current.terraIncognitaBrightness},${mapSettings.current.terraIncognitaBrightness},${mapSettings.current.terraIncognitaBrightness})`}
							/>
						{/if}
						<g transform="translate({mapLeft} {mapTop}) scale({scale})">
							<Legend data={mapData} {colors} />
						</g>
					{/if}
					<path
						fill="rgba(150, 150, 150, 0.5)"
						stroke="white"
						stroke-width={Math.max(viewBoxWidth, viewBoxHeight) / 100}
						d="M -100000 -100000 h 200000 v 200000 h -200000 v -200000 M {mapLeft} {mapTop} v {mapHeight} h {mapWidth} v -{mapHeight} h -{mapWidth}"
					/>
				</svg>
			</aside>
		</article>
		<footer class="modal-footer flex justify-end space-x-2">
			<button
				type="button"
				class="variant-ghost-surface btn"
				onclick={() => {
					exportSettings.current = defaultExportSettings;
				}}
				disabled={processing}
			>
				{t('export.reset_button')}
			</button>
			<button
				type="button"
				class="variant-ghost-surface btn"
				onclick={modalStore.close}
				disabled={processing}
			>
				{t('generic.cancel_button')}
			</button>
			<button
				type="button"
				class="variant-filled-tertiary btn"
				disabled={processing}
				onclick={() => onSubmit(exportSvg)}
			>
				{processing ? t('export.processing') : t('export.export_svg_button')}
			</button>
			<button type="submit" class="variant-filled-primary btn" disabled={processing}>
				{processing ? t('export.processing') : t('export.export_png_button')}
			</button>
		</footer>
	</form>
</div>

<!-- These are displayed, but are used for converting SVG to PNG -->
<div class="hidden">
	<svg
		bind:this={hiddenGalaxyMapSvg}
		xmlns="http://www.w3.org/2000/svg"
		xmlns:xlink="http://www.w3.org/1999/xlink"
	>
		{#if !openedSystem}
			<Map data={mapData} {colors} />
		{/if}
	</svg>
	<div bind:this={hiddenSystemMapContainer}>
		{#if openedSystem}
			<SolarSystemMap
				id="exportSystemMap"
				{colors}
				{mapData}
				{gameState}
				system={openedSystem}
				exportMode
			/>
		{/if}
	</div>
	<div bind:this={hiddenLegendContainer}>
		<Legend {colors} data={mapData} />
	</div>
</div>
