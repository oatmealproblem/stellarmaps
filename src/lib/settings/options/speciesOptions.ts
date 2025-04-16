import { RawStateWrapper } from '$lib/stateUtils.svelte';

import type { SelectOption } from '../SelectOption';

export const speciesOptions = new RawStateWrapper<SelectOption[]>([]);
