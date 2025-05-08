<script lang="ts">
	import { Button, Modal, Timeline, TimelineItem } from 'flowbite-svelte';
	import type { AssociatedInfoDataType } from '$lib/server/db/actions/associatedInfoActions';
	import AdditionalInfoIcon from './icons/AdditionalInfoIcon.svelte';
	import NoteDisplay from './associatedInfo/NoteDisplay.svelte';
	import { formatDate } from '$lib/schema/userSchema';
	import { userDateFormat } from '$lib/stores/userInfoStore';
	import FileDisplay from './associatedInfo/FileDisplay.svelte';
	import type { CreateFileNoteRelationshipSchemaType } from '$lib/schema/helpers/fileNoteRelationship';
	import AssociatedInfoCreateForm from './associatedInfo/AssociatedInfoCreateForm.svelte';

	const {
		data,
		target
	}: {
		data?: AssociatedInfoDataType[] | null;
		target: CreateFileNoteRelationshipSchemaType;
	} = $props();

	let modal = $state(false);

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
	on:click={() => (modal = true)}
	color={hasReminder ? 'red' : 'primary'}
	outline={itemCount === 0}
	class="p-2"
>
	<AdditionalInfoIcon />
</Button>
<Modal title="Additional Information" bind:open={modal} outsideclose>
	{#if data}
		<Timeline order="activity">
			{#each data as currentData}
				<TimelineItem>
					<svelte:fragment slot="icon">
						<span
							class="bg-primary-200 dark:bg-primary-900 absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-900"
						>
							<AdditionalInfoIcon />
						</span>
					</svelte:fragment>

					<div class="flex flex-col gap-2 px-2">
						<div class="flex flex-row items-center gap-2">
							{formatDate(currentData.createdAt, $userDateFormat)}
							{currentData.title ? ` - ${currentData.title}` : ''}
							{currentData.user ? ` - ${currentData.user.name}` : ''}
						</div>
						{#each currentData.notes as note}
							<NoteDisplay {note} associatedItem={currentData} />
						{/each}
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
	{/if}
	<svelte:fragment slot="footer">
		<AssociatedInfoCreateForm {target} {modal} />
		<!-- {#if !automaticCreation}
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
						{#if filter}
							<Button
								on:click={() => (automaticCreation = true)}
								class="rounded-lg"
								color="alternative"
							>
								Automatic Note
							</Button>
						{/if}
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
		{/if} -->
	</svelte:fragment>
</Modal>
