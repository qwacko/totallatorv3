<script lang="ts">
	import ActionButton from '$lib/components/ActionButton.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import {
		configTypeDropdownOptions,
		type ReportElementConfigFormSupertype
	} from '$lib/schema/reportSchema';
	import { displaySparklineOptionsDropdown } from '$lib/schema/reportHelpers/displaySparklineOptionsEnum';
	import { displayTimeOptionsDropdown } from '$lib/schema/reportHelpers/displayTimeOptionsEnum';
	import { Heading } from 'flowbite-svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms/client';
	import { superFormNotificationHelper } from '$lib/stores/notificationHelpers';
	import TextInput from '$lib/components/TextInput.svelte';
	import { reportItemSizeDropdowns } from '$lib/schema/reportHelpers/reportItemSizeEnum';
	import CheckboxInput from '../CheckboxInput.svelte';

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
		<SelectInput
			title="Display"
			items={displayTimeOptionsDropdown}
			bind:value={$form.numberDisplay}
			name="numberDisplay"
			errorMessage={$errors.numberDisplay}
		/>

		<SelectInput
			title="Secondary Display"
			items={displayTimeOptionsDropdown}
			bind:value={$form.numberSecondaryDisplay}
			name="numberSecondaryDisplay"
			errorMessage={$errors.numberSecondaryDisplay}
		/>
		{#if $form.numberSecondaryDisplay !== 'none'}
			<TextInput
				title="Secondary Display Title"
				bind:value={$form.numberSecondaryTitle}
				name="numberSecondaryTitle"
				errorMessage={$errors.numberSecondaryTitle}
			/>
		{/if}

		<SelectInput
			title="Sparkline"
			items={displaySparklineOptionsDropdown}
			bind:value={$form.numberSparkline}
			name="numberSparkline"
			errorMessage={$errors.numberSparkline}
		/>
		<SelectInput
			title="Data Size"
			items={reportItemSizeDropdowns}
			bind:value={$form.numberSize}
			name="numberSize"
			errorMessage={$errors.numberSize}
		/>
		<CheckboxInput
			title="Vertical Display"
			bind:value={$form.numberVertical}
			name="numberVertical"
			errorMessage={$errors.numberVertical}
		/>
	{/if}

	<ActionButton type="submit" {loading} message="Update" loadingMessage="Updating Config..." />

	<Heading tag="h4">Display</Heading>
</form>
