<script lang="ts">
	import { enhance } from '$app/forms';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import { ButtonGroup, type Colors } from 'flowbite-svelte';

	export let loading = false;
	export let action: string;
	export let currentValue: boolean;
	export let onTitle: string = 'On';
	export let offTitle: string = 'Off';
	export let color: Colors = 'primary';
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
