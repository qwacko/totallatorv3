<script lang="ts">
	import { enhance } from '$app/forms';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import { ButtonGroup, type Colors } from 'flowbite-svelte';

	let {
		loading = $bindable(false),
		action,
		currentValue,
		onTitle = 'On',
		offTitle = 'Off',
		color = 'primary'
	}: {
		loading?: boolean;
		action: string;
		currentValue: boolean;
		onTitle?: string;
		offTitle?: string;
		color?: Colors;
	} = $props();
</script>

<form
	method="post"
	{action}
	use:enhance={customEnhance({
		updateLoading: (newLoading) => (loading = newLoading)
	})}
	class="flex self-center"
>
	<ButtonGroup>
		<ActionButton
			{color}
			type="submit"
			message={onTitle}
			{loading}
			outline={currentValue === false}
			disabled={currentValue === true}
		/>
		<ActionButton
			{color}
			type="submit"
			message={offTitle}
			{loading}
			outline={currentValue === true}
			disabled={currentValue === false}
		/>
	</ButtonGroup>
</form>
