<script lang="ts">
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { importTypeEnum, importTypeToTitle } from '$lib/schema/importSchema';
	import { Fileupload } from 'flowbite-svelte';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import { superForm } from 'sveltekit-superforms';
	import BooleanInputForm from '$lib/components/BooleanInputForm.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import LabelWrapper from '$lib/components/LabelWrapper.svelte';
	import { superFormNotificationHelper } from '$lib/stores/notificationHelpers';

	const { data } = $props();

	const form = superForm(data.form, {
		...superFormNotificationHelper({
			setLoading: (newLoading) => (importing = newLoading),
			errorMessage: 'Error Creating Import',
			successMessage: 'Import Created Successfully',
			invalidate: true
		})
	});
	const formData = $derived(form.form);
	const enhance = $derived(form.enhance);
	const errors = $derived(form.errors);

	const updateFile = (e: CustomEvent<any>) => {
		if ((e?.currentTarget as HTMLInputElement)?.files) {
			$formData.file = (e?.currentTarget as HTMLInputElement)?.files?.item(0) as File;
		}
	};

	let importing = $state(false);
	let redirecting = $state(false);

	const isMappedImport = $derived($formData.importType === 'mappedImport');
	const isTransactionImport = $derived($formData.importType === 'transaction');
</script>

<CustomHeader pageTitle="New Import" />

<PageLayout title="New Import">
	<form
		use:enhance
		action="?/create"
		method="post"
		enctype="multipart/form-data"
		class="flex flex-col gap-2"
	>
		<input class="flex" name="test" type="hidden" value="test" />
		<SelectInput
			name="importType"
			items={importTypeEnum.map((t) => ({ name: importTypeToTitle(t, true), value: t }))}
			placeholder="Select Import Type..."
			title="Import Type"
			required
			bind:value={$formData.importType}
			errorMessage={$errors.importType}
		/>
		{#if isMappedImport}
			<SelectInput
				errorMessage={$errors.importMappingId}
				bind:value={$formData.importMappingId}
				name="importMappingId"
				title="Import Mapping"
				items={data.importMappingDropdown.map((t) => ({ name: t.title, value: t.id }))}
				placeholder="Select Import Mapping..."
				required
			/>
		{/if}
		{#if isTransactionImport || isMappedImport}
			<BooleanInputForm
				{form}
				field="checkImportedOnly"
				title="Duplicate Checking"
				onTitle="Journals Only"
				offTitle="Imports Only"
			/>
		{/if}
		<LabelWrapper errorMessage={$errors.file} title="File (CSV or JSON)" required>
			<Fileupload name="file" accept=".csv,.json,.data" required on:input={updateFile} />
		</LabelWrapper>
		<BooleanInputForm
			{form}
			field="autoProcess"
			title="Processing"
			onTitle="Automatic"
			offTitle="Manual"
		/>
		<BooleanInputForm
			{form}
			field="autoClean"
			title="Tidy Up"
			onTitle="Automatic"
			offTitle="Manual"
		/>
		<ActionButton
			type="submit"
			loading={importing || redirecting}
			message="Upload"
			loadingMessage={importing ? 'Uploading...' : 'Redirecting...'}
		/>
	</form>
</PageLayout>
