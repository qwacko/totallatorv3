<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { pageInfo, urlGenerator } from '$lib/routes.js';
	import { page } from '$app/stores';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import { enhance } from '$app/forms';
	import { Button, Badge } from 'flowbite-svelte';

	$: urlInfo = pageInfo('/(loggedIn)/backup/[filename]', $page);

	export let data;

	$: filename = urlInfo.current.params?.filename || '';
	$: title = `Backup - ${filename}`;
</script>

<CustomHeader pageTitle={title} />

<PageLayout {title}>
	<div class="grid grid-cols-2 gap-2">
		<div class="grid justify-self-end font-bold">Title</div>
		<div class="grid">{data.information.title}</div>
		<div class="grid justify-self-end font-bold">Created By</div>
		<div class="grid">{data.information.createdBy}</div>
		<div class="grid justify-self-end font-bold">Created At</div>
		<div class="grid">{data.information.createdAt.toISOString()}</div>
		<div class="grid justify-self-end font-bold">Creation Reason</div>
		<div class="grid">{data.information.creationReason}</div>
		<div class="grid justify-self-end font-bold">Journal Count</div>
		<div class="grid">{data.information.itemCount.numberJournalEntries}</div>
		<div class="grid justify-self-end font-bold">Other Items Count</div>
		<div class="grid">
			<div class=" flex flex-row gap-2 flex-wrap">
				<Badge>Accounts : {data.information.itemCount.numberAccounts}</Badge>
				<Badge>Categories : {data.information.itemCount.numberCategories}</Badge>
				<Badge>Tags : {data.information.itemCount.numberTags}</Badge>
				<Badge>Bills: {data.information.itemCount.numberBills}</Badge>
				<Badge>Budgets: {data.information.itemCount.numberBudgets}</Badge>
				<Badge>Transactions : {data.information.itemCount.numberTransactions}</Badge>
				<Badge>Labels : {data.information.itemCount.numberLabels}</Badge>
				<Badge>Reusable Filters : {data.information.itemCount.numberReusableFilters}</Badge>
				<Badge>Imports : {data.information.itemCount.numberImportTables}</Badge>
				<Badge>Import Items : {data.information.itemCount.numberImportItemDetails}</Badge>
				<Badge>Import Mappings : {data.information.itemCount.numberImportMappings}</Badge>
			</div>
		</div>
	</div>
	<div class="flex flex-row justify-center gap-2">
		<form action="?/restore" method="post" use:enhance class="flex">
			<Button type="submit" outline color="green">Restore</Button>
		</form>
		<form action="?/delete" method="post" use:enhance class="flex">
			<Button class="delete-button" type="submit" outline color="red">Delete</Button>
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
</PageLayout>
