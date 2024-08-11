<script lang="ts">
	import TextInputForm from '$lib/components/TextInputForm.svelte';
	import type {
		ImportMappingCreateFormSchema,
		ImportMappingDetailSchema
	} from '$lib/schema/importMappingSchema.js';
	import { Alert, Button, Heading, NumberInput, P, TabItem, Tabs } from 'flowbite-svelte';
	import type { SuperForm } from 'sveltekit-superforms';
	import DisplaySampleMappedData from './DisplaySampleMappedData.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import ComboSelectForm from '$lib/components/ComboSelectForm.svelte';
	import {
		accountDropdownData,
		tagDropdownData,
		billDropdownData,
		budgetDropdownData,
		categoryDropdownData
	} from '$lib/stores/dropdownStores.svelte.js';

	let {
		form,
		detailForm,
		submitButtonText,
		csvData = $bindable()
	}: {
		form: SuperForm<ImportMappingCreateFormSchema>;
		detailForm: SuperForm<ImportMappingDetailSchema>;
		submitButtonText: string;
		csvData?: Record<string, unknown>[];
	} = $props();

	let formElement: HTMLFormElement;

	const formEnhance = form.enhance;
	const formMessage = form.message;
	const formErrors = form.errors;

	const detailFormData = detailForm.form;
</script>

<form bind:this={formElement} use:formEnhance method="post" class="flex flex-col gap-4">
	<TextInputForm {form} title="Title" field="title" />
	<input type="hidden" name="configuration" value={JSON.stringify($detailFormData)} />
	{#if csvData}
		<input type="hidden" name="sampleData" value={JSON.stringify(csvData.slice(0, 5))} />
	{/if}
	<PreviousUrlInput name="prevPage" />
</form>
{#if $formMessage}}
	<Alert color="red">{$formMessage}</Alert>
{/if}
{#if $formErrors.configuration}
	<Alert color="red">{$formErrors.configuration}</Alert>
{/if}
<Heading tag="h3">Detail</Heading>
<div>
	<Tabs>
		<TabItem title="Skip Rows" class="flex flex-col gap-4">
			<NumberInput bind:value={$detailFormData.rowsToSkip} />
		</TabItem>
		<TabItem title="Unique ID" class="flex flex-col gap-4">
			<TextInputForm
				form={detailForm}
				title="Unique ID"
				field="uniqueId"
				placeholder="Unique ID Mapping"
			/>
		</TabItem>
		<TabItem title="Transaction Info" open>
			<div class="flex flex-col items-stretch gap-4">
				<TextInputForm form={detailForm} title="Date" field="date" placeholder="Date Mapping" />
				<TextInputForm
					form={detailForm}
					title="Description"
					field="description"
					placeholder="Description Mapping"
				/>
				<TextInputForm
					form={detailForm}
					title="Amount"
					field="amount"
					placeholder="Amount Mapping"
				/>
			</div>
		</TabItem>
		<TabItem title="Account Info">
			<div class="flex flex-col items-stretch gap-4">
				<ComboSelectForm
					form={detailForm}
					title="From Account"
					field="fromAccountId"
					placeholder="From Account"
					items={accountDropdownData.value}
					itemToDisplay={(item) => ({ title: item.title, group: item.group })}
					itemToOption={(item) => ({
						label: item.title,
						value: item.id,
						group: item.group,
						disabled: !item.enabled
					})}
					clearable
				/>
				<TextInputForm
					form={detailForm}
					title="From Account Title"
					field="fromAccountTitle"
					placeholder="From Account Title Mapping"
				/>
				<ComboSelectForm
					form={detailForm}
					title="To Account"
					field="toAccountId"
					placeholder="To Account"
					items={accountDropdownData.value}
					itemToDisplay={(item) => ({ title: item.title, group: item.group })}
					itemToOption={(item) => ({
						label: item.title,
						value: item.id,
						group: item.group,
						disabled: !item.enabled
					})}
					clearable
				/>
				<TextInputForm
					form={detailForm}
					title="To Account Title"
					field="toAccountTitle"
					placeholder="To Account Title Mapping"
				/>
			</div>
		</TabItem>
		<TabItem title="Category">
			<div class="flex flex-col items-stretch gap-4">
				<ComboSelectForm
					form={detailForm}
					title="Category"
					field="categoryId"
					placeholder="Category"
					items={categoryDropdownData.value}
					itemToDisplay={(item) => ({ title: item.title, group: item.group })}
					itemToOption={(item) => ({
						label: item.title,
						value: item.id,
						group: item.group,
						disabled: !item.enabled
					})}
					clearable
				/>
				<TextInputForm
					form={detailForm}
					title="Category Title"
					field="categoryTitle"
					placeholder="Category Title Mapping"
				/>
			</div>
		</TabItem>
		<TabItem title="Tag">
			<div class="flex flex-col items-stretch gap-4">
				<ComboSelectForm
					form={detailForm}
					title="Tag"
					field="tagId"
					placeholder="Tag"
					items={tagDropdownData.value}
					itemToDisplay={(item) => ({ title: item.title, group: item.group })}
					itemToOption={(item) => ({
						label: item.title,
						value: item.id,
						group: item.group,
						disabled: !item.enabled
					})}
					clearable
				/>
				<TextInputForm
					form={detailForm}
					title="Tag Title"
					field="tagTitle"
					placeholder="Tag Title Mapping"
				/>
			</div>
		</TabItem>
		<TabItem title="Bill">
			<div class="flex flex-col items-stretch gap-4">
				<ComboSelectForm
					form={detailForm}
					title="Bill"
					field="billId"
					placeholder="Bill"
					items={billDropdownData.value}
					itemToDisplay={(item) => ({ title: item.title })}
					itemToOption={(item) => ({
						label: item.title,
						value: item.id,
						disabled: !item.enabled
					})}
					clearable
				/>
				<TextInputForm
					form={detailForm}
					title="Bill Title"
					field="billTitle"
					placeholder="Bill Title Mapping"
				/>
			</div>
		</TabItem>
		<TabItem title="Budget">
			<div class="flex flex-col items-stretch gap-4">
				<ComboSelectForm
					form={detailForm}
					title="Budget"
					field="budgetId"
					placeholder="Budget"
					items={budgetDropdownData.value}
					itemToDisplay={(item) => ({ title: item.title })}
					itemToOption={(item) => ({
						label: item.title,
						value: item.id,
						disabled: !item.enabled
					})}
					clearable
				/>
				<TextInputForm
					form={detailForm}
					title="Budget Title"
					field="budgetTitle"
					placeholder="Budget Title Mapping"
				/>
			</div>
		</TabItem>
		<TabItem title="Labels">
			<div class="flex flex-col items-stretch gap-4">
				<TextInputForm
					form={detailForm}
					title="Label Titles"
					field="labelTitles"
					placeholder="Label Titles"
				/>
				<P size="xs">Use Commas to separate multiple labels</P>
			</div>
		</TabItem>
	</Tabs>
</div>
<Button on:click={() => formElement.requestSubmit()}>{submitButtonText}</Button>
<Heading tag="h3">Test Import Mapping</Heading>
<DisplaySampleMappedData mappingConfig={$detailFormData} bind:csvData />
