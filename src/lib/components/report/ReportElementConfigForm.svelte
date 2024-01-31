<script lang="ts">
	import ActionButton from '$lib/components/ActionButton.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';

	import { Heading } from 'flowbite-svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms/client';
	import { superFormNotificationHelper } from '$lib/stores/notificationHelpers';
	import type { UpdateReportConfigurationSupertype } from '$lib/schema/reportSchema';
	import { reportElementLayoutDropdown } from '$lib/schema/reportHelpers/reportElementLayoutEnum';
	import TextInput from '../TextInput.svelte';

	export let formData: SuperValidated<UpdateReportConfigurationSupertype>;
	export let reusable: boolean;

	let loading = false;

	const configForm = superForm<UpdateReportConfigurationSupertype>(formData, {
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

	let formItem: HTMLFormElement;
</script>

<form
	bind:this={formItem}
	method="post"
	action="?/updateConfig"
	use:enhance
	class="flex flex-col gap-2"
>
	<Heading tag="h4">Report Element Configuration</Heading>
	{#if reusable}
		<TextInput
			bind:value={$form.title}
			title="Title"
			name="title"
			id="title"
			errorMessage={$errors.title}
		/>
	{/if}
	<SelectInput
		bind:value={$form.layout}
		title="Layout"
		name="layout"
		id="layout"
		errorMessage={$errors.layout}
		items={reportElementLayoutDropdown}
		on:change={() => {
			formItem.requestSubmit();
		}}
	/>

	<!-- <ActionButton type="submit" {loading} message="Update" loadingMessage="Updating Config..." /> -->

	<Heading tag="h4">Display</Heading>
</form>
