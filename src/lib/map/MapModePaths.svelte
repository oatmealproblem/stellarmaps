<script lang="ts">
	import { mapSettings } from '../settings';
	import { mapModes } from './data/mapModes';
	import type { MapData } from './data/processMapData';
	import { getFillColorAttributes, getStrokeColorAttributes } from './mapUtils';

	interface Props {
		data: MapData;
		colors: Record<string, string>;
	}

	let { data, colors }: Props = $props();

	function getMapModePaths(systems: MapData['systems']) {
		const max = Math.max(...systems.map((s) => s.mapModeTotalValue ?? 0));
		const scale = (100 / max) * (mapModes[mapSettings.current.mapMode]?.system?.scale ?? 1);
		return systems
			.filter((system) => system.mapModeValues?.some((v) => v.directedValues?.size))
			.flatMap((system) => {
				return (
					system.mapModeValues?.flatMap((systemValue) =>
						Array.from(systemValue.directedValues?.entries() ?? []).map(([to, value]) => {
							const toSystem = data.systems.find((s) => s.id === to);
							const angle =
								(Math.atan2((toSystem?.y ?? 0) - system.y, (toSystem?.x ?? 0) - system.x) /
									Math.PI) *
								180;
							const width = Math.max(0.5, Math.sqrt(value * scale));
							const length = Math.hypot(
								(toSystem?.y ?? 0) - system.y,
								(toSystem?.x ?? 0) - system.x,
							);
							const aspectRatio = length / width;
							let numArrows = 10;
							if (aspectRatio > 10) {
								numArrows = 20;
							}
							if (aspectRatio > 20) {
								numArrows = 50;
							}
							if (aspectRatio < 5) {
								numArrows = 5;
							}
							const d = `
								M 0 0
								L 0 ${width}
								L ${length} ${width}
								L ${length} 0
								Z
							`;
							return {
								from: {
									x: system.x,
									y: system.y,
								},
								to: {
									x: toSystem?.x ?? 0,
									y: toSystem?.y ?? 0,
								},
								d,
								numArrows,
								angle,
								width,
								value,
								color: systemValue.color,
							};
						}),
					) ?? []
				);
			});
	}
</script>

<defs>
	<pattern
		id="directed-path-pattern-5"
		viewBox="0 0 10 10"
		preserveAspectRatio="none"
		x="0"
		y="0"
		height="1"
		width="0.2"
	>
		<path d="M 0 0 L 5 0 L 10 5 L 5 10 L 0 10 L 5 5 Z" fill="rgba(0,0,0,0.5)" />
	</pattern>
	<pattern
		id="directed-path-pattern-10"
		viewBox="0 0 10 10"
		preserveAspectRatio="none"
		x="0"
		y="0"
		height="1"
		width="0.1"
	>
		<path d="M 0 0 L 5 0 L 10 5 L 5 10 L 0 10 L 5 5 Z" fill="rgba(0,0,0,0.5)" />
	</pattern>
	<pattern
		id="directed-path-pattern-20"
		viewBox="0 0 10 10"
		preserveAspectRatio="none"
		x="0"
		y="0"
		height="1"
		width="0.05"
	>
		<path d="M 0 0 L 5 0 L 10 5 L 5 10 L 0 10 L 5 5 Z" fill="rgba(0,0,0,0.5)" />
	</pattern>
	<pattern
		id="directed-path-pattern-50"
		viewBox="0 0 10 10"
		preserveAspectRatio="none"
		x="0"
		y="0"
		height="1"
		width="0.02"
	>
		<path d="M 0 0 L 5 0 L 10 5 L 5 10 L 0 10 L 5 5 Z" fill="rgba(0,0,0,0.5)" />
	</pattern>
</defs>
{#each getMapModePaths(data.systems.filter((s) => s.systemIsKnown || !mapSettings.current.terraIncognita)) as path}
	{#if path.value === 0}
		<line
			x1={path.from.x}
			y1={path.from.y}
			x2={path.to.x}
			y2={path.to.y}
			stroke-width="0.5"
			stroke-dasharray="0.5 1"
			{...getStrokeColorAttributes({
				mapSettings: mapSettings.current,
				colors,
				colorStack: [path.color, mapSettings.current.borderFillColor],
			})}
		/>
	{:else}
		<path
			d={path.d}
			transform="translate({path.from.x} {path.from
				.y}) rotate({path.angle}) translate(0 {-path.width / 2})"
			{...getFillColorAttributes({
				mapSettings: mapSettings.current,
				colors,
				colorStack: [path.color, mapSettings.current.borderFillColor],
			})}
		/>
		<path
			d={path.d}
			transform="translate({path.from.x} {path.from
				.y}) rotate({path.angle}) translate(0 {-path.width / 2})"
			fill="url(#directed-path-pattern-{path.numArrows})"
		/>
	{/if}
{/each}
