<script lang="ts">
	import { Button, Spinner } from 'flowbite-svelte';
	import type { ComponentProps } from 'svelte';

	type ButtonProps = ComponentProps<Button>;

	const {
		loading = false,
		message,
		loadingMessage = undefined,
		...restProps
	}: {
		loading?: boolean;
		message: string;
		loadingMessage?: string | undefined;
	} & ButtonProps = $props();

	let useLoadingMessage = $derived(loadingMessage || message || 'Loading...');
</script>

<Button disabled={loading} {...restProps}>
	{#if loading}
		<div class="flex flex-row items-center gap-2">
			<Spinner size="6" class="p-1" />{useLoadingMessage}
		</div>
	{:else}
		{message}
	{/if}
</Button>
