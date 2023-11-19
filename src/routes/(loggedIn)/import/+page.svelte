<script lang="ts">
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { urlGenerator } from '$lib/routes';
	import {
		importStatusToColour,
		importStatusToTest,
		importTypeToTitle
	} from '$lib/schema/importSchema.js';
	import { Badge, Button, Card } from 'flowbite-svelte';

	export let data;
</script>

<CustomHeader pageTitle="Imports" />

<PageLayout title="Imports">
	<svelte:fragment slot="right">
		<Button color="light" href={urlGenerator({ address: '/(loggedIn)/import/create' }).url} outline>
			Add
		</Button>
	</svelte:fragment>
	<div class="grid grid-cols-1 gap-2">
		{#each data.imports as currentImport}
			<Card
				href={urlGenerator({
					address: '/(loggedIn)/import/[id]',
					paramsValue: { id: currentImport.id }
				}).url}
				size="xl"
				padding="md"
				class="flex flex-col gap-2"
			>
				<div class="flex font-bold">{currentImport.title}</div>
				<div class="flex flex-row gap-4">
					<div class="flex flex-row gap-2">
						<div class="flex font-semibold">Date</div>
						<div class="flex">{currentImport.createdAt.toISOString().slice(0, 10)}</div>
					</div>
					{#if currentImport.type !== 'transaction'}
						<div class="flex flex-row gap-2">
							<div class="flex font-semibold">Duplicate Checking</div>
							<div class="flex">
								{#if currentImport.checkImportedOnly}Imported Only{:else}All{/if}
							</div>
						</div>
					{/if}
				</div>
				<div class="flex flex-row gap-4">
					<div class="flex flex-row gap-2">
						<div class="flex font-semibold">Type</div>
						<div class="flex">{importTypeToTitle(currentImport.type)}</div>
					</div>
					{#if currentImport.type === 'mappedImport'}
						<div class="flex flex-row gap-2">
							<div class="flex font-semibold">Import Mapping</div>
							<div class="flex">{currentImport.importMappingTitle}</div>
						</div>
					{/if}
				</div>
				<Badge color={importStatusToColour(currentImport.status)}>
					{importStatusToTest(currentImport.status)}
				</Badge>

				<div class="flex flex-row flex-wrap items-center self-center gap-2">
					<Badge color={importStatusToColour('processed')}>
						{currentImport.numProcessed} Processed
					</Badge>
					<Badge color={importStatusToColour('error')}>
						{currentImport.numErrors} Processing Error
					</Badge>
					<Badge color={importStatusToColour('error')}>
						{currentImport.numImportErrors} Import Error
					</Badge>
					<Badge color={importStatusToColour('duplicate')}>
						{currentImport.numDuplicate} Duplicate
					</Badge>
					<Badge color={importStatusToColour('imported')}>
						{currentImport.numImport} Imported
					</Badge>
				</div>
			</Card>
		{/each}
	</div>
</PageLayout>
