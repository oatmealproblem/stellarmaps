import type { MessageID } from '../../intl';
import type { AppSettings, BooleanAppSettings, StringAppSettings } from './appSettings.svelte';
import type { ColorSetting, ColorSettingAdjustmentType } from './ColorSetting';
import type { IconSetting } from './IconSetting';
import type {
	BooleanMapSettings,
	ColorMapSettings,
	IconMapSettings,
	MapSettings,
	NumberMapSettings,
	NumberOptionalMapSettings,
	StringMapSettings,
	StrokeMapSettings,
} from './mapSettings';
import type { SelectOption } from './SelectOption';
import type { StrokeSetting } from './StrokeSetting';

type RequiresReprocessingFunc<T> = (prev: T, next: T) => boolean;
interface SettingConfigBase<Settings, ID> {
	id: ID;
	requiresReprocessing?: boolean | RequiresReprocessingFunc<any>;
	hideIf?: (settings: Settings) => boolean;
	tooltip?: MessageID;
}
interface SettingConfigToggle<Settings, ID> extends SettingConfigBase<Settings, ID> {
	type: 'toggle';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<boolean>;
}
interface SettingConfigNumber<Settings, ID> extends SettingConfigBase<Settings, ID> {
	type: 'number';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<null | number>;
	min?: number;
	max?: number;
	step: number;
	optional?: boolean;
}
interface SettingConfigRange<Settings, ID> extends SettingConfigBase<Settings, ID> {
	type: 'range';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<null | number>;
	min: number;
	max: number;
	step: number;
}
interface SettingConfigSelect<Settings, ID> extends SettingConfigBase<Settings, ID> {
	type: 'select';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<string>;
	options: SelectOption[];
	dynamicOptions?: { current: SelectOption[] };
}
interface SettingConfigText<Settings, ID> extends SettingConfigBase<Settings, ID> {
	type: 'text';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<string>;
}

export interface SettingConfigColor<Settings, ID> extends SettingConfigBase<Settings, ID> {
	type: 'color';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<ColorSetting>;
	allowedAdjustments?: ColorSettingAdjustmentType[];
	allowedDynamicColors: ('primary' | 'secondary' | 'border' | 'planet' | 'planet_complement')[];
}

export interface SettingConfigStroke<Settings, ID> extends SettingConfigBase<Settings, ID> {
	type: 'stroke';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<StrokeSetting>;
	noSmoothing?: boolean;
	noDashed?: boolean;
	noDisable?: boolean;
}

export interface SettingConfigIcon<Settings, ID> extends SettingConfigBase<Settings, ID> {
	type: 'icon';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<IconSetting>;
	noAdvanced?: boolean;
	allowedDynamicColors: SettingConfigColor<Settings, ID>['allowedDynamicColors'];
}

export type UnknownSettingConfig =
	| SettingConfigText<unknown, string>
	| SettingConfigToggle<unknown, string>
	| SettingConfigNumber<unknown, string>
	| SettingConfigRange<unknown, string>
	| SettingConfigSelect<unknown, string>
	| SettingConfigColor<unknown, string>
	| SettingConfigStroke<unknown, string>
	| SettingConfigIcon<unknown, string>;

export type MapSettingConfig =
	| SettingConfigText<MapSettings, StringMapSettings>
	| SettingConfigToggle<MapSettings, BooleanMapSettings>
	| SettingConfigNumber<MapSettings, NumberMapSettings | NumberOptionalMapSettings>
	| SettingConfigRange<MapSettings, NumberMapSettings>
	| SettingConfigSelect<MapSettings, StringMapSettings>
	| SettingConfigColor<MapSettings, ColorMapSettings>
	| SettingConfigStroke<MapSettings, StrokeMapSettings>
	| SettingConfigIcon<MapSettings, IconMapSettings>;

export type AppSettingConfig =
	| SettingConfigSelect<AppSettings, StringAppSettings>
	| SettingConfigToggle<AppSettings, BooleanAppSettings>;

export interface MapSettingConfigGroup {
	id: string;
	name: MessageID;
	settings: MapSettingConfig[];
}
