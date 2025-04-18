<script lang="ts">
	import { t } from '../intl';
	import HeroiconPaintBrushMini from './icons/HeroiconPaintBrushMini.svelte';
	import {
		asUnknownSettingConfig,
		editedMapSettings,
		mapSettings,
		mapSettingsConfig,
		settingsAreDifferent,
		validateSetting,
	} from './settings';

	let shouldShow = $derived(settingsAreDifferent(editedMapSettings.current, mapSettings.current));
	let valid = $derived(
		mapSettingsConfig
			.flatMap((category) => category.settings)
			.every((config) => {
				const [valid] = validateSetting(
					editedMapSettings.current[config.id],
					asUnknownSettingConfig(config),
				);
				return valid;
			}),
	);
</script>

{#if shouldShow}
	<button
		type="submit"
		class="btn btn-lg w-full rounded-none"
		class:variant-filled-primary={valid}
		class:variant-filled-error={!valid}
		disabled={!valid}
	>
		<span><HeroiconPaintBrushMini /></span>
		<span>{t('side_bar.apply_changes_button')}</span>
		<span class="invisible"><HeroiconPaintBrushMini /></span>
	</button>
{/if}
