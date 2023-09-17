<script lang="ts">
	import { Label, Select, Checkbox } from 'flowbite-svelte';
	import ErrorText from './ErrorText.svelte';

	export let errorMessage: string | string[] | null | undefined;
	export let title: string | null;
	export let name: string;
	export let required: boolean | undefined | null = undefined;
	export let value: boolean | undefined;
</script>

<Label class="space-y-2">
	{#if title}
		<span class="flex flex-row gap-1"
			><div>
				{title} - {value}
			</div>
			<div>
				{#if required}
					*{/if}
			</div></span
		>
	{/if}
	<Checkbox checked={value} {...$$restProps} {name} {required} on:change={() => (value = !value)} />
	<ErrorText message={errorMessage} />
</Label>
