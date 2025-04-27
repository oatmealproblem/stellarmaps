<script lang="ts">
	import { Slider, Switch, Tooltip } from '@skeletonlabs/skeleton-svelte';
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
				<Tooltip
					arrow
					triggerBase="ms-1 text-secondary-700-300"
					contentBackground="preset-filled-secondary-500"
					arrowBackground="preset-filled-secondary-500!"
					contentBase="p-2 rounded-base"
					openDelay={200}
					closeDelay={200}
					positioning={{ placement: 'top' }}
				>
					{#snippet trigger()}
						<HeroiconInfoMini />
					{/snippet}
					{#snippet content()}
						<!-- eslint-disable-next-line svelte/no-at-html-tags -- this is safe, all tooltip text is provided by the app -->
						{@html t(config.tooltip!, richTextHandlers)}
					{/snippet}
				</Tooltip>
			{/if}
			<div class="grow"></div>
			{#if (config.type === 'stroke' && !config.noDisable) || config.type === 'icon'}
				<div class="relative top-1 inline-block">
					<Switch
						name={config.id}
						checked={value.enabled}
						onCheckedChange={(details) => updateValue({ ...value, enabled: details.checked })}
						controlActive="preset-filled-primary-500"
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
			<Slider
				name={config.id}
				value={[getValue()]}
				onValueChange={(details) => updateValue(details.value[0])}
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
				<Switch
					name={config.id}
					checked={getValue()}
					onCheckedChange={(details) => updateValue(details.checked)}
					controlActive="bg-primary-500"
				>
					{value === true ? t('generic.enabled') : t('generic.disabled')}
				</Switch>
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
