<script lang="ts">
	import ArrowDownIcon from '$lib/components/icons/ArrowDownIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import DownloadIcon from '$lib/components/icons/DownloadIcon.svelte';
	import ImportIcon from '$lib/components/icons/ImportIcon.svelte';
	import { urlGenerator } from '$lib/routes';
	import { Button, Dropdown, DropdownDivider, DropdownItem, Spinner } from 'flowbite-svelte';
	import DropdownItemForm from '$lib/components/DropdownItemForm.svelte';

	export let importMappingId: string;
	export let autoImportId: string;
	export let filename: string;
	export let loading = false;
</script>

<Button color="light" size="sm" class="flex flex-row gap-2">
	{#if loading}<Spinner size="6" />{/if}Actions<ArrowDownIcon />
</Button>
<Dropdown>
	<DropdownItem
		href={urlGenerator({
			address: '/(loggedIn)/autoImport/[id]/[filename]',
			paramsValue: { id: autoImportId, filename }
		}).url}
		class="flex flex-row gap-2"
	>
		<DownloadIcon />Download Data
	</DropdownItem>
	<DropdownItem
		href={urlGenerator({
			address: '/(loggedIn)/importMapping/[id]',
			paramsValue: { id: importMappingId }
		}).url}
		class="flex flex-row gap-2"
	>
		<ImportIcon />Go To Import Mapping
	</DropdownItem>
	<DropdownItemForm
		bind:loading
		action="?/updateSampleData"
		successMessage="Successfully Updated Sample Data"
		errorMessage="Failed to Update Sample Data"
	>
		<ImportIcon /> Update Sample Data
		<svelte:fragment slot="loading"><Spinner />Updating...</svelte:fragment>
	</DropdownItemForm>
	<DropdownItemForm action="?/trigger" bind:loading class="flex flex-row gap-2">
		<ImportIcon /> Trigger Import
	</DropdownItemForm>
	<DropdownItem
		href={urlGenerator({
			address: '/(loggedIn)/import',
			searchParamsValue: { pageSize: 10, autoImportId }
		}).url}
		class="flex flex-row gap-2"
	>
		<ImportIcon />List Imports
	</DropdownItem>
	<DropdownDivider />
	<DropdownItem
		color="red"
		href={urlGenerator({
			address: '/(loggedIn)/autoImport/[id]/delete',
			paramsValue: { id: autoImportId }
		}).url}
		class="flex flex-row gap-2"
	>
		<DeleteIcon color="red" />Delete
	</DropdownItem>
</Dropdown>
