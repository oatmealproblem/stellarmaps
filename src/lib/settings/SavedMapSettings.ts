import { z } from 'zod';

import { type MapSettings, zMapSettings } from './mapSettings';

export interface SavedMapSettings {
	name: string;
	settings: MapSettings;
}

export const zSavedMapSettings: z.Schema<SavedMapSettings, z.ZodTypeDef, unknown> = z.object({
	name: z.string(),
	settings: zMapSettings,
});
