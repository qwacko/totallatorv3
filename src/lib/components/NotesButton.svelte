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

	export let notes: GroupedNotesType;
	export let target: CreateFileNoteRelationshipSchemaType;

	let modal = false;

	$: targetItems = Object.keys(target).map((key) => ({
		key,
		value: target[key as keyof typeof target]
	}));

	$: hasReminder = notes.some((note) => note.type === 'reminder');

	let currentType: NoteTypeType = 'info';
</script>

<Button
	on:click={() => (modal = true)}
	color={notes.length > 0 ? (hasReminder ? 'red' : 'primary') : 'light'}
	outline={notes.length === 0}
	class="flex flex-row content-center gap-2 p-2"
>
	<NotesIcon />
</Button>
<Modal title="Notes" bind:open={modal} outsideclose>
	{#each notes as note}
		<Timeline order="activity">
			<TimelineItem classLi="mb-0">
				<svelte:fragment slot="icon">
					<span
						class="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary-200 ring-8 ring-white dark:bg-primary-900 dark:ring-gray-900"
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
		<form method="post" action="?/addNote" use:enhance class="flex w-full">
			{#each targetItems as currentItem}
				<input type="hidden" name={currentItem.key} value={currentItem.value} />
			{/each}
			<input type="hidden" name="type" value={currentType} />
			<Textarea name="note" placeholder="Add a note">
				<div slot="footer" class="flex items-center justify-between">
					<Button class="rounded-lg" type="submit">Create Note</Button>
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
