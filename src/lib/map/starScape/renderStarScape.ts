import 'pixi.js/app';
import 'pixi.js/filters';
import 'pixi.js/graphics';
import 'pixi.js/unsafe-eval';

import alea from 'alea';
import { rgb } from 'd3-color';
import * as PIXI from 'pixi.js';
import * as R from 'rambda';

import type { GameState } from '../../GameState.svelte';
import type { ColorSetting, MapSettings } from '../../settings';
import { isDefined } from '../../utils';
import { resolveColor } from '../mapUtils';
import shaderString from './noiseShader.glsl?raw';

interface Layer {
	color: string;
	opacity: number;
	radius: number;
	blur: number;
	sourceCoordinates: ([number, number] | [number, number])[];
	octaves: number;
	scale: number;
	gain?: number;
	lacunarity?: number;
	min?: number;
	max?: number;
}

const canvas = document.createElement('canvas');
const app = new PIXI.Application();
const initPromise = app.init({
	canvas,
	width: 1000,
	height: 1000,
	antialias: true,
	backgroundAlpha: 0,
	preference: 'webgl',
	autoStart: false,
	manageImports: false,
});

function getStarTexture(layer: Layer, outputRatio: number) {
	const innerRadius = Math.ceil(layer.radius * outputRatio);
	const outerRadius = Math.ceil((layer.radius + layer.blur) * outputRatio);
	const canvas = document.createElement('canvas');
	canvas.width = outerRadius * 2;
	canvas.height = outerRadius * 2;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('no 2d context');
	const gradient = ctx.createRadialGradient(
		outerRadius,
		outerRadius,
		innerRadius,
		outerRadius,
		outerRadius,
		outerRadius,
	);
	gradient.addColorStop(0, layer.color);
	const transparent50 = rgb(layer.color);
	transparent50.opacity *= 0.5;
	gradient.addColorStop(0.01, transparent50.formatRgb());
	const transparent = rgb(layer.color);
	transparent.opacity = 0;
	gradient.addColorStop(1, transparent.formatRgb());
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, outerRadius * 2, outerRadius * 2);
	return PIXI.Texture.from(canvas);
}

function getCircleGradientTexture(
	layer: Layer,
	outputRatio: number,
	galaxySizeRadiusAdjustment: number,
) {
	const innerRadius = Math.ceil(layer.radius * outputRatio * galaxySizeRadiusAdjustment);
	const outerRadius = Math.ceil(
		(layer.radius + layer.blur) * outputRatio * galaxySizeRadiusAdjustment,
	);
	const canvas = document.createElement('canvas');
	canvas.width = outerRadius * 2;
	canvas.height = outerRadius * 2;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('no 2d context');
	const gradient = ctx.createRadialGradient(
		outerRadius,
		outerRadius,
		innerRadius,
		outerRadius,
		outerRadius,
		outerRadius,
	);
	gradient.addColorStop(0, layer.color);
	const transparent = rgb(layer.color);
	transparent.opacity = 0;
	gradient.addColorStop(1, transparent.formatRgb());
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, outerRadius * 2, outerRadius * 2);
	return PIXI.Texture.from(canvas);
}

const spritePool: PIXI.Sprite[] = [];

export default async function renderStarScape(
	gameState: GameState,
	settings: MapSettings,
	colors: Record<string, string>,
	viewBox: { left: number; top: number; width: number; height: number } = {
		left: -500,
		top: -500,
		width: 1000,
		height: 1000,
	},
	output: { width: number; height: number } = { width: 1000, height: 1000 },
) {
	const textures: PIXI.Texture[] = [];
	const sprites: PIXI.Sprite[] = [];
	await initPromise;
	const outputRatio = output.width / viewBox.width;

	function mapCoordToCanvasCoord(x: number, y: number): [number, number] {
		return [
			((-x - viewBox.left) * output.width) / viewBox.width,
			((y - viewBox.top) * output.height) / viewBox.height,
		];
	}

	function getDistanceFromStage([x, y]: [number, number]): number {
		return Math.max(-x, -y, x - output.width, y - output.height);
	}

	const systemCoords = Object.values(gameState.galactic_object).map((system) =>
		mapCoordToCanvasCoord(system.coordinate.x, system.coordinate.y),
	);

	const nebulaCoords = gameState.nebula.flatMap((nebula) =>
		nebula.galactic_object
			.map((system) => gameState.galactic_object[system])
			.filter(isDefined)
			.map((system) => mapCoordToCanvasCoord(system.coordinate.x, system.coordinate.y)),
	);

	const layers: Layer[] = [
		// dust
		...(settings.starScapeDust
			? [
					{
						color: resolveColor({
							mapSettings: settings,
							colors,
							colorStack: [settings.starScapeDustColor],
						}),
						opacity: getOpacity(settings.starScapeDustColor),
						radius: 0,
						blur: 30,
						scale: 1 / 32,
						octaves: 6,
						gain: 0.75,
						min: 0.05,
						sourceCoordinates: systemCoords,
					},
				]
			: []),
		// stars
		...(settings.starScapeStars
			? [
					{
						color: resolveColor({
							mapSettings: settings,
							colors,
							colorStack: [settings.starScapeStarsColor],
						}),
						opacity: getOpacity(settings.starScapeStarsColor),
						radius: 1,
						blur: 2,
						octaves: -1,
						scale: -1,
						sourceCoordinates: systemCoords,
					},
				]
			: []),
		// core
		...(settings.starScapeCore
			? [
					{
						color: resolveColor({
							mapSettings: settings,
							colors,
							colorStack: [removeOpacity(settings.starScapeCoreColor)],
						}),
						opacity: getOpacity(settings.starScapeCoreColor),
						radius: gameState.galaxy.core_radius * 0.5,
						blur: gameState.galaxy.core_radius,
						scale: 4,
						octaves: 1,
						min: 1,
						sourceCoordinates: [mapCoordToCanvasCoord(0, 0)],
					},
					// core highlights
					{
						color: resolveColor({
							mapSettings: settings,
							colors,
							colorStack: [removeOpacity(settings.starScapeCoreAccentColor)],
						}),
						opacity: getOpacity(settings.starScapeCoreAccentColor),
						radius: gameState.galaxy.core_radius * 0.5,
						blur: gameState.galaxy.core_radius * 0.6,
						scale: 1 / 32,
						octaves: 4,
						min: 0,
						sourceCoordinates: [mapCoordToCanvasCoord(0, 0)],
					},
				]
			: []),
		// nebula
		...(settings.starScapeNebula
			? [
					{
						color: resolveColor({
							mapSettings: settings,
							colors,
							colorStack: [removeOpacity(settings.starScapeNebulaColor)],
						}),
						opacity: getOpacity(settings.starScapeNebulaColor),
						radius: 0,
						blur: 20,
						scale: 1 / 16,
						octaves: 12,
						gain: 0.75,
						min: 0,
						sourceCoordinates: nebulaCoords,
					},
					// nebula highlights
					{
						color: resolveColor({
							mapSettings: settings,
							colors,
							colorStack: [removeOpacity(settings.starScapeNebulaAccentColor)],
						}),
						opacity: getOpacity(settings.starScapeNebulaAccentColor),
						radius: 0,
						blur: 20,
						scale: 1 / 8,
						octaves: 12,
						gain: 0.5,
						min: -0.25,
						sourceCoordinates: nebulaCoords,
					},
				]
			: []),
	];

	const galaxySizeRadiusAdjustment = Math.sqrt(
		1000 / Object.keys(gameState.galactic_object).length,
	);
	app.renderer.resize(output.width, output.height);
	app.stage.removeChildren();
	for (const layer of layers) {
		const isStarLayer = layer.octaves === -1;
		const c = new PIXI.Color(layer.color);
		c.premultiply(layer.opacity);
		c.setAlpha(layer.opacity);
		const container = new PIXI.Container();
		if (isStarLayer) {
			const rng = alea(0);
			const texture = getStarTexture(layer, outputRatio);
			textures.push(texture);
			for (let i = 0; i < (settings.starScapeStarsCount ?? 0); i++) {
				const origin = layer.sourceCoordinates[Math.floor(rng() * layer.sourceCoordinates.length)];
				if (!origin) continue;
				const distance = (rng() * 20 + 5) * outputRatio;
				const angle = rng() * 2 * Math.PI;
				const dx = Math.cos(angle) * distance;
				const dy = Math.sin(angle) * distance;
				const cx = origin[0] + dx;
				const cy = origin[1] + dy;
				const scale = (0.5 + rng() * 0.5) / (layer.radius * 4);
				if (getDistanceFromStage([cx, cy]) <= 5) {
					const sprite = spritePool.pop() ?? PIXI.Sprite.from(texture);
					sprite.texture = texture;
					sprites.push(sprite);
					sprite.anchor = 0.5;
					sprite.x = cx;
					sprite.y = cy;
					sprite.scale = {
						x: scale,
						y: scale,
					};
					container.addChild(sprite);
				}
			}
		} else {
			const gradientTexture = getCircleGradientTexture(
				layer,
				outputRatio,
				galaxySizeRadiusAdjustment,
			);
			textures.push(gradientTexture);

			const radiusPlusBur = (layer.radius + layer.blur) * outputRatio * galaxySizeRadiusAdjustment;

			for (const [cx, cy] of layer.sourceCoordinates.filter(
				(p) => getDistanceFromStage(p) < radiusPlusBur,
			)) {
				const sprite = spritePool.pop() ?? new PIXI.Sprite();
				sprite.texture = gradientTexture;
				sprites.push(sprite);
				sprite.anchor = 0.5;
				sprite.x = cx;
				sprite.y = cy;
				sprite.scale = { x: 1, y: 1 };
				container.addChild(sprite);
			}

			const cloudFilter = PIXI.Filter.from({
				gl: {
					name: 'CloudFilter',
					vertex: PIXI.defaultFilterVert,
					fragment: shaderString.replace('$OCTAVES$', layer.octaves.toFixed(1)),
				},
				resources: {
					filterUniforms: new PIXI.UniformGroup({
						uScale: { type: 'f32', value: layer.scale },
						uNormalization: {
							type: 'f32',
							value:
								1 /
								R.range(0, layer.octaves).reduce((acc, cur) => acc + (layer.gain ?? 0.5) ** cur, 0),
						},
						uGain: { type: 'f32', value: layer.gain ?? 0.5 },
						uLacunarity: { type: 'f32', value: layer.lacunarity ?? 2.0 },
						uMin: { type: 'f32', value: layer.min ?? 0 },
						uMax: { type: 'f32', value: layer.max ?? 1 },
						uViewBoxLeft: { type: 'f32', value: viewBox.left },
						uViewBoxTop: { type: 'f32', value: viewBox.top },
						uViewBoxWidth: { type: 'f32', value: viewBox.width },
						uViewBoxHeight: { type: 'f32', value: viewBox.height },
						uOutputWidth: { type: 'f32', value: output.width },
						uOutputHeight: { type: 'f32', value: output.height },
					}),
				},
			});
			container.filterArea = new PIXI.Rectangle(0, 0, output.width, output.height);
			container.filters = [cloudFilter];
		}
		app.stage.addChild(container);
	}
	app.render();

	const dataUrl = canvas.toDataURL();

	for (const child of app.stage.children) {
		child.filters = [];
		child.removeFromParent();
		child.destroy();
	}
	for (const sprite of sprites) {
		spritePool.push(sprite);
	}
	for (const texture of textures) {
		texture.destroy(true);
	}

	return dataUrl;
}

function removeOpacity(color: ColorSetting): ColorSetting {
	return {
		...color,
		colorAdjustments: color.colorAdjustments.filter((a) => a.type !== 'OPACITY'),
	};
}

function getOpacity(color: ColorSetting): number {
	return color.colorAdjustments.find((a) => a.type === 'OPACITY')?.value ?? 1;
}
