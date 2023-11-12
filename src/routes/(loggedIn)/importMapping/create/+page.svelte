<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import TextInputForm from '$lib/components/TextInputForm.svelte';
	import {
		type ImportMappingDetailSuperSchema,
		type ImportMappingCreateFormSuperSchema,
		importMappingDetailWithRefinementSchema
	} from '$lib/schema/importMappingSchema.js';
	import { Alert, Button, Heading, TabItem, Tabs } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import DisplaySampleMappedData from './DisplaySampleMappedData.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import ComboSelectForm from '$lib/components/ComboSelectForm.svelte';

	export let data;

	const form = superForm<ImportMappingCreateFormSuperSchema>(data.form);
	const detailForm = superForm<ImportMappingDetailSuperSchema>(data.detailForm, {
		//@ts-expect-error Doesn't work with refinement
		validators: importMappingDetailWithRefinementSchema,
		validationMethod: 'oninput'
	});

	let formElement: HTMLFormElement;

	$: formEnhance = form.enhance;
	$: formMessage = form.message;
	$: formErrors = form.errors;

	$: detailFormData = detailForm.form;
</script>

<PageLayout title="Create Import Mapping">
	<RawDataModal {data} dev={data.dev} />
	<form bind:this={formElement} use:formEnhance method="post" class="flex flex-col gap-4">
		<TextInputForm {form} title="Title" field="title" />
		<input type="hidden" name="configuration" value={JSON.stringify($detailFormData)} />
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
			<TabItem title="Unique ID" class="flex flex-col gap-4">
				<TextInputForm
					form={detailForm}
					title="Unique ID"
					field="uniqueId"
					placeholder="Unique ID Mapping"
				/>
			</TabItem>
			<TabItem title="Transaction Info" open>
				<div class="flex flex-col gap-4 items-stretch">
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
				<div class="flex flex-col gap-4 items-stretch">
					<ComboSelectForm
						form={detailForm}
						title="From Account"
						field="fromAccountId"
						placeholder="From Account"
						items={data.dropdowns.account}
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
						items={data.dropdowns.account}
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
				<div class="flex flex-col gap-4 items-stretch">
					<ComboSelectForm
						form={detailForm}
						title="Category"
						field="categoryId"
						placeholder="Category"
						items={data.dropdowns.category}
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
				<div class="flex flex-col gap-4 items-stretch">
					<ComboSelectForm
						form={detailForm}
						title="Tag"
						field="tagId"
						placeholder="Tag"
						items={data.dropdowns.tag}
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
				<div class="flex flex-col gap-4 items-stretch">
					<ComboSelectForm
						form={detailForm}
						title="Bill"
						field="billId"
						placeholder="Bill"
						items={data.dropdowns.bill}
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
				<div class="flex flex-col gap-4 items-stretch">
					<ComboSelectForm
						form={detailForm}
						title="Budget"
						field="budgetId"
						placeholder="Budget"
						items={data.dropdowns.budget}
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
		</Tabs>
	</div>
	<Button on:click={() => formElement.requestSubmit()}>Create Mapping</Button>
	<Heading tag="h3">Test Import Mapping</Heading>
	<DisplaySampleMappedData mappingConfig={$detailFormData} />
</PageLayout>
