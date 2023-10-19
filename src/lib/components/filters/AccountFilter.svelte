<script lang="ts">
	import type { AccountFilterSchemaType } from '$lib/schema/accountSchema';
	import { Button } from 'flowbite-svelte';

	export let filter: AccountFilterSchemaType | undefined;
</script>

{#if filter === undefined}
	<Button on:click={() => (filter = {})}>Add Filter</Button>
{:else}
	<Button on:click={() => (filter = undefined)}>Clear Filter</Button>
{/if}
