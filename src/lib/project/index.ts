import { z } from 'zod';

import { Definitions } from './definitions';
import { Snapshot } from './snapshot';

const StellarisConfig = z.object({
	gameId: z.string(),
	language: z.string(),
});

export const Project = z.object({
	name: z.string(),
	stellarisConfig: StellarisConfig,
	definitions: Definitions,
	snapshots: z.array(Snapshot),
});
export type Project = z.infer<typeof Project>;
