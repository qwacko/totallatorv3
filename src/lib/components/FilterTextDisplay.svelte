<script lang="ts">
	import { P } from 'flowbite-svelte';
	import FilterIcon from './icons/FilterIcon.svelte';

	const { text }: { text: string[] } = $props();

	const textJoined = $derived(text.join(' and '));
</script>

<div class="flex flex-row gap-4 text-gray-200">
	<FilterIcon />
	<P size="sm" color="text-gray-300 hover:text-gray-800">
		{textJoined}
	</P>
</div>
