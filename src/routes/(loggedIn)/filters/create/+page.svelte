<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import FilterModal from '$lib/components/FilterModal.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import { pageInfo, urlGenerator } from '$lib/routes.js';
	import {
		defaultJournalFilter,
		type UpdateJournalSchemaSuperType
	} from '$lib/schema/journalSchema.js';
	import { Button, Modal, P } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import UpdateJournalForm from '../../journals/clone/UpdateJournalForm.svelte';
	import UpdateJournalLinksForm from '../../journals/clone/UpdateJournalLinksForm.svelte';
	import UpdateJournalLabelsForm from '../../journals/clone/UpdateJournalLabelsForm.svelte';
	import {
		reusableFilterFrequencyEnumItems,
		type CreateReusableFilterFormSuperSchema,
		reusableFilterModifcationTypeItems
	} from '$lib/schema/reusableFilterSchema';
	import TextInputForm from '$lib/components/TextInputForm.svelte';
	import BooleanFilterButtons from '$lib/components/filters/BooleanFilterButtons.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';

	export let data;

	$: urlInfo = pageInfo('/(loggedIn)/filters/create', $page);

	onNavigate(() => {
		changeModal = false;
		filterModal = false;
	});

	$: form = superForm<CreateReusableFilterFormSuperSchema>(data.form, { taintedMessage: null });

	$: modificationForm = superForm<UpdateJournalSchemaSuperType>(data.modificationForm, {
		taintedMessage: null
	});

	let changeModal = false;
	let filterModal = false;

	$: modificationFormValue = modificationForm.form;
	$: enhance = form.enhance;
	$: formData = form.form;
</script>

<CustomHeader pageTitle="Create Reusable Filter" />

<PageLayout title="Create Reusable Filter" size="lg">
	<RawDataModal {data} dev={data.dev} />
	<form use:enhance method="POST" class="flex flex-col gap-4">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			{#if data.searchParams}
				<input type="hidden" name="filter" value={JSON.stringify(data.searchParams.filter)} />
				{#if data.searchParams.change}
					<input type="hidden" name="change" value={JSON.stringify(data.searchParams.change)} />
				{/if}
			{/if}
			<TextInputForm
				{form}
				field="title"
				title="Title"
				outerWrapperClass="col-span-1 md:col-span-2"
			/>
			<BooleanFilterButtons
				bind:value={$formData.listed}
				title="In Journal Filter Dropdown"
				onTitle="Yes"
				offTitle="No"
				name="listed"
				hideClear
			/>
			{#if $formData.listed}
				<SelectInput
					name="modificationType"
					errorMessage=""
					title="Dropdown Modification Type"
					bind:value={$formData.modificationType}
					required={true}
					items={reusableFilterModifcationTypeItems}
				/>
			{/if}
			<BooleanFilterButtons
				bind:value={$formData.applyAutomatically}
				title="Apply Automatically"
				onTitle="Yes"
				offTitle="No"
				name="applyAutomatically"
				hideClear
			/>
			{#if $formData.applyAutomatically}
				<SelectInput
					name="automaticFrequency"
					errorMessage=""
					title="Automatic Frequency"
					bind:value={$formData.automaticFrequency}
					required={true}
					items={reusableFilterFrequencyEnumItems}
				/>
				<BooleanFilterButtons
					bind:value={$formData.applyFollowingImport}
					title="Apply Following Import"
					onTitle="Yes"
					offTitle="No"
					name="applyFollowingImport"
					hideClear
				/>
			{/if}
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div class="flex flex-col gap-2">
				<P class="self-center" weight="semibold">Filter</P>
				<div class="flex flex-row gap-6 items-center self-center">
					<div class="flex flex-col gap-1">
						<FilterModal
							currentFilter={data.searchParams?.filter || defaultJournalFilter()}
							accountDropdown={data.dropdowns.accounts}
							billDropdown={data.dropdowns.bills}
							categoryDropdown={data.dropdowns.categories}
							budgetDropdown={data.dropdowns.budgets}
							tagDropdown={data.dropdowns.tags}
							labelDropdown={data.dropdowns.labels}
							urlFromFilter={(filter) =>
								urlGenerator({
									address: '/(loggedIn)/filters/create',
									searchParamsValue: {
										filter,
										...($formData.applyAutomatically !== undefined
											? { applyAutomatically: $formData.applyAutomatically }
											: {}),
										...($formData.applyFollowingImport !== undefined
											? { applyFollowingImport: $formData.applyFollowingImport }
											: {}),
										...($formData.automaticFrequency
											? { automaticFrequency: $formData.automaticFrequency }
											: {}),
										...($formData.modificationType
											? { modificationType: $formData.modificationType }
											: {}),
										...($formData.listed !== undefined ? { listed: $formData.listed } : {}),
										...($formData.title ? { title: $formData.title } : {}),
										...(urlInfo.current.searchParams?.change
											? { change: urlInfo.current.searchParams.change }
											: {})
									}
								}).url}
							bind:opened={filterModal}
						/>
						<Button
							href={urlGenerator({
								address: '/(loggedIn)/journals',
								searchParamsValue: data.searchParams?.filter || defaultJournalFilter()
							}).url}
							color="blue"
							outline
							size="sm"
						>
							<JournalEntryIcon />
						</Button>
					</div>
					<div class="flex flex-col gap-1">
						{#each data.filterText as currentFilterText}
							<div class="flex">{currentFilterText}</div>
						{/each}
						<div class="flex text-gray-400">{data.numberResults} matching journals</div>
					</div>
				</div>
			</div>

			{#if $formData.applyAutomatically}
				<div class="flex flex-col gap-2">
					<P class="self-center" weight="semibold">Changes</P>
					<div class="flex flex-row gap-6 items-center self-center">
						<div class="flex flex-col gap-1">
							<Button color="light" outline on:click={() => (changeModal = true)}>Changes</Button>
							{#if changeModal}
								<Modal bind:open={changeModal} autoclose>
									<UpdateJournalForm form={modificationForm} />
									<UpdateJournalLinksForm form={modificationForm} dropdownInfo={data.dropdowns} />
									<UpdateJournalLabelsForm
										form={modificationForm}
										dropdownInfo={data.dropdowns}
										allLabelIds={[]}
										commonLabelIds={[]}
									/>
									<div class="flex">
										<pre>{JSON.stringify($modificationFormValue, null, 2)}</pre>
									</div>
									<svelte:fragment slot="footer">
										<Button on:click={() => (changeModal = false)} outline>Cancel</Button>
										<div class="flex-grow"></div>
										<Button
											href={urlInfo.updateParams({
												searchParams: { change: $modificationFormValue }
											}).url}
										>
											Update
										</Button>
									</svelte:fragment>
								</Modal>
							{/if}
						</div>
						<div class="flex flex-col gap-1">
							{#if data.changeText}
								{#each data.changeText as currentChangeText}
									<div class="flex">
										{currentChangeText}
									</div>
								{/each}
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>
		<Button type="submit">Save</Button>
	</form>
</PageLayout>
