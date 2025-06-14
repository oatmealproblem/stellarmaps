import { Schema } from 'effect';

class Color extends Schema.Class<Color>('Color')({
	name: Schema.String,
	cssValue: Schema.String,
}) {}

class Emblem extends Schema.Class<Emblem>('Emblem')({
	name: Schema.String,
}) {}

class ConnectionType extends Schema.Class<ConnectionType>('ConnectionType')({
	name: Schema.String,
	type: Schema.Literal('unidirectional', 'bidirectional', 'all'),
	// cluster sensitive
	// border sensitive
}) {}

export class Definitions extends Schema.Class<Definitions>('Definitions')({
	colors: Schema.Record({
		key: Schema.String,
		value: Color,
	}),
	emblems: Schema.Record({
		key: Schema.String,
		value: Emblem,
	}),
	connectionType: Schema.Record({
		key: Schema.String,
		value: ConnectionType,
	}),
}) {}
