<script lang="ts">
	import { enhance } from '$app/forms';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import ActionButton from '$lib/components/ActionButton.svelte';

	export let loading = false;
</script>

<form
	method="post"
	action="?/clean"
	use:enhance={customEnhance({
		updateLoading: (newLoading) => (loading = newLoading)
	})}
	class="flex self-center"
>
	<ActionButton
		color="green"
		type="submit"
		message="Clean"
		loadingMessage="Cleaning..."
		{loading}
	/>
</form>
