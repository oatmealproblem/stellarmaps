<script lang="ts">
	import { AppBar, Modal } from '@skeletonlabs/skeleton-svelte';

	import AppSettingsModal from '$lib/AppSettingsModal.svelte';
	import Discord from '$lib/icons/Discord.svelte';
	import GitHub from '$lib/icons/GitHub.svelte';
	import HeroiconCog6ToothSolid from '$lib/icons/HeroiconCog6ToothSolid.svelte';
	import MapContainer from '$lib/map/MapContainer.svelte';
	import Sidebar from '$lib/Sidebar.svelte';
	import Toaster from '$lib/Toaster.svelte';
	import VersionInfo from '$lib/VersionInfo.svelte';

	import { t } from '../intl';

	let settingsOpen = $state(false);
	function closeSettings() {
		settingsOpen = false;
	}
</script>

<div class="flex h-full flex-col">
	<AppBar>
		{#snippet lead()}
			{t('top_bar.stellar_maps')}
			<VersionInfo />
		{/snippet}
		{#snippet trail()}
			<a
				class="anchor"
				href="https://github.com/oatmealproblem/stellarmaps"
				target="_blank"
				rel="noopener"
			>
				<GitHub />
			</a>
			<a class="anchor" href="https://discord.gg/72kaXW782b" target="_blank" rel="noopener">
				<Discord />
			</a>
			<div class="border-r-surface-500 mx-2 h-6 border-r"></div>
			<Modal
				open={settingsOpen}
				onOpenChange={(details) => {
					settingsOpen = details.open;
				}}
			>
				{#snippet trigger()}
					<HeroiconCog6ToothSolid />
				{/snippet}
				{#snippet content()}
					<AppSettingsModal close={closeSettings} />
				{/snippet}
			</Modal>
		{/snippet}
	</AppBar>
	<div class="flex h-full flex-auto">
		<Sidebar />
		<MapContainer />
	</div>
</div>

<Toaster />
