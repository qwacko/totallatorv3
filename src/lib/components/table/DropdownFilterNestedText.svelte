<script lang="ts" generics="Keys extends string">
	import { DropdownItem, Input, Button } from 'flowbite-svelte';

	export let params: Partial<Record<Keys, string>> | undefined;
	export let key: Keys;

	const enableParams = () => {
		if (!params) {
			params = {} as Record<Keys, string>;
		}
	};
</script>

<DropdownItem>
	{#if params}
		<Input type="text" bind:value={params[key]} placeholder="Filter By Title" />
	{:else}
		<Button outline on:click={enableParams}>Filter</Button>
	{/if}
</DropdownItem>
