<script lang="ts">
	import CombinedTitleDisplay from '$lib/components/CombinedTitleDisplay.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { statusEnumSelectionWithoutDeleted } from '$lib/schema/statusSchema.js';
	import type { CreateCategorySchemaSuperType } from '$lib/schema/categorySchema.js';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import { page } from '$app/stores';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import { pageInfo } from '$lib/routes';
	import type { CreateReportSupertype } from '$lib/schema/reportSchema.js';
	import ReportLayoutOptionDisplay from './ReportLayoutOptionDisplay.svelte';

	export let data;

	const { form, errors, constraints, message, enhance } = superForm<CreateReportSupertype>(
		data.form
	);

	$: urlInfo = pageInfo('/(loggedIn)/reports/create', $page);
</script>

<CustomHeader pageTitle="New Report" />

<PageLayout title="Create Report" size="sm">
	<form method="POST" use:enhance class="flex flex-col gap-2">
		<PreviousUrlInput name="prevPage" />
		<input type="hidden" name="currentPage" value={urlInfo.current.url} />
		<TextInput
			title="Title"
			errorMessage={$errors.title}
			name="title"
			bind:value={$form.title}
			{...$constraints.title}
		/>
		<TextInput
			title="Group"
			errorMessage={$errors.group}
			name="group"
			bind:value={$form.group}
			{...$constraints.group}
		/>
		<ReportLayoutOptionDisplay format="default" />
		<ReportLayoutOptionDisplay format="sixEven" />
		<Button type="submit">Create</Button>
		<ErrorText message={$message} />
	</form>
</PageLayout>
