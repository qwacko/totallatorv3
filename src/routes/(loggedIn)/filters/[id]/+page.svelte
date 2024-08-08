<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { reusableFilterModifcationTypeItems } from '$lib/schema/reusableFilterSchema';
	import BooleanFilterButtons from '$lib/components/filters/BooleanFilterButtons.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import UpdateReusableFilterChanges from './UpdateReusableFilterChanges.svelte';
	import UpdateReusableFilterFilter from './UpdateReusableFilterFilter.svelte';
	import ApplyFilterIcon from '$lib/components/icons/ApplyFilterIcon.svelte';
	import { urlGenerator } from '$lib/routes';

	const {data} = $props();

	onNavigate(() => {
		changeModal = false;
		filterModal = false;
	});

	const form = $derived(superForm(data.form, {
		onResult: () => {
			changeModal = false;
			filterModal = false;
		}
	}));

	let changeModal = $state(false);
	let filterModal = $state(false);

	const enhance = $derived(form.enhance);
	const formData = $derived(form.form);
	const formErrors = $derived(form.errors);
	const updateTitle = $derived((newTitle: string) => {
		$formData.title = newTitle;
	});
</script>

<CustomHeader pageTitle="Update Reusable Filter" />

<PageLayout title="Update Reusable Filter" size="lg" routeBasedBack>
	{#snippet slotRight()}
		<Button
			outline
			color="blue"
			href={urlGenerator({ address: '/(loggedIn)/filters/[id]/apply', paramsValue: {id:data.id} }).url}
			disabled={(data.numberResults === 0 )|| (!$formData.applyAutomatically && !$formData.applyFollowingImport)}
		>
			<ApplyFilterIcon />
		</Button>
	{/snippet}
	<RawDataModal {data} dev={data.dev} />
	<form use:enhance method="POST" action="?/update" class="flex flex-col gap-4">
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<PreviousUrlInput name="prevPage" routeBased />
			<input type="hidden" name="id" value={$formData.id} />

			<div class="col-span-1 flex flex-row gap-2 md:col-span-2">
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
					class="self-end whitespace-nowrap"
					disabled={$formData.title === data.filterText.join(' and ')}
					outline
				>
					Reset
				</Button>
			</div>
			<div class="col-span-1 flex flex-row gap-2 md:col-span-2">
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

		<Button type="submit">Save</Button>
	</form>
	<div class="flex flex-row gap-2">
		<UpdateReusableFilterFilter
			id={data.id}
			filter={data.filter.filter}
			filterText={data.filterText}
			numberResults={data.numberResults}
			bind:filterModal
		/>
		{#if $formData.applyAutomatically || $formData.applyFollowingImport}
			<UpdateReusableFilterChanges
				modificationFormData={data.modificationForm}
				id={data.id}
				changeText={data.changeText}
				bind:changeModal
			/>
		{/if}
	</div>
</PageLayout>
