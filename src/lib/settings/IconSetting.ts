import { z } from 'zod';

import { zColorSetting } from './ColorSetting';

export const zIconSetting = z.object({
	enabled: z.boolean(),
	icon: z.string(),
	size: z.number(),
	position: z.enum(['left', 'right', 'top', 'bottom', 'center']),
	priority: z.number(),
	color: zColorSetting,
});
export type IconSetting = z.infer<typeof zIconSetting>;
export type IconPosition = IconSetting['position'];
export const ICON_POSITIONS = zIconSetting.shape.position.options;
