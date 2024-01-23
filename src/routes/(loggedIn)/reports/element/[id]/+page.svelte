<script lang="ts">
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import type { UpdateReportElementSupertype } from '$lib/schema/reportSchema.js';
	import { Button, Heading, P } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import FilterModal from '$lib/components/FilterModal.svelte';
	import { enhance } from '$app/forms';
	import { customEnhance } from './customEnhance.js';

	export let data;

	let filterOpen = false;

	const { form, constraints, errors } = superForm<UpdateReportElementSupertype>(data.form);
</script>

<CustomHeader pageTitle={data.elementData.title || 'Report Element'} />

<PageLayout title={data.elementData.title || 'Report Element'} size="lg">
	<Heading tag="h4">Report Information</Heading>
	<div class="flex flex-row gap-2">
		<P weight="bold">Title :</P>
		<P>{data.elementData.report.title}</P>
	</div>
	<Heading tag="h4">Report Element Configuration</Heading>

	<div class="flex flex-row items-end gap-2">
		<TextInput
			title="Title"
			errorMessage={$errors.title}
			name="title"
			bind:value={$form.title}
			{...$constraints.title}
			wrapperClass="flex flex-grow"
		/>
		<Button
			on:click={() => {
				$form.title = undefined;
				$form.clearTitle = true;
			}}
		>
			Clear
		</Button>
	</div>

	{#if data.elementData.filter}
		<div class="flex flex-row items-center gap-2">
			<FilterModal
				currentFilter={data.elementData.filter.filter}
				bind:opened={filterOpen}
				accountDropdown={data.dropdowns.account}
				billDropdown={data.dropdowns.bill}
				budgetDropdown={data.dropdowns.budget}
				tagDropdown={data.dropdowns.tag}
				categoryDropdown={data.dropdowns.category}
				labelDropdown={data.dropdowns.label}
			>
				<svelte:fragment slot="footerContents" let:activeFilter>
					<Button on:click={() => (filterOpen = false)} outline>Cancel</Button>
					<div class="flex-grow"></div>
					<form
						action="?/updateFilter"
						method="POST"
						use:enhance={customEnhance({
							onSuccess: ({ data }) => {
								console.log('Success : ', data);
								filterOpen = false;
							}
						})}
					>
						<input type="hidden" name="filterText" value={JSON.stringify(activeFilter)} />
						<Button type="submit">Update Filter</Button>
					</form>
				</svelte:fragment>
			</FilterModal>
			<P>Filter : {data.elementData.filter.filterText}</P>
		</div>
	{/if}
	{#if !data.elementData.filter}
		<form action="?/addFilter" method="POST" use:enhance>
			<Button type="submit">Add Filter</Button>
		</form>
	{/if}

	<pre>
        {JSON.stringify(data.elementData, null, 2)}
    </pre>
	<pre>
        {JSON.stringify(data.form, null, 2)}
    </pre>
</PageLayout>
