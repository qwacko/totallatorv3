<script lang="ts">
	import { ButtonGroup } from 'flowbite-svelte';

	import { enhance } from '$app/forms';

	import ActionButton from '$lib/components/ActionButton.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import { customEnhance } from '$lib/helpers/customEnhance';

	const getDataEnhance = customEnhance<{ data: Record<string, any>[] }>;

	let data: Record<string, any>[] | undefined = undefined;
	let errors: unknown | undefined = undefined;
	let loading = false;
</script>

<form
	use:enhance={getDataEnhance({
		updateLoading: (newLoading) => {
			loading = newLoading;
			if (newLoading) {
				data = undefined;
				errors = undefined;
			}
		},
		onSuccess: (newData) => {
			if (newData.data?.data) {
				data = newData.data.data;
			}
		},
		onError: (newErrors) => {
			errors = newErrors.error;
		},
		disableDefaultAction: true
	})}
	method="post"
	action="?/getData"
>
	<ButtonGroup>
		{#if data}
			<RawDataModal
				{data}
				dev={true}
				icon="more"
				color="blue"
				outline={false}
				title="Received Data"
			/>
		{/if}
		{#if errors}
			<RawDataModal
				data={errors}
				dev={true}
				icon="more"
				color="red"
				outline={false}
				title="Received Errors"
			/>
		{/if}
		<ActionButton
			type="submit"
			color="light"
			message="Get Data"
			loadingMessage="Getting Data..."
			{loading}
		/>
	</ButtonGroup>
</form>
