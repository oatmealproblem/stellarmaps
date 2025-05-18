import { scalePow } from 'd3-scale';

import type { MapSettings } from '../../../settings';
import type { Planet } from '../../../stellaris/GameState.svelte';

export function isAsteroid(planet: Planet) {
	return planet.planet_class.includes('asteroid');
}

export function isStar(planet: Planet) {
	return (
		isBlackHole(planet) ||
		planet.planet_class.includes('star') ||
		planet.planet_class === 'pc_pulsar' ||
		planet.planet_class === 'pc_collapsar' ||
		planet.planet_class === 'pc_nova_1' ||
		planet.planet_class === 'nova_2'
	);
}

export function isBlackHole(planet: Planet) {
	return planet.planet_class.includes('black_hole');
}

export function isColony(planet: Planet) {
	return planet.owner != null;
}

export function isMoon(planet: Planet) {
	return Boolean(planet.is_moon);
}

/**
 * Finds Stellaris "planets" that aren't actually planets (or moons/stars)
 * @param planet
 * @returns
 */
export function isFakePlanet(planet: Planet) {
	return planet.planet_class === 'pc_gpm_res'; // Guill's Planet Modifiers "Resource Site"
}

export function getPlanetRadius(planet: Planet, settings: MapSettings) {
	return Math.sqrt(
		planet.planet_size *
			(!isMoon(planet) && !isStar(planet) ? (settings.systemMapPlanetScale ?? 1) : 1) *
			(isStar(planet) ? (settings.systemMapStarScale ?? 1) : 1) *
			(isMoon(planet) ? (settings.systemMapMoonScale ?? 1) : 1),
	);
}

export function getPlanetStar(planet: Planet, planets: Planet[]) {
	return getPrimaryBodies(planet, planets).find(isStar);
}

export function isPlanetarySystemPrimaryBody(planet: Planet, planets: Planet[]) {
	if (isStar(planet)) return false;
	const primary = getPrimaryBodies(planet, planets)[0];
	if (primary && !isStar(primary)) return false;
	return true;
}

export function getPrimaryBodies(planet: Planet, planets: Planet[]) {
	const primaryBodies: Planet[] = [];
	let done = false;
	let planetToCheck: Planet = planet;
	while (!done) {
		let primaryBody = planets.find((p) => p.id === planetToCheck.moon_of);
		if (!primaryBody && !(planetToCheck.coordinate.x === 0 && planetToCheck.coordinate.y === 0)) {
			primaryBody = planets.find((p) => p.coordinate.x === 0 && p.coordinate.y === 0);
		}
		if (primaryBody) {
			primaryBodies.push(primaryBody);
			planetToCheck = primaryBody;
		} else {
			done = true;
		}
	}
	return primaryBodies;
}

export const PLANET_RING_PATTERN = (
	[
		[0.3, 0],
		[0.05, 0.05],
		[0.3, 0.15],
		[0.1, 0.5],
		[0.1, 1],
		[0.02, 0.5],
		[0.1, 1],
		[0.1, 0.5],
		[0.05, 0],
		[0.2, 0.3],
		[0.02, 0],
		[0.05, 0.5],
	] as [number, number][]
).map(([width, opacity], index, array) => {
	const radiusMultiplier =
		array.slice(0, index).reduce((total, [curWidth]) => total + curWidth, 0) + 1 + width / 2;
	return { width, opacity, radiusMultiplier };
});

function getStarGradientSteps({
	startOffset,
	startOpacity,
	numSteps,
	exponent,
}: {
	startOffset: number;
	startOpacity: number;
	numSteps: number;
	exponent: number;
}): { offset: string; 'stop-opacity': number }[] {
	const results: ReturnType<typeof getStarGradientSteps> = [];
	const scale = scalePow([0, 100 - startOffset], [startOpacity, 0]).exponent(exponent);
	for (let i = 0; i <= numSteps; i++) {
		const offset = startOffset + (i / numSteps) * (100 - startOffset);
		results.push({ offset: `${offset}%`, 'stop-opacity': scale(offset - startOffset) });
	}
	return results;
}
export const STAR_GRADIENT_STEPS = getStarGradientSteps({
	startOffset: 25,
	startOpacity: 0.32,
	numSteps: 32,
	exponent: 0.25,
});
