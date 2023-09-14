<script lang="ts">
	import { Alert } from 'flowbite-svelte';

	export let message: string | string[] | null = null;
	export let title: string | null = null;
</script>

{#if message && message.length > 0}
	<Alert>
		{#if title}
			<span class="font-medium">{title}</span>{/if}
		{message}
	</Alert>
{/if}
