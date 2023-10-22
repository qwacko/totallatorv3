<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import CancelIcon from '../icons/CancelIcon.svelte';

	export let id: string | undefined;
	export let idToString: ((id: string) => string) | undefined = undefined;
</script>

{#if id}
	<div class="flex flex-row gap-2">
		<div class="flex">
			{#if idToString}
				{idToString(id)}
			{:else}
				ID is {id}{/if}
		</div>
		<Button color="none" on:click={() => (id = undefined)}>
			<CancelIcon />
		</Button>
	</div>
{/if}
