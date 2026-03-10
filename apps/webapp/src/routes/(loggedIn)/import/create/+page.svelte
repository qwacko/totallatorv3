<script lang="ts">
	import { Fileupload } from 'flowbite-svelte';
	import type { FormEventHandler } from 'svelte/elements';
	import { superForm } from 'sveltekit-superforms';

	import { importTypeEnum, importTypeToTitle } from '@totallator/shared';

	import ActionButton from '$lib/components/ActionButton.svelte';
	import BooleanInputForm from '$lib/components/BooleanInputForm.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import LabelWrapper from '$lib/components/LabelWrapper.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import { superFormNotificationHelper } from '$lib/stores/notificationHelpers';

	const { data } = $props();

	const form = $derived(
		superForm(data.form, {
			...superFormNotificationHelper({
				setLoading: (newLoading) => (importing = newLoading),
				errorMessage: 'Error Creating Import',
				successMessage: 'Import Created Successfully',
				invalidate: true
			})
		})
	);
	const formData = $derived(form.form);
	const enhance = $derived(form.enhance);
	const errors = $derived(form.errors);

	const updateFile: FormEventHandler<HTMLInputElement> = (e) => {
		if ((e?.currentTarget as HTMLInputElement)?.files) {
			$formData.file = (e?.currentTarget as HTMLInputElement)?.files?.item(0) as File;
		}
	};

	let importing = $state(false);
	let redirecting = $state(false);

	const isMappedImport = $derived($formData.importType === 'mappedImport');
	const isTransactionImport = $derived($formData.importType === 'transaction');

	const importTemplateMap: Record<string, { href: string; filename: string }> = {
		transaction: {
			href: '/import-templates/transaction.csv',
			filename: 'transaction-import-template.csv'
		},
		journalUpdate: {
			href: '/import-templates/journalUpdate.csv',
			filename: 'journal-update-import-template.csv'
		},
		account: {
			href: '/import-templates/account.csv',
			filename: 'account-import-template.csv'
		},
		bill: {
			href: '/import-templates/bill.csv',
			filename: 'bill-import-template.csv'
		},
		budget: {
			href: '/import-templates/budget.csv',
			filename: 'budget-import-template.csv'
		},
		category: {
			href: '/import-templates/category.csv',
			filename: 'category-import-template.csv'
		},
		tag: {
			href: '/import-templates/tag.csv',
			filename: 'tag-import-template.csv'
		},
		label: {
			href: '/import-templates/label.csv',
			filename: 'label-import-template.csv'
		},
		mappedImport: {
			href: '/import-templates/mappedImport.json',
			filename: 'mapped-import-template.json'
		}
	};
	const selectedImportTemplate = $derived(
		importTemplateMap[$formData.importType ?? 'mappedImport']
	);
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
			items={importTypeEnum.map((t) => ({
				name: importTypeToTitle(t, true),
				value: t
			}))}
			placeholder="Select Import Type..."
			title="Import Type"
			required
			bind:value={$formData.importType}
			errorMessage={$errors.importType}
		/>

		{#if selectedImportTemplate}
			<div
				class="rounded border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/30"
			>
				<div class="font-medium">Need a starter file?</div>
				<a
					href={selectedImportTemplate.href}
					download={selectedImportTemplate.filename}
					class="text-blue-700 underline hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
				>
					Download {importTypeToTitle($formData.importType, true)} template
				</a>

				<div class="mt-2 text-xs text-blue-900/90 dark:text-blue-200/90">
					Templates include example headers. For account/category/tag/label imports, providing an
					<code>id</code>
					 updates an existing row; leaving it blank creates a new row.
				</div>
			</div>
		{/if}

		{#if $formData.importType === 'journalUpdate'}
			<div
				class="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
			>
				Journal update imports are applied by journal <code>id</code>
				 and can affect linked entries in the same transaction based on update rules.
			</div>
		{/if}
		{#if isMappedImport}
			<SelectInput
				errorMessage={$errors.importMappingId}
				bind:value={$formData.importMappingId}
				name="importMappingId"
				title="Import Mapping"
				items={data.importMappingDropdown.map((t) => ({
					name: t.title,
					value: t.id
				}))}
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
			<Fileupload name="file" accept=".csv,.json,.data" required oninput={updateFile} />
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
