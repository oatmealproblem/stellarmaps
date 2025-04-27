import type { Bypass, GameState } from '../../GameState.svelte';

export default function processHyperRelays(gameState: GameState) {
	const relayMegastructures = new Set(
		Object.values(gameState.bypasses)
			.filter(
				(bypass): bypass is Bypass & Required<Pick<Bypass, 'owner'>> =>
					bypass.type === 'relay_bypass' && bypass.owner?.type === 6,
			)
			.map((bypass) => bypass.owner.id),
	);
	return relayMegastructures;
}
