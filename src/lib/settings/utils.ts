import type { PrimitiveType } from 'intl-messageformat';
import * as R from 'rambda';

import type { MessageID } from '../../intl';
import type { AppSettings } from './appSettings.svelte';
import { zColorSetting } from './ColorSetting';
import { zIconSetting } from './IconSetting';
import { type MapSettings } from './mapSettings';
import { mapSettingsConfig } from './mapSettingsConfig';
import type { AppSettingConfig, MapSettingConfig, UnknownSettingConfig } from './SettingConfig';
import { zStrokeSetting } from './StrokeSetting';

export function isColorDynamic(color: string, settings: MapSettings): boolean {
	return (
		['primary', 'secondary'].includes(color) ||
		(color === 'border' && isColorDynamic(settings.borderColor.color, settings))
	);
}

export function copyGroupSettings(
	groupId: string,
	fromSettings: MapSettings,
	toSettings: MapSettings,
) {
	const newSettings = {
		...toSettings,
	};
	const group = mapSettingsConfig.find((group) => group.id === groupId);
	group?.settings.forEach((setting) => {
		// @ts-expect-error -- ts doesn't recognize that since the same expression is used for the key, the value will be the right type
		newSettings[setting.id] = fromSettings[setting.id];
	});
	return newSettings;
}

export function validateSetting<T extends UnknownSettingConfig>(
	value: unknown,
	config: T,
): [boolean] | [boolean, MessageID, Record<string, PrimitiveType>] {
	switch (config.type) {
		case 'color': {
			const result = zColorSetting.safeParse(value);
			if (result.success) {
				const { data } = result;
				if (config.allowedAdjustments) {
					return [
						data.colorAdjustments.every(
							(adjustment) =>
								adjustment.type == null || config.allowedAdjustments?.includes(adjustment.type),
						),
					];
				} else {
					return [true];
				}
			} else {
				return [false];
			}
		}
		case 'icon': {
			const result = zIconSetting.safeParse(value);
			return [result.success];
		}
		case 'number': {
			if (typeof value === 'number') {
				const min = config.min ?? -Infinity;
				const max = config.max ?? Infinity;
				const message =
					Number.isFinite(min) && Number.isFinite(max)
						? `validation.min_max`
						: Number.isFinite(min)
							? `validation.min`
							: `validation.max`;
				return [value >= min && value <= max, message, { min, max }];
			} else if (value == null) {
				return [Boolean(config.optional), 'validation.required', {}];
			} else {
				return [false];
			}
		}
		case 'range': {
			if (typeof value === 'number') {
				return [value >= config.min && value <= config.max];
			} else {
				return [false];
			}
		}
		case 'select': {
			if (typeof value === 'string') {
				if (config.dynamicOptions) {
					// dynamic options aren't checked for now; assume valid
					return [true];
				} else {
					return [config.options.some((option) => option.id === value)];
				}
			} else {
				return [false];
			}
		}
		case 'stroke': {
			const result = zStrokeSetting.safeParse(value);
			if (result.success) {
				const { data } = result;
				if (data.dashed && config.noDashed) return [false];
				if (data.smoothing && config.noSmoothing) return [false];
				return [true];
			} else {
				return [false];
			}
		}
		case 'text': {
			return [typeof value === 'string'];
		}
		case 'toggle': {
			return [typeof value === 'boolean'];
		}
		default: {
			console.warn(`unknown setting type ${(config as { type?: unknown }).type}`);
			return [false];
		}
	}
}
export function asUnknownSettingConfig(config: AppSettingConfig | MapSettingConfig) {
	return config as UnknownSettingConfig;
}

export function asKnownSettingId(id: string) {
	return id as keyof MapSettings | keyof AppSettings;
}

interface SettingsAreDifferentOptions {
	requiresReprocessingOnly?: boolean;
	excludeGroups?: string[];
}
export function settingsAreDifferent(
	a: MapSettings,
	b: MapSettings,
	{ requiresReprocessingOnly = false, excludeGroups }: SettingsAreDifferentOptions = {},
) {
	return mapSettingsConfig
		.filter((group) => !excludeGroups?.includes(group.id))
		.flatMap((group) => group.settings)
		.filter((setting) => !requiresReprocessingOnly || setting.requiresReprocessing)
		.some((setting) => {
			if (requiresReprocessingOnly && typeof setting.requiresReprocessing === 'function') {
				const settingType = setting.type;
				// switch is required for type inference
				switch (settingType) {
					case 'toggle':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'color':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'number':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'range':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'text':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'select':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'stroke':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'icon':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					default:
						throw new Error(`Unhandled setting type: ${settingType}`);
				}
			}
			return !R.equals(a[setting.id], b[setting.id]);
		});
}
