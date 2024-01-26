<script lang="ts">
	import ActionButton from '$lib/components/ActionButton.svelte';
	import BooleanInputForm from '$lib/components/BooleanInputForm.svelte';
	import LabelWrapper from '$lib/components/LabelWrapper.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import {
		configTypeDropdownOptions,
		type ReportElementConfigFormSupertype
	} from '$lib/schema/reportSchema';
	import { Heading, NumberInput } from 'flowbite-svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms/client';
	import { superFormNotificationHelper } from '$lib/stores/notificationHelpers';

	export let formData: SuperValidated<ReportElementConfigFormSupertype>;

	let loading = false;

	const configForm = superForm<ReportElementConfigFormSupertype>(formData, {
		timeoutMs: 500,
		taintedMessage: null,
		...superFormNotificationHelper({
			setLoading: (value) => (loading = value),
			successMessage: 'Report Element Config Updated Successfully',
			errorMessage: 'Error Updating Report Element Config',
			invalidate: true
		})
	});

	$: form = configForm.form;
	$: enhance = configForm.enhance;
	$: errors = configForm.errors;
</script>

<form method="post" action="?/updateConfig" use:enhance class="flex flex-col gap-2">
	<Heading tag="h4">Report Element Configuration</Heading>
	<SelectInput
		bind:value={$form.type}
		title="Type"
		name="type"
		id="type"
		errorMessage={$errors.type}
		items={configTypeDropdownOptions}
	/>
	{#if $form.type === 'number'}
		<LabelWrapper title="Decimals" errorMessage={$errors.precision}>
			<NumberInput bind:value={$form.precision} name="precision" />
		</LabelWrapper>
		<BooleanInputForm form={configForm} field="percentage" title="Display Percentage" hideClear />
	{/if}

	<ActionButton type="submit" {loading} message="Update" loadingMessage="Updating Config..." />

	<Heading tag="h4">Display</Heading>

    
</form>
