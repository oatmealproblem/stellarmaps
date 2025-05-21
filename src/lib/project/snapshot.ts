import { z } from 'zod';

export const FactionId = z.string().brand('FactionId');
export type FactionId = z.infer<typeof FactionId>;
export const SectorId = z.string().brand('SectorId');
export type SectorId = z.infer<typeof SectorId>;
export const SystemId = z.string().brand('SystemId');
export type SystemId = z.infer<typeof SystemId>;
export const SystemObjectId = z.string().brand('SystemObjectId');
export type SystemObjectId = z.infer<typeof SystemObjectId>;

const Coordinate = z.object({
	x: z.number(),
	y: z.number(),
});

export const Faction = z.object({
	id: FactionId,
	name: z.string(),
	flag: z.object({
		primaryColor: z.string(),
		secondaryColor: z.string(),
		emblem: z.string().nullable(),
	}),
	capital: SystemObjectId.nullable(),
	// subfactions
	// relationships
});
export type Faction = z.infer<typeof Faction>;

export const Sector = z.object({
	id: SectorId,
	faction: FactionId,
	type: z.enum(['core', 'frontier', 'standard']),
	capital: SystemObjectId.nullable(),
});
export type Sector = z.infer<typeof Sector>;

export const SystemObject = z.object({
	id: SystemObjectId,
	name: z.string(),
	coordinate: Coordinate,
	system: SystemId,
	population: z.number(),
	// orientation
	// population
});
export type SystemObject = z.infer<typeof SystemObject>;

export const Connection = z.object({ to: SystemId, type: z.string() });
export type Connection = z.infer<typeof Connection>;
export const System = z.object({
	id: SystemId,
	name: z.string(),
	coordinate: Coordinate,
	faction: FactionId.nullable(),
	sector: SectorId.nullable(),
	connections: z.array(Connection),
	// connections
});
export type System = z.infer<typeof System>;

export const Snapshot = z.object({
	date: z.string(),
	factions: z.record(Faction, FactionId),
	sectors: z.record(Sector, SectorId),
	systems: z.record(System, SystemId),
	systemObjects: z.record(SystemObject, SystemObjectId),
});
export type Snapshot = z.infer<typeof Snapshot>;
