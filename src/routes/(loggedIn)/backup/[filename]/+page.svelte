<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { pageInfo, urlGenerator } from '$lib/routes.js';
	import { page } from '$app/stores';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import { enhance } from '$app/forms';
	import { Button, Badge, Spinner } from 'flowbite-svelte';
	import { defaultCustomEnhance } from '$lib/helpers/customEnhance';
	import ActionButton from '$lib/components/ActionButton.svelte';

	$: urlInfo = pageInfo('/(loggedIn)/backup/[filename]', $page);

	export let data;

	$: filename = urlInfo.current.params?.filename || '';
	$: title = `Backup - ${filename}`;

	let restoring = false;
	let deleting = false;

	$: console.log('Information = ', data.information.information);
</script>

<CustomHeader pageTitle={title} />

<PageLayout {title}>
	{#await data.information}
		<Badge color="blue" class="flex flex-row gap-2 p-4">
			<Spinner size="8" />Loading Backup...
		</Badge>
	{:then information}
		<div class="grid grid-cols-2 gap-2">
			<div class="grid justify-self-end font-bold">Title</div>
			<div class="grid">{information.information.title}</div>
			<div class="grid justify-self-end font-bold">Created By</div>
			<div class="grid">{information.information.createdBy}</div>
			<div class="grid justify-self-end font-bold">Created At</div>
			<div class="grid">{information.information.createdAt}</div>
			<div class="grid justify-self-end font-bold">Creation Reason</div>
			<div class="grid">{information.information.creationReason}</div>
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
					<Badge>Key Values : {information.information.itemCount.numberKeyValues}</Badge>
					<Badge>Report Elements : {information.information.itemCount.numberReportElements}</Badge>
					<Badge>Report Filters : {information.information.itemCount.numberReportFilters}</Badge>
					<Badge>Report Items : {information.information.itemCount.numberReportItems}</Badge>
					<Badge>Reports : {information.information.itemCount.numberReports}</Badge>
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
					loading={deleting}
					loadingMessage="Deleting..."
					message="Delete"
				/>
			</form>
			<Button
				href={urlGenerator({
					address: '/(loggedIn)/backup/download/[filename]',
					paramsValue: { filename: filename }
				}).url}
				outline
				color="blue"
			>
				Download
			</Button>
		</div>
	{/await}
</PageLayout>
