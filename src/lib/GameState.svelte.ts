import { Record } from 'effect';
import { z } from 'zod';

import { RawStateWrapper } from './stateUtils.svelte';
import { saveToWindow } from './utils';

type WithId<T> = T & { id: number };

export const gameStatePromise = new RawStateWrapper<Promise<GameState> | null>(null);

$effect.root(() => {
	$effect(() => {
		gameStatePromise.current?.then((gameState) => {
			saveToWindow('gameState', gameState);
		});
	});
});

function preprocessedArray<T extends z.ZodTypeAny>(schema: T) {
	return z.preprocess(
		(val) => (val == null || Record.isEmptyRecord(val) ? [] : val),
		z.array(schema),
	);
}

// zod can't infer recursive types
/**
 * @public
 */
export interface LocalizedText {
	key: string;
	variables?: {
		key: string;
		value?: LocalizedText;
	}[];
}
const localizedTextSchemaNoDefault: z.ZodType<LocalizedText> = z.object({
	key: z.coerce.string(),
	variables: z
		.array(
			z.object({
				key: z.coerce.string(),
				value: z.lazy(() => localizedTextSchemaNoDefault.optional()),
			}),
		)
		.optional(),
});
const localizedTextSchema = localizedTextSchemaNoDefault.default({ key: 'UNKNOWN' });

const galacticObjectSchema = z
	.object({
		name: localizedTextSchema,
		coordinate: z.object({
			x: z.number(),
			y: z.number(),
		}),
		starbases: preprocessedArray(z.number()),
		hyperlane: preprocessedArray(z.object({ to: z.number(), length: z.number() })),
		megastructures: preprocessedArray(z.number()),
		colonies: preprocessedArray(z.number()),
		bypasses: preprocessedArray(z.number()),
		flags: z
			.record(
				z.string(),
				z.union([
					z.number().optional(),
					z.object({ flag_date: z.number(), flag_days: z.number() }),
				]),
			)
			.optional(),
		planet: z.number().optional(),
		fleet_presence: z.array(z.number()).default([]),
		trade_hub: z
			.object({
				collected: z.number().optional(), // this does NOT include value delivered by other trade routes
				destination: z.number().optional(), // trade_route ID
				collected_from: z.array(z.number()).optional(), // galactic_object IDs
				sources: z.array(z.number()).optional(), // trade_route IDs
			})
			.optional(), // pre-4.0 only
		asteroid_belts: z
			.array(
				z.object({
					type: z.string(),
					inner_radius: z.number(),
				}),
			)
			.default([]),
		$multiKeys: z
			.object({
				planet: preprocessedArray(z.number()).optional(),
			})
			.optional(),
	})
	.transform((obj) => ({
		...obj,
		planet: (obj.planet == null ? [] : [obj.planet]).concat(obj.$multiKeys?.planet ?? []),
	}));

/**
 * @public
 */
export type GalacticObject = WithId<z.infer<typeof galacticObjectSchema>>;

const planetSchema = z.object({
	name: localizedTextSchema,
	controller: z.number().optional(),
	owner: z.number().optional(),
	num_sapient_pops: z.number().optional(),
	species_information: z
		.record(
			z.string(),
			z.object({ num_pops: z.number().optional(), num_enslaved: z.number().optional() }),
		)
		.optional(),
	planet_size: z.number(),
	planet_class: z.string(),
	entity_name: z.string().optional(),
	orbit: z.number(),
	is_moon: z.boolean().optional(),
	moon_of: z.number().optional(),
	has_ring: z.boolean().optional(),
	coordinate: z.object({ x: z.number(), y: z.number() }),
});

/**
 * @public
 */
export type Planet = WithId<z.infer<typeof planetSchema>>;

const bypassSchema = z.object({
	type: z.string(),
	owner: z.object({ type: z.number(), id: z.number() }).optional(),
	linked_to: z.number().optional(),
});

/**
 * @public
 */
export type Bypass = WithId<z.infer<typeof bypassSchema>>;

const megastructureSchema = z.object({
	type: z.string().optional(),
});

/**
 * @public
 */
export type Megastructure = WithId<z.infer<typeof megastructureSchema>>;

const relationSchema = z.object({
	owner: z.number(),
	country: z.number(),
	communications: z.boolean().optional(),
	contact: z.boolean().optional(),
	embassy: z.boolean().optional(),
	borders: z.boolean().optional(),
	hostile: z.boolean().optional(),
	defensive_pact: z.boolean().optional(),
	non_aggression_pact: z.boolean().optional(),
	research_agreement: z.boolean().optional(),
	commercial_pact: z.boolean().optional(),
	is_rival: z.boolean().optional(),
	closed_borders: z.boolean().optional(),
	migration_access: z.boolean().optional(),
	trust: z.number().optional(),
	truce: z.number().optional(),
	wars: preprocessedArray(z.number()),
	relation_current: z.number().default(0),
});

/**
 * @public
 */
export type Relation = z.infer<typeof relationSchema>;

const countrySchema = z.object({
	type: z.string().default('unknown'),
	name: localizedTextSchema,
	flag: z
		.object({
			colors: preprocessedArray(z.string()),
			icon: z
				.object({
					category: z.string(),
					file: z.string(),
				})
				.optional(),
		})
		.optional(),
	government: z
		.object({
			authority: z.string(),
		})
		.optional(),
	capital: z.number().optional(),
	founder_species_ref: z.number().optional(),
	subjects: preprocessedArray(z.number()),
	overlord: z.number().optional(),
	federation: z.number().optional(),
	associated_federation: z.number().optional(),
	usable_bypasses: preprocessedArray(z.number()),
	fleets_manager: z
		.object({
			owned_fleets: preprocessedArray(z.object({ fleet: z.number() })),
		})
		.optional(),
	sensor_range_fleets: z.array(z.number()).default([]),
	terra_incognita: z
		.object({
			systems: preprocessedArray(z.number()),
		})
		.optional(),
	relations_manager: z
		.object({
			relation: relationSchema.optional(),
			$multiKeys: z
				.object({
					relation: preprocessedArray(relationSchema).optional(),
				})
				.optional(),
		})
		.default({})
		.transform((obj) => ({
			...obj,
			relation: (obj.relation == null ? [] : [obj.relation]).concat(obj.$multiKeys?.relation ?? []),
		})),
	ai: z
		.object({
			attitude: z
				.array(
					z.object({
						country: z.number(),
						attitude: z.string(),
					}),
				)
				.default([]),
		})
		.default({}),
	intel_manager: z
		.object({
			intel: preprocessedArray(z.tuple([z.number(), z.object({ intel: z.number() })])),
		})
		.default({ intel: [] }),
});

/**
 * @public
 */
export type Country = WithId<z.infer<typeof countrySchema>>;

const starbaseSchema = z.object({
	station: z.number(),
});

/**
 * @public
 */
export type Starbase = WithId<z.infer<typeof starbaseSchema>>;

const shipSchema = z.object({
	fleet: z.number(),
	coordinate: z.object({ x: z.number(), y: z.number() }),
	rotation: z.number(),
});

/**
 * @public
 */
export type Ship = WithId<z.infer<typeof shipSchema>>;

const fleetSchema = z.object({
	name: localizedTextSchema,
	station: z.boolean().optional(),
	military_power: z.number(),
	mobile: z.boolean().optional(),
	ships: z.array(z.number()),
	movement_manager: z.object({
		coordinate: z.object({ x: z.number(), y: z.number() }),
		formation: z.object({ angle: z.number() }),
	}),
});

/**
 * @public
 */
export type Fleet = WithId<z.infer<typeof fleetSchema>>;

const sectorSchema = z.object({
	owner: z.number().optional(),
	local_capital: z.number().optional(),
	systems: preprocessedArray(z.number()),
});

/**
 * @public
 */
export type Sector = WithId<z.infer<typeof sectorSchema>>;

const federationSchema = z.object({
	leader: z.number(),
	members: preprocessedArray(z.number()),
	associates: preprocessedArray(z.number()),
	name: localizedTextSchema,
	federation_progress: z
		.object({
			federation_type: z.string().default('default_federation'),
		})
		.default({}),
});

/**
 * @public
 */
export type Federation = WithId<z.infer<typeof federationSchema>>;

const warSchema = z.object({
	name: localizedTextSchema,
	attackers: z.array(z.object({ country: z.number() })),
	defenders: z.array(z.object({ country: z.number() })),
});

/**
 * @public
 */
export type War = WithId<z.infer<typeof warSchema>>;

const agreementSchema = z.object({
	owner: z.number(), // overlord
	target: z.number(), // subject
	active_status: z.string(),
	term_data: z.object({
		joins_overlord_wars: z.string().optional(),
		calls_overlord_to_war: z.string().optional(),
	}),
});

/**
 * @public
 */
export type Agreement = WithId<z.infer<typeof agreementSchema>>;

const nebulaSchema = z
	.object({
		radius: z.number(),
		galactic_object: z.number().optional(),
		$multiKeys: z.object({ galactic_object: preprocessedArray(z.number()).optional() }).optional(),
	})
	.transform((obj) => ({
		...obj,
		galactic_object: (obj.galactic_object == null ? [] : [obj.galactic_object]).concat(
			obj.$multiKeys?.galactic_object ?? [],
		),
	}));

/**
 * @public
 */
export type Nebula = z.infer<typeof nebulaSchema>;

const speciesSchema = z.object({
	base_ref: z.number().optional(),
	name: localizedTextSchema,
});

/**
 * @public
 */
export type Species = WithId<z.infer<typeof speciesSchema>>;

const tradeRouteSchema = z.object({
	owner: z.number(),
	from: z.number(),
	to: z.number(),
	delivered: z.number(),
	path: z.array(
		z.object({
			id: z.number(),
			collected: z.number(),
			delivered: z.number(),
		}),
	),
});

/**
 * @public
 */
export type TradeRoute = WithId<z.infer<typeof tradeRouteSchema>>;

function addIds<T>(db: Record<number, T>): Record<number, WithId<T>> {
	return Object.fromEntries(
		Object.entries(db).map(([id, obj]) => [id, { ...obj, id: parseInt(id) }]),
	);
}
function stellarisDb<T extends z.ZodType>(schema: T) {
	return z.record(z.coerce.number(), schema).default({}).transform(addIds);
}

export const gameStateSchema = z
	.object({
		galactic_object: stellarisDb(galacticObjectSchema),
		country: stellarisDb(countrySchema),
		ships: stellarisDb(shipSchema),
		fleet: stellarisDb(fleetSchema),
		starbase_mgr: z.object({ starbases: stellarisDb(starbaseSchema) }).default({ starbases: {} }),
		bypasses: stellarisDb(bypassSchema),
		megastructures: stellarisDb(megastructureSchema),
		sectors: stellarisDb(sectorSchema),
		federation: stellarisDb(federationSchema),
		war: stellarisDb(warSchema),
		agreements: z.object({ agreements: stellarisDb(agreementSchema) }).default({}),
		player: preprocessedArray(z.object({ name: z.coerce.string(), country: z.number() })),
		galaxy: z.object({ shape: z.string(), core_radius: z.number() }),
		planets: z.object({ planet: stellarisDb(planetSchema) }).default({}),
		species_db: stellarisDb(speciesSchema),
		trade_routes: stellarisDb(tradeRouteSchema),
		nebula: nebulaSchema.optional(),
		$multiKeys: z.object({ nebula: preprocessedArray(nebulaSchema).optional() }).optional(),
	})
	.transform((obj) => ({
		...obj,
		nebula: (obj.nebula == null ? [] : [obj.nebula]).concat(obj.$multiKeys?.nebula ?? []),
	}));

/**
 * @public
 */
export type GameState = z.infer<typeof gameStateSchema>;

function convertSchemaToGameStateFilter(schema: z.ZodType): boolean | Record<string, any> | any[] {
	if (schema === localizedTextSchema) {
		return true;
	} else if (schema instanceof z.ZodDefault) {
		return convertSchemaToGameStateFilter(schema.removeDefault());
	} else if (schema instanceof z.ZodOptional) {
		return convertSchemaToGameStateFilter(schema.unwrap());
	} else if (schema instanceof z.ZodNullable) {
		return convertSchemaToGameStateFilter(schema.unwrap());
	} else if (schema instanceof z.ZodEffects) {
		return convertSchemaToGameStateFilter(schema.innerType());
	} else if (schema instanceof z.ZodUnion) {
		const unionPaths = (schema.options as z.ZodType[]).map((option) =>
			convertSchemaToGameStateFilter(option),
		);
		const complexUnionPaths = unionPaths.filter((p) => typeof p !== 'boolean');
		if (unionPaths.includes(true)) return true;
		if (complexUnionPaths.length === 1)
			return complexUnionPaths[0] as (typeof complexUnionPaths)[number];
		if (complexUnionPaths.length > 1) {
			console.error('complex union, falling back to true');
			return true;
		}
		return false;
	} else if (schema instanceof z.ZodTuple) {
		return true;
	} else if (schema instanceof z.ZodObject) {
		return Object.fromEntries(
			Object.entries(schema.shape).map(([key, value]) => [
				key,
				convertSchemaToGameStateFilter(value as z.ZodType),
			]),
		);
	} else if (schema instanceof z.ZodArray) {
		return [convertSchemaToGameStateFilter(schema.element)];
	} else if (schema instanceof z.ZodRecord) {
		return { '*': convertSchemaToGameStateFilter(schema.valueSchema) };
	} else if (
		schema instanceof z.ZodNumber ||
		schema instanceof z.ZodString ||
		schema instanceof z.ZodBoolean
	) {
		return false;
	} else {
		console.error('Unhandled ZodType', schema);
		throw new Error(`Unhandled ZodType`);
	}
}
export const gameStateFilter = convertSchemaToGameStateFilter(gameStateSchema);

// trade
// galactic_object:
// - trade_collection { targets: { target: GalacticObjectID; distance: number }[] }
// - - targets is length 1; the ID it points to will have a trade_hub with this gal_obj in its collected_from
// - trade_hub {
//     collected: number; // this does NOT include value delivered by other trade routes
//     destination: TradeRouteID;
//     collected_from: GalacticObjectID[]
//     sources: TradeRouteID[]
//   }
// - trade_piracy {
//     active: number; ???
//     max: number; ???
//     total: number; un-pirated value
//     throughput: number; pirate + un-pirated value
//     used: number; pirated value
//     targets: { target: GalacticObjectID; distance: number }[] ???
//   }
// trade route:
// - delivered: number;
// - from: GalacticObjectID
// - to: GalacticObjectID
// - owner: CountryID
// - path: {
//     id: GalacticObjectID
//     collected: number; value entered, same as that obj's trade_piracy.throughput
//     delivered: number; value left, same as that obj's trade_piracy.total
//   }[]
// - - first entry in path is same ID as from
// - - last entry in path is same ID as to
// - - last entry delivered is the same as route delivered
