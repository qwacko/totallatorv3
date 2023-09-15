<script lang="ts">
	import { Input, Label } from 'flowbite-svelte';
	import ErrorText from './ErrorText.svelte';

	export let errorMessage: string | string[] | null | undefined;
	export let title: string | null;
	export let name: string;
	export let required: boolean | undefined | null = undefined;
	export let value: string | undefined;
	export let wrapperClass: string | undefined = undefined;
</script>

<div class={wrapperClass}>
	<Label class="w-full space-y-2">
		{#if title}
			<span class="flex flex-row gap-1"
				><div>
					{title}
				</div>
				<div>
					{#if required}
						*{/if}
				</div></span
			>
		{/if}
		<Input
			bind:value
			{...$$restProps}
			{name}
			{required}
			class={$$props.class}
			on:blur
			on:keypress
		/>
		<ErrorText message={errorMessage} />
	</Label>
</div>
