<script lang="ts">
	import { t } from '../intl';
	import { VERSION } from './constants';

	const latestReleasePromise: Promise<string> = fetch(
		'https://api.github.com/repos/MichaelMakesGames/stellarmaps/releases?per_page=1',
	)
		.then((response) => response.json())
		.then((data) => data[0].name);
</script>

<span class="text-surface-300 px-1">(v{VERSION})</span>
{#await latestReleasePromise then latestRelease}
	{#if !latestRelease.endsWith(VERSION)}
		<a
			class="anchor ms-3"
			href="https://github.com/MichaelMakesGames/stellarmaps/releases"
			target="_blank"
			rel="noopener"
		>
			{t('top_bar.download_latest_release')}
			{latestRelease.substring(latestRelease.lastIndexOf('v'))}
		</a>
	{/if}
{/await}
