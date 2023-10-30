<script lang="ts">
	import { Checkbox } from 'flowbite-svelte';

	export let id: string | undefined;
	export let selectedIds: string[];

	const toggle = () => {
		if (!id) return;
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((i) => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	};
</script>

{#if id}
	<Checkbox checked={selectedIds.includes(id)} on:click={toggle} />
{/if}
