<script lang="ts">
	import { Heading } from 'flowbite-svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';

	import type { UpdateReportConfigurationType } from '@totallator/shared';
	import { reportElementLayoutDropdown } from '@totallator/shared';

	import ActionButton from '$lib/components/ActionButton.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import { urlGenerator } from '$lib/routes';
	import { superFormNotificationHelper } from '$lib/stores/notificationHelpers';

	import TextInput from '../TextInput.svelte';

	const {
		formData,
		reusable,
		elementId
	}: {
		formData: SuperValidated<UpdateReportConfigurationType>;
		reusable: boolean;
		elementId: string;
	} = $props();

	let loading = $state(false);

	const configForm = superForm(formData, {
		timeoutMs: 500,
		...superFormNotificationHelper({
			setLoading: (value) => (loading = value),
			successMessage: 'Report Element Config Updated Successfully',
			errorMessage: 'Error Updating Report Element Config',
			invalidate: true
		})
	});

	const form = $derived(configForm.form);
	const enhance = $derived(configForm.enhance);
	const errors = $derived(configForm.errors);

	let formItem: HTMLFormElement;
</script>

<form
	bind:this={formItem}
	method="post"
	action="{urlGenerator({
		address: '/(loggedIn)/reports/element/[id]',
		paramsValue: { id: elementId }
	}).url}?/updateConfig"
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
		onchange={() => {
			formItem.requestSubmit();
		}}
		disabled={loading}
	/>

	<ActionButton type="submit" {loading} message="Update" loadingMessage="Updating Config..." />
</form>

<Heading tag="h4">Display</Heading>
