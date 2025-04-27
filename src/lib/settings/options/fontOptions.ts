import { RawStateWrapper } from '$lib/stateUtils.svelte';

import stellarMapsApi from '../../stellarMapsApi';
import type { SelectOption } from '../SelectOption';

export const fontOptions = new RawStateWrapper<SelectOption[]>([]);

stellarMapsApi
	.loadFonts()
	.then(
		(fonts) =>
			(fontOptions.current = fonts
				.filter((f) => f !== 'Orbitron')
				.map((f) => ({ id: f, literalName: f }))),
	);
