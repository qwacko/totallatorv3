<script lang="ts">
	import { Button } from 'flowbite-svelte';

	import type { AssociatedInfoDataType } from '@totallator/business-logic';
	import type { CreateFileNoteRelationshipSchemaType } from '@totallator/shared';

	import AssociatedInfoModal from './associatedInfo/AssociatedInfoModal.svelte';
	import AdditionalInfoIcon from './icons/AdditionalInfoIcon.svelte';

	const {
		data,
		target,
		open,
		setOpen
	}: {
		data?: AssociatedInfoDataType[] | null;
		target: CreateFileNoteRelationshipSchemaType;
		open: boolean;
		setOpen: (open: boolean) => void;
	} = $props();

	const hasReminder = $derived(
		data && data.some((data) => data.notes.some((note) => note.type === 'reminder'))
	);
	const itemCount = $derived(
		data
			? data.reduce(
					(prev, current) =>
						prev + current.notes.length + current.files.length + current.journalSnapshots.length,
					0
				)
			: 0
	);
</script>

<Button
	onclick={() => setOpen(true)}
	color={hasReminder ? 'red' : 'primary'}
	outline={itemCount === 0}
	class="p-2"
>
	<AdditionalInfoIcon />
</Button>
<AssociatedInfoModal {open} {setOpen} {target} {data} />
