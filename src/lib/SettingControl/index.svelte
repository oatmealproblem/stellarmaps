<script lang="ts">
	import { popup, RangeSlider, SlideToggle } from '@skeletonlabs/skeleton';
	import { slide } from 'svelte/transition';

	import { t } from '../../intl';
	import HeroiconInfoMini from '../icons/HeroiconInfoMini.svelte';
	import {
		asKnownSettingId,
		emptyOptions,
		type UnknownSettingConfig,
		validateSetting,
	} from '../settings';
	import { isDefined } from '../utils';
	import ColorSettingControl from './ColorSettingControl.svelte';
	import IconSettingControl from './IconSettingControl.svelte';
	import StrokeSettingControl from './StrokeSettingControl.svelte';

	interface Props {
		settings: { current: Record<string, any> };
		writeToSettings?: { current: Record<string, any> }[];
		config: UnknownSettingConfig;
	}

	let { settings, writeToSettings = [], config }: Props = $props();

	function getValue() {
		return settings.current[config.id];
	}
	function updateValue(v: any) {
		settings.current = {
			...settings.current,
			[config.id]: v,
		};
		writeToSettings.forEach((otherSettings) => {
			otherSettings.current = {
				...settings.current,
				[config.id]: v,
			};
		});
	}
	const value = $derived.by(getValue);

	const handleNumberInput = $derived((v: string) => {
		const newValue = parseFloat(v);
		if (Number.isFinite(newValue)) {
			settings.current = {
				...settings.current,
				[config.id]: newValue,
			};
		} else if (config.type === 'number' && config.optional) {
			settings.current = {
				...settings.current,
				[config.id]: null,
			};
		}
	});

	let hidden = $derived(config.hideIf?.(settings.current));

	const dynamicOptions = $derived(
		config.type === 'select' && config.dynamicOptions != null
			? config.dynamicOptions
			: emptyOptions,
	);

	let options = $derived(
		config.type === 'select' ? [...config.options, ...dynamicOptions.current] : [],
	);
	let groups = $derived(
		Array.from(new Set(options.map((option) => option.group).filter(isDefined))),
	);

	let [valid, invalidMessage, invalidMessageValues] = $derived(validateSetting(value, config));

	const richTextHandlers = {
		ul: (s: string[]) => `<ul class="list-disc ps-4">${s.join()}</ul>`,
		li: (s: string[]) => `<li>${s.join()}</li>`,
		strong: (s: string[]) => `<strong class="text-warning-500">${s.join()}</strong>`,
	};
</script>

{#if !hidden}
	<label class="label" for={config.id} transition:slide>
		<div class="flex items-center">
			{t(`setting.${asKnownSettingId(config.id)}`)}
			{#if config.tooltip}
				<button
					type="button"
					class="text-secondary-500-400-token ms-1 *:pointer-events-none"
					use:popup={{ event: 'hover', target: `${config.id}-tooltip`, placement: 'top' }}
				>
					<HeroiconInfoMini />
				</button>
				<div
					class="card variant-filled-secondary z-10 max-w-96 p-2 text-sm"
					data-popup="{config.id}-tooltip"
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- this is safe, all tooltip text is provided by the app -->
					{@html t(config.tooltip, richTextHandlers)}
					<div class="variant-filled-secondary arrow"></div>
				</div>
			{/if}
			<div class="grow"></div>
			{#if (config.type === 'stroke' && !config.noDisable) || config.type === 'icon'}
				<div class="relative top-1 inline-block">
					<SlideToggle
						name={config.id}
						bind:checked={() => value.enabled,
						(checked) => {
							updateValue({ ...value, enabled: checked });
						}}
						size="sm"
						active="variant-filled-primary"
						label="Enabled"
					/>
				</div>
			{/if}
		</div>
		{#if config.type === 'number'}
			<input
				class="input"
				class:input-error={!valid}
				type="number"
				bind:value={getValue, handleNumberInput}
				min={config.min}
				max={config.max}
				step={config.step}
			/>
		{:else if config.type === 'range'}
			<RangeSlider
				name={config.id}
				bind:value={getValue, updateValue}
				min={config.min}
				max={config.max}
				step={config.step}
			/>
		{:else if config.type === 'text'}
			<input class="input" type="text" bind:value={getValue, updateValue} />
		{:else if config.type === 'select'}
			<select class="select" bind:value={getValue, updateValue}>
				{#each options.filter((opt) => opt.group == null) as option (option.id)}
					<option value={option.id}>{option.literalName ?? t(option.name)}</option>
				{/each}
				{#each groups as group}
					<optgroup label={t(group)}>
						{#each options.filter((opt) => opt.group === group) as option (option.id)}
							<option value={option.id}>{option.literalName ?? t(option.name)}</option>
						{/each}
					</optgroup>
				{/each}
			</select>
		{:else if config.type === 'toggle'}
			<div>
				<SlideToggle name={config.id} bind:checked={getValue, updateValue} active="bg-primary-500">
					{value === true ? t('generic.enabled') : t('generic.disabled')}
				</SlideToggle>
			</div>
		{:else if config.type === 'color'}
			<ColorSettingControl bind:value={getValue, updateValue} {config} />
		{:else if config.type === 'stroke'}
			<StrokeSettingControl bind:value={getValue, updateValue} {config} />
		{:else if config.type === 'icon'}
			<IconSettingControl bind:value={getValue, updateValue} {config} />
		{:else}
			<span>WARNING: unimplemented control</span>
		{/if}
		{#if !valid && invalidMessage}
			<span class="text-error-300">{t(invalidMessage, invalidMessageValues)}</span>
		{/if}
	</label>
{/if}
