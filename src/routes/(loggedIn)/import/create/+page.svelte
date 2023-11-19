<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { importTypeEnum, importTypeToTitle, type importTypeType } from '$lib/schema/importSchema';
	import { Badge, Button, Checkbox, Fileupload, Select } from 'flowbite-svelte';
	import { z } from 'zod';

	let errorMessage: string | undefined = '';

	export let data;

	let importType: importTypeType = importTypeEnum[0];
</script>

<CustomHeader pageTitle="New Import" />

<PageLayout title="New Import">
	{#if errorMessage && errorMessage.length > 0}
		<Badge>Error : {errorMessage}</Badge>
	{/if}
	<form
		use:enhance={({ formElement, formData, action, cancel }) => {
			return async ({ result }) => {
				// `result` is an `ActionResult` object

				if (result.type === 'redirect') {
					goto(result.location);
				} else if (result.type === 'error') {
					console.log('Result Error : ', result);
					errorMessage = result.error.message;
				} else if (result.type === 'failure') {
					console.log('Result Error : ', result);

					errorMessage = z.object({ message: z.string() }).parse(result.data).message;
				} else if (result.type === 'success') {
					errorMessage = '';
					console.log('Result Success : ', result);
				}
			};
		}}
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
		{#if importType !== 'transaction'}
			<Checkbox name="checkImportedOnly">Check Only Imported Items For Duplicates</Checkbox>
		{/if}
		{#if importType === 'mappedImport'}
			<Select
				name="importMappingId"
				items={data.importMappingDropdown.map((t) => ({ name: t.title, value: t.id }))}
				placeholder="Select Import Mapping..."
				required
			/>
		{/if}
		<Fileupload name="csvFile" accept=".csv" required />
		<Button type="submit">Upload</Button>
	</form>
</PageLayout>
