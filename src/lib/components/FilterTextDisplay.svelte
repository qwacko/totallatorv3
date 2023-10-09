<script lang="ts">
	import { P } from 'flowbite-svelte';
	import FilterIcon from './icons/FilterIcon.svelte';

	export let text: string[];

	$: textJoined = text.join(' and ');
</script>

<div class="flex flex-row text-gray-200 gap-4">
	<FilterIcon />
	<P size="sm" color="text-gray-300 hover:text-gray-800">
		{textJoined}
	</P>
</div>
