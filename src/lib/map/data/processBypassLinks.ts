import { Array, Iterable, pipe, Predicate, Record } from 'effect';

import { type Snapshot, SystemId } from '$lib/project/snapshot';

import { pointToObject } from './utils';

interface BypassLink {
	type: string;
	isKnown: boolean;
	from: { x: number; y: number };
	to: { x: number; y: number };
}

export default function processBypassLinks(
	snapshot: Snapshot,
	knownSystems: Set<SystemId>,
	getSystemCoordinates: (id: SystemId, options?: { invertX?: boolean }) => [number, number],
): BypassLink[] {
	return pipe(
		snapshot.connections,
		Record.values,
		Iterable.filter(
			(connection) => connection.type !== 'hyperlane' && connection.type !== 'hyper_relay',
		),
		Iterable.map((connection) => {
			if (connection.toId == null) return null;
			return {
				type: connection.type,
				isKnown: knownSystems.has(connection.fromId) && knownSystems.has(connection.toId),
				from: pointToObject(getSystemCoordinates(connection.fromId)),
				to: pointToObject(getSystemCoordinates(connection.toId)),
			};
		}),
		Iterable.filter(Predicate.isNotNull),
		Array.fromIterable,
	);
}
