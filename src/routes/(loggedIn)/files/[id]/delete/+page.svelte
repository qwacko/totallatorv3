<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { Button, Spinner } from 'flowbite-svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import FileThumbnail from '$lib/components/FileThumbnail.svelte';
	import { enhance } from '$app/forms';
	import { customEnhance } from '$lib/helpers/customEnhance';

	export let data;
	let deleting = false;
</script>

<CustomHeader pageTitle="Edit File" filterText={data.file.title || data.file.originalFilename} />

<PageLayout title={data.file.title || data.file.originalFilename} size="sm">
	<div class="self-center">
		<FileThumbnail item={data.file} size="lg" />
	</div>
	Are you sure you want to delete this file?
	<form
		method="post"
		action="?/deleteFile"
		use:enhance={customEnhance({
			updateLoading: (loading) => (deleting = loading)
		})}
		class="flex w-full flex-col items-stretch gap-2"
	>
		<input type="hidden" name="fileId" value={data.file.id} />
		<Button outline color="red" type="submit" disabled={deleting}>
			{#if deleting}<Spinner size="4" />{/if}<DeleteIcon />
		</Button>
	</form>
</PageLayout>
