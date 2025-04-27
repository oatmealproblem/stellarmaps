<script lang="ts">
	import {
		getTranslatorModeExtraMessageIDs,
		getTranslatorModeUntranslatedMessageIDs,
		t,
	} from '../intl';
	import SettingControl from './SettingControl/index.svelte';
	import { appSettings, appSettingsConfig, asUnknownSettingConfig } from './settings';
	import { selectTranslatorModeFile, translatorModeFilePath } from './translatorMode';

	interface Props {
		close: () => void;
	}

	let { close }: Props = $props();
</script>

<div
	class="bg-surface-100-900 modal rounded-container block h-auto max-h-[90vh] w-[32rem] space-y-4 overflow-y-auto p-4 shadow-xl"
	role="dialog"
	aria-modal="true"
>
	<form novalidate>
		<header class="modal-header text-2xl font-bold">{t('app_settings.title')}</header>
		<p>{t('app_settings.description')}</p>
		<div class="flex flex-col gap-4">
			{#each appSettingsConfig as config}
				<SettingControl config={asUnknownSettingConfig(config)} settings={appSettings} />
			{/each}
			{#if appSettings.current.appTranslatorMode}
				<button
					class="preset-tonal-primary border-primary-500 btn -my-3 border"
					type="button"
					onclick={() => selectTranslatorModeFile()}
				>
					{t('app_settings.select_translator_mode_file')}
				</button>
				{#if translatorModeFilePath.current}
					<small>
						{t('app_settings.translator_mode_file', { filePath: translatorModeFilePath.current })}
					</small>
				{:else}
					<small>{t('app_settings.translator_mode_no_file')}</small>
				{/if}
				{#if translatorModeFilePath.current != null && getTranslatorModeUntranslatedMessageIDs().length > 0}
					<strong class="text-warning-400 block">
						{t('app_settings.translator_mode_untranslated_messages', {
							number: getTranslatorModeUntranslatedMessageIDs().length,
						})}
					</strong>
					<ul class="list-disc ps-4">
						{#each getTranslatorModeUntranslatedMessageIDs().slice(0, 10) as messageId}
							<li>
								{messageId}
							</li>
						{/each}
						{#if getTranslatorModeUntranslatedMessageIDs().length > 10}<li>...</li>{/if}
					</ul>
				{/if}
				{#if getTranslatorModeExtraMessageIDs().length > 0}
					<strong class="text-warning-400 block">
						{t('app_settings.translator_mode_extra_messages', {
							number: getTranslatorModeExtraMessageIDs().length,
						})}
					</strong>
					<ul class="list-disc ps-4">
						{#each getTranslatorModeExtraMessageIDs().slice(0, 5) as messageId}
							<li>
								{messageId}
							</li>
						{/each}
						{#if getTranslatorModeExtraMessageIDs().length > 5}<li>...</li>{/if}
					</ul>
				{/if}
			{/if}
		</div>
		<footer class="modal-footer flex justify-end space-x-2">
			<button class="preset-tonal-surface btn" type="button" onclick={close}>
				{t('generic.close_button')}
			</button>
		</footer>
	</form>
</div>
