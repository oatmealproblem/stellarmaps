import * as turf from '@turf/turf';
import { Predicate, Record } from 'effect';

import type { FactionId, Sector, SectorId, Snapshot, SystemId } from '$lib/project/snapshot';

import type { MapSettings } from '../../settings';
import { getOrDefault, getOrSetDefault } from '../../utils';
import { getCountryMapModeInfo } from './mapModes';
import type processCircularGalaxyBorders from './processCircularGalaxyBorder';
import type { BorderCircle } from './processCircularGalaxyBorder';
import type processSystemOwnership from './processSystemOwnership';
import type processTerraIncognita from './processTerraIncognita';
import { getSmoothedPosition, smoothGeojson } from './smoothing';
import {
	applyGalaxyBoundary,
	createHyperlanePaths,
	getAllPositionArrays,
	getPolygons,
	getSharedDistancePercent,
	getUnionLeaderId,
	makeBorderCircleGeojson,
	multiPolygonToPath,
	pointToGeoJSON,
	type PolygonalFeature,
	positionToString,
	SCALE,
	segmentToPath,
} from './utils';

export interface SectorBorderPath {
	path: string;
	type: 'standard' | 'union' | 'core' | 'frontier';
}

interface SectorBorderSegment {
	sectors: Set<Sector>;
	positions: GeoJSON.Position[];
}

export const processBordersDeps = [
	'unionMode',
	'unionFederations',
	'unionHegemonies',
	'unionSubjects',
	'unionFederationsColor',
	'hyperlaneMetroStyle',
	'borderStroke',
	'unionBorderStroke',
	'sectorTypeBorderStyles',
	'sectorBorderStroke',
	'sectorCoreBorderStroke',
	'sectorFrontierBorderStroke',
	'mapMode',
	'mapModePointOfView',
	'borderGap',
] satisfies (keyof MapSettings)[];

export default function processBorders(
	snapshot: Snapshot,
	settings: Pick<MapSettings, (typeof processBordersDeps)[number]>,
	unionLeaderToGeojson: Record<FactionId, PolygonalFeature>,
	countryToGeojson: Record<FactionId, PolygonalFeature>,
	sectorToGeojson: Record<SectorId, PolygonalFeature>,
	unionLeaderToUnionMembers: ReturnType<typeof processSystemOwnership>['unionLeaderToUnionMembers'],
	unionLeaderToSystemIds: Record<FactionId, Set<SystemId>>,
	countryToOwnedSystemIds: Record<FactionId, Set<SystemId>>,
	systemIdToUnionLeader: ReturnType<typeof processSystemOwnership>['systemIdToUnionLeader'],
	knownCountries: ReturnType<typeof processTerraIncognita>['knownCountries'],
	galaxyBorderCircles: BorderCircle[],
	galaxyBorderCirclesGeoJSON: ReturnType<
		typeof processCircularGalaxyBorders
	>['galaxyBorderCirclesGeoJSON'],
	getSystemCoordinates: (id: SystemId) => [number, number],
) {
	const unassignedFragments: [FactionId, GeoJSON.Feature<GeoJSON.Polygon>][] = [];
	const borders = Record.toEntries(unionLeaderToGeojson)
		.map(([countryId, outerBorderGeoJSON]) => {
			const mapModeInfo = getCountryMapModeInfo(countryId, snapshot, settings);

			const countrySectors = Object.values(snapshot.sectors).filter(
				(sector) =>
					getUnionLeaderId(sector.factionId, snapshot, settings, ['joinedBorders']) === countryId,
			);

			const sectorOuterPolygons = countrySectors
				.map((sector) => sectorToGeojson[sector.id])
				.filter(Predicate.isNotNullable);

			const lineStringToSectors: Record<string, Set<Sector>> = {};
			countrySectors.forEach((sector, i) => {
				const polygon = sectorOuterPolygons[i];
				if (!polygon) return;
				getAllPositionArrays(polygon).forEach((positionArray) =>
					positionArray.forEach((p, i) => {
						const nextPosition = positionArray[(i + 1) % positionArray.length] as GeoJSON.Position;
						const borderLine = [positionToString(p), positionToString(nextPosition)]
							.sort()
							.join(',');
						getOrSetDefault(lineStringToSectors, borderLine, new Set()).add(sector);
					}),
				);
			});

			const allBorderPoints: Set<string> = new Set(
				turf.coordAll(outerBorderGeoJSON).map((coord) => positionToString(coord)),
			);
			const sectorOuterPoints: Set<string>[] = sectorOuterPolygons.map(
				(p) => new Set(turf.coordAll(p).map((coord) => positionToString(coord))),
			);
			// include all border lines in this, so we don't draw sectors border where there is already an external border
			const addedSectorLines: Set<string> = new Set(
				getAllPositionArrays(outerBorderGeoJSON)
					.map((positionArray) =>
						positionArray.map((p, i) => {
							const isLastPos = i === positionArray.length - 1;
							const nextPosition = positionArray[
								(i + (isLastPos ? 2 : 1)) % positionArray.length
							] as GeoJSON.Position;
							return [positionToString(p), positionToString(nextPosition)].sort().join(',');
						}),
					)
					.flat(),
			);
			const sectorSegments: SectorBorderSegment[] = [];
			sectorOuterPolygons.flatMap(getAllPositionArrays).forEach((sectorRing, sectorIndex) => {
				let currentSegment: SectorBorderSegment = { sectors: new Set(), positions: [] };
				const firstSegment = currentSegment;
				sectorRing.forEach((pos, posIndex, posArray) => {
					const posString = positionToString(pos);
					const posIsLast = posIndex === posArray.length - 1;
					const posSharedSectors = sectorOuterPolygons
						.map((s, i) => i)
						.filter(
							(otherSectorIndex) =>
								otherSectorIndex !== sectorIndex &&
								sectorOuterPoints[otherSectorIndex]?.has(posString),
						);

					const nextPosIndex = (posIndex + (posIsLast ? 2 : 1)) % posArray.length;
					const nextPos = posArray[nextPosIndex] as GeoJSON.Position;
					const nextPosString = positionToString(nextPos);

					const nextLineString = [posString, nextPosString].sort().join(',');

					if (currentSegment.positions.length) {
						currentSegment.positions.push(pos);
						if (currentSegment.positions.length >= 2) {
							const newLineString = currentSegment.positions
								.slice(currentSegment.positions.length - 2, currentSegment.positions.length)
								.map(positionToString)
								.sort()
								.join(',');
							for (const sector of lineStringToSectors[newLineString] ?? []) {
								currentSegment.sectors.add(sector);
							}
							addedSectorLines.add(newLineString);
						}
						// close up segment if
						// shared by 2+ other sectors
						// or next line already added by other segment (or external border)
						if (
							posSharedSectors.length >= 2 ||
							(!posIsLast && addedSectorLines.has(nextLineString))
						) {
							sectorSegments.push(currentSegment);
							currentSegment = { sectors: new Set(), positions: [] };
						}
					}

					if (!currentSegment.positions.length) {
						// no current segment
						// start a new segment, unless next segment already added
						if (!addedSectorLines.has(nextLineString)) {
							currentSegment.positions.push(pos);
						}
					}

					// we've come full circle
					if (
						currentSegment.positions.length &&
						posIsLast &&
						firstSegment.positions[0] != null &&
						positionToString(firstSegment.positions[0]) === posString &&
						firstSegment !== currentSegment
					) {
						// last segment joins up with first segment
						currentSegment.positions.pop(); // drop the duplicate point
						firstSegment.positions.unshift(...currentSegment.positions); // insert into start of firstSegment
						for (const sector of currentSegment.sectors) {
							firstSegment.sectors.add(sector);
						}
						currentSegment = { sectors: new Set(), positions: [] }; // clear currentSegment
					}
				});
				// push last segment
				if (currentSegment.positions.length) {
					sectorSegments.push(currentSegment);
				}
			});
			// make sure there are no 0 or 1 length segments
			const nonEmptySectorSegments = sectorSegments.filter(
				(
					segment,
				): segment is {
					sectors: Set<Sector>;
					positions: [GeoJSON.Position, GeoJSON.Position, ...GeoJSON.Position[]];
				} => segment.positions.length > 1,
			);
			// extend segments at border, so they reach the border (border can shift from smoothing in next step)
			if (settings.borderStroke.smoothing) {
				nonEmptySectorSegments.forEach((segment) => {
					if (allBorderPoints.has(positionToString(segment.positions[0]))) {
						segment.positions[0] = getSmoothedPosition(segment.positions[0], outerBorderGeoJSON);
					}
					if (allBorderPoints.has(positionToString(segment.positions.at(-1) as GeoJSON.Position))) {
						segment.positions[segment.positions.length - 1] = getSmoothedPosition(
							segment.positions[segment.positions.length - 1] as GeoJSON.Position,
							outerBorderGeoJSON,
						);
					}
				});
			}

			let boundedOuterBorderGeoJSON = applyGalaxyBoundary(
				outerBorderGeoJSON,
				galaxyBorderCirclesGeoJSON,
			);

			if (galaxyBorderCirclesGeoJSON) {
				const fragments: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
				for (const polygon of getPolygons(boundedOuterBorderGeoJSON)) {
					const systems = new Set(
						Array.from(unionLeaderToSystemIds[countryId] ?? []).filter((systemId) => {
							const coordinate = getSystemCoordinates(systemId);
							const point = turf.point(pointToGeoJSON(coordinate));
							return turf.booleanPointInPolygon(point, polygon);
						}),
					);
					if (systems.size === 0) {
						fragments.push(polygon);
						unassignedFragments.push([countryId, polygon]);
					} else {
						const circles = galaxyBorderCircles.filter((c) => {
							if (c.type !== 'outer-padded' && c.type !== 'outlier') return false;
							if (systems.size < c.systems.size) {
								return Array.from(systems).some((id) => c.systems.has(id));
							} else {
								return Array.from(c.systems).some((id) => systems.has(id));
							}
						});
						const outerCircles = circles.filter((c) => c.type === 'outer-padded');
						if (outerCircles.length === 1 && !outerCircles[0]?.isMainCluster) {
							// all stars in this polygon belong to a non-main cluster
							// try to find fragments outside of it's cluster's bounds
							const bounds = circles.reduce<PolygonalFeature | null>((acc, cur) => {
								const geojson = makeBorderCircleGeojson(snapshot, getSystemCoordinates, cur);
								if (acc == null) return geojson;
								if (geojson == null) return acc;
								return turf.union(turf.featureCollection([acc, geojson]));
							}, null);
							const outOfBounds =
								bounds == null ? null : turf.difference(turf.featureCollection([polygon, bounds]));
							fragments.push(...getPolygons(outOfBounds));
							unassignedFragments.push(
								...getPolygons(outOfBounds).map<(typeof unassignedFragments)[number]>((geojson) => [
									countryId,
									geojson,
								]),
							);
						}
					}
				}
				for (const fragment of fragments) {
					boundedOuterBorderGeoJSON =
						boundedOuterBorderGeoJSON == null
							? null
							: turf.difference(turf.featureCollection([boundedOuterBorderGeoJSON, fragment]));
				}
			}

			const { hyperlanesPath, relayHyperlanesPath } = createHyperlanePaths(
				snapshot,
				settings,
				systemIdToUnionLeader,
				countryId,
				getSystemCoordinates,
			);

			return {
				countryId,
				...mapModeInfo,
				outerPath: '', // we need to wait for these, because fragments might need to be assigned
				innerPath: '', // we need to wait for these, because fragments might need to be assigned
				borderPath: '', // we need to wait for these, because fragments might need to be assigned
				geojson: boundedOuterBorderGeoJSON,
				hyperlanesPath,
				relayHyperlanesPath,
				sectorBorders: nonEmptySectorSegments.map<SectorBorderPath>((segment) => {
					let type: SectorBorderPath['type'] = 'standard';
					let style = settings.sectorBorderStroke;

					if (new Set(Array.from(segment.sectors).map((sector) => sector.factionId)).size > 1) {
						type = 'union';
						style = settings.unionBorderStroke;
					} else if (
						settings.sectorTypeBorderStyles &&
						Array.from(segment.sectors).some((s) => s.type === 'frontier')
					) {
						type = 'frontier';
						style = settings.sectorFrontierBorderStroke;
					} else if (
						settings.sectorTypeBorderStyles &&
						Array.from(segment.sectors).some((s) => s.type === 'core')
					) {
						type = 'core';
						style = settings.sectorCoreBorderStroke;
					}

					return {
						path: segmentToPath(segment.positions, style.smoothing),
						type,
					};
				}),
				isKnown: knownCountries.has(countryId),
			};
		})
		.filter(Predicate.isNotNullable);

	const unionLeaderToPositionStrings: Record<number, Set<string>> = Object.fromEntries(
		borders.map((border) => [
			border.countryId,
			new Set(border.geojson == null ? [] : turf.coordAll(border.geojson).map(positionToString)),
		]),
	);

	for (const [originalCountryId, fragment] of unassignedFragments) {
		let unionLeaderId: FactionId | undefined;
		let unionLeaderSharedDistancePercent = Number.EPSILON;
		Record.toEntries(unionLeaderToGeojson)
			.filter(([id]) => id !== originalCountryId)
			.forEach(([id]) => {
				const sharedDistancePercent = getSharedDistancePercent(
					fragment,
					getOrDefault(unionLeaderToPositionStrings, id, new Set()),
				);
				if (sharedDistancePercent >= unionLeaderSharedDistancePercent) {
					unionLeaderId = id;
					unionLeaderSharedDistancePercent = sharedDistancePercent;
				}
			});
		const border =
			unionLeaderId == null ? null : borders.find((b) => b.countryId === unionLeaderId);
		const geojson = border == null ? null : border.geojson;
		if (border && geojson) {
			border.geojson = turf.union(turf.featureCollection([geojson, fragment]));
		}
	}

	for (const border of borders) {
		const boundedOuterBorderGeoJSON = border.geojson;
		let smoothedOuterBorderGeoJSON = boundedOuterBorderGeoJSON;
		if (settings.borderStroke.smoothing && boundedOuterBorderGeoJSON != null) {
			smoothedOuterBorderGeoJSON = smoothGeojson(boundedOuterBorderGeoJSON, 2);
		}
		smoothedOuterBorderGeoJSON =
			smoothedOuterBorderGeoJSON == null
				? null
				: (turf.buffer(smoothedOuterBorderGeoJSON, -(settings.borderGap ?? 0) / 2 / SCALE, {
						units: 'degrees',
						steps: settings.borderStroke.smoothing ? 8 : 1,
					}) ?? null);
		const smoothedInnerBorderGeoJSON =
			smoothedOuterBorderGeoJSON == null
				? null
				: turf.buffer(smoothedOuterBorderGeoJSON, -settings.borderStroke.width / SCALE, {
						units: 'degrees',
						steps: settings.borderStroke.smoothing ? 8 : 1,
					});
		border.outerPath =
			smoothedOuterBorderGeoJSON == null
				? ''
				: multiPolygonToPath(smoothedOuterBorderGeoJSON, settings.borderStroke.smoothing);
		border.innerPath =
			smoothedInnerBorderGeoJSON == null
				? ''
				: multiPolygonToPath(smoothedInnerBorderGeoJSON, settings.borderStroke.smoothing);
		const borderOnlyGeoJSON =
			settings.borderStroke.width === 0
				? null
				: smoothedInnerBorderGeoJSON == null || smoothedOuterBorderGeoJSON == null
					? smoothedOuterBorderGeoJSON
					: turf.difference(
							turf.featureCollection([smoothedOuterBorderGeoJSON, smoothedInnerBorderGeoJSON]),
						);
		border.borderPath = borderOnlyGeoJSON
			? multiPolygonToPath(borderOnlyGeoJSON, settings.borderStroke.smoothing)
			: '';
	}
	return borders;
}
