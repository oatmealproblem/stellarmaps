<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';

	import { t, translatorModeExtraMessageIDs, translatorModeUntranslatedMessageIDs } from '../intl';
	import SettingControl from './SettingControl/index.svelte';
	import { appSettings, appSettingsConfig, asUnknownSettingConfig } from './settings';
	import { selectTranslatorModeFile, translatorModeFilePath } from './translatorMode';

	interface Props {
		[key: string]: any;
	}

	let { ...props }: Props = $props();

	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- this suppresses warning about unknown prop 'parent'
	const _props = props;

	const modalStore = getModalStore();
	const toastStore = getToastStore();
</script>

<div
	class="bg-surface-100-800-token modal block h-auto max-h-[90vh] w-[32rem] space-y-4 overflow-y-auto p-4 shadow-xl rounded-container-token"
	role="dialog"
	aria-modal="true"
>
	<form novalidate>
		<header class="modal-header text-2xl font-bold">{$t('app_settings.title')}</header>
		<p>{$t('app_settings.description')}</p>
		<div class="flex flex-col gap-4">
			{#each appSettingsConfig as config}
				<SettingControl config={asUnknownSettingConfig(config)} settings={appSettings} />
			{/each}
			{#if appSettings.current.appTranslatorMode}
				<button
					class="variant-ghost-primary btn -my-3"
					type="button"
					onclick={() => selectTranslatorModeFile(toastStore)}
				>
					{$t('app_settings.select_translator_mode_file')}
				</button>
				{#if $translatorModeFilePath}
					<small>
						{$t('app_settings.translator_mode_file', { filePath: $translatorModeFilePath })}
					</small>
				{:else}
					<small>{$t('app_settings.translator_mode_no_file')}</small>
				{/if}
				{#if $translatorModeFilePath != null && $translatorModeUntranslatedMessageIDs.length > 0}
					<strong class="block text-warning-400">
						{$t('app_settings.translator_mode_untranslated_messages', {
							number: $translatorModeUntranslatedMessageIDs.length,
						})}
					</strong>
					<ul class="list-disc ps-4">
						{#each $translatorModeUntranslatedMessageIDs.slice(0, 10) as messageId}
							<li>
								{messageId}
							</li>
						{/each}
						{#if $translatorModeUntranslatedMessageIDs.length > 10}<li>...</li>{/if}
					</ul>
				{/if}
				{#if $translatorModeExtraMessageIDs.length > 0}
					<strong class="block text-warning-400">
						{$t('app_settings.translator_mode_extra_messages', {
							number: $translatorModeExtraMessageIDs.length,
						})}
					</strong>
					<ul class="list-disc ps-4">
						{#each $translatorModeExtraMessageIDs.slice(0, 5) as messageId}
							<li>
								{messageId}
							</li>
						{/each}
						{#if $translatorModeExtraMessageIDs.length > 5}<li>...</li>{/if}
					</ul>
				{/if}
			{/if}
		</div>
		<footer class="modal-footer flex justify-end space-x-2">
			<button class="variant-ghost-surface btn" type="button" onclick={() => modalStore.close()}>
				{$t('generic.close_button')}
			</button>
		</footer>
	</form>
</div>
