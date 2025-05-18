import type { MapSettings } from '../../../settings';
import type { Planet } from '../../../stellaris/GameState.svelte';
import { getPlanetCoordinate, getPlanetOrbitDistance } from './coordinates';
import { getPlanetRadius, getPrimaryBodies, isAsteroid, isColony, isMoon, isStar } from './planets';

export function isPlanetLabeled(planet: Planet, settings: MapSettings) {
	return (
		(isColony(planet) && settings.systemMapLabelColoniesEnabled) ||
		(isStar(planet) && settings.systemMapLabelStarsEnabled) ||
		(isMoon(planet) && settings.systemMapLabelMoonsEnabled) ||
		(isAsteroid(planet) && settings.systemMapLabelAsteroidsEnabled) ||
		(!isStar(planet) &&
			!isMoon(planet) &&
			!isAsteroid(planet) &&
			settings.systemMapLabelPlanetsEnabled)
	);
}

export function getPlanetLabelPathAttributes(
	planet: Planet,
	planets: Planet[],
	settings: MapSettings,
) {
	const r = getPlanetRadius(planet, settings);
	let { x, y } = getPlanetCoordinate(planet, planets, settings);
	let position = settings.systemMapLabelPlanetsPosition;
	if (position === 'orbit' && !planet.orbit) {
		position = settings.systemMapLabelPlanetsFallbackPosition;
	}
	switch (position) {
		case 'top': {
			y -= r + settings.systemMapLabelPlanetsFontSize / 2;
			x -= 500;
			return { d: `M ${x} ${y} h 1000`, pathLength: 1 };
		}
		case 'bottom': {
			y += r + settings.systemMapLabelPlanetsFontSize / 2;
			x -= 500;
			return { d: `M ${x} ${y} h 1000`, pathLength: 1 };
		}
		case 'right': {
			x += r + settings.systemMapLabelPlanetsFontSize / 2;
			return { d: `M ${x} ${y} h 1000`, pathLength: 1 };
		}
		case 'left': {
			x -= r + settings.systemMapLabelPlanetsFontSize / 2 + 1000;
			return { d: `M ${x} ${y} h 1000`, pathLength: 1 };
		}
		case 'orbit': {
			const primaryBody = getPrimaryBodies(planet, planets)[0];
			const { x: cx, y: cy } = primaryBody
				? getPlanetCoordinate(primaryBody, planets, settings)
				: { x: 0, y: 0 };
			const orbitRadius = getPlanetOrbitDistance(planet, planets, settings);
			if (cy > y) {
				return {
					d: `M ${x} ${y} A ${orbitRadius} ${orbitRadius} 0 0 1 ${cx + (cx - x)} ${cy + (cy - y)}`,
				};
			} else {
				return {
					d: `M ${x} ${y} A ${orbitRadius} ${orbitRadius} 0 0 0 ${cx + (cx - x)} ${cy + (cy - y)}`,
				};
			}
		}
		default: {
			throw new Error(`Unhandled label position: ${position}`);
		}
	}
}

export function getPlanetLabelTextPathAttributes(planet: Planet, settings: MapSettings) {
	const r = getPlanetRadius(planet, settings);
	let position = settings.systemMapLabelPlanetsPosition;
	if (position === 'orbit' && !planet.orbit) {
		position = settings.systemMapLabelPlanetsFallbackPosition;
	}
	switch (position) {
		case 'top': {
			return {
				startOffset: 0.5,
				'dominant-baseline': 'auto',
				'text-anchor': 'middle',
			};
		}
		case 'bottom': {
			return {
				startOffset: 0.5,
				'dominant-baseline': 'hanging',
				'text-anchor': 'middle',
			};
		}
		case 'right': {
			return {
				startOffset: 0,
				'dominant-baseline': 'middle',
				'text-anchor': 'start',
			};
		}
		case 'left': {
			return {
				startOffset: 1,
				'dominant-baseline': 'middle',
				'text-anchor': 'end',
			};
		}
		case 'orbit': {
			return {
				startOffset: r + settings.systemMapLabelPlanetsFontSize / 2,
				'dominant-baseline': 'auto',
				'text-anchor': 'start',
			};
		}
		default: {
			throw new Error(`Unhandled label position: ${position}`);
		}
	}
}
