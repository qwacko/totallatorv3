<script lang="ts">
	import { Button, Fileupload, Textarea } from 'flowbite-svelte';

	import {
		type CreateFileNoteRelationshipSchemaType,
		linksCanAddSummary
	} from '@totallator/shared';
	import type { NoteTypeType } from '@totallator/shared';
	import type { FileReasonType } from '@totallator/shared';

	import { enhance } from '$app/forms';

	import { customEnhance } from '$lib/helpers/customEnhance';

	import ActionButton from '../ActionButton.svelte';

	let {
		target,
		onSuccess
	}: {
		target: CreateFileNoteRelationshipSchemaType;
		onSuccess?: () => void;
	} = $props();

	const targetItems = $derived(
		Object.keys(target).map((key) => ({
			key,
			value: target[key as keyof typeof target]
		}))
	);

	let creating = $state(false);
	let noteType = $state<NoteTypeType>('info');
	let noteText = $state<string>('');
	let noteTextLength = $derived(noteText.length);
	let noteTextActive = $derived(noteTextLength > 0);
	let file = $state<FileList | undefined>(undefined);
	let fileReason = $state<FileReasonType>('info');
	let createSummary = $state<boolean>(false);
	let journalSummaryFile = $state<boolean>(false);

	let hasCorrectNote = $derived(!noteTextActive || noteType.length > 0);
	let canHaveSummary = $derived(linksCanAddSummary(target));
	let canSubmit = $derived(hasCorrectNote);
</script>

<form
	method="post"
	action="?/createAssociatedInfo"
	enctype="multipart/form-data"
	use:enhance={customEnhance({
		updateLoading: (newLoading) => (creating = newLoading),
		onSuccess: () => {
			onSuccess && onSuccess();
		}
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
	<Textarea name="note" placeholder="Add a note" bind:value={noteText} />
	{#if noteTextActive}
		<div class="flex flex-row">
			<Button
				onclick={() => (noteType = 'info')}
				outline={noteType !== 'info'}
				color="green"
				class="grow basis-0"
			>
				Info
			</Button>
			<Button
				onclick={() => (noteType = 'reminder')}
				outline={noteType !== 'reminder'}
				color="red"
				class="grow basis-0"
			>
				Reminder
			</Button>
		</div>
	{/if}
	<Fileupload bind:files={file} name="file" class="flex grow rounded-lg" disabled={creating} />
	{#if canHaveSummary}
		<div class="flex flex-row gap-0">
			<Button
				onclick={() => {
					createSummary = false;
					journalSummaryFile = false;
				}}
				class="flex grow basis-0 flex-row items-center gap-2 rounded-l-md"
				color={!createSummary ? 'green' : 'alternative'}
			>
				No Summary
			</Button>
			<Button
				onclick={() => {
					createSummary = true;
					journalSummaryFile = false;
				}}
				class="flex grow basis-0 flex-row items-center gap-2"
				color={createSummary && !journalSummaryFile ? 'green' : 'alternative'}
			>
				Journal Summary
			</Button>
			<Button
				onclick={() => {
					createSummary = true;
					journalSummaryFile = true;
				}}
				class="flex grow basis-0 flex-row items-center gap-2 rounded-r-md"
				color={createSummary && journalSummaryFile ? 'green' : 'alternative'}
			>
				Journal Summary With CSV
			</Button>
		</div>
		<input type="hidden" name="createSummary" value={createSummary} />
		{#if createSummary}
			<input type="hidden" name="journalSummaryFile" value={journalSummaryFile} />
		{/if}
	{/if}
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
