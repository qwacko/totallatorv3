<script lang="ts">
	import { Alert } from 'flowbite-svelte';

	const {
		message = null,
		title = null
	}: { message?: string | string[] | null; title?: string | null } = $props();
</script>

{#if message && message.length > 0}
	<Alert>
		{#if title}
			<span class="font-medium">{title}</span>{/if}
		{message}
	</Alert>
{/if}
