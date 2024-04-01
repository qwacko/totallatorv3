<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import { importMappingDetailWithRefinementSchema } from '$lib/schema/importMappingSchema.js';
	import { superForm } from 'sveltekit-superforms';
	import ImportMappingForm from '../create/ImportMappingForm.svelte';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Button, Heading, P } from 'flowbite-svelte';
	import { urlGenerator } from '$lib/routes';
	import ImportLinkList from '$lib/components/ImportLinkList.svelte';

	export let data;

	const form = superForm(data.form);
	const detailForm = superForm(data.detailForm, {
		validators: zodClient(importMappingDetailWithRefinementSchema),
		validationMethod: 'oninput'
	});
</script>

<CustomHeader pageTitle="Edit Import Mapping - {data.importMapping.title}" />

<PageLayout title="Edit Import Mapping" subtitle={data.importMapping.title}>
	<div class="flex flex-row flex-wrap items-center gap-2">
		{#if data.autoImports.data.length > 0}
			<P weight="bold">Auto Imports</P>
			{#each data.autoImports.data as autoImport}
				<Button
					href={urlGenerator({
						address: '/(loggedIn)/autoImport/[id]',
						paramsValue: { id: autoImport.id }
					}).url}
					color="light"
				>
					{autoImport.title}
				</Button>
			{/each}
		{:else}
			<Heading tag="h3">No Auto Imports found</Heading>
		{/if}
	</div>
	<ImportMappingForm
		{form}
		{detailForm}
		dropdowns={data.dropdowns}
		submitButtonText="Update Import Mapping"
		csvData={data.importMapping.sampleData ? JSON.parse(data.importMapping.sampleData) : undefined}
	/>
	{#await data.imports then importList}
		<ImportLinkList
			title="Last {data.importFilter.pageSize} Imports"
			data={importList.details}
			filter={data.importFilter}
		/>
	{/await}
</PageLayout>
