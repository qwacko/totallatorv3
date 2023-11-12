<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import TextInputForm from '$lib/components/TextInputForm.svelte';
	import {
		type ImportMappingDetailSuperSchema,
		type ImportMappingCreateFormSuperSchema,
		importMappingDetailWithRefinementSchema
	} from '$lib/schema/importMappingSchema.js';
	import { Heading, TabItem, Tabs } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import DisplaySampleMappedData from './DisplaySampleMappedData.svelte';

	export let data;

	const form = superForm<ImportMappingCreateFormSuperSchema>(data.form);
	const detailForm = superForm<ImportMappingDetailSuperSchema>(data.detailForm, {
		//@ts-expect-error Doesn't work with refinement
		validators: importMappingDetailWithRefinementSchema,
		validationMethod: 'oninput'
	});

	$: formEnhance = form.enhance;
    $: detailFormData = detailForm.form
</script>

<PageLayout title="Create Import Mapping">
	<RawDataModal {data} dev={data.dev} />
	<form use:formEnhance method="post">
		<TextInputForm {form} title="Title" field="title" />
	</form>
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
					<TextInputForm
						form={detailForm}
						title="From Account ID"
						field="fromAccountId"
						placeholder="From Account ID Mapping"
					/>
					<TextInputForm
						form={detailForm}
						title="From Account Title"
						field="fromAccountTitle"
						placeholder="From Account Title Mapping"
					/>
					<TextInputForm
						form={detailForm}
						title="To Account ID"
						field="toAccountId"
						placeholder="To Account ID Mapping"
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
					<TextInputForm
						form={detailForm}
						title="Category ID"
						field="categoryId"
						placeholder="Category ID Mapping"
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
					<TextInputForm
						form={detailForm}
						title="Tag ID"
						field="tagId"
						placeholder="Tag ID Mapping"
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
					<TextInputForm
						form={detailForm}
						title="Bill ID"
						field="billId"
						placeholder="Bill ID Mapping"
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
					<TextInputForm
						form={detailForm}
						title="Budget ID"
						field="budgetId"
						placeholder="Budget ID Mapping"
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
    <DisplaySampleMappedData mappingConfig={$detailFormData} />
</PageLayout>
