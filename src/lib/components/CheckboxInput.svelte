<script lang="ts">
	import { Label, Checkbox } from 'flowbite-svelte';
	import ErrorText from './ErrorText.svelte';

	export let errorMessage: string | string[] | null | undefined;
	export let title: string | null | undefined = undefined;
	export let displayText: string | null | undefined = undefined;
	export let name: string;
	export let required: boolean | undefined | null = undefined;
	export let value: boolean | undefined;
</script>

<Label class="space-y-2">
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
	<Checkbox checked={value} {...$$restProps} {name} {required} on:change={() => (value = !value)}>
		{displayText ? displayText : ''}
	</Checkbox>
	<ErrorText message={errorMessage} />
</Label>
