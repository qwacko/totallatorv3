<script lang="ts">
	import { Input, Label } from 'flowbite-svelte';
	import ErrorText from './ErrorText.svelte';

	export let errorMessage: string | string[] | null | undefined;
	export let title: string | null;
	export let name: string;
	export let required: boolean | undefined | null = undefined;
	export let value: string | undefined | null;
	export let wrapperClass: string | undefined = undefined;
	export let tainted: boolean | undefined = undefined;
	export let highlightTainted: boolean | undefined = undefined;
</script>

<div class="flex flex-col gap-2 {wrapperClass}">
	{#if title}
		<Label for={name} class="w-full space-y-2">
			<span class="flex flex-row gap-1">
				<div>
					{title}
				</div>
				<div>
					{#if required}*{/if}
				</div>
			</span>
		</Label>
	{/if}
	<Input
		bind:value
		{...$$restProps}
		{name}
		{required}
		class="{$$props.class} {highlightTainted && tainted ? 'ring-2' : ''} "
		on:blur
		on:keypress
	/>
	<ErrorText message={errorMessage} />
</div>
