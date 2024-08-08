<script lang="ts">
	import ReportElementContents from '$lib/components/report/contents/ReportElementContents.svelte';
	import ReportGridItem from '$lib/components/report/ReportGridItem.svelte';
	import ReportGridWrapper from '$lib/components/report/ReportGridWrapper.svelte';
	import { urlGenerator } from '$lib/routes';
	import { superFormNotificationHelper } from '$lib/stores/notificationHelpers.js';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { reportConfigPartItemGroupingDropdown } from '$lib/schema/reportHelpers/reportConfigPartItemGroupingEnum.js';
	import { reportConfigPartTimeGroupingDropdown } from '$lib/schema/reportHelpers/reportConfigPartTimeGroupingEnum.js';
	import {
		reportConfigPartTypeInfo,
		reportConfigPartTypeDropdown
	} from '$lib/schema/reportHelpers/reportConfigPartTypeEnum.js';
	import { reportConfigPartNumberDisplayDropdown } from '$lib/schema/reportHelpers/reportConfigPartNumberDisplayEnum';
	import { reportConfigPartTrendDisplayDropdown } from '$lib/schema/reportHelpers/reportConfigPartTrendDisplayOptions';
	import BooleanInputForm from '$lib/components/BooleanInputForm.svelte';
	import { reportConfigPartNegativeDisplayDropdown } from '$lib/schema/reportHelpers/reportConfigPartNegativeDisplayEnum';

	const { data } = $props();

	let loading = $state(false);

	const form = superForm(data.itemForm, {
		...superFormNotificationHelper({
			errorMessage: 'Error Updating Report Element Item',
			successMessage: 'Report Element Item Updated Successfully',
			invalidate: true,
			setLoading: (value) => (loading = value)
		})
	});

	const enhance = $derived(form.enhance);
	const errors = $derived(form.errors);
	const formData = $derived(form.form);

	const itemTypeInfo = $derived(reportConfigPartTypeInfo[$formData.type]);
</script>

<ReportGridWrapper size="xl">
	<ReportGridItem cols={6} rows={1} highlightOnHover={false} title={data.elementData.title}>
		<ReportElementContents
			data={data.elementConfigWithData}
			showLayout={true}
			itemLinkGenerator={(itemInfo) => {
				if (itemInfo)
					return urlGenerator({
						address: '/(loggedIn)/reports/element/[id]/[item]',
						paramsValue: {
							id: data.elementData.id,
							item: itemInfo.id
						}
					}).url;

				return undefined;
			}}
			highlightId={data.itemData.id}
		/>
	</ReportGridItem>
</ReportGridWrapper>

<form action="?/update" method="post" use:enhance class="flex flex-col items-stretch gap-2">
	<SelectInput
		bind:value={$formData.type}
		title="Type"
		name="type"
		id="type"
		errorMessage={$errors.type}
		items={reportConfigPartTypeDropdown}
	/>
	{#if itemTypeInfo}
		{#if itemTypeInfo.showNumberDisplay}
			<SelectInput
				bind:value={$formData.numberDisplay}
				title="Display Numbers As"
				name="numberDisplay"
				id="numberDisplay"
				errorMessage={$errors.numberDisplay}
				items={reportConfigPartNumberDisplayDropdown}
			/>
		{/if}

		{#if itemTypeInfo.showStringConfig}
			<TextInput
				bind:value={$formData.stringConfig}
				title="String Config"
				name="stringConfig"
				id="stringConfig"
				errorMessage={$errors.stringConfig}
			/>
		{/if}
		{#if itemTypeInfo.showMathConfig}
			<TextInput
				bind:value={$formData.mathConfig}
				title="Math Config"
				name="mathConfig"
				id="mathConfig"
				errorMessage={$errors.mathConfig}
			/>
		{/if}
		{#if itemTypeInfo.showTimeGrouping}
			<SelectInput
				bind:value={$formData.timeGrouping}
				title="Time Grouping"
				name="timeGrouping"
				id="timeGrouping"
				errorMessage={$errors.timeGrouping}
				items={reportConfigPartTimeGroupingDropdown}
			/>
		{/if}
		{#if itemTypeInfo.showItemGrouping}
			<SelectInput
				bind:value={$formData.itemGrouping}
				title="Item Grouping"
				name="itemGrouping"
				id="itemGrouping"
				errorMessage={$errors.itemGrouping}
				items={reportConfigPartItemGroupingDropdown}
			/>
		{/if}
		{#if itemTypeInfo.showAdditionalGroupings}
			{#if $formData.itemGrouping !== 'none'}
				<SelectInput
					bind:value={$formData.itemGrouping2}
					title="Item Grouping Level 2"
					name="itemGrouping2"
					id="itemGrouping2"
					errorMessage={$errors.itemGrouping2}
					items={reportConfigPartItemGroupingDropdown}
				/>
			{/if}
			{#if $formData.itemGrouping !== 'none' && $formData.itemGrouping2 !== 'none'}
				<SelectInput
					bind:value={$formData.itemGrouping3}
					title="Item Grouping Level 3"
					name="itemGrouping3"
					id="itemGrouping3"
					errorMessage={$errors.itemGrouping3}
					items={reportConfigPartItemGroupingDropdown}
				/>
			{/if}
			{#if $formData.itemGrouping !== 'none' && $formData.itemGrouping2 !== 'none' && $formData.itemGrouping3 !== 'none'}
				<SelectInput
					bind:value={$formData.itemGrouping4}
					title="Item Grouping Level 4"
					name="itemGrouping4"
					id="itemGrouping4"
					errorMessage={$errors.itemGrouping4}
					items={reportConfigPartItemGroupingDropdown}
				/>
			{/if}
		{/if}
		{#if itemTypeInfo.showNegativeDisplay}
			<SelectInput
				bind:value={$formData.negativeDisplay}
				title="Negative Value Display"
				name="negativeDisplay"
				id="negativeDisplay"
				errorMessage={$errors.negativeDisplay}
				items={reportConfigPartNegativeDisplayDropdown}
			/>
		{/if}
		{#if itemTypeInfo.showTrendDisplay}
			<SelectInput
				bind:value={$formData.trendDisplay}
				title="Trend Data To Show"
				name="trendDisplay"
				id="trendDisplay"
				errorMessage={$errors.trendDisplay}
				items={reportConfigPartTrendDisplayDropdown}
			/>
		{/if}
		{#if itemTypeInfo.showIncludeTotal}
			<BooleanInputForm
				{form}
				field="includeTotal"
				title="Include Total"
				onTitle="Yes"
				offTitle="No"
				hideClear
			/>
		{/if}
	{/if}
	<ActionButton type="submit" {loading} message="Update" loadingMessage="Updating..." />
</form>

<pre>{JSON.stringify(data.itemData, null, 2)}</pre>
{#if 'data' in data.itemData}
	{#await data.itemData.data then awaitedData}
		<pre>{JSON.stringify(awaitedData, null, 2)}</pre>
	{/await}
{/if}
