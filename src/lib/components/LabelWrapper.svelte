<script lang="ts">
	import { Label } from 'flowbite-svelte';
	import ErrorText from './ErrorText.svelte';
	import type { Snippet } from 'svelte';

	const {
		errorMessage,
		title,
		required,
		wrapperClass,
		children
	}: {
		errorMessage?: string | string[] | null;
		title: string | null;
		required?: boolean | null;
		wrapperClass?: string;
		children?: Snippet;
	} = $props();
</script>

<Label class="space-y-2 {wrapperClass}">
	{#if title}
		<span class="flex flex-row gap-1">
			<div>
				{title}
			</div>
			<div>
				{#if required}
					*{/if}
			</div>
		</span>
	{/if}
	{#if children}
		{@render children()}
	{/if}
	<ErrorText message={errorMessage} />
</Label>
