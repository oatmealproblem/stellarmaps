<script lang="ts">
	import { Accordion } from '@skeletonlabs/skeleton-svelte';

	import { t } from '../../intl';
	import {
		colorDynamicOptions,
		colorOptions,
		type ColorSetting,
		type SelectOption,
		type SettingConfigColor,
	} from '../settings';
	import { isDefined } from '../utils';
	import ColorSettingAdjustmentControl from './ColorSettingAdjustmentControl.svelte';

	interface Props {
		value: ColorSetting;
		config: SettingConfigColor<unknown, unknown>;
	}

	let { value = $bindable(), config }: Props = $props();

	let options = $derived([...colorOptions, ...colorDynamicOptions.current]);
	let groups = $derived(
		Array.from(
			new Set(
				options
					.map((option) => option.group)
					.filter(isDefined)
					.filter(
						// don't show dynamic colors group if no dynamic colors are allowed
						(group) =>
							!(group === 'option.color.group.dynamic' && config.allowedDynamicColors.length === 0),
					),
			),
		),
	);
	let selectValue = $derived(options.find((option) => option.id === value.color)?.id);

	function filterAllowedOption(option: SelectOption) {
		if (option.group !== 'option.color.group.dynamic') return true;
		return (config.allowedDynamicColors as string[]).includes(option.id);
	}
</script>

<div class="bg-surface-800 rounded-lg">
	<div class="p-2 pb-0">
		<label class="flex items-baseline">
			<span class="w-24">{t('control.color.label')}</span>
			<select
				class="select"
				value={selectValue}
				onchange={(e) => {
					value = { ...value, color: e.currentTarget.value };
				}}
			>
				{#each groups as group}
					<optgroup label={t(group)}>
						{#each options
							.filter((opt) => opt.group === group)
							.filter(filterAllowedOption) as option (option.id)}
							<option value={option.id}>{option.literalName ?? t(option.name)}</option>
						{/each}
					</optgroup>
				{/each}
			</select>
		</label>
	</div>
	<Accordion padding="p-2" collapsible>
		<Accordion.Item value="adjustments" panelPadding="p-0" controlPadding="py-1 px-0">
			{#snippet control()}
				{t('control.color.adjustment.header')}
				<span class="preset-filled-secondary-500 badge-icon relative -top-1">
					{value.colorAdjustments.length}
				</span>
			{/snippet}
			{#snippet panel()}
				<div class="flex-col space-y-1">
					{#each value.colorAdjustments as adjustment}
						<ColorSettingAdjustmentControl
							{config}
							{adjustment}
							onTypeChange={(e) => {
								value = {
									...value,
									colorAdjustments: value.colorAdjustments.map((a) =>
										a === adjustment ? { ...a, type: e } : a,
									),
								};
							}}
							onValueChange={(e) => {
								value = {
									...value,
									colorAdjustments: value.colorAdjustments.map((a) =>
										a === adjustment ? { ...a, value: e } : a,
									),
								};
							}}
							onDelete={() => {
								value = {
									...value,
									colorAdjustments: value.colorAdjustments.filter((a) => a !== adjustment),
								};
							}}
						/>
					{/each}
					<button
						type="button"
						class="preset-filled-secondary-500 btn btn-sm"
						onclick={() => {
							value = {
								...value,
								colorAdjustments: [...value.colorAdjustments, { type: undefined, value: 0 }],
							};
						}}
					>
						{t('control.color.adjustment.add_button')}
					</button>
				</div>
			{/snippet}
		</Accordion.Item>
	</Accordion>
</div>
