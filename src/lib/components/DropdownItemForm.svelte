<script lang="ts">
	import { enhance } from '$app/forms';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import { onError, onSuccess } from '$lib/stores/notificationHelpers';
	import { DropdownItem, Spinner } from 'flowbite-svelte';
	import type { ComponentProps, Snippet } from 'svelte';

	type DropdownItemProps = ComponentProps<DropdownItem>;

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
	} & Omit<DropdownItemProps, 'type' | 'submit'> = $props();
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
	<DropdownItem disabled={loading} type="submit" class="flex flex-row gap-2" {...restProps}>
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
	</DropdownItem>
</form>
