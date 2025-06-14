import { Schema } from 'effect';

export const FactionId = Schema.String.pipe(Schema.brand('FactionId'));
export type FactionId = typeof FactionId.Type;
export const SectorId = Schema.String.pipe(Schema.brand('SectorId'));
export type SectorId = typeof SectorId.Type;
export const SystemId = Schema.String.pipe(Schema.brand('SystemId'));
export type SystemId = typeof SystemId.Type;
export const SystemObjectId = Schema.String.pipe(Schema.brand('SystemObjectId'));
export type SystemObjectId = typeof SystemObjectId.Type;

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
}) {}

export class Sector extends Schema.Class<Sector>('Sector')({
	id: SectorId,
	factionId: FactionId,
	type: Schema.Literal('core', 'frontier', 'standard'),
	capitalId: Schema.NullOr(SystemObjectId),
}) {}

export class SystemObject extends Schema.Class<SystemObject>('SystemObject')({
	id: SystemObjectId,
	name: Schema.String,
	coordinate: Coordinate,
	system: SystemId,
	population: Schema.Number.pipe(Schema.nonNegative()),
	// orientation
}) {}

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
}) {}

export class Snapshot extends Schema.Class<Snapshot>('Snapshot')({
	date: Schema.String,
	factions: Schema.Data(
		Schema.Record({
			key: FactionId,
			value: Faction,
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
}) {}
