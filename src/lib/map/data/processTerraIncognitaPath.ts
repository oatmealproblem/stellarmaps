import type { MapSettings } from '../../settings';
import { applyGalaxyBoundary, multiPolygonToPath, type PolygonalFeature } from './utils';

export const processTerraIncognitaPathDeps = ['borderStroke'] satisfies (keyof MapSettings)[];

export default function processTerraIncognitaPath(
	settings: Pick<MapSettings, (typeof processTerraIncognitaPathDeps)[number]>,
	terraIncognitaGeojson: PolygonalFeature | null,
	galaxyBorderCirclesGeoJSON: PolygonalFeature | null,
) {
	if (terraIncognitaGeojson == null) return { terraIncognitaPath: '' };
	const bounded = applyGalaxyBoundary(terraIncognitaGeojson, galaxyBorderCirclesGeoJSON);
	if (bounded == null) return { terraIncognitaPath: '' };
	const terraIncognitaPath = multiPolygonToPath(bounded, settings.borderStroke.smoothing);
	return {
		terraIncognitaPath,
	};
}
