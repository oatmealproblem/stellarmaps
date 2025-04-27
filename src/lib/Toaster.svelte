<script lang="ts" module>
	export type ToastData = {
		kind: 'error' | 'warning' | 'success' | 'info';
		title: string;
		description?: string;
		action?: {
			label: string;
			onClick: () => void;
		};
	};

	export const toaster = new Toaster<ToastData>();
</script>

<script lang="ts">
	import { Toaster } from 'melt/builders';
	import { fade, fly } from 'svelte/transition';
	import { match } from 'ts-pattern';

	function getKindClass(data: ToastData) {
		return match(data.kind)
			.with('error', () => 'preset-filled-error-500')
			.with('warning', () => 'preset-filled-warning-500')
			.with('success', () => 'preset-filled-success-500')
			.with('info', () => 'preset-filled-secondary-500')
			.exhaustive();
	}

	function getKindActionClass(data: ToastData) {
		return match(data.kind)
			.with('error', () => 'preset-filled-error-950-50')
			.with('warning', () => 'preset-filled-warning-950-50')
			.with('success', () => 'preset-filled-success-950-50')
			.with('info', () => 'preset-filled-secondary-950-50')
			.exhaustive();
	}
</script>

<div
	{...toaster.root}
	class="absolute z-100 mx-auto flex w-96 flex-col-reverse overflow-visible bg-transparent"
	out:fade={{ delay: 1000, duration: 1 }}
>
	{#each toaster.toasts as toast (toast.id)}
		<div
			{...toast.content}
			class="rounded-container mt-4 flex w-full items-start gap-2 p-4 {getKindClass(toast.data)}"
			in:fly={{ y: -100 }}
			out:fly|global={{ x: 100 }}
		>
			<div class="grow">
				<h3 {...toast.title} class="h6">{toast.data.title}</h3>
				{#if toast.data.description}<div {...toast.description}>{toast.data.description}</div>{/if}
			</div>
			{#if toast.data.action != null}
				<button
					class="btn preset-filled {getKindActionClass(toast.data)}"
					type="button"
					onclick={toast.data.action.onClick}
				>
					{toast.data.action.label}
				</button>
			{/if}
			<button {...toast.close} class="btn-icon" aria-label="dismiss alert">✖</button>
		</div>
	{/each}
</div>
