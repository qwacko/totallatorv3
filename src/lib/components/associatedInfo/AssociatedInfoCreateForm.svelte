<script lang="ts">
	import { customEnhance } from '$lib/helpers/customEnhance';
	import { enhance } from '$app/forms';
	import { Button, Fileupload, Textarea, Toolbar } from 'flowbite-svelte';
	import ActionButton from '../ActionButton.svelte';
	import type { CreateFileNoteRelationshipSchemaType } from '$lib/schema/helpers/fileNoteRelationship';
	import type { NoteTypeType } from '$lib/schema/enum/noteTypeEnum';
	import type { FileReasonType } from '$lib/schema/enum/fileReasonEnum';

	let creating = $state(false);

	let {
		modal = $bindable(),
		target
	}: { modal: boolean; target: CreateFileNoteRelationshipSchemaType } = $props();

	const targetItems = $derived(
		Object.keys(target).map((key) => ({
			key,
			value: target[key as keyof typeof target]
		}))
	);

	let noteType = $state<NoteTypeType>('info');
	let noteText = $state<string>('');
	let noteTextLength = $derived(noteText.length);
	let noteTextActive = $derived(noteTextLength > 0);
	let file = $state<FileList | undefined>(undefined);
	let fileReason = $state<FileReasonType>('info');

	let hasCorrectNote = $derived(!noteTextActive || noteType.length > 0);
	let canSubmit = $derived(hasCorrectNote);
</script>

<form
	method="post"
	action="?/createAssociatedInfo"
	enctype="multipart/form-data"
	use:enhance={customEnhance({
		updateLoading: (newLoading) => (creating = newLoading)
	})}
	class="flex w-full flex-col gap-2"
>
	{#each targetItems as currentItem}
		<input type="hidden" name={currentItem.key} value={currentItem.value} />
	{/each}
	{#if noteTextActive}
		<input type="hidden" name="noteType" value={noteType} />
	{/if}
	{#if file}
		<input type="hidden" name="fileReason" value={fileReason} />
	{/if}
	<Textarea name="note" placeholder="Add a note" bind:value={noteText}>
		<div slot="footer" class="flex items-center justify-between" class:hidden={!noteTextActive}>
			{#if noteTextActive}
				<Toolbar embedded>
					<Button on:click={() => (noteType = 'info')} outline={noteType !== 'info'} color="green">
						Info
					</Button>
					<Button
						on:click={() => (noteType = 'reminder')}
						outline={noteType !== 'reminder'}
						color="red"
					>
						Reminder
					</Button>
				</Toolbar>
			{/if}
		</div>
	</Textarea>
	<Fileupload bind:files={file} name="file" class="flex grow rounded-lg" disabled={creating} />
	<ActionButton
		class="rounded-lg"
		type="submit"
		message="Create"
		loadingMessage="Creating..."
		loading={creating}
		disabled={!canSubmit}
	/>
	{#if file}
		Has File{:else}No File{/if}
</form>
