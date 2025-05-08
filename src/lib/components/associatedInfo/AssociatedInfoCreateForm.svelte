<script lang="ts">
	import { customEnhance } from '$lib/helpers/customEnhance';
	import { enhance } from '$app/forms';
	import { Button, Textarea, Toolbar } from 'flowbite-svelte';
	import ActionButton from '../ActionButton.svelte';
	import type { CreateFileNoteRelationshipSchemaType } from '$lib/schema/helpers/fileNoteRelationship';
	import type { NoteTypeType } from '$lib/schema/enum/noteTypeEnum';

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
</script>

<form
	method="post"
	action="?/createAssociatedInfo"
	use:enhance={customEnhance({
		updateLoading: (newLoading) => (creating = newLoading)
	})}
	class="flex w-full"
>
	{#each targetItems as currentItem}
		<input type="hidden" name={currentItem.key} value={currentItem.value} />
	{/each}
	{#if noteTextActive}
		<input type="hidden" name="noteType" value={noteType} />
	{/if}
	<Textarea name="note" placeholder="Add a note" bind:value={noteText}>
		<div slot="footer" class="flex items-center justify-between">
			<ActionButton
				class="rounded-lg"
				type="submit"
				message="Create Note"
				loadingMessage="Creating..."
				loading={creating}
			/>
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
</form>
