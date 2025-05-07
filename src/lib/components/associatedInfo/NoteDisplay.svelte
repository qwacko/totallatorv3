<script lang="ts">
	import { Button, Badge, P } from 'flowbite-svelte';
	import { enhance } from '$app/forms';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import type { AssociatedInfoDataType } from '$lib/server/db/actions/associatedInfoActions';

	const {
		note,
		associatedItem
	}: { note: AssociatedInfoDataType['notes'][number]; associatedItem: AssociatedInfoDataType } =
		$props();
</script>

<div class="flex flex-col gap-2">
	<div class="flex flex-row items-center gap-2">
		<Badge color={note.type === 'info' ? 'green' : 'red'}>
			{note.type === 'info' ? 'Info' : 'Reminder'}
		</Badge>
		{#if associatedItem.user}
			<P weight="light" size="sm">{associatedItem.user.name || 'NO User'}</P>
		{/if}
		<P weight="light" size="sm">
			{new Date(note.createdAt).toISOString().slice(0, 10)}
		</P>
		<form method="post" action="?/deleteNote" use:enhance>
			<input type="hidden" name="noteId" value={note.id} />
			<Button type="submit" outline color="red" class="rounded-lg border-0 p-1">
				<DeleteIcon />
			</Button>
		</form>
	</div>
	<div class="whitespace-pre">{note.note}</div>
</div>
