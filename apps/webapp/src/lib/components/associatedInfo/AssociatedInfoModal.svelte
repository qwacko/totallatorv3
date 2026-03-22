<script lang="ts">
	import { Modal, Timeline, TimelineItem } from 'flowbite-svelte';

	import type { AssociatedInfoDataType } from '@totallator/business-logic';
	import { formatDate } from '@totallator/shared';
	import type { CreateFileNoteRelationshipSchemaType } from '@totallator/shared';

	import { userDateFormat } from '$lib/stores/userInfoStore';

	import AssociatedInfoCreateButton from './AssociatedInfoCreateButton.svelte';
	import FileDisplay from './FileDisplay.svelte';
	import JournalSummaryDisplay from './JournalSummaryDisplay.svelte';
	import NoteDisplay from './NoteDisplay.svelte';
	import AdditionalInfoIcon from '../icons/AdditionalInfoIcon.svelte';

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

	const modal = $derived(open);

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

<Modal
	title="Additional Information"
	open={modal}
	onclose={() => {
		setOpen(false);
	}}
	outsideclose
>
	{#if data}
		<Timeline order="activity">
			{#each data as currentData}
				<TimelineItem title="" date="">
					{#snippet orientationSlot()}
						<span
							class="bg-primary-200 dark:bg-primary-900 absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-900"
						>
							<AdditionalInfoIcon />
						</span>
					{/snippet}

					<div class="flex flex-col gap-2 px-2">
						<div class="flex flex-row items-center gap-2">
							{formatDate(currentData.createdAt, $userDateFormat)}
							{currentData.title ? ` - ${currentData.title}` : ''}
							{currentData.user ? ` - ${currentData.user.name}` : ''}
						</div>
						{#each currentData.notes as note}
							<NoteDisplay {note} />
						{/each}
						{#if currentData.journalSnapshots.length > 0}
							{#each currentData.journalSnapshots as snapshot}
								<JournalSummaryDisplay summary={snapshot} />
							{/each}
						{/if}
						{#if currentData.files.length > 0}
							<div class="flex flex-row flex-wrap gap-2">
								{#each currentData.files as file}
									<FileDisplay {file} associatedInfo={currentData} />
								{/each}
							</div>
						{/if}
					</div>
				</TimelineItem>
			{/each}
		</Timeline>
	{:else}
		<div class="py-4 text-sm text-gray-500">
			{itemCount > 0 ? `Additional Information (${itemCount})` : 'No additional information linked.'}
		</div>
	{/if}
	{#snippet footer()}
		<AssociatedInfoCreateButton {target} text="Link Additional Information" />
	{/snippet}
</Modal>
