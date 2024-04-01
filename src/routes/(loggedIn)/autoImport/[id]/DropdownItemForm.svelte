<script lang="ts">
	import { enhance } from '$app/forms';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import { onError, onSuccess } from '$lib/stores/notificationHelpers';
	import { DropdownItem, Spinner } from 'flowbite-svelte';

	export let loading: boolean;
	export let successMessage: string | undefined = undefined;
	export let errorMessage: string | undefined = undefined;
	export let action: string;
</script>

<form
	method="post"
	{action}
	use:enhance={customEnhance({
		updateLoading: (newLoading) => {
			loading = newLoading;
		},
		onSuccess: () => {
			if (successMessage) onSuccess(successMessage)();
		},
		onError: () => {
			if (errorMessage) onError(errorMessage)();
		},
		onFailure: () => {
			if (errorMessage) onError(errorMessage)();
		}
	})}
>
	<DropdownItem disabled={loading} type="submit" class="flex flex-row gap-2" {...$$restProps}>
		{#if loading}
			<slot name="loading"><Spinner />Loadiing...</slot>
		{:else}
			<slot>Action</slot>
		{/if}
	</DropdownItem>
</form>
