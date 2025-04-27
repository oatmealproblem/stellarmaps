<script lang="ts">
	interface Props {
		enabled: boolean;
		filterId?: string;
		children?: import('svelte').Snippet<[any]>;
	}

	let { enabled, filterId = 'glow', children }: Props = $props();
</script>

{#if enabled}
	{@render children?.({ filter: `url(#${filterId})` })}
{/if}
{@render children?.({ filter: '' })}
