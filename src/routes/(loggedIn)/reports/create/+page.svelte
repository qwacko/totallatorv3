<script lang="ts">
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import { page } from '$app/stores';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import { pageInfo } from '$lib/routes';
	import ReportLayoutOptionDisplay from './ReportLayoutOptionDisplay.svelte';
	import ComboSelectForm from '$lib/components/ComboSelectForm.svelte';
	import {
		getNextReportLayoutOption,
		reportLayoutDropdownOptions,
		getPreviousReportLayoutOption
	} from './reportLayoutOptions';
	import ArrowLeftIcon from '$lib/components/icons/ArrowLeftIcon.svelte';
	import ArrowRightIcon from '$lib/components/icons/ArrowRightIcon.svelte';
	import ActionButton from '$lib/components/ActionButton.svelte';

	const { data } = $props();

	const formAll = superForm(data.form, {
		onSubmit: () => (loading = true),
		onResult: () => (loading = false)
	});

	const form = $derived(formAll.form);
	const errors = $derived(formAll.errors);
	const constraints = $derived(formAll.constraints);
	const message = $derived(formAll.message);
	const enhance = $derived(formAll.enhance);

	const urlInfo = $derived(pageInfo('/(loggedIn)/reports/create', $page));

	let loading = $state(false);
</script>

<CustomHeader pageTitle="New Report" />

<PageLayout title="Create Report" size="sm">
	<form method="POST" use:enhance class="flex flex-col gap-2">
		<PreviousUrlInput name="prevPage" />
		<input type="hidden" name="currentPage" value={urlInfo.current.url} />
		<TextInput
			title="Title"
			errorMessage={$errors.title}
			name="title"
			bind:value={$form.title}
			{...$constraints.title}
		/>
		<TextInput
			title="Group"
			errorMessage={$errors.group}
			name="group"
			bind:value={$form.group}
			{...$constraints.group}
		/>
		<ComboSelectForm
			form={formAll}
			field="layout"
			items={reportLayoutDropdownOptions}
			title="Layout"
			itemToDisplay={(item) => ({ title: item.title })}
			itemToOption={(item) => ({ value: item.id, label: item.title })}
		/>

		{#if $form.layout}
			<div class="flex flex-col gap-2">
				<div class="flex flex-row gap-2 self-stretch">
					<Button
						on:click={() => {
							$form.layout = getPreviousReportLayoutOption($form.layout);
						}}
						class="flex grow basis-0 gap-2"
						color="primary"
						outline
					>
						<ArrowLeftIcon />Prev
					</Button>
					<Button
						on:click={() => {
							$form.layout = getNextReportLayoutOption($form.layout);
						}}
						class="flex grow basis-0 gap-2"
						color="primary"
						outline
					>
						Next<ArrowRightIcon />
					</Button>
				</div>
				<ReportLayoutOptionDisplay format={$form.layout} />
			</div>
		{/if}
		<ActionButton
			{loading}
			message="Create"
			loadingMessage="Creating..."
			class="flex grow"
			type="submit"
		/>
		<ErrorText message={$message} />
	</form>
</PageLayout>
