<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import { urlGenerator } from '$lib/routes.js';
	import { importTypeToTitle } from '$lib/schema/importSchema';
	import { linkToImportItems } from './linkToImportItems';
	import { Badge, Button, Card, Dropdown, DropdownItem, Spinner } from 'flowbite-svelte';

	export let data;

	$: if (browser) {
		if (
			data.streaming.data.detail.status === 'importing' ||
			data.streaming.data.detail.status === 'awaitingImport'
		) {
			console.log('Invalidating All');
			setTimeout(() => {
				invalidateAll();
			}, 2000);
		}
	}
</script>

<CustomHeader pageTitle="Import" filterText={data.info.importInfo.import.title} />

<PageLayout subtitle={data.info.importInfo.import.title} title="Import Detail">
	{@const importData = data.streaming.data}

	{#if !importData.detail}
		<Badge color="red">Unknown Data Load Error</Badge>
	{:else}
		{@const errorCount = importData.detail.importDetails.filter((d) => d.status === 'error').length}
		{@const importErrorCount = importData.detail.importDetails.filter(
			(d) => d.status === 'importError'
		).length}
		{@const processCount = importData.detail.importDetails.filter(
			(d) => d.status === 'processed'
		).length}
		{@const importCount = importData.detail.importDetails.filter(
			(d) => d.status === 'imported'
		).length}
		{@const duplicateCount = importData.detail.importDetails.filter(
			(d) => d.status === 'duplicate'
		).length}

		<div class="flex flex-row items-center gap-4 self-center">
			<i>Type :</i>
			{importTypeToTitle(importData.detail.type)}
			{#if data.info.importInfo.import_mapping?.title}
				- {data.info.importInfo.import_mapping.title}{/if}
		</div>
		<div class="flex flex-row gap-1 self-center">
			<i>Duplicate Checking :</i>
			{#if importData.detail.checkImportedOnly}
				Only Imported Items
			{:else}
				All Items
			{/if}
		</div>
		<div class="flex flex-row gap-1 self-center">
			<i>Created :</i>
			{importData.detail.createdAt.toISOString().slice(0, 19)}
		</div>
		<div class="flex flex-row gap-1 self-center">
			<i>Last Modification :</i>
			{new Date(importData.detail.updatedAt).toISOString().slice(0, 19)}
		</div>
		<div class="flex flex-row gap-1 self-center">
			{#if importCount > 0}
				<Button
					href={linkToImportItems({
						importId: importData.detail.id,
						importType: importData.detail.type
					})}
					outline
					color="light"
				>
					<JournalEntryIcon />
				</Button>
			{/if}
			{#if importData.detail.status !== 'complete' && importData.detail.status !== 'importing' && importData.detail.status !== 'awaitingImport' && importCount === 0}
				<form method="post" action="?/reprocess" use:enhance class="flex self-center">
					<Button color="blue" type="submit">Reprocess</Button>
				</form>
			{/if}
			{#if importData.detail.status === 'processed'}
				<form method="post" action="?/triggerImport" use:enhance class="flex self-center">
					<Button color="green" type="submit" disabled={processCount === 0}>Import</Button>
				</form>
			{/if}
			{#if importData.detail.status !== 'awaitingImport' && importData.detail.status !== 'importing'}
				<Button color="red" outline><DeleteIcon /></Button>
				<Dropdown>
					{#if data.canDelete}
						<DropdownItem
							color="red"
							type="submit"
							href={urlGenerator({
								address: '/(loggedIn)/import/[id]/delete',
								paramsValue: { id: data.id }
							}).url}
						>
							Delete (With Created Items)
						</DropdownItem>

						<DropdownItem
							color="red"
							type="submit"
							href={urlGenerator({
								address: '/(loggedIn)/import/[id]/deleteLinked',
								paramsValue: { id: data.id }
							}).url}
						>
							Delete Created Items (Leave Import)
						</DropdownItem>
					{/if}
					<DropdownItem
						color="red"
						type="submit"
						href={urlGenerator({
							address: '/(loggedIn)/import/[id]/forget',
							paramsValue: { id: data.id }
						}).url}
					>
						Forget (Leave Created Items)
					</DropdownItem>
				</Dropdown>
			{/if}
		</div>
		{#if importData.detail.status === 'processed'}
			<Badge color="blue">Processed</Badge>
		{/if}
		{#if importData.detail.status === 'awaitingImport'}
			<Badge color="green">
				<Spinner size="8" class="p-1" color="green" />Awaiting Import...
			</Badge>
		{/if}
		{#if importData.detail.status === 'importing'}
			<Badge color="green">
				<Spinner size="8" class=" p-1" color="green" />Importing... ({Math.floor(
					(new Date().valueOf() - importData.detail.updatedAt.valueOf()) / 1000
				)}s)
			</Badge>
		{/if}
		{#if importData.detail.status === 'complete'}
			<Badge color="green">Complete</Badge>
		{/if}
		{#if importData.detail.status === 'error'}
			<Badge color="red">
				<div class="flex flex-col gap-2 p-4">
					File Import Error
					<pre>{JSON.stringify(importData.detail.errorInfo, null, 2)}</pre>
				</div>
			</Badge>
		{:else}
			<div class="flex flex-row gap-2 self-center">
				<Badge color="blue">Processed: {processCount}</Badge>
				<Badge color="red">Error: {errorCount}</Badge>
				<Badge color="red">Import Error: {importErrorCount}</Badge>
				<Badge color="dark">Duplicate: {duplicateCount}</Badge>
				<Badge color="green">Imported: {importCount}</Badge>
				<RawDataModal data={importData.detail} dev={data.dev} buttonText="Import Data" outline />
			</div>
			<div class="grid grid-cols-1 gap-2 md:grid-cols-3">
				{#each importData.detail.importDetails as currentImportDetail, i}
					{#if currentImportDetail.status === 'imported'}
						<Card size="xl" padding="md" class="flex flex-col gap-2" color="green">
							<div class="flex flex-row items-center justify-between">
								Row {i + 1}
								<Badge color="green">Imported</Badge>
							</div>
							<RawDataModal
								color="green"
								data={currentImportDetail.importInfo}
								dev={true}
								buttonText="Import Details"
								title="Row {i + 1} Import Details"
							/>
						</Card>
					{:else if currentImportDetail.status === 'error' || currentImportDetail.status === 'importError'}
						<Card size="xl" padding="md" class="flex flex-col gap-2" color="red">
							<div class="flex flex-row items-center justify-between">
								Row {i + 1}
								<Badge color="red">
									{currentImportDetail.status === 'error' ? 'Error' : 'Import Error'}
								</Badge>
							</div>
							<RawDataModal
								color="red"
								data={currentImportDetail.errorInfo}
								dev={true}
								buttonText="Error Details"
								title="Row {i + 1} Error Details"
							/>
						</Card>
					{:else if currentImportDetail.status === 'processed'}
						<Card size="xl" padding="md" class="flex flex-col gap-2" color="blue">
							<div class="flex flex-row items-center justify-between">
								Row {i + 1}
								<Badge color="blue">Processed</Badge>
							</div>
							<RawDataModal
								color="blue"
								data={currentImportDetail.processedInfo}
								dev={true}
								buttonText="Processed Details"
								title="Row {i + 1} Processed Details"
							/>
						</Card>
					{:else if currentImportDetail.status === 'duplicate'}
						<Card size="xl" padding="md" class="flex flex-col gap-2" color="dark">
							<div class="flex flex-row items-center justify-between">
								Row {i + 1}
								<Badge color="dark">Duplicate</Badge>
							</div>
							<RawDataModal
								color="dark"
								data={currentImportDetail.processedInfo}
								dev={true}
								buttonText="Processed Details"
								title="Row {i + 1} Processed Details"
							/>
						</Card>
					{/if}
				{/each}
			</div>
		{/if}
	{/if}
</PageLayout>
