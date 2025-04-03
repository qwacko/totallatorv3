<script lang="ts">
	import { enhance } from '$app/forms';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import ActionButton from './ActionButton.svelte';
	import type { ComponentProps, Snippet } from 'svelte';

	type ButtonProps = ComponentProps<typeof ActionButton>;

	const {
		action,
		wrapperClass,
		message,
		loadingMessage,
		children,
		...restProps
	}: {
		action: string;
		wrapperClass?: string;
		message: string;
		loadingMessage?: string;
		children?: Snippet;
	} & Omit<ButtonProps, 'type' | 'loading' | 'message' | 'loadingMessage'> = $props();

	let loading = $state(false);
</script>

<form
	method="post"
	{action}
	use:enhance={customEnhance({
		updateLoading: (newLoading) => (loading = newLoading)
	})}
	class={wrapperClass}
>
	<ActionButton type="submit" {loading} {message} {loadingMessage} {...restProps} />
	{#if children}
		{@render children()}
	{/if}
</form>
