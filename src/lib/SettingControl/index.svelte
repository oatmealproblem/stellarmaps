<script lang="ts">
	import { popup, RangeSlider, SlideToggle } from '@skeletonlabs/skeleton';
	import { onDestroy } from 'svelte';
	import type { FormEventHandler } from 'svelte/elements';
	import { get, type Readable, type Writable } from 'svelte/store';
	import { slide } from 'svelte/transition';

	import { t } from '../../intl';
	import HeroiconInfoMini from '../icons/HeroiconInfoMini.svelte';
	import {
		asKnownSettingId,
		emptyOptions,
		type SelectOption,
		type UnknownSettingConfig,
		validateSetting,
	} from '../settings';
	import { isDefined } from '../utils';
	import ColorSettingControl from './ColorSettingControl.svelte';
	import IconSettingControl from './IconSettingControl.svelte';
	import StrokeSettingControl from './StrokeSettingControl.svelte';

	interface Props {
		settings: Writable<Record<string, any>>;
		writeToSettings?: Writable<Record<string, any>>[];
		config: UnknownSettingConfig;
	}

	let { settings, writeToSettings = [], config }: Props = $props();

	let value: any = $state.raw(get(settings)[config.id]);
	let unsubscribe = settings.subscribe((values) => {
		value = values[config.id];
	});
	$effect(() => {
		if (value !== $settings[config.id]) {
			settings.update((prev) => ({
				...prev,
				[config.id]: value,
			}));
			for (const otherSettings of writeToSettings) {
				otherSettings.update((prev) => ({
					...prev,
					[config.id]: value,
				}));
			}
		}
	});

	const handleNumberInput: FormEventHandler<HTMLInputElement> = (e) => {
		const newValue = parseFloat(e.currentTarget.value);
		if (Number.isFinite(newValue)) {
			value = newValue;
		} else if (config.type === 'number' && config.optional) {
			value = null;
		}
	};

	let hidden = $derived(config.hideIf?.($settings as any));

	const dynamicOptions: Readable<SelectOption[]> =
		config.type === 'select' && config.dynamicOptions != null
			? config.dynamicOptions
			: emptyOptions;

	let options = $derived(config.type === 'select' ? [...config.options, ...$dynamicOptions] : []);
	let groups = $derived(
		Array.from(new Set(options.map((option) => option.group).filter(isDefined))),
	);

	function handleStrokeToggle(e: Event) {
		value = { ...value, enabled: (e.currentTarget as HTMLInputElement).checked };
	}

	let [valid, invalidMessage, invalidMessageValues] = $derived(validateSetting(value, config));

	const richTextHandlers = {
		ul: (s: string[]) => `<ul class="list-disc ps-4">${s.join()}</ul>`,
		li: (s: string[]) => `<li>${s.join()}</li>`,
		strong: (s: string[]) => `<strong class="text-warning-500">${s.join()}</strong>`,
	};

	onDestroy(() => {
		unsubscribe();
	});
</script>

{#if !hidden}
	<label class="label" for={config.id} transition:slide>
		<div class="flex items-center">
			{$t(`setting.${asKnownSettingId(config.id)}`)}
			{#if config.tooltip}
				<button
					type="button"
					class="text-secondary-500-400-token ms-1 [&>*]:pointer-events-none"
					use:popup={{ event: 'hover', target: `${config.id}-tooltip`, placement: 'top' }}
				>
					<HeroiconInfoMini />
				</button>
				<div
					class="card variant-filled-secondary z-10 max-w-96 p-2 text-sm"
					data-popup="{config.id}-tooltip"
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- this is safe, all tooltip text is provided by the app -->
					{@html $t(config.tooltip, richTextHandlers)}
					<div class="variant-filled-secondary arrow"></div>
				</div>
			{/if}
			<div class="grow"></div>
			{#if (config.type === 'stroke' && !config.noDisable) || config.type === 'icon'}
				<div class="relative top-1 inline-block">
					<SlideToggle
						name={config.id}
						checked={value.enabled}
						size="sm"
						active="variant-filled-primary"
						label="Enabled"
						on:change={handleStrokeToggle}
					/>
				</div>
			{/if}
		</div>
		{#if config.type === 'number'}
			<input
				class="input"
				class:input-error={!valid}
				type="number"
				value={value ?? ''}
				oninput={handleNumberInput}
				min={config.min}
				max={config.max}
				step={config.step}
			/>
		{:else if config.type === 'range'}
			<RangeSlider
				name={config.id}
				bind:value
				min={config.min}
				max={config.max}
				step={config.step}
			/>
		{:else if config.type === 'text'}
			<input class="input" type="text" bind:value />
		{:else if config.type === 'select'}
			<select class="select" bind:value>
				{#each options.filter((opt) => opt.group == null) as option (option.id)}
					<option value={option.id}>{option.literalName ?? $t(option.name)}</option>
				{/each}
				{#each groups as group}
					<optgroup label={$t(group)}>
						{#each options.filter((opt) => opt.group === group) as option (option.id)}
							<option value={option.id}>{option.literalName ?? $t(option.name)}</option>
						{/each}
					</optgroup>
				{/each}
			</select>
		{:else if config.type === 'toggle'}
			<div>
				<SlideToggle name={config.id} bind:checked={value} active="bg-primary-500">
					{value === true ? $t('generic.enabled') : $t('generic.disabled')}
				</SlideToggle>
			</div>
		{:else if config.type === 'color'}
			<ColorSettingControl bind:value {config} />
		{:else if config.type === 'stroke'}
			<StrokeSettingControl bind:value {config} />
		{:else if config.type === 'icon'}
			<IconSettingControl bind:value {config} />
		{:else}
			<span>WARNING: unimplemented control</span>
		{/if}
		{#if !valid && invalidMessage}
			<span class="text-error-300">{$t(invalidMessage, invalidMessageValues)}</span>
		{/if}
	</label>
{/if}
