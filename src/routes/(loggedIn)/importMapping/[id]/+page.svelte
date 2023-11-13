<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import {
		type ImportMappingDetailSuperSchema,
		type ImportMappingUpdateFormSuperSchema,
		importMappingDetailWithRefinementSchema
	} from '$lib/schema/importMappingSchema.js';
	import { superForm } from 'sveltekit-superforms/client';
	import ImportMappingForm from '../create/ImportMappingForm.svelte';

	export let data;

	const form = superForm<ImportMappingUpdateFormSuperSchema>(data.form);
	const detailForm = superForm<ImportMappingDetailSuperSchema>(data.detailForm, {
		//@ts-expect-error Doesn't work with refinement
		validators: importMappingDetailWithRefinementSchema,
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
