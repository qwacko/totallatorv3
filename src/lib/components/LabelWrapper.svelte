<script lang="ts">
	import { Label } from 'flowbite-svelte';
	import ErrorText from './ErrorText.svelte';

	export let errorMessage: string | string[] | null | undefined;
	export let title: string | null;
	export let required: boolean | undefined | null = undefined;
	export let wrapperClass: string | undefined = undefined;
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
	<slot />
	<ErrorText message={errorMessage} />
</Label>
