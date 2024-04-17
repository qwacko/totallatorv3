<script lang="ts">
	import { customEnhance } from '$lib/helpers/customEnhance';
	import { urlGenerator } from '$lib/routes';
	import { Button, Spinner } from 'flowbite-svelte';
	import { enhance } from '$app/forms';
	import LinkIcon from './icons/LinkIcon.svelte';

	export let item: {
		title: string | null;
		originalFilename: string;
		thumbnailFilename?: string | null;
		id: string;
	};
	export let keys: { key: string; value: string | null | undefined }[];

	let linking = false;

	$: keyLength = keys.length;
</script>

<div class="flex flex-col gap-2 rounded-lg border border-gray-500 p-4 shadow-lg">
	<div class="flex flex-row items-center justify-between">
		{item.title ? item.title : item.originalFilename}
	</div>
	{#if item.thumbnailFilename}
		<img
			src={urlGenerator({
				address: '/(loggedIn)/files/[id]/image/[filename]',
				paramsValue: { id: item.id, filename: item.thumbnailFilename }
			}).url}
			alt={item.title ? item.title : item.originalFilename}
			class="max-h-48 max-w-48 object-contain"
		/>
	{/if}
	<div class="flex flex-grow"></div>
	<form
		method="post"
		action="?/updateFile"
		use:enhance={customEnhance({
			updateLoading: (newLoading) => (linking = newLoading)
		})}
		class="flex flex-row gap-2 self-stretch"
	>
		<input type="hidden" name="id" value={item.id} />
		{#each keys as currentKey}
			<input type="hidden" name={currentKey.key} value={currentKey.value} />
		{/each}
		<Button
			type="submit"
			color="blue"
			outline
			class="flex flex-grow flex-row gap-2 self-stretch rounded-lg border"
			disabled={linking || keyLength === 0}
		>
			{#if linking}<Spinner class="h-3 w-3" />{/if}<LinkIcon />
		</Button>
	</form>
</div>
