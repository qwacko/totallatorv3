<script lang="ts">
	import { enhance } from '$app/forms';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import ActionButton from './ActionButton.svelte';

	export let action: string;
	export let wrapperClass: string | undefined = undefined;

	let loading = false;
</script>

<form method="post" {action} use:enhance={customEnhance({
    updateLoading: (newLoading) => (loading = newLoading)
})} class={wrapperClass}>
	<ActionButton type="submit" {loading} {...$$restProps} />
	<slot />
</form>
