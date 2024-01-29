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
	import { notificationStore } from '$lib/stores/notificationStore.js';
	import { onError, onSuccess } from '$lib/stores/notificationHelpers.js';
	import ArrowLeftIcon from '$lib/components/icons/ArrowLeftIcon.svelte';
	import { urlGenerator } from '$lib/routes.js';
	import ReportElementConfigForm from '$lib/components/report/ReportElementConfigForm.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import ReportGridWrapper from '$lib/components/report/ReportGridWrapper.svelte';
	import ReportGridItem from '$lib/components/report/ReportGridItem.svelte';
	import ReportElementContents from '$lib/components/report/ReportElementContents.svelte';

	export let data;

	let filterOpen = false;

	const {
		form,
		constraints,
		errors,
		enhance: elementEnhance
	} = superForm<UpdateReportElementSupertype>(data.form, {
		onError: onError('Error updating report element'),
		onResult: ({ result }) => {
			if (result.type === 'success') {
				notificationStore.send({
					type: 'success',
					message: 'Report element updated successfully',
					duration: 2000
				});
			}
		}
	});

	let configType = data.elementData.reportElementConfig.configuration?.type;
	$: if (configType !== data.elementData.reportElementConfig.configuration?.type)
		console.log('Config Type Changed', configType);
</script>

<CustomHeader pageTitle={data.elementData.title || 'Report Element'} />

<PageLayout title={data.elementData.title || 'Report Element'} size="lg">
	<svelte:fragment slot="left">
		<Button
			outline
			href={urlGenerator({
				address: '/(loggedIn)/reports/[id]',
				paramsValue: { id: data.elementData.reportId }
			}).url}
		>
			<ArrowLeftIcon />
		</Button>
	</svelte:fragment>
	<Heading tag="h4">Report Information</Heading>
	<RawDataModal data={data.elementData} dev={data.dev} />
	<div class="flex flex-row gap-2">
		<P weight="bold">Title :</P>
		<P>{data.elementData.report.title}</P>
	</div>
	<Heading tag="h4">Report Element</Heading>

	<form action="?/update" method="POST" class="flex flex-row items-end gap-2" use:elementEnhance>
		<input type="hidden" name="id" value={data.elementData.id} />
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
		<Button type="submit">Update</Button>
	</form>

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
							onSuccess: () => {
								filterOpen = false;
								notificationStore.send({
									type: 'success',
									message: 'Filter updated successfully',
									duration: 2000
								});
							},
							onError: onError('Error updating filter'),
							onFailure: onError('Error updating filter')
						})}
					>
						<input type="hidden" name="filterText" value={JSON.stringify(activeFilter)} />
						<Button type="submit">Update Filter</Button>
					</form>
				</svelte:fragment>
			</FilterModal>
			<form
				action="?/removeFilter"
				method="POST"
				use:enhance={customEnhance({
					onSuccess: onSuccess('Filter removed successfully'),
					onError: onError('Error removing filter'),
					onFailure: onError('Error removing filter')
				})}
			>
				<Button type="submit" color="red" size="sm" outline>Remove Filter</Button>
			</form>
			<P>Filter : {data.elementData.filter.filterText}</P>
		</div>
	{/if}
	{#if !data.elementData.filter}
		<form
			action="?/addFilter"
			method="POST"
			use:enhance={customEnhance({
				onSuccess: onSuccess('Filter added successfully'),
				onError: onError('Error adding filter'),
				onFailure: onError('Error adding filter')
			})}
		>
			<Button type="submit">Add Filter</Button>
		</form>
	{/if}

	<ReportElementConfigForm formData={data.configForm} />

	<ReportGridWrapper size="xl">
		<ReportGridItem cols={6} rows={1} highlightOnHover={false} title={data.elementData.title}>
			<ReportElementContents data={data.elementConfigWithData.data} editing={false} />
		</ReportGridItem>
	</ReportGridWrapper>
</PageLayout>
