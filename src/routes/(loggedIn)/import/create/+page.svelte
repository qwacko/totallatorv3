<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { Badge, Button, Fileupload } from 'flowbite-svelte';
	import { z } from 'zod';

	let errorMessage: string | undefined = '';
</script>

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
	>
		<input name="test" type="hidden" value="test" />
		<Fileupload name="csvFile" accept=".csv" />
		<Button type="submit">Upload</Button>
	</form>
</PageLayout>
