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
		reusableFilterModifcationTypeItems,
		type UpdateReusableFilterFormSuperSchema
	} from '$lib/schema/reusableFilterSchema';
	import BooleanFilterButtons from '$lib/components/filters/BooleanFilterButtons.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';

	export let data;

	$: urlInfo = pageInfo('/(loggedIn)/filters/[id]', $page);

	onNavigate(() => {
		changeModal = false;
		filterModal = false;
	});

	$: form = superForm<UpdateReusableFilterFormSuperSchema>(data.form, { taintedMessage: null });

	$: modificationForm = superForm<UpdateJournalSchemaSuperType>(data.modificationForm, {
		taintedMessage: null
	});

	let changeModal = false;
	let filterModal = false;

	$: modificationFormValue = modificationForm.form;
	$: enhance = form.enhance;
	$: formData = form.form;
	$: formErrors = form.errors;
	$: updateTitle = (newTitle: string) => {
		$formData.title = newTitle;
	};
</script>

<CustomHeader pageTitle="Update Reusable Filter" />

<PageLayout title="Update Reusable Filter" size="lg" routeBasedBack>
	<RawDataModal {data} dev={data.dev} />
	<form use:enhance method="POST" class="flex flex-col gap-4">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<PreviousUrlInput name="prevPage" routeBased />
			<input type="hidden" name="filter" value={$formData.filter} />
			{#if $formData.change}<input type="hidden" name="change" value={$formData.change} />{/if}
			<input type="hidden" name="id" value={$formData.id} />

			<div class="flex col-span-1 md:col-span-2 flex-row gap-2">
				<div class="flex-grow">
					<TextInput
						name="title"
						bind:value={$formData.title}
						errorMessage={$formErrors.title}
						title="Title"
						required={true}
					/>
				</div>

				<Button
					on:click={() => {
						const newTitle = data.filterText.join(' and ');
						updateTitle(newTitle);
					}}
					class="whitespace-nowrap self-end"
					disabled={$formData.title === data.filterText.join(' and ')}
					outline
				>
					Reset
				</Button>
			</div>
			<div class="flex col-span-1 md:col-span-2 flex-row gap-2">
				<div class="flex-grow">
					<TextInput
						name="group"
						bind:value={$formData.group}
						errorMessage={$formErrors.group}
						title="Group"
					/>
				</div>
			</div>
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
				title="Automatically Apply Related Change"
				onTitle="Yes"
				offTitle="No"
				name="applyAutomatically"
				hideClear
			/>
			<BooleanFilterButtons
				bind:value={$formData.applyFollowingImport}
				title="Apply Change Following Import"
				onTitle="Yes"
				offTitle="No"
				name="applyFollowingImport"
				hideClear
			/>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div class="flex flex-col gap-2">
				<P class="self-center" weight="semibold">Filter</P>
				<div class="flex flex-row gap-6 items-center self-center">
					<div class="flex flex-col gap-1">
						<FilterModal
							currentFilter={data.filter.filter || defaultJournalFilter()}
							accountDropdown={data.dropdowns.account}
							billDropdown={data.dropdowns.bill}
							categoryDropdown={data.dropdowns.category}
							budgetDropdown={data.dropdowns.budget}
							tagDropdown={data.dropdowns.tag}
							labelDropdown={data.dropdowns.label}
							urlFromFilter={(filter) =>
								urlGenerator({
									address: '/(loggedIn)/filters/[id]',
									paramsValue: { id: data.id },
									searchParamsValue: {
										filter,
										...($formData.applyAutomatically !== undefined
											? { applyAutomatically: $formData.applyAutomatically }
											: {}),
										...($formData.applyFollowingImport !== undefined
											? { applyFollowingImport: $formData.applyFollowingImport }
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

			<div class="flex flex-col gap-2">
				<P class="self-center" weight="semibold">Related Change</P>
				<div class="flex flex-row gap-6 items-center self-center">
					<div class="flex flex-col gap-1">
						<Button color="light" outline on:click={() => (changeModal = true)}>Changes</Button>
						{#if changeModal}
							<Modal bind:open={changeModal}>
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
											searchParams: {
												change: $modificationFormValue,
												...($formData.applyAutomatically !== undefined
													? { applyAutomatically: $formData.applyAutomatically }
													: {}),
												...($formData.applyFollowingImport !== undefined
													? { applyFollowingImport: $formData.applyFollowingImport }
													: {}),
												...($formData.modificationType
													? { modificationType: $formData.modificationType }
													: {}),
												...($formData.listed !== undefined ? { listed: $formData.listed } : {}),
												...($formData.title ? { title: $formData.title } : {})
											}
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
		</div>
		<Button type="submit">Save</Button>
	</form>
</PageLayout>
