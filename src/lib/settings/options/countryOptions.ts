import { RawStateWrapper } from '$lib/stateUtils.svelte';

import type { SelectOption } from '../SelectOption';

export const countryOptions = new RawStateWrapper<SelectOption[]>([]);
