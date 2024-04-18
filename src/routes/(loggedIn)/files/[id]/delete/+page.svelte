<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { Button } from 'flowbite-svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import FileThumbnail from '$lib/components/FileThumbnail.svelte';
	import { enhance } from '$app/forms';

	export let data;
</script>

<CustomHeader pageTitle="Edit File" filterText={data.file.title || data.file.originalFilename} />

<PageLayout title={data.file.title || data.file.originalFilename} size="sm">
	<div class="self-center">
		<FileThumbnail item={data.file} size="lg" />
	</div>
	Are you sure you want to delete this file?
	<form method="post" action="?/deleteFile" use:enhance>
		<input type="hidden" name="fileId" value={data.file.id} />
		<Button outline color="red" type="submit"><DeleteIcon /></Button>
	</form>
</PageLayout>
