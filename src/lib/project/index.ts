import { Schema } from 'effect';

import { Definitions } from './definitions';
import { Snapshot } from './snapshot';

class StellarisConfig extends Schema.Class<StellarisConfig>('StellarisConfig')({
	gameId: Schema.String,
	language: Schema.String,
}) {}

export class Project extends Schema.Class<Project>('Project')({
	name: Schema.String,
	stellarisConfig: StellarisConfig,
	definitions: Definitions,
	snapshots: Schema.Array(Snapshot),
}) {}
