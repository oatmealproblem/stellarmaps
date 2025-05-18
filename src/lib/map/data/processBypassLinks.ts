import { Predicate } from 'effect';

import type { GameState } from '../../stellaris/GameState.svelte';

export default function processBypassLinks(
	gameState: GameState,
	knownSystems: Set<number>,
	knownWormholes: Set<number>,
	getSystemCoordinates: (id: number, options?: { invertX?: boolean }) => [number, number],
) {
	const bypassLinks: Record<
		string,
		{ type: string; isKnown: boolean; from: { x: number; y: number }; to: { x: number; y: number } }
	> = {};

	const lGateNexus = Object.values(gameState.galactic_object).find(
		(object) => object.flags?.lcluster1,
	);

	const shroudTunnelNexus = Object.values(gameState.galactic_object).find(
		(object) => object.flags?.shroud_tunnel_nexus,
	);

	Object.values(gameState.galactic_object).forEach((system) => {
		const [fromX, fromY] = getSystemCoordinates(system.id, { invertX: true });

		const bypassTypes = new Set(
			system.bypasses
				.map((bypassId) => gameState.bypasses[bypassId]?.type)
				.filter(Predicate.isNotNullable),
		);

		const wormholeBypass = system.bypasses
			.map((bypassId) => gameState.bypasses[bypassId])
			.find((b) => b?.type === 'wormhole' || b?.type === 'strange_wormhole');
		const wormholeIsKnown = wormholeBypass != null && knownWormholes.has(wormholeBypass.id);
		const wormholeLinksTo = Object.values(gameState.galactic_object).find((go) =>
			go.bypasses.includes(wormholeBypass?.linked_to as number),
		);
		if (wormholeLinksTo != null) {
			const key = `wormhole-${[system.id, wormholeLinksTo.id].sort()}`;
			if (!(key in bypassLinks)) {
				const [toX, toY] = getSystemCoordinates(wormholeLinksTo.id, { invertX: true });
				bypassLinks[key] = {
					type: 'wormhole',
					isKnown: wormholeIsKnown,
					from: { x: fromX, y: fromY },
					to: { x: toX, y: toY },
				};
			}
		}

		if (lGateNexus && system.id !== lGateNexus.id) {
			if (bypassTypes.has('lgate')) {
				const [toX, toY] = getSystemCoordinates(lGateNexus.id, { invertX: true });
				bypassLinks[`lgate-${system.id}`] = {
					type: 'lgate',
					isKnown: knownSystems.has(lGateNexus.id) && knownSystems.has(system.id),
					from: { x: fromX, y: fromY },
					to: { x: toX, y: toY },
				};
			}
		}

		if (shroudTunnelNexus != null && system.id !== shroudTunnelNexus.id) {
			const [toX, toY] = getSystemCoordinates(shroudTunnelNexus.id, { invertX: true });
			if (bypassTypes.has('shroud_tunnel')) {
				bypassLinks[`shrould_tunnel-${system.id}`] = {
					type: 'shroud_tunnel',
					isKnown: knownSystems.has(shroudTunnelNexus.id) && knownSystems.has(system.id),
					from: { x: fromX, y: fromY },
					to: { x: toX, y: toY },
				};
			}
		}
	});

	return Object.values(bypassLinks);
}
