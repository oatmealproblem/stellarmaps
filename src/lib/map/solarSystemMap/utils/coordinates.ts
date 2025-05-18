import type { MapSettings } from '../../../settings';
import type { Planet } from '../../../stellaris/GameState.svelte';
import { getPlanetRadius, getPrimaryBodies } from './planets';

export function getScaledDistance(unscaledDistance: number, settings: MapSettings) {
	const exponent = settings.systemMapOrbitDistanceExponent;
	return (unscaledDistance ** exponent / 400 ** exponent) * 400;
}

function getScaledCoordinate(
	coordinate: { x: number; y: number },
	relativeTo: { x: number; y: number; r: number }[],
	settings: MapSettings,
): { x: number; y: number } {
	const unscaledDistance = Math.hypot(
		coordinate.x - (relativeTo[0]?.x ?? 0),
		coordinate.y - (relativeTo[0]?.y ?? 0),
	);
	const scaledDistance =
		(relativeTo[0]?.r ?? 0) +
		getScaledDistance(unscaledDistance - (relativeTo[0]?.r ?? 0), settings);
	const theta = Math.atan2(
		coordinate.y - (relativeTo[0]?.y ?? 0),
		coordinate.x - (relativeTo[0]?.x ?? 0),
	);
	const scaledRelativeTo = relativeTo[0]
		? getScaledCoordinate(relativeTo[0], relativeTo.slice(1), settings)
		: { x: 0, y: 0 };
	const x = scaledRelativeTo.x + Math.cos(theta) * scaledDistance;
	const y = scaledRelativeTo.y + Math.sin(theta) * scaledDistance;
	return { x, y };
}

function flipX<T extends { x: number; y: number }>(coordinate: T): T {
	return { ...coordinate, x: -coordinate.x };
}

export function getFleetCoordinate(
	fleet: { coordinate: { x: number; y: number } },
	planets: Planet[],
	settings: MapSettings,
) {
	const closestPlanet = planets.toSorted(
		(a, b) =>
			(-a.coordinate.x - fleet.coordinate.x) ** 2 +
			(a.coordinate.y - fleet.coordinate.y) ** 2 -
			(-b.coordinate.x - fleet.coordinate.x) ** 2 -
			(b.coordinate.y - fleet.coordinate.y) ** 2,
	)[0];
	return getScaledCoordinate(
		fleet.coordinate,
		closestPlanet
			? [closestPlanet, ...getPrimaryBodies(closestPlanet, planets)].map((p) => ({
					...flipX(p.coordinate),
					r: getPlanetRadius(p, settings),
				}))
			: [],
		settings,
	);
}

export function getPlanetCoordinate(planet: Planet, planets: Planet[], settings: MapSettings) {
	return getScaledCoordinate(
		flipX(planet.coordinate),
		getPrimaryBodies(planet, planets).map((p) => ({
			...flipX(p.coordinate),
			r: getPlanetRadius(p, settings),
		})),
		settings,
	);
}

export function getPlanetOrbitDistance(planet: Planet, planets: Planet[], settings: MapSettings) {
	const primary = getPrimaryBodies(planet, planets)[0];
	const primaryR = primary ? getPlanetRadius(primary, settings) : 0;
	const unscaledDistance = Math.hypot(
		planet.coordinate.x - (primary?.coordinate.x ?? 0),
		planet.coordinate.y - (primary?.coordinate.y ?? 0),
	);
	const scaledDistance = primaryR + getScaledDistance(unscaledDistance - primaryR, settings);
	return scaledDistance;
}
