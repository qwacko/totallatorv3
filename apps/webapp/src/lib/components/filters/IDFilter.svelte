<script lang="ts">
	import { Button } from 'flowbite-svelte';

	import CancelIcon from '../icons/CancelIcon.svelte';

	let {
		id = $bindable(),
		idToString = undefined
	}: {
		id: string | undefined;
		idToString?: ((id: string) => string) | undefined;
	} = $props();
</script>

{#if id}
	<div class="flex flex-row gap-2">
		<div class="flex">
			{#if idToString}
				{idToString(id)}
			{:else}
				ID is {id}{/if}
		</div>
		<Button onclick={() => (id = undefined)}>
			<CancelIcon />
		</Button>
	</div>
{/if}
