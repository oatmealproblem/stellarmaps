import { z } from 'zod';

export const zStrokeSetting = z.object({
	enabled: z.boolean(),
	width: z.number(),
	smoothing: z.boolean(),
	dashed: z.boolean(),
	dashArray: z.string(),
	glow: z.boolean(),
});
export type StrokeSetting = z.infer<typeof zStrokeSetting>;
