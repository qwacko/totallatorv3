<script lang="ts">
	import { Spinner } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';

	import { enhance } from '$app/forms';

	import { customEnhance } from '$lib/helpers/customEnhance';
	import { onError, onSuccess } from '$lib/stores/notificationHelpers';

	import DropdownItemWithDisabling from './DropdownItemWithDisabling.svelte';

	let {
		loading = $bindable(),
		successMessage,
		errorMessage,
		action,
		children,
		slotLoading,
		...restProps
	}: {
		loading: boolean;
		successMessage?: string;
		errorMessage?: string;
		action: string;
		children?: Snippet;
		slotLoading?: Snippet;
		class?: string;
	} = $props();

	let formItem = $state<HTMLFormElement>();

	const clickHandler: () => void = () => {
		if (formItem) {
			formItem.requestSubmit();
		}
	};
</script>

<form
	bind:this={formItem}
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
	<DropdownItemWithDisabling
		{...restProps}
		disabled={loading}
		class="flex flex-row gap-2"
		onclick={clickHandler}
	>
		{#if loading}
			{#if slotLoading}
				{@render slotLoading()}
			{:else}
				<Spinner />Loading...
			{/if}
		{:else if children}
			{@render children()}
		{:else}
			Action
		{/if}
	</DropdownItemWithDisabling>
</form>
