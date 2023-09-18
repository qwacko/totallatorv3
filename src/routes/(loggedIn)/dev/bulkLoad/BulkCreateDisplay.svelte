<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Heading } from 'flowbite-svelte';

	export let title: string;
	export let currentCount: number;
	export let deletableCount: number;
	export let createAction: string;
	export let deleteAction: string;

	const creationOptions = [
		{ title: '+ 10', count: 10 },
		{ title: '+ 40', count: 40 },
		{ title: '+ 100', count: 100 }
	];
</script>

<div class="flex flex-col gap-2">
	<Heading tag="h3">{title}</Heading>
	<div class="flex">
		Currently : {currentCount}
		{title} Exist - {deletableCount} can be deleted
	</div>
	<div class="flex flex-row gap-2">
		{#each creationOptions as currentOption}
			<form class="flex" method="POST" action={createAction} use:enhance>
				<input type="hidden" name="count" value={currentOption.count} />
				<Button type="submit" outline>{currentOption.title}</Button>
			</form>
		{/each}
		<form class="flex" method="POST" action={deleteAction} use:enhance>
			<Button type="submit" outline color="red">
				Delete {deletableCount} Unused {title}
			</Button>
		</form>
	</div>
</div>
