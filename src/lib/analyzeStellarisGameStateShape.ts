import { Array, pipe, Record } from 'effect';

// object with consistent value type, like typescript Record
type DbValue = {
	type: 'DB';
	value: Value;
};
// array
type ListValue = {
	type: 'LIST';
	value: Value;
};
// object
type ObjectValue = {
	type: 'OBJECT';
	properties: Record<string, Property>;
};
// type union, like typescript A | B
type UnionValue = {
	type: 'UNION';
	values: Value[];
};
type Value =
	| {
			type: // basic types
			| 'STRING'
				| 'BOOL'
				| 'NUM'
				| 'NULL'
				// empty block {}, until there are values, it is ambiguous if it is array or opject
				| 'EMPTY'
				// localized text, recursive structure that this script doesn't handle well
				| 'LOC'
				// event scope, also recursive
				| 'SCOPE';
	  }
	| DbValue
	| ListValue
	| ObjectValue
	| UnionValue;
// future improvements:
// - track observed values for strings, enum type?
// - distinguish INT and FLOAT
// - tuple type?
// - distinguish string-keyed vs int-keyed DBs

type Property = Value & {
	optional?: boolean;
	multiple?: boolean;
};

/** With this many key-values or greater, process an object as a DB even if keys are not integers */
const DB_PROPERTIES = new Set(['flags', 'variables']);
const PATH_SEPARATOR = '>';
const DB_PATHS = new Set([
	['country', '$ID$', 'astral_actions_usage_states_array'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'current_month', 'balance'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'current_month', 'expenses'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'current_month', 'extra_balance'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'current_month', 'extra_expenses'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'current_month', 'extra_income'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'current_month', 'income'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'current_month', 'trade_balance'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'current_month', 'trade_expenses'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'current_month', 'trade_income'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'last_month', 'balance'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'last_month', 'expenses'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'last_month', 'extra_balance'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'last_month', 'extra_expenses'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'last_month', 'extra_income'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'last_month', 'income'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'last_month', 'trade_balance'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'last_month', 'trade_expenses'].join(PATH_SEPARATOR),
	['country', '$ID$', 'budget', 'last_month', 'trade_income'].join(PATH_SEPARATOR),
	['country', '$ID$', 'ship_names'].join(PATH_SEPARATOR),
	['country', '$ID$', 'tech_status', 'potential'].join(PATH_SEPARATOR),
	['country', '$ID$', 'tech_status', 'stored_techpoints_for_tech'].join(PATH_SEPARATOR),
]);

export function analyzeStellarisGameStateShape(data: unknown, path: string[] = []): Value {
	if (typeof data === 'string') {
		return { type: 'STRING' };
	} else if (typeof data === 'boolean') {
		return { type: 'BOOL' };
	} else if (typeof data === 'number') {
		return { type: 'NUM' };
	} else if (Array.isArray(data)) {
		if (data.length === 0) return { type: 'EMPTY' };
		return {
			type: 'LIST',
			value: unionAllValues(
				...data.map((d) => analyzeStellarisGameStateShape(d, path.concat('$INDEX$'))),
			),
		};
	} else if (typeof data === 'object' && data != null) {
		if (Record.isEmptyRecord(data)) return { type: 'EMPTY' };
		if (isLocalizedText(data)) return { type: 'LOC' };
		if (path.at(-1) === 'scope') return { type: 'SCOPE' };
		// handle DB
		if (shouldAnalyzeAsDb(data, path)) {
			return {
				type: 'DB',
				value: unionAllValues(
					...Object.values(data).map((d) => analyzeStellarisGameStateShape(d, path.concat('$ID$'))),
				),
			};
		}
		// handle non-DB
		else {
			const basicObject: ObjectValue = {
				type: 'OBJECT',
				properties: Record.map(data, (d, key) =>
					analyzeStellarisGameStateShape(d, path.concat(key)),
				),
			};
			const multiKeys = basicObject.properties['$multiKeys'];
			if (multiKeys && multiKeys.type === 'OBJECT') {
				return {
					type: 'OBJECT',
					properties: pipe(
						basicObject.properties,
						Record.remove('$multiKeys'),
						Record.map((value, key) => {
							if (multiKeys.properties[key]) {
								const multiKeyValue = multiKeys.properties[key];
								if (multiKeyValue.type !== 'LIST')
									throw new Error(
										`Expected $multiKey property to be array, got ${multiKeyValue.type}`,
									);
								return { ...unionValues(value, multiKeyValue.value), multiple: true };
							} else {
								return value;
							}
						}),
					),
				};
			} else {
				return basicObject;
			}
		}
	} else if (data == null) {
		return { type: 'NULL' };
	} else {
		throw new Error(`Unhandled data type, ${typeof data}`);
	}
}

function unionAllValues(...values: Value[]): Value {
	return values.slice(1).reduce(unionValues, values[0] as Value);
}

function unionValues(a: Value, b: Value): Value {
	// same type
	if (a.type === 'UNION' && b.type === 'UNION') {
		// combine unions
		let union = a;
		for (const value of b.values) {
			union = addValueToUnion(union, value);
		}
		return union;
	} else if (a.type === 'OBJECT' && b.type === 'OBJECT') {
		// union each key in an OBJECT, mark optional if missing in one, retain optional/multiple if in either
		const allKeys = Array.dedupe(Object.keys(a.properties).concat(Object.keys(b.properties)));
		return {
			type: 'OBJECT',
			properties: Object.fromEntries(
				allKeys.map<[string, Property]>((key) => {
					const aValue = a.properties[key];
					const bValue = b.properties[key];
					if (aValue && bValue) {
						return [
							key,
							{
								...unionValues(aValue, bValue),
								...(aValue.optional === true || bValue.optional === true ? { optional: true } : {}),
								...(aValue.multiple === true || bValue.multiple === true ? { multiple: true } : {}),
							},
						];
					} else if (aValue) {
						return [key, { ...aValue, optional: true }];
					} else if (bValue) {
						return [key, { ...bValue, optional: true }];
					} else {
						throw new Error(`Key '${key}' missing from both a and b`);
					}
				}),
			),
		};
	} else if (a.type === 'LIST' && b.type === 'LIST') {
		// union the values in a LIST
		return {
			type: 'LIST',
			value: unionValues(a.value, b.value),
		};
	} else if (a.type === 'DB' && b.type === 'DB') {
		// union the values in a DB
		return {
			type: 'DB',
			value: unionValues(a.value, b.value),
		};
	} else if (a.type === b.type) {
		return a;
	}
	// different type
	else if (a.type === 'UNION') {
		// add type to existing union
		return addValueToUnion(a, b);
	} else if (b.type === 'UNION') {
		// add type to existing union
		return addValueToUnion(b, a);
	} else if (a.type === 'EMPTY' && isBlockValue(b)) {
		// empty + block = block
		return b;
	} else if (b.type === 'EMPTY' && isBlockValue(a)) {
		// empty + block = block
		return a;
	} else {
		//  otherwise, create new union
		return {
			type: 'UNION',
			values: [a, b],
		};
	}
}

function addValueToUnion(union: UnionValue, value: Value): UnionValue {
	if (value.type === 'EMPTY' && union.values.some(isBlockValue)) return union;
	const match = union.values.find((v) => v.type === value.type);
	if (match) {
		return {
			type: 'UNION',
			values: [...union.values.filter((v) => v !== match), unionValues(match, value)],
		};
	} else {
		return {
			type: 'UNION',
			values: [
				...union.values.filter((v) => {
					if (isBlockValue(v)) {
						return v.type !== 'EMPTY';
					} else {
						return true;
					}
				}),
				value,
			],
		};
	}
}

function isBlockValue(
	value: Value,
): value is ListValue | ObjectValue | DbValue | { type: 'EMPTY' } {
	return (
		value.type === 'LIST' ||
		value.type === 'OBJECT' ||
		value.type === 'DB' ||
		value.type === 'EMPTY'
	);
}

function isLocalizedText(data: Record<string, unknown>) {
	const numKeys = Object.keys(data).length;
	if (numKeys === 1) {
		return 'key' in data && typeof data.key === 'string';
	} else if (numKeys === 2) {
		return (
			'key' in data &&
			typeof data.key === 'string' &&
			'variables' in data &&
			Array.isArray(data.variables)
		);
	} else {
		return false;
	}
}

interface CondensedShape {
	[key: string]: string | CondensedShape | (string | CondensedShape)[];
}

export function condenseShapeAnalysis(shape: Value): CondensedShape | string {
	if (shape.type === 'OBJECT') {
		return Record.mapEntries(shape.properties, (value, key) => {
			let newKey = key;
			if (value.multiple) newKey += '+';
			if (value.optional) newKey += '?';
			let current = value;
			while (current.type === 'LIST' || current.type === 'DB') {
				newKey = `${newKey}|${current.type}`;
				current = current.value;
			}
			return [newKey, condenseShapeAnalysis(current)];
		});
	} else if (shape.type === 'LIST') {
		return {
			$LIST$: condenseShapeAnalysis(shape.value),
		};
	} else if (shape.type === 'DB') {
		return {
			$DB$: condenseShapeAnalysis(shape.value),
		};
	} else if (shape.type === 'UNION') {
		return {
			$UNION$: shape.values.map(condenseShapeAnalysis),
		};
	} else {
		return shape.type;
	}
}

function shouldAnalyzeAsDb(data: object, path: string[]) {
	const keys = Object.keys(data);
	if (keys.every((key) => Number.isFinite(parseInt(key)))) return true;
	if (DB_PROPERTIES.has(path.at(-1) ?? '')) return true;
	if (DB_PATHS.has(path.join(PATH_SEPARATOR))) return true;
	return false;
}
