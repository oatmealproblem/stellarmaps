import { z } from 'zod';

const Color = z.object({
	name: z.string(),
	cssValue: z.string(),
});

const Emblem = z.object({
	name: z.string(),
});

const ConnectionType = z.object({
	name: z.string(),
	type: z.enum(['unidirectional', 'bidirectional', 'all']),
	// cluster sensitive
	// border sensitive
});

export const Definitions = z.object({
	colors: z.record(Color),
	emblems: z.record(Emblem),
	connectionType: z.record(ConnectionType),
});
