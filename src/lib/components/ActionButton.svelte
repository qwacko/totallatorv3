<script lang="ts">
	import { Button, Spinner } from 'flowbite-svelte';

	export let loading = false;
	export let message: string;
	export let loadingMessage: string | undefined = undefined;

	$: useLoadingMessage = loadingMessage || message || 'Loading...';
</script>

<Button disabled={loading} {...$$restProps}>
	{#if loading}
		<div class="flex flex-row items-center gap-2">
			<Spinner size="6" class="p-1" />{useLoadingMessage}
		</div>
	{:else}
		{message}
	{/if}
</Button>
