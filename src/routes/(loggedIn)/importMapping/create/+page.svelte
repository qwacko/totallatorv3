<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import { importMappingDetailWithRefinementSchema } from '$lib/schema/importMappingSchema.js';
	import { superForm } from 'sveltekit-superforms';
	import ImportMappingForm from './ImportMappingForm.svelte';
	import { zodClient } from 'sveltekit-superforms/adapters';

	const { data } = $props();

	const form = superForm(data.form);
	const detailForm = superForm(data.detailForm, {
		validators: zodClient(importMappingDetailWithRefinementSchema),
		validationMethod: 'oninput'
	});
</script>

<PageLayout title="Create Import Mapping">
	<RawDataModal {data} dev={data.dev} />
	<ImportMappingForm {form} {detailForm} submitButtonText="Create Import Mapping" />
</PageLayout>
