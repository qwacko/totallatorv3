<script lang="ts">
	import { Button, Spinner } from 'flowbite-svelte';

	import type { FileTypeType } from '@totallator/shared';

	import { enhance } from '$app/forms';

	import { customEnhance } from '$lib/helpers/customEnhance';

	import FileThumbnail from './FileThumbnail.svelte';
	import LinkIcon from './icons/LinkIcon.svelte';

	const {
		item,
		keys
	}: {
		item: {
			title: string | null;
			originalFilename: string;
			thumbnailFilename?: string | null;
			filename: string;
			id: string;
			type: FileTypeType;
		};
		keys: { key: string; value: string | null | undefined }[];
	} = $props();

	let linking = $state(false);

	const keyLength = $derived(keys.length);
</script>

<div class="flex flex-col gap-2 rounded-lg border border-gray-500 p-4 shadow-lg">
	<div class="flex flex-row items-center justify-between">
		{item.title ? item.title : item.originalFilename}
	</div>
	<FileThumbnail {item} />
	<div class="flex grow"></div>
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
			class="flex grow flex-row gap-2 self-stretch rounded-lg border"
			disabled={linking || keyLength === 0}
		>
			{#if linking}<Spinner class="h-3 w-3" />{/if}<LinkIcon />
		</Button>
	</form>
</div>
