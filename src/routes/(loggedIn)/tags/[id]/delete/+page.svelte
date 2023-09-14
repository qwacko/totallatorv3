<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { pageInfo, urlGenerator } from '$lib/routes.js';
	import { Button } from 'flowbite-svelte';

	export let data;

	$: pageURLInfo = pageInfo('/(loggedIn)/tags/[id]/delete', $page);

	$: cancelURL = urlGenerator({
		address: '/(loggedIn)/tags/[id]',
		paramsValue: { id: data.tag.id },
		searchParamsValue: { return: pageURLInfo.url.toString() }
	}).url;
</script>

<PageLayout title={data.tag.title} size="sm">
	<form method="POST" class="flex flex-col gap-2" use:enhance>
		<div class="flex">Are you sure you want to delete tag {data.tag.title}?</div>

		<div class="flex flex-row gap-4 pt-4">
			<Button href={cancelURL} class="flex flex-grow" outline>Cancel</Button>
			<Button type="submit" color="red" class="flex flex-grow">Delete</Button>
		</div>
	</form>
</PageLayout>
