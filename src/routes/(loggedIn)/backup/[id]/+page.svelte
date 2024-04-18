<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { urlGenerator } from '$lib/routes.js';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import { enhance } from '$app/forms';
	import { Button, Badge, Spinner } from 'flowbite-svelte';
	import { defaultCustomEnhance } from '$lib/helpers/customEnhance';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import CancelIcon from '$lib/components/icons/CancelIcon.svelte';
	import TextInput from '$lib/components/TextInput.svelte';

	export let data;

	$: filename = data.backupInformation.filename;
	$: title = `Backup - ${data.backupInformation.title}`;

	let restoring = false;
	let deleting = false;
	let editingTitle = false;
	let editSubmission = false;
	let updatingLocked = false;
</script>

<CustomHeader pageTitle={title} />

<PageLayout {title}>
	{#await data.information}
		<Badge color="blue" class="flex flex-row gap-2 p-4">
			<Spinner size="8" />Loading Backup...
		</Badge>
	{:then information}
		<div class="grid grid-cols-2 gap-2">
			<div class="grid content-center justify-self-end font-bold">Title</div>
			<div class="flex flex-row items-center gap-2">
				{#if editingTitle}
					<form
						class="flex flex-row gap-2"
						action="?/updateTitle"
						method="post"
						use:enhance={defaultCustomEnhance({
							updateLoading: (loading) => (editSubmission = loading),
							defaultSuccessMessage: 'Successfully Updated Title',
							onSuccess: () => (editingTitle = false)
						})}
					>
						<TextInput
							type="text"
							name="title"
							class="input"
							disabled={editSubmission}
							value={data.backupInformation.title}
							errorMessage=""
							title=""
						/>
						<ActionButton
							type="submit"
							size="xs"
							outline
							loading={editSubmission}
							message="Update"
							loadingMessage="...Updating"
						/>
					</form>
					<Button on:click={() => (editingTitle = false)} size="sm" outline>
						<CancelIcon />
					</Button>
				{:else}
					{data.backupInformation.title}<Button
						on:click={() => (editingTitle = true)}
						size="xs"
						outline
					>
						<EditIcon />
					</Button>
				{/if}
			</div>
			<div class="grid content-center justify-self-end font-bold">Locked</div>
			<div class="grid flex-row gap-2">
				<form
					class="flex"
					action={data.backupInformation.locked ? '?/unlock' : '?/lock'}
					method="post"
					use:enhance={defaultCustomEnhance({
						updateLoading: (loading) => (updatingLocked = loading),
						defaultSuccessMessage: 'Successfully Updated Lock Status'
					})}
				>
					<ActionButton
						type="submit"
						color={data.backupInformation.locked ? 'red' : 'green'}
						loading={updatingLocked}
						loadingMessage="Updating..."
						message={data.backupInformation.locked ? 'Locked' : 'Unlocked'}
					/>
				</form>
			</div>
			<div class="grid justify-self-end font-bold">Filename</div>
			<div class="grid">{data.backupInformation.filename}</div>
			<div class="grid justify-self-end font-bold">Created By</div>
			<div class="grid">{data.backupInformation.createdBy}</div>
			<div class="grid justify-self-end font-bold">Created At</div>
			<div class="grid">{new Date(data.backupInformation.createdAt).toISOString()}</div>
			<div class="grid justify-self-end font-bold">Creation Reason</div>
			<div class="grid">{data.backupInformation.creationReason}</div>
			<div class="grid justify-self-end font-bold">Journal Count</div>
			<div class="grid">{information.information.itemCount.numberJournalEntries}</div>
			<div class="grid justify-self-end font-bold">Other Items Count</div>
			<div class="grid">
				<div class=" flex flex-row flex-wrap gap-2">
					<Badge>Accounts : {information.information.itemCount.numberAccounts}</Badge>
					<Badge>Categories : {information.information.itemCount.numberCategories}</Badge>
					<Badge>Tags : {information.information.itemCount.numberTags}</Badge>
					<Badge>Bills: {information.information.itemCount.numberBills}</Badge>
					<Badge>Budgets: {information.information.itemCount.numberBudgets}</Badge>
					<Badge>Transactions : {information.information.itemCount.numberTransactions}</Badge>
					<Badge>Journals : {information.information.itemCount.numberJournalEntries}</Badge>
					<Badge>Labels : {information.information.itemCount.numberLabels}</Badge>
					<Badge>
						Reusable Filters : {information.information.itemCount.numberReusableFilters}
					</Badge>
					<Badge>Imports : {information.information.itemCount.numberImportTables}</Badge>
					<Badge>Import Items : {information.information.itemCount.numberImportItemDetails}</Badge>
					<Badge>Import Mappings : {information.information.itemCount.numberImportMappings}</Badge>
					<Badge>Auto Imports : {information.information.itemCount.numberAutoImport}</Badge>
					<Badge>Key Values : {information.information.itemCount.numberKeyValues}</Badge>
					<Badge>Report Elements : {information.information.itemCount.numberReportElements}</Badge>
					<Badge>Report Filters : {information.information.itemCount.numberReportFilters}</Badge>
					<Badge>Report Items : {information.information.itemCount.numberReportItems}</Badge>
					<Badge>Reports : {information.information.itemCount.numberReports}</Badge>
					<Badge>Backups : {information.information.itemCount.numberBackups}</Badge>
					<Badge>Files : {information.information.itemCount.numberFiles}</Badge>
					<Badge>Notes : {information.information.itemCount.numberNotes}</Badge>
				</div>
			</div>
		</div>
		<div class="flex flex-row justify-center gap-2">
			<form
				action="?/restore"
				method="post"
				use:enhance={defaultCustomEnhance({
					updateLoading: (loading) => (restoring = loading),
					defaultSuccessMessage: 'Successfully Restored Backup'
				})}
				class="flex"
			>
				<ActionButton
					type="submit"
					outline
					color="green"
					loading={restoring}
					loadingMessage="Restoring..."
					message="Restore"
				/>
			</form>
			<form
				action="?/delete"
				method="post"
				use:enhance={defaultCustomEnhance({
					updateLoading: (loading) => (deleting = loading),
					defaultSuccessMessage: 'Successfully Deleted Backup'
				})}
				class="flex"
			>
				<ActionButton
					class="delete-button"
					type="submit"
					outline
					color="red"
					disabled={data.backupInformation.locked}
					loading={deleting}
					loadingMessage="Deleting..."
					message="Delete"
				/>
			</form>
			<Button
				href={urlGenerator({
					address: '/(loggedIn)/backup/download/[filename]',
					paramsValue: { filename }
				}).url}
				outline
				color="blue"
			>
				Download
			</Button>
		</div>
	{/await}
</PageLayout>
