<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import { importMappingDetailWithRefinementSchema } from '$lib/schema/importMappingSchema.js';
	import { superForm } from 'sveltekit-superforms';
	import ImportMappingForm from '../create/ImportMappingForm.svelte';
	import { zodClient } from 'sveltekit-superforms/adapters';

	export let data;

	const form = superForm(data.form);
	const detailForm = superForm(data.detailForm, {
		validators: zodClient(importMappingDetailWithRefinementSchema),
		validationMethod: 'oninput'
	});
</script>

<CustomHeader pageTitle="Edit Import Mapping - {data.importMapping.title}" />

<PageLayout title="Edit Import Mapping" subtitle={data.importMapping.title}>
	<ImportMappingForm
		{form}
		{detailForm}
		dropdowns={data.dropdowns}
		submitButtonText="Update Import Mapping"
		csvData={data.importMapping.sampleData ? JSON.parse(data.importMapping.sampleData) : undefined}
	/>
</PageLayout>
