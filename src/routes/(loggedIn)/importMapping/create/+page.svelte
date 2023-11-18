<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import {
		type ImportMappingDetailSuperSchema,
		type ImportMappingCreateFormSuperSchema,
		importMappingDetailWithRefinementSchema
	} from '$lib/schema/importMappingSchema.js';
	import { superForm } from 'sveltekit-superforms/client';
	import ImportMappingForm from './ImportMappingForm.svelte';

	export let data;

	const form = superForm<ImportMappingCreateFormSuperSchema>(data.form);
	const detailForm = superForm<ImportMappingDetailSuperSchema>(data.detailForm, {
		//@ts-expect-error Doesn't work with refinement
		validators: importMappingDetailWithRefinementSchema,
		validationMethod: 'oninput'
	});
</script>

<PageLayout title="Create Import Mapping">
	<RawDataModal {data} dev={data.dev} />
	<ImportMappingForm
		{form}
		{detailForm}
		dropdowns={data.dropdowns}
		submitButtonText="Create Import Mapping"
	/>
</PageLayout>
