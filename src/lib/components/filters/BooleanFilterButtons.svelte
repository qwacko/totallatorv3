<script lang="ts">
	import BooleanButtons from '../BooleanButtons.svelte';

	export let value: boolean | undefined;
	export let onTitle: string = 'True';
	export let offTitle: string = 'False';
	export let clearTitle: string = 'Clear';
	export let title: string | null | undefined = undefined;
	export let name: string | undefined = undefined;
	export let hideClear: boolean = false;
	export let wrapperClass = '';

	const updateValue = (newValue: boolean | undefined) => {
		value = newValue;
	};
</script>

<div class="flex flex-col gap-2 {wrapperClass}">
	{#if name}
		<input type="hidden" {name} bind:value />
	{/if}
	{#if title}
		<div class="flex text-primary-900 font-semibold text-sm">
			{title}
		</div>
	{/if}
	<BooleanButtons {value} {onTitle} {offTitle} {clearTitle} {hideClear} setNew={updateValue} />
</div>
