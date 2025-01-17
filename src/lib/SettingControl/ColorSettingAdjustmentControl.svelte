<script lang="ts">
	import { createEventDispatcher } from 'svelte';
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
	}

	let { adjustment, config }: Props = $props();

	const dispatch = createEventDispatcher<{
		typeChange: ColorSettingAdjustment['type'];
		valueChange: number;
		delete: void;
	}>();

	function onTypeChange(e: Event & { currentTarget: EventTarget & HTMLSelectElement }) {
		dispatch('typeChange', e.currentTarget.value as ColorSettingAdjustment['type']);
	}
</script>

<div class="flex space-x-2" transition:fly>
	<select class="select w-1/2 p-1 text-sm" value={adjustment.type ?? ''} onchange={onTypeChange}>
		<option value="">{$t('control.color.adjustment.placeholder')}</option>
		{#each COLOR_SETTING_ADJUSTMENT_TYPES.filter((t) => !config.allowedAdjustments || config.allowedAdjustments.includes(t)) as type}
			<option value={type}>{$t(`option.color_adjustment.${type}`)}</option>
		{/each}
	</select>
	<input
		type="range"
		class="input w-1/2"
		min="0"
		max="1"
		step="0.05"
		value={adjustment.value}
		oninput={(e) => dispatch('valueChange', parseFloat(e.currentTarget.value))}
	/>
	<button type="button" class="text-error-400" onclick={() => dispatch('delete')}>
		<HeroiconTrashMini />
	</button>
</div>
