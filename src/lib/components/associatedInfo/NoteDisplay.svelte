<script lang="ts">
	import { Button, Badge } from 'flowbite-svelte';
	import { enhance } from '$app/forms';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import type { AssociatedInfoDataType } from '$lib/server/db/actions/associatedInfoActions';

	const { note }: { note: AssociatedInfoDataType['notes'][number] } = $props();
</script>

<div class="flex flex-col gap-2">
	<div class="flex flex-row items-center gap-2">
		<form method="post" action="?/deleteNote" use:enhance>
			<input type="hidden" name="noteId" value={note.id} />
			<Button type="submit" outline color="red" class="rounded-lg border-1 p-1">
				<DeleteIcon />
			</Button>
		</form>
		<Badge color={note.type === 'info' ? 'green' : 'red'}>
			{note.type === 'info' ? 'Info' : 'Reminder'}
		</Badge>

		<div class="whitespace-pre">{note.note}</div>
	</div>
</div>
