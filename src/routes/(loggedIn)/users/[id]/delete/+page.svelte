<script lang="ts">
	import { enhance } from '$app/forms';
	import SpreadButtons from '$lib/components/SpreadButtons.svelte';
	import { page } from '$app/stores';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import { Button } from 'flowbite-svelte';
</script>

<h1>Delete User?</h1>
<form method="POST" use:enhance>
	<div>
		<SpreadButtons>
			<Button type="submit">Delete User</Button>
			<LinkButton href="/users/{$page.params.id}" style="secondary">Cancel</LinkButton>
		</SpreadButtons>
	</div>
</form>

<style>
	div {
		padding: 10px;
	}
</style>
