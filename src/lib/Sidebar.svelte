<script lang="ts">
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	import * as dialog from '@tauri-apps/plugin-dialog';
	import { Menu } from 'spare-bones';
	import { z } from 'zod';

	import { t } from '../intl';
	import {
		analyzeStellarisGameStateShape,
		condenseShapeAnalysis,
	} from './analyzeStellarisGameStateShape';
	import ApplyChangesButton from './ApplyChangesButton.svelte';
	import debug from './debug';
	import { gameStatePromise, gameStateSchema } from './GameState.svelte';
	import HeroiconTrashMini from './icons/HeroiconTrashMini.svelte';
	import { localizeText } from './map/data/locUtils';
	import SettingControl from './SettingControl/index.svelte';
	import {
		applyMapSettings,
		asUnknownSettingConfig,
		copyGroupSettings,
		countryOptions,
		editedMapSettings,
		lastProcessedMapSettings,
		mapSettings,
		mapSettingsConfig,
		presetMapSettings,
		type SavedMapSettings,
		settingsAreDifferent,
		zSavedMapSettings,
	} from './settings';
	import { speciesOptions } from './settings/options/speciesOptions';
	import { PersistedRawState } from './stateUtils.svelte';
	import type { StellarisSaveMetadata } from './stellarMapsApi';
	import stellarMapsApi from './stellarMapsApi';
	import { toaster } from './Toaster.svelte';
	import { saveToWindow, timeIt, timeItAsync, toastError, wait } from './utils';

	let selectedSaveGroup: [StellarisSaveMetadata, ...StellarisSaveMetadata[]] | null = $state(null);
	let selectedSave: StellarisSaveMetadata | null = $state(null);
	let loadedSave: StellarisSaveMetadata | null = $state(null);

	function loadSaves() {
		return stellarMapsApi.loadSaveMetadata().catch(
			toastError({
				title: t('notification.failed_to_load_save_list'),
				defaultValue: [] as StellarisSaveMetadata[][],
			}),
		);
	}
	let savesPromise = $state(loadSaves());

	function refreshSaves() {
		selectedSaveGroup = null;
		selectedSave = null;
		savesPromise = loadSaves();
	}

	function manuallySelectSave() {
		dialog
			.open({
				directory: false,
				multiple: false,
				title: t('prompt.select_save_file'),
				filters: [{ name: t('prompt.select_save_file_filter_name'), extensions: ['sav'] }],
			})
			.then((path) => {
				if (typeof path === 'string') {
					selectedSaveGroup = null;
					selectedSave = null;
					loadSave(path);
				}
			});
	}

	function loadSave(path: string) {
		const promise = wait(100)
			.then(() => timeItAsync('loadSave', stellarMapsApi.loadSave, path))
			.then((unvalidated) =>
				timeIt('validateSave', () => {
					if (debug.current) {
						saveToWindow('unvalidatedGameState', unvalidated);
						const shape = analyzeStellarisGameStateShape(unvalidated);
						console.log(condenseShapeAnalysis(shape));
						saveToWindow('gameStateShape', shape);
					}
					return gameStateSchema.parse(unvalidated);
				}),
			);
		promise.then(async (gameState) => {
			Promise.all(
				Object.values(gameState.country)
					.filter((country) => country.type === 'default')
					.map((country) =>
						localizeText(country.name).then((name) => ({
							id: country.id.toString(),
							literalName: name,
						})),
					),
			).then((value) => {
				countryOptions.current = value;
			});
			const speciesWithPopulation = new Set(
				Object.values(gameState.planets.planet).flatMap((planet) =>
					Object.keys(planet.species_information ?? {}).map((id) => parseInt(id)),
				),
			);
			Promise.all(
				Object.values(gameState.species_db)
					.filter(
						(species) =>
							speciesWithPopulation.has(species.id) &&
							species.base_ref == null &&
							species.name.key !== 'UNKNOWN',
					)
					.map((species) =>
						localizeText(species.name).then((name) => ({
							id: species.id.toString(),
							literalName: name,
						})),
					),
			).then((value) => {
				speciesOptions.current = value;
			});
		});
		gameStatePromise.current = promise;

		// update settings that depend on save-specific options
		editedMapSettings.current = {
			...editedMapSettings.current,
			terraIncognitaPerspectiveCountry: 'player',
			mapModePointOfView: 'player',
			mapModeSpecies: 'player',
		};
		mapSettings.current = {
			...mapSettings.current,
			terraIncognitaPerspectiveCountry: 'player',
			mapModePointOfView: 'player',
			mapModeSpecies: 'player',
		};
		lastProcessedMapSettings.current = {
			...lastProcessedMapSettings.current,
			terraIncognitaPerspectiveCountry: 'player',
			mapModePointOfView: 'player',
			mapModeSpecies: 'player',
		};

		promise.catch(
			toastError({
				title: t('notification.failed_to_load_save_file', { filePath: path }),
				defaultValue: null,
			}),
		);
	}

	const loadedSettingsKey = new PersistedRawState({
		name: 'loadedSettingsKey',
		defaultValue: 'PRESET|Default',
		schema: z.string().catch('PRESET|Default'),
	});
	async function loadSettings(type: 'PRESET' | 'CUSTOM', savedSettings: SavedMapSettings) {
		const loadedSettingsName = loadedSettingsKey.current.substring(
			loadedSettingsKey.current.indexOf('|') + 1,
		);
		const loadedSettings = loadedSettingsKey.current.startsWith('PRESET')
			? presetMapSettings.find((preset) => preset.name === loadedSettingsName)
			: customSavedSettings.current.find((saved) => saved.name === loadedSettingsName);
		let confirmed = true;
		if (
			!loadedSettings ||
			settingsAreDifferent(loadedSettings.settings, editedMapSettings.current, {
				excludeGroups: ['mapMode'],
			})
		) {
			confirmed = await dialog.confirm(
				t('confirmation.unsaved_setting_profile'),
				t('generic.confirmation'),
			);
		}
		if (confirmed) {
			loadedSettingsKey.current = `${type}|${savedSettings.name}`;
			if (
				settingsAreDifferent(savedSettings.settings, mapSettings.current, {
					excludeGroups: ['mapMode'],
				})
			) {
				const savedSettingsWithUnchangedMapMode = copyGroupSettings(
					'mapMode',
					editedMapSettings.current,
					savedSettings.settings,
				);
				editedMapSettings.current = savedSettingsWithUnchangedMapMode;
				mapSettings.current = savedSettingsWithUnchangedMapMode;
				lastProcessedMapSettings.current = savedSettingsWithUnchangedMapMode;
			}
		}
	}

	const customSavedSettings = new PersistedRawState({
		name: 'customSavedSettings',
		defaultValue: [],
		schema: z.array(zSavedMapSettings).catch([]),
	});
	function saveSettings() {
		// TODO use a custom prompt instead of blocking builtin prompt()
		const response = prompt(t('prompt.enter_settings_profile_name'));
		if (typeof response === 'string') {
			customSavedSettings.current = customSavedSettings.current
				.filter((saved) => saved.name !== response)
				.concat([
					{
						name: response,
						settings: mapSettings.current,
					},
				])
				.sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()));
			loadedSettingsKey.current = `CUSTOM|${response}`;
			toaster.addToast({
				data: {
					kind: 'success',
					title: t('notification.settings_profile_saved', { name: response }),
				},
			});
		}
	}
</script>

<div id="sidebar-left" class="flex h-full w-128 flex-col">
	<form
		class="p-4"
		onsubmit={(e) => {
			e.preventDefault();
			loadedSave = selectedSave;
			if (selectedSave != null) {
				loadSave(selectedSave.path);
			}
		}}
	>
		<div class="flex">
			<h2 class="label flex-1">{t('side_bar.save_game')}</h2>
			<button type="button" class="text-surface-300 text-sm" onclick={manuallySelectSave}>
				{t('side_bar.select_manually_button')}
			</button>
			<span class="text-surface-600 px-2">|</span>
			<button type="button" class="text-surface-300 text-sm" onclick={refreshSaves}>
				{t('side_bar.refresh_saves_button')}
			</button>
		</div>
		<select
			class="select mb-1"
			bind:value={() => selectedSaveGroup,
			(value) => {
				selectedSaveGroup = value;
				selectedSave = selectedSaveGroup?.[0] ?? null;
			}}
		>
			{#if selectedSaveGroup == null}
				<option value={null} disabled>{t('side_bar.select_save_placeholder')}</option>
			{/if}
			{#await savesPromise then saves}
				{#each saves as saveGroup}
					<option value={saveGroup}>{saveGroup[0]?.name}</option>
				{/each}
			{/await}
		</select>
		<select class="select mb-1" bind:value={selectedSave} disabled={selectedSaveGroup == null}>
			{#if selectedSave == null}
				<option value={null} disabled hidden></option>
			{/if}
			{#await savesPromise then _saves}
				{#if selectedSaveGroup}
					{#each selectedSaveGroup as save}
						<option value={save}>
							{save.path.split(/[/\\]/).reverse()[0]?.split('.sav')[0]}
						</option>
					{/each}
				{/if}
			{/await}
		</select>
		<button
			type="submit"
			class="preset-filled-primary-500 btn w-full"
			disabled={selectedSave == null}
			class:preset-filled-primary-500={selectedSave != null && selectedSave !== loadedSave}
			class:preset-filled-surface-500={selectedSave == null || selectedSave === loadedSave}
		>
			{t('side_bar.load_save_button')}
		</button>
	</form>

	<form
		class="flex grow flex-col overflow-y-auto"
		onsubmit={(e) => {
			e.preventDefault();
			applyMapSettings();
		}}
		novalidate
	>
		<div class="flex-column my-3 flex-col space-y-2 px-4">
			{#each mapSettingsConfig[0]?.settings ?? [] as config (config.id)}
				<SettingControl
					config={asUnknownSettingConfig(config)}
					settings={editedMapSettings}
					writeToSettings={[mapSettings, lastProcessedMapSettings]}
				/>
			{/each}
		</div>

		<div class="flex items-baseline p-4 pb-1" style="transition-duration: 50ms;">
			<h2 class="h3 flex-1">{t('side_bar.map_settings')}</h2>
			<button type="button" class="text-primary-500 mx-2" onclick={saveSettings}>
				{t('side_bar.save_settings_button')}
			</button>
			<Menu
				onSelect={(details) => {
					const [type, name] = details.value.split('|');
					const settings =
						type === 'CUSTOM'
							? customSavedSettings.current.find((s) => s.name === name)
							: presetMapSettings.find((s) => s.name === name);
					if ((type === 'CUSTOM' || type === 'PRESET') && settings) {
						loadSettings(type, settings);
					} else {
						console.error('invalid settings option', details.value);
					}
				}}
				triggerBase="text-primary-500 flex"
				itemClasses="w-full flex justify-between"
			>
				{#snippet trigger()}{t('side_bar.load_settings_button')}{/snippet}
				{#snippet indicator()}{/snippet}
				{#if customSavedSettings.current.length > 0}
					<div class="text-secondary-300 px-2 pt-2" style="font-variant-caps: small-caps;">
						{t('side_bar.custom_setting_profiles')}
					</div>
					{#each customSavedSettings.current as saved}
						<Menu.Item value="CUSTOM|{saved.name}">
							{saved.name}
							<button
								type="button"
								class="text-error-400 hover:text-error-300 focus:text-error-300"
								onclick={() => {
									dialog
										.confirm(
											t('confirmation.delete_setting_profile', { name: saved.name }),
											t('generic.confirmation'),
										)
										.then((response) => {
											if (response) {
												customSavedSettings.current = customSavedSettings.current.filter(
													(other) => !(other.name === saved.name),
												);
											}
										});
								}}
							>
								<HeroiconTrashMini class="h-4 w-4" />
							</button>
						</Menu.Item>
					{/each}
				{/if}
				<div class="text-secondary-300 px-2 pt-2" style="font-variant-caps: small-caps;">
					{t('side_bar.preset_setting_profiles')}
				</div>
				{#each presetMapSettings as preset}
					<Menu.Item value="PRESET|{preset.name}">
						{preset.name}
					</Menu.Item>
				{/each}
			</Menu>
		</div>

		<Accordion collapsible classes="grow h-0 overflow-y-auto">
			{#each mapSettingsConfig.slice(1) as settingGroup (settingGroup.id)}
				<Accordion.Item
					value={settingGroup.id}
					panelClasses="flex flex-col gap-4"
					controlClasses="h5"
				>
					{#snippet control()}
						{t(settingGroup.name)}
					{/snippet}
					{#snippet panel()}
						{#each settingGroup.settings as config (config.id)}
							<SettingControl
								config={asUnknownSettingConfig(config)}
								settings={editedMapSettings}
							/>
						{/each}
					{/snippet}
				</Accordion.Item>
			{/each}
		</Accordion>
		<ApplyChangesButton />
	</form>
</div>
