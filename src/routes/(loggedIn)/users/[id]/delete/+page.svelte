<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { Button } from 'flowbite-svelte';
	import { urlGenerator } from '$lib/routes';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';

	export let data;
</script>

<CustomHeader pageTitle="Delete User" filterText={$page.params.id} />
<PageLayout title="Delete User - {data.currentUser.name}?">
	<div class="flex">Are you sure you want to delete this user?</div>
	<form method="POST" use:enhance>
		<div class="flex flex-row gap-2">
			<div class="flex flex-grow"></div>
			<Button type="submit" color="red">Delete User</Button>
			<div class="flex flex-grow"></div>
			<Button
				href={urlGenerator({
					address: '/(loggedIn)/users/[id]',
					paramsValue: { id: $page.params.id }
				}).url}
				outline
			>
				Cancel
			</Button>
			<div class="flex flex-grow"></div>
		</div>
	</form>
</PageLayout>
