<script lang="ts">
	import type { CreateFileNoteRelationshipSchemaType } from '$lib/schema/helpers/fileNoteRelationship';
	import { Button, Modal, Fileupload } from 'flowbite-svelte';
	import { enhance } from '$app/forms';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import FileIcon from './icons/FileIcon.svelte';
	import ActionButton from './ActionButton.svelte';
	import type { GroupedFilesType } from '$lib/server/db/actions/fileActions';
	import FilesItem from './FilesItem.svelte';
	import { urlGenerator } from '$lib/routes';
	import LinkIcon from './icons/LinkIcon.svelte';

	const {
		files,
		target,
		transactionId
	}: {
		files: GroupedFilesType;
		target: CreateFileNoteRelationshipSchemaType;
		transactionId?: string;
	} = $props();

	let creating = $state(false);

	let modal = $state(false);

	const targetItems = $derived(
		Object.keys(target).map((key) => ({
			key,
			value: target[key as keyof typeof target]
		}))
	);

	const linkURL = $derived(
		transactionId
			? urlGenerator({
					address: '/(loggedIn)/files/linkToTransaction/[id]',
					paramsValue: { id: transactionId }
				}).url
			: urlGenerator({ address: '/(loggedIn)/files/linkUnlinked', searchParamsValue: target }).url
	);
</script>

<Button on:click={() => (modal = true)} color="primary" outline={files.length === 0} class="p-2">
	<FileIcon />
</Button>
<Modal title="Files" bind:open={modal} outsideclose>
	{#each files as currentFile}
		<FilesItem {currentFile} />
	{/each}
	<svelte:fragment slot="footer">
		<Button href={linkURL} color="primary" outline class="rounded-lg border">
			<LinkIcon />
		</Button>
		<form
			method="post"
			action="?/addFile"
			use:enhance={customEnhance({
				updateLoading: (newLoading) => (creating = newLoading)
			})}
			class="flex w-full flex-row gap-2"
			enctype="multipart/form-data"
		>
			{#each targetItems as currentItem}
				<input type="hidden" name={currentItem.key} value={currentItem.value} />
			{/each}
			<input type="hidden" name="reason" value="info" />
			<Fileupload name="file" class="flex grow rounded-lg" disabled={creating} />

			<ActionButton
				class="rounded-lg"
				type="submit"
				message="Upload File"
				loadingMessage="Creating..."
				loading={creating}
			/>
		</form>
	</svelte:fragment>
</Modal>
