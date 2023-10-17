<script lang="ts">
	import { Checkbox } from 'flowbite-svelte';

	export let id: string;
	export let selectedIds: string[];

	const toggle = () => {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((i) => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	};
</script>

<Checkbox checked={selectedIds.includes(id)} on:click={toggle} />
