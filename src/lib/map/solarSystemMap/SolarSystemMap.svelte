<script lang="ts">
	import { select } from 'd3-selection';
	import { zoom, zoomIdentity } from 'd3-zoom';
	import { match } from 'ts-pattern';

	import { t } from '../../../intl';
	import type { GalacticObject, GameState } from '../../GameState';
	import { pathKitPromise } from '../../pathKit';
	import { type MapSettings, mapSettings } from '../../settings';
	import { isDefined } from '../../utils';
	import { localizeText } from '../data/locUtils';
	import type { MapData } from '../data/processMapData';
	import Glow from '../Glow.svelte';
	import Icons from '../Icons.svelte';
	import {
		getFillColorAttributes,
		getStrokeAttributes,
		getStrokeColorAttributes,
		multiplyOpacity,
	} from '../mapUtils';
	import { getBeltColor, getPlanetColor, getStarGlowColor } from './utils/colors';
	import {
		getFleetCoordinate,
		getPlanetCoordinate,
		getPlanetOrbitDistance,
		getScaledDistance,
	} from './utils/coordinates';
	import {
		getPlanetLabelPathAttributes,
		getPlanetLabelTextPathAttributes,
		isPlanetLabeled,
	} from './utils/labels';
	import {
		getPlanetRadius,
		getPrimaryBodies,
		isAsteroid,
		isFakePlanet,
		isPlanetarySystemPrimaryBody,
		isStar,
		PLANET_RING_PATTERN,
		STAR_GRADIENT_STEPS,
	} from './utils/planets';
	import { getPathKitShadowPath } from './utils/shadows';

	interface Props {
		system: GalacticObject;
		gameState: GameState;
		mapData: MapData;
		colors: Record<string, string>;
		id: string;
		exportMode?: boolean;
		previewMode?: boolean;
		onSystemSelected?: null | ((system: GalacticObject) => void);
	}

	let {
		system,
		gameState,
		mapData,
		colors,
		id,
		exportMode = false,
		previewMode = false,
		onSystemSelected = null,
	}: Props = $props();

	let svg: SVGElement;
	let g: SVGGElement;
	let zoomHandler = zoom()
		.on('zoom', (e) => {
			g.setAttribute('transform', e.transform.toString());
		})
		.filter(function filter(event: MouseEvent) {
			// click and drag for middle button only
			if (event.type === 'mousedown') return event.button === 1;
			// this is the default implementation
			return (!event.ctrlKey || event.type === 'wheel') && !event.button;
		});
	$effect(() => {
		if (!exportMode && !previewMode) {
			select(svg).call(zoomHandler as any);
		}
	});
	function resetZoom() {
		select(svg).call(zoomHandler.transform as any, zoomIdentity);
	}

	let fleets = $derived(
		system.fleet_presence
			.map((fleetId) => {
				const fleet = gameState.fleet[fleetId];
				const country = Object.values(gameState.country).find((country) =>
					country.fleets_manager?.owned_fleets.some((f) => f.fleet === fleetId),
				);
				const countryBorder = mapData.borders.find((b) => b.countryId === country?.id);
				if (!fleet || !country) return null;
				return {
					id: fleet.id,
					name: fleet.name,
					owner: country.id,
					primaryColor: countryBorder?.primaryColor ?? 'black',
					secondaryColor: countryBorder?.secondaryColor ?? 'black',
					isMobile: Boolean(fleet.mobile),
					isMilitary: fleet.military_power > 0,
					rotation: fleet.mobile
						? (-fleet.movement_manager.formation.angle / Math.PI) * 180 + 180
						: 0,
					coordinate: {
						x: -fleet.movement_manager.coordinate.x,
						y: fleet.movement_manager.coordinate.y,
					},
				};
			})
			.filter(isDefined),
	);

	function getFleetIconSetting(fleet: (typeof fleets)[number], settings: MapSettings) {
		return match(fleet)
			.with({ isMobile: true, isMilitary: false }, () => settings.systemMapCivilianFleetIcon)
			.with({ isMobile: false, isMilitary: false }, () => settings.systemMapCivilianStationIcon)
			.with({ isMobile: true, isMilitary: true }, () => settings.systemMapMilitaryFleetIcon)
			.with({ isMobile: false, isMilitary: true }, () => settings.systemMapMilitaryStationIcon)
			.exhaustive();
	}

	let ships = $derived(
		system.fleet_presence
			.flatMap((fleetId) => {
				const fleet = gameState.fleet[fleetId];
				const country = Object.values(gameState.country).find((country) =>
					country.fleets_manager?.owned_fleets.some((f) => f.fleet === fleetId),
				);
				const countryBorder = mapData.borders.find((b) => b.countryId === country?.id);
				if (!fleet || !country) return [];
				return fleet.ships.map((shipId) => {
					const ship = gameState.ships[shipId];
					if (!ship) return null;
					return {
						...ship,
						owner: country.id,
						primaryColor: countryBorder?.primaryColor ?? 'black',
						secondaryColor: countryBorder?.secondaryColor ?? 'black',
					};
				});
			})
			.filter(isDefined),
	);

	let planets = $derived(
		system.planet
			.map((planetId) => gameState.planets.planet[planetId])
			.filter(isDefined)
			.filter((planet) => !isFakePlanet(planet)),
	);

	let systemConnections = $derived(
		system.hyperlane
			.map((h) => {
				const toSystem = gameState.galactic_object[h.to];
				if (!toSystem) return null;
				const theta = Math.atan2(
					toSystem.coordinate.y - system.coordinate.y,
					// note: inverted x value
					system.coordinate.x - toSystem.coordinate.x,
				);
				const x = 400 * Math.cos(theta);
				const y = 400 * Math.sin(theta);
				const trianglePath = `
				M ${x + Math.cos(theta + Math.PI / 2) * 30} ${y + Math.sin(theta + Math.PI / 2) * 30}
				L ${x - Math.cos(theta + Math.PI / 2) * 30} ${y - Math.sin(theta + Math.PI / 2) * 30}
				L ${x + Math.cos(theta) * 20} ${y + Math.sin(theta) * 20}
				Z
			`;
				const textPathPoints: [[number, number], [number, number]] = [
					[
						x - Math.cos(theta) * 5 + Math.cos(theta + Math.PI / 2) * 500,
						y - Math.sin(theta) * 5 + Math.sin(theta + Math.PI / 2) * 500,
					],
					[
						x - Math.cos(theta) * 5 - Math.cos(theta + Math.PI / 2) * 500,
						y - Math.sin(theta) * 5 - Math.sin(theta + Math.PI / 2) * 500,
					],
				];
				if (y < 0) textPathPoints.reverse();
				const textPath = `M ${textPathPoints[0][0]} ${textPathPoints[0][1]} L ${textPathPoints[1][0]} ${textPathPoints[1][1]}`;
				return { x, y, system: toSystem, trianglePath, textPath };
			})
			.filter(isDefined),
	);
</script>

<svg
	{id}
	xmlns="http://www.w3.org/2000/svg"
	xmlns:xlink="http://www.w3.org/1999/xlink"
	viewBox="-500 -500 1000 1000"
	class={!previewMode && !exportMode ? 'h-full w-full' : undefined}
	bind:this={svg}
	x={previewMode ? -500 : undefined}
	y={previewMode ? -500 : undefined}
	width={previewMode ? 1000 : undefined}
>
	<defs>
		<filter id="glow" filterUnits="objectBoundingBox" x="-50%" y="-50%" width="200%" height="200%">
			<feGaussianBlur in="SourceGraphic" stdDeviation="2" />
		</filter>
		<Icons />
	</defs>
	<g bind:this={g}>
		{#if $mapSettings.systemMapOrbitStroke.enabled}
			{#each planets.filter((p) => !isAsteroid(p) && p.orbit > 0) as planet (planet.id)}
				<Glow enabled={$mapSettings.systemMapOrbitStroke.glow}>
					{@const primary = getPrimaryBodies(planet, planets)[0]}
					{@const primaryCoordinate = primary
						? getPlanetCoordinate(primary, planets, $mapSettings)
						: { x: 0, y: 0 }}
					<circle
						cx={primaryCoordinate.x}
						cy={primaryCoordinate.y}
						r={getPlanetOrbitDistance(planet, planets, $mapSettings)}
						fill="none"
						{...getStrokeAttributes($mapSettings.systemMapOrbitStroke)}
						{...getStrokeColorAttributes({
							colors,
							mapSettings: $mapSettings,
							colorStack: [$mapSettings.systemMapOrbitColor],
						})}
					/>
				</Glow>
			{/each}
		{/if}

		{#each system.asteroid_belts as belt}
			{@const centralStar = planets.find((p) => p.coordinate.x === 0 && p.coordinate.y === 0)}
			{@const centralStarR = centralStar ? getPlanetRadius(centralStar, $mapSettings) : 0}
			{@const beltDistance =
				getScaledDistance(belt.inner_radius - centralStarR, $mapSettings) + centralStarR}
			<circle
				fill="none"
				stroke={getBeltColor(belt.type, colors)}
				stroke-width={2 / $mapSettings.systemMapOrbitDistanceExponent}
				stroke-opacity={0.2}
				r={beltDistance}
			/>
			<circle
				fill="none"
				stroke={getBeltColor(belt.type, colors)}
				stroke-width={4 / $mapSettings.systemMapOrbitDistanceExponent}
				stroke-opacity={0.05}
				r={beltDistance + 5 / $mapSettings.systemMapOrbitDistanceExponent}
			/>
			<circle
				fill="none"
				stroke={getBeltColor(belt.type, colors)}
				stroke-width={4 / $mapSettings.systemMapOrbitDistanceExponent}
				stroke-opacity={0.05}
				r={beltDistance - 5 / $mapSettings.systemMapOrbitDistanceExponent}
			/>
			<circle
				fill="none"
				stroke={getBeltColor(belt.type, colors)}
				stroke-width={1 / $mapSettings.systemMapOrbitDistanceExponent}
				stroke-opacity={0.1}
				r={beltDistance + 10 / $mapSettings.systemMapOrbitDistanceExponent}
			/>
			<circle
				fill="none"
				stroke={getBeltColor(belt.type, colors)}
				stroke-width={1 / $mapSettings.systemMapOrbitDistanceExponent}
				stroke-opacity={0.1}
				r={beltDistance - 10 / $mapSettings.systemMapOrbitDistanceExponent}
			/>
		{/each}
		{#each planets as planet (planet.id)}
			{@const coordinate = getPlanetCoordinate(planet, planets, $mapSettings)}
			{#if isStar(planet)}
				<defs>
					<radialGradient id="star-gradient-{planet.id}">
						{#each STAR_GRADIENT_STEPS as step}
							<stop stop-color={getStarGlowColor(planet, colors)} {...step} />
						{/each}
					</radialGradient>
				</defs>
				<circle
					fill="url(#star-gradient-{planet.id})"
					r={getPlanetRadius(planet, $mapSettings) * 4}
					cx={coordinate.x}
					cy={coordinate.y}
				/>
				<circle
					fill={getPlanetColor(planet, colors)}
					r={getPlanetRadius(planet, $mapSettings)}
					cx={coordinate.x}
					cy={coordinate.y}
				/>
			{:else}
				{@const radius = getPlanetRadius(planet, $mapSettings)}
				<circle
					fill={getPlanetColor(planet, colors)}
					r={radius}
					cx={coordinate.x}
					cy={coordinate.y}
				/>
				{#if planet.has_ring}
					{#each PLANET_RING_PATTERN as ring}
						<circle
							cx={coordinate.x}
							cy={coordinate.y}
							fill="none"
							r={radius * ring.radiusMultiplier}
							stroke-width={radius * ring.width}
							{...getStrokeColorAttributes({
								mapSettings: $mapSettings,
								colors,
								colorStack: [multiplyOpacity($mapSettings.systemMapPlanetRingColor, ring.opacity)],
								planetColor: getPlanetColor(planet, colors),
							})}
						/>
					{/each}
				{/if}
			{/if}
		{/each}
		{#each planets.filter((p) => isPlanetarySystemPrimaryBody(p, planets)) as planet (planet.id)}
			{#await pathKitPromise then PathKit}
				{#each getPathKitShadowPath(planet, planets, $mapSettings, PathKit) as d}
					<path {d} fill="#000000" opacity={0.5} />
				{/each}
			{/await}
		{/each}
		{#each planets.filter((p) => isPlanetLabeled(p, $mapSettings)) as planet (planet.id)}
			<defs>
				<path
					id="planetLabelPath{planet.id}"
					{...getPlanetLabelPathAttributes(planet, planets, $mapSettings)}
				/>
			</defs>
			<text
				font-family={$mapSettings.systemMapLabelPlanetsFont}
				font-size={$mapSettings.systemMapLabelPlanetsFontSize}
				fill="#FFFFFF"
			>
				<textPath
					href="#planetLabelPath{planet.id}"
					{...getPlanetLabelTextPathAttributes(planet, $mapSettings)}
				>
					{#await localizeText(planet.name)}
						{$t('generic.loading')}
					{:then planetName}
						{planetName}
					{/await}
				</textPath>
			</text>
		{/each}
		{#each ships as ship (ship.id)}
			<!-- ships are WIP; "disabled" for now by setting opacity="0" -->
			<path
				d="M 0 1 L 0.5 -1 L -0.5 -1 Z"
				transform="translate({-ship.coordinate.x} {ship.coordinate.y}) rotate({(-ship.rotation /
					Math.PI) *
					180})"
				opacity="0"
				{...getFillColorAttributes({
					colors,
					countryColors: ship,
					mapSettings: $mapSettings,
					colorStack: [
						{
							...$mapSettings.borderColor,
							colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.35 }],
						},
					],
				})}
			/>
		{/each}
		{#each fleets as fleet (fleet.id)}
			{@const icon = getFleetIconSetting(fleet, $mapSettings)}
			{@const coordinate = getFleetCoordinate(fleet, planets, $mapSettings)}
			{#if icon.enabled}
				<use
					href="#{icon.icon}"
					x={-icon.size / 2}
					y={-icon.size / 2}
					transform="translate({coordinate.x} {coordinate.y}) rotate({fleet.rotation})"
					width={icon.size}
					height={icon.size}
					{...getFillColorAttributes({
						mapSettings: $mapSettings,
						colors,
						countryColors: fleet,
						colorStack: [icon.color],
					})}
					stroke-width="10"
					{...getStrokeColorAttributes({
						mapSettings: $mapSettings,
						colors,
						colorStack: [$mapSettings.backgroundColor],
					})}
				/>
				{#if $mapSettings.systemMapLabelFleetsEnabled}
					{@const fontSize = $mapSettings.systemMapLabelFleetsFontSize}
					<text
						x={coordinate.x}
						y={coordinate.y}
						text-anchor={match($mapSettings.systemMapLabelFleetsPosition)
							.with('right', () => 'start')
							.with('left', () => 'end')
							.otherwise(() => 'middle')}
						dominant-baseline={match($mapSettings.systemMapLabelFleetsPosition)
							.with('top', () => 'auto')
							.with('bottom', () => 'hanging')
							.otherwise(() => 'middle')}
						transform={match($mapSettings.systemMapLabelFleetsPosition)
							.with('right', () => `translate(${icon.size / 2} 0)`)
							.with('left', () => `translate(${-icon.size / 2} 0)`)
							.with('top', () => `translate(0 ${-icon.size / 2})`)
							.with('bottom', () => `translate(0 ${icon.size / 2})`)
							.otherwise(() => '')}
						font-size={fontSize}
						fill="white"
						font-family={$mapSettings.systemMapLabelPlanetsFont}
					>
						{#await localizeText(fleet.name)}
							{$t('generic.loading')}
						{:then name}
							{name}
						{/await}
					</text>
				{/if}
			{/if}
		{/each}
		{#if $mapSettings.systemMapHyperlanesEnabled}
			{#each systemConnections as connection}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<g
					style={!previewMode && !exportMode ? 'cursor: pointer;' : undefined}
					fill={colors.dark_teal}
					onclick={() => {
						if (previewMode || exportMode) return;
						resetZoom();
						onSystemSelected?.(connection.system);
					}}
				>
					<path d={connection.trianglePath} />
					<defs>
						<path
							id="connectionLabelPath{connection.system.id}"
							pathLength="1"
							d={connection.textPath}
						/>
					</defs>
					<text
						font-family={$mapSettings.systemMapLabelPlanetsFont}
						font-size={$mapSettings.systemMapLabelPlanetsFontSize}
					>
						<textPath
							href="#connectionLabelPath{connection.system.id}"
							startOffset="0.5"
							text-anchor="middle"
							dominant-baseline={connection.y < 0 ? 'hanging' : 'auto'}
						>
							{#await localizeText(connection.system.name)}
								{$t('generic.loading')}
							{:then systemName}
								{systemName}
							{/await}
						</textPath>
					</text>
				</g>
			{/each}
		{/if}
	</g>
</svg>
