<script lang="ts">
	import './app.postcss';

	import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
	import {
		AppBar,
		AppShell,
		getModalStore,
		initializeStores,
		Modal,
		storePopup,
		Toast,
	} from '@skeletonlabs/skeleton';

	import { t } from './intl';
	import AppSettingsModal from './lib/AppSettingsModal.svelte';
	import ExportModal from './lib/ExportModal.svelte';
	import Discord from './lib/icons/Discord.svelte';
	import GitHub from './lib/icons/GitHub.svelte';
	import HeroiconCog6ToothSolid from './lib/icons/HeroiconCog6ToothSolid.svelte';
	import MapContainer from './lib/map/MapContainer.svelte';
	import Sidebar from './lib/Sidebar.svelte';
	import VersionInfo from './lib/VersionInfo.svelte';

	initializeStores();
	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

	const modalStore = getModalStore();
</script>

<Toast position="t" background="variant-filled-error" class="!z-[1000]" />
<Modal components={{ export: { ref: ExportModal }, settings: { ref: AppSettingsModal } }} />
<AppShell slotPageContent="h-full" regionPage="h-full">
	{#snippet header()}
		<AppBar>
			{#snippet lead()}
				{$t('top_bar.stellar_maps')}
				<VersionInfo />
			{/snippet}
			{#snippet trail()}
				<a
					class="anchor"
					href="https://github.com/MichaelMakesGames/stellarmaps"
					target="_blank"
					rel="noopener"
				>
					<GitHub />
				</a>
				<a class="anchor" href="https://discord.gg/72kaXW782b" target="_blank" rel="noopener">
					<Discord />
				</a>
				<div class="mx-2 h-6 border-r border-r-surface-500"></div>
				<button
					type="button"
					onclick={() => modalStore.trigger({ type: 'component', component: 'settings' })}
				>
					<HeroiconCog6ToothSolid />
				</button>
			{/snippet}
		</AppBar>
	{/snippet}
	{#snippet sidebarLeft()}
		<Sidebar />
	{/snippet}
	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"></div>
	<MapContainer />
</AppShell>
