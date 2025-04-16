import type { PathKit } from 'pathkit-wasm/bin/pathkit';

import type { Planet } from '../../../GameState.svelte';
import type { MapSettings } from '../../../settings';
import { getPlanetCoordinate } from './coordinates';
import { getPlanetRadius, getPlanetStar, PLANET_RING_PATTERN } from './planets';

export function getPathKitShadowPath(
	planet: Planet,
	planets: Planet[],
	settings: MapSettings,
	PathKit: PathKit,
) {
	const overlapPaths = [];
	const moons = planets.filter((p) => p.moon_of === planet.id);

	const shadow = PathKit.FromSVGString(getPlanetCastShadowPath(planet, planets, settings));
	for (const moon of moons) {
		const moonShadow = PathKit.FromSVGString(getPlanetCastShadowPath(moon, planets, settings));
		shadow.op(moonShadow, PathKit.PathOp.UNION);
	}

	const shadowed = PathKit.NewPath();

	if (settings.systemMapPlanetShadowRings && planet.has_ring) {
		const { x, y } = getPlanetCoordinate(planet, planets, settings);
		const planetR = getPlanetRadius(planet, settings);
		const innerRing = PLANET_RING_PATTERN.find((p) => p.opacity > 0);
		const innerRingR = innerRing
			? innerRing.radiusMultiplier * planetR - (innerRing.width * planetR) / 2
			: 0;
		const outerRing = PLANET_RING_PATTERN.at(-1);
		const outerRingR = outerRing
			? outerRing.radiusMultiplier * planetR + (outerRing.width * planetR) / 2
			: 0;
		const ring = PathKit.NewPath();
		ring.arc(x, y, outerRingR, 0, Math.PI * 2);
		const inner = PathKit.NewPath();
		inner.arc(x, y, innerRingR, 0, Math.PI * 2);
		ring.op(inner, PathKit.PathOp.DIFFERENCE);
		shadowed.op(ring, PathKit.PathOp.UNION);
		ring.delete();
		inner.delete();
	}

	// we don't planets casting on each other, so clear out the those shadows
	// but keep any intersection of those shadows with the ring (the only thing in shadowed currently)
	if (!settings.systemMapPlanetShadowPlanetarySystem) {
		shadow.op(shadowed, PathKit.PathOp.INTERSECT);
	}

	for (const p of [planet, ...moons]) {
		if (settings.systemMapPlanetShadowSelf) {
			const planetSelfShadowPath = PathKit.FromSVGString(
				getPlanetSelfShadowPath(p, planets, settings),
			);
			if (settings.systemMapPlanetShadowOverlap) {
				const overlap = PathKit.MakeFromOp(planetSelfShadowPath, shadow, PathKit.PathOp.INTERSECT);
				overlapPaths.push(overlap.toSVGString());
				overlap.delete();
			}
			shadow.op(planetSelfShadowPath, PathKit.PathOp.UNION);
			planetSelfShadowPath.delete();
		}

		const { x, y } = getPlanetCoordinate(p, planets, settings);
		const r = getPlanetRadius(p, settings);
		const planetPath = PathKit.NewPath();
		planetPath.arc(x, y, r, 0, Math.PI * 2);
		shadowed.op(planetPath, PathKit.PathOp.UNION);
		planetPath.delete();
	}

	const combined = PathKit.MakeFromOp(shadow, shadowed, PathKit.PathOp.INTERSECT);
	const svgString = combined.toSVGString();
	shadow.delete();
	shadowed.delete();
	combined.delete();

	return [svgString, ...overlapPaths];
}

function getPlanetSelfShadowPath(planet: Planet, planets: Planet[], settings: MapSettings) {
	const { x, y } = getPlanetCoordinate(planet, planets, settings);
	const star = getPlanetStar(planet, planets);
	const starCoordinate = star ? getPlanetCoordinate(star, planets, settings) : { x: 0, y: 0 };
	const theta = Math.atan2(y - starCoordinate.y, x - starCoordinate.x);
	const perpendicular = theta + Math.PI / 2;
	const r = getPlanetRadius(planet, settings);
	const p1 = {
		x: x + Math.cos(perpendicular) * r,
		y: y + Math.sin(perpendicular) * r,
	};
	const p2 = {
		x: x - Math.cos(perpendicular) * r,
		y: y - Math.sin(perpendicular) * r,
	};
	return `
    M ${p1.x} ${p1.y}
    A ${r} ${r} 0 0 0 ${p2.x} ${p2.y}
    A ${r * 1.125} ${r * 1.125} 0 0 1 ${p1.x} ${p1.y}
    Z
  `;
}

function getPlanetCastShadowPath(planet: Planet, planets: Planet[], settings: MapSettings) {
	const { x, y } = getPlanetCoordinate(planet, planets, settings);
	const star = getPlanetStar(planet, planets);
	const starCoordinate = star ? getPlanetCoordinate(star, planets, settings) : { x: 0, y: 0 };
	const theta = Math.atan2(y - starCoordinate.y, x - starCoordinate.x);
	const perpendicular = theta + Math.PI / 2;
	const r = getPlanetRadius(planet, settings);
	const p1 = {
		x: x + Math.cos(perpendicular) * r,
		y: y + Math.sin(perpendicular) * r,
	};
	const p2 = {
		x: x - Math.cos(perpendicular) * r,
		y: y - Math.sin(perpendicular) * r,
	};
	const p3 = {
		x: p2.x + Math.cos(theta) * 1000,
		y: p2.y + Math.sin(theta) * 1000,
	};
	const p4 = {
		x: p1.x + Math.cos(theta) * 1000,
		y: p1.y + Math.sin(theta) * 1000,
	};
	return `
    M ${p1.x} ${p1.y}
    A ${r} ${r} 0 0 0 ${p2.x} ${p2.y}
    L ${p3.x} ${p3.y}
    L ${p4.x} ${p4.y}
    Z
  `;
}
