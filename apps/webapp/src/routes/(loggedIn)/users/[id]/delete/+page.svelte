<script lang="ts">
	import { Button } from 'flowbite-svelte';

	import { enhance } from '$app/forms';
	import { page } from '$app/state';

	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { urlGenerator } from '$lib/routes';

	const { data } = $props();

	const userId = $derived(page.params.id);
</script>

<CustomHeader pageTitle="Delete User" filterText={page.params.id} />
<PageLayout title="Delete User - {data.currentUser.name}?">
	<div class="flex">Are you sure you want to delete this user?</div>
	<form method="POST" use:enhance>
		<div class="flex flex-row gap-2">
			<div class="flex grow"></div>
			<Button type="submit" color="red">Delete User</Button>
			<div class="flex grow"></div>
			{#if userId}
				<Button
					href={urlGenerator({
						address: '/(loggedIn)/users/[id]',
						paramsValue: { id: userId }
					}).url}
					outline
				>
					Cancel
				</Button>
			{/if}
			<div class="flex grow"></div>
		</div>
	</form>
</PageLayout>
