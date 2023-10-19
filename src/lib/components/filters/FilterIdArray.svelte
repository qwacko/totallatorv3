<script lang="ts">
	import { Button } from 'flowbite-svelte';

	export let idArray: string[] | undefined;
	export let title: string;
</script>

{#if idArray && idArray.length > 0}
	<div class="flex font-semibold text-black text-sm">{title}</div>
	<div class="flex flex-row gap-2 flex-wrap">
		{#each idArray as currentId}
			<Button
				class="whitespace-nowrap"
				size="xs"
				color="light"
				on:click={() => idArray && (idArray = idArray.filter((item) => item !== currentId))}
			>
				{currentId}
			</Button>
		{/each}
	</div>
{/if}
