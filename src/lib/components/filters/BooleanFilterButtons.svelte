<script lang="ts">
	import BooleanButtons from '../BooleanButtons.svelte';

	let {
		value = $bindable(),
		onTitle = 'True',
		offTitle = 'False',
		clearTitle = 'Clear',
		title,
		name,
		hideClear = false,
		wrapperClass = '',
		disabled = false
	}: {
		value: boolean | undefined;
		onTitle?: string;
		offTitle?: string;
		clearTitle?: string;
		title?: string | null | undefined;
		name?: string | undefined;
		hideClear?: boolean;
		wrapperClass?: string;
		disabled?: boolean;
	} = $props();

	const updateValue = (newValue: boolean | undefined) => {
		value = newValue;
	};
</script>

<div class="flex flex-col gap-2 {wrapperClass}">
	{#if name}
		<input type="hidden" {name} bind:value />
	{/if}
	{#if title}
		<div class="text-primary-900 flex text-sm font-semibold">
			{title}
		</div>
	{/if}
	<BooleanButtons
		{value}
		{onTitle}
		{offTitle}
		{clearTitle}
		{hideClear}
		setNew={updateValue}
		{disabled}
	/>
</div>
