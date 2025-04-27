<script lang="ts">
	import { fly } from 'svelte/transition';

	import { t } from '../../intl';
	import HeroiconTrashMini from '../icons/HeroiconTrashMini.svelte';
	import {
		COLOR_SETTING_ADJUSTMENT_TYPES,
		type ColorSettingAdjustment,
		type SettingConfigColor,
	} from '../settings';

	interface Props {
		adjustment: ColorSettingAdjustment;
		config: SettingConfigColor<unknown, unknown>;
		onTypeChange: (type: ColorSettingAdjustment['type']) => void;
		onValueChange: (value: number) => void;
		onDelete: () => void;
	}

	let { adjustment, config, onValueChange, onTypeChange, onDelete }: Props = $props();

	function onTypeSelectChange(e: Event & { currentTarget: EventTarget & HTMLSelectElement }) {
		onTypeChange(e.currentTarget.value as ColorSettingAdjustment['type']);
	}
</script>

<div class="flex space-x-2" transition:fly>
	<select
		class="select w-1/2 p-1 text-sm"
		value={adjustment.type ?? ''}
		onchange={onTypeSelectChange}
	>
		<option value="">{t('control.color.adjustment.placeholder')}</option>
		{#each COLOR_SETTING_ADJUSTMENT_TYPES.filter((t) => !config.allowedAdjustments || config.allowedAdjustments.includes(t)) as type}
			<option value={type}>{t(`option.color_adjustment.${type}`)}</option>
		{/each}
	</select>
	<input
		type="range"
		class="input w-1/2"
		min="0"
		max="1"
		step="0.05"
		value={adjustment.value}
		oninput={(e) => onValueChange(parseFloat(e.currentTarget.value))}
	/>
	<button type="button" class="text-error-400" onclick={() => onDelete()}>
		<HeroiconTrashMini />
	</button>
</div>
