import { Array, Equal, HashMap, identity, Iterable, Option, pipe, Record, Schema } from 'effect';
import type { PickByValue } from 'utility-types';

export const FactionId = Schema.String.pipe(Schema.brand('FactionId'));
export type FactionId = typeof FactionId.Type;
export const MembershipId = Schema.String.pipe(Schema.brand('MembershipId'));
export type MembershipId = typeof FactionId.Type;
export const SectorId = Schema.String.pipe(Schema.brand('SectorId'));
export type SectorId = typeof SectorId.Type;
export const SystemId = Schema.String.pipe(Schema.brand('SystemId'));
export type SystemId = typeof SystemId.Type;
export const SystemObjectId = Schema.String.pipe(Schema.brand('SystemObjectId'));
export type SystemObjectId = typeof SystemObjectId.Type;

interface HasCtx {
	ctx: Snapshot;
}

export class Coordinate extends Schema.Class<Coordinate>('Coordinate')({
	x: Schema.Number,
	y: Schema.Number,
}) {}

export class Flag extends Schema.Class<Flag>('Flag')({
	primaryColor: Schema.String,
	secondaryColor: Schema.String,
	emblem: Schema.NullOr(Schema.String),
}) {}

export class Faction extends Schema.Class<Faction>('Faction')({
	id: FactionId,
	name: Schema.String,
	flag: Flag,
	capitalId: Schema.NullOr(SystemObjectId),
	// subfactions
	// relationships
}) {
	#ctxRef: WeakRef<Snapshot> | null = null;
	set ctx(ctx: Snapshot) {
		this.#ctxRef = new WeakRef(ctx);
	}
	get ctx(): Snapshot {
		const ctx = this.#ctxRef?.deref();
		if (ctx == null) throw new Error('Context not set');
		return ctx;
	}

	get capital(): SystemObject | null {
		if (this.capitalId != null) {
			return this.ctx.systemObjects[this.capitalId] ?? null;
		} else {
			return null;
		}
	}

	get sectors(): Sector[] {
		return this.ctx.getSectorsWithFaction(this);
	}

	get systems(): System[] {
		return this.ctx.getSystemsWithFaction(this);
	}

	get members(): Membership[] {
		return this.ctx.getMembershipsWithOrganization(this);
	}

	get organizations(): Membership[] {
		return this.ctx.getMembershipsWithMember(this);
	}
}

export const MembershipTag = Schema.Literal(
	'federation_leader',
	'federation_member',
	'hegemony_leader',
	'hegemony_member',
	'subject',
);
export type MembershipTag = typeof MembershipTag.Type;

export class Membership extends Schema.Class<Membership>('Membership')({
	id: MembershipId,
	memberId: FactionId,
	organizationId: FactionId,
	tags: Schema.HashSet(MembershipTag),
}) {
	#ctxRef: WeakRef<Snapshot> | null = null;
	set ctx(ctx: Snapshot) {
		this.#ctxRef = new WeakRef(ctx);
	}
	get ctx(): Snapshot {
		const ctx = this.#ctxRef?.deref();
		if (ctx == null) throw new Error('Context not set');
		return ctx;
	}

	get member(): Faction {
		return pipe(this.ctx.factions[this.memberId], Option.fromNullable, Option.getOrThrow);
	}

	get organization(): Faction {
		return pipe(this.ctx.factions[this.organizationId], Option.fromNullable, Option.getOrThrow);
	}
}

export class Sector extends Schema.Class<Sector>('Sector')({
	id: SectorId,
	factionId: FactionId,
	type: Schema.Literal('core', 'frontier', 'standard'),
	capitalId: Schema.NullOr(SystemObjectId),
}) {
	#ctxRef: WeakRef<Snapshot> | null = null;
	set ctx(ctx: Snapshot) {
		this.#ctxRef = new WeakRef(ctx);
	}
	get ctx(): Snapshot {
		const ctx = this.#ctxRef?.deref();
		if (ctx == null) throw new Error('Context not set');
		return ctx;
	}

	get capital(): SystemObject | null {
		if (this.capitalId != null) {
			return this.ctx.systemObjects[this.capitalId] ?? null;
		} else {
			return null;
		}
	}

	get faction(): Faction {
		return pipe(this.ctx.factions[this.factionId], Option.fromNullable, Option.getOrThrow);
	}

	get systems(): System[] {
		return this.ctx.getSystemsWithSector(this);
	}
}

export class SystemObject extends Schema.Class<SystemObject>('SystemObject')({
	id: SystemObjectId,
	name: Schema.String,
	coordinate: Coordinate,
	systemId: SystemId,
	population: Schema.Number.pipe(Schema.nonNegative()),
	// orientation
}) {
	#ctxRef: WeakRef<Snapshot> | null = null;
	set ctx(ctx: Snapshot) {
		this.#ctxRef = new WeakRef(ctx);
	}
	get ctx(): Snapshot {
		const ctx = this.#ctxRef?.deref();
		if (ctx == null) throw new Error('Context not set');
		return ctx;
	}

	get system(): System {
		return pipe(this.ctx.systems[this.systemId], Option.fromNullable, Option.getOrThrow);
	}
}

export class Connection extends Schema.Class<Connection>('Connection')({
	to: SystemId,
	type: Schema.String,
}) {}
export class System extends Schema.Class<System>('System')({
	id: SystemId,
	name: Schema.String,
	coordinate: Coordinate,
	factionId: Schema.NullOr(FactionId),
	sectorId: Schema.NullOr(SectorId),
	connections: Schema.Data(Schema.Array(Connection)),
}) {
	#ctxRef: WeakRef<Snapshot> | null = null;
	set ctx(ctx: Snapshot) {
		this.#ctxRef = new WeakRef(ctx);
	}
	get ctx(): Snapshot {
		const ctx = this.#ctxRef?.deref();
		if (ctx == null) throw new Error('Context not set');
		return ctx;
	}

	get faction(): Faction | null {
		if (this.factionId != null) {
			return this.ctx.factions[this.factionId] ?? null;
		} else {
			return null;
		}
	}

	get objects(): SystemObject[] {
		return this.ctx.getSystemObjectsWithSystem(this);
	}

	get sector(): Sector | null {
		if (this.sectorId != null) {
			return this.ctx.sectors[this.sectorId] ?? null;
		} else {
			return null;
		}
	}
}

export class Snapshot extends Schema.Class<Snapshot>('Snapshot')({
	date: Schema.String,
	factions: Schema.Data(
		Schema.Record({
			key: FactionId,
			value: Faction,
		}),
	),
	memberships: Schema.Data(
		Schema.Record({
			key: MembershipId,
			value: Membership,
		}),
	),
	sectors: Schema.Data(
		Schema.Record({
			key: SectorId,
			value: Sector,
		}),
	),
	systems: Schema.Data(
		Schema.Record({
			key: SystemId,
			value: System,
		}),
	),
	systemObjects: Schema.Data(
		Schema.Record({
			key: SystemObjectId,
			value: SystemObject,
		}),
	),
}) {
	init() {
		const applyContext = (objects: Iterable<HasCtx>) => {
			for (const object of objects) {
				object.ctx = this;
			}
		};
		pipe(this.factions, Record.values, applyContext);
		pipe(this.memberships, Record.values, applyContext);
		pipe(this.sectors, Record.values, applyContext);
		pipe(this.systems, Record.values, applyContext);
		pipe(this.systemObjects, Record.values, applyContext);
	}

	#membershipsWithMemberCache = HashMap.empty<Faction, Membership[]>();
	getMembershipsWithMember(faction: Faction): Membership[] {
		return getCachedOneToMany<Faction | null, Membership>(
			faction,
			this.memberships,
			'member',
			this.#membershipsWithMemberCache,
		);
	}

	#membershipsWithOrganizationCache = HashMap.empty<Faction, Membership[]>();
	getMembershipsWithOrganization(faction: Faction): Membership[] {
		return getCachedOneToMany<Faction | null, Membership>(
			faction,
			this.memberships,
			'organization',
			this.#membershipsWithOrganizationCache,
		);
	}

	#sectorsWithFactionCache = HashMap.empty<Faction, Sector[]>();
	getSectorsWithFaction(faction: Faction): Sector[] {
		return getCachedOneToMany<Faction | null, Sector>(
			faction,
			this.sectors,
			'faction',
			this.#sectorsWithFactionCache,
		);
	}

	#systemObjectsWithSystemCache = HashMap.empty<System, SystemObject[]>();
	getSystemObjectsWithSystem(system: System): SystemObject[] {
		return getCachedOneToMany(
			system,
			this.systemObjects,
			'system',
			this.#systemObjectsWithSystemCache,
		);
	}

	#systemsWithFactionCache = HashMap.empty<Faction, System[]>();
	getSystemsWithFaction(faction: Faction): System[] {
		return getCachedOneToMany(faction, this.systems, 'faction', this.#systemsWithFactionCache);
	}

	#systemsWithSectorCache = HashMap.empty<Sector, System[]>();
	getSystemsWithSector(sector: Sector): System[] {
		return getCachedOneToMany(sector, this.systems, 'sector', this.#systemsWithSectorCache);
	}
}

function getCachedOneToMany<One, Many>(
	one: One,
	many: Record<string, Many>,
	key: keyof PickByValue<Many, One | null>,
	cache: HashMap.HashMap<One, Many[]>,
): Many[] {
	return Option.match(HashMap.get(cache, one), {
		onSome: identity,
		onNone: () => {
			const result = pipe(
				many,
				Record.values,
				Iterable.filter((object) => Equal.equals(object[key], one)),
				Array.fromIterable,
			);
			HashMap.set(cache, one, result);
			return result;
		},
	});
}
