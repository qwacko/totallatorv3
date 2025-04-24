<script lang="ts">
	import type { CreateFileNoteRelationshipSchemaType } from '$lib/schema/helpers/fileNoteRelationship';
	import type { GroupedNotesType } from '$lib/server/db/actions/noteActions';
	import {
		Button,
		Modal,
		Textarea,
		Timeline,
		TimelineItem,
		Toolbar,
		Badge,
		P
	} from 'flowbite-svelte';
	import NotesIcon from '$lib/components/icons/NotesIcon.svelte';
	import { enhance } from '$app/forms';
	import type { NoteTypeType } from '$lib/schema/enum/noteTypeEnum';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import ActionButton from './ActionButton.svelte';

	const {
		notes,
		target
	}: { notes: GroupedNotesType; target: CreateFileNoteRelationshipSchemaType } = $props();

	let creating = $state(false);

	let modal = $state(false);

	const targetItems = $derived(
		Object.keys(target).map((key) => ({
			key,
			value: target[key as keyof typeof target]
		}))
	);

	const hasReminder = $derived(notes.some((note) => note.type === 'reminder'));

	let currentType = $state<NoteTypeType>('info');
</script>

<Button
	on:click={() => (modal = true)}
	color={hasReminder ? 'red' : 'primary'}
	outline={notes.length === 0}
	class="p-2"
>
	<NotesIcon />
</Button>
<Modal title="Notes" bind:open={modal} outsideclose>
	{#each notes as note}
		<Timeline order="activity">
			<TimelineItem classLi="mb-0">
				<svelte:fragment slot="icon">
					<span
						class="bg-primary-200 dark:bg-primary-900 absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-900"
					>
						<NotesIcon />
					</span>
				</svelte:fragment>
				<div class="flex flex-col gap-2">
					<div class="flex flex-row items-center gap-2">
						<Badge color={note.type === 'info' ? 'green' : 'red'}>
							{note.type === 'info' ? 'Info' : 'Reminder'}
						</Badge>
						<P weight="light" size="sm">{note.createdBy || ''}</P>
						<P weight="light" size="sm">{new Date(note.createdAt).toISOString().slice(0, 10)}</P>
						<form method="post" action="?/deleteNote" use:enhance>
							<input type="hidden" name="noteId" value={note.id} />
							<Button type="submit" outline color="red" class="rounded-lg border-0 p-1">
								<DeleteIcon />
							</Button>
						</form>
					</div>
					<div class="whitespace-pre">{note.note}</div>
				</div>
			</TimelineItem>
		</Timeline>
	{/each}
	<svelte:fragment slot="footer">
		<form
			method="post"
			action="?/addNote"
			use:enhance={customEnhance({
				updateLoading: (newLoading) => (creating = newLoading)
			})}
			class="flex w-full"
		>
			{#each targetItems as currentItem}
				<input type="hidden" name={currentItem.key} value={currentItem.value} />
			{/each}
			<input type="hidden" name="type" value={currentType} />
			<Textarea name="note" placeholder="Add a note">
				<div slot="footer" class="flex items-center justify-between">
					<ActionButton
						class="rounded-lg"
						type="submit"
						message="Create Note"
						loadingMessage="Creating..."
						loading={creating}
					/>
					<Toolbar embedded>
						<Button
							on:click={() => (currentType = 'info')}
							outline={currentType !== 'info'}
							color="green"
						>
							Info
						</Button>
						<Button
							on:click={() => (currentType = 'reminder')}
							outline={currentType !== 'reminder'}
							color="red"
						>
							Reminder
						</Button>
					</Toolbar>
				</div>
			</Textarea>
		</form>
	</svelte:fragment>
</Modal>
