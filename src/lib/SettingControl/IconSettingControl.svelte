<script lang="ts">
	import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';

	import { t } from '../../intl';
	import {
		ICON_POSITIONS,
		iconOptions,
		type IconPosition,
		type IconSetting,
		type SettingConfigIcon,
	} from '../settings';
	import { isDefined } from '../utils';
	import ColorSettingControl from './ColorSettingControl.svelte';

	interface Props {
		value: IconSetting;
		config: SettingConfigIcon<Record<string, any>, string>;
	}

	let { value = $bindable(), config }: Props = $props();
	let color = $state.raw(value.color);
	$effect(() => {
		if (value.color !== color) {
			value = { ...value, color };
		}
	});

	let groups = Array.from(new Set(iconOptions.map((option) => option.group).filter(isDefined)));

	function asIconPosition(s: string) {
		return s as IconPosition;
	}
	function asAny(x: any) {
		return x;
	}
</script>

{#if !value.enabled}
	<div class="rounded-lg bg-surface-800 p-2 text-surface-300">{t('generic.disabled')}</div>
{:else}
	<div class="rounded-lg bg-surface-800">
		<div class="p-2 pb-0">
			<label class="flex items-baseline">
				<span class="w-24">{t('control.icon.label')}</span>
				<select
					class="select"
					value={value.icon}
					onchange={(e) => {
						value = { ...value, icon: e.currentTarget.value };
					}}
				>
					{#each groups as group}
						<optgroup label={t(group)}>
							{#each iconOptions.filter((opt) => opt.group === group) as option (option.id)}
								<option value={option.id}>{option.literalName ?? t(option.name)}</option>
							{/each}
						</optgroup>
					{/each}
				</select>
			</label>
			<label class="mt-2 flex items-baseline">
				<span class="w-24">{t('control.icon.size')}</span>
				<input
					class="input"
					type="number"
					step="0.5"
					value={value.size}
					oninput={(e) => {
						const parsed = parseFloat(e.currentTarget.value);
						if (!Number.isNaN(parsed)) {
							value = { ...value, size: parsed };
						}
					}}
				/>
			</label>
		</div>
		{#if !config.noAdvanced}
			<Accordion
				regionControl="text-sm text-secondary-300"
				hover="hover:bg-secondary-700"
				padding="p-2"
				spacing="space-y-1"
				regionPanel="pt-0"
			>
				<AccordionItem>
					{#snippet summary()}
						{t('control.icon.advanced_options.header')}
					{/snippet}
					{#snippet content()}
						<div class="flex-col space-y-1">
							<div class="flex items-baseline text-sm">
								<label for="{config.id}-smoothing" class="ms-1 w-24 cursor-pointer">
									{t('control.icon.advanced_options.position')}
								</label>
								<select
									id="{config.id}-position"
									class="select p-1 text-sm"
									value={value.position}
									onchange={(e) => {
										value = {
											...value,
											position: asIconPosition(e.currentTarget.value),
										};
									}}
								>
									{#each ICON_POSITIONS as position}
										<option value={position}>{t(`option.icon_position.${position}`)}</option>
									{/each}
								</select>
							</div>
							<div class="flex items-baseline text-sm">
								<label for="{config.id}-smoothing" class="ms-1 w-24 cursor-pointer">
									{t('control.icon.advanced_options.priority')}
								</label>
								<input
									id="{config.id}-priority"
									class="input p-1 text-sm"
									type="number"
									value={value.priority}
									onchange={(e) => {
										const parsed = parseFloat(e.currentTarget.value);
										if (Number.isNaN(parsed)) {
											value = {
												...value,
												priority: parseInt(e.currentTarget.value),
											};
										}
									}}
								/>
							</div>
						</div>
					{/snippet}
				</AccordionItem>
			</Accordion>
		{/if}
		<ColorSettingControl
			bind:value={color}
			config={{
				id: asAny(`${config.id}-color`),
				type: 'color',
				allowedDynamicColors: config.allowedDynamicColors,
			}}
		/>
	</div>
{/if}
