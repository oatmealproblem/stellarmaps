import { RawStateWrapper } from '$lib/stateUtils.svelte';

import { ADDITIONAL_COLORS } from '../../colors';
import { stellarisDataPromise } from '../../loadStellarisData.svelte';
import type { SelectOption } from '../SelectOption';

export const colorDynamicOptions = new RawStateWrapper<SelectOption[]>([]);
$effect.root(() => {
	$effect(() => {
		stellarisDataPromise.current.then(
			({ colors }) =>
				(colorDynamicOptions.current = Object.keys(colors).map((c) => ({
					id: c,
					group:
						c in ADDITIONAL_COLORS
							? 'option.color.group.stellar_maps'
							: 'option.color.group.stellaris',
					literalName: c
						.split('_')
						.filter((word) => word.length > 0)
						.map((word) => `${word.substring(0, 1).toUpperCase()}${word.substring(1)}`)
						.join(' '),
				}))),
		);
	});
});
