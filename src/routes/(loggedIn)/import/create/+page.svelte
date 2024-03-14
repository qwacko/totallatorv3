<script lang="ts">
	import { enhance } from '$app/forms';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { importTypeEnum, importTypeToTitle, type importTypeType } from '$lib/schema/importSchema';
	import { Badge, Checkbox, Fileupload, Select } from 'flowbite-svelte';
	import { z } from 'zod';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import { onError, onSuccess } from '$lib/stores/notificationHelpers.js';
	import ActionButton from '$lib/components/ActionButton.svelte';

	let errorMessage: string | undefined = '';

	export let data;

	let importType: importTypeType = 'mappedImport';
	let importing = false;
	let redirecting = false;

	//@ts-ignore This gives a weird typescript error in svelte check, but not in the editor.
	$: isMappedImport = importType === 'mappedImport';
</script>

<CustomHeader pageTitle="New Import" />

<PageLayout title="New Import">
	{#if errorMessage && errorMessage.length > 0}
		<Badge>Error : {errorMessage}</Badge>
	{/if}
	<form
		use:enhance={customEnhance({
			updateLoading: (loading) => {
				importing = loading;
			},
			onSuccess: () => {
				errorMessage = '';
				onSuccess('Imported Successfully. Redirecting To Import Detail');
			},
			onFailure: ({ data }) => {
				errorMessage = z.object({ message: z.string() }).parse(data).message;
			},
			onError: ({ error }) => {
				errorMessage = error.message;
				onError('Import Failed');
			},
			onRedirect: () => {
				errorMessage = '';
				onSuccess('Imported Successfully. Redirecting To Import Detail');
				redirecting = true;
			}
		})}
		action="?/create"
		method="post"
		enctype="multipart/form-data"
		class="flex flex-col gap-2"
	>
		<input class="flex" name="test" type="hidden" value="test" />
		<Select
			name="importType"
			items={importTypeEnum.map((t) => ({ name: importTypeToTitle(t, true), value: t }))}
			placeholder="Select Import Type..."
			required
			bind:value={importType}
		/>
		{#if isMappedImport}
			<Select
				name="importMappingId"
				items={data.importMappingDropdown.map((t) => ({ name: t.title, value: t.id }))}
				placeholder="Select Import Mapping..."
				required
			/>
		{/if}
		{#if importType !== 'transaction'}
			<Checkbox name="checkImportedOnly">Check Only Imported Items For Duplicates</Checkbox>
		{/if}
		<Fileupload name="csvFile" accept=".csv" required />
		<ActionButton
			type="submit"
			loading={importing || redirecting}
			text="Upload"
			message="Upload"
			loadingMessage={importing ? 'Uploading...' : 'Redirecting...'}
		/>
	</form>
</PageLayout>
