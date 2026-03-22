<script lang="ts">
	import { Dropdown, DropdownDivider, DropdownItem, Modal, Spinner } from 'flowbite-svelte';
	import { tick } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import CodeIcon from '~icons/mdi/xml';
	import * as z from 'zod';

	import type { AssociatedInfoDataType, EnhancedRecommendationType } from '@totallator/business-logic';
	import type { JournalViewReturnType } from '@totallator/database';
	import { journalFilterSchemaWithoutPagination, updateJournalSchema } from '@totallator/shared';

	import { goto } from '$app/navigation';

	import AssociatedInfoModal from '$lib/components/associatedInfo/AssociatedInfoModal.svelte';
	import RecommendationDisplay from '$lib/components/RecommendationDisplay.svelte';
	import TransactionHistoryModal from '$lib/components/associatedInfo/TransactionHistoryModal.svelte';
	import CloneIcon from '$lib/components/icons/CloneIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import FilterIcon from '$lib/components/icons/FilterIcon.svelte';
	import IdeaIcon from '$lib/components/icons/IdeaIcon.svelte';
	import NotesIcon from '$lib/components/icons/NotesIcon.svelte';
	import TransactionIcon from '$lib/components/icons/TransactionIcon.svelte';
	import { urlGenerator } from '$lib/routes';
	import type { CreateFileNoteRelationshipSchemaType } from '@totallator/shared';

	const {
		data,
		target,
		rawData,
		recommendations,
		journal,
		triggeredBy,
		filterHref,
		cloneHref,
		deleteHref,
		dev = false
	}: {
		data?: Promise<AssociatedInfoDataType[]> | null;
		target: CreateFileNoteRelationshipSchemaType;
		rawData: unknown;
		recommendations: Record<string, Promise<EnhancedRecommendationType[] | undefined>>;
		journal: JournalViewReturnType;
		triggeredBy: string;
		filterHref: string;
		cloneHref: string;
		deleteHref: string;
		dev?: boolean;
	} = $props();

	let associatedInfoOpen = $state(false);
	let historyOpen = $state(false);
	let recommendationOpen = $state(false);
	let rawDataOpen = $state(false);
	let loadingUpdate = $state<string | undefined>();
	let loadingUpdateAndSave = $state<string | undefined>();

	const journalRecommendations = $derived(recommendations[journal.id]);

	const form = $derived(
		superForm(
			{},
			{
				validators: zod4Client(
					z.object({
						...updateJournalSchema.shape,
						filter: journalFilterSchemaWithoutPagination
					})
				),
				onResult: ({ result }) => {
					if (result.type === 'success') {
						recommendationOpen = false;
					} else {
						loadingUpdate = undefined;
						loadingUpdateAndSave = undefined;
					}
				},
				dataType: 'json'
			}
		)
	);

	const enhance = $derived(form.enhance);
	const formData = $derived(form.form);

	const submitJournalUpdateForm = async (rec: EnhancedRecommendationType) => {
		formData.set({
			filter: {
				idArray: [journal.id]
			},
			otherAccountId: rec.payeeAccountId,
			description: rec.journalDescription,
			billId: rec.journalBillId,
			budgetId: rec.journalBudgetId,
			categoryId: rec.journalCategoryId,
			tagId: rec.journalTagId,
			clearDataChecked: false,
			setDataChecked: true
		});
		await tick();
		form.submit();
	};

	const updateAndEdit = async (rec: EnhancedRecommendationType) => {
		loadingUpdate = rec.journalId;
		await submitJournalUpdateForm(rec);
		await goto(
			urlGenerator({
				address: '/(loggedIn)/journals/bulkEdit',
				searchParamsValue: {
					idArray: [journal.id],
					orderBy: [{ field: 'date', direction: 'asc' }],
					page: 0,
					pageSize: 10
				}
			}).url
		);
		loadingUpdate = undefined;
	};

	const updateAndSave = async (rec: EnhancedRecommendationType) => {
		loadingUpdateAndSave = rec.journalId;
		await submitJournalUpdateForm(rec);
		recommendationOpen = false;
		loadingUpdateAndSave = undefined;
	};
</script>

<Dropdown simple triggeredBy={triggeredBy}>
	<DropdownItem onclick={() => (associatedInfoOpen = true)}>
		<div class="flex items-center gap-2">
			{#if data}
				{#await data then targetData}
					{@const hasAssociatedInfo = targetData.some(
						(item) => item.notes.length > 0 || item.files.length > 0 || item.journalSnapshots.length > 0
					)}
					<span
						class={`h-2 w-2 rounded-full ${hasAssociatedInfo ? 'bg-blue-500' : 'bg-gray-300'}`}
					></span>
				{/await}
			{/if}
			<NotesIcon />
			Notes & Files
		</div>
	</DropdownItem>
	<DropdownItem href={filterHref}>
		<div class="flex items-center gap-2">
			<FilterIcon />
			Filter Similar
		</div>
	</DropdownItem>
	<DropdownItem onclick={() => (recommendationOpen = true)}>
		<div class="flex items-center gap-2">
			{#await journalRecommendations then recs}
				<span
					class={`h-2 w-2 rounded-full ${recs && recs.length > 0 ? 'bg-red-500' : 'bg-gray-300'}`}
				></span>
			{/await}
			<IdeaIcon />
			Suggestions
		</div>
	</DropdownItem>
	{#if target.transactionId}
		<DropdownItem onclick={() => (historyOpen = true)}>
			<div class="flex items-center gap-2">
				<TransactionIcon />
				Change History
			</div>
		</DropdownItem>
	{/if}
	{#if dev}
		<DropdownItem onclick={() => (rawDataOpen = true)}>
			<div class="flex items-center gap-2">
				<CodeIcon />
				Raw JSON
			</div>
		</DropdownItem>
	{/if}
	<DropdownDivider />
	<DropdownItem href={cloneHref}>
		<div class="flex items-center gap-2">
			<CloneIcon />
			Clone
		</div>
	</DropdownItem>
	<DropdownDivider />
	<DropdownItem href={deleteHref}>
		<div class="flex items-center gap-2 text-red-600 dark:text-red-400">
			<DeleteIcon />
			Delete
		</div>
	</DropdownItem>
</Dropdown>

{#if data}
	{#await data}
		<Modal title="Notes & Files" open={associatedInfoOpen} onclose={() => (associatedInfoOpen = false)}>
			<div class="flex items-center gap-2 py-4 text-sm text-gray-500">
				<Spinner size="4" />
				Loading additional information
			</div>
		</Modal>
	{:then targetData}
		<AssociatedInfoModal
			open={associatedInfoOpen}
			setOpen={(newOpen) => (associatedInfoOpen = newOpen)}
			{target}
			data={targetData}
		/>
	{/await}
{:else}
	<AssociatedInfoModal
		open={associatedInfoOpen}
		setOpen={(newOpen) => (associatedInfoOpen = newOpen)}
		{target}
		{data}
	/>
{/if}

{#if target.transactionId}
	<TransactionHistoryModal
		open={historyOpen}
		setOpen={(newOpen) => (historyOpen = newOpen)}
		transactionId={target.transactionId}
	/>
{/if}

<Modal title="Suggestions" bind:open={recommendationOpen} outsideclose size="xl">
	<form action="?/updateJournal" method="post" use:enhance></form>
	<RecommendationDisplay
		recommendations={journalRecommendations}
		{updateAndSave}
		update={updateAndEdit}
		hideHeading
		{journal}
		{loadingUpdate}
		{loadingUpdateAndSave}
	/>
</Modal>

{#if dev}
	<Modal title="Journal Data" bind:open={rawDataOpen} autoclose outsideclose>
		<pre>{JSON.stringify(rawData, null, 2)}</pre>
	</Modal>
{/if}
