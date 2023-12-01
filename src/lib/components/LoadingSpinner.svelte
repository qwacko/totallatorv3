<script>
	import { Badge, Spinner } from 'flowbite-svelte';

	export let loadingText = 'Loading...';
</script>

<Badge class="flex flex-row gap-2" color="blue">
	<Spinner size="8" class="p-1" />{loadingText}
</Badge>
